import { Router } from 'express';
import { deleteComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.delete('/:id', deleteComment);

export default router;
