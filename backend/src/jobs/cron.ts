  import cron from 'node-cron';
import { prisma } from '../prisma';
import { logActivity, createNotification } from '../utils/activity';

export const startCronJobs = () => {
  // Run every hour to check for overdue tasks
  cron.schedule('0 * * * *', async () => {
    console.log('Running overdue tasks check...');
    try {
      const now = new Date();
      
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'OVERDUE'] }
        },
        include: { project: true }
      });

      for (const task of overdueTasks) {
        // Mark as overdue
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'OVERDUE' }
        });

        // Log activity
        await logActivity(task.projectId, task.project.pmId, 'STATUS_CHANGED', task.id, task.status, 'OVERDUE');

        // Notify Developer
        if (task.developerId) {
          await createNotification(task.developerId, `Task "${task.title}" is now OVERDUE.`);
        }
        
        // Notify PM
        await createNotification(task.project.pmId, `Task "${task.title}" is now OVERDUE.`);
      }
      
      if (overdueTasks.length > 0) {
        console.log(`Marked ${overdueTasks.length} tasks as overdue.`);
      }
    } catch (error) {
      console.error('Error running overdue tasks cron job:', error);
    }
  });
};
