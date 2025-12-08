const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireRole, requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const config = await prisma.systemConfig.findFirst();
  res.json(config || { loanPeriodDays: 14, finePerDay: 10 });
});

router.put('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { loanPeriodDays, finePerDay } = req.body;
  const config = await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: { loanPeriodDays, finePerDay },
    create: { loanPeriodDays, finePerDay }
  });
  res.json(config);
});

module.exports = router;

/**
 * @openapi
 * /api/config:
 *   get:
 *     tags: [config]
 *     summary: Get system configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: System config }
 */
/**
 * @openapi
 * /api/config:
 *   put:
 *     tags: [config]
 *     summary: Update system configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanPeriodDays: { type: integer }
 *               finePerDay: { type: integer }
 *     responses:
 *       200: { description: Config updated }
 */