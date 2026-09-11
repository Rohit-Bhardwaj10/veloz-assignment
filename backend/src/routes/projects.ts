import { Router } from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/projectController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);
router.get('/', getProjects);
router.post('/', requireRole(['ADMIN', 'PM']), createProject);
router.delete('/:id', requireRole(['ADMIN', 'PM']), deleteProject);
export default router;
