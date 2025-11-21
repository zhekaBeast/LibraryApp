const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);
router.use(requireRole('ADMIN')); // Только для админов

// Получить все таблицы и их данные
router.get('/tables', async (req, res) => {
  try {
    const [users, books, copies, loans, reservations, reviews, notifications] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.book.findMany(),
      prisma.bookCopy.findMany({ 
        include: { 
          book: { select: { id: true, title: true, author: true } } 
        } 
      }),
      prisma.loan.findMany({ 
        include: { 
          user: { select: { id: true, name: true, email: true } },
          copy: { 
            include: { 
              book: { select: { id: true, title: true, author: true } } 
            } 
          }
        } 
      }),
      prisma.reservation.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true } }
        }
      }),
      prisma.review.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true } }
        }
      }),
      prisma.notification.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    res.json({
      users,
      books, 
      copies,
      loans,
      reservations,
      reviews,
      notifications
    });
  } catch (error) {
    console.error('Admin tables error:', error);
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

// Прямое выполнение Prisma операций
router.post('/execute', async (req, res) => {
  const { model, action, where, data } = req.body;
  
  try {
    // Валидация допустимых моделей и действий
    const allowedModels = ['user', 'book', 'bookCopy', 'loan', 'reservation', 'review', 'notification'];
    const allowedActions = ['create', 'update', 'delete', 'findUnique', 'findMany'];
    
    if (!allowedModels.includes(model) || !allowedActions.includes(action)) {
      return res.status(400).json({ error: 'Недопустимая операция' });
    }

    let result;
    
    switch (action) {
      case 'create':
        result = await prisma[model].create({ data });
        break;
      case 'update':
        result = await prisma[model].update({ where, data });
        break;
      case 'delete':
        result = await prisma[model].delete({ where });
        break;
      case 'findUnique':
        result = await prisma[model].findUnique({ where });
        break;
      case 'findMany':
        result = await prisma[model].findMany({ where });
        break;
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Admin execute error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Получить схему БД (мета-информация)
router.get('/schema', async (req, res) => {
  const schema = {
    User: ['id', 'email', 'name', 'role', 'createdAt'],
    Book: ['id', 'title', 'author', 'isbn', 'genre', 'createdAt'],
    BookCopy: ['id', 'bookId', 'status'],
    Loan: ['id', 'userId', 'copyId', 'issuedAt', 'dueAt', 'returnedAt', 'fineCents', 'status'],
    Reservation: ['id', 'userId', 'bookId', 'createdAt', 'expiresAt', 'status'],
    Review: ['id', 'userId', 'bookId', 'rating', 'comment', 'createdAt'],
    Notification: ['id', 'userId', 'title', 'message', 'isRead', 'createdAt']
  };
  
  res.json(schema);
});

module.exports = router;