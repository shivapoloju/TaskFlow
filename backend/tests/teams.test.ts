import request from 'supertest';
import app from '../src/app';
import { initDb, query } from '../src/services/dbService';

describe('Teams API & RBAC Workflow Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let memberUserId: number;
  let createdTeamId: number;

  beforeAll(async () => {
    await initDb();
    await query('DELETE FROM comments');
    await query('DELETE FROM tasks');
    await query('DELETE FROM projects');
    await query('DELETE FROM team_members');
    await query('DELETE FROM teams');
    await query('DELETE FROM refresh_tokens');
    await query('DELETE FROM users');

    // Register Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Team Admin',
      email: 'teamadmin@taskflow.dev',
      password: 'password123',
      role: 'Admin'
    });
    adminToken = adminRes.body.data.accessToken;

    // Register Member
    const memberRes = await request(app).post('/api/auth/register').send({
      name: 'Team Member User',
      email: 'teammember@taskflow.dev',
      password: 'password123',
      role: 'Member'
    });
    memberToken = memberRes.body.data.accessToken;
    memberUserId = memberRes.body.data.user.id;
  });

  test('12. POST /api/teams should allow Admin to create a team', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'FullStack Core Team',
        description: 'Engineering squad for TaskFlow platform development.'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.team).toHaveProperty('id');
    expect(res.body.data.team.name).toBe('FullStack Core Team');
    createdTeamId = res.body.data.team.id;
  });

  test('13. POST /api/teams should reject Member role from creating team (RBAC 403)', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Unauthorized Team'
      });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Forbidden');
  });

  test('14. GET /api/teams should return teams list for authenticated user', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.teams)).toBe(true);
    expect(res.body.data.teams.length).toBeGreaterThan(0);
  });

  test('15. POST /api/teams/:id/members should allow Admin to add member', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: memberUserId,
        role: 'Member'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('16. POST /api/teams/:id/members should reject duplicate member addition', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: memberUserId,
        role: 'Member'
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
  });

  test('17. GET /api/teams/:id should return team details with member list', async () => {
    const res = await request(app)
      .get(`/api/teams/${createdTeamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.team.name).toBe('FullStack Core Team');
    expect(res.body.data.members.length).toBeGreaterThan(0);
  });

  test('18. DELETE /api/teams/:id/members/:userId should remove team member', async () => {
    const res = await request(app)
      .delete(`/api/teams/${createdTeamId}/members/${memberUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
