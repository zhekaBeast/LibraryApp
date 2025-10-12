const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', async (_req, res) => {
  const loans = await prisma.loan.findMany({ include: { user: true, copy: { include: { book: true } } } });
  res.json(loans);
});

router.get('/my', requireAuth, async (req, res) => {
  const auth = (req as any).auth as { userId: number };
  const loans = await prisma.loan.findMany({ 
    where: { userId: auth.userId },
    include: { copy: { include: { book: true } } }
  });
  res.json(loans);
});

router.post('/issue', async (req, res) => {
  const { userId, copyId, dueAt } = req.body;
  const loan = await prisma.loan.create({ data: { userId, copyId, dueAt: new Date(dueAt) } });
  await prisma.bookCopy.update({ where: { id: copyId }, data: { status: 'loaned' } });
  res.status(201).json(loan);
});

router.post('/return', async (req, res) => {
  const { loanId } = req.body;
  const loan = await prisma.loan.update({ where: { id: loanId }, data: { returnedAt: new Date() } });
  await prisma.bookCopy.update({ where: { id: loan.copyId }, data: { status: 'available' } });
  res.json(loan);
});

module.exports = router;

