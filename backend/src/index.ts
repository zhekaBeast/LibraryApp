const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/users').default || require('./routes/users');
const booksRouter = require('./routes/books').default || require('./routes/books');
const loansRouter = require('./routes/loans').default || require('./routes/loans');
const authRouter = require('./routes/auth').default || require('./routes/auth');
const reservationsRouter = require('./routes/reservations').default || require('./routes/reservations');
const copiesRouter = require('./routes/copies').default || require('./routes/copies');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger').swaggerSpec;
const notificationsRouter = require('./routes/notifications').default || require('./routes/notifications'); 
const reviewsRouter = require('./routes/reviews').default || require('./routes/reviews'); 




const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/loans', loansRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/copies', copiesRouter);
app.use('/api/notifications', notificationsRouter); 
app.use('/api/reviews', reviewsRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
