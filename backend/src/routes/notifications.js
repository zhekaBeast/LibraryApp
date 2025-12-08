const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const auth = (req ).auth;
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notifications);
});

router.patch('/:id/read', async (req, res) => {
  const auth = req.auth;
  const id = parseInt(req.params.id);
  
  const notification = await prisma.notification.updateMany({
    where: { id, userId: auth.userId },
    data: { isRead: true }
  });
  
  res.json(notification);
});

router.post('/read-all', async (req, res) => {
  const auth = req.auth;
  
  await prisma.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true }
  });
  
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [notifications]
 *     summary: Get user's notifications
 *     responses:
 *       200: { description: User notifications }
 */

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [notifications]
 *     summary: Mark notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Notification marked as read }
 */

/**
 * @openapi
 * /api/notifications/read-all:
 *   post:
 *     tags: [notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200: { description: All notifications marked as read }
 */