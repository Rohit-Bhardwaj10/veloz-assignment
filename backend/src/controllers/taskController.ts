import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logActivity, createNotification } from '../utils/activity';

const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  projectId: z.string().uuid(),
  developerId: z.string().uuid().optional(),
});

const taskUpdateSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'OVERDUE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  developerId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    let where: any = {};
    if (user.role === 'PM') {
      where.project = { pmId: user.id };
    } else if (user.role === 'DEV') {
      where.developerId = user.id;
    }

    if (req.query.projectId) where.projectId = String(req.query.projectId);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.priority) where.priority = String(req.query.priority);
    if (req.query.dueBefore) where.dueDate = { ...where.dueDate, lte: new Date(String(req.query.dueBefore)) };
    if (req.query.dueAfter) where.dueDate = { ...where.dueDate, gte: new Date(String(req.query.dueAfter)) };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const data = taskCreateSchema.parse(req.body);

    // PM ownership check
    if (user.role === 'PM') {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project || project.pmId !== user.id) {
        res.status(403).json({ error: 'Forbidden: You do not manage this project' });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        dueDate: new Date(data.dueDate),
        projectId: data.projectId,
        developerId: data.developerId || null,
      },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity(task.projectId, user.id, 'CREATED_TASK', task.id, undefined, task.title);

    if (task.developerId) {
      await createNotification(task.developerId, `You have been assigned to task: "${task.title}"`);
    }

    res.status(201).json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).issues });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const { id } = req.params;
    const data = taskUpdateSchema.parse(req.body);

    const taskId = String(id);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { pmId: true, id: true } } },
    });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    const taskProject = (task as any).project;

    // Auth checks
    if (user.role === 'PM' && taskProject.pmId !== user.id) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    if (user.role === 'DEV' && task.developerId !== user.id) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }

    // DEV can only change status
    const updateData: any = user.role === 'DEV'
      ? { status: data.status }
      : { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined };

    // Remove undefined keys
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    // Log status change
    if (data.status && data.status !== task.status) {
      await logActivity(task.projectId, user.id, 'STATUS_CHANGED', task.id, task.status, data.status);
      if (user.role === 'DEV' && data.status === 'IN_REVIEW') {
        await createNotification(taskProject.pmId, `Task "${task.title}" is ready for review.`);
      }
    }

    // Log reassignment
    if (data.developerId !== undefined && data.developerId !== task.developerId) {
      const oldDev = task.developerId || 'Unassigned';
      const newDev = data.developerId || 'Unassigned';
      await logActivity(task.projectId, user.id, 'REASSIGNED', task.id, oldDev, newDev);
      if (data.developerId) {
        await createNotification(data.developerId, `You have been assigned to task: "${task.title}"`);
      }
      if (task.developerId && task.developerId !== data.developerId) {
        await createNotification(task.developerId, `You have been unassigned from task: "${task.title}"`);
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).issues });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
};
