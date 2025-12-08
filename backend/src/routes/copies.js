const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const auth = require('../middleware/auth');

const router = Router();


router.get('/:bookId', async (req, res) => {
  const bookId = Number(req.params.bookId);
  const copies = await prisma.bookCopy.findMany({ where: { bookId } });
  res.json(copies);
});

router.post('/', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { bookId } = req.body; 
  
  try {
    // Получаем книгу чтобы узнать её ISBN
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    
    // Считаем сколько копий уже есть у этой книги
    const existingCopiesCount = await prisma.bookCopy.count({
      where: { bookId }
    });
    
    // Генерируем штрихкод: ISBN книги + номер копии (001, 002...)
    const copyNumber = (existingCopiesCount + 1).toString().padStart(3, '0');
    const barcode = `${book.isbn || '9780000000000'}-${copyNumber}`;
    
    // Создаём копию
    const copy = await prisma.bookCopy.create({ 
      data: { 
        bookId, 
        barcode,
        status: 'AVAILABLE'
      } 
    });
    
    res.status(201).json(copy);
  } catch (error) {
    console.error('Error creating copy:', error);
    res.status(500).json({ error: 'Ошибка при создании копии' });
  }
});
router.delete('/:copyId', auth.requireAuth, auth.requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const copyId = Number(req.params.copyId);
  
  try {
    const activeLoan = await prisma.loan.findFirst({
      where: { 
        copyId: copyId,
        returnedAt: null
      }
    });
    
    if (activeLoan) {
      return res.status(400).json({ error: 'Нельзя удалить копию, которая сейчас выдана' });
    }
    
    await prisma.bookCopy.update({
      where: { id: copyId },
      data: { 
        status: 'DELETED',
      }
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Копия помечена как удаленная'
    });
  } catch (error) {
    console.error('Error deleting copy:', error);
    res.status(500).json({ error: 'Ошибка при удалении копии' });
  }
});

module.exports = router;

/**
 * @openapi
 * /api/copies/{bookId}:
 *   get:
 *     tags: [copies]
 *     summary: Get all copies of a book
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of book copies }
 */

/**
 * @openapi
 * /api/copies:
 *   post:
 *     tags: [copies]
 *     summary: Create new book copy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId: { type: integer }
 *               barcode: { type: string }
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       201: { description: Copy created }
 */

/**
 * @openapi
 * /api/copies/{copyId}:
 *   delete:
 *     tags: [copies]
 *     summary: Mark copy as deleted
 *     parameters:
 *       - in: path
 *         name: copyId
 *         required: true
 *         schema: { type: integer }
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       200: { description: Copy marked as deleted }
 *       400: { description: Copy is currently borrowed }
 */