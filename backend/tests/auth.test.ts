import request from 'supertest';
import app from '../src/app';
import { initDb, query } from '../src/services/dbService';

describe('Authentication API Workflow Tests', () => {
  beforeAll(async () => {
    await initDb();
    await query('DELETE FROM comments');
    await query('DELETE FROM tasks');
    await query('DELETE FROM projects');
    await query('DELETE FROM team_members');
    await query('DELETE FROM teams');
    await query('DELETE FROM refresh_tokens');
    await query('DELETE FROM users');
  });

  let accessToken: string;
  let refreshToken: string;

  test('1. POST /api/auth/register should create a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin User',
        email: 'testadmin@taskflow.dev',
        password: 'password123',
        role: 'Admin'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('testadmin@taskflow.dev');
    expect(res.body.data.user.role).toBe('Admin');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('2. POST /api/auth/register should prevent duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Admin User',
        email: 'testadmin@taskflow.dev',
        password: 'password123',
        role: 'Admin'
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('already exists');
  });

  test('3. POST /api/auth/register should reject invalid payload (missing email)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad Payload',
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('4. POST /api/auth/login should authenticate user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@taskflow.dev',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('testadmin@taskflow.dev');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('5. POST /api/auth/login should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@taskflow.dev',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('6. POST /api/auth/login should reject non-existent user email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@taskflow.dev',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('7. GET /api/auth/me should return current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('testadmin@taskflow.dev');
  });

  test('8. GET /api/auth/me should return 401 without Bearer token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('9. POST /api/auth/refresh should issue new access token on refresh token rotation', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    // Update tokens
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('10. POST /api/auth/refresh should reject reused old refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid_old_token_string' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('11. POST /api/auth/logout should clear refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
