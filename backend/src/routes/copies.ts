const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/:bookId', async (req, res) => {
  const bookId = Number(req.params.bookId);
  const copies = await prisma.bookCopy.findMany({ where: { bookId } });
  res.json(copies);
});

router.post('/', requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { bookId, location } = req.body;
  const copy = await prisma.bookCopy.create({ data: { bookId, location } });
  res.status(201).json(copy);
});

module.exports = router;

