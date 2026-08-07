# Manus AI Prompt: Build ALKEMI™ v5.1 (Final Optimized Version)

## ⚠️ CRITICAL: Authoritative Source Document

**You MUST read and follow the attached `ALKEMI_v5.1_Complete_Specification.md` as the single source of truth.** This prompt provides execution guidance and clarifies key requirements, but the specification contains all technical details. If there is any conflict, the v5.1 specification document always takes precedence.

---

## 1. Primary Goal

Your mission is to build the ALKEMI™ Enterprise Formulation Intelligence Platform exactly as specified in the v5.1 document. The final deliverable is a production-ready, multi-tenant web application featuring:

-   **Data Isolation:** Secure multi-tenancy via PostgreSQL Row-Level Security (RLS).
-   **AI Predictions:** Real-time, AI-powered property predictions with robust uncertainty quantification.
-   **Advanced AI Reasoning:** A Multi-LLM Debate Engine for answering complex chemistry questions.
-   **Extensible Architecture:** A pluggable "Domain Pack" architecture for future expansion.

## 2. Technology Stack (MANDATORY)

You must use these exact technologies as specified in the v5.1 document. Do not substitute without explicit approval.

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript 5.x, Tailwind CSS 3.x, shadcn/ui | Per spec §4.1, this is the correct stack (NOT React+Vite). |
| **Backend** | Python 3.11+, FastAPI 0.110+, Pydantic v2, SQLAlchemy 2.x (async) | All database interactions must be asynchronous. |
| **Database** | PostgreSQL 16 with RLS, Redis 7.x | The full schema is in v5.1 §6.3. |
| **Vector Store** | Pinecone (primary) OR pgvector (fallback) | Implement a `VectorStore` interface supporting both, as per ADR-001. |
| **AI/ML** | scikit-learn, XGBoost, PyTorch | For building the scientific prediction models. |
| **LLM Providers** | Anthropic, OpenAI, Google | The system must be multi-provider capable. See model list in §6. |
| **Infrastructure** | Docker, Kubernetes-ready | See deployment details in v5.1 §35. |

---

## 3. Critical Architecture Decisions (Read First)

Before writing any code, you must understand these foundational decisions from the specification (v5.1 §9):

| ADR | Decision | Implication for Implementation |
|---|---|---|
| **ADR-001** | Pinecone + pgvector | Your code must use a generic `VectorStore` interface that can be configured to use either Pinecone (for production) or pgvector (for local dev/fallback). |
| **ADR-002** | Multi-provider LLM | The system must support routing to different LLM providers. Implement provider allowlists and denylists at the organization level. |
| **ADR-003** | Versioned Compliance | Regulatory rules are not hardcoded. They are stored as versioned datasets in the database. Your compliance engine must query these datasets. |
| **ADR-004** | Test Conditions as First-Class Entity | Every measurement (predicted or actual) is meaningless without context. All predictions and trial results MUST be linked to a `test_condition_set`. |

## 4. Implementation Phases & Sprints

Follow this phased roadmap precisely. Complete all deliverables for each sprint before proceeding to the next. Build features **one by one** as listed.

### Phase 1: Foundation (Weeks 1-4)

**Sprint 1.1: Infrastructure**
```bash
# Deliverables:
# - A docker-compose.yml file with services for PostgreSQL 16 and Redis 7.x.
# - Set up Alembic for database migrations.
# - Create the initial migration with the full schema from v5.1 §6.3.
# - Implement PostgreSQL helper functions for RLS: current_org_id(), current_user_id().
```

**Sprint 1.2: RLS Operationalization (CRITICAL)**
```python
# Deliverables:
# - Implement the `scoped_db_session()` context manager from v5.1 §6.5.
# - All database operations throughout the entire application MUST use this session.
# - Write and pass the RLS isolation tests (v5.1 §6.5) before proceeding.
```

**Sprint 1.3: Authentication**
```
# Deliverables:
# - Integrate with Azure AD for SSO (OIDC).
# - Generate JWTs containing `org_id`, `user_id`, and `role` claims.
# - Create a FastAPI middleware that sets the RLS context (`SET LOCAL rls.tenant_id = ...`) for every request.
# - Implement RBAC permission checking middleware.
```

**Sprint 1.4: Core CRUD APIs**
```
# Deliverables (FastAPI endpoints):
# - CRUD for Materials (including properties like Hansen parameters).
# - CRUD for Suppliers (including qualification status).
# - CRUD for Formulation Families and Formulation Versions.
# - CRUD for Test Condition Sets (as per v5.1 §6.6).
```

**Sprint 1.5: Basic UI**
```
# Deliverables (Next.js components):
# - Main application dashboard layout.
# - A searchable and filterable table for the Materials list.
# - The basic Formulation Editor UI (composition entry only, no AI features yet).
```

### Phase 2: Intelligence (Weeks 5-8)

**Sprint 2.1-2.3: Prediction Model Implementation**
```python
# Deliverables:
# 1. Feature Engineering: Implement `FormulationFeatureExtractor` as per v5.1 §19.2.
# 2. Physics Models: Implement all physics-based models from v5.1 §20 (Log-mixing viscosity, HSP distance, etc.).
# 3. ML Models: Implement the XGBoost property predictor and the uncertainty quantification module (v5.1 §21). Set up MLflow for model tracking.
```

