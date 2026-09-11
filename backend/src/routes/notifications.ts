import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/:id', markAsRead);  // PATCH /notifications/all  OR /notifications/:id
export default router;
