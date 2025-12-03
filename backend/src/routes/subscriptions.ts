// availability-subscriptions.ts
const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const subscriptions = await prisma.availabilitySubscription.findMany({
    where: { userId: auth.userId, isActive: true },
    include: { book: true },
  });
  res.json(subscriptions);
});

router.post('/', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const { bookId } = req.body;

  try {
    // Пытаемся найти любую подписку (активную или нет)
    const existing = await prisma.availabilitySubscription.findFirst({
      where: { 
        userId: auth.userId, 
        bookId
      }
    });

    if (existing) {
      // Если нашли - активируем её
      const subscription = await prisma.availabilitySubscription.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
      return res.status(200).json(subscription);
    }

    // Если не нашли - создаём новую
    const subscription = await prisma.availabilitySubscription.create({ 
      data: { userId: auth.userId, bookId, isActive: true } 
    });
    
    res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:bookId', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const bookId = parseInt(req.params.bookId);

  await prisma.availabilitySubscription.updateMany({
    where: { userId: auth.userId, bookId },
    data: { isActive: false }
  });
  
  res.json({ success: true });
});

router.get('/check/:bookId', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const bookId = parseInt(req.params.bookId);
  
  const subscription = await prisma.availabilitySubscription.findFirst({
    where: { 
      userId: auth.userId, 
      bookId,
      isActive: true 
    }
  });
  
  res.json({ isSubscribed: !!subscription });
});


module.exports = router;
/**
 * @openapi
 * /api/subscriptions/check/{bookId}:
 *   get:
 *     tags: [subscriptions]
 *     summary: Check if user is subscribed to book availability
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSubscribed:
 *                   type: boolean
 *                   example: true
 */

/**
 * @openapi
 * /api/subscriptions:
 *   get:
 *     tags: [subscriptions]
 *     summary: Get user's active availability subscriptions
 *     responses:
 *       200: { description: User subscriptions }
 */
/**
 * @openapi
 * /api/subscriptions:
 *   post:
 *     tags: [subscriptions]
 *     summary: Subscribe to book availability notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId: { type: integer }
 *     responses:
 *       201: { description: Subscribed }
 *       400: { description: Already subscribed }
 */
/**
 * @openapi
 * /api/subscriptions/{bookId}:
 *   delete:
 *     tags: [subscriptions]
 *     summary: Unsubscribe from book availability notifications
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Unsubscribed }
 */