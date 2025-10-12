const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const librarianPass = await bcrypt.hash('librarian123', 10);
  const readerPass = await bcrypt.hash('reader123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@lib.local' },
    update: {},
    create: { email: 'admin@lib.local', name: 'Admin', role: 'ADMIN', passwordHash: adminPass },
  });

  await prisma.user.upsert({
    where: { email: 'librarian@lib.local' },
    update: {},
    create: { email: 'librarian@lib.local', name: 'Librarian', role: 'LIBRARIAN', passwordHash: librarianPass },
  });

  const reader = await prisma.user.upsert({
    where: { email: 'reader@lib.local' },
    update: {},
    create: { email: 'reader@lib.local', name: 'Reader', role: 'READER', passwordHash: readerPass },
  });

  const book = await prisma.book.upsert({
    where: { id: 1 },
    update: {},
    create: { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Software', isbn: '9780132350884' },
  });

  const copy1 = await prisma.bookCopy.create({ data: { bookId: book.id, location: 'Main' } });
  await prisma.loan.create({ data: { userId: reader.id, copyId: copy1.id, dueAt: new Date(Date.now() + 7 * 86400000) } });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

