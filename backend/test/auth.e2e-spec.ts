import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupDatabase, createTestUser, loginAs, createTestApp } from './test-utils';
import { Role } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('user@example.com');
      expect(response.body.name).toBe('Test User');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email registration', async () => {
      await createTestUser(prisma, {
        email: 'duplicate@example.com',
        password: 'StrongPass123!',
        name: 'First User',
        roles: [Role.Admin],
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'AnotherPass123!',
          name: 'Second User',
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          password: 'StrongPass123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'nopass@example.com',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should reject registration with missing name', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'StrongPass123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should reject registration with empty body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await createTestUser(prisma, {
        email: 'login@example.com',
        password: 'CorrectPass123!',
        name: 'Login User',
        roles: [Role.Admin],
      });
    });

    it('should login successfully and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPass123!',
        })
        .expect(200);

      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');

      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('access_token'))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token'))).toBe(true);

      // Verify cookies are httpOnly
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPass123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'SomePass123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should reject login with missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should reject login with empty body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens when valid refresh token cookie is provided', async () => {
      await createTestUser(prisma, {
        email: 'refresh@example.com',
        password: 'RefreshPass123!',
        name: 'Refresh User',
        roles: [Role.Admin],
      });

      const agent = request.agent(app.getHttpServer());

      // Login to get cookies
      const loginResponse = await agent
        .post('/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'RefreshPass123!',
        })
        .expect(200);

      const loginCookies = loginResponse.headers['set-cookie'] as string[];
      expect(loginCookies.some((c) => c.includes('refresh_token'))).toBe(true);

      // Refresh tokens
      const refreshResponse = await agent.post('/auth/refresh').expect(200);

      expect(refreshResponse.body.message).toBe('Tokens refreshed');

      const refreshCookies = refreshResponse.headers['set-cookie'] as string[];
      expect(refreshCookies.some((c) => c.includes('access_token'))).toBe(true);
      expect(refreshCookies.some((c) => c.includes('refresh_token'))).toBe(true);
    });

    it('should reject refresh without refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);

      expect(response.body.message).toContain('No refresh token provided');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=invalid_token'])
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookies on logout', async () => {
      await createTestUser(prisma, {
        email: 'logout@example.com',
        password: 'LogoutPass123!',
        name: 'Logout User',
        roles: [Role.Admin],
      });

      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'LogoutPass123!',
        })
        .expect(200);

      const response = await agent.post('/auth/logout').expect(200);

      expect(response.body.message).toBe('Logged out successfully');

      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();

      // Cookies should be cleared (expired)
      const accessCookie = cookies.find((c) => c.includes('access_token'));
      const refreshCookie = cookies.find((c) => c.includes('refresh_token'));

      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();

      // Check for expiration (Expires=Thu, 01 Jan 1970)
      expect(accessCookie).toContain('Expires=Thu, 01 Jan 1970');
      expect(refreshCookie).toContain('Expires=Thu, 01 Jan 1970');
    });

    it('should allow logout even when not logged in', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Cookie-based Authentication Flow', () => {
    it('should maintain session across requests using agent', async () => {
      const user = await createTestUser(prisma, {
        email: 'session@example.com',
        password: 'SessionPass123!',
        name: 'Session User',
        roles: [Role.Admin],
      });

      const agent = request.agent(app.getHttpServer());

      // Access protected route before login - should fail
      await agent.get('/students').expect(401);

      // Login
      await agent
        .post('/auth/login')
        .send({
          email: 'session@example.com',
          password: 'SessionPass123!',
        })
        .expect(200);

      // Access protected route after login - should succeed
      const response = await agent.get('/students').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not authenticate with Bearer token in header', async () => {
      await createTestUser(prisma, {
        email: 'bearer@example.com',
        password: 'BearerPass123!',
        name: 'Bearer User',
        roles: [Role.Admin],
      });

      // Login to get a token (even though it's in cookies)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'bearer@example.com',
          password: 'BearerPass123!',
        })
        .expect(200);

      // Try to access protected route with Bearer token - should fail
      // because JWT strategy only reads from cookies
      await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer fake_token`)
        .expect(401);
    });
  });
});
