import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/', async (req, res) => {
  const { email, name, role } = req.body;
  const user = await prisma.user.create({ data: { email, name, role } });
  res.status(201).json(user);
});

export default router;

