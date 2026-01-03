import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, roiParameters, InsertRoiParameters, fixedCosts, InsertFixedCost, customers, InsertCustomer } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory mock storage
const mockStore = {
  users: [] as any[],
  roiParameters: [] as any[],
  fixedCosts: [] as any[],
  customers: [] as any[],
};

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using in-memory store for upsertUser");
    const existingIndex = mockStore.users.findIndex(u => u.openId === user.openId);

    if (existingIndex >= 0) {
      mockStore.users[existingIndex] = { ...mockStore.users[existingIndex], ...user, lastSignedIn: user.lastSignedIn || new Date() };
    } else {
      mockStore.users.push({
        id: mockStore.users.length + 1,
        ...user,
        role: user.role || (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
        lastSignedIn: user.lastSignedIn || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return mockStore.users.find(u => u.openId === openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ROI Parameters
export async function getRoiParameters(userId: number) {
  const db = await getDb();
  if (!db) {
    return mockStore.roiParameters.find(p => p.userId === userId) || null;
  }
  const result = await db
    .select()
    .from(roiParameters)
    .where(eq(roiParameters.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertRoiParameters(userId: number, params: Partial<InsertRoiParameters>) {
  const db = await getDb();
  if (!db) {
    const existingIndex = mockStore.roiParameters.findIndex(p => p.userId === userId);
    if (existingIndex >= 0) {
      mockStore.roiParameters[existingIndex] = { ...mockStore.roiParameters[existingIndex], ...params, updatedAt: new Date() };
    } else {
      mockStore.roiParameters.push({ id: mockStore.roiParameters.length + 1, userId, ...params, createdAt: new Date(), updatedAt: new Date() });
    }
    return getRoiParameters(userId);
  }
  const existing = await getRoiParameters(userId);
  if (existing) {
    await db
      .update(roiParameters)
      .set({ ...params, updatedAt: new Date() })
      .where(eq(roiParameters.userId, userId));
    return getRoiParameters(userId);
  } else {
    await db.insert(roiParameters).values({ userId, ...params });
    return getRoiParameters(userId);
  }
}

// Fixed Costs
export async function getFixedCosts(userId: number) {
  const db = await getDb();
  if (!db) {
    return mockStore.fixedCosts.filter(c => c.userId === userId);
  }
  return db.select().from(fixedCosts).where(eq(fixedCosts.userId, userId));
}

export async function createFixedCost(userId: number, cost: Omit<InsertFixedCost, 'userId'>) {
  const db = await getDb();
  if (!db) {
    const newCost = {
      id: Math.floor(Math.random() * 100000),
      userId,
      ...cost,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockStore.fixedCosts.push(newCost);
    return getFixedCosts(userId);
  }
  await db.insert(fixedCosts).values({ userId, ...cost });
  return getFixedCosts(userId);
}

export async function updateFixedCost(id: number, cost: Partial<InsertFixedCost>) {
  const db = await getDb();
  if (!db) {
    const index = mockStore.fixedCosts.findIndex(c => c.id === id);
    if (index >= 0) {
      mockStore.fixedCosts[index] = { ...mockStore.fixedCosts[index], ...cost, updatedAt: new Date() };
    }
    return;
  }
  await db.update(fixedCosts).set({ ...cost, updatedAt: new Date() }).where(eq(fixedCosts.id, id));
}

export async function deleteFixedCost(id: number) {
  const db = await getDb();
  if (!db) {
    mockStore.fixedCosts = mockStore.fixedCosts.filter(c => c.id !== id);
    return;
  }
  await db.delete(fixedCosts).where(eq(fixedCosts.id, id));
}

// Customers
export async function getCustomers(userId: number) {
  const db = await getDb();
  if (!db) {
    return mockStore.customers.filter(c => c.userId === userId);
  }
  return db.select().from(customers).where(eq(customers.userId, userId));
}

export async function createCustomer(userId: number, customer: Omit<InsertCustomer, 'userId'>) {
  const db = await getDb();
  if (!db) {
    const newCustomer = {
      id: Math.floor(Math.random() * 100000),
      userId,
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockStore.customers.push(newCustomer);
    return getCustomers(userId);
  }
  await db.insert(customers).values({ userId, ...customer });
  return getCustomers(userId);
}

export async function updateCustomer(id: number, customer: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) {
    const index = mockStore.customers.findIndex(c => c.id === id);
    if (index >= 0) {
      mockStore.customers[index] = { ...mockStore.customers[index], ...customer, updatedAt: new Date() };
    }
    return;
  }
  await db.update(customers).set({ ...customer, updatedAt: new Date() }).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) {
    mockStore.customers = mockStore.customers.filter(c => c.id !== id);
    return;
  }
  await db.delete(customers).where(eq(customers.id, id));
}
