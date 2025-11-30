import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { expenses, familyMembers } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { convertToVND } from '../lib/currency';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { userId: number; userEmail: string } }>();

app.use('*', authMiddleware);

// Tạo expense mới
app.post('/create',
  zValidator('json', z.object({
    familyId: z.number().int().positive(),
    title: z.string().min(1, 'Tiêu đề không được để trống').max(200),
    amount: z.number().positive('Số tiền phải lớn hơn 0'),
    currency: z.string().default('VND'),
    transactionDate: z.string(),
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.string().optional(),
  })),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Check user thuộc family không
      const [membership] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, data.familyId),
          eq(familyMembers.userId, userId)
        ))
        .limit(1);

      if (!membership) {
        return c.json({ error: 'Bạn không thuộc gia đình này' }, 403);
      }

      // Convert sang VND nếu cần
      let vndAmount = data.amount;
      if (data.currency !== 'VND') {
        vndAmount = await convertToVND(data.amount, data.currency, c.env.EXCHANGE_RATE_API_KEY);
      }

      // Tạo expense
      const [expense] = await db.insert(expenses).values({
        familyId: data.familyId,
        createdBy: userId,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        vndAmount,
        transactionDate: data.transactionDate,
        imageUrl: data.imageUrl,
        category: data.category,
        metadata: data.metadata,
      }).returning();

      return c.json({ success: true, expense });
    } catch (error: any) {
      console.error('Create expense error:', error);
      return c.json({ error: 'Tạo chi tiêu thất bại', details: error.message }, 500);
    }
  }
);

// Lấy danh sách expenses của 1 family
app.get('/family/:familyId',
  zValidator('query', z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    category: z.string().optional(),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 50),
    offset: z.string().optional().transform(v => v ? parseInt(v) : 0),
  })),
  async (c) => {
    try {
      const familyId = parseInt(c.req.param('familyId'));
      const { startDate, endDate, category, limit, offset } = c.req.valid('query');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Check membership
      const [membership] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, userId)
        ))
        .limit(1);

      if (!membership) {
        return c.json({ error: 'Bạn không thuộc gia đình này' }, 403);
      }

      // Build query conditions
      const conditions = [eq(expenses.familyId, familyId)];
      if (startDate) conditions.push(gte(expenses.transactionDate, startDate));
      if (endDate) conditions.push(lte(expenses.transactionDate, endDate));
      if (category) conditions.push(eq(expenses.category, category));

      // Query expenses
      const result = await db
        .select()
        .from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.transactionDate))
        .limit(limit as number)
        .offset(offset as number);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
        .where(and(...conditions));

      return c.json({
        success: true,
        expenses: result,
        pagination: {
          total: countResult.count,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('List expenses error:', error);
      return c.json({ error: 'Lấy danh sách chi tiêu thất bại', details: error.message }, 500);
    }
  }
);

// Lấy chi tiết 1 expense
app.get('/:id', async (c) => {
  try {
    const expenseId = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      return c.json({ error: 'Không tìm thấy expense' }, 404);
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, expense.familyId),
        eq(familyMembers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return c.json({ error: 'Bạn không có quyền xem expense này' }, 403);
    }

    return c.json({ success: true, expense });
  } catch (error: any) {
    console.error('Get expense error:', error);
    return c.json({ error: 'Lấy thông tin chi tiêu thất bại', details: error.message }, 500);
  }
});

// Cập nhật expense
app.put('/:id',
  zValidator('json', z.object({
    title: z.string().min(1).max(200).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    transactionDate: z.string().optional(),
    category: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.string().optional(),
  })),
  async (c) => {
    try {
      const expenseId = parseInt(c.req.param('id'));
      const data = c.req.valid('json');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Lấy expense hiện tại
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expenseId))
        .limit(1);

      if (!expense) {
        return c.json({ error: 'Không tìm thấy expense' }, 404);
      }

      // Check membership
      const [membership] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, expense.familyId),
          eq(familyMembers.userId, userId)
        ))
        .limit(1);

      if (!membership) {
        return c.json({ error: 'Bạn không có quyền cập nhật expense này' }, 403);
      }

      // Chỉ creator hoặc admin mới sửa được
      if (expense.createdBy !== userId && membership.role !== 'admin') {
        return c.json({ error: 'Bạn không có quyền sửa expense này' }, 403);
      }

      // Convert VND nếu cần
      let vndAmount = expense.vndAmount;
      if (data.amount && data.currency && data.currency !== 'VND') {
        vndAmount = await convertToVND(data.amount, data.currency, c.env.EXCHANGE_RATE_API_KEY);
      } else if (data.amount) {
        vndAmount = data.amount;
      }

      const [updated] = await db
        .update(expenses)
        .set({ ...data, vndAmount })
        .where(eq(expenses.id, expenseId))
        .returning();

      return c.json({ success: true, expense: updated });
    } catch (error: any) {
      console.error('Update expense error:', error);
      return c.json({ error: 'Cập nhật chi tiêu thất bại', details: error.message }, 500);
    }
  }
);

// Xóa expense
app.delete('/:id', async (c) => {
  try {
    const expenseId = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      return c.json({ error: 'Không tìm thấy expense' }, 404);
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, expense.familyId),
        eq(familyMembers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return c.json({ error: 'Bạn không có quyền xóa expense này' }, 403);
    }

    // Chỉ creator hoặc admin mới xóa được
    if (expense.createdBy !== userId && membership.role !== 'admin') {
      return c.json({ error: 'Bạn không có quyền xóa expense này' }, 403);
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return c.json({ success: true, message: 'Đã xóa expense' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return c.json({ error: 'Xóa chi tiêu thất bại', details: error.message }, 500);
  }
});

// Upload ảnh hóa đơn lên R2
app.post('/upload-receipt', async (c) => {
  try {
    const userId = c.get('userId');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'Không có file được gửi lên' }, 400);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)' }, 400);
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File quá lớn (tối đa 5MB)' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `receipts/${userId}/${timestamp}-${randomStr}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.RECEIPTS.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate URL
    const imageUrl = `https://family-hub-receipts.r2.dev/${filename}`;

    return c.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    return c.json({ error: 'Upload ảnh thất bại', details: error.message }, 500);
  }
});

// Lấy thống kê theo category
app.get('/family/:familyId/stats/by-category', async (c) => {
  try {
    const familyId = parseInt(c.req.param('familyId'));
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    // Check membership
    const [membership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return c.json({ error: 'Bạn không thuộc gia đình này' }, 403);
    }

    const result = await db
      .select({
        category: expenses.category,
        total: sql<number>`sum(${expenses.vndAmount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(eq(expenses.familyId, familyId))
      .groupBy(expenses.category);

    return c.json({ success: true, stats: result });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Lấy thống kê thất bại', details: error.message }, 500);
  }
});

export default app;