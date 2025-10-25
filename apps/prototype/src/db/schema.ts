import { integer, pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const customer = pgTable('customer', {
  id: varchar({ length: 255 }).primaryKey(),
  tenantId: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
}, (table) => [
  index('idx_customer_tenant_id').on(table.tenantId),
  index('idx_customer_email').on(table.email),
]);

export const booking = pgTable('booking', {
  id: varchar({ length: 255 }).primaryKey(),
  tenantId: varchar({ length: 255 }).notNull(),
  customerId: varchar({ length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  date: timestamp().notNull(),
  status: varchar({ length: 50 }).notNull(), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price: integer().notNull(),
  currency: varchar({ length: 10 }).notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
}, (table) => [
  // Primary access patterns
  index('idx_booking_tenant_id').on(table.tenantId),
  index('idx_booking_customer_id').on(table.customerId),
  
  // Date-based queries (most critical for range queries)
  index('idx_booking_date').on(table.date), // Simple date lookups
  index('idx_booking_tenant_id_date').on(table.tenantId, table.date), // Tenant + date range (common pattern)
  
  // Status filtering with date (e.g., "show me all confirmed bookings in date range")
  index('idx_booking_tenant_id_status_date').on(table.tenantId, table.status, table.date),
  index('idx_booking_status_date').on(table.status, table.date), // Cross-tenant status + date queries
  
  // Customer-based queries with date
  index('idx_booking_customer_id_date').on(table.customerId, table.date), // Customer booking history
  
  // Audit/time-based queries
  index('idx_booking_created_at').on(table.createdAt), // For analytics/reporting
  index('idx_booking_tenant_id_created_at').on(table.tenantId, table.createdAt), // Tenant creation reports
  
  // Covering index for common list queries (includes commonly selected columns)
  index('idx_booking_tenant_date_status_covering').on(table.tenantId, table.date, table.status, table.customerId),
]);
