import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as predictionEngine from "./predictionEngine";

// ==========================================================
// MIDDLEWARE FOR RBAC
// ==========================================================

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin or manager role required",
    });
  }
  return next({ ctx });
});

// ==========================================================
// VALIDATION SCHEMAS
// ==========================================================

const materialSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  tradeName: z.string().optional(),
  category: z.string().max(64).optional(),
  casNumber: z.string().max(32).optional(),
  domainId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  supplierProductCode: z.string().max(128).optional(),
  density: z.string().optional(),
  viscosity: z.string().optional(),
  molecularWeight: z.string().optional(),
  hansenD: z.string().optional(),
  hansenP: z.string().optional(),
  hansenH: z.string().optional(),
  regulatoryStatus: z.record(z.string(), z.any()).optional(),
  costPerKg: z.string().optional(),
  currency: z.string().length(3).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

const supplierSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  country: z.string().length(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(32).optional(),
  address: z.string().optional(),
  riskScore: z.string().optional(),
  qualificationStatus: z.enum(["pending", "qualified", "disqualified", "under_review"]).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const formulationFamilySchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  description: z.string().optional(),
  domainId: z.string().uuid(),
  targetApplication: z.string().optional(),
  confidentialityLevel: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const formulationVersionSchema = z.object({
  familyId: z.string().uuid(),
  versionNumber: z.string().min(1).max(32),
  parentVersionId: z.string().uuid().optional(),
  branchType: z.enum(["revision", "variant", "cost_reduction", "customer_specific", "experimental"]).optional(),
  targetProperties: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  changeReason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const formulationComponentSchema = z.object({
  versionId: z.string().uuid(),
  materialId: z.string().uuid(),
  percentage: z.string(),
  role: z.string().max(64).optional(),
  notes: z.string().optional(),
});

// ==========================================================
// ROUTERS
// ==========================================================

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==========================================================
  // MATERIALS
  // ==========================================================
  materials: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        domainId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getMaterials(ctx.user.organizationId, input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const material = await db.getMaterialById(input.id, ctx.user.organizationId);
        if (!material) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Material not found" });
        }
        return material;
      }),

    create: protectedProcedure
      .input(materialSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createMaterial({
          ...input,
          organizationId: ctx.user.organizationId,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        data: materialSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateMaterial(input.id, ctx.user.organizationId, input.data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMaterial(input.id, ctx.user.organizationId);
        return { success: true };
      }),
  }),

  // ==========================================================
  // SUPPLIERS
  // ==========================================================
  suppliers: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        qualificationStatus: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getSuppliers(ctx.user.organizationId, input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const supplier = await db.getSupplierById(input.id, ctx.user.organizationId);
        if (!supplier) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }
        return supplier;
      }),

    create: protectedProcedure
      .input(supplierSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createSupplier({
          ...input,
          organizationId: ctx.user.organizationId,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        data: supplierSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateSupplier(input.id, ctx.user.organizationId, input.data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSupplier(input.id, ctx.user.organizationId);
        return { success: true };
      }),
  }),

  // ==========================================================
  // DOMAINS
  // ==========================================================
  domains: router({
    list: protectedProcedure.query(async () => {
      return db.getDomains();
    }),

    organizationDomains: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrganizationDomains(ctx.user.organizationId);
    }),
  }),

  // ==========================================================
  // FORMULATIONS
  // ==========================================================
  formulations: router({
    listFamilies: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        domainId: z.string().uuid().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getFormulationFamilies(ctx.user.organizationId, input);
      }),

    getFamilyById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const family = await db.getFormulationFamilyById(input.id, ctx.user.organizationId);
        if (!family) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation family not found" });
        }
        return family;
      }),

    createFamily: protectedProcedure
      .input(formulationFamilySchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFormulationFamily({
          ...input,
          organizationId: ctx.user.organizationId,
        });
        return { id };
      }),

    listVersions: protectedProcedure
      .input(z.object({ familyId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return db.getFormulationVersions(input.familyId, ctx.user.organizationId);
      }),

    getVersionById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const version = await db.getFormulationVersionById(input.id, ctx.user.organizationId);
        if (!version) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation version not found" });
        }
        return version;
      }),

    createVersion: protectedProcedure
      .input(formulationVersionSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFormulationVersion({
          ...input,
          organizationId: ctx.user.organizationId,
          createdBy: ctx.user.id,
          status: "draft",
        });
        return { id };
      }),

    listComponents: protectedProcedure
      .input(z.object({ versionId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return db.getFormulationComponents(input.versionId, ctx.user.organizationId);
      }),

    addComponent: protectedProcedure
      .input(formulationComponentSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFormulationComponent({
          ...input,
          organizationId: ctx.user.organizationId,
        });
        return { id };
      }),

    removeComponent: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFormulationComponent(input.id, ctx.user.organizationId);
        return { success: true };
      }),
  }),

  // ==========================================================
  // TEST CONDITIONS
  // ==========================================================
  testConditions: router({
    list: protectedProcedure
      .input(z.object({
        domainId: z.string().uuid().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTestConditionSets(ctx.user.organizationId, input?.domainId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const testConditionSet = await db.getTestConditionSetById(input.id, ctx.user.organizationId);
        if (!testConditionSet) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test condition set not found" });
        }
        return testConditionSet;
      }),

    create: protectedProcedure
      .input(z.object({
        domainId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        isStandard: z.boolean().default(false),
        parameters: z.array(z.object({
          parameterName: z.string().min(1),
          parameterValue: z.string().min(1),
          unit: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTestConditionSet({
          ...input,
          organizationId: ctx.user.organizationId,
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTestConditionSet(input.id, ctx.user.organizationId);
        return { success: true };
      }),
  }),

  // ==========================================================
  // PREDICTIONS
  // ==========================================================
  predictions: router({
    list: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getPredictions(ctx.user.organizationId, input?.formulationVersionId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const prediction = await db.getPredictionById(input.id, ctx.user.organizationId);
        if (!prediction) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Prediction not found" });
        }
        return prediction;
      }),

    runPrediction: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid(),
        testConditionSetId: z.string().uuid(),
        propertyName: z.string().min(1),
        targetSpec: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          unit: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Run prediction
        const result = await predictionEngine.predictProperty({
          organizationId: ctx.user.organizationId,
          formulationVersionId: input.formulationVersionId,
          testConditionSetId: input.testConditionSetId,
          propertyName: input.propertyName,
          targetSpec: input.targetSpec,
          requestedBy: ctx.user.id,
        });

        // Store prediction in database
        const predictionId = await predictionEngine.storePrediction(
          {
            organizationId: ctx.user.organizationId,
            formulationVersionId: input.formulationVersionId,
            testConditionSetId: input.testConditionSetId,
            propertyName: input.propertyName,
            targetSpec: input.targetSpec,
            requestedBy: ctx.user.id,
          },
          result
        );

        return {
          id: predictionId,
          ...result,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
