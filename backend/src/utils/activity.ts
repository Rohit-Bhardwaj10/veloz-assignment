import { prisma } from '../prisma';
import { io } from '../index';

export const logActivity = async (
  projectId: string,
  userId: string,
  action: string,
  taskId?: string,
  previousValue?: string,
  newValue?: string
) => {
  const log = await prisma.activityLog.create({
    data: {
      projectId,
      userId,
      taskId: taskId || null,
      action,
      previousValue: previousValue || null,
      newValue: newValue || null,
    },
    include: {
      user: { select: { name: true, id: true } },
      task: { select: { title: true, id: true } },
      project: { select: { name: true } },
    },
  });

  // Emit to the project room
  io.to(`project_${projectId}`).emit('activity', log);
  // Also emit to the global admin room
  io.to('admin_feed').emit('activity', log);

  return log;
};

export const createNotification = async (userId: string, message: string) => {
  const notif = await prisma.notification.create({
    data: { userId, message },
  });
  io.to(`user_${userId}`).emit('notification', notif);
  return notif;
};
