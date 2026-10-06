import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Manager', 'Member').default('Member'),
  avatar_url: Joi.string().uri().optional().allow('', null)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null).optional()
});

export const addTeamMemberSchema = Joi.object({
  userId: Joi.number().integer().required(),
  role: Joi.string().valid('Manager', 'Member').default('Member')
});

export const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null).optional(),
  teamId: Joi.number().integer().required(),
  status: Joi.string().valid('Planning', 'In Progress', 'Completed', 'On Hold').default('Planning')
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().allow('', null).optional(),
  teamId: Joi.number().integer().optional(),
  status: Joi.string().valid('Planning', 'In Progress', 'Completed', 'On Hold').optional()
});

export const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('To Do', 'In Progress', 'In Review', 'Completed').default('To Do'),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  projectId: Joi.number().integer().required(),
  assigneeId: Joi.number().integer().allow(null).optional(),
  dueDate: Joi.string().allow('', null).optional(),
  estimatedHours: Joi.number().min(0).optional()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('To Do', 'In Progress', 'In Review', 'Completed').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  projectId: Joi.number().integer().optional(),
  assigneeId: Joi.number().integer().allow(null).optional(),
  dueDate: Joi.string().allow('', null).optional(),
  estimatedHours: Joi.number().min(0).optional()
});

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).required()
});
