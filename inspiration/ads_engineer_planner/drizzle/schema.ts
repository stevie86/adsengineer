import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ROI Calculator Parameters
export const roiParameters = mysqlTable("roiParameters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  monthlyRevenue: int("monthlyRevenue").notNull().default(40000), // in cents
  monthlyAdBudget: int("monthlyAdBudget").notNull().default(15000), // in cents
  lossScenarioMin: int("lossScenarioMin").notNull().default(20), // percentage
  lossScenarioMax: int("lossScenarioMax").notNull().default(35), // percentage
  adsEngineerFee: int("adsEngineerFee").notNull().default(50000), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoiParameters = typeof roiParameters.$inferSelect;
export type InsertRoiParameters = typeof roiParameters.$inferInsert;

// Fixed Costs (Business & Private)
export const fixedCosts = mysqlTable("fixedCosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["business", "private"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FixedCost = typeof fixedCosts.$inferSelect;
export type InsertFixedCost = typeof fixedCosts.$inferInsert;

// Customers
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pipeline", "in_negotiation", "active", "inactive"]).notNull().default("pipeline"),
  monthlyRecurringRevenue: int("monthlyRecurringRevenue").notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;