const request = require('supertest');
const express = require('express');
const configRouter = require('../src/routes/config');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/config', configRouter);

describe('Config Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    adminToken = signToken({ userId: 1, role: 'ADMIN' });
    userToken = signToken({ userId: 2, role: 'USER' });
  });

  describe('GET /api/config', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/config');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should get system config for admin', async () => {
      const response = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('loanPeriodDays');
      expect(response.body).toHaveProperty('finePerDay');
    });
  });

  describe('PUT /api/config', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/config')
        .send({
          loanPeriodDays: 14,
          finePerDay: 10
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          loanPeriodDays: 14,
          finePerDay: 10
        });

      expect(response.status).toBe(403);
    });

    it('should update config for admin', async () => {
      const response = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          loanPeriodDays: 14,
          finePerDay: 10
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('loanPeriodDays');
      expect(response.body).toHaveProperty('finePerDay');
      expect(response.body.loanPeriodDays).toBe(14);
      expect(response.body.finePerDay).toBe(10);
    });
  });
});

