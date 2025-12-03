import auth = require("../middleware/auth");
const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');

const router = Router();

router.get('/', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (_req, res) => {
  const loans = await prisma.loan.findMany({ 
    include: { 
      user: { select: { id: true, name: true, email: true } }, 
      copy: { include: { book: true } } 
    } 
  });
  res.json(loans);
});

router.get('/my', auth.requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const loans = await prisma.loan.findMany({ 
    where: { userId: auth.userId },
    include: { copy: { include: { book: true } } }
  });
  res.json(loans);
});

router.post('/issue', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { userId, copyId, dueAt } = req.body;
  
  // Проверяем доступность копии
  const copy = await prisma.bookCopy.findFirst({ 
    where: { id: copyId, status: 'AVAILABLE' } 
  });
  if (!copy) return res.status(400).json({ error: 'Copy not available' });
  
  // Проверяем просрочки пользователя
  const overdueLoans = await prisma.loan.count({
    where: { 
      userId, 
      returnedAt: null,
      dueAt: { lt: new Date() }
    }
  });
  if (overdueLoans > 0) return res.status(400).json({ error: 'User has overdue loans' });
  
  const loan = await prisma.loan.create({ 
    data: { 
      userId, 
      copyId, 
      dueAt: dueAt ? new Date(dueAt) : new Date(Date.now() + 14 * 86400000) 
    } 
  });

  await prisma.bookCopy.update({ 
    where: { id: copyId }, 
    data: { status: 'BORROWED' } 
  });
  
  res.status(201).json(loan);
});

router.post('/:loanId/return', auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const loanId = Number(req.params.loanId);
  const { finePaid } = req.body;
  
  const loan = await prisma.loan.findUnique({ 
    where: { id: loanId },
    include: { copy: true }
  });
  
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.returnedAt) return res.status(400).json({ error: 'Book already returned' });
  
  // Расчет штрафа
  const now = new Date();
  const overdueDays = Math.max(0, Math.floor((now.getTime() - loan.dueAt.getTime()) / 86400000));
  const config = await prisma.systemConfig.findFirst();
  const fineCents = overdueDays * (config?.finePerDay || 10);
  
  const updatedLoan = await prisma.loan.update({ 
    where: { id: loanId }, 
    data: { 
      returnedAt: now,
      fineCents,
      status: 'RETURNED'
    } 
  });
  
  await prisma.bookCopy.update({ 
    where: { id: loan.copyId }, 
    data: { status: 'AVAILABLE' } 
  });
  
  // Проверяем подписки на доступность
  const subscriptions = await prisma.availabilitySubscription.findMany({
    where: { bookId: loan.copy.bookId, isActive: true }
  });
  
  if (subscriptions.length > 0) {
    // Создаем уведомления и деактивируем подписки
    await Promise.all([
      ...subscriptions.map(sub => 
        prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'Книга доступна',
            message: `Книга "${loan.copy.book.title}" теперь доступна для выдачи`
          }
        })
      ),
      prisma.availabilitySubscription.updateMany({
        where: { bookId: loan.copy.bookId, isActive: true },
        data: { isActive: false }
      })
    ]);
  }
  
  res.json(updatedLoan);
});

module.exports = router;

/**
 * @openapi
 * /api/loans:
 *   get:
 *     tags: [loans]
 *     summary: Get all loans (admin/librarian only)
 *     responses:
 *       200: { description: List of all loans }
 */

/**
 * @openapi
 * /api/loans/my:
 *   get:
 *     tags: [loans]
 *     summary: Get current user's loans
 *     responses:
 *       200: { description: User's loans }
 */

/**
 * @openapi
 * /api/loans/issue:
 *   post:
 *     tags: [loans]
 *     summary: Issue book to user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, copyId]
 *             properties:
 *               userId: { type: integer }
 *               copyId: { type: integer }
 *               dueAt: { type: string, format: date-time }
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       201: { description: Book issued }
 *       400: { description: Copy not available or user has overdue loans }
 */

/**
 * @openapi
 * /api/loans/{loanId}/return:
 *   post:
 *     tags: [loans]
 *     summary: Return book
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finePaid: { type: boolean }
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       200: { description: Book returned }
 */