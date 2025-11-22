import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Register
app.post(
  '/register',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Email không hợp lệ'),
      password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
      fullName: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const { email, password, fullName } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        return c.json({ error: 'Email đã được sử dụng' }, 400);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          fullName: fullName || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          createdAt: users.createdAt,
        });

      // Generate JWT
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

      return c.json({
        success: true,
        token,
        user,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return c.json({ error: 'Đăng ký thất bại', details: error.message }, 500);
    }
  }
);

// Login
app.post(
  '/login',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Email không hợp lệ'),
      password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
    })
  ),
  async (c) => {
    try {
      const { email, password } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401);
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401);
      }

      // Generate JWT
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

      return c.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return c.json({ error: 'Đăng nhập thất bại', details: error.message }, 500);
    }
  }
);

// Get current user
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const db = drizzle(c.env.DB);
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId as number))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true, user });
  } catch (error: any) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default app;
