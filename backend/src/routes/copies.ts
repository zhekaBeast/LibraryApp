const { Router } = require('express');
const prisma = require('../prisma').default || require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/:bookId', async (req, res) => {
  const bookId = Number(req.params.bookId);
  const copies = await prisma.bookCopy.findMany({ where: { bookId } });
  res.json(copies);
});

router.post('/', requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const { bookId, location } = req.body;
  const copy = await prisma.bookCopy.create({ data: { bookId, location } });
  res.status(201).json(copy);
});

router.delete('/:copyId', requireRole('LIBRARIAN', 'ADMIN'), async (req, res) => {
  const copyId = Number(req.params.copyId);
  
  try {
    // Проверяем, не выдана ли копия сейчас
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
        status: 'deleted',
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

