const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
import auth = require("../middleware/auth");
const router = Router();

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.get('/search', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q } },
        { name: { contains: q} }
      ]
    },
    select: { id: true, email: true, name: true, role: true }
  });
  res.json(users);
});

router.get('/:id/loans', async (req, res) => {
  const auth = (req as any).auth;
  const userId = parseInt(req.params.id);
  
  // Проверяем права: либо запрашиваем свои данные, либо админ/библиотекарь
  if (userId !== auth.userId && !['ADMIN', 'LIBRARIAN'].includes(auth.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: { 
      copy: { include: { book: true } } 
    },
    orderBy: { issuedAt: 'desc' }
  });
  res.json(loans);
});

router.get('/:id/overdue', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const userId = parseInt(req.params.id);
  
  const overdueLoans = await prisma.loan.findMany({
    where: { 
      userId, 
      returnedAt: null,
      dueAt: { lt: new Date() }
    },
    include: { copy: { include: { book: true } } }
  });
  
  res.json({ 
    hasOverdue: overdueLoans.length > 0,
    overdueLoans,
    count: overdueLoans.length
  });
});

module.exports = router;

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [users]
 *     summary: Get all users (admin only)
 *     responses:
 *       200: { description: List of users }
 */

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     tags: [users]
 *     summary: Search users by email or name (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Found users }
 */

/**
 * @openapi
 * /api/users/{id}/loans:
 *   get:
 *     tags: [users]
 *     summary: Get user's loans (admin/librarian or own user)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User loans }
 */

/**
 * @openapi
 * /api/users/{id}/overdue:
 *   get:
 *     tags: [users]
 *     summary: Check if user has overdue loans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Overdue status }
 */