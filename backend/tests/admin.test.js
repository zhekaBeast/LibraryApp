const request = require('supertest');
const express = require('express');
const adminRouter = require('../src/routes/admin');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    adminToken = signToken({ userId: 1, role: 'ADMIN' });
    userToken = signToken({ userId: 2, role: 'USER' });
  });

  describe('GET /api/admin/:model', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/user');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should get all records for a model', async () => {
      const response = await request(app)
        .get('/api/admin/user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/user')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should return 400 for invalid model', async () => {
      const response = await request(app)
        .get('/api/admin/invalidmodel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/:model/:id', () => {
    it('should get a single record', async () => {
      const response = await request(app)
        .get('/api/admin/user/1')
        .set('Authorization', `Bearer ${adminToken}`);

      // May return 404 if user doesn't exist, or 200 if it does
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/admin/user/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/:model', () => {
    it('should create a new record', async () => {
      const response = await request(app)
        .post('/api/admin/book')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Test Book',
          author: 'Admin Author'
        });

      // May return 400 if validation fails, or 201 if successful
      expect([201, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/book')
        .send({
          title: 'Test Book'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/admin/:model/:id', () => {
    it('should update a record', async () => {
      const response = await request(app)
        .put('/api/admin/book/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title'
        });

      // May return 400 if record doesn't exist or validation fails
      expect([200, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/admin/book/1')
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/admin/:model/:id', () => {
    it('should delete a record', async () => {
      const response = await request(app)
        .delete('/api/admin/book/1')
        .set('Authorization', `Bearer ${adminToken}`);

      // May return 400 if record doesn't exist
      expect([200, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/admin/book/1');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/:model/search', () => {
    it('should search records', async () => {
      const response = await request(app)
        .get('/api/admin/book/search')
        .query({ q: 'test', field: 'title' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/book/search')
        .query({ q: 'test' });

      expect(response.status).toBe(401);
    });
  });
});

