import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const families = sqliteTable('families', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const familyMembers = sqliteTable('family_members', {
  userId: integer('user_id').notNull().references(() => users.id),
  familyId: integer('family_id').notNull().references(() => families.id),
  role: text('role').notNull().default('member'),
  colorCode: text('color_code').default('#3B82F6'),
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id').notNull().references(() => families.id),
  createdBy: integer('created_by').notNull().references(() => users.id),
  
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('VND'),
  vndAmount: real('vnd_amount'),
  
  transactionDate: text('transaction_date').notNull(),
  imageUrl: text('image_url'),
  category: text('category'),
  
  metadata: text('metadata'), // JSON field for future OCR data
  
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
