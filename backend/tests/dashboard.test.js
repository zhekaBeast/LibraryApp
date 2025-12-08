const request = require('supertest');
const express = require('express');
const dashboardRouter = require('../src/routes/dashboard');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRouter);

describe('Dashboard Routes', () => {
  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBooks');
      expect(response.body).toHaveProperty('totalCopies');
      expect(response.body).toHaveProperty('availableCopies');
      expect(response.body).toHaveProperty('activeLoans');
      expect(response.body).toHaveProperty('overdueLoans');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('popularBooks');
      expect(response.body).toHaveProperty('activeUsers');
    });

    it('should support range parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .query({ range: 'week' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBooks');
    });

    it('should support month range', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .query({ range: 'month' });

      expect(response.status).toBe(200);
    });

    it('should support year range', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .query({ range: 'year' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/dashboard/activity', () => {
    it('should get activity data', async () => {
      const response = await request(app)
        .get('/api/dashboard/activity');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support week range', async () => {
      const response = await request(app)
        .get('/api/dashboard/activity')
        .query({ range: 'week' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support month range', async () => {
      const response = await request(app)
        .get('/api/dashboard/activity')
        .query({ range: 'month' });

      expect(response.status).toBe(200);
    });

    it('should support year range', async () => {
      const response = await request(app)
        .get('/api/dashboard/activity')
        .query({ range: 'year' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/dashboard/quick-stats', () => {
    it('should get quick statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/quick-stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBooks');
      expect(response.body).toHaveProperty('activeLoans');
      expect(response.body).toHaveProperty('overdueLoans');
      expect(response.body).toHaveProperty('availableCopies');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});

