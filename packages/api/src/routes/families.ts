import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { families, familyMembers, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { userId: number; userEmail: string } }>();

// Tất cả routes cần auth
app.use('*', authMiddleware);

// Tạo gia đình mới
app.post('/create',
  zValidator('json', z.object({
    name: z.string().min(1, 'Tên gia đình không được để trống').max(100),
  })),
  async (c) => {
    try {
      const { name } = c.req.valid('json');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Tạo family
      const [family] = await db.insert(families).values({
        name,
        createdBy: userId,
      }).returning();

      // Thêm creator làm admin
      await db.insert(familyMembers).values({
        userId,
        familyId: family.id,
        role: 'admin',
        colorCode: '#3B82F6',
      });

      return c.json({ success: true, family });
    } catch (error: any) {
      console.error('Create family error:', error);
      return c.json({ error: 'Tạo gia đình thất bại', details: error.message }, 500);
    }
  }
);

// Lấy danh sách gia đình của user
app.get('/list', async (c) => {
  try {
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    const result = await db
      .select({
        id: families.id,
        name: families.name,
        createdBy: families.createdBy,
        createdAt: families.createdAt,
        role: familyMembers.role,
        colorCode: familyMembers.colorCode,
        joinedAt: familyMembers.joinedAt,
      })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId));

    return c.json({ success: true, families: result });
  } catch (error: any) {
    console.error('List families error:', error);
    return c.json({ error: 'Lấy danh sách gia đình thất bại', details: error.message }, 500);
  }
});

// Lấy thông tin chi tiết 1 gia đình
app.get('/:id', async (c) => {
  try {
    const familyId = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    // Check user có thuộc family không
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

    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.id, familyId))
      .limit(1);

    return c.json({ success: true, family, membership });
  } catch (error: any) {
    console.error('Get family error:', error);
    return c.json({ error: 'Lấy thông tin gia đình thất bại', details: error.message }, 500);
  }
});

// Lấy danh sách thành viên
app.get('/:id/members', async (c) => {
  try {
    const familyId = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = drizzle(c.env.DB);

    // Check user có thuộc family không
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

    // Lấy danh sách members
    const members = await db
      .select({
        userId: familyMembers.userId,
        role: familyMembers.role,
        colorCode: familyMembers.colorCode,
        joinedAt: familyMembers.joinedAt,
        email: users.email,
        fullName: users.fullName,
      })
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, familyId));

    return c.json({ success: true, members });
  } catch (error: any) {
    console.error('Get members error:', error);
    return c.json({ error: 'Lấy danh sách thành viên thất bại', details: error.message }, 500);
  }
});

// Mời thành viên vào gia đình (bằng email)
app.post('/:id/invite',
  zValidator('json', z.object({
    email: z.string().email('Email không hợp lệ'),
    role: z.enum(['admin', 'member']).default('member'),
  })),
  async (c) => {
    try {
      const familyId = parseInt(c.req.param('id'));
      const { email, role } = c.req.valid('json');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Check user có quyền admin không
      const [membership] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, userId),
          eq(familyMembers.role, 'admin')
        ))
        .limit(1);

      if (!membership) {
        return c.json({ error: 'Chỉ admin mới có thể mời thành viên' }, 403);
      }

      // Tìm user được mời
      const [invitedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!invitedUser) {
        return c.json({ error: 'Không tìm thấy user với email này' }, 404);
      }

      // Check đã là thành viên chưa
      const [existing] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, invitedUser.id)
        ))
        .limit(1);

      if (existing) {
        return c.json({ error: 'User này đã là thành viên' }, 400);
      }

      // Thêm thành viên mới
      await db.insert(familyMembers).values({
        userId: invitedUser.id,
        familyId,
        role,
        colorCode: '#' + Math.floor(Math.random()*16777215).toString(16),
      });

      return c.json({ success: true, message: 'Đã mời thành viên thành công' });
    } catch (error: any) {
      console.error('Invite member error:', error);
      return c.json({ error: 'Mời thành viên thất bại', details: error.message }, 500);
    }
  }
);

// Cập nhật thông tin gia đình
app.put('/:id',
  zValidator('json', z.object({
    name: z.string().min(1).max(100).optional(),
  })),
  async (c) => {
    try {
      const familyId = parseInt(c.req.param('id'));
      const { name } = c.req.valid('json');
      const userId = c.get('userId');
      const db = drizzle(c.env.DB);

      // Check user có quyền admin không
      const [membership] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.userId, userId),
          eq(familyMembers.role, 'admin')
        ))
        .limit(1);

      if (!membership) {
        return c.json({ error: 'Chỉ admin mới có thể cập nhật thông tin' }, 403);
      }

      const [updated] = await db
        .update(families)
        .set({ name })
        .where(eq(families.id, familyId))
        .returning();

      return c.json({ success: true, family: updated });
    } catch (error: any) {
      console.error('Update family error:', error);
      return c.json({ error: 'Cập nhật gia đình thất bại', details: error.message }, 500);
    }
  }
);

export default app;