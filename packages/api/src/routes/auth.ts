import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gt } from 'drizzle-orm';
import { users, otpCodes } from '../db/schema';
import { sendOTPEmailViaN8n, generateOTP } from '../lib/email';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Đăng ký: Bước 1 - Gửi OTP
app.post('/register/request-otp',
  zValidator('json', z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    fullName: z.string().optional(),
    turnstileToken: z.string().min(1, 'Vui lòng xác thực anti-bot'),
  })),
  async (c) => {
    try {
      const { email, password, fullName, turnstileToken } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      // Anti-bot
      const tsResult = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: c.env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
        }
      ).then(r => r.json());
      if (!tsResult.success) return c.json({ error: 'Xác thực anti-bot thất bại' }, 400);

      // Check user tồn tại
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) return c.json({ error: 'Email đã được sử dụng' }, 400);

      // Sinh OTP & lưu DB
      const otp = generateOTP();
      await db.insert(otpCodes).values({
        email,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

      // Gửi OTP qua n8n
      await sendOTPEmailViaN8n(c.env.N8N_WEBHOOK_URL, email, otp, fullName);

      // Hash password (lưu temp bên FE)
      const passwordHash = await bcrypt.hash(password, 10);

      return c.json({
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
        tempData: { email, passwordHash, fullName },
      });
    } catch (error: any) {
      console.error('Request OTP error:', error);
      return c.json({ error: 'Gửi mã OTP thất bại', details: error.message }, 500);
    }
  }
);

// Đăng ký: Bước 2 - Xác thực OTP
app.post('/register/verify-otp',
  zValidator('json', z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
    passwordHash: z.string(),
    fullName: z.string().optional(),
  })),
  async (c) => {
    try {
      const { email, otp, passwordHash, fullName } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      // Check OTP hợp lệ
      const [rec] = await db.select().from(otpCodes)
        .where(and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, otp),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date().toISOString())
        )).limit(1);
      if (!rec) return c.json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn' }, 400);

      // Đánh dấu OTP đã sử dụng
      await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, rec.id));

      // Lưu user mới vào DB
      const [user] = await db.insert(users).values({
        email,
        passwordHash,
        fullName: fullName || null,
        emailVerified: true,
      }).returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      });

      // Tạo JWT
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt().setExpirationTime('7d').sign(secret);

      return c.json({ success: true, token, user });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return c.json({ error: 'Xác thực OTP thất bại', details: error.message }, 500);
    }
  });


// Gửi lại OTP
app.post('/register/resend-otp',
  zValidator('json', z.object({
    email: z.string().email(),
    fullName: z.string().optional(),
  })),
  async (c) => {
    try {
      const { email, fullName } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      // Sinh OTP mới & lưu DB
      const otp = generateOTP();
      await db.insert(otpCodes).values({
        email,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

      // Gửi mail qua n8n
      await sendOTPEmailViaN8n(c.env.N8N_WEBHOOK_URL, email, otp, fullName);
      return c.json({ success: true, message: 'Mã OTP mới đã được gửi' });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return c.json({ error: 'Gửi lại OTP thất bại', details: error.message }, 500);
    }
  });

// Đăng nhập
app.post('/login',
  zValidator('json', z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  })),
  async (c) => {
    try {
      const { email, password } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401);

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401);

      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);

      return c.json({
        success: true, token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return c.json({ error: 'Đăng nhập thất bại', details: error.message }, 500);
    }
  }
);

// Lấy thông tin user hiện tại
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return c.json({ error: 'Unauthorized' }, 401);

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const db = drizzle(c.env.DB);
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId as number))
      .limit(1);

    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ success: true, user });
  } catch (error: any) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default app;
