const request = require('supertest');
const express = require('express');
const loansRouter = require('../src/routes/loans');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/loans', loansRouter);

describe('Loans Routes', () => {
  let authToken;
  let librarianToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
    librarianToken = signToken({ userId: 2, role: 'LIBRARIAN' });
  });

  describe('GET /api/loans/active', () => {
    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .get('/api/loans/active');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Не указан userId');
    });

    it('should return 404 if user not found', async () => {
      const response = await request(app)
        .get('/api/loans/active')
        .query({ userId: 99999 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Пользователь не найден');
    });

    it('should return active loans for user', async () => {
      const response = await request(app)
        .get('/api/loans/active')
        .query({ userId: 1 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/loans', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/loans');

      expect(response.status).toBe(401);
    });

    it('should return loans for librarian', async () => {
      const response = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/loans/my', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/loans/my');

      expect(response.status).toBe(401);
    });

    it('should return user loans', async () => {
      const response = await request(app)
        .get('/api/loans/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/loans/issue', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/loans/issue')
        .send({
          userId: 1,
          copyId: 1
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if copy is not available', async () => {
      const response = await request(app)
        .post('/api/loans/issue')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          userId: 1,
          copyId: 99999
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Copy not available');
    });
  });

  describe('POST /api/loans/:loanId/return', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/loans/1/return');

      expect(response.status).toBe(401);
    });

    it('should return 404 if loan not found', async () => {
      const response = await request(app)
        .post('/api/loans/99999/return')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Loan not found');
    });
  });
});

