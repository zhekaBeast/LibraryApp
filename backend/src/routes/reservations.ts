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

  const existingReservation = await prisma.reservation.findFirst({
    where: { 
      userId: auth.userId, 
      bookId,
      status: 'active' 
    }
  });

  if (existingReservation) {
    return res.status(400).json({ 
      error: 'У вас уже есть активное бронирование этой книги' 
    });
  }

  const r = await prisma.reservation.create({ 
    data: { userId: auth.userId, bookId } 
  });
  
  res.status(201).json(r);
});

module.exports = router;

