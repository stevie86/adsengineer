import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getRoiParameters,
  upsertRoiParameters,
  getFixedCosts,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  roi: router({
    getParameters: protectedProcedure.query(async ({ ctx }) => {
      return getRoiParameters(ctx.user.id);
    }),
    updateParameters: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        return upsertRoiParameters(ctx.user.id, input);
      }),
  }),

  costs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getFixedCosts(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        return createFixedCost(ctx.user.id, input as any);
      }),
    update: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        const id = (input as any).id;
        await updateFixedCost(id, input as any);
        return getFixedCosts(ctx.user.id);
      }),
    delete: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        const id = (input as any).id;
        await deleteFixedCost(id);
        return getFixedCosts(ctx.user.id);
      }),
  }),

  customers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCustomers(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        return createCustomer(ctx.user.id, input as any);
      }),
    update: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        const id = (input as any).id;
        await updateCustomer(id, input as any);
        return getCustomers(ctx.user.id);
      }),
    delete: protectedProcedure
      .input((val: unknown) => val as Record<string, unknown>)
      .mutation(async ({ ctx, input }) => {
        const id = (input as any).id;
        await deleteCustomer(id);
        return getCustomers(ctx.user.id);
      }),
  }),

  reports: router({
    getExportCsv: protectedProcedure.query(async ({ ctx }) => {
      const [costs, customers] = await Promise.all([
        getFixedCosts(ctx.user.id),
        getCustomers(ctx.user.id),
      ]);

      const rows = [["Type", "Name", "Value", "Status/Category"].join(",")];

      costs.forEach((c) => {
        rows.push(["Cost", `"${c.description}"`, (c.amount / 100).toFixed(2), c.category].join(","));
      });

      customers.forEach((c) => {
        rows.push(["Customer", `"${c.name}"`, (c.monthlyRecurringRevenue / 100).toFixed(2), c.status].join(","));
      });

      return rows.join("\n");
    }),
    getFullReport: protectedProcedure.query(async ({ ctx }) => {
      const [roi, costs, customers] = await Promise.all([
        getRoiParameters(ctx.user.id),
        getFixedCosts(ctx.user.id),
        getCustomers(ctx.user.id),
      ]);
      return {
        roi,
        costs,
        customers,
        generatedAt: new Date(),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
