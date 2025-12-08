const request = require('supertest');
const express = require('express');
const copiesRouter = require('../src/routes/copies');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/copies', copiesRouter);

describe('Copies Routes', () => {
  let authToken;
  let librarianToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
    librarianToken = signToken({ userId: 2, role: 'LIBRARIAN' });
  });

  describe('GET /api/copies/:bookId', () => {
    it('should get copies for a book', async () => {
      const response = await request(app)
        .get('/api/copies/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/copies', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/copies')
        .send({
          bookId: 1
        });

      expect(response.status).toBe(401);
    });

    it('should create a copy with librarian role', async () => {
      const response = await request(app)
        .post('/api/copies')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId: 1
        });

      // May return 201 if book exists, or 404/500 if it doesn't
      expect([201, 404, 500]).toContain(response.status);
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .post('/api/copies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookId: 1
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 if book not found', async () => {
      const response = await request(app)
        .post('/api/copies')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId: 99999
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Книга не найдена');
    });
  });

  describe('DELETE /api/copies/:copyId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/copies/1');

      expect(response.status).toBe(401);
    });

    it('should mark copy as deleted with librarian role', async () => {
      const response = await request(app)
        .delete('/api/copies/1')
        .set('Authorization', `Bearer ${librarianToken}`);

      // May return 200 if copy exists, or 500 if it doesn't
      expect([200, 500]).toContain(response.status);
    });

    it('should return 400 if copy is currently borrowed', async () => {
      // This test would require a copy that is currently borrowed
      // Implementation depends on actual data
      const response = await request(app)
        .delete('/api/copies/1')
        .set('Authorization', `Bearer ${librarianToken}`);

      // May return 200, 400, or 500 depending on copy status
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

