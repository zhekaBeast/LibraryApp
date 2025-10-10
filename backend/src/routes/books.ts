import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const books = await prisma.book.findMany({ include: { copies: true } });
  res.json(books);
});

router.post('/', async (req, res) => {
  const { title, author, isbn, genre } = req.body;
  const book = await prisma.book.create({ data: { title, author, isbn, genre } });
  res.status(201).json(book);
});

export default router;

