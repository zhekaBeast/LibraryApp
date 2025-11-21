const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notifications);
});

router.patch('/:id/read', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const id = parseInt(req.params.id);
  
  const notification = await prisma.notification.updateMany({
    where: { id, userId: auth.userId },
    data: { isRead: true }
  });
  
  res.json(notification);
});

router.post('/read-all', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  
  await prisma.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true }
  });
  
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;