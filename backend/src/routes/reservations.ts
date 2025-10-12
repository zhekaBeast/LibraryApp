const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const reservations = await prisma.reservation.findMany({
    where: { userId: auth.userId },
    include: { book: true },
  });
  res.json(reservations);
});

router.post('/', async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const { bookId } = req.body;
  const r = await prisma.reservation.create({ data: { userId: auth.userId, bookId } });
  res.status(201).json(r);
});

module.exports = router;

