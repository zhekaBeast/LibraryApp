const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');

const router = Router();

router.get('/', async (_req, res) => {
  const books = await prisma.book.findMany({ include: { copies: true } });
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

router.post('/', async (req, res) => {
  const { title, author, isbn, genre } = req.body;
  const book = await prisma.book.create({ data: { title, author, isbn, genre } });
  res.status(201).json(book);
});

module.exports = router;

