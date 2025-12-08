const request = require('supertest');
const express = require('express');
const notificationsRouter = require('../src/routes/notifications');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  let authToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
  });

  describe('GET /api/notifications', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(401);
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/notifications/1/read');

      expect(response.status).toBe(401);
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .patch('/api/notifications/1/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/notifications/read-all');

      expect(response.status).toBe(401);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All notifications marked as read');
    });
  });
});

