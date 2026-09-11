import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    let whereClause: any = {};

    if (user.role === 'ADMIN') {
      // Admin sees everything — no filter needed
      whereClause = {};
    } else if (user.role === 'PM') {
      const pmProjects = await prisma.project.findMany({
        where: { pmId: user.id },
        select: { id: true },
      });
      whereClause = { projectId: { in: pmProjects.map((p) => p.id) } };
    } else {
      // DEV: only activity on tasks assigned to them
      const devTasks = await prisma.task.findMany({
        where: { developerId: user.id },
        select: { id: true },
      });
      whereClause = { taskId: { in: devTasks.map((t) => t.id) } };
    }

    if (req.query.projectId) {
      whereClause.projectId = req.query.projectId as string;
    }

    const activity = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, id: true } },
        task: { select: { title: true, id: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};
