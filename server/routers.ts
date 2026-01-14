import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as predictionEngine from "./predictionEngine";
import * as searchService from "./searchService";
import { eq } from "drizzle-orm";
import { 
  materials, 
  suppliers, 
  documents, 
  formulationFamilies, 
  formulationVersions, 
  formulationComponents,
  testConditionSets,
  testConditionParameters,
  predictions,
  predictionFeatures
} from "../drizzle/schema";

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

    assessRisk: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { assessSupplierRisk } = await import("./supplierRiskAssessment");
        return assessSupplierRisk(input.id, ctx.user.organizationId);
      }),

    assessAllRisks: protectedProcedure
      .query(async ({ ctx }) => {
        const { assessAllSuppliers } = await import("./supplierRiskAssessment");
        return assessAllSuppliers(ctx.user.organizationId);
      }),

    findAlternatives: protectedProcedure
      .input(z.object({ materialId: z.string().uuid(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { findAlternativeSuppliers } = await import("./supplierRiskAssessment");
        return findAlternativeSuppliers(input.materialId, ctx.user.organizationId, input.limit);
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

    compare: protectedProcedure
      .input(
        z.object({
          baseVersionId: z.string().uuid(),
          targetVersionId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        const formulationComparison = await import("./formulationComparison");
        return await formulationComparison.compareFormulations(
          input.baseVersionId,
          input.targetVersionId,
          ctx.user.organizationId
        );
      }),

    exportPDF: protectedProcedure
      .input(z.object({ versionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const pdfExport = await import("./pdfExport");
          const pdfBuffer = await pdfExport.generateFormulationPDF(
            input.versionId,
            ctx.user.organizationId
          );
          
          // Convert buffer to base64 for transmission
          const base64Pdf = pdfBuffer.toString("base64");
          return { pdf: base64Pdf };
        } catch (error) {
          console.error("PDF Export Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
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

  // Debate Engine Router
  debate: router({
    conduct: protectedProcedure
      .input(
        z.object({
          question: z.string().min(10),
          context: z.string().optional(),
          domain: z.string().optional(),
          numParticipants: z.number().min(2).max(5).default(3),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const debateEngine = await import("./debateEngine");
        
        const result = await debateEngine.conductDebate({
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          question: input.question,
          context: input.context,
          domain: input.domain,
          numParticipants: input.numParticipants,
        });

        // Store debate session
        await db.createDebateSession({
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          question: input.question,
          context: input.context,
          domain: input.domain,
          numParticipants: input.numParticipants,
          result,
        });

        return result;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDebateSessions(ctx.user.organizationId);
    }),
  }),

  // Approval Workflow Router
  approvals: router({
    create: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string(),
          assignedTo: z.string().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const approvalWorkflow = await import("./approvalWorkflow");
        
        const requestId = await approvalWorkflow.createApprovalRequest({
          organizationId: ctx.user.organizationId,
          formulationVersionId: input.formulationVersionId,
          requestedBy: ctx.user.id,
          assignedTo: input.assignedTo,
          comments: input.comments,
        });

        return { id: requestId };
      }),

    review: protectedProcedure
      .input(
        z.object({
          approvalRequestId: z.string(),
          decision: z.enum(["approve", "reject", "request_revision"]),
          comments: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const approvalWorkflow = await import("./approvalWorkflow");
        
        await approvalWorkflow.reviewApproval({
          approvalRequestId: input.approvalRequestId,
          reviewerId: ctx.user.id,
          decision: input.decision,
          comments: input.comments,
        });

        return { success: true };
      }),

    resubmit: protectedProcedure
      .input(
        z.object({
          approvalRequestId: z.string(),
          comments: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const approvalWorkflow = await import("./approvalWorkflow");
        
        await approvalWorkflow.resubmitAfterRevision(
          input.approvalRequestId,
          ctx.user.id,
          input.comments
        );

        return { success: true };
      }),

    listPending: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPendingApprovalRequests(ctx.user.organizationId);
    }),

    listMyRequests: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMyApprovalRequests(
        ctx.user.organizationId,
        ctx.user.id
      );
    }),

    getHistory: protectedProcedure
      .input(z.object({ approvalRequestId: z.string() }))
      .query(async ({ input }) => {
        return await db.getApprovalReviews(input.approvalRequestId);
      }),

    getByFormulation: protectedProcedure
      .input(z.object({ formulationVersionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getApprovalRequestsByFormulation(
          input.formulationVersionId
        );
      }),
   }),

  documents: router({
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          docType: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.listDocuments(ctx.user.organizationId, {
          search: input.search,
          sourceType: input.docType,
        });
      }),
    upload: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          docType: z.enum(["tds", "msds", "pds", "sop", "report", "lab_notebook", "other"]),
          description: z.string().optional(),
          filename: z.string(),
          fileData: z.string(), // base64
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Import storage helper
        const { storagePut } = await import("./storage");

        // Decode base64 and upload to S3
        const base64Data = input.fileData.split(",")[1] || input.fileData;
        const buffer = Buffer.from(base64Data, "base64");
        const fileKey = `documents/${ctx.user.organizationId}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save to database
        await db.createDocument({
          organizationId: ctx.user.organizationId,
          title: input.title,
          sourceType: input.docType,
          filename: input.filename,
          s3Key: fileKey,
          s3Url: url,
          mimeType: input.mimeType,
          fileSizeBytes: buffer.length,
          uploadedBy: ctx.user.id.toString(),
        });

        return { success: true, url };
      }),
    delete: protectedProcedure
      .input(z.object({ documentId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocument(input.documentId, ctx.user.organizationId);
        // Also delete associated chunks
        await db.deleteDocumentChunks(input.documentId);
        return { success: true };
      }),
    processForRAG: protectedProcedure
      .input(z.object({ documentId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Use native fetch (Node 18+)
        const ragService = await import("./ragService");
        
        // Get document from database
        const doc = await db.getDocumentById(input.documentId, ctx.user.organizationId);
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }
        
        // Only process PDFs
        if (!doc.mimeType?.includes("pdf")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only PDF documents can be processed" });
        }
        
        // Download file from S3
        const response = await fetch(doc.s3Url);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Process document (extract, chunk, embed)
        const result = await ragService.processDocument(
          input.documentId,
          buffer,
          ctx.user.organizationId
        );
        
        return { success: true, ...result };
      }),
    query: protectedProcedure
      .input(
        z.object({
          question: z.string(),
          documentIds: z.array(z.string()).optional(),
          maxChunks: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ragService = await import("./ragService");
        
        const result = await ragService.queryWithRAG(
          input.question,
          ctx.user.organizationId,
          {
            documentIds: input.documentIds,
            maxChunks: input.maxChunks,
          }
        );
        
        // Populate document details in sources
        for (const source of result.sources) {
          const doc = await db.getDocumentById(source.chunk.documentId, ctx.user.organizationId);
          if (doc) {
            source.document.title = doc.title || '';
            source.document.filename = doc.filename || '';
          }
        }
        
        return result;
      }),
  }),

  // Users Management
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.listOrganizationUsers(ctx.user.organizationId);
    }),
    invite: adminProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(["admin", "manager", "chemist", "viewer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // In a real implementation, this would send an invitation email
        // For now, we'll just return success
        // TODO: Implement email invitation system
        return { success: true, message: "Invitation sent" };
      }),
    updateRole: adminProcedure
      .input(z.object({
        userId: z.string(),
        role: z.enum(["admin", "manager", "chemist", "viewer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    remove: adminProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Prevent removing yourself
        if (input.userId === ctx.user.id) {
          throw new Error("Cannot remove yourself");
        }
        await db.deleteUser(input.userId);
        return { success: true };
      }),
  }),

  // Organizations Management
  organizations: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrganizationById(ctx.user.organizationId);
    }),
    update: adminProcedure
      .input(z.object({ name: z.string().min(1).optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateOrganization(ctx.user.organizationId, input);
        return { success: true };
      }),
  }),

  // Compliance
  compliance: router({
    listRules: protectedProcedure
      .input(z.object({ isActive: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.listComplianceRules(ctx.user.organizationId, input);
      }),
    
    listTemplates: protectedProcedure.query(async () => {
      const { getAvailableTemplates } = await import("./complianceTemplates");
      return getAvailableTemplates();
    }),

    activateTemplate: protectedProcedure
      .input(z.object({ templateId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { activateComplianceTemplate } = await import("./complianceTemplates");
        return await activateComplianceTemplate(input.templateId, ctx.user.organizationId);
      }),

    check: protectedProcedure
      .input(z.object({ formulationVersionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const complianceEngine = await import("./complianceEngine");
        return await complianceEngine.checkFormulationCompliance(
          ctx.user.organizationId,
          input.formulationVersionId
        );
      }),
    batchCheck: protectedProcedure
      .input(z.object({ formulationVersionIds: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        const complianceEngine = await import("./complianceEngine");
        const results = await complianceEngine.batchCheckCompliance(
          ctx.user.organizationId,
          input.formulationVersionIds
        );
        return Object.fromEntries(results);
      }),
  }),

  // PDF Reports
  reports: router({
    generateFormulationPDF: protectedProcedure
      .input(z.object({ versionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Fetch formulation data
        const version = await db.getFormulationVersionById(input.versionId, ctx.user.organizationId);
        if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Formulation not found" });
        
        const family = await db.getFormulationFamilyById(version.familyId, ctx.user.organizationId);
        if (!family) throw new TRPCError({ code: "NOT_FOUND", message: "Family not found" });
        
        const components = await db.getFormulationComponents(input.versionId, ctx.user.organizationId);
        
        const { generateFormulationReport } = await import("./pdfReports");
        const pdfBuffer = await generateFormulationReport({
          family: {
            name: family.name,
            code: family.code,
            description: family.description || undefined,
            targetApplication: family.targetApplication || undefined,
          },
          version: {
            versionNumber: version.versionNumber,
            status: version.status,
            createdAt: version.createdAt,
          },
          components: components.map((c: any) => ({
            materialName: c.materialName || "Unknown",
            materialCode: c.materialCode || "",
            weightPercent: c.weightPercent,
            purpose: c.purpose || undefined,
          })),
        });
        
        return {
          filename: `${family.code}_v${version.versionNumber}_Report.pdf`,
          data: pdfBuffer.toString("base64"),
        };
      }),
  }),

  // Advanced Search
  search: router({
    unified: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
          category: z.string().optional(),
          supplierId: z.string().optional(),
          minViscosity: z.number().optional(),
          maxViscosity: z.number().optional(),
          minDensity: z.number().optional(),
          maxDensity: z.number().optional(),
          complianceStatus: z.enum(["compliant", "non-compliant", "unknown"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchService.unifiedSearch(ctx.user.organizationId, input);
      }),

    materials: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
          category: z.string().optional(),
          supplierId: z.string().optional(),
          minViscosity: z.number().optional(),
          maxViscosity: z.number().optional(),
          minDensity: z.number().optional(),
          maxDensity: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchService.searchMaterials(ctx.user.organizationId, input);
      }),

    formulations: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchService.searchFormulations(ctx.user.organizationId, input);
      }),

    documents: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchService.searchDocuments(ctx.user.organizationId, input);
      }),
  }),

  // Demo Data
  demo: router({
    clearAllData: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        // Import trials table
        const { trials, trialMeasurements, complianceRules, predictionFeatures } = await import("../drizzle/schema");

        const orgId = ctx.user.organizationId;
        
        // Delete all data in reverse dependency order
        // Child tables first, then parent tables
        // 1. Trial measurements (depends on trials)
        const trialsList = await database.select({ id: trials.id }).from(trials).where(eq(trials.organizationId, orgId));
        if (trialsList.length > 0) {
          for (const t of trialsList) {
            await database.delete(trialMeasurements).where(eq(trialMeasurements.trialId, t.id));
          }
        }
        // 2. Trials (depends on formulation versions, test conditions)
        await database.delete(trials).where(eq(trials.organizationId, orgId));
        // 3. Prediction features (depends on predictions)
        const predsList = await database.select({ id: predictions.id }).from(predictions).where(eq(predictions.organizationId, orgId));
        if (predsList.length > 0) {
          for (const p of predsList) {
            await database.delete(predictionFeatures).where(eq(predictionFeatures.predictionId, p.id));
          }
        }
        // 4. Predictions (depends on formulation versions, test conditions)
        await database.delete(predictions).where(eq(predictions.organizationId, orgId));
        // 5. Formulation components (depends on formulation versions, materials)
        await database.delete(formulationComponents).where(eq(formulationComponents.organizationId, orgId));
        // 6. Formulation versions (depends on formulation families)
        await database.delete(formulationVersions).where(eq(formulationVersions.organizationId, orgId));
        // 7. Formulation families
        await database.delete(formulationFamilies).where(eq(formulationFamilies.organizationId, orgId));
        // 8. Test condition parameters (depends on test condition sets)
        await database.delete(testConditionParameters).where(
          eq(testConditionParameters.testConditionSetId, 
            database.select({ id: testConditionSets.id }).from(testConditionSets).where(eq(testConditionSets.organizationId, orgId))
          )
        ).catch(() => {}); // Ignore if no matching records
        // 9. Test condition sets
        await database.delete(testConditionSets).where(eq(testConditionSets.organizationId, orgId));
        // 10. Materials (depends on suppliers)
        await database.delete(materials).where(eq(materials.organizationId, orgId));
        // 11. Suppliers
        await database.delete(suppliers).where(eq(suppliers.organizationId, orgId));
        // 12. Documents
        await database.delete(documents).where(eq(documents.organizationId, orgId));
        // 13. Compliance rules
        await database.delete(complianceRules).where(eq(complianceRules.organizationId, orgId));
        
        return { success: true, message: "All workspace data cleared successfully" };
      } catch (error: any) {
        console.error("Clear data error:", error);
        return { success: false, message: error.message };
      }
    }),
    
    seedData: protectedProcedure.mutation(async ({ ctx }) => {
        const { seedDemoDataSimple } = await import("./seedDemoDataSimple");
        return await seedDemoDataSimple(ctx.user.organizationId, ctx.user.id);
      }),
  }),

  // Analytics
  analytics: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const analyticsService = await import("./analyticsService");
      return await analyticsService.getAnalyticsSummary(ctx.user.organizationId);
    }),
    predictionAccuracy: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(365).optional() }))
      .query(async ({ ctx, input }) => {
        const analyticsService = await import("./analyticsService");
        return await analyticsService.getPredictionAccuracyTrend(
          ctx.user.organizationId,
          input.days || 30
        );
      }),
    trialSuccess: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(365).optional() }))
      .query(async ({ ctx, input }) => {
        const analyticsService = await import("./analyticsService");
        return await analyticsService.getTrialSuccessMetrics(
          ctx.user.organizationId,
          input.days || 30
        );
      }),
    formulationTimeline: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(365).optional() }))
      .query(async ({ ctx, input }) => {
        const analyticsService = await import("./analyticsService");
        return await analyticsService.getFormulationTimeline(
          ctx.user.organizationId,
          input.days || 30
        );
      }),
  }),

  // DOE Generator
  doe: router({
    generateLHS: protectedProcedure
      .input(
        z.object({
          factors: z.array(
            z.object({
              name: z.string(),
              min: z.number(),
              max: z.number(),
              unit: z.string().optional(),
            })
          ),
          numSamples: z.number().min(4).max(1000),
          seed: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const doeGen = await import("./doeGenerator");
        return doeGen.generateLatinHypercube(input.factors, input.numSamples, input.seed);
      }),
    generateFactorial: protectedProcedure
      .input(
        z.object({
          factors: z.array(
            z.object({
              name: z.string(),
              min: z.number(),
              max: z.number(),
              unit: z.string().optional(),
            })
          ),
          levelsPerFactor: z.number().min(2).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const doeGen = await import("./doeGenerator");
        return doeGen.generateFullFactorial(input.factors, input.levelsPerFactor);
      }),
    generateFractional: protectedProcedure
      .input(
        z.object({
          factors: z.array(
            z.object({
              name: z.string(),
              min: z.number(),
              max: z.number(),
              unit: z.string().optional(),
            })
          ),
          resolution: z.enum(["III", "IV", "V"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const doeGen = await import("./doeGenerator");
        return doeGen.generateFractionalFactorial(input.factors, input.resolution);
      }),
    generateCCD: protectedProcedure
      .input(
        z.object({
          factors: z.array(
            z.object({
              name: z.string(),
              min: z.number(),
              max: z.number(),
              unit: z.string().optional(),
            })
          ),
          centerPoints: z.number().min(1).max(10).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const doeGen = await import("./doeGenerator");
        return doeGen.generateCentralComposite(input.factors, input.centerPoints);
      }),
  }),

  // Supplier Intelligence
  supplierIntelligence: router({
    findAlternatives: protectedProcedure
      .input(
        z.object({
          materialId: z.string().uuid(),
          minSimilarity: z.number().min(0).max(1).optional(),
          maxResults: z.number().min(1).max(20).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const supplierIntel = await import("./supplierIntelligence");
        return await supplierIntel.findMaterialAlternatives(
          input.materialId,
          ctx.user.organizationId,
          {
            minSimilarity: input.minSimilarity,
            maxResults: input.maxResults,
          }
        );
      }),
    assessRisk: protectedProcedure
      .input(z.object({ supplierId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const supplierIntel = await import("./supplierIntelligence");
        return await supplierIntel.assessSupplierRisk(
          input.supplierId,
          ctx.user.organizationId
        );
      }),
    findBackups: protectedProcedure
      .input(z.object({ materialId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const supplierIntel = await import("./supplierIntelligence");
        return await supplierIntel.findBackupSuppliers(
          input.materialId,
          ctx.user.organizationId
        );
      }),
  }),

  // Trials Management
  trials: router({
    list: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string().optional(),
          testConditionSetId: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.listTrials(ctx.user.organizationId, input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string().uuid(),
          testConditionSetId: z.string().uuid(),
          trialCode: z.string().min(1),
          conductedAt: z.string().transform(str => new Date(str)),
          notes: z.string().optional(),
          measurements: z.array(
            z.object({
              propertyName: z.string(),
              measuredValue: z.string(),
              unit: z.string().optional(),
              measurementError: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trialId = await db.createTrial({
          organizationId: ctx.user.organizationId,
          formulationVersionId: input.formulationVersionId,
          testConditionSetId: input.testConditionSetId,
          trialCode: input.trialCode,
          conductedBy: ctx.user.id,
          conductedAt: input.conductedAt,
          notes: input.notes,
          measurements: input.measurements,
        });
        return { success: true, trialId };
      }),
    get: protectedProcedure
      .input(z.object({ trialId: z.string() }))
      .query(async ({ ctx, input }) => {
        const trial = await db.getTrialById(input.trialId, ctx.user.organizationId);
        if (!trial) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trial not found" });
        }
        const measurements = await db.getTrialMeasurements(input.trialId);
        return { trial, measurements };
      }),
    compare: protectedProcedure
      .input(z.object({ trialId: z.string() }))
      .query(async ({ ctx, input }) => {
        const comparison = await db.compareTrialWithPrediction(
          input.trialId,
          ctx.user.organizationId
        );
        if (!comparison) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trial not found" });
        }
        return comparison;
      }),
    delete: protectedProcedure
      .input(z.object({ trialId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTrial(input.trialId, ctx.user.organizationId);
        return { success: true };
      }),
  }),

  // ==========================================================
  // REVERSE ENGINEERING & COMPETITOR ANALYSIS
  // ==========================================================
  reverseEngineering: router({
    createCompetitorProduct: protectedProcedure
      .input(z.object({
        productName: z.string().min(1),
        manufacturer: z.string().min(1),
        productCode: z.string().optional(),
        category: z.string().optional(),
        domainId: z.string().uuid().optional(),
        marketingClaims: z.array(z.string()).optional(),
        technicalDataSheet: z.string().optional(),
        msdsData: z.string().optional(),
        observedProperties: z.record(z.string(), z.any()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const productId = await db.createCompetitorProduct({
          organizationId: ctx.user.organizationId,
          userId: ctx.user.id,
          ...input,
        });
        return { success: true, productId };
      }),

    listCompetitorProducts: protectedProcedure
      .input(z.object({
        domainId: z.string().uuid().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const products = await db.listCompetitorProducts(ctx.user.organizationId, input);
        return products;
      }),

    getCompetitorProduct: protectedProcedure
      .input(z.object({ productId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const product = await db.getCompetitorProductById(input.productId, ctx.user.organizationId);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Competitor product not found" });
        }
        return product;
      }),

    deleteCompetitorProduct: protectedProcedure
      .input(z.object({ productId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCompetitorProduct(input.productId, ctx.user.organizationId);
        return { success: true };
      }),

    analyzeProduct: protectedProcedure
      .input(z.object({ productId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { performCompleteAnalysis } = await import("./reverseEngineering");
        const results = await performCompleteAnalysis(
          input.productId,
          ctx.user.organizationId,
          ctx.user.id
        );
        return { success: true, results };
      }),

    listAnalyses: protectedProcedure
      .input(z.object({ competitorProductId: z.string().uuid().optional() }))
      .query(async ({ ctx, input }) => {
        const analyses = await db.listReverseEngineeringAnalyses(
          ctx.user.organizationId,
          input.competitorProductId
        );
        return analyses;
      }),

    getAnalysis: protectedProcedure
      .input(z.object({ analysisId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getReverseEngineeringAnalysisById(
          input.analysisId,
          ctx.user.organizationId
        );
        if (!analysis) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
        }
        return analysis;
      }),

    seedTestProducts: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { seedCompetitorProducts, TEST_COMPETITOR_PRODUCTS } = await import("./seedCompetitorProducts");
        await seedCompetitorProducts(ctx.user.organizationId, ctx.user.id);
        return { 
          success: true, 
          count: TEST_COMPETITOR_PRODUCTS.length,
          message: `Successfully seeded ${TEST_COMPETITOR_PRODUCTS.length} test competitor products` 
        };
      }),
  }),

  // Patent & Literature Analysis
  patents: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const patents = await db.listPatents(ctx.user.organizationId);
        return patents;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const patent = await db.getPatentById(input.id, ctx.user.organizationId);
        if (!patent) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Patent not found" });
        }
        return patent;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        patentNumber: z.string().optional(),
        publicationDate: z.string().optional(),
        inventors: z.array(z.string()).optional(),
        assignee: z.string().optional(),
        abstract: z.string().optional(),
        fullText: z.string().optional(),
        pdfUrl: z.string().url().optional(),
        sourceUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const patentId = await db.createPatent({
          organizationId: ctx.user.organizationId,
          uploadedBy: ctx.user.id,
          ...input,
        });
        return { patentId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePatent(input.id, ctx.user.organizationId);
        return { success: true };
      }),

    analyze: protectedProcedure
      .input(z.object({ patentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const patent = await db.getPatentById(input.patentId, ctx.user.organizationId);
        if (!patent) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Patent not found" });
        }

        if (!patent.fullText) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Patent must have full text to analyze" });
        }

        const { analyzePatent } = await import("./patentAnalysis");
        const analysis = await analyzePatent(
          patent.id,
          patent.title,
          patent.abstract || "",
          patent.fullText
        );

        const analysisId = await db.createPatentAnalysis({
          patentId: patent.id,
          organizationId: ctx.user.organizationId,
          chemicalCompounds: analysis.compounds,
          reactionMechanisms: analysis.mechanisms,
          processingConditions: analysis.processingConditions,
          technologyCategory: analysis.technologyLandscape.category,
          keyInnovations: analysis.technologyLandscape.keyInnovations,
          competitorAnalysis: analysis.technologyLandscape.competitorAnalysis,
          marketApplications: analysis.technologyLandscape.marketApplications,
          formulationStrategies: analysis.formulationStrategies,
          analyzedBy: ctx.user.id,
        });

        return { analysisId, analysis };
      }),

    getAnalysis: protectedProcedure
      .input(z.object({ patentId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getPatentAnalysisByPatentId(input.patentId, ctx.user.organizationId);
        return analysis;
      }),
  }),

  // Equipment Management & Compatibility
  equipment: router({
    list: protectedProcedure
      .input(z.object({
        equipmentType: z.string().optional(),
        status: z.enum(["operational", "maintenance", "offline", "decommissioned"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const equipment = await db.listEquipment(ctx.user.organizationId, input);
        return equipment;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const equipment = await db.getEquipmentById(input.id, ctx.user.organizationId);
        if (!equipment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Equipment not found" });
        }
        return equipment;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        equipmentType: z.string().min(1),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        location: z.string().optional(),
        capacity: z.object({ value: z.number(), unit: z.string() }).optional(),
        operatingTemperatureRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        operatingPressureRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        mixingSpeedRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        powerRating: z.object({ value: z.number(), unit: z.string() }).optional(),
        compatibleMaterialTypes: z.array(z.string()).optional(),
        incompatibleMaterials: z.array(z.string()).optional(),
        materialContactSurfaces: z.array(z.string()).optional(),
        supportedProcesses: z.array(z.string()).optional(),
        cleaningRequirements: z.string().optional(),
        changeoverTime: z.string().optional(),
        status: z.enum(["operational", "maintenance", "offline", "decommissioned"]).optional(),
        lastMaintenanceDate: z.date().optional(),
        nextMaintenanceDate: z.date().optional(),
        maintenanceNotes: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createEquipment({
          organizationId: ctx.user.organizationId,
          ...input,
        });
        return { equipmentId: result.insertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        equipmentType: z.string().min(1).optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        location: z.string().optional(),
        capacity: z.object({ value: z.number(), unit: z.string() }).optional(),
        operatingTemperatureRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        operatingPressureRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        mixingSpeedRange: z.object({ min: z.number(), max: z.number(), unit: z.string() }).optional(),
        powerRating: z.object({ value: z.number(), unit: z.string() }).optional(),
        compatibleMaterialTypes: z.array(z.string()).optional(),
        incompatibleMaterials: z.array(z.string()).optional(),
        materialContactSurfaces: z.array(z.string()).optional(),
        supportedProcesses: z.array(z.string()).optional(),
        cleaningRequirements: z.string().optional(),
        changeoverTime: z.string().optional(),
        status: z.enum(["operational", "maintenance", "offline", "decommissioned"]).optional(),
        lastMaintenanceDate: z.date().optional(),
        nextMaintenanceDate: z.date().optional(),
        maintenanceNotes: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateEquipment(id, ctx.user.organizationId, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEquipment(input.id, ctx.user.organizationId);
        return { success: true };
      }),

    analyzeCompatibility: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid(),
        equipmentId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get formulation version with components
        const formulation = await db.getFormulationVersionById(input.formulationVersionId, ctx.user.organizationId);
        if (!formulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation not found" });
        }

        const components = await db.getFormulationComponents(input.formulationVersionId, ctx.user.organizationId);

        // Get equipment
        const equipment = await db.getEquipmentById(input.equipmentId, ctx.user.organizationId);
        if (!equipment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Equipment not found" });
        }

        // Perform compatibility analysis
        const { analyzeEquipmentCompatibility } = await import("./equipmentCompatibility");
        const analysis = await analyzeEquipmentCompatibility(
          {
            id: formulation.id,
            versionNumber: formulation.versionNumber,
            components: components.map(c => ({
              materialId: c.component.materialId,
              materialName: c.material.name || "",
              percentage: parseFloat(c.component.percentage),
            })),

          },
          equipment as any
        );

        // Save analysis to database
        await db.createCompatibilityAnalysis({
          organizationId: ctx.user.organizationId,
          formulationVersionId: input.formulationVersionId,
          equipmentId: input.equipmentId,
          isCompatible: analysis.isCompatible,
          compatibilityScore: analysis.compatibilityScore.toString(),
          incompatibilityReasons: analysis.incompatibilityReasons,
          requiredModifications: analysis.requiredModifications,
          processingConstraints: analysis.processingConstraints,
          analyzedBy: ctx.user.id,
        });

        return analysis;
      }),

    getCompatibilityAnalysis: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid(),
        equipmentId: z.string().uuid(),
      }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getCompatibilityAnalysis(
          input.formulationVersionId,
          input.equipmentId,
          ctx.user.organizationId
        );
        return analysis;
      }),

    listCompatibilityAnalyses: protectedProcedure
      .input(z.object({ formulationVersionId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const analyses = await db.listCompatibilityAnalyses(
          input.formulationVersionId,
          ctx.user.organizationId
        );
        return analyses;
      }),

    findCompatibleEquipment: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid(),
        minCompatibilityScore: z.number().min(0).max(100).optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Get formulation
        const formulation = await db.getFormulationVersionById(input.formulationVersionId, ctx.user.organizationId);
        if (!formulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation not found" });
        }

        const components = await db.getFormulationComponents(input.formulationVersionId, ctx.user.organizationId);

        // Get all equipment
        const allEquipment = await db.listEquipment(ctx.user.organizationId, { status: "operational" });

        // Find compatible equipment
        const { findCompatibleEquipment } = await import("./equipmentCompatibility");
        const compatibleEquipment = await findCompatibleEquipment(
          {
            id: formulation.id,
            versionNumber: formulation.versionNumber,
            components: components.map(c => ({
              materialId: c.component.materialId,
              materialName: c.material.name || "",
              percentage: parseFloat(c.component.percentage),
            })),

          },
          allEquipment as any,
          input.minCompatibilityScore
        );

        return compatibleEquipment;
      }),
  }),

  // Scale-Up Risk Analysis
  scaleup: router({
    analyze: protectedProcedure
      .input(z.object({
        formulationVersionId: z.string().uuid(),
        labScale: z.object({ volume: z.number(), unit: z.string() }),
        pilotScale: z.object({ volume: z.number(), unit: z.string() }),
        targetScale: z.object({ volume: z.number(), unit: z.string() }).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get formulation
        const formulation = await db.getFormulationVersionById(input.formulationVersionId, ctx.user.organizationId);
        if (!formulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation not found" });
        }

        const components = await db.getFormulationComponents(input.formulationVersionId, ctx.user.organizationId);

        // Perform scale-up analysis
        const { analyzeScaleUpRisks } = await import("./scaleUpAnalysis");
        const analysis = await analyzeScaleUpRisks(
          {
            id: formulation.id,
            versionNumber: formulation.versionNumber,
            components: components.map(c => ({
              materialId: c.component.materialId,
              materialName: c.material.name || "",
              percentage: parseFloat(c.component.percentage),
            })),
          },
          input.labScale,
          input.pilotScale,
          input.targetScale
        );

        // Save analysis to database
        const result = await db.createScaleUpAnalysis({
          organizationId: ctx.user.organizationId,
          formulationVersionId: input.formulationVersionId,
          labScale: input.labScale,
          pilotScale: input.pilotScale,
          targetScale: input.targetScale,
          reactionType: analysis.reactionType,
          rateConstant: analysis.rateConstant,
          activationEnergy: analysis.activationEnergy,
          reactionOrder: analysis.reactionOrder,
          heatGenerationRate: analysis.heatGenerationRate,
          coolingCapacityLab: analysis.coolingCapacityLab,
          coolingCapacityPilot: analysis.coolingCapacityPilot,
          temperatureRisePrediction: analysis.temperatureRisePrediction,
          mixingTimeLab: analysis.mixingTimeLab,
          mixingTimePilot: analysis.mixingTimePilot,
          reynoldsNumberLab: analysis.reynoldsNumberLab,
          reynoldsNumberPilot: analysis.reynoldsNumberPilot,
          powerPerVolumeLab: analysis.powerPerVolumeLab,
          powerPerVolumePilot: analysis.powerPerVolumePilot,
          overallRiskScore: analysis.overallRiskScore,
          riskLevel: analysis.riskLevel,
          identifiedRisks: analysis.identifiedRisks,
          processModifications: analysis.processModifications,
          equipmentRecommendations: analysis.equipmentRecommendations,
          controlStrategyChanges: analysis.controlStrategyChanges,
          additionalTestingNeeded: analysis.additionalTestingNeeded,
          analyzedBy: ctx.user.id,
          notes: input.notes,
        });

        return result;
      }),

    list: protectedProcedure
      .input(z.object({ formulationVersionId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const analyses = await db.listScaleUpAnalyses(
          input.formulationVersionId,
          ctx.user.organizationId
        );
        return analyses;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getScaleUpAnalysisById(input.id, ctx.user.organizationId);
        if (!analysis) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
        }
        return analysis;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScaleUpAnalysis(input.id, ctx.user.organizationId);
        return { success: true };
      }),

    generateScenarios: protectedProcedure
      .input(z.object({
        analysisId: z.string().uuid(),
        formulationVersionId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get formulation and analysis
        const formulation = await db.getFormulationVersionById(input.formulationVersionId, ctx.user.organizationId);
        if (!formulation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Formulation not found" });
        }

        const analysis = await db.getScaleUpAnalysisById(input.analysisId, ctx.user.organizationId);
        if (!analysis) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
        }

        const components = await db.getFormulationComponents(input.formulationVersionId, ctx.user.organizationId);

        // Generate scenarios
        const { generateScaleUpScenarios } = await import("./scaleUpAnalysis");
        const scenarios = await generateScaleUpScenarios(
          {
            id: formulation.id,
            versionNumber: formulation.versionNumber,
            components: components.map(c => ({
              materialId: c.component.materialId,
              materialName: c.material.name || "",
              percentage: parseFloat(c.component.percentage),
            })),
          },
          input.analysisId,
          {
            labScale: analysis.labScale as { volume: number; unit: string },
            pilotScale: analysis.pilotScale as { volume: number; unit: string },
          }
        );

        // Save scenarios to database
        const savedScenarios = await Promise.all(
          scenarios.map(scenario =>
            db.createScaleUpScenario({
              organizationId: ctx.user.organizationId,
              analysisId: input.analysisId,
              scenarioName: scenario.scenarioName,
              description: scenario.description,
              temperature: scenario.temperature,
              pressure: scenario.pressure,
              mixingSpeed: scenario.mixingSpeed,
              additionRate: scenario.additionRate,
              holdTime: scenario.holdTime,
              predictedYield: scenario.predictedYield,
              predictedQuality: scenario.predictedQuality,
              predictedCycleTime: scenario.predictedCycleTime,
              predictedCost: scenario.predictedCost,
              successProbability: scenario.successProbability,
              confidenceLevel: scenario.confidenceLevel,
            })
          )
        );

        return savedScenarios;
      }),

    listScenarios: protectedProcedure
      .input(z.object({ analysisId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const scenarios = await db.listScaleUpScenarios(
          input.analysisId,
          ctx.user.organizationId
        );
        return scenarios;
      }),
  }),

  manufacturingDocs: router({
    generateSOP: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string().uuid(),
          batchSize: z.number().positive(),
          batchUnit: z.string(),
          equipmentIds: z.array(z.string().uuid()).optional(),
          safetyLevel: z.enum(["standard", "high", "critical"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { generateSOP } = await import("./manufacturingDocs");
        const result = await generateSOP({
          ...input,
          organizationId: ctx.user.organizationId,
        });

        const doc = await db.createManufacturingDocument({
          formulationVersionId: input.formulationVersionId,
          organizationId: ctx.user.organizationId,
          documentType: "sop",
          title: result.title,
          batchSize: input.batchSize,
          batchUnit: input.batchUnit,
          equipmentIds: input.equipmentIds,
          safetyPrecautions: result.safetyPrecautions,
          qualityCheckpoints: result.qualityCheckpoints,
          generatedContent: result.content,
          createdBy: ctx.user.id,
        });

        for (const step of result.steps) {
          await db.createManufacturingStep({
            documentId: doc.insertId as any,
            stepNumber: step.stepNumber,
            stepName: step.stepName,
            description: step.description,
            duration: step.duration,
            temperature: step.temperature,
            temperatureUnit: step.temperatureUnit,
            criticalParameters: step.criticalParameters,
            safetyNotes: step.safetyNotes,
            qualityChecks: step.qualityChecks || undefined,
          });
        }

        return { documentId: doc.insertId, ...result };
      }),

    generateBatchProcess: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string().uuid(),
          batchSize: z.number().positive(),
          batchUnit: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { generateBatchProcess } = await import("./manufacturingDocs");
        const result = await generateBatchProcess({
          ...input,
          organizationId: ctx.user.organizationId,
        });

        const doc = await db.createManufacturingDocument({
          formulationVersionId: input.formulationVersionId,
          organizationId: ctx.user.organizationId,
          documentType: "batch_process",
          title: result.title,
          batchSize: input.batchSize,
          batchUnit: input.batchUnit,
          generatedContent: result.content,
          createdBy: ctx.user.id,
        });

        return { documentId: doc.insertId, ...result };
      }),

    generateProcessFlowDiagram: protectedProcedure
      .input(z.object({ formulationVersionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { generateProcessFlowDiagram } = await import("./manufacturingDocs");
        const result = await generateProcessFlowDiagram(
          input.formulationVersionId,
          ctx.user.organizationId
        );
        return result;
      }),

    listDocuments: protectedProcedure
      .input(z.object({ documentType: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.listManufacturingDocuments(
          ctx.user.organizationId,
          input.documentType
        );
      }),

    getDocument: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const doc = await db.getManufacturingDocumentById(
          input.id,
          ctx.user.organizationId
        );
        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        const steps = await db.listManufacturingSteps(input.id);
        return { ...doc, steps };
      }),
  }),

  // Issue Tracking & Improvement System
  issues: router({
    create: protectedProcedure
      .input(
        z.object({
          formulationVersionId: z.string().uuid().optional(),
          trialId: z.string().uuid().optional(),
          issueType: z.enum([
            "quality_defect",
            "process_failure",
            "scale_up_issue",
            "supplier_issue",
            "equipment_malfunction",
            "safety_incident",
            "compliance_violation",
            "other",
          ]),
          severity: z.enum(["critical", "high", "medium", "low"]),
          title: z.string().min(1),
          description: z.string().min(1),
          affectedBatches: z.array(z.string()).optional(),
          costImpact: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createIssue({
          ...input,
          organizationId: ctx.user.organizationId,
          reportedBy: ctx.user.id,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          severity: z.string().optional(),
          issueType: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.listIssues(ctx.user.organizationId, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const issue = await db.getIssueById(input.id, ctx.user.organizationId);
        if (!issue) throw new TRPCError({ code: "NOT_FOUND" });
        const analyses = await db.getIssueAnalyses(input.id);
        return { ...issue, analyses };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: z.string().optional(),
          rootCause: z.string().optional(),
          correctiveAction: z.string().optional(),
          preventiveAction: z.string().optional(),
          assignedTo: z.string().uuid().optional(),
          resolvedBy: z.string().uuid().optional(),
          resolvedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateIssue(id, ctx.user.organizationId, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteIssue(input.id, ctx.user.organizationId);
      }),

    analyzeRootCause: protectedProcedure
      .input(z.object({ issueId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { analyzeRootCause } = await import("./issueTracking");
        return analyzeRootCause(input.issueId, ctx.user.organizationId);
      }),

    detectPatterns: protectedProcedure.query(async ({ ctx }) => {
      const { detectIssuePatterns } = await import("./issueTracking");
      return detectIssuePatterns(ctx.user.organizationId);
    }),

    findSimilar: protectedProcedure
      .input(z.object({ issueId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { findSimilarIssues } = await import("./issueTracking");
        return findSimilarIssues(input.issueId, ctx.user.organizationId);
      }),

    generateRecommendations: protectedProcedure
      .input(z.object({ issueId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { generateImprovementRecommendations } = await import("./issueTracking");
        return generateImprovementRecommendations(input.issueId, ctx.user.organizationId);
      }),
  }),

  improvementActions: router({
    create: protectedProcedure
      .input(
        z.object({
          issueId: z.string().uuid().optional(),
          actionType: z.enum([
            "process_change",
            "training",
            "equipment_upgrade",
            "supplier_change",
            "formulation_modification",
            "procedure_update",
            "other",
          ]),
          title: z.string().min(1),
          description: z.string().min(1),
          priority: z.enum(["critical", "high", "medium", "low"]),
          expectedImpact: z.string().optional(),
          estimatedCost: z.number().optional(),
          assignedTo: z.string().uuid().optional(),
          dueDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createImprovementAction({
          ...input,
          organizationId: ctx.user.organizationId,
          createdBy: ctx.user.id,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          issueId: z.string().uuid().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.listImprovementActions(ctx.user.organizationId, input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: z.string().optional(),
          actualImpact: z.string().optional(),
          actualCost: z.number().optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateImprovementAction(id, ctx.user.organizationId, data);
      }),
  }),
});
export type AppRouter = typeof appRouter;
