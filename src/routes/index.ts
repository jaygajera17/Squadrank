import { Router } from 'express';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/auth', authRoutes);

export default router;
