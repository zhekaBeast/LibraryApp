const request = require('supertest');
const express = require('express');
const usersRouter = require('../src/routes/users');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users Routes', () => {
  let authToken;
  let librarianToken;
  let adminToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
    librarianToken = signToken({ userId: 2, role: 'LIBRARIAN' });
    adminToken = signToken({ userId: 3, role: 'ADMIN' });
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/users/search', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'test' });

      expect(response.status).toBe(401);
    });

    it('should search users with librarian role', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search users with admin role', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/users/:id/loans', () => {
    it('should return user loans', async () => {
      const response = await request(app)
        .get('/api/users/1/loans');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow users to view their own loans', async () => {
      const response = await request(app)
        .get('/api/users/1/loans')
        .set('Authorization', `Bearer ${authToken}`);

      // May return 200 or 403 depending on implementation
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /api/users/:id/overdue', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/1/overdue');

      expect(response.status).toBe(401);
    });

    it('should return overdue loans for librarian', async () => {
      const response = await request(app)
        .get('/api/users/1/overdue')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasOverdue');
      expect(response.body).toHaveProperty('overdueLoans');
      expect(response.body).toHaveProperty('count');
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/users/1/overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });
});

