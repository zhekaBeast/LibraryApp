import auth = require("../middleware/auth");
const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');

const router = Router();

// Также обновляем первый эндпоинт /active:
router.get('/active', async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log('GET /active - userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан userId' });
    }
    
    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId as string) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const activeLoans = await prisma.loan.findMany({
      where: {
        userId: parseInt(userId as string),
        status: 'ACTIVE'
      },
      include: {
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                year: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    
    console.log('Found active loans:', activeLoans.length);
    
    // Преобразуем ответ в удобный формат
    const formattedLoans = activeLoans.map(loan => ({
      id: loan.id,
      userId: loan.userId,
      copyId: loan.copyId,
      bookId: loan.copy.book.id,
      issuedAt: loan.issuedAt,
      dueAt: loan.dueAt,
      returnedAt: loan.returnedAt,
      status: loan.status,
      fineCents: loan.fineCents,
      copy: {
        id: loan.copy.id,
        barcode: loan.copy.barcode,
        status: loan.copy.status
      },
      book: loan.copy.book
    }));
    
    res.json(formattedLoans);
  } catch (error) {
    console.error('Error fetching active loans:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

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

router.post('/:loanId/return', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
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
 * @swagger
 * /api/loans/active:
 *   get:
 *     summary: Получить активные займы пользователя
 *     description: Возвращает список активных займов для указанного пользователя
 *     tags: [loans]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Список активных займов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Не указан userId
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
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