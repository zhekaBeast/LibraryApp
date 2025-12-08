const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Получить отзывы для книги
router.get('/book/:bookId', async (req, res) => {
  const bookId = parseInt(req.params.bookId);
  const reviews = await prisma.review.findMany({
    where: { bookId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(reviews);
});

// Получить отзывы пользователя
router.get('/my', requireAuth, async (req, res) => {
  const auth = req.auth;
  const reviews = await prisma.review.findMany({
    where: { userId: auth.userId },
    include: { book: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(reviews);
});

// Создать/обновить отзыв
router.post('/', requireAuth, async (req, res) => {
  const auth = req.auth;
  const { bookId, rating, comment } = req.body;
  
  // Валидация рейтинга
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  const review = await prisma.review.upsert({
    where: {
      userId_bookId: {
        userId: auth.userId,
        bookId
      }
    },
    update: { rating, comment },
    create: { userId: auth.userId, bookId, rating, comment }
  });
  
  res.status(201).json(review);
});

// Удалить отзыв
router.delete('/:id', requireAuth, async (req, res) => {
  const auth = req.auth;
  const id = parseInt(req.params.id);
  
  const review = await prisma.review.findFirst({
    where: { id, userId: auth.userId }
  });
  
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  
  await prisma.review.delete({ where: { id } });
  res.json({ message: 'Review deleted' });
});

module.exports = router;

/**
 * @openapi
 * /api/reviews/book/{bookId}:
 *   get:
 *     tags: [reviews]
 *     summary: Get reviews for a book
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Book reviews }
 */
/**
 * @openapi
 * /api/reviews/my:
 *   get:
 *     tags: [reviews]
 *     summary: Get current user's reviews
 *     responses:
 *       200: { description: User reviews }
 */
/**
 * @openapi
 * /api/reviews:
 *   post:
 *     tags: [reviews]
 *     summary: Create or update review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, rating]
 *             properties:
 *               bookId: { type: integer }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Review created/updated }
 *       400: { description: Invalid rating }
 */
/**
 * @openapi
 * /api/reviews/{id}:
 *   delete:
 *     tags: [reviews]
 *     summary: Delete review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Review deleted }
 *       404: { description: Review not found }
 */