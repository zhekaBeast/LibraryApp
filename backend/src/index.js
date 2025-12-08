const express = require('express');
const cors = require('cors');
const usersRouter =  require('./routes/users');
const booksRouter = require('./routes/books');
const loansRouter =  require('./routes/loans');
const authRouter = require('./routes/auth');
const subscriptionsRouter = require('./routes/subscriptions');
const copiesRouter = require('./routes/copies');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger').swaggerSpec;
const notificationsRouter = require('./routes/notifications'); 
const reviewsRouter = require('./routes/reviews'); 
const configRouter = require('./routes/config');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');




const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/loans', loansRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/copies', copiesRouter);
app.use('/api/notifications', notificationsRouter); 
app.use('/api/reviews', reviewsRouter);
app.use('/api/config', configRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
