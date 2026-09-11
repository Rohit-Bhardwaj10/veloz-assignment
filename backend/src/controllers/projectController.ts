import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { logActivity } from '../utils/activity';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().uuid('Invalid client ID'),
  pmId: z.string().uuid('Invalid PM ID').optional(),
});

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    let where: any = {};
    if (user.role === 'PM') {
      where = { pmId: user.id };
    } else if (user.role === 'DEV') {
      where = { tasks: { some: { developerId: user.id } } };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const data = projectSchema.parse(req.body);
    // PM always becomes their own PM; Admin can specify pmId
    const pmId = user.role === 'ADMIN' ? (data.pmId || user.id) : user.id;

    const project = await prisma.project.create({
      data: { name: data.name, clientId: data.clientId, pmId },
      include: { client: true, manager: { select: { id: true, name: true, email: true } } },
    });

    await logActivity(project.id, user.id, 'CREATED_PROJECT', undefined, undefined, project.name);
    res.status(201).json(project);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: (error as z.ZodError).issues });
    } else {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    if (user.role === 'PM' && project.pmId !== user.id) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
