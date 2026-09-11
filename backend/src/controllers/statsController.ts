import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { onlineUsers } from '../index';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    if (user.role === 'ADMIN') {
      const [totalProjects, tasksByStatus, overdueCount, totalClients] = await Promise.all([
        prisma.project.count(),
        prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.task.count({ where: { status: 'OVERDUE' } }),
        prisma.client.count(),
      ]);

      res.json({
        totalProjects,
        totalClients,
        overdueCount,
        onlineCount: onlineUsers.size,
        tasksByStatus: tasksByStatus.map((t) => ({ status: t.status, count: t._count.status })),
      });
    } else if (user.role === 'PM') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const pmProjects = await prisma.project.findMany({
        where: { pmId: user.id },
        select: { id: true },
      });
      const projectIds = pmProjects.map((p) => p.id);

      const [totalProjects, tasksByPriority, dueSoon, overdueCount] = await Promise.all([
        Promise.resolve(projectIds.length),
        prisma.task.groupBy({
          by: ['priority'],
          where: { projectId: { in: projectIds } },
          _count: { priority: true },
        }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            dueDate: { gte: now, lte: weekFromNow },
            status: { notIn: ['DONE', 'OVERDUE'] },
          },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: 'OVERDUE' },
        }),
      ]);

      res.json({
        totalProjects,
        tasksByPriority: tasksByPriority.map((t) => ({ priority: t.priority, count: t._count.priority })),
        dueSoon,
        overdueCount,
      });
    } else {
      // DEV
      const [totalTasks, tasksByStatus, overdueCount] = await Promise.all([
        prisma.task.count({ where: { developerId: user.id } }),
        prisma.task.groupBy({
          by: ['status'],
          where: { developerId: user.id },
          _count: { status: true },
        }),
        prisma.task.count({ where: { developerId: user.id, status: 'OVERDUE' } }),
      ]);

      res.json({
        totalTasks,
        overdueCount,
        tasksByStatus: tasksByStatus.map((t) => ({ status: t.status, count: t._count.status })),
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
