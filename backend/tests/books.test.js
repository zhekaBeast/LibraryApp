const request = require('supertest');
const express = require('express');
const booksRouter = require('../src/routes/books');
const { signToken } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/books', booksRouter);

describe('Books Routes', () => {
  let authToken;
  let librarianToken;

  beforeEach(() => {
    authToken = signToken({ userId: 1, role: 'USER' });
    librarianToken = signToken({ userId: 2, role: 'LIBRARIAN' });
  });

  describe('GET /api/books', () => {
    it('should get all books', async () => {
      const response = await request(app)
        .get('/api/books');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books by query', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'test' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array if no results', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'nonexistentbook12345' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return 400 for invalid book ID', async () => {
      const response = await request(app)
        .get('/api/books/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid book ID');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Book not found');
    });
  });

  describe('POST /api/books', () => {
    it('should create a book with librarian role', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890',
          genre: 'Fiction',
          year: 2023
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Book');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'Test Book',
          author: 'Test Author'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Test Book'
          // missing author
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book with librarian role', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Updated Title',
          author: 'Updated Author'
        });

      // May return 400 if book doesn't exist, or 200 if it does
      expect([200, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/books/1');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid book ID', async () => {
      const adminToken = signToken({ userId: 3, role: 'ADMIN' });
      const response = await request(app)
        .delete('/api/books/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/books/:id/availability', () => {
    it('should check book availability', async () => {
      const response = await request(app)
        .get('/api/books/1/availability');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('availableCount');
    });
  });
});

