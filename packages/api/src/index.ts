import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';

// Routes (to be created)
// import authRoutes from './routes/auth';
// import familyRoutes from './routes/families';
// import expenseRoutes from './routes/expenses';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: '*', // TODO: Restrict in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    version: '0.1.0',
    message: '🏠 FamilyHub API',
    timestamp: new Date().toISOString(),
  });
});

// Routes
// app.route('/api/auth', authRoutes);
// app.route('/api/families', familyRoutes);
// app.route('/api/expenses', expenseRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
