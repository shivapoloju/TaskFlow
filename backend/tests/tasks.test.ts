import request from 'supertest';
import app from '../src/app';
import { initDb, query } from '../src/services/dbService';

describe('Tasks & Comments Workflow Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let memberUserId: number;
  let teamId: number;
  let projectId: number;
  let createdTaskId: number;
  let createdCommentId: number;

  beforeAll(async () => {
    await initDb();
    await query('DELETE FROM comments');
    await query('DELETE FROM tasks');
    await query('DELETE FROM projects');
    await query('DELETE FROM team_members');
    await query('DELETE FROM teams');
    await query('DELETE FROM refresh_tokens');
    await query('DELETE FROM users');

    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Task Admin',
      email: 'taskadmin@taskflow.dev',
      password: 'password123',
      role: 'Admin'
    });
    adminToken = adminRes.body.data.accessToken;

    const memberRes = await request(app).post('/api/auth/register').send({
      name: 'Task Member',
      email: 'taskmember@taskflow.dev',
      password: 'password123',
      role: 'Member'
    });
    memberToken = memberRes.body.data.accessToken;
    memberUserId = memberRes.body.data.user.id;

    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Task Squad' });
    teamId = teamRes.body.data.team.id;

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Task Project Engine', teamId });
    projectId = projRes.body.data.project.id;
  });

  test('24. POST /api/tasks should create a task (Admin/Manager)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Build PostgreSQL Pagination Engine',
        description: 'Implement server-side offset pagination with fast indexes.',
        status: 'In Progress',
        priority: 'High',
        projectId,
        assigneeId: memberUserId,
        dueDate: '2026-10-15',
        estimatedHours: 8
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.task).toHaveProperty('id');
    expect(res.body.data.task.title).toBe('Build PostgreSQL Pagination Engine');
    createdTaskId = res.body.data.task.id;
  });

  test('25. GET /api/tasks should return paginated list with performance timing metadata', async () => {
    const res = await request(app)
      .get(`/api/tasks?page=1&limit=10&projectId=${projectId}&status=In Progress`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data).toHaveProperty('pagination');
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data).toHaveProperty('performance');
    expect(res.body.data.performance).toHaveProperty('executionTimeMs');
  });

  test('26. GET /api/tasks should filter tasks by search query', async () => {
    const res = await request(app)
      .get('/api/tasks?search=PostgreSQL')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.tasks.length).toBe(1);
  });

  test('27. GET /api/tasks/:id should return single task details with project & assignee details', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.task.id).toBe(createdTaskId);
    expect(res.body.data.task.assignee_name).toBe('Task Member');
  });

  test('28. PATCH /api/tasks/:id should update task status & priority', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'Completed',
        priority: 'High'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.task.status).toBe('Completed');
  });

  test('29. POST /api/tasks/:taskId/comments should add a comment to task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${createdTaskId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        content: 'PostgreSQL index optimizations cut list-query latency significantly.'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.comment.content).toContain('PostgreSQL index optimizations');
    expect(res.body.data.comment.user_name).toBe('Task Member');
    createdCommentId = res.body.data.comment.id;
  });

  test('30. GET /api/tasks/:taskId/comments should list task comments chronologically', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.comments)).toBe(true);
    expect(res.body.data.comments.length).toBe(1);
  });

  test('31. DELETE /api/comments/:id should remove comment', async () => {
    const res = await request(app)
      .delete(`/api/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('32. DELETE /api/tasks/:id should allow Admin to delete task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
