import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow REST API',
      version: '1.0.0',
      description: 'Production-ready REST API for TaskFlow Team Project & Task Management Platform with JWT Auth, RBAC, PostgreSQL support, and pagination.',
      contact: {
        name: 'TaskFlow Engineering Team',
        email: 'dev@taskflow.local'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server'
      },
      {
        url: 'https://taskflow-api.onrender.com/api',
        description: 'Render Staging/Production Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Access Token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['Admin', 'Manager', 'Member'] },
            avatar_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            team_id: { type: 'integer' },
            status: { type: 'string', enum: ['Planning', 'In Progress', 'Completed', 'On Hold'] },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['To Do', 'In Progress', 'In Review', 'Completed'] },
            priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
            project_id: { type: 'integer' },
            assignee_id: { type: 'integer', nullable: true },
            reporter_id: { type: 'integer', nullable: true },
            due_date: { type: 'string' },
            estimated_hours: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            task_id: { type: 'integer' },
            user_id: { type: 'integer' },
            content: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Alex Developer' },
                    email: { type: 'string', example: 'alex@taskflow.dev' },
                    password: { type: 'string', example: 'securePass123' },
                    role: { type: 'string', enum: ['Admin', 'Manager', 'Member'], default: 'Member' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully' },
            409: { description: 'User with email already exists' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@taskflow.dev' },
                    password: { type: 'string', example: 'admin123' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful with JWT access & refresh tokens' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token using refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Tokens refreshed' },
            401: { description: 'Invalid or expired refresh token' }
          }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Current user profile data' } }
        }
      },
      '/teams': {
        get: {
          tags: ['Teams'],
          summary: 'Get list of teams',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Array of teams' } }
        },
        post: {
          tags: ['Teams'],
          summary: 'Create a new team (Admin / Manager)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Frontend Engineering' },
                    description: { type: 'string', example: 'UI/UX & Web development team' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Team created' } }
        }
      },
      '/teams/{id}/members': {
        post: {
          tags: ['Teams'],
          summary: 'Add user to team',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: { type: 'integer' },
                    role: { type: 'string', enum: ['Manager', 'Member'] }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Member added' } }
        }
      },
      '/projects': {
        get: {
          tags: ['Projects'],
          summary: 'Get list of projects',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'teamId', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Array of projects' } }
        },
        post: {
          tags: ['Projects'],
          summary: 'Create new project',
          security: [{ BearerAuth: [] }],
          responses: { 201: { description: 'Project created' } }
        }
      },
      '/projects/{id}': {
        get: {
          tags: ['Projects'],
          summary: 'Get project details with task stats',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Project details and task metrics' } }
        },
        patch: {
          tags: ['Projects'],
          summary: 'Update project details',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Project updated' } }
        },
        delete: {
          tags: ['Projects'],
          summary: 'Delete project',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Project deleted' } }
        }
      },
      '/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'Get paginated tasks list with server-side filters & JOIN queries',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'projectId', in: 'query', schema: { type: 'integer' } },
            { name: 'assigneeId', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Paginated tasks with performance executionTimeMs' } }
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a new task',
          security: [{ BearerAuth: [] }],
          responses: { 201: { description: 'Task created' } }
        }
      },
      '/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Get task details',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Task details' } }
        },
        patch: {
          tags: ['Tasks'],
          summary: 'Update task',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Task updated' } }
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete task',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Task deleted' } }
        }
      },
      '/tasks/{taskId}/comments': {
        get: {
          tags: ['Comments'],
          summary: 'Get comments for task',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Comments list' } }
        },
        post: {
          tags: ['Comments'],
          summary: 'Add comment to task',
          security: [{ BearerAuth: [] }],
          responses: { 201: { description: 'Comment created' } }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
