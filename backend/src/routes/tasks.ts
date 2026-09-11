import { Router } from 'express';
import { getTasks, createTask, updateTask } from '../controllers/taskController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getTasks);
router.post('/', requireRole(['ADMIN', 'PM']), createTask);
router.patch('/:id', updateTask);

export default router;
