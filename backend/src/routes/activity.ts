import { Router } from 'express';
import { getActivity } from '../controllers/activityController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);
router.get('/', getActivity);
export default router;
