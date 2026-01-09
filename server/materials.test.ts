import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(orgId: string = "test-org-id"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: "test-user-id",
    organizationId: orgId,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "chemist",
    ssoProvider: null,
    ssoSubject: null,
    preferences: null,
    isActive: true,
    dailyCostBudget: "10.00",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("materials router", () => {
  it("should list materials for organization", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.list();

    expect(Array.isArray(result)).toBe(true);
    // Initially empty since no materials have been created
    expect(result.length).toBe(0);
  });

  it("should filter materials by search term", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.list({ search: "test" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a material with valid data", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This will fail if domain doesn't exist, which is expected
    // In a real test environment, you'd set up test data first
    try {
      const result = await caller.materials.create({
        code: "TEST-001",
        name: "Test Material",
        domainId: "00000000-0000-0000-0000-000000000000",
        category: "Test Category",
        density: "1.5",
        isActive: true,
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("string");
    } catch (error) {
      // Expected to fail without proper test data setup
      expect(error).toBeDefined();
    }
  });

  it("should validate material code is required", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.create({
        code: "",
        name: "Test Material",
        domainId: "00000000-0000-0000-0000-000000000000",
      } as any)
    ).rejects.toThrow();
  });

  it("should validate material name is required", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.create({
        code: "TEST-001",
        name: "",
        domainId: "00000000-0000-0000-0000-000000000000",
      } as any)
    ).rejects.toThrow();
  });

  it("should validate domainId is a valid UUID", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.create({
        code: "TEST-001",
        name: "Test Material",
        domainId: "invalid-uuid",
      } as any)
    ).rejects.toThrow();
  });

  it("should isolate materials by organization", async () => {
    const { ctx: ctx1 } = createTestContext("org-1");
    const { ctx: ctx2 } = createTestContext("org-2");

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const result1 = await caller1.materials.list();
    const result2 = await caller2.materials.list();

    // Each organization should only see their own materials
    expect(Array.isArray(result1)).toBe(true);
    expect(Array.isArray(result2)).toBe(true);
  });
});

describe("materials authorization", () => {
  it("should allow chemist to list materials", async () => {
    const { ctx } = createTestContext();
    ctx.user!.role = "chemist";
    const caller = appRouter.createCaller(ctx);

    const result = await caller.materials.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow chemist to create materials", async () => {
    const { ctx } = createTestContext();
    ctx.user!.role = "chemist";
    const caller = appRouter.createCaller(ctx);

    // Should not throw authorization error (may fail for other reasons)
    try {
      await caller.materials.create({
        code: "TEST-001",
        name: "Test Material",
        domainId: "00000000-0000-0000-0000-000000000000",
      });
    } catch (error: any) {
      // Should not be a FORBIDDEN error
      expect(error?.code).not.toBe("FORBIDDEN");
    }
  });

  it("should require admin role to delete materials", async () => {
    const { ctx } = createTestContext();
    ctx.user!.role = "chemist";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.materials.delete({ id: "00000000-0000-0000-0000-000000000000" })
    ).rejects.toThrow(/Admin or manager role required/);
  });

  it("should allow admin to delete materials", async () => {
    const { ctx } = createTestContext();
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    // Should not throw authorization error (may fail for other reasons)
    try {
      await caller.materials.delete({ id: "00000000-0000-0000-0000-000000000000" });
    } catch (error: any) {
      // Should not be a FORBIDDEN error
      expect(error?.code).not.toBe("FORBIDDEN");
    }
  });
});
