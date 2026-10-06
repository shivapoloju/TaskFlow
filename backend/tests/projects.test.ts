import request from 'supertest';
import app from '../src/app';
import { initDb, query } from '../src/services/dbService';

describe('Projects API Workflow Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let teamId: number;
  let createdProjectId: number;

  beforeAll(async () => {
    await initDb();
    await query('DELETE FROM comments');
    await query('DELETE FROM tasks');
    await query('DELETE FROM projects');
    await query('DELETE FROM team_members');
    await query('DELETE FROM teams');
    await query('DELETE FROM refresh_tokens');
    await query('DELETE FROM users');

    // Setup Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Project Admin',
      email: 'projadmin@taskflow.dev',
      password: 'password123',
      role: 'Admin'
    });
    adminToken = adminRes.body.data.accessToken;

    // Setup Manager
    const managerRes = await request(app).post('/api/auth/register').send({
      name: 'Project Manager',
      email: 'projmanager@taskflow.dev',
      password: 'password123',
      role: 'Manager'
    });
    managerToken = managerRes.body.data.accessToken;

    // Create a team
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Project Test Team' });
    teamId = teamRes.body.data.team.id;
  });

  test('19. POST /api/projects should allow Manager to create project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'TaskFlow Modern Frontend',
        description: 'Vite + React UI dashboard.',
        teamId: teamId,
        status: 'In Progress'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.project).toHaveProperty('id');
    expect(res.body.data.project.name).toBe('TaskFlow Modern Frontend');
    createdProjectId = res.body.data.project.id;
  });

  test('20. GET /api/projects should filter projects by teamId and status', async () => {
    const res = await request(app)
      .get(`/api/projects?teamId=${teamId}&status=In Progress`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.projects)).toBe(true);
    expect(res.body.data.projects.length).toBe(1);
  });

  test('21. GET /api/projects/:id should return project details with task metrics', async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.project.id).toBe(createdProjectId);
    expect(res.body.data).toHaveProperty('statistics');
  });

  test('22. PATCH /api/projects/:id should update project metadata', async () => {
    const res = await request(app)
      .patch(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'TaskFlow Next-Gen UI',
        status: 'Completed'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.project.name).toBe('TaskFlow Next-Gen UI');
    expect(res.body.data.project.status).toBe('Completed');
  });

  test('23. GET /api/projects/:id should return 404 for invalid project ID', async () => {
    const res = await request(app)
      .get('/api/projects/999999')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
