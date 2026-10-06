import { Router } from 'express';
import { getTasks, createTask, getTaskById, updateTask, deleteTask } from '../controllers/taskController';
import { getCommentsByTask, createComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/rbacMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createTaskSchema, updateTaskSchema, createCommentSchema } from '../utils/validators';

const router = Router();

router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', requireRole(['Admin', 'Manager']), validateRequest(createTaskSchema), createTask);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask); // Members can update status/priority of tasks assigned to them
router.delete('/:id', requireRole(['Admin', 'Manager']), deleteTask);

// Comments sub-resource
router.get('/:taskId/comments', getCommentsByTask);
router.post('/:taskId/comments', validateRequest(createCommentSchema), createComment);

export default router;
