import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { Env } from '../types';

export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    // Set user info in context
    c.set('userId', payload.userId as number);
    c.set('userEmail', payload.email as string);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}
