// src/routes/admin.ts
const { Router } = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

// Только админы
router.use(requireAuth, requireRole('ADMIN'));

// Получить все данные таблицы
router.get('/:model', async (req, res) => {
  const { model } = req.params;
  const { page = 1, limit = 50, sort = 'id', order = 'desc' } = req.query;
  
  const skip = (page - 1) * limit;
  
  try {
    const data = await prisma[model].findMany({
      skip,
      take: parseInt(limit),
      orderBy: { [sort]: order },
    });
    
    const total = await prisma[model].count();
    
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({ error: `Модель "${model}" не найдена` });
  }
});

// Получить одну запись
router.get('/:model/:id', async (req, res) => {
  const { model, id } = req.params;
  
  try {
    const data = await prisma[model].findUnique({
      where: { id: parseInt(id) }
    });
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: 'Запись не найдена' });
  }
});

// Создать запись
router.post('/:model', async (req, res) => {
  const { model } = req.params;
  const rawData = req.body;
  
  try {
    const data = { ...rawData };
    
    // Boolean преобразования
    if (model === 'Notification' && data.isRead !== undefined) {
      data.isRead = data.isRead === 'true' || data.isRead === true;
    }
    
    if (model === 'AvailabilitySubscription' && data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    
    // Числовые поля
    const numericFields = ['userId', 'bookId', 'copyId', 'rating', 'year', 'fineCents', 'finePerDay', 'loanPeriodDays'];
    numericFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== '') {
        const num = parseInt(data[field]);
        if (!isNaN(num)) {
          data[field] = num;
        }
      }
    });
    
    // Удаляем ID если пришёл
    delete data.id;
    
    const created = await prisma[model].create({ data });
    res.status(201).json(created);
  } catch (error) {
    console.error('Create error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Обновить запись
router.put('/:model/:id', async (req, res) => {
  const { model, id } = req.params;
  const rawData = req.body;
  
  console.log(`Update ${model} #${id}:`, rawData);
  
  try {
    const data = { ...rawData };
    
    // Преобразуем только известные boolean поля
    if (model === 'Notification' && data.isRead !== undefined) {
      data.isRead = data.isRead === 'true' || data.isRead === true;
    }
    
    if (model === 'AvailabilitySubscription' && data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    
    // Преобразуем числовые ID поля
    const idFields = ['id', 'userId', 'bookId', 'copyId', 'rating', 'fineCents', 'year'];
    idFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== '') {
        const num = parseInt(data[field]);
        if (!isNaN(num)) {
          data[field] = num;
        } else {
          // Если это обязательное поле, оставляем как есть
          if (!['id', 'rating', 'fineCents', 'year'].includes(field)) {
            delete data[field];
          }
        }
      }
    });
    
    // Удаляем поля, которые не должны обновляться
    delete data.createdAt;
    delete data.issuedAt; // Для Loan
    delete data.id; // ID не меняем
    
    console.log('Processed data:', data);
    
    const updated = await prisma[model].update({
      where: { id: parseInt(id) },
      data
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ 
      error: error.message,
      suggestion: 'Проверьте типы данных. Boolean поля: isRead, isActive'
    });
  }
});

// Удалить запись (мягкое удаление если есть поле deletedAt)
router.delete('/:model/:id', async (req, res) => {
  const { model, id } = req.params;
  
  try {
    // Пробуем мягкое удаление
    if (prisma[model].fields?.deletedAt) {
      const updated = await prisma[model].update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() }
      });
      res.json(updated);
    } else {
      // Физическое удаление
      const deleted = await prisma[model].delete({
        where: { id: parseInt(id) }
      });
      res.json(deleted);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Поиск по всем полям
router.get('/:model/search', async (req, res) => {
  const { model } = req.params;
  const { q, field = 'name' } = req.query;
  
  try {
    const where = {
      [field]: {
        contains: q,
        mode: 'insensitive'
      }
    };
    
    const data = await prisma[model].findMany({
      where,
      take: 20
    });
    
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;