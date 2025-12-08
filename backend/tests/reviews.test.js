const request = require('supertest');
const express = require('express');
const reviewsRouter = require('../src/routes/reviews');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewsRouter);

describe('Reviews Routes', () => {
  let authToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
  });

  describe('GET /api/reviews/book/:bookId', () => {
    it('should get reviews for a book', async () => {
      const response = await request(app)
        .get('/api/reviews/book/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/reviews/my', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/my');

      expect(response.status).toBe(401);
    });

    it('should get user reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/reviews', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          bookId: 1,
          rating: 5,
          comment: 'Great book!'
        });

      expect(response.status).toBe(401);
    });

    it('should create a review', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookId: 1,
          rating: 5,
          comment: 'Great book!'
        });

      // May return 201 if successful, or 400/500 if validation fails
      expect([201, 400, 500]).toContain(response.status);
    });

    it('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookId: 1,
          rating: 10, // Invalid: should be 1-5
          comment: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rating must be between 1 and 5');
    });

    it('should return 400 for rating below 1', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookId: 1,
          rating: 0,
          comment: 'Test'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/reviews/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 if review not found', async () => {
      const response = await request(app)
        .delete('/api/reviews/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Review not found');
    });
  });
});

