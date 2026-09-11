import { Router } from 'express';
import { getStats } from '../controllers/statsController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);
router.get('/', getStats);
export default router;
