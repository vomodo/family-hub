import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types';

// Routes
import authRoutes from './routes/auth';
import familiesRoutes from './routes/families';
import expensesRoutes from './routes/expenses';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://family-hub-web.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', logger());

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    version: '0.2.0',
    message: '🏠 FamilyHub API - MVP Complete',
    timestamp: new Date().toISOString(),
    features: ['auth', 'families', 'expenses', 'currency-conversion', 'image-upload'],
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/families', familiesRoutes);
app.route('/api/expenses', expensesRoutes);

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