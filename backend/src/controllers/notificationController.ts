import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { id } = req.params;
  const notifId = String(id);
  try {
    if (notifId === 'all') {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else {
      // individual — verify ownership
      await prisma.notification.updateMany({
        where: { id: notifId, userId: user.id },
        data: { isRead: true },
      });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
