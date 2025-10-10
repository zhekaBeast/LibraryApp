import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import booksRouter from './routes/books';
import loansRouter from './routes/loans';
import authRouter from './routes/auth';
import reservationsRouter from './routes/reservations';
import copiesRouter from './routes/copies';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/loans', loansRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/copies', copiesRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