**Sprint 2.4: Prediction API**
```python
# Deliverables:
# - A `POST /api/v1/predictions` endpoint.
# - It MUST require a `condition_set_id` in the request (v5.1 fix).
# - The response must include predictions with uncertainty intervals, probability_in_spec, and feature importance for explainability.
```

**Sprint 2.5: Initial LLM Integration**
```python
# Deliverables:
# - Integrate with a single provider first (Anthropic Claude 3.5 Sonnet).
# - Implement the `LLMModel` class correctly, distinguishing between `llm_model_pk` (internal ID) and `provider_model_id` (API string), as per the bug fix in v5.1 §23.
```

### Phase 3: Workflow & Data (Weeks 9-12)

**Sprint 3.1: Approval Workflow**
```
# Deliverables:
# - Implement the formulation state machine: draft → submitted → in_review → approved/rejected.
# - Create API and UI for approval requests, reviews, and comments.
```

**Sprint 3.2: Trials & Test Conditions**
```
# Deliverables:
# - API and UI for recording experimental trial results against a formulation.
# - CRITICAL: All trial data MUST be linked to a `condition_set_id`.
# - Pre-populate standard test conditions for the UV Inks domain (v5.1 §6.6).
```

**Sprint 3.3-3.4: Document RAG System**
```
# Deliverables:
# 1. Document Management: Implement secure S3 uploads, PDF text extraction (PyMuPDF), and document chunking.
# 2. RAG Pipeline: Implement the `VectorStore` interface, embedding generation (e.g., text-embedding-3-large), hybrid search, and source citation in responses (v5.1 §24).
```

### Phase 4: Advanced AI (Weeks 13-16)

**Sprint 4.1-4.2: Secure LLM Router**
```python
# Deliverables:
# 1. LLM Router: Implement the intelligent router with cost budgets and per-org provider allowlists (v5.1 §22.5-22.6).
# 2. Content Redaction: Implement the `ContentRedactor` class to remove sensitive data before sending prompts to external LLMs (v5.1 §22.7).
```

**Sprint 4.3: Multi-LLM Debate Engine**
```python
# Deliverables:
# - Implement the full debate flow from v5.1 §23: Persona Generation → Parallel Consultation → Cross-Critique → Synthesis.
# - Ensure you are using the correct model ID for API calls.
```

**Sprint 4.4: DOE Generator**
```python
# Deliverables:
# - Implement the Design of Experiments generator supporting Latin Hypercube, Factorial, and Response Surface methods (v5.1 §25).
```

### Phase 5: Enterprise Features (Weeks 17-20)

**Sprint 5.1: Supplier Intelligence**
```python
# Deliverables:
# - Implement `find_alternatives()` with similarity scoring and `assess_supplier_risk()` with geographic factors (v5.1 §30).
```

**Sprint 5.2: Versioned Compliance Engine**
```python
# Deliverables:
# - Implement the versioned compliance engine from v5.1 §31.5. Do NOT hardcode rules.
# - The engine must query the `compliance_sources`, `compliance_datasets`, and `compliance_rules` tables.
```

**Sprint 5.3: Analytics & LLM Audit**
```
# Deliverables:
# - Build analytics dashboards for key platform metrics (v5.1 §33).
# - Implement the LLM audit log to track costs, tokens, and prompt hashes.
```

**Sprint 5.4: Polish & Deploy**
```
# Deliverables:
# - Conduct performance testing against latency budgets (v5.1 §34.5).
# - Perform a final security audit, focusing on RLS tests.
# - Finalize documentation and deploy to production.
```
## 5. Non-Functional Requirements (NFRs)

These are not optional. You must enforce these budgets and limits.

### Latency Budgets (v5.1 §34.5)

| Endpoint Class | p95 Target | Hard Limit |
|---|---|---|
| Health/Status | 20ms | 100ms |
| CRUD Operations | 100ms | 300ms |
| Predictions | 500ms | 1000ms |
| AI Quick Answer | 2000ms | 5000ms |
| AI Debate | 15000ms | 30000ms |

### Cost Budgets (v5.1 §22.5)

| Budget | Limit |
|---|---|
| Per LLM request | $1.00 |
| Per user/day | $10.00 |
| Per org/day | $100.00 |

---

## 6. Execution Instructions

1.  **Read the Spec First:** Before starting, read Parts A, B, and C (Sections 1-12) of the specification to understand the full context.
2.  **Build in Order:** Complete each sprint's deliverables sequentially. Do not move to the next sprint until the current one is complete and its mandatory tests are passing.
3.  **Run All Tests:** The specification includes mandatory tests for features like RLS. These must pass before a phase is considered complete.
4.  **Ask for Clarification:** If any part of this prompt or the specification is unclear, ambiguous, or seems contradictory, you must stop and ask for clarification.
5.  **Provide Sprint Updates:** At the end of each sprint, provide a concise summary of what was built, any blockers encountered, and confirm the plan for the next sprint.

**Begin with Phase 1, Sprint 1.1: Infrastructure Setup.** Your first step is to read v5.1 §6.3 for the complete database schema and create the initial Alembic migration.
