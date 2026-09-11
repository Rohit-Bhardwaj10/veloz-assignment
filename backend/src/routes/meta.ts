import { Router } from 'express';
import { getUsers, getClients, createClient } from '../controllers/metaController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.get('/users', getUsers);
router.get('/clients', getClients);
router.post('/clients', requireRole(['ADMIN', 'PM']), createClient);

export default router;
