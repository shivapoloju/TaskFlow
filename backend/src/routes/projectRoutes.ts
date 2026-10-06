import { Router } from 'express';
import { getProjects, createProject, getProjectById, updateProject, deleteProject } from '../controllers/projectController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/rbacMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createProjectSchema, updateProjectSchema } from '../utils/validators';

const router = Router();

router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', requireRole(['Admin', 'Manager']), validateRequest(createProjectSchema), createProject);
router.get('/:id', getProjectById);
router.patch('/:id', requireRole(['Admin', 'Manager']), validateRequest(updateProjectSchema), updateProject);
router.delete('/:id', requireRole(['Admin']), deleteProject);

export default router;
