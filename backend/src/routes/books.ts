const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
import auth = require("../middleware/auth");

const router = Router();

router.put('/:id', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid book ID' });
  const { title, author, isbn, genre, year, description } = req.body;
  const book = await prisma.book.update({ 
    where: { id }, 
    data: { title, author, isbn, genre, year, description } 
  });
  res.json(book);
});

router.delete('/:id', auth.requireAuth, auth.requireRole('ADMIN'), async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid book ID' });
  
  // Проверяем есть ли связанные экземпляры
  const copies = await prisma.bookCopy.count({ where: { bookId: id } });
  if (copies > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete book with existing copies. Delete copies first.' 
    });
  }
  
  await prisma.book.delete({ where: { id } });
  res.json({ success: true });
});

router.get('/', async (_req, res) => {
  const books = await prisma.book.findMany({ include: { copies: true } });
  res.json(books);
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  const books = await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { isbn: { contains: q, mode: 'insensitive' } }
      ]
    }
  });
  res.json(books);
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid book ID' });
  
  const book = await prisma.book.findUnique({ 
    where: { id },
    include: { copies: true }
  });
  
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

router.post('/', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { title, author, isbn, genre } = req.body;
  const book = await prisma.book.create({ data: { title, author, isbn, genre } });
  res.status(201).json(book);
});

router.get('/:id/availability', async (req, res) => {
  const id = parseInt(req.params.id);
  const availableCopies = await prisma.bookCopy.count({
    where: { bookId: id, status: 'AVAILABLE' }
  });
  res.json({ available: availableCopies > 0, availableCount: availableCopies });
});

router.post('/:id/subscription', async (req, res) => {
  const bookId = parseInt(req.params.id);
  const { userId } = req.body;
  
  const subscription = await prisma.availabilitySubscription.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: { isActive: true },
    create: { userId, bookId, isActive: true }
  });
  
  res.status(201).json(subscription);
});

router.delete('/:id/subscription', async (req, res) => {
  const bookId = parseInt(req.params.id);
  const { userId } = req.body;
  
  await prisma.availabilitySubscription.updateMany({
    where: { userId, bookId },
    data: { isActive: false }
  });
  
  res.json({ success: true });
});

module.exports = router;


/**
 * @openapi
 * /api/books:
 *   get:
 *     tags:
 *      - books
 *     summary: Get all books
 *     responses:
 *       200: { description: List of all books }
 */

/**
 * @openapi
 * /api/books/{id}:
 *   get:
 *     tags:
 *      - books
 *     summary: Get book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Book details }
 *       400: { description: Invalid book ID }
 *       404: { description: Book not found }
 */

/**
 * @openapi
 * /api/books:
 *   post:
 *     tags:
 *      - books
 *     summary: Create new book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author]
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               genre: { type: string }
 *               year: { type: integer }
 *               description: { type: string }
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       201: { description: Book created }
 */

/**
 * @openapi
 * /api/books/search:
 *   get:
 *     tags:
 *      - books
 *     summary: Search books by title, author or ISBN
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Found books }
 */

/**
 * @openapi
 * /api/books/{id}/availability:
 *   get:
 *     tags:
 *      - books
 *     summary: Check book availability status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Availability status }
 */

/**
 * @openapi  
 * /api/books/{id}/subscription:
 *   post:
 *     tags:
 *      - books
 *     summary: Subscribe to book availability notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       201: { description: Subscribed }
 */

/**
 * @openapi
 * /api/books/{id}/subscription:
 *   delete:
 *     tags:
 *      - books
 *     summary: Unsubscribe from book availability notifications  
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       200: { description: Unsubscribed }
 */

/**
 * @openapi
 * /api/books/{id}:
 *   put:
 *     tags: [books]
 *     summary: Update book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               genre: { type: string }
 *               year: { type: integer }
 *               description: { type: string }
 *     responses:
 *       200: { description: Book updated }
 */
/**
 * @openapi
 * /api/books/{id}:
 *   delete:
 *     tags: [books]
 *     summary: Delete book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Book deleted }
 *       400: { description: Book has copies }
 */