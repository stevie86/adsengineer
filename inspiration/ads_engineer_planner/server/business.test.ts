import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

let userCounter = 1;

function createAuthContext(userId?: number): { ctx: TrpcContext } {
  const id = userId || userCounter++;
  const user: User = {
    id,
    openId: `test-user-${id}`,
    email: `test${id}@example.com`,
    name: `Test User ${id}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("ROI Calculator", () => {
  it("should calculate saved revenue correctly", () => {
    const monthlyRevenue = 40000; // 400 EUR
    const lossMin = 20; // 20%
    const lossMax = 35; // 35%

    const savedMin = (monthlyRevenue * lossMin) / 100;
    const savedMax = (monthlyRevenue * lossMax) / 100;

    expect(savedMin).toBe(8000); // 80 EUR
    expect(savedMax).toBe(14000); // 140 EUR
  });

  it("should calculate ROI factor correctly", () => {
    const savedRevenue = 8000; // 80 EUR in cents
    const fee = 50000; // 500 EUR in cents

    const roiFactor = savedRevenue / (fee / 100);

    expect(roiFactor).toBeCloseTo(16, 1); // ~16x ROI
  });

  it("should update ROI parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Update parameters
    const updated = await caller.roi.updateParameters({
      monthlyRevenue: 50000,
      lossScenarioMin: 25,
      lossScenarioMax: 40,
    });

    expect(updated?.monthlyRevenue).toBe(50000);
    expect(updated?.lossScenarioMin).toBe(25);
    expect(updated?.lossScenarioMax).toBe(40);
  });
});

describe("Fixed Costs Management", () => {
  it("should create and retrieve business costs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a business cost
    const costs = await caller.costs.create({
      category: "business",
      description: "Cloudflare",
      amount: 5500, // 55 EUR
    });

    expect(costs).toBeDefined();
    expect(costs?.length).toBeGreaterThan(0);
    expect(costs?.[0]?.description).toBe("Cloudflare");
    expect(costs?.[0]?.amount).toBe(5500);
  });

  it("should create and retrieve private costs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a private cost
    const costs = await caller.costs.create({
      category: "private",
      description: "Miete",
      amount: 140000, // 1400 EUR
    });

    expect(costs).toBeDefined();
    expect(costs?.length).toBeGreaterThan(0);
    expect(costs?.[0]?.category).toBe("private");
    expect(costs?.[0]?.amount).toBe(140000);
  });

  it("should calculate total fixed costs correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create costs
    await caller.costs.create({
      category: "business",
      description: "Cloudflare",
      amount: 5500, // 55 EUR
    });

    await caller.costs.create({
      category: "business",
      description: "Steuerberater",
      amount: 25000, // 250 EUR
    });

    await caller.costs.create({
      category: "private",
      description: "Miete",
      amount: 140000, // 1400 EUR
    });

    const costs = await caller.costs.list();

    const totalCosts = costs?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const businessTotal = costs?.filter((c) => c.category === "business").reduce((sum, c) => sum + c.amount, 0) || 0;
    const privateTotal = costs?.filter((c) => c.category === "private").reduce((sum, c) => sum + c.amount, 0) || 0;

    expect(totalCosts).toBe(170500); // 1705 EUR
    expect(businessTotal).toBe(30500); // 305 EUR
    expect(privateTotal).toBe(140000); // 1400 EUR
  });
});

describe("Customer Management", () => {
  it("should create a customer", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a customer
    const customers = await caller.customers.create({
      name: "Mycannaby",
      status: "in_negotiation",
      monthlyRecurringRevenue: 50000, // 500 EUR
    });

    expect(customers).toBeDefined();
    expect(customers?.length).toBeGreaterThan(0);
    expect(customers?.[0]?.name).toBe("Mycannaby");
    expect(customers?.[0]?.status).toBe("in_negotiation");
    expect(customers?.[0]?.monthlyRecurringRevenue).toBe(50000);
  });

  it("should update customer status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a customer
    const createResult = await caller.customers.create({
      name: "SwissFX",
      status: "pipeline",
      monthlyRecurringRevenue: 100000, // 1000 EUR
    });

    const customerId = createResult?.[0]?.id;
    expect(customerId).toBeDefined();

    // Update status
    const updated = await caller.customers.update({
      id: customerId,
      status: "active",
    });

    expect(updated?.[0]?.status).toBe("active");
  });

  it("should calculate total MRR correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create multiple customers
    await caller.customers.create({
      name: "Mycannaby",
      status: "in_negotiation",
      monthlyRecurringRevenue: 50000, // 500 EUR
    });

    await caller.customers.create({
      name: "SwissFX",
      status: "pipeline",
      monthlyRecurringRevenue: 100000, // 1000 EUR
    });

    const customers = await caller.customers.list();

    const totalMRR = customers?.reduce((sum, c) => sum + c.monthlyRecurringRevenue, 0) || 0;

    expect(totalMRR).toBe(150000); // 1500 EUR
  });

  it("should calculate coverage percentage correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create costs
    await caller.costs.create({
      category: "business",
      description: "Business Costs",
      amount: 30500, // 305 EUR
    });

    await caller.costs.create({
      category: "private",
      description: "Private Costs",
      amount: 140000, // 1400 EUR
    });

    // Create customers
    await caller.customers.create({
      name: "Customer 1",
      status: "active",
      monthlyRecurringRevenue: 50000, // 500 EUR
    });

    await caller.customers.create({
      name: "Customer 2",
      status: "active",
      monthlyRecurringRevenue: 100000, // 1000 EUR
    });

    const costs = await caller.costs.list();
    const customers = await caller.customers.list();

    const totalCosts = costs?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalMRR = customers?.reduce((sum, c) => sum + c.monthlyRecurringRevenue, 0) || 0;

    const coveragePercentage = totalCosts > 0 ? Math.round((totalMRR / totalCosts) * 100) : 0;

    expect(totalCosts).toBe(170500); // 1705 EUR
    expect(totalMRR).toBe(150000); // 1500 EUR
    expect(coveragePercentage).toBe(88); // ~88%
  });
});

describe("Freedom Number Calculation", () => {
  it("should calculate freedom number correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create business costs
    await caller.costs.create({
      category: "business",
      description: "Cloudflare / n8n / Tools",
      amount: 5500, // 55 EUR
    });

    await caller.costs.create({
      category: "business",
      description: "Steuerberater / Sozial",
      amount: 25000, // 250 EUR
    });

    // Create private costs
    await caller.costs.create({
      category: "private",
      description: "Miete & NK (Lissabon)",
      amount: 140000, // 1400 EUR
    });

    await caller.costs.create({
      category: "private",
      description: "Lebenshaltung (Essen etc.)",
      amount: 60000, // 600 EUR
    });

    await caller.costs.create({
      category: "private",
      description: "Support Sohn (Österreich)",
      amount: 50000, // 500 EUR
    });

    await caller.costs.create({
      category: "private",
      description: "Puffer / Gesundheit",
      amount: 30000, // 300 EUR
    });

    const costs = await caller.costs.list();

    const businessTotal = costs?.filter((c) => c.category === "business").reduce((sum, c) => sum + c.amount, 0) || 0;
    const privateTotal = costs?.filter((c) => c.category === "private").reduce((sum, c) => sum + c.amount, 0) || 0;
    const freedomNumber = businessTotal + privateTotal;

    expect(businessTotal).toBe(30500); // 305 EUR
    expect(privateTotal).toBe(280000); // 2800 EUR
    expect(freedomNumber).toBe(310500); // 3105 EUR
  });
});
