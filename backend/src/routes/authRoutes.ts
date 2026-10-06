import { Router } from 'express';
import { register, login, refresh, logout, getMe, getUsers } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshTokenSchema), refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getUsers);

export default router;
