import { Router } from 'express';
import { getTeams, createTeam, getTeamById, addTeamMember, removeTeamMember, deleteTeam } from '../controllers/teamController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/rbacMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createTeamSchema, addTeamMemberSchema } from '../utils/validators';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeams);
router.post('/', requireRole(['Admin', 'Manager']), validateRequest(createTeamSchema), createTeam);
router.get('/:id', getTeamById);
router.post('/:id/members', requireRole(['Admin', 'Manager']), validateRequest(addTeamMemberSchema), addTeamMember);
router.delete('/:id/members/:userId', requireRole(['Admin', 'Manager']), removeTeamMember);
router.delete('/:id', requireRole(['Admin']), deleteTeam);

export default router;
