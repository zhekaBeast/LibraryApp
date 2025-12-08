// backend/routes/dashboard.ts
import { Router } from 'express';
const prisma = require('../prisma');

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    // Вычисляем дату начала периода
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // ОСНОВНЫЕ МЕТРИКИ - используем Prisma напрямую
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      activeLoans,
      overdueLoans,
      totalUsers
    ] = await Promise.all([
      // Всего уникальных книг
      prisma.book.count(),
      
      // Всего экземпляров
      prisma.bookCopy.count(),
      
      // Доступных экземпляров
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      
      // Активных займов
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      
      // Просроченных займов
      prisma.loan.count({ 
        where: { 
          status: 'ACTIVE',
          dueAt: { lt: now }
        } 
      }),
      
      // Всего пользователей
      prisma.user.count()
    ]);

    // ПОПУЛЯРНЫЕ КНИГИ - используем группировку через Prisma
    const popularBooksRaw = await prisma.loan.groupBy({
      by: ['copyId'],
      where: {
        issuedAt: { gte: startDate }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Получаем детали книг для популярных копий
    const popularBooks = await Promise.all(
      popularBooksRaw.map(async (item: any) => {
        const copy = await prisma.bookCopy.findUnique({
          where: { id: item.copyId },
          include: { book: true }
        });
        
        return {
          ...copy?.book,
          loanCount: item._count.id
        };
      })
    );

    // АКТИВНЫЕ ПОЛЬЗОВАТЕЛИ - через группировку
    const activeUsersRaw = await prisma.loan.groupBy({
      by: ['userId'],
      where: {
        issuedAt: { gte: startDate }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Получаем детали пользователей
    const activeUsers = await Promise.all(
      activeUsersRaw.map(async (item: any) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, name: true, email: true, role: true }
        });
        
        return {
          ...user,
          loanCount: item._count.id
        };
      })
    );

    res.json({
      totalBooks,
      totalCopies,
      availableCopies,
      activeLoans,
      overdueLoans,
      totalUsers,
      popularBooks: popularBooks.filter(book => book !== null && book.id !== undefined),
      activeUsers: activeUsers.filter(user => user !== null && user.id !== undefined)
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки статистики',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Простая статистика активности (количество займов по дням/месяцам)
router.get('/activity', async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    // Получаем все займы за период
    let whereCondition: any = {};
    
    switch (range) {
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        whereCondition.issuedAt = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        whereCondition.issuedAt = { gte: monthAgo };
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        whereCondition.issuedAt = { gte: yearAgo };
        break;
    }

    const loans = await prisma.loan.findMany({
      where: whereCondition,
      select: {
        issuedAt: true,
        status: true,
        returnedAt: true
      },
      orderBy: {
        issuedAt: 'asc'
      }
    });

    // Группируем по дням/месяцам
    const groupedData: Record<string, { count: number; active: number; returned: number }> = {};
    
    loans.forEach(loan => {
      let key: string;
      
      switch (range) {
        case 'week':
          key = loan.issuedAt.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'month':
          const date = new Date(loan.issuedAt);
          const weekNum = Math.floor((date.getDate() - 1) / 7) + 1;
          key = `${date.getFullYear()}-W${weekNum}`;
          break;
        case 'year':
          const yearMonth = loan.issuedAt.toISOString().substring(0, 7); // YYYY-MM
          key = yearMonth;
          break;
        default:
          key = loan.issuedAt.toISOString().substring(0, 7);
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { count: 0, active: 0, returned: 0 };
      }
      
      groupedData[key].count++;
      if (loan.status === 'ACTIVE') {
        groupedData[key].active++;
      }
      if (loan.returnedAt) {
        groupedData[key].returned++;
      }
    });

    // Преобразуем в массив для ответа
    const activityData = Object.entries(groupedData).map(([period, data]) => ({
      period,
      ...data
    }));

    res.json(activityData);
    
  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({ error: 'Ошибка загрузки данных активности' });
  }
});

// Быстрая статистика для главной страницы (без сложных вычислений)
router.get('/quick-stats', async (_req, res) => {
  try {
    const [
      totalBooks,
      activeLoans,
      overdueLoans,
      availableCopies
    ] = await Promise.all([
      prisma.book.count(),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: new Date() } } }),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } })
    ]);

    res.json({
      totalBooks,
      activeLoans,
      overdueLoans,
      availableCopies,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({ error: 'Ошибка загрузки статистики' });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Получить полную статистику для dashboard
 *     description: Возвращает основные метрики библиотеки
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Период для статистики популярности
 *     responses:
 *       200:
 *         description: Статистика dashboard
 */

/**
 * @swagger
 * /api/dashboard/quick-stats:
 *   get:
 *     summary: Быстрая статистика
 *     description: Возвращает основные метрики без сложных вычислений
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Быстрая статистика
 */