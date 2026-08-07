# ALKEMI™ — Enterprise Formulation Intelligence Platform
## *"Formulations at the Speed of Thought"*
### Version 5.1 Final | Complete Engineering Specification

---

# Document Control

| Field | Value |
|-------|-------|
| **Product Name** | ALKEMI™ |
| **Tagline** | Formulations at the Speed of Thought |
| **Version** | 5.1 Final (Consolidated Final) |
| **Status** | Production-Ready Specification |
| **Classification** | CONFIDENTIAL — Proprietary |
| **Last Updated** | January 2026 |
| **Primary Audience** | Engineering, Data Science, Product, Security, QA |

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | Jan 2026 | Complete engineering spec with UX, physics, code |
| 4.1 | Jan 2026 | Improved schema, RLS, data digitization, cold start |
| **5.1** | **Jan 2026** | **Final merge: v4.1 architecture + v3.1 implementations** |

---

# How to Use This Document

This document is the **single source of truth** for building ALKEMI using AI-assisted development platforms (Replit AI, Manus AI, Cursor, etc.).

**What's Included:**
1. **Explicit Design Decisions** — No ambiguity, no "TBD"
2. **Complete Database Schema** — PostgreSQL 16 with RLS
3. **Full API Specifications** — Request/response examples
4. **ASCII Wireframes** — Visual specs for every screen
5. **Production Code** — Python, TypeScript, React components
6. **Physics Implementations** — Mathematical formulas with code
7. **AI/ML Systems** — LLM routing, predictions, uncertainty, debate

**Implementation Order:** Follow Section 37 for phased delivery.

---

# Table of Contents

## Part A: Foundation
1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Platform Strategy](#3-platform-strategy)
4. [Technology Stack](#4-technology-stack)

## Part B: Architecture
5. [System Architecture](#5-system-architecture)
6. [Database Schema](#6-database-schema)
7. [API Specifications](#7-api-specifications)
8. [Security Framework](#8-security-framework)

## Part C: Core Platform
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Data Quality Framework](#10-data-quality-framework)
11. [Workflow Engine](#11-workflow-engine)
12. [File Storage & Documents](#12-file-storage--documents)

## Part D: User Experience
13. [Design System](#13-design-system)
14. [Onboarding Flow](#14-onboarding-flow)
15. [Dashboard](#15-dashboard)
16. [Formulation Editor](#16-formulation-editor)
17. [Approval Workflow UI](#17-approval-workflow-ui)
18. [Quick Tools](#18-quick-tools)

## Part E: Intelligence Layer
19. [Scientific Prediction Engine](#19-scientific-prediction-engine)
20. [Physics Constraints Library](#20-physics-constraints-library)
21. [Uncertainty Quantification](#21-uncertainty-quantification)
22. [Intelligent LLM Router](#22-intelligent-llm-router)
23. [Multi-LLM Debate Engine](#23-multi-llm-debate-engine)
24. [RAG System](#24-rag-system)
25. [DOE Generator](#25-doe-generator)

## Part F: Domain Packs
26. [Domain Pack Framework](#26-domain-pack-framework)
27. [UV Inks & Coatings Domain](#27-uv-inks--coatings-domain)
28. [Personal Care Domain](#28-personal-care-domain)
29. [Specialty Chemicals Domain](#29-specialty-chemicals-domain)

## Part G: Supporting Modules
30. [Supplier Intelligence](#30-supplier-intelligence)
31. [Regulatory Compliance Engine](#31-regulatory-compliance-engine)
32. [Feedback & Learning System](#32-feedback--learning-system)
33. [Analytics & Reporting](#33-analytics--reporting)

## Part H: Operations
34. [Performance & Scalability](#34-performance--scalability)
35. [Deployment & DevOps](#35-deployment--devops)
36. [Monitoring & Alerting](#36-monitoring--alerting)
37. [User Adoption Strategy](#37-user-adoption-strategy)

## Part I: Implementation
38. [Implementation Roadmap](#38-implementation-roadmap)
39. [Success Metrics](#39-success-metrics)
40. [Risk Mitigation](#40-risk-mitigation)
41. [Appendices](#41-appendices)

---

# PART A: FOUNDATION

---

# 1. Executive Summary

## 1.1 What is ALKEMI?

**ALKEMI** — *"Formulations at the Speed of Thought"*

ALKEMI is an **enterprise formulation intelligence platform** that combines:

- **Formulation Repository** with version control (branching, lineage, immutable history)
- **AI-Powered Property Prediction** with uncertainty quantification and explainability
- **Multi-LLM Expert Debate** for troubleshooting, optimization, and decision justification
- **Supplier Intelligence** (alternatives discovery, risk assessment, pricing signals)
- **Regulatory Governance** with audit trails and compliance screening

## 1.2 Target Users

| Role | Primary Activities | Daily Actions |
|------|-------------------|---------------|
| **R&D Chemist** | Create formulations, run predictions, record trials | 20-50 |
| **Senior Chemist** | Review formulations, troubleshoot issues, mentor | 10-20 |
| **R&D Manager** | Approve formulations, track portfolio, allocate resources | 5-15 |
| **Production** | Execute approved recipes, log batch data, report deviations | 10-30 |
| **Procurement** | Find alternatives, assess supplier risk, negotiate | 5-15 |

## 1.3 Value Propositions

| Metric | Current State | With ALKEMI |
|--------|---------------|-------------|
| Formulation development time | 6 months | 3 months |
| First-time-right rate | 35% | 65%+ |
| Time to identify alternatives | 2 weeks | 4 hours |
| Knowledge captured digitally | ~10% | 90%+ |
| Regulatory compliance errors | Manual checking | Automated screening |

## 1.4 Core Design Principles

1. **Chemistry-Native** — UI speaks formulation language (ingredients, specs, trials), not software jargon
2. **Trust by Construction** — Uncertainty, provenance, audit logs; no black-box outputs
3. **Best Model Always** — Intelligent routing selects optimal LLM for each task
4. **Fast to Value** — Usable with partial data; cold-start supported
5. **Enterprise-Ready** — SSO, RBAC, RLS, encryption, monitoring
6. **Domain Extensible** — New chemistry domains deployable in weeks, not quarters
7. **Speed of Thought** — Real-time predictions and suggestions as you formulate

---

# 2. Business Context

## 2.1 Deployment Units

| Unit | Primary Use Cases |
|------|-------------------|
| **R&D Labs** | Formulation creation, property prediction, trial design |
| **Production Plants** | Approved recipe execution, batch feedback, deviation logging |
| **Procurement** | Alternative discovery, supplier risk assessment, cost optimization |
| **Compliance** | Regulatory screening, audit trail generation, documentation |

## 2.2 Data Sources

| Source | Format | Volume Estimate |
|--------|--------|-----------------|
| Historical formulations | Excel, CSV | 500-2,000 per domain |
| Lab notebooks | Paper, PDF | 10-50 notebooks |
| Production batch data | ERP exports | 1,000+ batches/year |
| Supplier documents | TDS, MSDS, PDS (PDF) | 200-500 documents |
| Internal SOPs | Word, PDF | 50-100 documents |

## 2.3 Data Digitization Workflow

Historical data digitization is a **first-class capability** in ALKEMI.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DATA DIGITIZATION PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  SCAN   │───▶│   OCR   │───▶│ EXTRACT │───▶│ REVIEW  │───▶│VALIDATE │  │
│  │300+ DPI │    │AI-based │    │  JSON   │    │ Human   │    │  Rules  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                     │       │
│                                                                     ▼       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PRODUCTION DATABASE                              │   │
│  │  materials, formulation_families, formulation_versions, trials      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  HARD RULE: No historical record used for training unless status=validated │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.4 Outcomes Targeted

- **Reduce** formulation development cycle time by 50%
- **Increase** first-time-right rate from 35% to 65%+
- **Accelerate** compliant alternative identification from weeks to hours
- **Prevent** knowledge loss when experienced chemists leave
- **Enable** reproducible, auditable decision-making

---

# 3. Platform Strategy

## 3.1 Architecture: Core Platform + Domain Packs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALKEMI ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DOMAIN PACKS (Pluggable)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │   │
│  │  │  UV Inks &  │  │  Personal   │  │  Specialty  │  │  Future   │   │   │
│  │  │  Coatings   │  │    Care     │  │  Chemicals  │  │  Domains  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CORE PLATFORM (Shared)                           │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Auth   │ │Formulation│ │ Material │ │ Workflow │ │  Audit   │  │   │
│  │  │   RBAC   │ │Repository │ │ Database │ │  Engine  │ │   Log    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │Prediction│ │   LLM    │ │   RAG    │ │   DOE    │ │ Supplier │  │   │
│  │  │  Engine  │ │  Router  │ │  System  │ │Generator │ │  Intel   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Component Reusability Matrix

| Component | Reusability | Domain-Specific Elements |
|-----------|-------------|--------------------------|
| Authentication/RBAC | 100% | Role names only |
| Formulation Repository | 100% | None |
| Workflow Engine | 100% | Approval rules |
| Material Database | 90% | Property schema |
| UI Framework | 95% | Function colors |
| Prediction Engine | 70% | Models, features |
| Physics Constraints | 0% | Fully domain-specific |
| Property Models | 0% | Fully domain-specific |

## 3.3 Standalone-First, Integrate-Later

ALKEMI delivers **full value without ERP/LIMS integration**. Integrations are optional adapters:

| Integration | Data Flow | Priority |
|-------------|-----------|----------|
| ERP | Costs, supplier master, batch IDs | Optional |
| LIMS | Test results, instrument data | Optional |
| PLM | Product lifecycle, approvals | Future |

## 3.4 "Human + AI" Operating Model

AI is **advisory**. The system enforces:
- Explicit **specifications** and **constraints**
- **Human approval gates** for production promotion
- **Explainability artifacts** stored alongside decisions
- **Audit trails** for regulatory compliance

---

# 4. Technology Stack

## 4.1 Frontend

```yaml
framework: Next.js 14 (App Router)
language: TypeScript 5.x
styling: Tailwind CSS 3.x
state: Zustand + React Query (TanStack Query)
components: shadcn/ui + custom chemistry components
charts: Recharts + D3.js
command_palette: cmdk
animations: Framer Motion
```

## 4.2 Backend

```yaml
framework: FastAPI (Python 3.11+)
validation: Pydantic v2
orm: SQLAlchemy 2.x (async)
migrations: Alembic
task_queue: Celery + Redis
websockets: FastAPI WebSockets (for streaming)
```

## 4.3 Data & Storage

```yaml
database: PostgreSQL 16
  extensions:
    - uuid-ossp
    - pgcrypto
    - pg_trgm (text search)
    - vector (optional, for embeddings)
cache: Redis 7.x
vector_store: Pinecone (primary) or pgvector
object_storage: S3-compatible (AWS S3 / MinIO)
search: PostgreSQL full-text + trigram (OpenSearch optional)
```

## 4.4 AI/ML Stack

```yaml
# LLM Providers (Intelligent Router selects best model)
llm_providers:
  anthropic:
    - claude-opus-4-5-20251101      # Flagship - complex reasoning
    - claude-sonnet-4-5-20250929    # Standard - balanced
    - claude-haiku-4-5-20251001     # Fast - quick responses
  openai:
    - gpt-4.5-turbo-2025            # Flagship
    - gpt-4o-2025                   # Standard
    - gpt-4o-mini-2025              # Fast
  google:
    - gemini-2.0-ultra              # Flagship (1M context)
    - gemini-2.0-pro                # Standard
    - gemini-2.0-flash              # Fast

# Model Selection by Task Type
task_routing:
  formulation_troubleshooting: flagship
  multi_expert_debate: flagship
  regulatory_analysis: flagship
  property_explanation: standard
  material_comparison: standard
  quick_answer: fast
  autocomplete: fast

# ML Framework
ml_framework: PyTorch 2.x, scikit-learn, XGBoost
model_registry: MLflow
cheminformatics: RDKit (SMILES validation, fingerprints)
embeddings: OpenAI text-embedding-3-large
```

## 4.5 Infrastructure

```yaml
container: Docker
orchestration: Kubernetes (production) / Docker Compose (dev)
ci_cd: GitHub Actions
secrets: AWS Secrets Manager / HashiCorp Vault
monitoring: Prometheus + Grafana
logging: OpenTelemetry + Loki
errors: Sentry
```

---

# PART B: ARCHITECTURE

---

# 5. System Architecture

## 5.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ALKEMI SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           PRESENTATION LAYER                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Web App   │  │  Mobile App │  │   API SDK   │  │   Webhooks  │    │   │
│  │  │  (Next.js)  │  │   (Future)  │  │  (Python)   │  │  (Outbound) │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼───────────┘   │
│            │                │                │                │               │
│            ▼                ▼                ▼                ▼               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            API GATEWAY                                   │   │
│  │  • Rate Limiting  • Authentication  • Request Routing  • Logging        │   │
│  └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                  │                                             │
│            ┌─────────────────────┼─────────────────────┐                       │
│            ▼                     ▼                     ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   API SERVICE   │  │   AI SERVICES   │  │ BACKGROUND JOBS │                │
│  │                 │  │                 │  │                 │                │
│  │ • Auth/RBAC     │  │ • Predictions   │  │ • Data Import   │                │
│  │ • Formulations  │  │ • LLM Router    │  │ • Model Training│                │
│  │ • Materials     │  │ • Debate Engine │  │ • Report Gen    │                │
│  │ • Workflows     │  │ • RAG Service   │  │ • Notifications │                │
│  │ • Approvals     │  │ • DOE Generator │  │ • Cleanup       │                │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                │
│           │                    │                    │                          │
│           ▼                    ▼                    ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           DATA LAYER                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │   │
│  │  │  PostgreSQL  │  │    Redis     │  │   Pinecone   │  │     S3     │   │   │
│  │  │  (Primary)   │  │   (Cache)    │  │  (Vectors)   │  │  (Files)   │   │   │
│  │  │  + RLS       │  │  + Sessions  │  │  + RAG       │  │  + Docs    │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Request Flow Example: Property Prediction

```
┌──────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
│Client│───▶│API Gate │───▶│API Svc  │───▶│Prediction│───▶│ Domain   │
│      │    │         │    │         │    │ Service  │    │ Pack     │
└──────┘    └─────────┘    └─────────┘    └──────────┘    └──────────┘
   │                           │               │               │
   │  1. POST /predictions     │               │               │
   │  + JWT token              │               │               │
   │ ─────────────────────────▶│               │               │
   │                           │               │               │
   │            2. Validate JWT, set RLS       │               │
   │            3. Load formulation            │               │
   │                           │───────────────▶               │
   │                           │  4. Extract features          │
   │                           │               │───────────────▶
   │                           │               │  5. Get models │
   │                           │               │◀───────────────│
   │                           │  6. Run predictions           │
   │                           │               │               │
   │                           │  7. Quantify uncertainty      │
   │                           │               │               │
   │                           │  8. Check physics constraints │
   │                           │               │               │
   │                           │◀──────────────│               │
   │            9. Store results               │               │
   │◀──────────────────────────│               │               │
   │  10. Return predictions   │               │               │
   │      + uncertainty        │               │               │
```

## 5.3 Multi-Tenancy Architecture

**Hard Requirement:** No tenant data access without matching `organization_id`.

**Enforcement Layers:**

| Layer | Mechanism | Failure Mode |
|-------|-----------|--------------|
| **Database** | PostgreSQL RLS policies | Query returns empty |
| **API** | JWT claim extraction + context setting | 403 Forbidden |
| **Application** | Service layer validation | Exception raised |

```python
# API Middleware: Setting tenant context
async def set_tenant_context(request: Request, db: AsyncSession):
    """Extract org from JWT and set RLS context"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    claims = decode_jwt(token)
    org_id = claims.get("org")
    
    if not org_id:
        raise HTTPException(403, "Organization context required")
    
    # Set PostgreSQL session variable for RLS
    await db.execute(text(f"SET LOCAL app.org_id = '{org_id}'"))
    
    return org_id
```

---

# 6. Database Schema

## 6.1 Design Principles

- **Multi-tenant isolation** via RLS (Row-Level Security)
- **Immutable history** for regulated workflows
- **Family + Version separation** for formulation evolution
- **Queryable structure** for reporting and analytics
- **JSONB flexibility** where schema varies by domain

## 6.2 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ALKEMI DATA MODEL                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  organizations ◄──────┬───────────────────────────────────────────────────┐ │
│       │               │                                                   │ │
│       ▼               ▼                                                   │ │
│    users          domains ◄──── organization_domains                      │ │
│                       │                                                   │ │
│                       ▼                                                   │ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │                     MATERIALS & SUPPLIERS                           │ │ │
│  │  suppliers ◄─── material_suppliers ───► materials                   │ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │ │
│                                               │                           │ │
│                                               ▼                           │ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │                        FORMULATIONS                                 │ │ │
│  │  formulation_families ◄─── formulation_versions                     │ │ │
│  │                                    │                                │ │ │
│  │                    ┌───────────────┼───────────────┐                │ │ │
│  │                    ▼               ▼               ▼                │ │ │
│  │           ingredients          specs        process_steps           │ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │ │
│                                    │                                     │ │
│                    ┌───────────────┼───────────────┐                     │ │
│                    ▼               ▼               ▼                     │ │
│                 trials        predictions    approval_requests           │ │
│                    │                                                     │ │
│                    ▼                                                     │ │
│            production_batches                                            │ │
│                                                                          │ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │                     SUPPORTING ENTITIES                             │ │ │
│  │  documents    ingestion_jobs    ingestion_records    audit_log      │ │ │
│  │  llm_models                                                         │ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │ │
│                                                                          │ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.3 Complete PostgreSQL Schema

```sql
-- ==========================================================
-- ALKEMI v5.0 — Production Schema (PostgreSQL 16)
-- ==========================================================
-- Run with: psql -d alkemi -f schema.sql
-- Migrations: Use Alembic for production

-- ==========================================================
-- EXTENSIONS
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Uncomment if using pgvector instead of Pinecone:
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================================
-- ENUMS
-- ==========================================================
DO $$
BEGIN
  -- User roles
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'admin',
      'manager', 
      'chemist',
      'senior_chemist',
      'production',
      'procurement',
      'viewer'
    );
  END IF;

  -- Formulation status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'formulation_status') THEN
    CREATE TYPE formulation_status AS ENUM (
      'draft',
      'submitted',
      'in_review',
      'revision_requested',
      'approved',
      'production',
      'rejected',
      'archived'
    );
  END IF;

  -- Branch type for formulation versions
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_type') THEN
    CREATE TYPE branch_type AS ENUM (
      'revision',
      'variant',
      'cost_reduction',
      'customer_specific',
      'experimental'
    );
  END IF;

  -- Confidentiality levels
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confidentiality_level') THEN
    CREATE TYPE confidentiality_level AS ENUM (
      'public',
      'internal',
      'confidential',
      'restricted'
    );
  END IF;

  -- Approval status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'revision_requested'
    );
  END IF;

  -- Document source types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_source_type') THEN
    CREATE TYPE doc_source_type AS ENUM (
      'tds',
      'msds',
      'pds',
      'sop',
      'report',
      'note',
      'patent',
      'paper',
      'other'
    );
  END IF;

  -- Ingestion status for data digitization
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingestion_status') THEN
    CREATE TYPE ingestion_status AS ENUM (
      'queued',
      'processing',
      'needs_review',
      'validated',
      'failed'
    );
  END IF;
END$$;

-- ==========================================================
-- ORGANIZATIONS & USERS
-- ==========================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'chemist',
  password_hash TEXT,                    -- Only for local auth (dev/break-glass)
  sso_provider TEXT,                     -- e.g., "azure_ad"
  sso_subject TEXT,                      -- Provider's user ID
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================================
-- DOMAINS (Chemistry Domain Packs)
-- ==========================================================
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,              -- e.g., "uv_inks", "personal_care"
  name TEXT NOT NULL,                    -- e.g., "UV Inks & Coatings"
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domain enablement per organization
CREATE TABLE IF NOT EXISTS organization_domains (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, domain_id)
);

-- ==========================================================
-- SUPPLIERS
-- ==========================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  risk_score NUMERIC(5,2) DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 100),
  qualification_status TEXT DEFAULT 'pending',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers USING gin(name gin_trgm_ops);

-- ==========================================================
-- MATERIALS
-- ==========================================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  
  -- Identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  category TEXT,                         -- e.g., "OLIGOMER", "MONOMER"
  subcategory TEXT,
  
  -- Chemical identity
  cas_number TEXT,
  inci_name TEXT,
  smiles TEXT,
  molecular_weight NUMERIC(12,4),
  
  -- Molecular fingerprints (for similarity search)
  morgan_fp_2048 BIT(2048),
  maccs_keys_166 BIT(166),
  
  -- Hansen solubility parameters
  hansen_d NUMERIC(8,4),                 -- Dispersion
  hansen_p NUMERIC(8,4),                 -- Polar
  hansen_h NUMERIC(8,4),                 -- Hydrogen bonding
  hansen_r0 NUMERIC(8,4),                -- Interaction radius
  
  -- Physical properties (JSONB for domain flexibility)
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Regulatory data
  regulatory JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Commercial data
  commercial JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  confidentiality confidentiality_level NOT NULL DEFAULT 'confidential',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (organization_id, domain_id, code)
);

CREATE INDEX IF NOT EXISTS idx_materials_org_domain ON materials(organization_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_materials_name_trgm ON materials USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_materials_cas ON materials(cas_number) WHERE cas_number IS NOT NULL;

-- Full-text search on materials
CREATE INDEX IF NOT EXISTS idx_materials_fts ON materials USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(trade_name, '') || ' ' || coalesce(category, ''))
);

-- ==========================================================
-- MATERIAL-SUPPLIER RELATIONSHIPS
-- ==========================================================
CREATE TABLE IF NOT EXISTS material_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_sku TEXT,
  price_per_kg NUMERIC(12,4),
  currency TEXT DEFAULT 'INR',
  lead_time_days INT,
  min_order_qty NUMERIC(12,4),
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, material_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_material_suppliers_material ON material_suppliers(material_id);
CREATE INDEX IF NOT EXISTS idx_material_suppliers_supplier ON material_suppliers(supplier_id);

-- ==========================================================
-- FORMULATION FAMILIES (Top-level formulation identity)
-- ==========================================================
CREATE TABLE IF NOT EXISTS formulation_families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,                    -- e.g., "UV-INK-BLK-001"
  name TEXT NOT NULL,
  description TEXT,
  product_family TEXT,                   -- e.g., "UV Offset", "UV Flexo"
  confidentiality confidentiality_level NOT NULL DEFAULT 'restricted',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, domain_id, code)
);

CREATE INDEX IF NOT EXISTS idx_formulation_families_org_domain ON formulation_families(organization_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_formulation_families_code ON formulation_families(organization_id, code);

-- ==========================================================
-- FORMULATION VERSIONS (Immutable snapshots)
-- ==========================================================
CREATE TABLE IF NOT EXISTS formulation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES formulation_families(id) ON DELETE CASCADE,
  
  -- Version identification
  version_number INT NOT NULL,           -- 1, 2, 3... within family
  branch_name TEXT NOT NULL DEFAULT 'main',
  branch_type branch_type NOT NULL DEFAULT 'revision',
  parent_version_id UUID REFERENCES formulation_versions(id) ON DELETE SET NULL,
  
  -- Status
  status formulation_status NOT NULL DEFAULT 'draft',
  change_summary TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  UNIQUE (organization_id, family_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_formulation_versions_family ON formulation_versions(organization_id, family_id);
CREATE INDEX IF NOT EXISTS idx_formulation_versions_status ON formulation_versions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_formulation_versions_parent ON formulation_versions(parent_version_id);

-- ==========================================================
-- FORMULATION INGREDIENTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS formulation_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  
  function TEXT NOT NULL,                -- Domain-validated: "OLIGOMER", "MONOMER", etc.
  percentage NUMERIC(8,4) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  
  UNIQUE (organization_id, version_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_formulation_ingredients_version ON formulation_ingredients(version_id);
CREATE INDEX IF NOT EXISTS idx_formulation_ingredients_material ON formulation_ingredients(material_id);

-- ==========================================================
-- FORMULATION SPECIFICATIONS (Target properties)
-- ==========================================================
CREATE TABLE IF NOT EXISTS formulation_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  
  property_key TEXT NOT NULL,            -- e.g., "viscosity_cps", "gloss_60deg"
  target_value NUMERIC(14,6),
  min_value NUMERIC(14,6),
  max_value NUMERIC(14,6),
  unit TEXT NOT NULL,
  importance NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (importance >= 0 AND importance <= 1),
  test_method TEXT,
  
  UNIQUE (organization_id, version_id, property_key)
);

CREATE INDEX IF NOT EXISTS idx_formulation_specs_version ON formulation_specs(version_id);

-- ==========================================================
-- FORMULATION PROCESS STEPS
-- ==========================================================
CREATE TABLE IF NOT EXISTS formulation_process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  
  step_number INT NOT NULL,
  name TEXT,
  description TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,  -- temp, rpm, time, etc.
  duration_minutes INT,
  equipment TEXT,
  safety_notes TEXT,
  
  UNIQUE (organization_id, version_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_formulation_process_steps_version ON formulation_process_steps(version_id);

-- ==========================================================
-- TRIALS (Lab experiments)
-- ==========================================================
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  
  trial_code TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Conditions and results
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Outcome
  outcome TEXT CHECK (outcome IN ('pass', 'fail', 'partial', 'inconclusive')),
  outcome_notes TEXT,
  
  -- Attachments reference
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, trial_code)
);

CREATE INDEX IF NOT EXISTS idx_trials_version ON trials(version_id);
CREATE INDEX IF NOT EXISTS idx_trials_outcome ON trials(organization_id, outcome);
CREATE INDEX IF NOT EXISTS idx_trials_date ON trials(organization_id, performed_at);

-- ==========================================================
-- PRODUCTION BATCHES
-- ==========================================================
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE RESTRICT,
  
  batch_code TEXT NOT NULL,
  plant_code TEXT,
  batch_size_kg NUMERIC(12,4),
  produced_at TIMESTAMPTZ,
  
  -- Results
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  deviations JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'completed',
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, batch_code)
);

CREATE INDEX IF NOT EXISTS idx_production_batches_version ON production_batches(version_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(organization_id, produced_at);

-- ==========================================================
-- PREDICTIONS
-- ==========================================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  
  model_key TEXT NOT NULL,               -- e.g., "uv_inks.viscosity_v2"
  input_hash TEXT NOT NULL,              -- Deterministic hash of inputs
  
  -- Results
  results JSONB NOT NULL,                -- Predictions + uncertainty + explanations
  
  -- Metadata
  model_version TEXT,
  computation_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (organization_id, version_id, model_key, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_predictions_version ON predictions(version_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_key);

-- ==========================================================
-- APPROVAL REQUESTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES formulation_versions(id) ON DELETE CASCADE,
  
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Decision
  status approval_status NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- AI risk assessment (stored for audit)
  ai_assessment JSONB
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_org_status ON approval_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_version ON approval_requests(version_id);

-- ==========================================================
-- DOCUMENTS (for RAG)
-- ==========================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  source_type doc_source_type NOT NULL DEFAULT 'other',
  title TEXT,
  file_uri TEXT NOT NULL,                -- s3://bucket/key
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  sha256 TEXT NOT NULL,
  
  -- Extracted content
  extracted_text TEXT,
  chunk_count INT DEFAULT 0,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (organization_id, sha256)
);

CREATE INDEX IF NOT EXISTS idx_documents_org_type ON documents(organization_id, source_type);
CREATE INDEX IF NOT EXISTS idx_documents_domain ON documents(domain_id);

-- ==========================================================
-- INGESTION JOBS (Data digitization)
-- ==========================================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  source_name TEXT NOT NULL,             -- e.g., "LabNotebook_2019_Box3"
  source_type TEXT,                      -- "excel", "pdf", "paper_scan"
  
  status ingestion_status NOT NULL DEFAULT 'queued',
  
  -- Statistics
  stats JSONB NOT NULL DEFAULT '{
    "total_records": 0,
    "processed": 0,
    "validated": 0,
    "failed": 0
  }'::jsonb,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_org_status ON ingestion_jobs(organization_id, status);

-- ==========================================================
-- INGESTION RECORDS (Individual extracted records)
-- ==========================================================
CREATE TABLE IF NOT EXISTS ingestion_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
  
  record_type TEXT NOT NULL,             -- "formulation", "trial", "material"
  
  -- Extraction pipeline
  raw_text TEXT,
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  validated JSONB,                       -- Human-corrected version
  
  status ingestion_status NOT NULL DEFAULT 'processing',
  confidence_score NUMERIC(5,4),
  
  -- Review
  reviewer_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_records_job ON ingestion_records(job_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_records_status ON ingestion_records(organization_id, status);

-- ==========================================================
-- AUDIT LOG (Immutable)
-- ==========================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                  -- "create", "update", "delete", "approve", etc.
  
  entity_type TEXT NOT NULL,             -- "formulation_version", "material", etc.
  entity_id UUID,
  
  before_state JSONB,
  after_state JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log is append-only; no UPDATE or DELETE allowed in application
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id);

-- ==========================================================
-- LLM MODEL REGISTRY (for intelligent routing)
-- ==========================================================
CREATE TABLE IF NOT EXISTS llm_models (
  llm_model_pk UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- INTERNAL only, never send to providers
  
  provider TEXT NOT NULL,                -- "anthropic", "openai", "google"
  provider_model_id TEXT NOT NULL,  -- THIS is what you send to provider APIs
  display_name TEXT NOT NULL,
  
  -- Capabilities (0-100 scores)
  capabilities JSONB NOT NULL DEFAULT '{
    "reasoning": 0,
    "chemistry": 0,
    "coding": 0,
    "creativity": 0,
    "speed": 0
  }'::jsonb,
  
  -- Tier classification
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('flagship', 'standard', 'fast')),
  
  -- Technical specs
  context_window INT,
  max_output_tokens INT,
  
  -- Pricing (per 1K tokens)
  price_input_per_1k NUMERIC(12,6),
  price_output_per_1k NUMERIC(12,6),
  
  -- Performance
  avg_latency_ms INT,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (provider, model_id)
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- Helper function to get current org from session
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.org_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Apply RLS to all tenant tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'suppliers',
    'materials',
    'material_suppliers',
    'formulation_families',
    'formulation_versions',
    'formulation_ingredients',
    'formulation_specs',
    'formulation_process_steps',
    'trials',
    'production_batches',
    'predictions',
    'approval_requests',
    'documents',
    'ingestion_jobs',
    'ingestion_records',
    'audit_log'
  ]
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Drop existing policy if exists
    EXECUTE format('DROP POLICY IF EXISTS org_isolation_%1$s ON %1$I;', tbl);
    
    -- Create org isolation policy
    EXECUTE format($pol$
      CREATE POLICY org_isolation_%1$s ON %1$I
      FOR ALL
      USING (organization_id = current_org_id())
      WITH CHECK (organization_id = current_org_id());
    $pol$, tbl);
  END LOOP;
END$$;

-- ==========================================================
-- SEED DATA: Default LLM Models
-- ==========================================================
INSERT INTO llm_models (provider, provider_model_id, display_name, tier, capabilities, context_window, avg_latency_ms, price_input_per_1k, price_output_per_1k)
VALUES
  -- Anthropic
  ('anthropic', 'claude-opus-4-5-20251101', 'Claude Opus 4.5', 'flagship',
   '{"reasoning": 98, "chemistry": 96, "coding": 95, "creativity": 94, "speed": 40}',
   200000, 3000, 0.015, 0.075),
  ('anthropic', 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 'standard',
   '{"reasoning": 92, "chemistry": 90, "coding": 93, "creativity": 88, "speed": 70}',
   200000, 1500, 0.003, 0.015),
  ('anthropic', 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'fast',
   '{"reasoning": 78, "chemistry": 75, "coding": 82, "creativity": 70, "speed": 95}',
   200000, 400, 0.00025, 0.00125),
  
  -- OpenAI
  ('openai', 'gpt-4.5-turbo-2025', 'GPT-4.5 Turbo', 'flagship',
   '{"reasoning": 94, "chemistry": 88, "coding": 96, "creativity": 92, "speed": 50}',
   128000, 2500, 0.010, 0.030),
  ('openai', 'gpt-4o-2025', 'GPT-4o', 'standard',
   '{"reasoning": 88, "chemistry": 82, "coding": 90, "creativity": 85, "speed": 80}',
   128000, 800, 0.0025, 0.010),
  ('openai', 'gpt-4o-mini-2025', 'GPT-4o Mini', 'fast',
   '{"reasoning": 75, "chemistry": 70, "coding": 80, "creativity": 72, "speed": 92}',
   128000, 300, 0.00015, 0.0006),
  
  -- Google
  ('google', 'gemini-2.0-ultra', 'Gemini 2.0 Ultra', 'flagship',
   '{"reasoning": 95, "chemistry": 91, "coding": 92, "creativity": 90, "speed": 45}',
   1000000, 2800, 0.012, 0.036),
  ('google', 'gemini-2.0-pro', 'Gemini 2.0 Pro', 'standard',
   '{"reasoning": 88, "chemistry": 84, "coding": 86, "creativity": 82, "speed": 75}',
   1000000, 1200, 0.00125, 0.005),
  ('google', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 'fast',
   '{"reasoning": 75, "chemistry": 70, "coding": 75, "creativity": 68, "speed": 98}',
   1000000, 300, 0.000075, 0.0003)
ON CONFLICT (provider, model_id) DO NOTHING;

-- ==========================================================
-- SEED DATA: Default Domains
-- ==========================================================
INSERT INTO domains (key, name, description, version, config)
VALUES
  ('uv_inks', 'UV Inks & Coatings', 'UV-curable inks, varnishes, and coatings', '1.0.0', '{
    "functions": ["OLIGOMER", "MONOMER", "PHOTOINITIATOR", "PIGMENT", "ADDITIVE"],
    "properties": ["viscosity_cps", "gloss_60deg", "cure_speed_mpm", "adhesion_rating"],
    "composition_tolerance": 0.1
  }'::jsonb),
  ('personal_care', 'Personal Care', 'Skincare, haircare, and cosmetic formulations', '1.0.0', '{
    "functions": ["EMOLLIENT", "SURFACTANT", "THICKENER", "PRESERVATIVE", "ACTIVE", "FRAGRANCE"],
    "properties": ["viscosity_cps", "ph", "stability_score", "sensory_score"],
    "composition_tolerance": 0.1
  }'::jsonb),
  ('specialty_chem', 'Specialty Chemicals', 'Industrial specialty chemicals and intermediates', '1.0.0', '{
    "functions": ["REACTANT", "CATALYST", "SOLVENT", "ADDITIVE"],
    "properties": ["yield_pct", "purity_pct", "reaction_time_hrs"],
    "composition_tolerance": 0.5
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

---


## 6.5 RLS Operationalization

**CRITICAL: Every database operation MUST set RLS context variables.**

### Mandatory Session Hook

```python
# db/session.py
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import structlog

logger = structlog.get_logger()

@asynccontextmanager
async def scoped_db_session(
    session: AsyncSession,
    org_id: str,
    user_id: str,
):
    """
    Context manager that ALWAYS sets RLS context variables.
    
    CRITICAL: Every database operation MUST use this context manager.
    Direct session usage without RLS context is a security violation.
    """
    try:
        await session.execute(text("SET LOCAL app.org_id = :org_id"), {"org_id": org_id})
        await session.execute(text("SET LOCAL app.user_id = :user_id"), {"user_id": user_id})
        yield session
    finally:
        try:
            await session.execute(text("RESET app.org_id"))
            await session.execute(text("RESET app.user_id"))
        except Exception:
            pass
```

### Background Worker RLS

```python
# worker/tasks.py - Background tasks MUST set RLS context
@app.task(bind=True)
async def process_prediction(self, task_data: dict):
    org_id = task_data["org_id"]
    user_id = task_data["user_id"]
    
    async with get_async_session() as session:
        async with scoped_db_session(session, org_id, user_id) as db:
            # Safe to query - RLS enforced
            result = await db.execute(...)
```

### Mandatory RLS Tests

```python
# tests/test_rls_isolation.py
class TestRLSIsolation:
    """CRITICAL: These tests MUST pass before any deployment."""
    
    async def test_org_b_cannot_read_org_a_material(self, db, org_a, org_b, material_in_org_a):
        async with scoped_db_session(db, str(org_b.id), str(uuid4())) as session:
            result = await session.execute(
                select(Material).where(Material.id == material_in_org_a.id)
            )
            assert result.scalar_one_or_none() is None  # MUST be None due to RLS
    
    async def test_org_b_cannot_update_org_a_material(self, db, org_a, org_b, material_in_org_a):
        async with scoped_db_session(db, str(org_b.id), str(uuid4())) as session:
            result = await session.execute(
                update(Material).where(Material.id == material_in_org_a.id)
                .values(name="Hacked!").returning(Material.id)
            )
            assert result.scalar_one_or_none() is None  # No rows updated
```


## 6.6 Test Conditions Schema (First-Class Entity)

Test conditions are required for meaningful property measurements.

```sql
-- Test condition definitions
CREATE TABLE test_condition_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id),
    key TEXT NOT NULL,              -- e.g., "temperature", "shear_rate"
    name TEXT NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('numeric', 'text', 'enum')),
    unit TEXT,
    enum_values TEXT[],
    default_value TEXT,
    min_value NUMERIC,
    max_value NUMERIC,
    category TEXT,                  -- "environmental", "equipment", "substrate"
    is_required BOOLEAN DEFAULT false,
    UNIQUE (domain_id, key)
);

-- Reusable condition sets
CREATE TABLE test_condition_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    domain_id UUID NOT NULL REFERENCES domains(id),
    name TEXT NOT NULL,
    description TEXT,
    is_standard BOOLEAN DEFAULT false,
    UNIQUE (organization_id, domain_id, name)
);

-- Condition values in a set
CREATE TABLE test_condition_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition_set_id UUID NOT NULL REFERENCES test_condition_sets(id) ON DELETE CASCADE,
    condition_type_id UUID NOT NULL REFERENCES test_condition_types(id),
    numeric_value NUMERIC,
    text_value TEXT,
    UNIQUE (condition_set_id, condition_type_id)
);

-- Link trials to condition sets
ALTER TABLE trials ADD COLUMN condition_set_id UUID REFERENCES test_condition_sets(id);
ALTER TABLE trials ADD COLUMN condition_snapshot JSONB;  -- Immutable copy

-- Link predictions to condition sets
ALTER TABLE predictions ADD COLUMN condition_set_id UUID REFERENCES test_condition_sets(id);

-- RLS
ALTER TABLE test_condition_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_test_conditions ON test_condition_sets
    USING (organization_id = current_org_id());
```

### Standard Conditions for UV Inks Domain

| Key | Name | Type | Unit | Default | Required |
|-----|------|------|------|---------|----------|
| temperature_c | Temperature | numeric | °C | 25 | Yes |
| shear_rate_s1 | Shear Rate | numeric | s⁻¹ | 100 | Yes |
| lamp_type | UV Lamp Type | enum | - | mercury_h | Yes |
| lamp_power_w_cm | Lamp Power | numeric | W/cm | 200 | Yes |
| substrate_type | Substrate | enum | - | coated_paper | Yes |
| film_thickness_um | Film Thickness | numeric | µm | 10 | Yes |


---

# 7. API Specifications

## 7.1 API Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Base Path** | `/api/v1` |
| **Format** | JSON only, UTF-8 |
| **Authentication** | Bearer JWT token |
| **Tenant Isolation** | Org derived from JWT only (never from request body) |
| **Idempotency** | `Idempotency-Key` header for creates |
| **Versioning** | URL-based (`/v1/`, `/v2/`) |
| **Audit** | All writes emit `audit_log` entries |

## 7.2 Standard Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-09T10:30:00Z",
    "warnings": []
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable summary",
    "details": [
      {"field": "ingredients[0].percentage", "issue": "must be > 0"}
    ]
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-09T10:30:00Z"
  }
}
```

**HTTP Status Codes:**
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (valid token, no permission) |
| 404 | Not found |
| 409 | Conflict (duplicate, state conflict) |
| 429 | Rate limited |
| 500 | Internal error |

## 7.3 Authentication Endpoints

```yaml
POST /api/v1/auth/login:
  description: Login with email/password (dev only)
  request:
    email: string
    password: string
  response:
    access_token: string
    refresh_token: string
    expires_in: integer
    user: User

POST /api/v1/auth/refresh:
  description: Refresh access token
  request:
    refresh_token: string
  response:
    access_token: string
    expires_in: integer

POST /api/v1/auth/logout:
  description: Invalidate tokens
  request:
    refresh_token: string
  response:
    success: boolean

GET /api/v1/auth/me:
  description: Get current user
  response:
    user: User
    organization: Organization
    permissions: string[]

GET /api/v1/auth/sso/azure:
  description: Redirect to Azure AD login

GET /api/v1/auth/sso/azure/callback:
  description: Handle Azure AD callback
```

## 7.4 Formulation Endpoints

```yaml
# Family operations
GET /api/v1/formulations:
  description: List formulation families
  query:
    domain_id: uuid (optional)
    status: string (optional, filters by latest version status)
    q: string (optional, search)
    page: integer (default 1)
    per_page: integer (default 20)
  response:
    items: FormulationFamily[]
    total: integer
    page: integer
    per_page: integer

POST /api/v1/formulations:
  description: Create formulation family with initial version
  request:
    domain_id: uuid
    code: string
    name: string
    description: string (optional)
    confidentiality: string (default "restricted")
    version:
      branch_name: string (default "main")
      branch_type: string (default "revision")
      change_summary: string (optional)
      ingredients:
        - material_id: uuid
          function: string
          percentage: number
          supplier_id: uuid (optional)
          is_critical: boolean (optional)
      specs:
        - property_key: string
          target_value: number (optional)
          min_value: number (optional)
          max_value: number (optional)
          unit: string
          importance: number (optional)
      process_steps:
        - step_number: integer
          description: string
          parameters: object
  response:
    family_id: uuid
    version_id: uuid
    status: string

GET /api/v1/formulations/{family_id}:
  description: Get formulation family details
  response:
    family: FormulationFamily
    latest_version: FormulationVersion
    version_count: integer

GET /api/v1/formulations/{family_id}/versions:
  description: List all versions of a family
  response:
    items: FormulationVersion[]

POST /api/v1/formulations/{family_id}/versions:
  description: Create new version (branch/revision)
  request:
    parent_version_id: uuid (optional, defaults to latest)
    branch_name: string
    branch_type: string
    change_summary: string
    ingredients: [...] (optional, inherits from parent if omitted)
    specs: [...] (optional)
    process_steps: [...] (optional)
  response:
    version_id: uuid
    version_number: integer
    status: string

# Version operations
GET /api/v1/formulation-versions/{version_id}:
  description: Get full version details
  response:
    version: FormulationVersion
    family: FormulationFamily
    ingredients: Ingredient[]
    specs: Spec[]
    process_steps: ProcessStep[]
    predictions: Prediction[] (latest)
    trials: Trial[]

PUT /api/v1/formulation-versions/{version_id}:
  description: Update draft version
  precondition: status must be "draft"
  request:
    change_summary: string (optional)
    ingredients: [...] (optional)
    specs: [...] (optional)
    process_steps: [...] (optional)
  response:
    version: FormulationVersion

POST /api/v1/formulation-versions/{version_id}/submit:
  description: Submit for approval
  precondition: valid composition, required specs present
  response:
    version: FormulationVersion
    approval_request_id: uuid

POST /api/v1/formulation-versions/{version_id}/archive:
  description: Archive version
  request:
    reason: string
  response:
    success: boolean
```

## 7.5 Materials Endpoints

```yaml
GET /api/v1/materials:
  description: List materials
  query:
    domain_id: uuid (optional)
    category: string (optional)
    q: string (optional, full-text search)
    page: integer
    per_page: integer
  response:
    items: Material[]
    total: integer

POST /api/v1/materials:
  description: Create material
  request:
    domain_id: uuid
    code: string
    name: string
    trade_name: string (optional)
    category: string
    subcategory: string (optional)
    cas_number: string (optional)
    smiles: string (optional)
    properties: object
    regulatory: object (optional)
  response:
    material: Material

GET /api/v1/materials/{id}:
  description: Get material details
  response:
    material: Material
    suppliers: MaterialSupplier[]

PUT /api/v1/materials/{id}:
  description: Update material
  request: (partial Material)
  response:
    material: Material

GET /api/v1/materials/{id}/alternatives:
  description: Find alternative materials
  query:
    similarity_threshold: number (default 0.7)
    same_function: boolean (default true)
    limit: integer (default 10)
  response:
    alternatives:
      - material: Material
        similarity_score: number
        property_comparison: object
        cost_comparison: object
        regulatory_match: boolean
        recommendation: string
```

## 7.6 Prediction Endpoints

```yaml
POST /api/v1/predictions:
  description: Run predictions for a formulation version
  request:
    version_id: uuid
    properties: string[] (optional, defaults to all)
    force_refresh: boolean (default false)
  response:
    prediction_id: uuid
    results:
      - property_key: string
        value: number
        unit: string
        uncertainty: number
        confidence_interval_95: [number, number]
        probability_in_spec: number
        explanation: object
        warnings: string[]
    overall:
      probability_all_specs_met: number
      highest_risk_property: string
    model_versions: object

GET /api/v1/predictions/{id}:
  description: Get prediction details
  response:
    prediction: Prediction

POST /api/v1/predictions/{id}/feedback:
  description: Provide feedback on prediction
  request:
    property_key: string
    actual_value: number
    notes: string (optional)
  response:
    success: boolean
```

## 7.7 AI & Debate Endpoints

```yaml
POST /api/v1/ai/quick-answer:
  description: Get quick RAG-grounded answer
  request:
    query: string
    context:
      version_id: uuid (optional)
      material_id: uuid (optional)
  response:
    answer: string
    sources:
      - document_id: uuid
        title: string
        excerpt: string
    confidence: string

POST /api/v1/debate:
  description: Start multi-expert debate
  request:
    query: string
    context:
      version_id: uuid (optional)
      composition: object (optional)
      predictions: object (optional)
    num_rounds: integer (default 2)
  response:
    debate_id: uuid
    status: string

GET /api/v1/debate/{id}:
  description: Get debate results
  response:
    debate:
      query: string
      rounds:
        - round_number: integer
          responses:
            - expert: string
              response: string
              confidence: string
      synthesis:
        recommendation: string
        consensus_points: string[]
        disagreements: string[]
        confidence: string
        next_steps: string[]
      total_tokens: integer
      latency_ms: integer

POST /api/v1/debate/{id}/followup:
  description: Ask follow-up question
  request:
    question: string
  response:
    response: string
```

## 7.8 Approval Endpoints

```yaml
GET /api/v1/approvals:
  description: List approval requests
  query:
    status: string (optional)
  response:
    items: ApprovalRequest[]

POST /api/v1/approvals/{id}/approve:
  description: Approve formulation
  request:
    notes: string (optional)
  response:
    approval: ApprovalRequest
    version: FormulationVersion

POST /api/v1/approvals/{id}/reject:
  description: Reject formulation
  request:
    reason: string
  response:
    approval: ApprovalRequest
    version: FormulationVersion

POST /api/v1/approvals/{id}/revise:
  description: Request revision
  request:
    feedback: string
    suggested_changes: object (optional)
  response:
    approval: ApprovalRequest
    version: FormulationVersion
```

---

# 8. Security Framework

## 8.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: PERIMETER                                                         │
│  ├── WAF (Web Application Firewall)                                         │
│  ├── DDoS Protection                                                        │
│  └── Rate Limiting                                                          │
│                                                                             │
│  Layer 2: TRANSPORT                                                         │
│  ├── TLS 1.3 (all connections)                                              │
│  └── Certificate pinning (mobile)                                           │
│                                                                             │
│  Layer 3: AUTHENTICATION                                                    │
│  ├── OIDC via Azure AD (primary)                                            │
│  ├── JWT with RS256 signing                                                 │
│  └── Refresh token rotation                                                 │
│                                                                             │
│  Layer 4: AUTHORIZATION                                                     │
│  ├── RBAC (role-based)                                                      │
│  ├── Resource-level permissions                                             │
│  └── Row-Level Security (PostgreSQL)                                        │
│                                                                             │
│  Layer 5: DATA PROTECTION                                                   │
│  ├── Encryption at rest (AES-256)                                           │
│  ├── Field-level encryption (secrets)                                       │
│  └── Backup encryption                                                      │
│                                                                             │
│  Layer 6: INPUT VALIDATION                                                  │
│  ├── Pydantic schema validation                                             │
│  ├── SQL injection prevention (parameterized queries)                       │
│  └── XSS prevention (output encoding)                                       │
│                                                                             │
│  Layer 7: AUDIT                                                             │
│  ├── Immutable audit log                                                    │
│  ├── Access logging                                                         │
│  └── Anomaly detection                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Role-Based Access Control

| Role | Formulations | Materials | Approvals | Admin |
|------|--------------|-----------|-----------|-------|
| **admin** | Full | Full | Full | Full |
| **manager** | Full | Full | Approve/Reject | View |
| **senior_chemist** | Full | Full | View | None |
| **chemist** | Own + View | View + Suggest | View | None |
| **production** | View Approved | View | None | None |
| **procurement** | View | Full (commercial) | None | None |
| **viewer** | View | View | View | None |

## 8.3 JWT Token Structure

```python
# JWT Claims
{
    "sub": "user-uuid",           # User ID
    "org": "org-uuid",            # Organization ID
    "role": "chemist",            # User role
    "permissions": ["..."],       # Computed permissions
    "exp": 1736424000,            # Expiration
    "iat": 1736420400,            # Issued at
    "jti": "token-uuid"           # Token ID (for revocation)
}
```

## 8.4 Audit Log Requirements

Every state-changing operation must log:
- `actor_user_id`: Who performed the action
- `action`: What action was performed
- `entity_type` + `entity_id`: What was affected
- `before_state`: State before change
- `after_state`: State after change
- `ip_address` + `user_agent`: Request context
- `created_at`: Timestamp

**Retention:** Minimum 7 years for regulated industries.

---

*Continued in Part 2...*
# ALKEMI™ v5.0 — Part 2: Core Platform & User Experience

---

# PART C: CORE PLATFORM

---


---

# 8.5 Architecture Decision Records (ADRs)

## ADR-001: Vector Store Selection

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Decision** | Support both Pinecone (primary) and pgvector (fallback) |

**Context:** ALKEMI requires vector similarity search for RAG and material similarity.

**Options Considered:**
- Pinecone: Managed, scalable, purpose-built
- pgvector: Self-hosted, integrated with Postgres, lower cost
- Weaviate/Milvus: Powerful but operational complexity

**Decision:** Use Pinecone as primary for production; pgvector for development and data-sovereignty requirements.

**Exit Strategy:** If Pinecone costs exceed $5k/month, migrate to pgvector with dedicated instance.

---

## ADR-002: Multi-Provider LLM vs Single Provider

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Decision** | Multi-provider by default with per-org restrictions |

**Context:** Multiple LLM providers enable best model per task, diverse debate perspectives, and redundancy.

**Decision:** Support multi-provider routing with organization-level `allowed_providers` policy.

**Exit Strategy:** Fall back to Anthropic-only if multi-provider proves too complex.

---

## ADR-003: Compliance Dataset Storage

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Decision** | Compliance rules as versioned datasets + external sync |

**Context:** Compliance data must be versioned, updatable, and explainable.

**Decision:** Store rules in database with version tracking. Implement sync for authoritative sources.

---

## ADR-004: Test Conditions as First-Class Entity

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Decision** | All measurements require explicit test conditions |

**Context:** Property measurements are meaningless without conditions (temperature, shear rate, substrate, lamp type).

**Decision:** Test conditions are first-class. Every trial must reference a `test_condition_set`.

---

# 9. Authentication & Authorization

## 9.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐   │
│  │  User   │         │ ALKEMI  │         │Azure AD │         │   API   │   │
│  │Browser  │         │Frontend │         │  OIDC   │         │ Backend │   │
│  └────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘   │
│       │                   │                   │                   │        │
│       │  1. Click Login   │                   │                   │        │
│       │──────────────────▶│                   │                   │        │
│       │                   │                   │                   │        │
│       │                   │  2. Redirect to   │                   │        │
│       │◀──────────────────│     Azure AD      │                   │        │
│       │                   │                   │                   │        │
│       │  3. Azure Login   │                   │                   │        │
│       │──────────────────────────────────────▶│                   │        │
│       │                   │                   │                   │        │
│       │  4. Auth Code     │                   │                   │        │
│       │◀──────────────────────────────────────│                   │        │
│       │                   │                   │                   │        │
│       │  5. Code to       │                   │                   │        │
│       │     Backend       │                   │                   │        │
│       │──────────────────────────────────────────────────────────▶│        │
│       │                   │                   │                   │        │
│       │                   │                   │  6. Exchange Code │        │
│       │                   │                   │◀──────────────────│        │
│       │                   │                   │                   │        │
│       │                   │                   │  7. ID Token      │        │
│       │                   │                   │──────────────────▶│        │
│       │                   │                   │                   │        │
│       │  8. JWT Tokens    │                   │                   │        │
│       │◀──────────────────────────────────────────────────────────│        │
│       │                   │                   │                   │        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 JWT Implementation

```python
# auth/jwt_handler.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from cryptography.hazmat.primitives import serialization
from pydantic import BaseModel

class TokenPayload(BaseModel):
    sub: str          # user_id
    org: str          # organization_id
    role: str         # user_role
    permissions: list[str] = []
    exp: int
    iat: int
    jti: str          # token ID for revocation

class JWTHandler:
    def __init__(
        self,
        private_key_path: str,
        public_key_path: str,
        algorithm: str = "RS256",
        access_token_expire_minutes: int = 60,
        refresh_token_expire_days: int = 30,
    ):
        with open(private_key_path, "rb") as f:
            self.private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(public_key_path, "rb") as f:
            self.public_key = serialization.load_pem_public_key(f.read())
        
        self.algorithm = algorithm
        self.access_token_expire = timedelta(minutes=access_token_expire_minutes)
        self.refresh_token_expire = timedelta(days=refresh_token_expire_days)
    
    def create_access_token(
        self,
        user_id: str,
        org_id: str,
        role: str,
        permissions: list[str] = None,
    ) -> tuple[str, str]:
        """Create access token and return (token, jti)"""
        import uuid
        
        now = datetime.utcnow()
        jti = str(uuid.uuid4())
        
        payload = {
            "sub": user_id,
            "org": org_id,
            "role": role,
            "permissions": permissions or [],
            "exp": int((now + self.access_token_expire).timestamp()),
            "iat": int(now.timestamp()),
            "jti": jti,
            "type": "access",
        }
        
        token = jwt.encode(payload, self.private_key, algorithm=self.algorithm)
        return token, jti
    
    def create_refresh_token(self, user_id: str, org_id: str) -> tuple[str, str]:
        """Create refresh token and return (token, jti)"""
        import uuid
        
        now = datetime.utcnow()
        jti = str(uuid.uuid4())
        
        payload = {
            "sub": user_id,
            "org": org_id,
            "exp": int((now + self.refresh_token_expire).timestamp()),
            "iat": int(now.timestamp()),
            "jti": jti,
            "type": "refresh",
        }
        
        token = jwt.encode(payload, self.private_key, algorithm=self.algorithm)
        return token, jti
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate token"""
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm],
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {e}")
    
    def validate_access_token(self, token: str) -> TokenPayload:
        """Validate access token and return payload"""
        payload = self.decode_token(token)
        
        if payload.get("type") != "access":
            raise ValueError("Not an access token")
        
        return TokenPayload(**payload)
```

## 9.3 Permission Middleware

```python
# auth/permissions.py
from functools import wraps
from typing import Callable, List
from fastapi import HTTPException, Request

# Permission definitions by role
ROLE_PERMISSIONS = {
    "admin": [
        "formulation:*",
        "material:*",
        "approval:*",
        "user:*",
        "settings:*",
    ],
    "manager": [
        "formulation:read", "formulation:write", "formulation:delete",
        "material:read", "material:write",
        "approval:read", "approval:approve", "approval:reject",
        "user:read",
    ],
    "senior_chemist": [
        "formulation:read", "formulation:write",
        "material:read", "material:write",
        "approval:read",
        "trial:*",
    ],
    "chemist": [
        "formulation:read", "formulation:write:own",
        "material:read",
        "approval:read",
        "trial:read", "trial:write:own",
    ],
    "production": [
        "formulation:read:approved",
        "material:read",
        "batch:read", "batch:write",
    ],
    "procurement": [
        "formulation:read",
        "material:read", "material:write:commercial",
        "supplier:*",
    ],
    "viewer": [
        "formulation:read",
        "material:read",
        "approval:read",
    ],
}

def has_permission(user_role: str, required: str) -> bool:
    """Check if role has required permission"""
    permissions = ROLE_PERMISSIONS.get(user_role, [])
    
    for perm in permissions:
        if perm == required:
            return True
        if perm.endswith(":*"):
            prefix = perm[:-1]
            if required.startswith(prefix):
                return True
        if "*" in perm:
            # Handle wildcards
            pattern_parts = perm.split(":")
            required_parts = required.split(":")
            if len(pattern_parts) == len(required_parts):
                match = all(
                    p == "*" or p == r
                    for p, r in zip(pattern_parts, required_parts)
                )
                if match:
                    return True
    
    return False

def require_permission(*permissions: str):
    """Decorator to require permissions"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request = kwargs.get("request") or args[0]
            user = getattr(request.state, "user", None)
            
            if not user:
                raise HTTPException(401, "Authentication required")
            
            for perm in permissions:
                if not has_permission(user.role, perm):
                    raise HTTPException(
                        403,
                        f"Permission denied: {perm} required"
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## 9.4 Session Management

```python
# auth/session.py
import redis.asyncio as redis
from datetime import timedelta

class SessionManager:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
        self.prefix = "session:"
        self.revoked_prefix = "revoked:"
    
    async def store_session(
        self,
        user_id: str,
        jti: str,
        token_type: str,
        ttl: timedelta,
    ):
        """Store session for tracking"""
        key = f"{self.prefix}{user_id}:{jti}"
        await self.redis.setex(key, ttl, token_type)
    
    async def revoke_token(self, jti: str, ttl: timedelta):
        """Add token to revocation list"""
        key = f"{self.revoked_prefix}{jti}"
        await self.redis.setex(key, ttl, "1")
    
    async def is_revoked(self, jti: str) -> bool:
        """Check if token is revoked"""
        key = f"{self.revoked_prefix}{jti}"
        return await self.redis.exists(key) > 0
    
    async def revoke_all_user_sessions(self, user_id: str):
        """Revoke all sessions for a user"""
        pattern = f"{self.prefix}{user_id}:*"
        async for key in self.redis.scan_iter(pattern):
            jti = key.decode().split(":")[-1]
            await self.revoke_token(jti, timedelta(days=30))
            await self.redis.delete(key)
```

---

# 10. Data Quality Framework

## 10.1 Validation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA VALIDATION LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: CLIENT-SIDE (Fast Feedback)                                       │
│  ├── Required fields                                                        │
│  ├── Format validation (numbers, dates)                                     │
│  └── Basic range checks                                                     │
│                                                                             │
│  Layer 2: API SCHEMA (Pydantic)                                             │
│  ├── Type validation                                                        │
│  ├── Required vs optional                                                   │
│  ├── String lengths                                                         │
│  └── Enum constraints                                                       │
│                                                                             │
│  Layer 3: BUSINESS RULES                                                    │
│  ├── Composition sum = 100%                                                 │
│  ├── No duplicate materials                                                 │
│  ├── Required specs per domain                                              │
│  └── Workflow state validity                                                │
│                                                                             │
│  Layer 4: DOMAIN PACK RULES                                                 │
│  ├── Function-specific constraints                                          │
│  ├── Property range validation                                              │
│  ├── Incompatibility checks                                                 │
│  └── Physics constraint validation                                          │
│                                                                             │
│  Layer 5: DATABASE CONSTRAINTS                                              │
│  ├── Foreign key integrity                                                  │
│  ├── Unique constraints                                                     │
│  ├── CHECK constraints                                                      │
│  └── RLS policies                                                           │
│                                                                             │
│  Layer 6: ANOMALY DETECTION (Non-blocking)                                  │
│  ├── Statistical outlier flagging                                           │
│  ├── Historical pattern deviation                                           │
│  └── Prediction confidence warnings                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 10.2 Validation Implementation

```python
# validation/formulation_validator.py
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum

class ValidationSeverity(Enum):
    ERROR = "error"      # Blocks save
    WARNING = "warning"  # Allows save with flag
    INFO = "info"        # Informational only

@dataclass
class ValidationResult:
    valid: bool
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    
    def add_error(self, field: str, message: str, code: str = None):
        self.errors.append({
            "field": field,
            "message": message,
            "code": code or "VALIDATION_ERROR",
            "severity": "error",
        })
        self.valid = False
    
    def add_warning(self, field: str, message: str, code: str = None):
        self.warnings.append({
            "field": field,
            "message": message,
            "code": code or "VALIDATION_WARNING",
            "severity": "warning",
        })

class FormulationValidator:
    """Validates formulation data against business and domain rules"""
    
    def __init__(self, domain_config: Dict[str, Any]):
        self.domain_config = domain_config
        self.composition_tolerance = domain_config.get("composition_tolerance", 0.1)
        self.valid_functions = domain_config.get("functions", [])
        self.required_properties = domain_config.get("required_properties", [])
    
    def validate(
        self,
        ingredients: List[Dict],
        specs: List[Dict],
        process_steps: List[Dict] = None,
    ) -> ValidationResult:
        """Run all validations"""
        result = ValidationResult(valid=True, errors=[], warnings=[])
        
        # Composition validations
        self._validate_composition_sum(ingredients, result)
        self._validate_no_duplicate_materials(ingredients, result)
        self._validate_percentage_ranges(ingredients, result)
        self._validate_functions(ingredients, result)
        
        # Specification validations
        self._validate_required_specs(specs, result)
        self._validate_spec_ranges(specs, result)
        
        # Process validations
        if process_steps:
            self._validate_process_steps(process_steps, result)
        
        return result
    
    def _validate_composition_sum(
        self,
        ingredients: List[Dict],
        result: ValidationResult,
    ):
        """Ensure ingredients sum to 100%"""
        if not ingredients:
            result.add_error("ingredients", "At least one ingredient required")
            return
        
        total = sum(ing.get("percentage", 0) for ing in ingredients)
        
        if abs(total - 100.0) > self.composition_tolerance:
            result.add_error(
                "ingredients",
                f"Composition must sum to 100% (currently {total:.2f}%)",
                "COMPOSITION_SUM_ERROR"
            )
    
    def _validate_no_duplicate_materials(
        self,
        ingredients: List[Dict],
        result: ValidationResult,
    ):
        """Ensure no duplicate materials"""
        material_ids = [ing.get("material_id") for ing in ingredients]
        seen = set()
        
        for i, mat_id in enumerate(material_ids):
            if mat_id in seen:
                result.add_error(
                    f"ingredients[{i}].material_id",
                    "Duplicate material in formulation",
                    "DUPLICATE_MATERIAL"
                )
            seen.add(mat_id)
    
    def _validate_percentage_ranges(
        self,
        ingredients: List[Dict],
        result: ValidationResult,
    ):
        """Validate percentage values"""
        for i, ing in enumerate(ingredients):
            pct = ing.get("percentage", 0)
            
            if pct <= 0:
                result.add_error(
                    f"ingredients[{i}].percentage",
                    "Percentage must be greater than 0",
                    "INVALID_PERCENTAGE"
                )
            elif pct > 100:
                result.add_error(
                    f"ingredients[{i}].percentage",
                    "Percentage cannot exceed 100",
                    "INVALID_PERCENTAGE"
                )
    
    def _validate_functions(
        self,
        ingredients: List[Dict],
        result: ValidationResult,
    ):
        """Validate ingredient functions against domain"""
        for i, ing in enumerate(ingredients):
            func = ing.get("function")
            
            if not func:
                result.add_error(
                    f"ingredients[{i}].function",
                    "Function is required",
                    "MISSING_FUNCTION"
                )
            elif func not in self.valid_functions:
                result.add_warning(
                    f"ingredients[{i}].function",
                    f"Unknown function '{func}'. Valid: {self.valid_functions}",
                    "UNKNOWN_FUNCTION"
                )
    
    def _validate_required_specs(
        self,
        specs: List[Dict],
        result: ValidationResult,
    ):
        """Ensure required specifications are present"""
        spec_keys = {s.get("property_key") for s in specs}
        
        for req_prop in self.required_properties:
            if req_prop not in spec_keys:
                result.add_warning(
                    "specs",
                    f"Recommended specification '{req_prop}' is missing",
                    "MISSING_SPEC"
                )
    
    def _validate_spec_ranges(
        self,
        specs: List[Dict],
        result: ValidationResult,
    ):
        """Validate specification ranges"""
        for i, spec in enumerate(specs):
            min_val = spec.get("min_value")
            max_val = spec.get("max_value")
            target = spec.get("target_value")
            
            if min_val is not None and max_val is not None:
                if min_val > max_val:
                    result.add_error(
                        f"specs[{i}]",
                        "min_value cannot be greater than max_value",
                        "INVALID_RANGE"
                    )
            
            if target is not None:
                if min_val is not None and target < min_val:
                    result.add_warning(
                        f"specs[{i}]",
                        "target_value is below min_value",
                        "TARGET_OUT_OF_RANGE"
                    )
                if max_val is not None and target > max_val:
                    result.add_warning(
                        f"specs[{i}]",
                        "target_value is above max_value",
                        "TARGET_OUT_OF_RANGE"
                    )
    
    def _validate_process_steps(
        self,
        steps: List[Dict],
        result: ValidationResult,
    ):
        """Validate process step sequence"""
        step_numbers = [s.get("step_number") for s in steps]
        
        # Check for gaps
        if step_numbers:
            expected = list(range(1, max(step_numbers) + 1))
            if sorted(step_numbers) != expected:
                result.add_warning(
                    "process_steps",
                    "Step numbers should be sequential starting from 1",
                    "NON_SEQUENTIAL_STEPS"
                )
```

## 10.3 Outlier Detection

```python
# validation/outlier_detector.py
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class OutlierFlag:
    property_key: str
    value: float
    expected_range: Tuple[float, float]
    z_score: float
    is_outlier: bool
    message: str

class OutlierDetector:
    """Detect statistical outliers in measurements"""
    
    def __init__(self, z_threshold: float = 3.0):
        self.z_threshold = z_threshold
    
    def detect(
        self,
        measurements: Dict[str, float],
        historical_stats: Dict[str, Dict[str, float]],
    ) -> List[OutlierFlag]:
        """
        Detect outliers by comparing to historical statistics.
        
        Args:
            measurements: Current measurements {property: value}
            historical_stats: {property: {mean, std, min, max, n}}
        
        Returns:
            List of outlier flags
        """
        flags = []
        
        for prop, value in measurements.items():
            stats = historical_stats.get(prop)
            
            if not stats or stats.get("n", 0) < 10:
                # Not enough data for statistical comparison
                continue
            
            mean = stats["mean"]
            std = stats["std"]
            
            if std == 0:
                continue
            
            z_score = abs(value - mean) / std
            is_outlier = z_score > self.z_threshold
            
            expected_low = mean - self.z_threshold * std
            expected_high = mean + self.z_threshold * std
            
            if is_outlier:
                flags.append(OutlierFlag(
                    property_key=prop,
                    value=value,
                    expected_range=(expected_low, expected_high),
                    z_score=z_score,
                    is_outlier=True,
                    message=f"Value {value:.2f} is {z_score:.1f} std devs from mean ({mean:.2f})"
                ))
        
        return flags
    
    def compute_historical_stats(
        self,
        measurements_list: List[Dict[str, float]],
    ) -> Dict[str, Dict[str, float]]:
        """Compute historical statistics from list of measurements"""
        from collections import defaultdict
        
        values_by_prop = defaultdict(list)
        
        for m in measurements_list:
            for prop, val in m.items():
                if isinstance(val, (int, float)):
                    values_by_prop[prop].append(val)
        
        stats = {}
        for prop, values in values_by_prop.items():
            if len(values) >= 2:
                arr = np.array(values)
                stats[prop] = {
                    "mean": float(np.mean(arr)),
                    "std": float(np.std(arr)),
                    "min": float(np.min(arr)),
                    "max": float(np.max(arr)),
                    "n": len(values),
                }
        
        return stats
```

---

# 11. Workflow Engine

## 11.1 State Machine Definition

```python
# workflow/state_machine.py
from enum import Enum
from typing import Dict, List, Set, Optional, Callable
from dataclasses import dataclass

class FormulationStatus(Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    REVISION_REQUESTED = "revision_requested"
    APPROVED = "approved"
    PRODUCTION = "production"
    REJECTED = "rejected"
    ARCHIVED = "archived"

@dataclass
class Transition:
    from_status: FormulationStatus
    to_status: FormulationStatus
    action: str
    required_role: List[str]
    validators: List[Callable] = None
    on_transition: Callable = None

class FormulationWorkflow:
    """State machine for formulation lifecycle"""
    
    TRANSITIONS: List[Transition] = [
        # Draft -> Submitted
        Transition(
            FormulationStatus.DRAFT,
            FormulationStatus.SUBMITTED,
            "submit",
            ["chemist", "senior_chemist", "manager", "admin"],
        ),
        # Submitted -> In Review
        Transition(
            FormulationStatus.SUBMITTED,
            FormulationStatus.IN_REVIEW,
            "start_review",
            ["manager", "admin"],
        ),
        # In Review -> Approved
        Transition(
            FormulationStatus.IN_REVIEW,
            FormulationStatus.APPROVED,
            "approve",
            ["manager", "admin"],
        ),
        # In Review -> Rejected
        Transition(
            FormulationStatus.IN_REVIEW,
            FormulationStatus.REJECTED,
            "reject",
            ["manager", "admin"],
        ),
        # In Review -> Revision Requested
        Transition(
            FormulationStatus.IN_REVIEW,
            FormulationStatus.REVISION_REQUESTED,
            "request_revision",
            ["manager", "admin"],
        ),
        # Revision Requested -> Draft
        Transition(
            FormulationStatus.REVISION_REQUESTED,
            FormulationStatus.DRAFT,
            "revise",
            ["chemist", "senior_chemist", "manager", "admin"],
        ),
        # Approved -> Production
        Transition(
            FormulationStatus.APPROVED,
            FormulationStatus.PRODUCTION,
            "promote_to_production",
            ["manager", "admin"],
        ),
        # Production -> Archived
        Transition(
            FormulationStatus.PRODUCTION,
            FormulationStatus.ARCHIVED,
            "archive",
            ["manager", "admin"],
        ),
        # Any -> Archived (admin only)
        Transition(
            FormulationStatus.DRAFT,
            FormulationStatus.ARCHIVED,
            "archive",
            ["admin"],
        ),
        Transition(
            FormulationStatus.SUBMITTED,
            FormulationStatus.ARCHIVED,
            "archive",
            ["admin"],
        ),
        Transition(
            FormulationStatus.REJECTED,
            FormulationStatus.ARCHIVED,
            "archive",
            ["admin"],
        ),
    ]
    
    def __init__(self):
        self._transition_map: Dict[tuple, Transition] = {}
        for t in self.TRANSITIONS:
            key = (t.from_status, t.action)
            self._transition_map[key] = t
    
    def get_available_actions(
        self,
        current_status: FormulationStatus,
        user_role: str,
    ) -> List[str]:
        """Get actions available for current status and role"""
        actions = []
        
        for t in self.TRANSITIONS:
            if t.from_status == current_status and user_role in t.required_role:
                actions.append(t.action)
        
        return actions
    
    def can_transition(
        self,
        current_status: FormulationStatus,
        action: str,
        user_role: str,
    ) -> tuple[bool, Optional[str]]:
        """Check if transition is allowed"""
        key = (current_status, action)
        transition = self._transition_map.get(key)
        
        if not transition:
            return False, f"Invalid action '{action}' for status '{current_status.value}'"
        
        if user_role not in transition.required_role:
            return False, f"Role '{user_role}' cannot perform '{action}'"
        
        return True, None
    
    def execute_transition(
        self,
        current_status: FormulationStatus,
        action: str,
        user_role: str,
        context: Dict = None,
    ) -> tuple[FormulationStatus, Optional[str]]:
        """Execute transition and return new status"""
        can, error = self.can_transition(current_status, action, user_role)
        
        if not can:
            raise ValueError(error)
        
        key = (current_status, action)
        transition = self._transition_map[key]
        
        # Run validators if any
        if transition.validators:
            for validator in transition.validators:
                valid, msg = validator(context)
                if not valid:
                    raise ValueError(f"Validation failed: {msg}")
        
        # Execute callback if any
        if transition.on_transition:
            transition.on_transition(context)
        
        return transition.to_status
```

## 11.2 Workflow State Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORMULATION WORKFLOW STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────┐                                    │
│                              │  DRAFT  │◄───────────────────┐               │
│                              └────┬────┘                    │               │
│                                   │ submit                  │ revise        │
│                                   ▼                         │               │
│                              ┌─────────┐                    │               │
│                              │SUBMITTED│                    │               │
│                              └────┬────┘                    │               │
│                                   │ start_review            │               │
│                                   ▼                         │               │
│                            ┌───────────┐                    │               │
│                            │ IN_REVIEW │────────────────────┘               │
│                            └─────┬─────┘    request_revision                │
│                     ┌────────────┼────────────┐                             │
│                     │            │            │                             │
│                approve          │         reject                            │
│                     │            │            │                             │
│                     ▼            │            ▼                             │
│                ┌────────┐        │      ┌──────────┐                        │
│                │APPROVED│        │      │ REJECTED │                        │
│                └────┬───┘        │      └─────┬────┘                        │
│                     │            │            │                             │
│     promote_to_production        │         archive                          │
│                     │            │            │                             │
│                     ▼            │            ▼                             │
│              ┌───────────┐       │      ┌──────────┐                        │
│              │PRODUCTION │       │      │ ARCHIVED │◄───────────────────────┤
│              └─────┬─────┘       │      └──────────┘     archive (admin)    │
│                    │             │            ▲                             │
│                 archive          │            │                             │
│                    └─────────────┴────────────┘                             │
│                                                                             │
│  Legend:                                                                    │
│  ────────  Normal transition (chemist/manager)                              │
│  - - - -   Admin-only transition                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 12. File Storage & Documents

## 12.1 Storage Architecture

```python
# storage/file_service.py
import hashlib
import mimetypes
from pathlib import Path
from typing import BinaryIO, Optional, Dict
from dataclasses import dataclass
import aioboto3

@dataclass
class UploadResult:
    file_uri: str
    sha256: str
    file_size: int
    mime_type: str

class FileStorageService:
    """S3-compatible file storage service"""
    
    def __init__(
        self,
        endpoint_url: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str = "us-east-1",
    ):
        self.endpoint_url = endpoint_url
        self.bucket = bucket
        self.session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
    
    async def upload_file(
        self,
        file: BinaryIO,
        organization_id: str,
        filename: str,
        content_type: str = None,
    ) -> UploadResult:
        """Upload file to S3"""
        # Read and compute hash
        content = file.read()
        sha256 = hashlib.sha256(content).hexdigest()
        file_size = len(content)
        
        # Determine content type
        if not content_type:
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        
        # Generate S3 key
        key = f"{organization_id}/documents/{sha256[:8]}/{filename}"
        
        async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
            await s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
                Metadata={
                    "sha256": sha256,
                    "original_filename": filename,
                },
            )
        
        return UploadResult(
            file_uri=f"s3://{self.bucket}/{key}",
            sha256=sha256,
            file_size=file_size,
            mime_type=content_type,
        )
    
    async def get_presigned_url(
        self,
        file_uri: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate presigned URL for download"""
        # Parse s3:// URI
        if not file_uri.startswith("s3://"):
            raise ValueError("Invalid S3 URI")
        
        parts = file_uri[5:].split("/", 1)
        bucket = parts[0]
        key = parts[1]
        
        async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
            url = await s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        
        return url
    
    async def delete_file(self, file_uri: str):
        """Delete file from S3"""
        parts = file_uri[5:].split("/", 1)
        bucket = parts[0]
        key = parts[1]
        
        async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
            await s3.delete_object(Bucket=bucket, Key=key)
```

---

# PART D: USER EXPERIENCE

---

# 13. Design System

## 13.1 Brand Identity

```css
/* ALKEMI Design Tokens */
:root {
  /* Primary Colors */
  --alkemi-primary: #2563EB;        /* Blue 600 - Primary actions */
  --alkemi-primary-hover: #1D4ED8;  /* Blue 700 */
  --alkemi-primary-light: #DBEAFE; /* Blue 100 - Backgrounds */
  
  /* Secondary Colors */
  --alkemi-secondary: #7C3AED;      /* Violet 600 - AI features */
  --alkemi-secondary-hover: #6D28D9;
  
  /* Semantic Colors */
  --alkemi-success: #059669;        /* Emerald 600 */
  --alkemi-warning: #D97706;        /* Amber 600 */
  --alkemi-error: #DC2626;          /* Red 600 */
  --alkemi-info: #0891B2;           /* Cyan 600 */
  
  /* Neutral Colors */
  --alkemi-gray-50: #F9FAFB;
  --alkemi-gray-100: #F3F4F6;
  --alkemi-gray-200: #E5E7EB;
  --alkemi-gray-300: #D1D5DB;
  --alkemi-gray-400: #9CA3AF;
  --alkemi-gray-500: #6B7280;
  --alkemi-gray-600: #4B5563;
  --alkemi-gray-700: #374151;
  --alkemi-gray-800: #1F2937;
  --alkemi-gray-900: #111827;
  
  /* Function Colors (Chemistry) */
  --func-oligomer: #3B82F6;    /* Blue */
  --func-monomer: #10B981;     /* Green */
  --func-photoinitiator: #F59E0B; /* Amber */
  --func-pigment: #EF4444;     /* Red */
  --func-additive: #8B5CF6;    /* Purple */
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing Scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

## 13.2 Typography Scale

```css
/* Typography */
.text-xs   { font-size: 0.75rem; line-height: 1rem; }
.text-sm   { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg   { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl   { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl  { font-size: 1.5rem; line-height: 2rem; }
.text-3xl  { font-size: 1.875rem; line-height: 2.25rem; }
```

## 13.3 Component Library

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ variant = 'default', size = 'sm', children }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      ${variantStyles[variant]}
    `}>
      {children}
    </span>
  );
}
```

---

# 14. Onboarding Flow

## 14.1 Onboarding Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ALKEMI™  Formulations at the Speed of Thought              Setup Progress  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Welcome to ALKEMI                                                   │   │
│  │                                                                      │   │
│  │  Let's set up your formulation workspace in 4 steps.                │   │
│  │                                                                      │   │
│  │  ●━━━━━○━━━━━○━━━━━○                                                │   │
│  │  1      2      3      4                                              │   │
│  │  Domain  Materials  Team  First                                      │   │
│  │  Setup   Import    Invite Formulation                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Select Your Chemistry Domains                              │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │ ✓ UV Inks &     │  │ ○ Personal      │  │ ○ Specialty     │     │   │
│  │  │   Coatings      │  │   Care          │  │   Chemicals     │     │   │
│  │  │                 │  │                 │  │                 │     │   │
│  │  │ Offset, Flexo,  │  │ Skin, Hair,     │  │ Industrial,     │     │   │
│  │  │ Varnishes       │  │ Cosmetics       │  │ Adhesives       │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │                                                                      │   │
│  │  You can add more domains later.                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                               [Skip] [Continue →]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 14.2 First 30 Days Success Path

| Week | Actions | Milestone |
|------|---------|-----------|
| **1** | Import materials from Excel/CSV, Upload 10-20 TDS documents | Materials searchable |
| **2** | Enter 10-20 historical formulations, Train with AI on first formulation | First AI query answered |
| **3** | Record first trials against entered formulations | Prediction feedback loop active |
| **4** | Complete 50 formulations + 100 trials | Ready for high-value predictions |

---

# 15. Dashboard

## 15.1 Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ALKEMI™  Formulations at the Speed of Thought     [🔍 ⌘K]        UV Inks ▾  │ JD ▾    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ Navigation ───────────────────────────────────────────────────────────────────────┐ │
│  │  [🏠 Home]  [📋 Formulations]  [🧪 Materials]  [📦 Suppliers]  [✅ Approvals (3)]  │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌─ Quick Actions ─────────────────────────┐  ┌─ Pending Approvals ─────────────────┐  │
│  │                                         │  │                                      │  │
│  │  [+ New Formulation]  [📋 Record Trial] │  │  🔴 3 formulations waiting           │  │
│  │  [🔍 Find Alternative]  [💬 Ask AI]     │  │                                      │  │
│  │                                         │  │  • UV-INK-BLK-004  submitted 2h ago  │  │
│  └─────────────────────────────────────────┘  │  • UV-VAR-GLO-012  submitted 1d ago  │  │
│                                               │  • UV-FLX-YEL-001  submitted 2d ago  │  │
│  ┌─ My Recent Work ────────────────────────┐  │                                      │  │
│  │                                         │  │  [Review All →]                      │  │
│  │  📄 UV-INK-BLK-005     Draft    2h ago  │  └──────────────────────────────────────┘  │
│  │  📄 UV-VAR-MAT-003     In Review 1d ago │                                            │
│  │  📄 UV-FLX-CYA-002     Approved  3d ago │  ┌─ AI Insights ────────────────────────┐  │
│  │  📄 UV-INK-MAG-001     Production 1w    │  │                                      │  │
│  │                                         │  │  💡 3 formulations have high cure    │  │
│  │  [View All →]                           │  │     speed uncertainty. Consider      │  │
│  └─────────────────────────────────────────┘  │     additional trials.               │  │
│                                               │                                      │  │
│  ┌─ Prediction Accuracy ───────────────────┐  │  ⚠️ Supplier BASF lead time          │  │
│  │                                         │  │     increased to 45 days.            │  │
│  │  Viscosity  ████████████░░  92% (↑2%)   │  │                                      │  │
│  │  Gloss      █████████░░░░░  78% (↓1%)   │  │  📊 Model accuracy improved 3%       │  │
│  │  Cure Speed ██████████░░░░  85% (—)     │  │     after last week's trials.        │  │
│  │  Adhesion   ████████░░░░░░  72% (↑5%)   │  │                                      │  │
│  │                                         │  └──────────────────────────────────────┘  │
│  │  Based on 847 validated trials          │                                            │
│  └─────────────────────────────────────────┘  ┌─ Compliance Alerts ──────────────────┐  │
│                                               │                                      │  │
│  ┌─ Activity Feed ─────────────────────────┐  │  ✓ All active formulations compliant │  │
│  │                                         │  │                                      │  │
│  │  🔵 Sarah approved UV-FLX-BLK-003  1h   │  │  ⚠️ 2 materials on SVHC watchlist    │  │
│  │  🟢 Trial TRIAL-2026-0142 passed   2h   │  │     • Pigment Red 53:1               │  │
│  │  🟡 Mike requested revision        3h   │  │     • TPGDA (high concern)           │  │
│  │  🔵 New material added: HDDA-LP    4h   │  │                                      │  │
│  │                                         │  └──────────────────────────────────────┘  │
│  └─────────────────────────────────────────┘                                            │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 15.2 Dashboard Component

```typescript
// app/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  ClipboardList, 
  Search, 
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard"),
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ["approvals", { status: "pending" }],
    queryFn: () => api.get("/approvals?status=pending&limit=5"),
  });

  const { data: recentFormulations } = useQuery({
    queryKey: ["formulations", { recent: true }],
    queryFn: () => api.get("/formulations?sort=-updated_at&limit=5"),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex flex-col gap-2">
          <Plus className="h-5 w-5" />
          <span>New Formulation</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2">
          <ClipboardList className="h-5 w-5" />
          <span>Record Trial</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2">
          <Search className="h-5 w-5" />
          <span>Find Alternative</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2">
          <MessageSquare className="h-5 w-5" />
          <span>Ask AI</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Recent Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFormulations?.items?.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{f.code}</p>
                    <p className="text-xs text-gray-500">{f.name}</p>
                  </div>
                  <Badge variant={getStatusVariant(f.latest_status)}>
                    {f.latest_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Pending Approvals
              {pendingApprovals?.total > 0 && (
                <Badge variant="error">{pendingApprovals.total}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals?.items?.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.version.family.code}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {formatTimeAgo(a.requested_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Review <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.insights?.map((insight, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  {insight.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  )}
                  <p>{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            {dashboardData?.accuracy?.map((prop) => (
              <div key={prop.property}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{prop.property}</span>
                  <span className="text-sm text-gray-500">{prop.accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${prop.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusVariant(status: string) {
  const map = {
    draft: "default",
    submitted: "info",
    in_review: "warning",
    approved: "success",
    production: "success",
    rejected: "error",
  };
  return map[status] || "default";
}

function formatTimeAgo(date: string) {
  // Simple time ago formatting
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

---

# 16. Formulation Editor

## 16.1 Editor Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ALKEMI™                                          [🔍 ⌘K]        UV Inks ▾  │ JD ▾    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to Formulations                                                                 │
│                                                                                         │
│  ┌─ Header ──────────────────────────────────────────────────────────────────────────┐ │
│  │  UV-INK-BLK-004                                                                   │ │
│  │  UV Offset Black - High Speed                                 v3 │ main           │ │
│  │  ┌──────┐                                                                         │ │
│  │  │ DRAFT│  Last saved 2 min ago                    [Run Predictions] [Submit →]  │ │
│  │  └──────┘                                                                         │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌─ COMPOSITION ─────────────────────────────────┐ ┌─ PROPERTY TARGETS ──────────────┐ │
│  │                                               │ │                                  │ │
│  │  ┌────────────────────────────────────────┐   │ │  Property      Target   Range   │ │
│  │  │ Material        Function      %    $/kg│   │ │  ─────────────────────────────  │ │
│  │  ├────────────────────────────────────────┤   │ │  Viscosity     2100    1800-2400│ │
│  │  │ Ebecryl 830     OLIGOMER    55.0  €8.50│   │ │  ├── 🟢 95% prob in spec        │ │
│  │  │ HDDA            MONOMER     20.0  €4.20│   │ │  │   Predicted: 2080 ± 120      │ │
│  │  │ TMPTA           MONOMER      8.0  €5.80│   │ │                                  │ │
│  │  │ Irgacure 184    PHOTOINIT    3.5 €18.00│   │ │  Gloss (60°)    75     70-80    │ │
│  │  │ Irgacure 819    PHOTOINIT    1.0 €45.00│   │ │  ├── 🟡 72% prob in spec        │ │
│  │  │ Carbon Black    PIGMENT     12.0 €12.00│   │ │  │   Predicted: 73 ± 8          │ │
│  │  │ BYK-307         ADDITIVE     0.5 €35.00│   │ │                                  │ │
│  │  ├────────────────────────────────────────┤   │ │  Cure Speed    60      50+      │ │
│  │  │ TOTAL                      100.0  €9.82│   │ │  ├── 🟢 89% prob in spec        │ │
│  │  └────────────────────────────────────────┘   │ │  │   Predicted: 65 ± 8 m/min    │ │
│  │                                               │ │                                  │ │
│  │  [+ Add Ingredient]                           │ │  Adhesion       4      3+       │ │
│  │                                               │ │  ├── 🔴 45% prob in spec        │ │
│  └───────────────────────────────────────────────┘ │  │   Predicted: 2.8 ± 0.8       │ │
│                                                    │  │   ⚠️ High uncertainty         │ │
│  ┌─ PROCESS STEPS ───────────────────────────────┐ │                                  │ │
│  │                                               │ │  [+ Add Spec]                    │ │
│  │  1. Premix oligomer + monomers   │ 600 RPM   │ └──────────────────────────────────┘ │
│  │     10 min at 25°C               │           │                                      │
│  │                                               │ ┌─ AI ASSISTANT ─────────────────┐  │
│  │  2. Add photoinitiators slowly   │ 400 RPM   │ │                                  │  │
│  │     5 min at 25°C                │           │ │  💬 "How can I improve adhesion  │  │
│  │                                               │ │      without affecting cure?"    │  │
│  │  3. Add pigment dispersion       │ 800 RPM   │ │                                  │  │
│  │     20 min, monitor temperature  │           │ │  Suggestions:                    │  │
│  │                                               │ │  • Increase oligomer to 58%     │  │
│  │  4. Add additive                 │ 400 RPM   │ │  • Add adhesion promoter (0.3%) │  │
│  │     5 min, deaerate              │           │ │  • Consider substrate treatment  │  │
│  │                                               │ │                                  │  │
│  │  [+ Add Step]                                 │ │  [Ask AI] [Start Debate]         │  │
│  └───────────────────────────────────────────────┘ └──────────────────────────────────┘  │
│                                                                                         │
│  ┌─ TABS ────────────────────────────────────────────────────────────────────────────┐ │
│  │  [Trials (3)]  [Batches (0)]  [Notes]  [Attachments]  [History]                   │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 16.2 Composition Table Component

```typescript
// components/formulation/CompositionTable.tsx
"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus, AlertTriangle } from "lucide-react";
import { MaterialSelector } from "./MaterialSelector";
import { api } from "@/lib/api";

interface Ingredient {
  id: string;
  material_id: string;
  material: {
    code: string;
    name: string;
    category: string;
  };
  function: string;
  percentage: number;
  supplier_id?: string;
  is_critical: boolean;
  price_per_kg?: number;
}

interface CompositionTableProps {
  versionId: string;
  ingredients: Ingredient[];
  validFunctions: string[];
  readOnly?: boolean;
  onUpdate: (ingredients: Ingredient[]) => void;
}

const FUNCTION_COLORS: Record<string, string> = {
  OLIGOMER: "bg-blue-100 text-blue-800",
  MONOMER: "bg-green-100 text-green-800",
  PHOTOINITIATOR: "bg-amber-100 text-amber-800",
  PIGMENT: "bg-red-100 text-red-800",
  ADDITIVE: "bg-purple-100 text-purple-800",
};

export function CompositionTable({
  versionId,
  ingredients,
  validFunctions,
  readOnly = false,
  onUpdate,
}: CompositionTableProps) {
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate totals
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) <= 0.1;
  
  const totalCost = ingredients.reduce((sum, ing) => {
    const price = ing.price_per_kg || 0;
    return sum + (price * ing.percentage / 100);
  }, 0);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = ingredients.findIndex((i) => i.id === active.id);
      const newIndex = ingredients.findIndex((i) => i.id === over.id);
      
      const newIngredients = arrayMove(ingredients, oldIndex, newIndex);
      onUpdate(newIngredients);
    }
  }, [ingredients, onUpdate]);

  const handlePercentageChange = useCallback((id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newIngredients = ingredients.map((ing) =>
      ing.id === id ? { ...ing, percentage: numValue } : ing
    );
    onUpdate(newIngredients);
  }, [ingredients, onUpdate]);

  const handleRemoveIngredient = useCallback((id: string) => {
    const newIngredients = ingredients.filter((ing) => ing.id !== id);
    onUpdate(newIngredients);
  }, [ingredients, onUpdate]);

  const handleAddIngredient = useCallback((material: any, func: string) => {
    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      material_id: material.id,
      material: {
        code: material.code,
        name: material.name,
        category: material.category,
      },
      function: func,
      percentage: 0,
      is_critical: false,
      price_per_kg: material.commercial?.price_per_kg,
    };
    
    onUpdate([...ingredients, newIngredient]);
    setShowMaterialSelector(false);
  }, [ingredients, onUpdate]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Composition</h3>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
            Total: {totalPercentage.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">
            Cost: ₹{totalCost.toFixed(2)}/kg
          </span>
        </div>
      </div>

      {!isValidTotal && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Composition must sum to 100% (currently {totalPercentage.toFixed(1)}%)</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Function</TableHead>
              <TableHead className="text-right w-24">%</TableHead>
              <TableHead className="text-right w-24">₹/kg</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={ingredients.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {ingredients.map((ingredient) => (
                <SortableIngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  readOnly={readOnly}
                  onPercentageChange={handlePercentageChange}
                  onRemove={handleRemoveIngredient}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMaterialSelector(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      )}

      {showMaterialSelector && (
        <MaterialSelector
          onSelect={handleAddIngredient}
          onClose={() => setShowMaterialSelector(false)}
          validFunctions={validFunctions}
          excludeMaterialIds={ingredients.map((i) => i.material_id)}
        />
      )}
    </div>
  );
}

// Sortable row component
function SortableIngredientRow({
  ingredient,
  readOnly,
  onPercentageChange,
  onRemove,
}: {
  ingredient: Ingredient;
  readOnly: boolean;
  onPercentageChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const functionColor = FUNCTION_COLORS[ingredient.function] || "bg-gray-100 text-gray-800";

  return (
    <TableRow>
      <TableCell>
        {!readOnly && (
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
        )}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{ingredient.material.name}</p>
          <p className="text-xs text-gray-500">{ingredient.material.code}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={functionColor}>{ingredient.function}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {readOnly ? (
          <span>{ingredient.percentage.toFixed(1)}</span>
        ) : (
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={ingredient.percentage}
            onChange={(e) => onPercentageChange(ingredient.id, e.target.value)}
            className="w-20 text-right"
          />
        )}
      </TableCell>
      <TableCell className="text-right text-gray-500">
        {ingredient.price_per_kg ? `₹${ingredient.price_per_kg.toFixed(2)}` : "-"}
      </TableCell>
      <TableCell>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(ingredient.id)}
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
```

## 16.3 Property Predictions Component

```typescript
// components/formulation/PropertyPredictions.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

interface Prediction {
  property_key: string;
  property_name: string;
  predicted_value: number;
  uncertainty: number;
  confidence_interval_95: [number, number];
  probability_in_spec: number;
  unit: string;
  spec?: {
    target?: number;
    min?: number;
    max?: number;
  };
}

interface PropertyPredictionsProps {
  predictions: Prediction[];
  loading?: boolean;
}

export function PropertyPredictions({ predictions, loading }: PropertyPredictionsProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Property Predictions</h3>
      
      {predictions.map((pred) => (
        <PropertyCard key={pred.property_key} prediction={pred} />
      ))}
    </div>
  );
}

function PropertyCard({ prediction }: { prediction: Prediction }) {
  const prob = prediction.probability_in_spec;
  
  // Determine status
  let status: "success" | "warning" | "error";
  let StatusIcon = CheckCircle;
  
  if (prob >= 0.8) {
    status = "success";
    StatusIcon = CheckCircle;
  } else if (prob >= 0.5) {
    status = "warning";
    StatusIcon = AlertTriangle;
  } else {
    status = "error";
    StatusIcon = AlertTriangle;
  }

  const statusColors = {
    success: "text-green-600",
    warning: "text-amber-600",
    error: "text-red-600",
  };

  const progressColors = {
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div className="p-4 border rounded-lg space-y-2">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{prediction.property_name}</h4>
          {prediction.spec && (
            <p className="text-sm text-gray-500">
              Target: {prediction.spec.target} {prediction.unit}
              {prediction.spec.min && prediction.spec.max && (
                <span className="ml-2">
                  ({prediction.spec.min} - {prediction.spec.max})
                </span>
              )}
            </p>
          )}
        </div>
        <Badge
          variant={status === "success" ? "success" : status === "warning" ? "warning" : "error"}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {(prob * 100).toFixed(0)}% in spec
        </Badge>
      </div>

      {/* Prediction value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">
          {prediction.predicted_value.toFixed(1)}
        </span>
        <span className="text-gray-500">{prediction.unit}</span>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-sm text-gray-400">
              ± {prediction.uncertainty.toFixed(1)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>95% confidence interval:</p>
            <p>
              {prediction.confidence_interval_95[0].toFixed(1)} -{" "}
              {prediction.confidence_interval_95[1].toFixed(1)} {prediction.unit}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Probability bar */}
      <div className="space-y-1">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColors[status]} transition-all`}
            style={{ width: `${prob * 100}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {prediction.uncertainty / prediction.predicted_value > 0.15 && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span>High uncertainty - consider additional trials</span>
        </div>
      )}
    </div>
  );
}
```

---

# 17. Approval Workflow UI

## 17.1 Approval Queue Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ALKEMI™                                          [🔍 ⌘K]        UV Inks ▾  │ JD ▾    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Approvals                                                                              │
│                                                                                         │
│  ┌─ Filters ─────────────────────────────────────────────────────────────────────────┐ │
│  │  Status: [All ▾]  Domain: [All ▾]  Requested by: [All ▾]     [🔍 Search...]      │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌─ Pending (3) ─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  UV-INK-BLK-004 v3                                                         │   │ │
│  │  │  UV Offset Black - High Speed                                              │   │ │
│  │  │                                                                            │   │ │
│  │  │  Requested by: John Doe         2 hours ago                               │   │ │
│  │  │                                                                            │   │ │
│  │  │  ┌─ Changes ───────────────────┐  ┌─ Predictions ─────────────────────┐   │   │ │
│  │  │  │  • Increased oligomer 52→55% │  │  Viscosity:  🟢 2080 cP (95%)     │   │   │ │
│  │  │  │  • Reduced monomer 23→20%   │  │  Gloss:      🟡 73 GU (72%)       │   │   │ │
│  │  │  │  • Added BYK-307 0.5%       │  │  Cure:       🟢 65 m/min (89%)    │   │   │ │
│  │  │  │  • Target: improve adhesion │  │  Adhesion:   🔴 2.8 (45%)         │   │   │ │
│  │  │  └─────────────────────────────┘  └───────────────────────────────────┘   │   │ │
│  │  │                                                                            │   │ │
│  │  │  ⚠️ AI Assessment: Adhesion prediction has high uncertainty (±0.8).        │   │ │
│  │  │     Recommend lab trial before production.                                 │   │ │
│  │  │                                                                            │   │ │
│  │  │  [View Details]  [Request Revision]  [Reject]  [✓ Approve]               │   │ │
│  │  └────────────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  UV-VAR-GLO-012 v2                                                         │   │ │
│  │  │  UV Varnish Gloss - Standard                                               │   │ │
│  │  │  ...                                                                       │   │ │
│  │  └────────────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌─ Recently Decided ────────────────────────────────────────────────────────────────┐ │
│  │                                                                                    │ │
│  │  ✓ UV-FLX-BLK-003 v1  Approved by Sarah  1 day ago                               │ │
│  │  ✗ UV-INK-YEL-002 v4  Rejected by Mike   2 days ago                              │ │
│  │  ↻ UV-VAR-MAT-001 v2  Revision requested  3 days ago                             │ │
│  │                                                                                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 18. Quick Tools

## 18.1 Command Palette

```typescript
// components/CommandPalette.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  Plus,
  MessageSquare,
  Beaker,
  Package,
  Settings,
  LogOut,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search formulations, materials, or ask AI..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found. Try asking AI?
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/formulations/new"))}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
                <span>New Formulation</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/trials/new"))}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <Beaker className="h-4 w-4" />
                <span>Record Trial</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => {
                  // Open AI chat
                })}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Ask AI</span>
                <span className="ml-auto text-xs text-gray-400">Natural language</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/formulations"))}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span>Formulations</span>
                <span className="ml-auto text-xs text-gray-400">G F</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/materials"))}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <Package className="h-4 w-4" />
                <span>Materials</span>
                <span className="ml-auto text-xs text-gray-400">G M</span>
              </Command.Item>
            </Command.Group>

            {/* Recent Formulations */}
            <Command.Group heading="Recent Formulations">
              {/* These would be populated from API */}
              <Command.Item
                onSelect={() => runCommand(() => router.push("/formulations/xxx"))}
                className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-100"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                <span>UV-INK-BLK-004</span>
                <span className="text-xs text-gray-400">Draft</span>
                <ArrowRight className="ml-auto h-3 w-3 text-gray-400" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-gray-500 flex justify-between">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

## 18.2 Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` / `Ctrl+K` | Open command palette | Global |
| `⌘S` / `Ctrl+S` | Save | Editor |
| `⌘Z` / `Ctrl+Z` | Undo | Editor |
| `⌘⇧Z` / `Ctrl+Shift+Z` | Redo | Editor |
| `⌘N` / `Ctrl+N` | New formulation | Global |
| `⌘P` / `Ctrl+P` | Run predictions | Editor |
| `⌘Enter` | Submit for approval | Editor (draft) |
| `G H` | Go to Home | Navigation |
| `G F` | Go to Formulations | Navigation |
| `G M` | Go to Materials | Navigation |
| `G A` | Go to Approvals | Navigation |
| `?` | Show shortcuts | Global |
| `Esc` | Close modal/dialog | Global |

---

*Continued in Part 3: Intelligence Layer...*
# ALKEMI™ v5.0 — Part 3: Intelligence Layer

---

# PART E: INTELLIGENCE LAYER

---

# 19. Scientific Prediction Engine

## 19.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PREDICTION ENGINE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INPUT: Formulation Version                    │   │
│  │  • Ingredients (material_id, function, percentage)                   │   │
│  │  • Specifications (property_key, target, min, max)                   │   │
│  │  • Process steps (parameters)                                        │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                         │
│                                  ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FEATURE EXTRACTION                                │   │
│  │  • Material properties lookup                                        │   │
│  │  • Function aggregations (total oligomer %, etc.)                    │   │
│  │  • Molecular descriptors (if SMILES available)                       │   │
│  │  • Process parameters                                                │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                         │
│            ┌─────────────────────┼─────────────────────┐                   │
│            ▼                     ▼                     ▼                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ PHYSICS ENGINE  │  │   ML MODELS     │  │  LLM REASONING  │            │
│  │                 │  │                 │  │                 │            │
│  │ • Beer-Lambert  │  │ • XGBoost       │  │ • Explanations  │            │
│  │ • Log-Mixing    │  │ • Neural Net    │  │ • Anomaly notes │            │
│  │ • Hansen HSP    │  │ • Ensemble      │  │ • Suggestions   │            │
│  │ • HLB Theory    │  │                 │  │                 │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
│           └────────────────────┼────────────────────┘                      │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 UNCERTAINTY QUANTIFICATION                           │   │
│  │  • Ensemble variance                                                 │   │
│  │  • Conformal prediction bands                                        │   │
│  │  • Extrapolation detection                                           │   │
│  │  • Measurement noise model                                           │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                         │
│                                  ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        OUTPUT: Predictions                           │   │
│  │  • property_key, value, unit                                         │   │
│  │  • uncertainty, confidence_interval_95                               │   │
│  │  • probability_in_spec                                               │   │
│  │  • explanation, warnings                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 19.2 Prediction Service Implementation

```python
# services/prediction_service.py
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from enum import Enum
import hashlib
import json
import numpy as np
from datetime import datetime

@dataclass
class PredictionResult:
    property_key: str
    property_name: str
    value: float
    unit: str
    uncertainty: float
    confidence_interval_95: tuple[float, float]
    probability_in_spec: float
    explanation: Dict[str, Any]
    warnings: List[str] = field(default_factory=list)
    feature_importance: Dict[str, float] = field(default_factory=dict)

@dataclass
class PredictionSuiteResult:
    version_id: str
    predictions: List[PredictionResult]
    overall_probability: float
    highest_risk_property: str
    input_hash: str
    model_versions: Dict[str, str]
    computation_time_ms: int
    created_at: datetime

class PredictionService:
    """
    Orchestrates property predictions for formulations.
    
    Combines physics models, ML models, and uncertainty quantification
    to provide calibrated predictions with explanations.
    """
    
    def __init__(
        self,
        domain_pack_loader,
        model_registry,
        material_service,
        uncertainty_quantifier,
        cache_service,
    ):
        self.domain_pack_loader = domain_pack_loader
        self.model_registry = model_registry
        self.material_service = material_service
        self.uncertainty_quantifier = uncertainty_quantifier
        self.cache = cache_service
    
    async def predict(
        self,
        version_id: str,
        ingredients: List[Dict],
        specs: List[Dict],
        process_steps: List[Dict] = None,
        domain_id: str = None,
        force_refresh: bool = False,
    ) -> PredictionSuiteResult:
        """
        Run full prediction suite for a formulation version.
        """
        import time
        start_time = time.time()
        
        # Compute input hash for caching
        input_hash = self._compute_input_hash(ingredients, specs, process_steps)
        
        # Check cache
        if not force_refresh:
            cached = await self.cache.get(f"predictions:{version_id}:{input_hash}")
            if cached:
                return cached
        
        # Load domain pack
        domain_pack = await self.domain_pack_loader.load(domain_id)
        
        # Extract features
        features = await self._extract_features(
            ingredients, process_steps, domain_pack
        )
        
        # Run predictions for each property
        predictions = []
        model_versions = {}
        
        for prop_config in domain_pack.properties:
            prop_key = prop_config["key"]
            
            # Get spec for this property
            spec = next(
                (s for s in specs if s["property_key"] == prop_key),
                None
            )
            
            # Run prediction
            result = await self._predict_property(
                prop_key=prop_key,
                prop_config=prop_config,
                features=features,
                spec=spec,
                domain_pack=domain_pack,
            )
            
            predictions.append(result)
            model_versions[prop_key] = domain_pack.model_versions.get(prop_key, "1.0")
        
        # Calculate overall probability
        overall_prob = np.prod([p.probability_in_spec for p in predictions])
        
        # Find highest risk property
        highest_risk = min(predictions, key=lambda p: p.probability_in_spec)
        
        computation_time = int((time.time() - start_time) * 1000)
        
        result = PredictionSuiteResult(
            version_id=version_id,
            predictions=predictions,
            overall_probability=overall_prob,
            highest_risk_property=highest_risk.property_key,
            input_hash=input_hash,
            model_versions=model_versions,
            computation_time_ms=computation_time,
            created_at=datetime.utcnow(),
        )
        
        # Cache result
        await self.cache.set(
            f"predictions:{version_id}:{input_hash}",
            result,
            ttl=3600,  # 1 hour
        )
        
        return result
    
    async def _extract_features(
        self,
        ingredients: List[Dict],
        process_steps: List[Dict],
        domain_pack,
    ) -> Dict[str, float]:
        """Extract features from formulation for model input"""
        features = {}
        
        # Load full material data
        material_ids = [ing["material_id"] for ing in ingredients]
        materials = await self.material_service.get_by_ids(material_ids)
        materials_map = {m.id: m for m in materials}
        
        # Function totals
        function_totals = {}
        for ing in ingredients:
            func = ing["function"]
            pct = ing["percentage"]
            function_totals[func] = function_totals.get(func, 0) + pct
        
        for func in domain_pack.functions:
            features[f"total_{func.lower()}_pct"] = function_totals.get(func, 0)
        
        # Weighted average of material properties
        for prop_name in domain_pack.material_properties:
            weighted_sum = 0
            total_weight = 0
            
            for ing in ingredients:
                material = materials_map.get(ing["material_id"])
                if material and prop_name in material.properties:
                    pct = ing["percentage"] / 100
                    weighted_sum += material.properties[prop_name] * pct
                    total_weight += pct
            
            if total_weight > 0:
                features[f"avg_{prop_name}"] = weighted_sum / total_weight
            else:
                features[f"avg_{prop_name}"] = 0
        
        # Process parameters (if available)
        if process_steps:
            for step in process_steps:
                params = step.get("parameters", {})
                step_num = step.get("step_number", 0)
                for param_name, param_value in params.items():
                    if isinstance(param_value, (int, float)):
                        features[f"step{step_num}_{param_name}"] = param_value
        
        # Ingredient count
        features["ingredient_count"] = len(ingredients)
        
        # Hansen solubility parameters (weighted average)
        hansen_d, hansen_p, hansen_h = 0, 0, 0
        for ing in ingredients:
            material = materials_map.get(ing["material_id"])
            if material:
                pct = ing["percentage"] / 100
                hansen_d += (material.hansen_d or 0) * pct
                hansen_p += (material.hansen_p or 0) * pct
                hansen_h += (material.hansen_h or 0) * pct
        
        features["hansen_d"] = hansen_d
        features["hansen_p"] = hansen_p
        features["hansen_h"] = hansen_h
        
        return features
    
    async def _predict_property(
        self,
        prop_key: str,
        prop_config: Dict,
        features: Dict[str, float],
        spec: Optional[Dict],
        domain_pack,
    ) -> PredictionResult:
        """Predict a single property with uncertainty"""
        
        # Get physics model (if available)
        physics_model = domain_pack.physics_models.get(prop_key)
        
        # Get ML model
        ml_model = await self.model_registry.get_model(
            f"{domain_pack.key}.{prop_key}"
        )
        
        # Physics prediction (baseline)
        physics_value = None
        if physics_model:
            physics_value = physics_model.predict(features)
        
        # ML prediction
        ml_value = None
        ml_uncertainty = None
        if ml_model:
            ml_result = ml_model.predict_with_uncertainty(features)
            ml_value = ml_result["value"]
            ml_uncertainty = ml_result["uncertainty"]
        
        # Combine predictions (physics as prior, ML as correction)
        if physics_value is not None and ml_value is not None:
            # Weighted combination
            final_value = 0.3 * physics_value + 0.7 * ml_value
        elif ml_value is not None:
            final_value = ml_value
        elif physics_value is not None:
            final_value = physics_value
        else:
            raise ValueError(f"No model available for {prop_key}")
        
        # Uncertainty quantification
        uncertainty_result = self.uncertainty_quantifier.quantify(
            predicted_value=final_value,
            ml_uncertainty=ml_uncertainty,
            features=features,
            property_config=prop_config,
        )
        
        # Calculate probability in spec
        prob_in_spec = self._calculate_prob_in_spec(
            value=final_value,
            uncertainty=uncertainty_result.total_uncertainty,
            spec=spec,
        )
        
        # Generate explanation
        explanation = self._generate_explanation(
            prop_key=prop_key,
            value=final_value,
            features=features,
            physics_value=physics_value,
            ml_value=ml_value,
            ml_model=ml_model,
        )
        
        # Check for warnings
        warnings = []
        if uncertainty_result.extrapolation_risk > 0.5:
            warnings.append("Prediction may be unreliable - outside training data range")
        if prob_in_spec < 0.5:
            warnings.append(f"High risk of not meeting specification")
        
        return PredictionResult(
            property_key=prop_key,
            property_name=prop_config.get("name", prop_key),
            value=final_value,
            unit=prop_config.get("unit", ""),
            uncertainty=uncertainty_result.total_uncertainty,
            confidence_interval_95=uncertainty_result.confidence_interval_95,
            probability_in_spec=prob_in_spec,
            explanation=explanation,
            warnings=warnings,
            feature_importance=ml_model.feature_importance if ml_model else {},
        )
    
    def _calculate_prob_in_spec(
        self,
        value: float,
        uncertainty: float,
        spec: Optional[Dict],
    ) -> float:
        """Calculate probability of meeting specification"""
        if not spec:
            return 1.0
        
        from scipy import stats
        
        min_val = spec.get("min_value")
        max_val = spec.get("max_value")
        
        if uncertainty <= 0:
            # Deterministic check
            if min_val is not None and value < min_val:
                return 0.0
            if max_val is not None and value > max_val:
                return 0.0
            return 1.0
        
        # Assume normal distribution
        dist = stats.norm(loc=value, scale=uncertainty)
        
        if min_val is not None and max_val is not None:
            prob = dist.cdf(max_val) - dist.cdf(min_val)
        elif min_val is not None:
            prob = 1 - dist.cdf(min_val)
        elif max_val is not None:
            prob = dist.cdf(max_val)
        else:
            prob = 1.0
        
        return max(0.0, min(1.0, prob))
    
    def _generate_explanation(
        self,
        prop_key: str,
        value: float,
        features: Dict[str, float],
        physics_value: Optional[float],
        ml_value: Optional[float],
        ml_model,
    ) -> Dict[str, Any]:
        """Generate human-readable explanation"""
        explanation = {
            "summary": f"Predicted {prop_key} = {value:.2f}",
            "method": [],
            "key_drivers": [],
        }
        
        if physics_value is not None:
            explanation["method"].append(f"Physics model: {physics_value:.2f}")
        if ml_value is not None:
            explanation["method"].append(f"ML model: {ml_value:.2f}")
        
        # Top feature importance
        if ml_model and ml_model.feature_importance:
            sorted_features = sorted(
                ml_model.feature_importance.items(),
                key=lambda x: abs(x[1]),
                reverse=True,
            )[:5]
            
            for feat_name, importance in sorted_features:
                feat_value = features.get(feat_name, 0)
                explanation["key_drivers"].append({
                    "feature": feat_name,
                    "value": feat_value,
                    "importance": importance,
                })
        
        return explanation
    
    def _compute_input_hash(
        self,
        ingredients: List[Dict],
        specs: List[Dict],
        process_steps: List[Dict],
    ) -> str:
        """Compute deterministic hash of inputs for caching"""
        data = {
            "ingredients": sorted(
                [(i["material_id"], i["percentage"]) for i in ingredients]
            ),
            "specs": sorted(
                [(s["property_key"], s.get("min_value"), s.get("max_value"))
                 for s in specs]
            ),
            "process": [
                (s.get("step_number"), json.dumps(s.get("parameters", {}), sort_keys=True))
                for s in (process_steps or [])
            ],
        }
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
```

---

# 20. Physics Constraints Library

## 20.1 Beer-Lambert Law (UV Curing Depth)

The Beer-Lambert law governs UV light absorption in coatings.

**Formula:**
```
I(x) = I₀ × e^(-αx)
```

Where:
- `I(x)` = Light intensity at depth x
- `I₀` = Initial light intensity
- `α` = Absorption coefficient (depends on pigment loading)
- `x` = Depth into coating

```python
# physics/beer_lambert.py
import numpy as np
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class CureDepthResult:
    cure_depth_um: float          # Maximum cure depth in micrometers
    surface_cure_pct: float       # Surface cure percentage
    through_cure_depth_um: float  # Depth where 90% cure achieved
    warnings: List[str]

class BeerLambertModel:
    """
    Beer-Lambert law for UV cure depth prediction.
    
    Used to predict how deep UV light penetrates and cures
    based on pigment loading and photoinitiator concentration.
    """
    
    # Molar absorption coefficients (L/mol·cm) for common pigments
    ABSORPTION_COEFFICIENTS = {
        "carbon_black": 1.5e6,      # Very high absorption
        "phthalocyanine_blue": 8e4,
        "phthalocyanine_green": 7e4,
        "quinacridone_red": 5e4,
        "diarylide_yellow": 3e4,
        "titanium_dioxide": 2e3,    # White - scatters more than absorbs
        "transparent": 100,         # Clear coatings
    }
    
    # Critical cure threshold (fraction of surface intensity)
    CURE_THRESHOLD = 0.1  # 10% of surface intensity minimum for cure
    
    def __init__(self, wavelength_nm: int = 365):
        self.wavelength_nm = wavelength_nm
    
    def predict_cure_depth(
        self,
        pigment_type: str,
        pigment_concentration_pct: float,
        coating_thickness_um: float,
        photoinitiator_pct: float = 4.0,
        uv_intensity_mw_cm2: float = 200,
    ) -> CureDepthResult:
        """
        Predict UV cure depth based on Beer-Lambert absorption.
        
        Args:
            pigment_type: Type of pigment (affects absorption)
            pigment_concentration_pct: Pigment loading (%)
            coating_thickness_um: Target coating thickness (micrometers)
            photoinitiator_pct: Photoinitiator concentration (%)
            uv_intensity_mw_cm2: UV lamp intensity
        
        Returns:
            CureDepthResult with cure depth predictions
        """
        warnings = []
        
        # Get absorption coefficient
        alpha_base = self.ABSORPTION_COEFFICIENTS.get(
            pigment_type.lower().replace(" ", "_"),
            self.ABSORPTION_COEFFICIENTS["transparent"]
        )
        
        # Effective absorption coefficient (scales with concentration)
        # α_eff = α_base × C_pigment + α_PI × C_PI
        alpha_pigment = alpha_base * (pigment_concentration_pct / 100)
        alpha_pi = 1e3 * (photoinitiator_pct / 100)  # PI absorption
        alpha_total = alpha_pigment + alpha_pi
        
        # Convert to per-micrometer
        alpha_um = alpha_total / 10000  # cm⁻¹ to µm⁻¹
        
        # Calculate cure depth (depth where I = CURE_THRESHOLD × I₀)
        # CURE_THRESHOLD = e^(-α × cure_depth)
        # cure_depth = -ln(CURE_THRESHOLD) / α
        if alpha_um > 0:
            cure_depth = -np.log(self.CURE_THRESHOLD) / alpha_um
        else:
            cure_depth = float('inf')
        
        # Through-cure depth (where 90% cure achieved)
        # Assuming cure rate proportional to absorbed energy
        through_cure_depth = -np.log(0.1) / alpha_um if alpha_um > 0 else float('inf')
        
        # Surface cure percentage (based on photoinitiator and intensity)
        # Simplified model: higher PI and intensity = better surface cure
        surface_cure = min(100, 20 * photoinitiator_pct * (uv_intensity_mw_cm2 / 100))
        
        # Warnings
        if cure_depth < coating_thickness_um:
            warnings.append(
                f"Cure depth ({cure_depth:.1f}µm) less than coating thickness "
                f"({coating_thickness_um:.1f}µm). May have uncured material."
            )
        
        if pigment_concentration_pct > 15 and pigment_type == "carbon_black":
            warnings.append(
                "High carbon black loading significantly reduces cure depth. "
                "Consider LED-specific photoinitiators."
            )
        
        if through_cure_depth < coating_thickness_um * 0.8:
            warnings.append(
                "Through-cure may be insufficient. Consider multiple passes or "
                "reduced film thickness."
            )
        
        return CureDepthResult(
            cure_depth_um=min(cure_depth, 1000),  # Cap at 1mm
            surface_cure_pct=surface_cure,
            through_cure_depth_um=min(through_cure_depth, 1000),
            warnings=warnings,
        )
    
    def calculate_intensity_profile(
        self,
        alpha_um: float,
        max_depth_um: float,
        steps: int = 100,
    ) -> Dict[str, List[float]]:
        """Calculate intensity vs depth profile for visualization"""
        depths = np.linspace(0, max_depth_um, steps)
        intensities = np.exp(-alpha_um * depths)
        
        return {
            "depth_um": depths.tolist(),
            "relative_intensity": intensities.tolist(),
        }
```

## 20.2 Log-Mixing Rule (Viscosity Prediction)

```python
# physics/viscosity.py
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class ViscosityPrediction:
    viscosity_cps: float
    temperature_c: float
    shear_rate_s1: float
    components_contribution: Dict[str, float]
    warnings: List[str]

class LogMixingRule:
    """
    Logarithmic mixing rule for viscosity prediction.
    
    For miscible liquids:
    ln(η_mix) = Σ(xᵢ × ln(ηᵢ))
    
    Where:
    - η_mix = mixture viscosity
    - xᵢ = volume fraction of component i
    - ηᵢ = viscosity of pure component i
    """
    
    def __init__(self):
        # Arrhenius-type temperature correction
        # η(T) = η(T_ref) × exp(E_a/R × (1/T - 1/T_ref))
        self.reference_temp_c = 25.0
        self.activation_energy_j_mol = 20000  # Typical for oligomers
        self.gas_constant = 8.314  # J/(mol·K)
    
    def predict_viscosity(
        self,
        ingredients: List[Dict],
        material_viscosities: Dict[str, float],
        temperature_c: float = 25.0,
        shear_rate_s1: float = 100.0,
    ) -> ViscosityPrediction:
        """
        Predict mixture viscosity using log-mixing rule.
        
        Args:
            ingredients: List of {material_id, percentage}
            material_viscosities: Dict of material_id -> viscosity at 25°C
            temperature_c: Target temperature
            shear_rate_s1: Shear rate for non-Newtonian correction
        
        Returns:
            ViscosityPrediction with predicted viscosity
        """
        warnings = []
        contributions = {}
        
        # Calculate log-weighted viscosity
        ln_viscosity = 0.0
        total_weight = 0.0
        
        for ing in ingredients:
            mat_id = ing["material_id"]
            weight_fraction = ing["percentage"] / 100.0
            
            if mat_id not in material_viscosities:
                warnings.append(f"Missing viscosity data for material {mat_id}")
                continue
            
            visc = material_viscosities[mat_id]
            if visc <= 0:
                warnings.append(f"Invalid viscosity for material {mat_id}")
                continue
            
            contribution = weight_fraction * np.log(visc)
            ln_viscosity += contribution
            total_weight += weight_fraction
            
            contributions[mat_id] = {
                "percentage": ing["percentage"],
                "viscosity_cps": visc,
                "contribution_pct": (contribution / (ln_viscosity if ln_viscosity != 0 else 1)) * 100,
            }
        
        if total_weight == 0:
            raise ValueError("No valid viscosity data available")
        
        # Normalize if weights don't sum to 1
        ln_viscosity = ln_viscosity / total_weight
        
        # Base viscosity at reference temperature
        viscosity_ref = np.exp(ln_viscosity)
        
        # Temperature correction (Arrhenius)
        temp_k = temperature_c + 273.15
        ref_temp_k = self.reference_temp_c + 273.15
        
        temp_factor = np.exp(
            (self.activation_energy_j_mol / self.gas_constant) *
            (1/temp_k - 1/ref_temp_k)
        )
        
        viscosity_at_temp = viscosity_ref * temp_factor
        
        # Shear thinning correction (simplified power-law)
        # η(γ̇) = η₀ × (γ̇/γ̇_ref)^(n-1)
        # For UV inks, n ≈ 0.8-0.95 (slight shear thinning)
        n = 0.9
        shear_ref = 100.0
        if shear_rate_s1 != shear_ref:
            shear_factor = (shear_rate_s1 / shear_ref) ** (n - 1)
            viscosity_at_temp *= shear_factor
        
        # Warnings
        if viscosity_at_temp < 500:
            warnings.append("Very low viscosity - may cause print quality issues")
        elif viscosity_at_temp > 5000:
            warnings.append("Very high viscosity - may cause transfer issues")
        
        if temperature_c > 40:
            warnings.append("High temperature prediction - verify thermal stability")
        
        return ViscosityPrediction(
            viscosity_cps=viscosity_at_temp,
            temperature_c=temperature_c,
            shear_rate_s1=shear_rate_s1,
            components_contribution=contributions,
            warnings=warnings,
        )
```

## 20.3 Hansen Solubility Parameters

```python
# physics/hansen.py
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple

@dataclass
class HansenPoint:
    """Hansen Solubility Parameters (HSP)"""
    delta_d: float  # Dispersion (MPa^0.5)
    delta_p: float  # Polar (MPa^0.5)
    delta_h: float  # Hydrogen bonding (MPa^0.5)
    r0: float = 0   # Interaction radius (for solutes)
    
    @property
    def delta_total(self) -> float:
        """Total solubility parameter"""
        return np.sqrt(self.delta_d**2 + self.delta_p**2 + self.delta_h**2)

@dataclass
class CompatibilityResult:
    is_compatible: bool
    ra_distance: float        # Distance in Hansen space
    red_number: float         # Ra/R0 (< 1 = compatible)
    compatibility_score: float  # 0-100
    details: Dict[str, float]
    warnings: List[str]

class HansenSolubilityModel:
    """
    Hansen Solubility Parameter model for predicting material compatibility.
    
    Based on the principle: "like dissolves like"
    
    Ra² = 4(δD₁-δD₂)² + (δP₁-δP₂)² + (δH₁-δH₂)²
    
    If Ra < R0, materials are compatible.
    """
    
    # Common material HSP values (MPa^0.5)
    HSP_DATABASE = {
        # Oligomers
        "ebecryl_830": HansenPoint(17.5, 6.2, 5.8, 8.0),
        "cn_991": HansenPoint(17.8, 5.5, 6.2, 7.5),
        "ebecryl_8402": HansenPoint(17.2, 7.1, 6.5, 8.5),
        
        # Monomers
        "hdda": HansenPoint(16.2, 5.8, 4.5, 7.0),
        "tmpta": HansenPoint(16.5, 6.5, 5.2, 7.5),
        "tpgda": HansenPoint(16.0, 5.2, 4.8, 7.2),
        "iboa": HansenPoint(15.8, 4.2, 4.0, 6.5),
        
        # Photoinitiators
        "irgacure_184": HansenPoint(18.5, 8.2, 6.0, 6.0),
        "irgacure_819": HansenPoint(19.2, 7.5, 5.5, 5.5),
        
        # Pigments (dispersed)
        "carbon_black": HansenPoint(20.0, 10.0, 5.0, 10.0),
        "titanium_dioxide": HansenPoint(19.5, 9.0, 8.0, 9.0),
        
        # Substrates
        "pet": HansenPoint(18.0, 6.2, 6.0, 5.0),
        "pp": HansenPoint(16.0, 0.5, 1.0, 8.0),
        "paper_coated": HansenPoint(17.5, 8.0, 9.0, 7.0),
    }
    
    def calculate_distance(
        self,
        hsp1: HansenPoint,
        hsp2: HansenPoint,
    ) -> float:
        """
        Calculate Ra distance between two materials in Hansen space.
        
        Ra² = 4(δD₁-δD₂)² + (δP₁-δP₂)² + (δH₁-δH₂)²
        
        The factor of 4 on dispersion is empirical (HSP convention).
        """
        ra_squared = (
            4 * (hsp1.delta_d - hsp2.delta_d)**2 +
            (hsp1.delta_p - hsp2.delta_p)**2 +
            (hsp1.delta_h - hsp2.delta_h)**2
        )
        return np.sqrt(ra_squared)
    
    def check_compatibility(
        self,
        material1_hsp: HansenPoint,
        material2_hsp: HansenPoint,
    ) -> CompatibilityResult:
        """
        Check compatibility between two materials.
        
        RED = Ra/R0
        - RED < 1: Compatible (inside solubility sphere)
        - RED = 1: Boundary
        - RED > 1: Incompatible
        """
        warnings = []
        
        ra = self.calculate_distance(material1_hsp, material2_hsp)
        
        # Use average R0 if both have it, or default
        r0 = material1_hsp.r0 if material1_hsp.r0 > 0 else 8.0
        
        red_number = ra / r0
        is_compatible = red_number < 1.0
        
        # Convert to 0-100 score
        # Score = 100 × (1 - RED) for RED < 1
        # Score = 0 for RED >= 1, scaled down
        if red_number < 1:
            compatibility_score = 100 * (1 - red_number)
        else:
            compatibility_score = max(0, 50 / red_number)
        
        # Warnings
        if red_number > 0.8 and red_number < 1.0:
            warnings.append("Borderline compatibility - may separate under stress")
        
        if not is_compatible:
            warnings.append(f"Materials may be incompatible (RED={red_number:.2f})")
        
        return CompatibilityResult(
            is_compatible=is_compatible,
            ra_distance=ra,
            red_number=red_number,
            compatibility_score=compatibility_score,
            details={
                "delta_d_diff": abs(material1_hsp.delta_d - material2_hsp.delta_d),
                "delta_p_diff": abs(material1_hsp.delta_p - material2_hsp.delta_p),
                "delta_h_diff": abs(material1_hsp.delta_h - material2_hsp.delta_h),
            },
            warnings=warnings,
        )
    
    def calculate_mixture_hsp(
        self,
        ingredients: List[Dict],
        material_hsps: Dict[str, HansenPoint],
    ) -> HansenPoint:
        """
        Calculate HSP for a mixture (volume-weighted average).
        
        Assumes ideal mixing:
        δ_mix = Σ(φᵢ × δᵢ)
        """
        delta_d_mix = 0
        delta_p_mix = 0
        delta_h_mix = 0
        total_fraction = 0
        
        for ing in ingredients:
            mat_id = ing["material_id"]
            fraction = ing["percentage"] / 100
            
            if mat_id not in material_hsps:
                continue
            
            hsp = material_hsps[mat_id]
            delta_d_mix += fraction * hsp.delta_d
            delta_p_mix += fraction * hsp.delta_p
            delta_h_mix += fraction * hsp.delta_h
            total_fraction += fraction
        
        if total_fraction > 0:
            delta_d_mix /= total_fraction
            delta_p_mix /= total_fraction
            delta_h_mix /= total_fraction
        
        return HansenPoint(
            delta_d=delta_d_mix,
            delta_p=delta_p_mix,
            delta_h=delta_h_mix,
        )
    
    def predict_substrate_adhesion(
        self,
        coating_hsp: HansenPoint,
        substrate: str,
    ) -> CompatibilityResult:
        """
        Predict adhesion to substrate based on HSP compatibility.
        
        Better HSP match = better adhesion potential.
        """
        substrate_key = substrate.lower().replace(" ", "_")
        
        if substrate_key not in self.HSP_DATABASE:
            raise ValueError(f"Unknown substrate: {substrate}")
        
        substrate_hsp = self.HSP_DATABASE[substrate_key]
        
        return self.check_compatibility(coating_hsp, substrate_hsp)
```

## 20.4 HLB Theory (Personal Care)

```python
# physics/hlb.py
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple

@dataclass
class HLBResult:
    required_hlb: float           # Required HLB for the oil phase
    system_hlb: float             # Weighted HLB of surfactant system
    hlb_match: float              # How well system matches required (0-100)
    emulsion_type: str            # "o/w" or "w/o"
    stability_prediction: str     # "stable", "marginal", "unstable"
    warnings: List[str]

class HLBTheory:
    """
    Hydrophilic-Lipophilic Balance theory for emulsion formulation.
    
    HLB Scale (0-20):
    - 0-3: Anti-foaming agents
    - 3-6: W/O emulsifiers
    - 7-9: Wetting agents
    - 8-18: O/W emulsifiers
    - 13-15: Detergents
    - 15-18: Solubilizers
    
    Required HLB = Σ(weight fraction × required HLB of each oil)
    """
    
    # Required HLB values for common oils
    REQUIRED_HLB = {
        # Mineral oils
        "mineral_oil_light": 10.5,
        "mineral_oil_heavy": 11.0,
        "petrolatum": 7.0,
        
        # Vegetable oils
        "coconut_oil": 8.0,
        "olive_oil": 7.0,
        "jojoba_oil": 6.5,
        "castor_oil": 14.0,
        "argan_oil": 7.0,
        "sweet_almond_oil": 7.5,
        
        # Esters
        "isopropyl_myristate": 11.5,
        "isopropyl_palmitate": 11.5,
        "cetyl_octanoate": 10.0,
        "caprylic_capric_triglyceride": 5.0,
        
        # Silicones
        "dimethicone": 5.0,
        "cyclomethicone": 4.5,
        
        # Waxes
        "beeswax": 5.0,
        "carnauba_wax": 12.0,
        "cetyl_alcohol": 15.5,  # Co-emulsifier
    }
    
    # HLB values for common emulsifiers
    EMULSIFIER_HLB = {
        # Nonionic surfactants
        "sorbitan_oleate": 4.3,       # Span 80
        "sorbitan_stearate": 4.7,     # Span 60
        "sorbitan_laurate": 8.6,      # Span 20
        "polysorbate_80": 15.0,       # Tween 80
        "polysorbate_60": 14.9,       # Tween 60
        "polysorbate_20": 16.7,       # Tween 20
        "ceteareth_20": 15.5,
        "steareth_21": 15.5,
        "peg_100_stearate": 18.8,
        "glyceryl_stearate": 3.8,
        "glyceryl_stearate_se": 5.8,  # Self-emulsifying
        
        # Anionic (approximate HLB)
        "sodium_lauryl_sulfate": 40.0,  # Very hydrophilic
    }
    
    def calculate_required_hlb(
        self,
        oil_phase: List[Dict],  # [{material_id, percentage}]
    ) -> float:
        """
        Calculate required HLB for the oil phase.
        
        Required HLB = Σ(wᵢ × HLBᵢ) / Σwᵢ
        """
        weighted_sum = 0
        total_weight = 0
        
        for oil in oil_phase:
            mat_key = oil["material_id"].lower().replace(" ", "_")
            weight = oil["percentage"]
            
            if mat_key in self.REQUIRED_HLB:
                weighted_sum += weight * self.REQUIRED_HLB[mat_key]
                total_weight += weight
        
        if total_weight == 0:
            return 10.0  # Default for unknown oils
        
        return weighted_sum / total_weight
    
    def calculate_system_hlb(
        self,
        emulsifiers: List[Dict],  # [{material_id, percentage}]
    ) -> float:
        """
        Calculate weighted HLB of surfactant blend.
        
        System HLB = Σ(wᵢ × HLBᵢ) / Σwᵢ
        """
        weighted_sum = 0
        total_weight = 0
        
        for emul in emulsifiers:
            mat_key = emul["material_id"].lower().replace(" ", "_")
            weight = emul["percentage"]
            
            if mat_key in self.EMULSIFIER_HLB:
                weighted_sum += weight * self.EMULSIFIER_HLB[mat_key]
                total_weight += weight
        
        if total_weight == 0:
            return 10.0  # Neutral default
        
        return weighted_sum / total_weight
    
    def evaluate_emulsion(
        self,
        oil_phase: List[Dict],
        emulsifiers: List[Dict],
        water_phase_pct: float,
        oil_phase_pct: float,
    ) -> HLBResult:
        """
        Evaluate emulsion stability based on HLB match.
        """
        warnings = []
        
        required_hlb = self.calculate_required_hlb(oil_phase)
        system_hlb = self.calculate_system_hlb(emulsifiers)
        
        # HLB match (closer = better)
        hlb_diff = abs(required_hlb - system_hlb)
        hlb_match = max(0, 100 - (hlb_diff * 10))  # -10 points per unit difference
        
        # Determine emulsion type
        if system_hlb > 10:
            emulsion_type = "o/w"  # Oil in water
        else:
            emulsion_type = "w/o"  # Water in oil
        
        # Stability prediction
        if hlb_diff < 1.0:
            stability = "stable"
        elif hlb_diff < 2.0:
            stability = "marginal"
        else:
            stability = "unstable"
            warnings.append(f"HLB mismatch of {hlb_diff:.1f} units - emulsion may separate")
        
        # Additional checks
        total_emulsifier = sum(e["percentage"] for e in emulsifiers)
        if total_emulsifier < 2.0:
            warnings.append("Low emulsifier concentration (<2%) may cause instability")
        elif total_emulsifier > 10.0:
            warnings.append("High emulsifier concentration (>10%) may affect skin feel")
        
        # Phase ratio check
        if emulsion_type == "o/w" and oil_phase_pct > 40:
            warnings.append("High oil content for O/W emulsion - consider phase inversion")
        
        return HLBResult(
            required_hlb=required_hlb,
            system_hlb=system_hlb,
            hlb_match=hlb_match,
            emulsion_type=emulsion_type,
            stability_prediction=stability,
            warnings=warnings,
        )
```

## 20.5 Stokes Law (Settling/Separation)

```python
# physics/stokes.py
import numpy as np
from dataclasses import dataclass
from typing import List

@dataclass
class SettlingResult:
    settling_velocity_mm_hr: float
    settling_time_days: float       # Time to settle 1cm
    stability_class: str            # "stable", "moderate", "unstable"
    recommendations: List[str]

class StokesLaw:
    """
    Stokes Law for predicting particle settling in formulations.
    
    v = (2r²(ρp - ρf)g) / (9η)
    
    Where:
    - v = settling velocity
    - r = particle radius
    - ρp = particle density
    - ρf = fluid density
    - g = gravitational acceleration
    - η = fluid viscosity
    """
    
    GRAVITY = 9.81  # m/s²
    
    def calculate_settling_velocity(
        self,
        particle_diameter_um: float,
        particle_density_kg_m3: float,
        fluid_density_kg_m3: float,
        fluid_viscosity_cps: float,
    ) -> float:
        """
        Calculate Stokes settling velocity.
        
        Returns velocity in m/s.
        """
        # Convert units
        r = (particle_diameter_um / 2) * 1e-6  # μm to m
        eta = fluid_viscosity_cps * 1e-3       # cP to Pa·s
        
        # Density difference
        delta_rho = particle_density_kg_m3 - fluid_density_kg_m3
        
        if delta_rho <= 0:
            return 0.0  # Particle floats or is neutrally buoyant
        
        # Stokes velocity
        v = (2 * r**2 * delta_rho * self.GRAVITY) / (9 * eta)
        
        return v
    
    def predict_stability(
        self,
        particle_diameter_um: float,
        particle_density_kg_m3: float,
        fluid_density_kg_m3: float,
        fluid_viscosity_cps: float,
        required_shelf_life_days: int = 365,
    ) -> SettlingResult:
        """
        Predict settling stability and time to separation.
        """
        recommendations = []
        
        v = self.calculate_settling_velocity(
            particle_diameter_um,
            particle_density_kg_m3,
            fluid_density_kg_m3,
            fluid_viscosity_cps,
        )
        
        # Convert to mm/hr
        v_mm_hr = v * 1000 * 3600
        
        # Time to settle 1cm
        if v > 0:
            time_1cm_s = 0.01 / v
            time_1cm_days = time_1cm_s / 86400
        else:
            time_1cm_days = float('inf')
        
        # Stability classification
        if time_1cm_days > required_shelf_life_days:
            stability = "stable"
        elif time_1cm_days > 30:
            stability = "moderate"
            recommendations.append("Add thixotrope or thickener to improve stability")
        else:
            stability = "unstable"
            recommendations.append("Reduce particle size or add suspending agents")
            recommendations.append("Consider density-matched carrier")
        
        # Recommendations based on analysis
        if particle_diameter_um > 10:
            recommendations.append(f"Large particle size ({particle_diameter_um}μm) - consider grinding")
        
        if fluid_viscosity_cps < 100:
            recommendations.append("Low viscosity fluid - settling risk higher")
        
        return SettlingResult(
            settling_velocity_mm_hr=v_mm_hr,
            settling_time_days=time_1cm_days,
            stability_class=stability,
            recommendations=recommendations,
        )
```

---

# 21. Uncertainty Quantification

## 21.1 Uncertainty Quantifier Implementation

```python
# uncertainty/quantifier.py
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from scipy import stats

@dataclass
class UncertaintyDecomposition:
    model_uncertainty: float      # From ensemble variance
    input_uncertainty: float      # From input measurement errors
    measurement_noise: float      # Expected measurement variability
    extrapolation_risk: float     # Distance from training data
    total_uncertainty: float
    confidence_interval_95: Tuple[float, float]

class UncertaintyQuantifier:
    """
    Quantifies prediction uncertainty from multiple sources.
    
    Methods:
    1. Ensemble variance (multiple model predictions)
    2. Conformal prediction (calibrated prediction intervals)
    3. Input uncertainty propagation
    4. Extrapolation detection
    """
    
    def __init__(
        self,
        calibration_data: Dict = None,
        measurement_cv: Dict[str, float] = None,
    ):
        """
        Args:
            calibration_data: Historical prediction vs actual for calibration
            measurement_cv: Coefficient of variation for each property measurement
        """
        self.calibration_data = calibration_data or {}
        self.measurement_cv = measurement_cv or {
            "viscosity_cps": 0.05,      # 5% CV
            "gloss_60deg": 0.03,        # 3% CV
            "cure_speed_mpm": 0.08,     # 8% CV
            "adhesion_rating": 0.15,    # 15% CV (subjective)
        }
    
    def quantify(
        self,
        predicted_value: float,
        ml_uncertainty: Optional[float],
        features: Dict[str, float],
        property_config: Dict,
        ensemble_predictions: List[float] = None,
    ) -> UncertaintyDecomposition:
        """
        Quantify total uncertainty from all sources.
        """
        prop_key = property_config.get("key", "unknown")
        
        # 1. Model uncertainty (ensemble variance)
        if ensemble_predictions and len(ensemble_predictions) > 1:
            model_uncertainty = np.std(ensemble_predictions)
        elif ml_uncertainty:
            model_uncertainty = ml_uncertainty
        else:
            # Default to 10% of predicted value
            model_uncertainty = abs(predicted_value) * 0.10
        
        # 2. Measurement noise (from historical CV)
        cv = self.measurement_cv.get(prop_key, 0.10)
        measurement_noise = abs(predicted_value) * cv
        
        # 3. Extrapolation risk
        extrapolation_risk = self._assess_extrapolation(
            features, property_config
        )
        
        # Scale model uncertainty by extrapolation risk
        if extrapolation_risk > 0.5:
            model_uncertainty *= (1 + extrapolation_risk)
        
        # 4. Input uncertainty (simplified)
        input_uncertainty = abs(predicted_value) * 0.02  # 2% from input errors
        
        # 5. Combine uncertainties (root sum of squares)
        total_uncertainty = np.sqrt(
            model_uncertainty**2 +
            input_uncertainty**2 +
            measurement_noise**2
        )
        
        # 6. Calculate confidence interval
        # Use t-distribution for small sample sizes, normal otherwise
        if extrapolation_risk > 0.7:
            # More conservative interval for extrapolation
            z = stats.t.ppf(0.975, df=5)  # Wider tails
        else:
            z = 1.96  # Normal 95% CI
        
        ci_lower = predicted_value - z * total_uncertainty
        ci_upper = predicted_value + z * total_uncertainty
        
        # Apply calibration if available
        if prop_key in self.calibration_data:
            ci_lower, ci_upper = self._calibrate_interval(
                prop_key, predicted_value, ci_lower, ci_upper
            )
        
        return UncertaintyDecomposition(
            model_uncertainty=model_uncertainty,
            input_uncertainty=input_uncertainty,
            measurement_noise=measurement_noise,
            extrapolation_risk=extrapolation_risk,
            total_uncertainty=total_uncertainty,
            confidence_interval_95=(ci_lower, ci_upper),
        )
    
    def _assess_extrapolation(
        self,
        features: Dict[str, float],
        property_config: Dict,
    ) -> float:
        """
        Assess how far the prediction is from training data.
        
        Returns:
            Risk score 0-1 (higher = more extrapolation)
        """
        # Get expected feature ranges from property config
        feature_ranges = property_config.get("feature_ranges", {})
        
        if not feature_ranges:
            return 0.3  # Default moderate risk if no ranges
        
        extrapolation_scores = []
        
        for feat_name, feat_value in features.items():
            if feat_name in feature_ranges:
                min_val, max_val = feature_ranges[feat_name]
                range_width = max_val - min_val
                
                if range_width <= 0:
                    continue
                
                if feat_value < min_val:
                    # Below range
                    distance = (min_val - feat_value) / range_width
                    extrapolation_scores.append(min(1.0, distance))
                elif feat_value > max_val:
                    # Above range
                    distance = (feat_value - max_val) / range_width
                    extrapolation_scores.append(min(1.0, distance))
                else:
                    # Within range
                    extrapolation_scores.append(0.0)
        
        if not extrapolation_scores:
            return 0.3
        
        # Return max extrapolation (worst case)
        return max(extrapolation_scores)
    
    def _calibrate_interval(
        self,
        prop_key: str,
        predicted: float,
        ci_lower: float,
        ci_upper: float,
    ) -> Tuple[float, float]:
        """
        Calibrate confidence interval using historical data.
        
        Uses conformal prediction to ensure coverage.
        """
        cal_data = self.calibration_data.get(prop_key, {})
        
        if "coverage_adjustment" in cal_data:
            # Adjust interval width based on historical coverage
            adjustment = cal_data["coverage_adjustment"]
            center = predicted
            half_width = (ci_upper - ci_lower) / 2
            
            ci_lower = center - half_width * adjustment
            ci_upper = center + half_width * adjustment
        
        return ci_lower, ci_upper
    
    def compute_probability_in_spec(
        self,
        predicted: float,
        uncertainty: float,
        spec_min: Optional[float],
        spec_max: Optional[float],
    ) -> float:
        """
        Calculate probability of meeting specification.
        
        Assumes normal distribution around prediction.
        """
        if uncertainty <= 0:
            # Deterministic
            if spec_min and predicted < spec_min:
                return 0.0
            if spec_max and predicted > spec_max:
                return 0.0
            return 1.0
        
        dist = stats.norm(loc=predicted, scale=uncertainty)
        
        if spec_min is not None and spec_max is not None:
            return dist.cdf(spec_max) - dist.cdf(spec_min)
        elif spec_min is not None:
            return 1 - dist.cdf(spec_min)
        elif spec_max is not None:
            return dist.cdf(spec_max)
        else:
            return 1.0
```

---

# 22. Intelligent LLM Router

## 22.1 Model Registry

```python
# llm/model_registry.py
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime

class ModelTier(Enum):
    FLAGSHIP = "flagship"    # Best available (Claude Opus, GPT-4.5)
    STANDARD = "standard"    # Good balance (Claude Sonnet, GPT-4o)
    FAST = "fast"            # Quick responses (Claude Haiku, GPT-4o-mini)

class ModelCapability(Enum):
    REASONING = "reasoning"
    CHEMISTRY = "chemistry"
    CODING = "coding"
    CREATIVITY = "creativity"
    SPEED = "speed"
    LONG_CONTEXT = "long_context"
    STRUCTURED_OUTPUT = "structured"

@dataclass
class LLMModel:
    id: str
    provider: str
    display_name: str
    tier: ModelTier
    capabilities: Dict[str, int]  # capability -> score (0-100)
    context_window: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    avg_latency_ms: int
    is_active: bool = True

class ModelRegistry:
    """
    Central registry of available LLM models.
    
    Tracks capabilities, costs, and availability.
    """
    
    # Default models (can be overridden from database)
    DEFAULT_MODELS = {
        # Anthropic
        "claude-opus-4-5": LLMModel(
            id="claude-opus-4-5-20251101",
            provider="anthropic",
            display_name="Claude Opus 4.5",
            tier=ModelTier.FLAGSHIP,
            capabilities={
                "reasoning": 98,
                "chemistry": 96,
                "coding": 95,
                "creativity": 94,
                "speed": 40,
                "long_context": 90,
                "structured": 92,
            },
            context_window=200000,
            cost_per_1k_input=0.015,
            cost_per_1k_output=0.075,
            avg_latency_ms=3000,
        ),
        "claude-sonnet-4-5": LLMModel(
            id="claude-sonnet-4-5-20250929",
            provider="anthropic",
            display_name="Claude Sonnet 4.5",
            tier=ModelTier.STANDARD,
            capabilities={
                "reasoning": 92,
                "chemistry": 90,
                "coding": 93,
                "creativity": 88,
                "speed": 70,
                "long_context": 90,
                "structured": 94,
            },
            context_window=200000,
            cost_per_1k_input=0.003,
            cost_per_1k_output=0.015,
            avg_latency_ms=1500,
        ),
        "claude-haiku-4-5": LLMModel(
            id="claude-haiku-4-5-20251001",
            provider="anthropic",
            display_name="Claude Haiku 4.5",
            tier=ModelTier.FAST,
            capabilities={
                "reasoning": 78,
                "chemistry": 75,
                "coding": 82,
                "creativity": 70,
                "speed": 95,
                "structured": 90,
            },
            context_window=200000,
            cost_per_1k_input=0.00025,
            cost_per_1k_output=0.00125,
            avg_latency_ms=400,
        ),
        
        # OpenAI
        "gpt-4-5-turbo": LLMModel(
            id="gpt-4.5-turbo-2025",
            provider="openai",
            display_name="GPT-4.5 Turbo",
            tier=ModelTier.FLAGSHIP,
            capabilities={
                "reasoning": 94,
                "chemistry": 88,
                "coding": 96,
                "creativity": 92,
                "speed": 50,
                "long_context": 80,
                "structured": 95,
            },
            context_window=128000,
            cost_per_1k_input=0.010,
            cost_per_1k_output=0.030,
            avg_latency_ms=2500,
        ),
        "gpt-4o": LLMModel(
            id="gpt-4o-2025",
            provider="openai",
            display_name="GPT-4o",
            tier=ModelTier.STANDARD,
            capabilities={
                "reasoning": 88,
                "chemistry": 82,
                "coding": 90,
                "creativity": 85,
                "speed": 80,
                "structured": 92,
            },
            context_window=128000,
            cost_per_1k_input=0.0025,
            cost_per_1k_output=0.010,
            avg_latency_ms=800,
        ),
        
        # Google
        "gemini-2-ultra": LLMModel(
            id="gemini-2.0-ultra",
            provider="google",
            display_name="Gemini 2.0 Ultra",
            tier=ModelTier.FLAGSHIP,
            capabilities={
                "reasoning": 95,
                "chemistry": 91,
                "coding": 92,
                "creativity": 90,
                "speed": 45,
                "long_context": 99,  # 1M context
                "structured": 88,
            },
            context_window=1000000,
            cost_per_1k_input=0.012,
            cost_per_1k_output=0.036,
            avg_latency_ms=2800,
        ),
        "gemini-2-flash": LLMModel(
            id="gemini-2.0-flash",
            provider="google",
            display_name="Gemini 2.0 Flash",
            tier=ModelTier.FAST,
            capabilities={
                "reasoning": 75,
                "chemistry": 70,
                "coding": 75,
                "creativity": 68,
                "speed": 98,
                "long_context": 95,
            },
            context_window=1000000,
            cost_per_1k_input=0.000075,
            cost_per_1k_output=0.0003,
            avg_latency_ms=300,
        ),
    }
    
    def __init__(self, db_session=None):
        self.db_session = db_session
        self._models = dict(self.DEFAULT_MODELS)
    
    async def refresh_from_db(self):
        """Load/update models from database"""
        if self.db_session:
            # Load from llm_models table
            pass
    
    def get_model(self, model_key: str) -> Optional[LLMModel]:
        return self._models.get(model_key)
    
    def get_models_by_tier(self, tier: ModelTier) -> List[LLMModel]:
        return [m for m in self._models.values() if m.tier == tier and m.is_active]
    
    def get_best_for_capability(
        self,
        capability: str,
        tier: ModelTier = None,
    ) -> Optional[LLMModel]:
        """Get best model for a specific capability"""
        candidates = list(self._models.values())
        
        if tier:
            candidates = [m for m in candidates if m.tier == tier]
        
        candidates = [m for m in candidates if m.is_active]
        
        if not candidates:
            return None
        
        return max(
            candidates,
            key=lambda m: m.capabilities.get(capability, 0)
        )
```

## 22.2 Intelligent Router

```python
# llm/router.py
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
from .model_registry import ModelRegistry, LLMModel, ModelTier

class TaskType(Enum):
    """ALKEMI task types with model requirements"""
    
    # Flagship tasks (complex reasoning)
    FORMULATION_TROUBLESHOOTING = "formulation_troubleshooting"
    MULTI_EXPERT_DEBATE = "multi_expert_debate"
    REGULATORY_ANALYSIS = "regulatory_analysis"
    ROOT_CAUSE_ANALYSIS = "root_cause_analysis"
    
    # Standard tasks
    PROPERTY_EXPLANATION = "property_explanation"
    MATERIAL_COMPARISON = "material_comparison"
    DOE_DESIGN = "doe_design"
    DOCUMENT_SUMMARIZATION = "document_summarization"
    
    # Fast tasks
    QUICK_ANSWER = "quick_answer"
    AUTOCOMPLETE = "autocomplete"
    VALIDATION_CHECK = "validation_check"
    CLASSIFICATION = "classification"

@dataclass
class TaskRequirements:
    tier: ModelTier
    required_capabilities: List[str]
    max_latency_ms: Optional[int] = None
    preferred_provider: Optional[str] = None
    min_context_window: int = 8000

# Task to requirements mapping
TASK_REQUIREMENTS: Dict[TaskType, TaskRequirements] = {
    # Flagship tasks
    TaskType.FORMULATION_TROUBLESHOOTING: TaskRequirements(
        tier=ModelTier.FLAGSHIP,
        required_capabilities=["reasoning", "chemistry"],
        preferred_provider="anthropic",
    ),
    TaskType.MULTI_EXPERT_DEBATE: TaskRequirements(
        tier=ModelTier.FLAGSHIP,
        required_capabilities=["reasoning", "chemistry"],
    ),
    TaskType.REGULATORY_ANALYSIS: TaskRequirements(
        tier=ModelTier.FLAGSHIP,
        required_capabilities=["reasoning", "structured"],
    ),
    TaskType.ROOT_CAUSE_ANALYSIS: TaskRequirements(
        tier=ModelTier.FLAGSHIP,
        required_capabilities=["reasoning", "chemistry"],
    ),
    
    # Standard tasks
    TaskType.PROPERTY_EXPLANATION: TaskRequirements(
        tier=ModelTier.STANDARD,
        required_capabilities=["reasoning", "chemistry"],
    ),
    TaskType.MATERIAL_COMPARISON: TaskRequirements(
        tier=ModelTier.STANDARD,
        required_capabilities=["reasoning"],
    ),
    TaskType.DOE_DESIGN: TaskRequirements(
        tier=ModelTier.STANDARD,
        required_capabilities=["reasoning", "structured"],
    ),
    TaskType.DOCUMENT_SUMMARIZATION: TaskRequirements(
        tier=ModelTier.STANDARD,
        required_capabilities=["long_context"],
        min_context_window=100000,
        preferred_provider="google",  # Gemini has 1M context
    ),
    
    # Fast tasks
    TaskType.QUICK_ANSWER: TaskRequirements(
        tier=ModelTier.FAST,
        required_capabilities=["speed"],
        max_latency_ms=1000,
    ),
    TaskType.AUTOCOMPLETE: TaskRequirements(
        tier=ModelTier.FAST,
        required_capabilities=["speed"],
        max_latency_ms=500,
    ),
    TaskType.VALIDATION_CHECK: TaskRequirements(
        tier=ModelTier.FAST,
        required_capabilities=["speed", "structured"],
    ),
    TaskType.CLASSIFICATION: TaskRequirements(
        tier=ModelTier.FAST,
        required_capabilities=["speed"],
    ),
}

class LLMRouter:
    """
    Intelligent router that selects the best LLM for each task.
    
    Principles:
    1. ALWAYS use best available model for critical/flagship tasks
    2. Optimize cost-performance for routine tasks
    3. Automatically upgrade when better models become available
    4. Graceful fallback if preferred model is unavailable
    """
    
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
    
    def get_model_for_task(
        self,
        task: TaskType,
        override_tier: ModelTier = None,
        force_provider: str = None,
        context_size: int = None,
    ) -> LLMModel:
        """
        Get the best model for a specific task.
        
        Args:
            task: The task type
            override_tier: Force a specific tier
            force_provider: Force a specific provider
            context_size: Required context window size
        
        Returns:
            Selected LLMModel
        """
        requirements = TASK_REQUIREMENTS.get(task)
        
        if not requirements:
            # Default to standard tier
            requirements = TaskRequirements(
                tier=ModelTier.STANDARD,
                required_capabilities=["reasoning"],
            )
        
        # Apply overrides
        tier = override_tier or requirements.tier
        provider = force_provider or requirements.preferred_provider
        min_context = context_size or requirements.min_context_window
        
        # Get candidates
        candidates = self.registry.get_models_by_tier(tier)
        
        if not candidates:
            # Fallback to any available model
            for fallback_tier in [ModelTier.STANDARD, ModelTier.FLAGSHIP, ModelTier.FAST]:
                candidates = self.registry.get_models_by_tier(fallback_tier)
                if candidates:
                    break
        
        if not candidates:
            raise RuntimeError("No LLM models available")
        
        # Filter by context window
        candidates = [m for m in candidates if m.context_window >= min_context]
        
        # Filter by latency requirement
        if requirements.max_latency_ms:
            candidates = [
                m for m in candidates
                if m.avg_latency_ms <= requirements.max_latency_ms
            ]
        
        # Score candidates
        def score_model(model: LLMModel) -> float:
            score = 0
            
            # Capability scores
            for cap in requirements.required_capabilities:
                score += model.capabilities.get(cap, 0)
            
            # Provider preference
            if provider and model.provider == provider:
                score += 50
            
            # Tier bonus
            if model.tier == tier:
                score += 30
            
            return score
        
        # Select best
        candidates.sort(key=score_model, reverse=True)
        return candidates[0]
    
    def get_models_for_debate(self) -> Dict[str, LLMModel]:
        """
        Get models for multi-expert debate.
        
        Uses different providers for diversity of perspectives.
        """
        return {
            "chemistry_expert": self.get_model_for_task(
                TaskType.MULTI_EXPERT_DEBATE,
                force_provider="anthropic",
            ),
            "materials_expert": self.get_model_for_task(
                TaskType.MULTI_EXPERT_DEBATE,
                force_provider="openai",
            ),
            "manufacturing_expert": self.get_model_for_task(
                TaskType.MULTI_EXPERT_DEBATE,
                force_provider="google",
            ),
            "synthesis": self.get_model_for_task(
                TaskType.MULTI_EXPERT_DEBATE,
                force_provider="anthropic",
            ),
        }
```

---


## 22.5 Cost Budgets & Enforcement (v5.1)

```python
# llm/cost_budget.py
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CostBudget:
    """LLM cost budget configuration."""
    max_cost_per_request_usd: float = 1.00
    max_cost_per_user_day_usd: float = 10.00
    max_cost_per_org_day_usd: float = 100.00
    max_tokens_per_debate: int = 50000

class CostTracker:
    """Tracks and enforces LLM cost budgets."""
    
    def __init__(self, redis_client, budget: CostBudget):
        self.redis = redis_client
        self.budget = budget
    
    async def check_budget(self, user_id: str, org_id: str, estimated_cost: float) -> tuple[bool, str]:
        if estimated_cost > self.budget.max_cost_per_request_usd:
            return False, f"Request cost ${estimated_cost:.2f} exceeds limit"
        
        user_key = f"llm_cost:user:{user_id}:{datetime.utcnow().date()}"
        user_spent = float(await self.redis.get(user_key) or 0)
        if user_spent + estimated_cost > self.budget.max_cost_per_user_day_usd:
            return False, "Daily user budget exhausted"
        
        org_key = f"llm_cost:org:{org_id}:{datetime.utcnow().date()}"
        org_spent = float(await self.redis.get(org_key) or 0)
        if org_spent + estimated_cost > self.budget.max_cost_per_org_day_usd:
            return False, "Daily organization budget exhausted"
        
        return True, None
    
    async def record_cost(self, user_id: str, org_id: str, actual_cost: float):
        today = datetime.utcnow().date()
        await self.redis.incrbyfloat(f"llm_cost:user:{user_id}:{today}", actual_cost)
        await self.redis.incrbyfloat(f"llm_cost:org:{org_id}:{today}", actual_cost)
```

## 22.6 Routing Constraints & Data Egress Policy (v5.1)

```python
# llm/routing_constraints.py
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class RoutingConstraints:
    """Organization/project-level routing constraints."""
    allowed_providers: Optional[List[str]] = None  # None = all allowed
    max_cost_per_request_usd: Optional[float] = None
    data_classification: str = "internal"  # "public", "internal", "confidential", "restricted"
    require_audit_log: bool = True

# Updated router with constraints
class LLMRouter:
    async def get_model_for_task(
        self,
        task: TaskType,
        user_id: str,
        org_id: str,
        constraints: RoutingConstraints = None,
    ) -> LLMModel:
        constraints = constraints or RoutingConstraints()
        requirements = TASK_REQUIREMENTS.get(task)
        candidates = self.registry.get_models_by_tier(requirements.tier)
        
        # Filter by provider allowlist
        if constraints.allowed_providers:
            candidates = [m for m in candidates if m.provider in constraints.allowed_providers]
        
        if not candidates:
            raise RoutingError(f"No models available with constraints")
        
        # Score with cost consideration
        scored = []
        for model in candidates:
            cost = self._estimate_cost(model)
            if constraints.max_cost_per_request_usd and cost > constraints.max_cost_per_request_usd:
                continue
            capability_score = self._calculate_capability_score(model, requirements)
            cost_efficiency = capability_score / max(cost, 0.001)
            combined = (0.7 * capability_score) + (0.3 * cost_efficiency * 10)
            scored.append((model, combined))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[0][0]
```

## 22.7 Content Redaction Service (v5.1)

```python
# services/redaction.py
import re
from dataclasses import dataclass

@dataclass
class RedactionPolicy:
    redact_material_codes: bool = False
    redact_supplier_names: bool = False
    redact_pricing: bool = True
    redact_customer_names: bool = True

class ContentRedactor:
    """Redacts sensitive content before sending to external LLM providers."""
    
    PRICE_PATTERN = re.compile(r'[₹$€£]\s*[\d,]+\.?\d*', re.IGNORECASE)
    
    def redact(self, content: str, policy: RedactionPolicy, 
               material_codes: set = None, supplier_names: set = None) -> tuple[str, dict]:
        redacted = content
        redaction_map = {}
        
        if policy.redact_material_codes and material_codes:
            for i, code in enumerate(material_codes):
                placeholder = f"[MAT-{i+1:03d}]"
                redacted = redacted.replace(code, placeholder)
                redaction_map[placeholder] = code
        
        if policy.redact_pricing:
            redacted = self.PRICE_PATTERN.sub("[PRICE REDACTED]", redacted)
        
        return redacted, redaction_map
    
    def restore(self, content: str, redaction_map: dict) -> str:
        for placeholder, original in redaction_map.items():
            content = content.replace(placeholder, original)
        return content
```

### Data Classification Levels

| Level | LLM Providers Allowed | Redaction Required |
|-------|----------------------|-------------------|
| public | All | None |
| internal | Configured providers | Material codes only |
| confidential | Anthropic only (or none) | Full ingredient redaction |
| restricted | None (local models only) | N/A |


---

# 23. Multi-LLM Debate Engine

## 23.1 Debate Engine Implementation

```python
# llm/debate_engine.py
from dataclasses import dataclass, field
from typing import Dict, List, Optional, AsyncGenerator
from enum import Enum
import asyncio
import time
from .router import LLMRouter, TaskType
from .model_registry import LLMModel

@dataclass
class ExpertResponse:
    expert_name: str
    provider: str
    model_name: str
    response: str
    confidence: str  # "high", "medium", "low"
    key_points: List[str]
    evidence_refs: List[str]
    latency_ms: int
    tokens_used: int

@dataclass
class DebateRound:
    round_number: int
    responses: List[ExpertResponse]
    
@dataclass
class DebateSynthesis:
    recommendation: str
    confidence: str
    consensus_points: List[str]
    disagreements: List[str]
    risks: List[str]
    next_steps: List[str]
    evidence_summary: Dict[str, str]

@dataclass
class DebateResult:
    debate_id: str
    query: str
    context_summary: str
    rounds: List[DebateRound]
    synthesis: DebateSynthesis
    total_tokens: int
    total_latency_ms: int
    models_used: Dict[str, str]

class ExpertPersona(Enum):
    CHEMISTRY = "chemistry"
    MATERIALS = "materials"
    MANUFACTURING = "manufacturing"
    REGULATORY = "regulatory"
    COST = "cost"

# Expert system prompts
EXPERT_PROMPTS = {
    ExpertPersona.CHEMISTRY: """You are a senior formulation chemist with 20+ years of experience in UV-curable systems.

Your expertise includes:
- Photopolymerization mechanisms and kinetics
- Oligomer/monomer selection and compatibility
- Photoinitiator systems and cure optimization
- Troubleshooting cure failures, adhesion issues, and property deviations

When analyzing formulations:
1. Consider the chemistry fundamentals first
2. Look for interactions between components
3. Reference specific mechanisms when explaining issues
4. Suggest modifications with clear rationale

Be direct and technical. Other experts will provide complementary perspectives.""",

    ExpertPersona.MATERIALS: """You are a materials scientist specializing in raw material selection and supplier management.

Your expertise includes:
- Material specifications and quality variability
- Supplier qualification and alternative sourcing
- Cost-performance tradeoffs
- Material safety and handling

When analyzing formulations:
1. Consider material quality and consistency
2. Identify single-source risks
3. Suggest alternatives with similar properties
4. Flag cost optimization opportunities

Be practical and supply-chain aware. Other experts handle the chemistry details.""",

    ExpertPersona.MANUFACTURING: """You are a manufacturing engineer with expertise in coating and printing processes.

Your expertise includes:
- Application methods (offset, flexo, gravure, screen)
- Process parameters and their effects
- Scale-up challenges and solutions
- Equipment compatibility and maintenance

When analyzing formulations:
1. Consider how the formulation will behave on press
2. Identify potential manufacturing issues
3. Suggest process optimizations
4. Flag scale-up concerns

Be operations-focused. Other experts handle the chemistry and materials aspects.""",

    ExpertPersona.REGULATORY: """You are a regulatory affairs specialist for chemical products.

Your expertise includes:
- REACH, TSCA, and regional regulations
- Food contact compliance (where applicable)
- Labeling and SDS requirements
- Restricted substance lists

When analyzing formulations:
1. Check for restricted or concerning substances
2. Identify compliance requirements
3. Suggest compliant alternatives if needed
4. Flag documentation needs

Be thorough on compliance. Other experts handle technical aspects.""",
}

class MultiLLMDebateEngine:
    """
    Orchestrates multi-expert debates using different LLM providers.
    
    Flow:
    1. Round 1: Each expert independently analyzes the query
    2. Round 2: Experts respond to each other's points
    3. Synthesis: Combine insights into actionable recommendations
    """
    
    def __init__(
        self,
        router: LLMRouter,
        anthropic_client,
        openai_client,
        google_client,
    ):
        self.router = router
        self.clients = {
            "anthropic": anthropic_client,
            "openai": openai_client,
            "google": google_client,
        }
    
    async def debate(
        self,
        query: str,
        context: Dict,
        experts: List[ExpertPersona] = None,
        num_rounds: int = 2,
    ) -> DebateResult:
        """
        Run multi-expert debate.
        
        Args:
            query: The question to debate
            context: Formulation context (composition, predictions, etc.)
            experts: Which experts to include (defaults to all)
            num_rounds: Number of debate rounds
        
        Returns:
            DebateResult with full transcript and synthesis
        """
        import uuid
        
        debate_id = str(uuid.uuid4())
        start_time = time.time()
        total_tokens = 0
        
        # Default experts
        if experts is None:
            experts = [
                ExpertPersona.CHEMISTRY,
                ExpertPersona.MATERIALS,
                ExpertPersona.MANUFACTURING,
            ]
        
        # Get models for each expert
        models = self.router.get_models_for_debate()
        models_used = {e.value: models.get(f"{e.value}_expert", models["chemistry_expert"]).display_name for e in experts}
        
        # Format context
        context_str = self._format_context(context)
        
        rounds = []
        previous_responses = []
        
        for round_num in range(1, num_rounds + 1):
            round_responses = await self._run_round(
                round_number=round_num,
                query=query,
                context_str=context_str,
                experts=experts,
                models=models,
                previous_responses=previous_responses,
            )
            
            rounds.append(DebateRound(
                round_number=round_num,
                responses=round_responses,
            ))
            
            total_tokens += sum(r.tokens_used for r in round_responses)
            previous_responses = round_responses
        
        # Synthesize
        synthesis = await self._synthesize(
            query=query,
            rounds=rounds,
            models=models,
        )
        
        total_latency = int((time.time() - start_time) * 1000)
        
        return DebateResult(
            debate_id=debate_id,
            query=query,
            context_summary=context_str[:500],
            rounds=rounds,
            synthesis=synthesis,
            total_tokens=total_tokens,
            total_latency_ms=total_latency,
            models_used=models_used,
        )
    
    async def _run_round(
        self,
        round_number: int,
        query: str,
        context_str: str,
        experts: List[ExpertPersona],
        models: Dict[str, LLMModel],
        previous_responses: List[ExpertResponse],
    ) -> List[ExpertResponse]:
        """Run one round of expert responses"""
        
        tasks = []
        for expert in experts:
            task = self._get_expert_response(
                expert=expert,
                round_number=round_number,
                query=query,
                context_str=context_str,
                model=models.get(f"{expert.value}_expert", models["chemistry_expert"]),
                previous_responses=previous_responses if round_number > 1 else [],
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        return list(responses)
    
    async def _get_expert_response(
        self,
        expert: ExpertPersona,
        round_number: int,
        query: str,
        context_str: str,
        model: LLMModel,
        previous_responses: List[ExpertResponse],
    ) -> ExpertResponse:
        """Get response from a single expert"""
        
        start_time = time.time()
        
        # Build prompt
        system_prompt = EXPERT_PROMPTS[expert]
        
        user_prompt = f"""## Query
{query}

## Formulation Context
{context_str}
"""
        
        if round_number > 1 and previous_responses:
            user_prompt += "\n## Previous Expert Opinions\n"
            for resp in previous_responses:
                user_prompt += f"\n### {resp.expert_name}:\n{resp.response}\n"
            user_prompt += "\nConsider these perspectives and provide your updated analysis."
        
        # Call appropriate client
        client = self.clients[model.provider]
        
        if model.provider == "anthropic":
            response = await self._call_anthropic(client, model.id, system_prompt, user_prompt)
        elif model.provider == "openai":
            response = await self._call_openai(client, model.id, system_prompt, user_prompt)
        elif model.provider == "google":
            response = await self._call_google(client, model.id, system_prompt, user_prompt)
        else:
            raise ValueError(f"Unknown provider: {model.provider}")
        
        latency = int((time.time() - start_time) * 1000)
        
        # Parse response
        key_points = self._extract_key_points(response["text"])
        confidence = self._assess_confidence(response["text"])
        
        return ExpertResponse(
            expert_name=f"{expert.value.title()} Expert",
            provider=model.provider,
            model_name=model.display_name,
            response=response["text"],
            confidence=confidence,
            key_points=key_points,
            evidence_refs=[],  # Would extract from RAG results
            latency_ms=latency,
            tokens_used=response["tokens"],
        )
    
    async def _synthesize(
        self,
        query: str,
        rounds: List[DebateRound],
        models: Dict[str, LLMModel],
    ) -> DebateSynthesis:
        """Synthesize expert responses into recommendations"""
        
        synthesis_model = models["synthesis"]
        
        # Build synthesis prompt
        prompt = f"""You are synthesizing a multi-expert debate about formulation chemistry.

## Original Query
{query}

## Expert Responses
"""
        
        for round in rounds:
            prompt += f"\n### Round {round.round_number}\n"
            for resp in round.responses:
                prompt += f"\n**{resp.expert_name}** (confidence: {resp.confidence}):\n{resp.response}\n"
        
        prompt += """

## Your Task
Synthesize these expert opinions into:
1. A clear recommendation
2. Points of consensus
3. Points of disagreement
4. Key risks to consider
5. Recommended next steps

Be specific and actionable."""
        
        client = self.clients[synthesis_model.provider]
        
        if synthesis_model.provider == "anthropic":
            response = await self._call_anthropic(
                client, synthesis_model.id,
                "You synthesize expert discussions into clear recommendations.",
                prompt
            )
        else:
            # Default to anthropic for synthesis
            response = await self._call_anthropic(
                self.clients["anthropic"],
                "claude-sonnet-4-5-20250929",
                "You synthesize expert discussions into clear recommendations.",
                prompt
            )
        
        # Parse synthesis (simplified - would use structured output in production)
        return DebateSynthesis(
            recommendation=response["text"],
            confidence="medium",  # Would parse from response
            consensus_points=[],
            disagreements=[],
            risks=[],
            next_steps=[],
            evidence_summary={},
        )
    
    def _format_context(self, context: Dict) -> str:
        """Format formulation context for prompts"""
        parts = []
        
        if "composition" in context:
            parts.append("### Composition")
            for ing in context["composition"]:
                parts.append(f"- {ing['material_name']}: {ing['percentage']}% ({ing['function']})")
        
        if "predictions" in context:
            parts.append("\n### Predictions")
            for pred in context["predictions"]:
                parts.append(
                    f"- {pred['property']}: {pred['value']} {pred['unit']} "
                    f"(±{pred['uncertainty']}, {pred['probability_in_spec']*100:.0f}% in spec)"
                )
        
        if "issue" in context:
            parts.append(f"\n### Current Issue\n{context['issue']}")
        
        return "\n".join(parts)
    
    def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points from response"""
        # Simplified - would use NLP in production
        points = []
        for line in text.split("\n"):
            if line.strip().startswith(("-", "•", "*", "1.", "2.", "3.")):
                points.append(line.strip().lstrip("-•* 0123456789."))
        return points[:5]
    
    def _assess_confidence(self, text: str) -> str:
        """Assess confidence from response"""
        text_lower = text.lower()
        if any(w in text_lower for w in ["certain", "confident", "definitely", "clearly"]):
            return "high"
        elif any(w in text_lower for w in ["uncertain", "possibly", "might", "unclear"]):
            return "low"
        return "medium"
    
    async def _call_anthropic(self, client, model_id: str, system: str, user: str) -> Dict:
        """Call Anthropic API"""
        response = await client.messages.create(
            model=model_id,
            max_tokens=2000,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return {
            "text": response.content[0].text,
            "tokens": response.usage.input_tokens + response.usage.output_tokens,
        }
    
    async def _call_openai(self, client, model_id: str, system: str, user: str) -> Dict:
        """Call OpenAI API"""
        response = await client.chat.completions.create(
            model=model_id,
            max_tokens=2000,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return {
            "text": response.choices[0].message.content,
            "tokens": response.usage.total_tokens,
        }
    
    async def _call_google(self, client, model_id: str, system: str, user: str) -> Dict:
        """Call Google AI API"""
        response = await client.generate_content(
            model=model_id,
            contents=[f"{system}\n\n{user}"],
        )
        return {
            "text": response.text,
            "tokens": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 1000,
        }
```

---

# 24. RAG System

## 24.1 RAG Service Implementation

```python
# rag/service.py
from dataclasses import dataclass
from typing import List, Dict, Optional
import hashlib

@dataclass
class RAGChunk:
    chunk_id: str
    document_id: str
    document_title: str
    source_type: str
    text: str
    relevance_score: float
    metadata: Dict

@dataclass
class RAGResult:
    query: str
    chunks: List[RAGChunk]
    answer: str
    sources: List[Dict]
    confidence: str

class RAGService:
    """
    Retrieval-Augmented Generation service.
    
    Retrieves relevant document chunks and generates grounded answers.
    """
    
    def __init__(
        self,
        vector_store,      # Pinecone or pgvector client
        embedding_model,   # OpenAI embeddings
        llm_router,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ):
        self.vector_store = vector_store
        self.embedding_model = embedding_model
        self.llm_router = llm_router
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    async def query(
        self,
        query: str,
        organization_id: str,
        domain_id: str = None,
        top_k: int = 5,
        min_relevance: float = 0.7,
    ) -> RAGResult:
        """
        Query the RAG system.
        
        Args:
            query: User's question
            organization_id: For tenant isolation
            domain_id: Optional domain filter
            top_k: Number of chunks to retrieve
            min_relevance: Minimum relevance threshold
        
        Returns:
            RAGResult with answer and sources
        """
        # 1. Embed query
        query_embedding = await self.embedding_model.embed(query)
        
        # 2. Build filter
        filter_dict = {"organization_id": organization_id}
        if domain_id:
            filter_dict["domain_id"] = domain_id
        
        # 3. Search vector store
        results = await self.vector_store.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True,
        )
        
        # 4. Filter by relevance
        chunks = []
        for match in results.matches:
            if match.score >= min_relevance:
                chunks.append(RAGChunk(
                    chunk_id=match.id,
                    document_id=match.metadata.get("document_id"),
                    document_title=match.metadata.get("title", "Unknown"),
                    source_type=match.metadata.get("source_type", "other"),
                    text=match.metadata.get("text", ""),
                    relevance_score=match.score,
                    metadata=match.metadata,
                ))
        
        if not chunks:
            return RAGResult(
                query=query,
                chunks=[],
                answer="I couldn't find relevant information in the knowledge base to answer this question.",
                sources=[],
                confidence="low",
            )
        
        # 5. Generate answer
        answer, sources = await self._generate_answer(query, chunks)
        
        # 6. Assess confidence
        avg_relevance = sum(c.relevance_score for c in chunks) / len(chunks)
        confidence = "high" if avg_relevance > 0.85 else "medium" if avg_relevance > 0.75 else "low"
        
        return RAGResult(
            query=query,
            chunks=chunks,
            answer=answer,
            sources=sources,
            confidence=confidence,
        )
    
    async def _generate_answer(
        self,
        query: str,
        chunks: List[RAGChunk],
    ) -> tuple[str, List[Dict]]:
        """Generate grounded answer from chunks"""
        
        # Build context
        context_parts = []
        sources = []
        
        for i, chunk in enumerate(chunks):
            context_parts.append(f"[Source {i+1}: {chunk.document_title}]\n{chunk.text}")
            sources.append({
                "index": i + 1,
                "document_id": chunk.document_id,
                "title": chunk.document_title,
                "type": chunk.source_type,
                "relevance": chunk.relevance_score,
            })
        
        context = "\n\n".join(context_parts)
        
        # Get model
        model = self.llm_router.get_model_for_task(
            TaskType.QUICK_ANSWER if len(query) < 100 else TaskType.PROPERTY_EXPLANATION
        )
        
        prompt = f"""Answer the following question based ONLY on the provided sources.
If the sources don't contain enough information, say so clearly.
Always cite which source(s) you used with [Source N] notation.

## Sources
{context}

## Question
{query}

## Answer (cite sources)"""
        
        # Call LLM (simplified)
        answer = await self._call_llm(model, prompt)
        
        return answer, sources
    
    async def index_document(
        self,
        document_id: str,
        organization_id: str,
        domain_id: str,
        title: str,
        source_type: str,
        text: str,
        metadata: Dict = None,
    ):
        """Index a document into the vector store"""
        
        # 1. Chunk text
        chunks = self._chunk_text(text)
        
        # 2. Embed chunks
        embeddings = await self.embedding_model.embed_batch([c["text"] for c in chunks])
        
        # 3. Upsert to vector store
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{document_id}_{i}"
            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": {
                    "document_id": document_id,
                    "organization_id": organization_id,
                    "domain_id": domain_id,
                    "title": title,
                    "source_type": source_type,
                    "text": chunk["text"],
                    "chunk_index": i,
                    **(metadata or {}),
                },
            })
        
        await self.vector_store.upsert(vectors=vectors)
    
    def _chunk_text(self, text: str) -> List[Dict]:
        """Split text into overlapping chunks"""
        chunks = []
        
        # Split by paragraphs first
        paragraphs = text.split("\n\n")
        
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) < self.chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append({"text": current_chunk.strip()})
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append({"text": current_chunk.strip()})
        
        return chunks
    
    async def _call_llm(self, model, prompt: str) -> str:
        """Call LLM for answer generation"""
        # Implementation depends on model provider
        pass
```

---

# 25. DOE Generator

## 25.1 Design of Experiments Generator

```python
# doe/generator.py
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from enum import Enum
from scipy.stats import qmc

class DesignType(Enum):
    FULL_FACTORIAL = "full_factorial"
    FRACTIONAL_FACTORIAL = "fractional_factorial"
    CENTRAL_COMPOSITE = "central_composite"
    BOX_BEHNKEN = "box_behnken"
    LATIN_HYPERCUBE = "latin_hypercube"
    OPTIMAL = "optimal"
    MIXTURE_SIMPLEX = "mixture_simplex"

@dataclass
class Factor:
    name: str
    low: float
    high: float
    unit: str
    is_categorical: bool = False
    levels: List[str] = None  # For categorical factors

@dataclass
class DOEDesign:
    design_type: DesignType
    factors: List[Factor]
    experiments: List[Dict[str, float]]
    num_runs: int
    num_center_points: int
    randomization_seed: int
    power_analysis: Dict[str, float]
    recommendations: List[str]

class DOEGenerator:
    """
    Design of Experiments generator for formulation optimization.
    
    Supports:
    - Classical designs (full/fractional factorial, CCD, Box-Behnken)
    - Space-filling designs (Latin Hypercube)
    - Mixture designs (for formulations that must sum to 100%)
    """
    
    def __init__(self, random_seed: int = 42):
        self.random_seed = random_seed
        np.random.seed(random_seed)
    
    def generate(
        self,
        factors: List[Factor],
        design_type: DesignType,
        num_center_points: int = 3,
        is_mixture: bool = False,
    ) -> DOEDesign:
        """
        Generate experimental design.
        
        Args:
            factors: List of factors to vary
            design_type: Type of design
            num_center_points: Number of center point replicates
            is_mixture: Whether factors are mixture components (must sum to constraint)
        
        Returns:
            DOEDesign with experiment matrix
        """
        if is_mixture:
            return self._generate_mixture_design(factors, num_center_points)
        
        if design_type == DesignType.FULL_FACTORIAL:
            experiments = self._full_factorial(factors)
        elif design_type == DesignType.FRACTIONAL_FACTORIAL:
            experiments = self._fractional_factorial(factors)
        elif design_type == DesignType.CENTRAL_COMPOSITE:
            experiments = self._central_composite(factors, num_center_points)
        elif design_type == DesignType.BOX_BEHNKEN:
            experiments = self._box_behnken(factors, num_center_points)
        elif design_type == DesignType.LATIN_HYPERCUBE:
            experiments = self._latin_hypercube(factors, n_samples=20)
        else:
            experiments = self._central_composite(factors, num_center_points)
        
        # Add center points
        if num_center_points > 0 and design_type not in [DesignType.LATIN_HYPERCUBE]:
            center = {f.name: (f.low + f.high) / 2 for f in factors}
            for _ in range(num_center_points):
                experiments.append(center.copy())
        
        # Randomize order
        np.random.shuffle(experiments)
        
        # Power analysis
        power = self._power_analysis(len(experiments), len(factors))
        
        # Recommendations
        recommendations = self._get_recommendations(
            design_type, factors, len(experiments)
        )
        
        return DOEDesign(
            design_type=design_type,
            factors=factors,
            experiments=experiments,
            num_runs=len(experiments),
            num_center_points=num_center_points,
            randomization_seed=self.random_seed,
            power_analysis=power,
            recommendations=recommendations,
        )
    
    def _full_factorial(self, factors: List[Factor]) -> List[Dict]:
        """Generate 2^k full factorial design"""
        experiments = []
        k = len(factors)
        
        for i in range(2**k):
            exp = {}
            for j, factor in enumerate(factors):
                if (i >> j) & 1:
                    exp[factor.name] = factor.high
                else:
                    exp[factor.name] = factor.low
            experiments.append(exp)
        
        return experiments
    
    def _fractional_factorial(self, factors: List[Factor]) -> List[Dict]:
        """Generate 2^(k-p) fractional factorial design"""
        k = len(factors)
        
        # For small k, use full factorial
        if k <= 4:
            return self._full_factorial(factors)
        
        # Resolution III or IV design
        p = max(1, k - 4)  # Fraction
        n_runs = 2**(k - p)
        
        # Use scipy for proper fractional design
        # Simplified: use Latin Hypercube as fallback
        return self._latin_hypercube(factors, n_samples=n_runs)
    
    def _central_composite(
        self,
        factors: List[Factor],
        num_center: int = 3,
    ) -> List[Dict]:
        """
        Generate Central Composite Design (CCD).
        
        Includes:
        - 2^k factorial points
        - 2k axial (star) points
        - Center points
        """
        experiments = []
        k = len(factors)
        
        # Alpha for rotatability
        alpha = (2**k) ** 0.25
        
        # Factorial points
        factorial = self._full_factorial(factors)
        experiments.extend(factorial)
        
        # Axial points
        for i, factor in enumerate(factors):
            center_values = {f.name: (f.low + f.high) / 2 for f in factors}
            
            # Convert to coded units
            range_half = (factor.high - factor.low) / 2
            center = (factor.low + factor.high) / 2
            
            # Low axial
            exp_low = center_values.copy()
            exp_low[factor.name] = max(factor.low, center - alpha * range_half)
            experiments.append(exp_low)
            
            # High axial
            exp_high = center_values.copy()
            exp_high[factor.name] = min(factor.high, center + alpha * range_half)
            experiments.append(exp_high)
        
        return experiments
    
    def _box_behnken(
        self,
        factors: List[Factor],
        num_center: int = 3,
    ) -> List[Dict]:
        """
        Generate Box-Behnken design.
        
        More efficient than CCD for 3+ factors, no extreme corners.
        """
        experiments = []
        k = len(factors)
        
        if k < 3:
            return self._full_factorial(factors)
        
        # Box-Behnken: pairs at extremes, others at center
        for i in range(k):
            for j in range(i + 1, k):
                for val_i in [factors[i].low, factors[i].high]:
                    for val_j in [factors[j].low, factors[j].high]:
                        exp = {f.name: (f.low + f.high) / 2 for f in factors}
                        exp[factors[i].name] = val_i
                        exp[factors[j].name] = val_j
                        experiments.append(exp)
        
        return experiments
    
    def _latin_hypercube(
        self,
        factors: List[Factor],
        n_samples: int = 20,
    ) -> List[Dict]:
        """
        Generate Latin Hypercube design.
        
        Good space-filling properties for computer experiments.
        """
        k = len(factors)
        
        sampler = qmc.LatinHypercube(d=k, seed=self.random_seed)
        samples = sampler.random(n=n_samples)
        
        experiments = []
        for sample in samples:
            exp = {}
            for i, factor in enumerate(factors):
                # Scale from [0,1] to [low, high]
                exp[factor.name] = factor.low + sample[i] * (factor.high - factor.low)
            experiments.append(exp)
        
        return experiments
    
    def _generate_mixture_design(
        self,
        factors: List[Factor],
        num_center: int = 3,
    ) -> DOEDesign:
        """
        Generate simplex mixture design.
        
        For formulations where components must sum to a total (e.g., 100%).
        """
        k = len(factors)
        experiments = []
        
        # Simplex-Lattice design
        # Vertices: one component at max, others at min
        for i in range(k):
            exp = {}
            for j, factor in enumerate(factors):
                if i == j:
                    exp[factor.name] = factor.high
                else:
                    exp[factor.name] = factor.low
            
            # Normalize to sum to 100
            total = sum(exp.values())
            if total > 0:
                exp = {name: (val / total) * 100 for name, val in exp.items()}
            
            experiments.append(exp)
        
        # Edge midpoints
        for i in range(k):
            for j in range(i + 1, k):
                exp = {f.name: f.low for f in factors}
                exp[factors[i].name] = (factors[i].low + factors[i].high) / 2
                exp[factors[j].name] = (factors[j].low + factors[j].high) / 2
                
                # Normalize
                total = sum(exp.values())
                if total > 0:
                    exp = {name: (val / total) * 100 for name, val in exp.items()}
                
                experiments.append(exp)
        
        # Centroid
        centroid = {}
        for factor in factors:
            centroid[factor.name] = (factor.low + factor.high) / 2
        total = sum(centroid.values())
        centroid = {name: (val / total) * 100 for name, val in centroid.items()}
        
        for _ in range(num_center):
            experiments.append(centroid.copy())
        
        # Randomize
        np.random.shuffle(experiments)
        
        return DOEDesign(
            design_type=DesignType.MIXTURE_SIMPLEX,
            factors=factors,
            experiments=experiments,
            num_runs=len(experiments),
            num_center_points=num_center,
            randomization_seed=self.random_seed,
            power_analysis=self._power_analysis(len(experiments), k),
            recommendations=[
                "Mixture design: components sum to 100%",
                "Validate that constraints are met in each run",
                "Consider augmenting with axial points if curvature detected",
            ],
        )
    
    def _power_analysis(self, n_runs: int, n_factors: int) -> Dict[str, float]:
        """Simple power analysis"""
        # Degrees of freedom
        df_model = n_factors + n_factors * (n_factors - 1) // 2  # Main + 2-way
        df_residual = max(1, n_runs - df_model - 1)
        
        # Rough power estimate (simplified)
        if df_residual >= 5:
            power = min(0.95, 0.5 + 0.1 * df_residual)
        else:
            power = 0.5
        
        return {
            "estimated_power": power,
            "df_model": df_model,
            "df_residual": df_residual,
            "adequate": power >= 0.8,
        }
    
    def _get_recommendations(
        self,
        design_type: DesignType,
        factors: List[Factor],
        n_runs: int,
    ) -> List[str]:
        """Generate recommendations for the design"""
        recs = []
        
        k = len(factors)
        
        if n_runs < 10:
            recs.append(f"Consider adding runs for better power ({n_runs} may be insufficient)")
        
        if design_type == DesignType.FULL_FACTORIAL and k > 5:
            recs.append("Full factorial with >5 factors requires many runs. Consider fractional design.")
        
        if design_type == DesignType.LATIN_HYPERCUBE:
            recs.append("Latin Hypercube is best for screening. Follow up with RSM for optimization.")
        
        recs.append(f"Run experiments in random order to minimize systematic error")
        recs.append(f"Include replicate measurements for uncertainty estimation")
        
        return recs
```

---

*Continued in Part 4: Domain Packs, Supporting Modules, and Implementation...*
# ALKEMI™ v5.0 — Part 4: Domain Packs

---

# PART F: DOMAIN PACKS

---

# 26. Domain Pack Framework

## 26.1 Architecture

Domain Packs are pluggable modules that extend ALKEMI's core platform with chemistry-specific knowledge, models, and constraints.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN PACK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DOMAIN PACK                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  manifest   │  │  materials  │  │   models    │                 │   │
│  │  │   .yaml     │  │   .json     │  │   .pkl      │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  physics    │  │   prompts   │  │ validation  │                 │   │
│  │  │ constraints │  │  templates  │  │   rules     │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐                                   │   │
│  │  │  reference  │  │   sample    │                                   │   │
│  │  │  documents  │  │ formulations│                                   │   │
│  │  └─────────────┘  └─────────────┘                                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 26.2 Domain Pack Manifest Schema

```yaml
# domain_packs/uv_inks/manifest.yaml

# ============================================================
# DOMAIN PACK MANIFEST — UV INKS & COATINGS
# ============================================================

metadata:
  key: "uv_inks"
  name: "UV Inks & Coatings"
  version: "1.2.0"
  description: "UV-curable inks, varnishes, and coatings for printing applications"
  author: "ALKEMI Chemistry Team"
  created: "2025-06-15"
  updated: "2026-01-09"
  
  # Compatibility
  alkemi_version_min: "5.0.0"
  alkemi_version_max: "6.0.0"

# ============================================================
# INGREDIENT FUNCTIONS
# ============================================================
functions:
  - key: "OLIGOMER"
    name: "Oligomer"
    description: "Main film-forming resin providing bulk properties"
    color: "#3B82F6"  # Blue
    typical_range: [30, 70]
    required: true
    
  - key: "MONOMER"
    name: "Monomer"
    description: "Reactive diluent controlling viscosity and crosslink density"
    color: "#10B981"  # Green
    typical_range: [15, 40]
    required: true
    
  - key: "PHOTOINITIATOR"
    name: "Photoinitiator"
    description: "UV-activated radical generator for cure initiation"
    color: "#F59E0B"  # Amber
    typical_range: [2, 8]
    required: true
    
  - key: "PIGMENT"
    name: "Pigment"
    description: "Colorant providing opacity and color"
    color: "#EF4444"  # Red
    typical_range: [0, 25]
    required: false
    
  - key: "ADDITIVE"
    name: "Additive"
    description: "Performance modifiers (wetting, slip, defoamer)"
    color: "#8B5CF6"  # Purple
    typical_range: [0, 5]
    required: false

# ============================================================
# PROPERTY DEFINITIONS
# ============================================================
properties:
  - key: "viscosity_cps"
    name: "Viscosity"
    unit: "cP"
    description: "Dynamic viscosity at 25°C"
    measurement_method: "Brookfield DV-II, spindle 27, 100 RPM"
    typical_range: [500, 5000]
    physics_model: "log_mixing"
    ml_model: "xgboost_viscosity_v2"
    cv_measurement: 0.05
    
  - key: "gloss_60deg"
    name: "Gloss (60°)"
    unit: "GU"
    description: "Specular gloss at 60° angle"
    measurement_method: "BYK-Gardner micro-TRI-gloss"
    typical_range: [20, 95]
    ml_model: "ensemble_gloss_v1"
    cv_measurement: 0.03
    
  - key: "cure_speed_mpm"
    name: "Cure Speed"
    unit: "m/min"
    description: "Maximum belt speed for full cure"
    measurement_method: "Thumb twist test, 200W/cm Hg lamp"
    typical_range: [20, 120]
    physics_model: "beer_lambert"
    ml_model: "neural_cure_v2"
    cv_measurement: 0.08
    
  - key: "adhesion_rating"
    name: "Adhesion"
    unit: "rating"
    description: "Cross-hatch tape test rating (0-5, 5=best)"
    measurement_method: "ASTM D3359 Method B"
    typical_range: [0, 5]
    is_integer: true
    ml_model: "ordinal_adhesion_v1"
    cv_measurement: 0.15
    
  - key: "rub_resistance"
    name: "Rub Resistance"
    unit: "cycles"
    description: "Sutherland rub tester cycles to failure"
    measurement_method: "Sutherland rub tester, 4lb weight"
    typical_range: [50, 500]
    ml_model: "xgboost_rub_v1"
    cv_measurement: 0.10
    
  - key: "flexibility"
    name: "Flexibility"
    unit: "mm mandrel"
    description: "Minimum mandrel diameter without cracking"
    measurement_method: "Cylindrical mandrel bend test"
    typical_range: [2, 25]
    ml_model: "neural_flexibility_v1"
    cv_measurement: 0.12

# ============================================================
# PHYSICS CONSTRAINTS
# ============================================================
physics_constraints:
  - key: "beer_lambert_cure"
    name: "Beer-Lambert UV Penetration"
    description: "Ensures UV light penetrates to full coating depth"
    equation: "cure_depth > coating_thickness"
    parameters:
      - pigment_absorption_coefficient
      - coating_thickness_um
      - photoinitiator_concentration
    warning_threshold: 0.8
    error_threshold: 0.5
    
  - key: "hansen_compatibility"
    name: "Hansen Solubility Compatibility"
    description: "Checks component miscibility via HSP distance"
    equation: "Ra < R0 for all pairs"
    parameters:
      - hansen_d
      - hansen_p
      - hansen_h
    warning_threshold: 0.9  # RED number
    error_threshold: 1.1
    
  - key: "photoinitiator_absorption"
    name: "PI Absorption Match"
    description: "Photoinitiator absorption must match lamp spectrum"
    parameters:
      - pi_absorption_peak_nm
      - lamp_emission_peak_nm
    warning_threshold: 30  # nm difference
    error_threshold: 50
    
  - key: "viscosity_application"
    name: "Viscosity vs Application Method"
    description: "Viscosity must be appropriate for application method"
    rules:
      offset: [2000, 15000]
      flexo: [50, 500]
      gravure: [20, 200]
      screen: [3000, 30000]
      inkjet: [5, 30]

# ============================================================
# VALIDATION RULES
# ============================================================
validation_rules:
  composition:
    sum_tolerance: 0.1  # Must sum to 100% ± 0.1%
    min_ingredients: 3
    max_ingredients: 20
    
  function_requirements:
    - function: "OLIGOMER"
      min_percentage: 20
      max_percentage: 80
      
    - function: "MONOMER"
      min_percentage: 10
      max_percentage: 50
      
    - function: "PHOTOINITIATOR"
      min_percentage: 1
      max_percentage: 12
      
    - function: "PIGMENT"
      max_percentage: 30
      
  incompatibilities:
    - materials: ["TPO", "ITX"]
      reason: "Co-initiator interaction may cause yellowing"
      severity: "warning"
      
    - materials: ["HDDA", "high_amine_synergist"]
      reason: "May cause premature gelation"
      severity: "error"

# ============================================================
# ML MODEL CONFIGURATION
# ============================================================
ml_models:
  viscosity:
    model_type: "xgboost"
    version: "2.1.0"
    path: "models/viscosity_xgb_v2.pkl"
    features:
      - total_oligomer_pct
      - total_monomer_pct
      - avg_oligomer_viscosity
      - avg_monomer_viscosity
      - ingredient_count
    training_data_size: 2847
    mae_validation: 125.3
    r2_validation: 0.94
    
  gloss:
    model_type: "ensemble"
    version: "1.0.0"
    path: "models/gloss_ensemble_v1.pkl"
    features:
      - total_oligomer_pct
      - pigment_pct
      - additive_pct
      - avg_functionality
    training_data_size: 1523
    mae_validation: 4.2
    r2_validation: 0.87
    
  cure_speed:
    model_type: "neural_network"
    version: "2.0.0"
    path: "models/cure_nn_v2.pkl"
    features:
      - total_photoinitiator_pct
      - photoinitiator_ratio_type1_type2
      - pigment_pct
      - coating_thickness
      - total_oligomer_pct
    training_data_size: 1892
    mae_validation: 5.8
    r2_validation: 0.91
    
  adhesion:
    model_type: "ordinal_regression"
    version: "1.0.0"
    path: "models/adhesion_ordinal_v1.pkl"
    features:
      - hansen_distance_to_substrate
      - oligomer_backbone_type
      - additive_promoter_pct
    training_data_size: 1245
    accuracy_validation: 0.78

# ============================================================
# LLM EXPERT PROMPTS
# ============================================================
expert_prompts:
  troubleshooting: |
    You are a senior UV ink formulation chemist with 25+ years of experience.
    
    Key expertise areas:
    - UV photopolymerization mechanisms (radical and cationic)
    - Oligomer chemistry (acrylates, methacrylates, epoxies)
    - Photoinitiator selection and synergist combinations
    - Adhesion promotion and substrate compatibility
    - Cure troubleshooting (surface cure, through cure, oxygen inhibition)
    
    When analyzing UV ink formulations:
    1. Check photoinitiator package for lamp compatibility
    2. Evaluate oligomer/monomer balance for target properties
    3. Consider substrate adhesion mechanisms
    4. Assess cure depth vs pigment loading
    5. Review additive package for surface properties
    
    Always reference specific chemical mechanisms in your explanations.
    
  optimization: |
    You are optimizing a UV ink formulation for specific performance targets.
    
    Optimization priorities (in order):
    1. Cure speed and completeness (safety and efficiency)
    2. Adhesion to target substrate
    3. Target viscosity for application method
    4. Gloss and appearance
    5. Cost optimization
    
    Consider tradeoffs:
    - More monomer → lower viscosity but may reduce flexibility
    - More photoinitiator → faster cure but potential yellowing/migration
    - More oligomer → better film properties but higher cost/viscosity
    
  material_selection: |
    You are recommending materials for a UV ink formulation.
    
    Selection criteria:
    1. Technical performance (match target properties)
    2. Regulatory compliance (REACH, food contact if applicable)
    3. Supply chain reliability (multiple sources preferred)
    4. Cost effectiveness
    5. Processing compatibility
    
    Always provide 2-3 alternatives with tradeoff analysis.

# ============================================================
# REFERENCE DATA
# ============================================================
reference_data:
  materials_file: "materials/uv_inks_materials.json"
  material_count: 547
  
  documents:
    - type: "TDS"
      count: 320
      path: "documents/tds/"
    - type: "Application Guide"
      count: 45
      path: "documents/guides/"
    - type: "Troubleshooting"
      count: 12
      path: "documents/troubleshooting/"
      
  sample_formulations:
    path: "formulations/"
    count: 85
    categories:
      - "offset_black"
      - "offset_cmyk"
      - "flexo_general"
      - "varnish_gloss"
      - "varnish_matte"
      - "specialty"
```

---

# 27. UV Inks & Coatings Domain

## 27.1 Materials Database (Sample)

```json
{
  "materials": [
    {
      "code": "OLIGO-001",
      "name": "Ebecryl 830",
      "trade_name": "Ebecryl 830",
      "category": "OLIGOMER",
      "subcategory": "Polyester Acrylate",
      "supplier": "Allnex",
      "cas_number": "proprietary",
      "properties": {
        "viscosity_cps_25c": 15000,
        "functionality": 6,
        "molecular_weight": 1500,
        "tg_celsius": 45,
        "elongation_pct": 8
      },
      "hansen": {
        "delta_d": 17.5,
        "delta_p": 6.2,
        "delta_h": 5.8,
        "r0": 8.0
      },
      "commercial": {
        "price_per_kg_inr": 850,
        "lead_time_days": 21,
        "min_order_kg": 200
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": false,
        "voc_exempt": true
      },
      "applications": ["offset", "flexo", "varnish"],
      "notes": "High reactivity hexafunctional polyester acrylate. Excellent hardness and chemical resistance."
    },
    {
      "code": "OLIGO-002",
      "name": "CN991",
      "trade_name": "CN991",
      "category": "OLIGOMER",
      "subcategory": "Urethane Acrylate",
      "supplier": "Sartomer (Arkema)",
      "cas_number": "proprietary",
      "properties": {
        "viscosity_cps_25c": 2800,
        "functionality": 2,
        "molecular_weight": 1200,
        "tg_celsius": -5,
        "elongation_pct": 150
      },
      "hansen": {
        "delta_d": 17.8,
        "delta_p": 5.5,
        "delta_h": 6.2,
        "r0": 7.5
      },
      "commercial": {
        "price_per_kg_inr": 1100,
        "lead_time_days": 28,
        "min_order_kg": 180
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true,
        "voc_exempt": true
      },
      "applications": ["flexo", "overprint_varnish", "flexible_packaging"],
      "notes": "Flexible aliphatic urethane diacrylate. Excellent adhesion and flexibility."
    },
    {
      "code": "MONO-001",
      "name": "HDDA",
      "trade_name": "SR238",
      "category": "MONOMER",
      "subcategory": "Difunctional Acrylate",
      "supplier": "Sartomer (Arkema)",
      "cas_number": "13048-33-4",
      "properties": {
        "viscosity_cps_25c": 8,
        "functionality": 2,
        "molecular_weight": 226,
        "tg_celsius": 70,
        "skin_irritation": "moderate"
      },
      "hansen": {
        "delta_d": 16.2,
        "delta_p": 5.8,
        "delta_h": 4.5,
        "r0": 7.0
      },
      "commercial": {
        "price_per_kg_inr": 420,
        "lead_time_days": 14,
        "min_order_kg": 25
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true,
        "voc_exempt": true,
        "skin_sensitizer": true
      },
      "applications": ["all"],
      "notes": "Workhorse difunctional monomer. Low viscosity, fast cure. Handle with care (sensitizer)."
    },
    {
      "code": "MONO-002",
      "name": "TMPTA",
      "trade_name": "SR351",
      "category": "MONOMER",
      "subcategory": "Trifunctional Acrylate",
      "supplier": "Sartomer (Arkema)",
      "cas_number": "15625-89-5",
      "properties": {
        "viscosity_cps_25c": 106,
        "functionality": 3,
        "molecular_weight": 296,
        "tg_celsius": 62,
        "skin_irritation": "moderate"
      },
      "hansen": {
        "delta_d": 16.5,
        "delta_p": 6.5,
        "delta_h": 5.2,
        "r0": 7.5
      },
      "commercial": {
        "price_per_kg_inr": 580,
        "lead_time_days": 14,
        "min_order_kg": 25
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": false,
        "voc_exempt": true
      },
      "applications": ["offset", "screen", "wood_coating"],
      "notes": "Trifunctional crosslinker. Excellent hardness and chemical resistance."
    },
    {
      "code": "MONO-003",
      "name": "IBOA",
      "trade_name": "SR506",
      "category": "MONOMER",
      "subcategory": "Monofunctional Acrylate",
      "supplier": "Sartomer (Arkema)",
      "cas_number": "5888-33-5",
      "properties": {
        "viscosity_cps_25c": 9,
        "functionality": 1,
        "molecular_weight": 208,
        "tg_celsius": 88,
        "skin_irritation": "low"
      },
      "hansen": {
        "delta_d": 15.8,
        "delta_p": 4.2,
        "delta_h": 4.0,
        "r0": 6.5
      },
      "commercial": {
        "price_per_kg_inr": 750,
        "lead_time_days": 21,
        "min_order_kg": 25
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true,
        "voc_exempt": true,
        "skin_sensitizer": false
      },
      "applications": ["inkjet", "flexo", "low_migration"],
      "notes": "Low irritation monofunctional. High Tg contributes to hardness. Good for food packaging."
    },
    {
      "code": "PI-001",
      "name": "Irgacure 184",
      "trade_name": "Omnirad 184",
      "category": "PHOTOINITIATOR",
      "subcategory": "Type I (Cleavage)",
      "supplier": "IGM Resins",
      "cas_number": "947-19-3",
      "properties": {
        "absorption_peak_nm": 246,
        "secondary_peak_nm": 280,
        "extinction_coefficient": 14000,
        "molecular_weight": 204,
        "type": "cleavage"
      },
      "commercial": {
        "price_per_kg_inr": 1800,
        "lead_time_days": 28,
        "min_order_kg": 10
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true,
        "extractables_low": true
      },
      "applications": ["all"],
      "notes": "Industry standard Type I PI. Good surface cure. Low yellowing."
    },
    {
      "code": "PI-002",
      "name": "Irgacure 819",
      "trade_name": "Omnirad 819",
      "category": "PHOTOINITIATOR",
      "subcategory": "Type I (Cleavage)",
      "supplier": "IGM Resins",
      "cas_number": "162881-26-7",
      "properties": {
        "absorption_peak_nm": 295,
        "secondary_peak_nm": 370,
        "extinction_coefficient": 520,
        "molecular_weight": 418,
        "type": "cleavage"
      },
      "commercial": {
        "price_per_kg_inr": 4500,
        "lead_time_days": 35,
        "min_order_kg": 5
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": false,
        "led_compatible": true
      },
      "applications": ["led_cure", "white_inks", "thick_films"],
      "notes": "Bis-acyl phosphine oxide. Excellent through-cure for pigmented systems. LED compatible."
    },
    {
      "code": "PI-003",
      "name": "TPO",
      "trade_name": "Omnirad TPO",
      "category": "PHOTOINITIATOR",
      "subcategory": "Type I (Cleavage)",
      "supplier": "IGM Resins",
      "cas_number": "75980-60-8",
      "properties": {
        "absorption_peak_nm": 295,
        "secondary_peak_nm": 380,
        "extinction_coefficient": 300,
        "molecular_weight": 348,
        "type": "cleavage"
      },
      "commercial": {
        "price_per_kg_inr": 3200,
        "lead_time_days": 28,
        "min_order_kg": 5
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": false,
        "led_compatible": true
      },
      "applications": ["led_cure", "pigmented", "thick_films"],
      "notes": "Mono-acyl phosphine oxide. Good balance of surface and through cure. Lower cost than 819."
    },
    {
      "code": "PIG-001",
      "name": "Carbon Black MA100",
      "trade_name": "Printex MA100",
      "category": "PIGMENT",
      "subcategory": "Carbon Black",
      "supplier": "Orion Engineered Carbons",
      "cas_number": "1333-86-4",
      "properties": {
        "color_index": "PBk7",
        "particle_size_nm": 24,
        "oil_absorption": 100,
        "density_g_cm3": 1.8,
        "jetness": 260
      },
      "commercial": {
        "price_per_kg_inr": 1200,
        "lead_time_days": 21,
        "min_order_kg": 25
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true
      },
      "applications": ["offset_black", "flexo_black"],
      "notes": "High jetness carbon black. Excellent dispersion stability."
    },
    {
      "code": "ADD-001",
      "name": "BYK-307",
      "trade_name": "BYK-307",
      "category": "ADDITIVE",
      "subcategory": "Silicone Wetting Agent",
      "supplier": "BYK-Chemie",
      "cas_number": "proprietary",
      "properties": {
        "active_content_pct": 100,
        "surface_tension_reduction": "strong",
        "foam_tendency": "low",
        "recoatability": "good"
      },
      "commercial": {
        "price_per_kg_inr": 3500,
        "lead_time_days": 28,
        "min_order_kg": 5
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true
      },
      "applications": ["all"],
      "notes": "Polyether-modified silicone. Excellent substrate wetting without foam."
    },
    {
      "code": "ADD-002",
      "name": "TEGO Glide 410",
      "trade_name": "TEGO Glide 410",
      "category": "ADDITIVE",
      "subcategory": "Slip/Mar Additive",
      "supplier": "Evonik",
      "cas_number": "proprietary",
      "properties": {
        "active_content_pct": 100,
        "cof_reduction": "moderate",
        "scratch_resistance": "improved",
        "gloss_effect": "slight_reduction"
      },
      "commercial": {
        "price_per_kg_inr": 2800,
        "lead_time_days": 28,
        "min_order_kg": 5
      },
      "regulatory": {
        "reach_registered": true,
        "food_contact_eu": true
      },
      "applications": ["varnish", "overprint"],
      "notes": "Silicone-free slip additive. Good for matte finishes."
    }
  ]
}
```

## 27.2 Sample Formulations

```python
# Sample UV Offset Black Ink Formulation
UV_OFFSET_BLACK_SAMPLE = {
    "code": "UV-OFF-BLK-001",
    "name": "UV Offset Black - Standard",
    "description": "General purpose UV offset black ink for coated paper",
    "application": "offset",
    "substrate": "coated_paper",
    
    "ingredients": [
        {"material_code": "OLIGO-001", "function": "OLIGOMER", "percentage": 45.0, "notes": "Main binder"},
        {"material_code": "OLIGO-002", "function": "OLIGOMER", "percentage": 10.0, "notes": "Flexibility modifier"},
        {"material_code": "MONO-001", "function": "MONOMER", "percentage": 15.0, "notes": "Reactive diluent"},
        {"material_code": "MONO-002", "function": "MONOMER", "percentage": 8.0, "notes": "Crosslinker"},
        {"material_code": "MONO-003", "function": "MONOMER", "percentage": 5.0, "notes": "Low migration monomer"},
        {"material_code": "PI-001", "function": "PHOTOINITIATOR", "percentage": 3.5, "notes": "Surface cure"},
        {"material_code": "PI-002", "function": "PHOTOINITIATOR", "percentage": 1.0, "notes": "Through cure"},
        {"material_code": "PIG-001", "function": "PIGMENT", "percentage": 12.0, "notes": "Carbon black dispersion"},
        {"material_code": "ADD-001", "function": "ADDITIVE", "percentage": 0.5, "notes": "Wetting agent"},
    ],
    
    "specifications": [
        {"property": "viscosity_cps", "target": 2500, "min": 2000, "max": 3000, "unit": "cP"},
        {"property": "gloss_60deg", "target": 45, "min": 40, "max": 50, "unit": "GU"},
        {"property": "cure_speed_mpm", "target": 60, "min": 50, "max": None, "unit": "m/min"},
        {"property": "adhesion_rating", "target": 5, "min": 4, "max": 5, "unit": "rating"},
        {"property": "rub_resistance", "target": 200, "min": 150, "max": None, "unit": "cycles"},
    ],
    
    "process": [
        {
            "step": 1,
            "name": "Premix resins",
            "description": "Combine oligomers and monomers under agitation",
            "parameters": {"rpm": 600, "temperature_c": 25, "duration_min": 10}
        },
        {
            "step": 2,
            "name": "Add photoinitiators",
            "description": "Dissolve photoinitiators slowly with continued mixing",
            "parameters": {"rpm": 400, "temperature_c": 25, "duration_min": 5}
        },
        {
            "step": 3,
            "name": "Add pigment dispersion",
            "description": "Add pre-dispersed carbon black with high shear",
            "parameters": {"rpm": 1200, "temperature_c": 30, "duration_min": 20}
        },
        {
            "step": 4,
            "name": "Add additives and deaerate",
            "description": "Add wetting agent, mix, then vacuum deaerate",
            "parameters": {"rpm": 400, "vacuum_mbar": 50, "duration_min": 10}
        },
    ],
    
    "expected_properties": {
        "viscosity_cps": 2450,
        "gloss_60deg": 47,
        "cure_speed_mpm": 65,
        "adhesion_rating": 5,
        "rub_resistance": 220,
    },
    
    "notes": [
        "Suitable for high-speed web offset",
        "Good adhesion to coated papers",
        "Moderate cure speed - may need optimization for LED",
        "Cost: approximately ₹920/kg",
    ]
}
```

## 27.3 UV Inks Physics Implementation

```python
# domain_packs/uv_inks/physics.py
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class UVInkPhysicsResult:
    property_key: str
    calculated_value: float
    confidence: float
    warnings: List[str]
    explanation: str

class UVInksPhysics:
    """
    Physics models specific to UV inks and coatings.
    """
    
    def __init__(self):
        # Photoinitiator absorption data
        self.pi_absorption = {
            "irgacure_184": {"peak": 246, "range": (220, 300), "type": "surface"},
            "irgacure_819": {"peak": 370, "range": (320, 420), "type": "through"},
            "tpo": {"peak": 380, "range": (340, 420), "type": "through"},
            "irgacure_907": {"peak": 305, "range": (260, 340), "type": "surface"},
        }
        
        # Lamp emission data
        self.lamp_spectra = {
            "mercury_h": {"peaks": [254, 313, 365, 405, 436], "type": "broadband"},
            "mercury_d": {"peaks": [365, 405], "type": "uva"},
            "led_365": {"peak": 365, "fwhm": 10, "type": "led"},
            "led_385": {"peak": 385, "fwhm": 12, "type": "led"},
            "led_395": {"peak": 395, "fwhm": 15, "type": "led"},
        }
    
    def calculate_cure_potential(
        self,
        photoinitiators: List[Dict],
        lamp_type: str,
        pigment_loading_pct: float,
        coating_thickness_um: float,
    ) -> Dict[str, float]:
        """
        Calculate cure potential based on PI package and lamp.
        
        Returns scores for surface cure and through cure (0-100).
        """
        lamp = self.lamp_spectra.get(lamp_type)
        if not lamp:
            return {"surface_cure": 50, "through_cure": 50, "overall": 50}
        
        surface_score = 0
        through_score = 0
        total_pi_pct = sum(pi["percentage"] for pi in photoinitiators)
        
        for pi in photoinitiators:
            pi_key = pi["material_key"].lower().replace(" ", "_").replace("-", "_")
            pi_data = self.pi_absorption.get(pi_key)
            
            if not pi_data:
                continue
            
            # Check lamp/PI overlap
            overlap_score = self._calculate_spectral_overlap(pi_data, lamp)
            
            # Weight by concentration
            weighted_score = overlap_score * (pi["percentage"] / total_pi_pct)
            
            if pi_data["type"] == "surface":
                surface_score += weighted_score * 100
            else:
                through_score += weighted_score * 100
        
        # Adjust through cure for pigment loading
        # Beer-Lambert: more pigment = less penetration
        pigment_factor = max(0.2, 1 - (pigment_loading_pct / 30))
        through_score *= pigment_factor
        
        # Adjust for coating thickness
        thickness_factor = max(0.5, 1 - (coating_thickness_um - 10) / 50)
        through_score *= thickness_factor
        
        overall = (surface_score * 0.4 + through_score * 0.6)
        
        return {
            "surface_cure": min(100, surface_score),
            "through_cure": min(100, through_score),
            "overall": min(100, overall),
            "pigment_factor": pigment_factor,
            "thickness_factor": thickness_factor,
        }
    
    def _calculate_spectral_overlap(
        self,
        pi_data: Dict,
        lamp_data: Dict,
    ) -> float:
        """Calculate overlap between PI absorption and lamp emission"""
        pi_low, pi_high = pi_data["range"]
        
        if lamp_data["type"] == "led":
            # LED: narrow emission
            lamp_peak = lamp_data["peak"]
            fwhm = lamp_data.get("fwhm", 15)
            
            # Check if PI absorbs at LED wavelength
            if pi_low <= lamp_peak <= pi_high:
                # Distance from PI peak
                distance = abs(lamp_peak - pi_data["peak"])
                return max(0, 1 - distance / 100)
            return 0
        else:
            # Broadband lamp: check overlap with any peak
            overlaps = []
            for peak in lamp_data["peaks"]:
                if pi_low <= peak <= pi_high:
                    distance = abs(peak - pi_data["peak"])
                    overlaps.append(max(0, 1 - distance / 100))
            
            return max(overlaps) if overlaps else 0
    
    def predict_viscosity_log_mixing(
        self,
        ingredients: List[Dict],
        material_viscosities: Dict[str, float],
        temperature_c: float = 25,
    ) -> UVInkPhysicsResult:
        """
        Predict viscosity using log-mixing rule.
        """
        import math
        
        warnings = []
        ln_visc_sum = 0
        total_weight = 0
        
        for ing in ingredients:
            mat_code = ing["material_code"]
            pct = ing["percentage"]
            
            if mat_code in material_viscosities:
                visc = material_viscosities[mat_code]
                if visc > 0:
                    ln_visc_sum += (pct / 100) * math.log(visc)
                    total_weight += pct / 100
        
        if total_weight == 0:
            return UVInkPhysicsResult(
                property_key="viscosity_cps",
                calculated_value=0,
                confidence=0,
                warnings=["No viscosity data available for ingredients"],
                explanation="Could not calculate - missing viscosity data",
            )
        
        # Calculate base viscosity
        ln_visc_avg = ln_visc_sum / total_weight
        visc_25c = math.exp(ln_visc_avg)
        
        # Temperature correction (Arrhenius)
        if temperature_c != 25:
            ea = 20000  # J/mol, typical for acrylates
            r = 8.314
            t_ref = 298.15  # 25°C in K
            t_actual = temperature_c + 273.15
            temp_factor = math.exp((ea / r) * (1/t_actual - 1/t_ref))
            visc_at_temp = visc_25c * temp_factor
        else:
            visc_at_temp = visc_25c
        
        # Confidence based on data coverage
        confidence = min(1.0, total_weight / 0.9)
        
        explanation = f"Log-mixing rule: ln(η) = Σ(xᵢ × ln(ηᵢ)). "
        explanation += f"Based on {total_weight*100:.1f}% of formulation with known viscosities."
        
        return UVInkPhysicsResult(
            property_key="viscosity_cps",
            calculated_value=visc_at_temp,
            confidence=confidence,
            warnings=warnings,
            explanation=explanation,
        )
    
    def check_adhesion_hsp(
        self,
        formulation_hsp: Dict[str, float],
        substrate: str,
    ) -> UVInkPhysicsResult:
        """
        Predict adhesion potential based on Hansen Solubility Parameters.
        """
        import math
        
        # Substrate HSP values
        substrate_hsp = {
            "coated_paper": {"d": 17.5, "p": 8.0, "h": 9.0},
            "pet": {"d": 18.0, "p": 6.2, "h": 6.0},
            "pp": {"d": 16.0, "p": 0.5, "h": 1.0},
            "pe": {"d": 16.5, "p": 0.5, "h": 2.0},
            "aluminum_foil": {"d": 20.0, "p": 5.0, "h": 8.0},
        }
        
        substrate_key = substrate.lower().replace(" ", "_")
        if substrate_key not in substrate_hsp:
            return UVInkPhysicsResult(
                property_key="adhesion_potential",
                calculated_value=0.5,
                confidence=0.3,
                warnings=[f"Unknown substrate: {substrate}"],
                explanation="Could not calculate HSP distance for unknown substrate",
            )
        
        sub_hsp = substrate_hsp[substrate_key]
        
        # Calculate Ra distance
        ra_squared = (
            4 * (formulation_hsp["d"] - sub_hsp["d"])**2 +
            (formulation_hsp["p"] - sub_hsp["p"])**2 +
            (formulation_hsp["h"] - sub_hsp["h"])**2
        )
        ra = math.sqrt(ra_squared)
        
        # Typical R0 for coatings
        r0 = 8.0
        red = ra / r0
        
        # Convert to adhesion score (0-1)
        # RED < 1 = good adhesion potential
        if red < 1:
            adhesion_score = 1 - (red * 0.5)  # 0.5-1.0
        else:
            adhesion_score = max(0, 0.5 - (red - 1) * 0.25)  # 0-0.5
        
        warnings = []
        if red > 1.0:
            warnings.append(f"HSP mismatch (RED={red:.2f}) - adhesion may be poor")
        if substrate_key == "pp":
            warnings.append("PP requires surface treatment (corona/flame) for adhesion")
        
        explanation = f"Hansen distance Ra={ra:.1f}, RED={red:.2f}. "
        explanation += "RED < 1 indicates good compatibility."
        
        return UVInkPhysicsResult(
            property_key="adhesion_potential",
            calculated_value=adhesion_score,
            confidence=0.75,
            warnings=warnings,
            explanation=explanation,
        )
```

---

# 28. Personal Care Domain

## 28.1 Domain Overview

```yaml
# domain_packs/personal_care/manifest.yaml

metadata:
  key: "personal_care"
  name: "Personal Care"
  version: "1.0.0"
  description: "Skincare, haircare, and cosmetic formulations"

functions:
  - key: "EMOLLIENT"
    name: "Emollient"
    description: "Oils and esters providing skin feel and moisturization"
    color: "#F97316"
    typical_range: [5, 40]
    
  - key: "SURFACTANT"
    name: "Surfactant"
    description: "Cleansing and emulsifying agents"
    color: "#06B6D4"
    typical_range: [0.5, 20]
    
  - key: "THICKENER"
    name: "Thickener"
    description: "Viscosity modifiers and rheology control"
    color: "#8B5CF6"
    typical_range: [0.1, 5]
    
  - key: "HUMECTANT"
    name: "Humectant"
    description: "Moisture-binding ingredients"
    color: "#3B82F6"
    typical_range: [1, 15]
    
  - key: "PRESERVATIVE"
    name: "Preservative"
    description: "Antimicrobial preservation system"
    color: "#EF4444"
    typical_range: [0.1, 2]
    
  - key: "ACTIVE"
    name: "Active"
    description: "Functional actives (vitamins, peptides, etc.)"
    color: "#10B981"
    typical_range: [0.01, 10]
    
  - key: "FRAGRANCE"
    name: "Fragrance"
    description: "Perfume and essential oils"
    color: "#EC4899"
    typical_range: [0, 2]
    
  - key: "COLORANT"
    name: "Colorant"
    description: "Pigments and dyes"
    color: "#F59E0B"
    typical_range: [0, 1]

properties:
  - key: "viscosity_cps"
    name: "Viscosity"
    unit: "cP"
    typical_range: [100, 100000]
    
  - key: "ph"
    name: "pH"
    unit: ""
    typical_range: [3.5, 8.5]
    
  - key: "stability_weeks"
    name: "Stability"
    unit: "weeks"
    description: "Accelerated stability at 40°C"
    typical_range: [4, 52]
    
  - key: "sensory_spread"
    name: "Spreadability"
    unit: "score"
    typical_range: [1, 10]
    
  - key: "sensory_absorption"
    name: "Absorption"
    unit: "score"
    typical_range: [1, 10]

physics_constraints:
  - key: "hlb_emulsion"
    name: "HLB Match"
    description: "Emulsifier HLB must match oil phase required HLB"
    
  - key: "preservative_efficacy"
    name: "Preservative Efficacy"
    description: "Preservation system must pass challenge test criteria"
    
  - key: "ph_compatibility"
    name: "pH Compatibility"
    description: "All ingredients must be stable at formulation pH"
```

## 28.2 Personal Care Physics

```python
# domain_packs/personal_care/physics.py

class PersonalCarePhysics:
    """Physics models for personal care formulations"""
    
    def calculate_hlb_required(
        self,
        oil_phase: List[Dict],
    ) -> float:
        """Calculate required HLB for oil phase"""
        REQUIRED_HLB = {
            "mineral_oil": 10.5,
            "coconut_oil": 8.0,
            "jojoba_oil": 6.5,
            "shea_butter": 8.0,
            "isopropyl_myristate": 11.5,
            "caprylic_capric_triglyceride": 5.0,
            "dimethicone": 5.0,
        }
        
        weighted_sum = 0
        total_weight = 0
        
        for oil in oil_phase:
            key = oil["material_key"].lower().replace(" ", "_")
            weight = oil["percentage"]
            
            if key in REQUIRED_HLB:
                weighted_sum += weight * REQUIRED_HLB[key]
                total_weight += weight
        
        if total_weight == 0:
            return 10.0  # Default
        
        return weighted_sum / total_weight
    
    def predict_emulsion_stability(
        self,
        oil_phase_pct: float,
        water_phase_pct: float,
        emulsifier_hlb: float,
        required_hlb: float,
        emulsifier_pct: float,
    ) -> Dict:
        """Predict emulsion stability"""
        
        hlb_diff = abs(emulsifier_hlb - required_hlb)
        
        # HLB match score
        if hlb_diff < 1:
            hlb_score = 1.0
        elif hlb_diff < 2:
            hlb_score = 0.8
        elif hlb_diff < 3:
            hlb_score = 0.5
        else:
            hlb_score = 0.2
        
        # Emulsifier concentration score
        # Rule of thumb: 3-8% for stable emulsions
        if 3 <= emulsifier_pct <= 8:
            conc_score = 1.0
        elif 2 <= emulsifier_pct < 3 or 8 < emulsifier_pct <= 10:
            conc_score = 0.7
        else:
            conc_score = 0.4
        
        # Phase ratio score
        # O/W: typically 5-40% oil phase
        if 5 <= oil_phase_pct <= 40:
            phase_score = 1.0
        elif oil_phase_pct < 5:
            phase_score = 0.8  # Very light
        elif oil_phase_pct <= 50:
            phase_score = 0.7
        else:
            phase_score = 0.4  # W/O territory
        
        overall = (hlb_score * 0.5 + conc_score * 0.3 + phase_score * 0.2)
        
        return {
            "stability_score": overall,
            "hlb_match_score": hlb_score,
            "emulsifier_score": conc_score,
            "phase_ratio_score": phase_score,
            "predicted_stability_weeks": int(overall * 52),
        }
```

---

# 29. Specialty Chemicals Domain

## 29.1 Domain Overview

```yaml
# domain_packs/specialty_chem/manifest.yaml

metadata:
  key: "specialty_chem"
  name: "Specialty Chemicals"
  version: "1.0.0"
  description: "Industrial specialty chemicals and intermediates"

functions:
  - key: "REACTANT"
    name: "Reactant"
    description: "Primary reactive species"
    typical_range: [20, 80]
    
  - key: "CATALYST"
    name: "Catalyst"
    description: "Reaction catalyst or initiator"
    typical_range: [0.01, 5]
    
  - key: "SOLVENT"
    name: "Solvent"
    description: "Reaction medium"
    typical_range: [0, 60]
    
  - key: "STABILIZER"
    name: "Stabilizer"
    description: "Product stabilizers and antioxidants"
    typical_range: [0.01, 2]

properties:
  - key: "yield_pct"
    name: "Yield"
    unit: "%"
    typical_range: [50, 99]
    
  - key: "purity_pct"
    name: "Purity"
    unit: "%"
    typical_range: [90, 99.9]
    
  - key: "reaction_time_hrs"
    name: "Reaction Time"
    unit: "hrs"
    typical_range: [0.5, 48]
    
  - key: "selectivity_pct"
    name: "Selectivity"
    unit: "%"
    typical_range: [70, 99]
```

---

*Continued in Part 5: Supporting Modules and Operations...*
# ALKEMI™ v5.0 — Part 5: Supporting Modules & Operations

---

# PART G: SUPPORTING MODULES

---

# 30. Supplier Intelligence

## 30.1 Alternative Discovery Service

```python
# services/supplier_intelligence.py
from dataclasses import dataclass
from typing import List, Dict, Optional
import numpy as np

@dataclass
class MaterialAlternative:
    material_id: str
    material_code: str
    material_name: str
    supplier_name: str
    similarity_score: float
    property_comparison: Dict[str, Dict]
    cost_comparison: Dict[str, float]
    regulatory_match: bool
    lead_time_days: int
    recommendation: str
    trade_offs: List[str]

@dataclass
class SupplierRisk:
    supplier_id: str
    supplier_name: str
    overall_risk_score: float  # 0-100
    risk_factors: Dict[str, float]
    recommendations: List[str]

class SupplierIntelligenceService:
    """
    Supplier intelligence for alternative discovery and risk assessment.
    """
    
    def __init__(
        self,
        material_repository,
        supplier_repository,
        similarity_model,
    ):
        self.material_repo = material_repository
        self.supplier_repo = supplier_repository
        self.similarity_model = similarity_model
    
    async def find_alternatives(
        self,
        material_id: str,
        organization_id: str,
        criteria: Dict = None,
    ) -> List[MaterialAlternative]:
        """
        Find alternative materials based on similarity.
        
        Args:
            material_id: Original material to replace
            organization_id: For tenant isolation
            criteria: Optional filtering criteria
                - same_function: bool
                - max_cost_increase_pct: float
                - require_food_contact: bool
                - require_reach: bool
        
        Returns:
            List of alternatives ranked by suitability
        """
        criteria = criteria or {}
        
        # Get original material
        original = await self.material_repo.get(material_id, organization_id)
        if not original:
            raise ValueError(f"Material {material_id} not found")
        
        # Get candidates (same category)
        candidates = await self.material_repo.find_by_category(
            organization_id=organization_id,
            category=original.category,
            exclude_ids=[material_id],
        )
        
        alternatives = []
        
        for candidate in candidates:
            # Calculate similarity
            similarity = await self._calculate_similarity(original, candidate)
            
            if similarity < 0.5:
                continue
            
            # Property comparison
            prop_comparison = self._compare_properties(original, candidate)
            
            # Cost comparison
            cost_comparison = self._compare_costs(original, candidate)
            
            # Check criteria
            if criteria.get("max_cost_increase_pct"):
                if cost_comparison["increase_pct"] > criteria["max_cost_increase_pct"]:
                    continue
            
            # Regulatory check
            regulatory_match = True
            if criteria.get("require_food_contact"):
                regulatory_match = candidate.regulatory.get("food_contact_eu", False)
            if criteria.get("require_reach") and regulatory_match:
                regulatory_match = candidate.regulatory.get("reach_registered", False)
            
            # Generate recommendation
            recommendation = self._generate_recommendation(
                original, candidate, similarity, prop_comparison, cost_comparison
            )
            
            # Identify trade-offs
            trade_offs = self._identify_trade_offs(original, candidate, prop_comparison)
            
            # Get supplier info
            suppliers = await self.material_repo.get_suppliers(
                candidate.id, organization_id
            )
            preferred_supplier = next(
                (s for s in suppliers if s.is_preferred),
                suppliers[0] if suppliers else None
            )
            
            alternatives.append(MaterialAlternative(
                material_id=candidate.id,
                material_code=candidate.code,
                material_name=candidate.name,
                supplier_name=preferred_supplier.name if preferred_supplier else "N/A",
                similarity_score=similarity,
                property_comparison=prop_comparison,
                cost_comparison=cost_comparison,
                regulatory_match=regulatory_match,
                lead_time_days=preferred_supplier.lead_time_days if preferred_supplier else 0,
                recommendation=recommendation,
                trade_offs=trade_offs,
            ))
        
        # Sort by similarity
        alternatives.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return alternatives[:10]  # Top 10
    
    async def _calculate_similarity(self, original, candidate) -> float:
        """Calculate material similarity score (0-1)"""
        scores = []
        
        # Chemical similarity (if fingerprints available)
        if original.morgan_fp_2048 and candidate.morgan_fp_2048:
            # Tanimoto similarity
            fp1 = np.array([int(b) for b in original.morgan_fp_2048])
            fp2 = np.array([int(b) for b in candidate.morgan_fp_2048])
            intersection = np.sum(fp1 & fp2)
            union = np.sum(fp1 | fp2)
            if union > 0:
                scores.append(("chemical", intersection / union, 0.3))
        
        # Property similarity
        prop_sim = self._property_similarity(original.properties, candidate.properties)
        scores.append(("properties", prop_sim, 0.4))
        
        # Hansen similarity
        if all([original.hansen_d, original.hansen_p, original.hansen_h,
                candidate.hansen_d, candidate.hansen_p, candidate.hansen_h]):
            ra = np.sqrt(
                4 * (original.hansen_d - candidate.hansen_d)**2 +
                (original.hansen_p - candidate.hansen_p)**2 +
                (original.hansen_h - candidate.hansen_h)**2
            )
            hansen_sim = max(0, 1 - ra / 15)  # Normalize
            scores.append(("hansen", hansen_sim, 0.3))
        
        # Weighted average
        total_weight = sum(w for _, _, w in scores)
        if total_weight == 0:
            return 0.5
        
        weighted_sum = sum(s * w for _, s, w in scores)
        return weighted_sum / total_weight
    
    def _property_similarity(self, props1: Dict, props2: Dict) -> float:
        """Calculate property-based similarity"""
        common_keys = set(props1.keys()) & set(props2.keys())
        
        if not common_keys:
            return 0.5
        
        similarities = []
        for key in common_keys:
            v1, v2 = props1[key], props2[key]
            if isinstance(v1, (int, float)) and isinstance(v2, (int, float)):
                if v1 == 0 and v2 == 0:
                    sim = 1.0
                elif v1 == 0 or v2 == 0:
                    sim = 0.5
                else:
                    ratio = min(v1, v2) / max(v1, v2)
                    sim = ratio
                similarities.append(sim)
        
        return np.mean(similarities) if similarities else 0.5
    
    def _compare_properties(self, original, candidate) -> Dict[str, Dict]:
        """Detailed property comparison"""
        comparison = {}
        
        all_keys = set(original.properties.keys()) | set(candidate.properties.keys())
        
        for key in all_keys:
            orig_val = original.properties.get(key)
            cand_val = candidate.properties.get(key)
            
            comparison[key] = {
                "original": orig_val,
                "candidate": cand_val,
                "difference": None,
                "difference_pct": None,
            }
            
            if isinstance(orig_val, (int, float)) and isinstance(cand_val, (int, float)):
                comparison[key]["difference"] = cand_val - orig_val
                if orig_val != 0:
                    comparison[key]["difference_pct"] = (cand_val - orig_val) / orig_val * 100
        
        return comparison
    
    def _compare_costs(self, original, candidate) -> Dict[str, float]:
        """Cost comparison"""
        orig_price = original.commercial.get("price_per_kg", 0)
        cand_price = candidate.commercial.get("price_per_kg", 0)
        
        if orig_price == 0:
            increase_pct = 0
        else:
            increase_pct = (cand_price - orig_price) / orig_price * 100
        
        return {
            "original_price": orig_price,
            "candidate_price": cand_price,
            "difference": cand_price - orig_price,
            "increase_pct": increase_pct,
        }
    
    def _generate_recommendation(
        self,
        original,
        candidate,
        similarity: float,
        props: Dict,
        costs: Dict,
    ) -> str:
        """Generate human-readable recommendation"""
        parts = []
        
        if similarity >= 0.9:
            parts.append("Excellent drop-in replacement candidate.")
        elif similarity >= 0.8:
            parts.append("Good alternative with minor property differences.")
        elif similarity >= 0.7:
            parts.append("Viable alternative requiring formulation adjustment.")
        else:
            parts.append("Marginal alternative - significant testing needed.")
        
        if costs["increase_pct"] < -5:
            parts.append(f"Cost savings of {abs(costs['increase_pct']):.1f}%.")
        elif costs["increase_pct"] > 10:
            parts.append(f"Note: {costs['increase_pct']:.1f}% cost increase.")
        
        return " ".join(parts)
    
    def _identify_trade_offs(
        self,
        original,
        candidate,
        props: Dict,
    ) -> List[str]:
        """Identify key trade-offs"""
        trade_offs = []
        
        for key, comparison in props.items():
            diff_pct = comparison.get("difference_pct")
            if diff_pct is not None and abs(diff_pct) > 20:
                direction = "higher" if diff_pct > 0 else "lower"
                trade_offs.append(f"{key} is {abs(diff_pct):.0f}% {direction}")
        
        return trade_offs[:5]  # Top 5
    
    async def assess_supplier_risk(
        self,
        supplier_id: str,
        organization_id: str,
    ) -> SupplierRisk:
        """
        Assess supplier risk based on multiple factors.
        """
        supplier = await self.supplier_repo.get(supplier_id, organization_id)
        
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")
        
        risk_factors = {}
        
        # Geographic risk
        high_risk_countries = ["CN", "IN", "RU"]  # Simplified
        if supplier.country in high_risk_countries:
            risk_factors["geographic"] = 60
        else:
            risk_factors["geographic"] = 20
        
        # Single source risk
        materials_count = await self.material_repo.count_by_supplier(
            supplier_id, organization_id
        )
        if materials_count > 10:
            risk_factors["dependency"] = 70
        elif materials_count > 5:
            risk_factors["dependency"] = 40
        else:
            risk_factors["dependency"] = 20
        
        # Lead time risk
        avg_lead_time = await self.supplier_repo.get_avg_lead_time(
            supplier_id, organization_id
        )
        if avg_lead_time > 60:
            risk_factors["lead_time"] = 80
        elif avg_lead_time > 30:
            risk_factors["lead_time"] = 50
        else:
            risk_factors["lead_time"] = 20
        
        # Qualification status
        if supplier.qualification_status == "approved":
            risk_factors["qualification"] = 10
        elif supplier.qualification_status == "conditional":
            risk_factors["qualification"] = 50
        else:
            risk_factors["qualification"] = 80
        
        # Overall score (weighted average)
        weights = {
            "geographic": 0.2,
            "dependency": 0.3,
            "lead_time": 0.25,
            "qualification": 0.25,
        }
        
        overall = sum(risk_factors[k] * weights[k] for k in weights)
        
        # Recommendations
        recommendations = []
        if risk_factors["dependency"] > 50:
            recommendations.append("Identify and qualify alternative suppliers")
        if risk_factors["lead_time"] > 50:
            recommendations.append("Increase safety stock or negotiate better terms")
        if risk_factors["qualification"] > 50:
            recommendations.append("Complete supplier qualification process")
        
        return SupplierRisk(
            supplier_id=supplier_id,
            supplier_name=supplier.name,
            overall_risk_score=overall,
            risk_factors=risk_factors,
            recommendations=recommendations,
        )
```

---

# 31. Regulatory Compliance Engine

## 31.1 Compliance Service

```python
# services/regulatory_compliance.py
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class ComplianceRegime(Enum):
    REACH_EU = "reach_eu"
    TSCA_US = "tsca_us"
    KKDIK_TR = "kkdik_tr"
    K_REACH_KR = "k_reach_kr"
    FOOD_CONTACT_EU = "food_contact_eu"
    FOOD_CONTACT_FDA = "food_contact_fda"
    COSMETIC_EU = "cosmetic_eu"
    IFRA = "ifra"

class ComplianceStatus(Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    REQUIRES_REVIEW = "requires_review"
    DATA_MISSING = "data_missing"

@dataclass
class ComplianceCheck:
    regime: ComplianceRegime
    status: ComplianceStatus
    issues: List[str]
    recommendations: List[str]
    affected_materials: List[str]

@dataclass
class ComplianceReport:
    formulation_id: str
    overall_status: ComplianceStatus
    checks: List[ComplianceCheck]
    summary: str
    generated_at: str

class RegulatoryComplianceService:
    """
    Regulatory compliance checking and reporting.
    """
    
    # SVHC (Substances of Very High Concern) list - simplified
    SVHC_LIST = {
        "71-43-2": "Benzene",
        "7440-43-9": "Cadmium",
        "18540-29-9": "Chromium VI",
        # ... more entries
    }
    
    # Restricted in cosmetics (EU)
    COSMETIC_RESTRICTED = {
        "81-81-2": "Warfarin",
        "57-24-9": "Strychnine",
        # ... more entries
    }
    
    def __init__(self, material_repository, document_service):
        self.material_repo = material_repository
        self.document_service = document_service
    
    async def check_formulation_compliance(
        self,
        formulation_version,
        target_regimes: List[ComplianceRegime] = None,
    ) -> ComplianceReport:
        """
        Check formulation compliance against regulatory regimes.
        """
        from datetime import datetime
        
        if target_regimes is None:
            target_regimes = [
                ComplianceRegime.REACH_EU,
                ComplianceRegime.FOOD_CONTACT_EU,
            ]
        
        checks = []
        
        for regime in target_regimes:
            if regime == ComplianceRegime.REACH_EU:
                check = await self._check_reach(formulation_version)
            elif regime == ComplianceRegime.FOOD_CONTACT_EU:
                check = await self._check_food_contact_eu(formulation_version)
            elif regime == ComplianceRegime.COSMETIC_EU:
                check = await self._check_cosmetic_eu(formulation_version)
            else:
                check = ComplianceCheck(
                    regime=regime,
                    status=ComplianceStatus.DATA_MISSING,
                    issues=["Compliance check not implemented"],
                    recommendations=[],
                    affected_materials=[],
                )
            
            checks.append(check)
        
        # Determine overall status
        if any(c.status == ComplianceStatus.NON_COMPLIANT for c in checks):
            overall = ComplianceStatus.NON_COMPLIANT
        elif any(c.status == ComplianceStatus.REQUIRES_REVIEW for c in checks):
            overall = ComplianceStatus.REQUIRES_REVIEW
        elif any(c.status == ComplianceStatus.DATA_MISSING for c in checks):
            overall = ComplianceStatus.DATA_MISSING
        else:
            overall = ComplianceStatus.COMPLIANT
        
        # Generate summary
        summary = self._generate_summary(checks, overall)
        
        return ComplianceReport(
            formulation_id=str(formulation_version.id),
            overall_status=overall,
            checks=checks,
            summary=summary,
            generated_at=datetime.utcnow().isoformat(),
        )
    
    async def _check_reach(self, formulation_version) -> ComplianceCheck:
        """Check REACH compliance"""
        issues = []
        recommendations = []
        affected = []
        
        for ingredient in formulation_version.ingredients:
            material = await self.material_repo.get(ingredient.material_id)
            
            # Check SVHC
            if material.cas_number in self.SVHC_LIST:
                substance_name = self.SVHC_LIST[material.cas_number]
                issues.append(f"{material.name} ({substance_name}) is on SVHC list")
                affected.append(material.code)
            
            # Check registration
            if not material.regulatory.get("reach_registered", False):
                if ingredient.percentage > 1.0:
                    issues.append(f"{material.name} not REACH registered (>{ingredient.percentage}%)")
                    affected.append(material.code)
        
        if issues:
            status = ComplianceStatus.NON_COMPLIANT
            recommendations.append("Replace SVHC substances with compliant alternatives")
            recommendations.append("Ensure all substances >1 tonne/year are registered")
        else:
            status = ComplianceStatus.COMPLIANT
        
        return ComplianceCheck(
            regime=ComplianceRegime.REACH_EU,
            status=status,
            issues=issues,
            recommendations=recommendations,
            affected_materials=affected,
        )
    
    async def _check_food_contact_eu(self, formulation_version) -> ComplianceCheck:
        """Check EU food contact compliance"""
        issues = []
        recommendations = []
        affected = []
        
        for ingredient in formulation_version.ingredients:
            material = await self.material_repo.get(ingredient.material_id)
            
            # Check if approved for food contact
            if not material.regulatory.get("food_contact_eu", False):
                issues.append(f"{material.name} not approved for EU food contact")
                affected.append(material.code)
            
            # Check specific migration limits (simplified)
            sml = material.regulatory.get("sml_mg_kg")
            if sml is not None:
                # Would need to calculate expected migration
                pass
        
        if issues:
            status = ComplianceStatus.NON_COMPLIANT
            recommendations.append("Replace non-compliant materials with food-contact approved alternatives")
            recommendations.append("Conduct migration testing if proceeding")
        else:
            status = ComplianceStatus.COMPLIANT
        
        return ComplianceCheck(
            regime=ComplianceRegime.FOOD_CONTACT_EU,
            status=status,
            issues=issues,
            recommendations=recommendations,
            affected_materials=affected,
        )
    
    async def _check_cosmetic_eu(self, formulation_version) -> ComplianceCheck:
        """Check EU cosmetic regulation compliance"""
        issues = []
        recommendations = []
        affected = []
        
        for ingredient in formulation_version.ingredients:
            material = await self.material_repo.get(ingredient.material_id)
            
            # Check restricted list
            if material.cas_number in self.COSMETIC_RESTRICTED:
                issues.append(f"{material.name} is restricted in EU cosmetics")
                affected.append(material.code)
            
            # Check concentration limits (simplified)
            max_conc = material.regulatory.get("cosmetic_max_pct")
            if max_conc is not None and ingredient.percentage > max_conc:
                issues.append(
                    f"{material.name} exceeds maximum concentration "
                    f"({ingredient.percentage}% vs {max_conc}% limit)"
                )
                affected.append(material.code)
        
        if issues:
            status = ComplianceStatus.NON_COMPLIANT
            recommendations.append("Reduce concentration or replace restricted ingredients")
        else:
            status = ComplianceStatus.COMPLIANT
        
        return ComplianceCheck(
            regime=ComplianceRegime.COSMETIC_EU,
            status=status,
            issues=issues,
            recommendations=recommendations,
            affected_materials=affected,
        )
    
    def _generate_summary(
        self,
        checks: List[ComplianceCheck],
        overall: ComplianceStatus,
    ) -> str:
        """Generate human-readable summary"""
        if overall == ComplianceStatus.COMPLIANT:
            return "All regulatory checks passed. Formulation is compliant with checked regimes."
        
        issues_count = sum(len(c.issues) for c in checks)
        regimes_failed = [c.regime.value for c in checks if c.status == ComplianceStatus.NON_COMPLIANT]
        
        summary = f"Found {issues_count} compliance issue(s). "
        if regimes_failed:
            summary += f"Non-compliant with: {', '.join(regimes_failed)}. "
        summary += "Review detailed checks and recommendations."
        
        return summary
```

---


## 31.5 Production-Grade Compliance (v5.1)

### Versioned Compliance Dataset Schema

```sql
-- Compliance rule sources
CREATE TABLE compliance_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,  -- "ECHA_SVHC", "FDA_FCN"
    name TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Versioned datasets
CREATE TABLE compliance_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES compliance_sources(id),
    version TEXT NOT NULL,
    published_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'pending',
    UNIQUE (source_id, version)
);

-- Individual rules with provenance
CREATE TABLE compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES compliance_datasets(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL,
    cas_number TEXT,
    substance_name TEXT,
    rule_type TEXT NOT NULL,  -- "banned", "restricted", "notification"
    max_concentration_pct NUMERIC,
    application_scope TEXT[],
    geographic_scope TEXT[],
    rationale TEXT,
    reference_document TEXT
);

CREATE INDEX idx_compliance_rules_cas ON compliance_rules(cas_number);
```

### Compliance Violation with Full Provenance

```python
@dataclass
class ComplianceViolation:
    material_code: str
    cas_number: Optional[str]
    rule_type: str
    rule_code: str
    violation_reason: str
    # Full provenance
    source_name: str
    source_url: str
    dataset_version: str
    dataset_effective_date: date
    concentration_pct: Optional[float]
    max_allowed_pct: Optional[float]
```

### Compliance Sync Service

```python
class ComplianceSyncService:
    """Synchronizes compliance data from authoritative sources."""
    
    SOURCES = {
        "ECHA_SVHC": {"name": "ECHA SVHC Candidate List", "sync_interval_days": 30},
        "EU_COSMETICS_II": {"name": "EU Cosmetics Annex II", "sync_interval_days": 90},
        "FDA_FCN": {"name": "FDA Food Contact Notifications", "sync_interval_days": 30},
    }
    
    async def sync_source(self, source_code: str) -> SyncResult:
        config = self.SOURCES[source_code]
        raw_data = await self._fetch_source_data(source_code)
        rules = self._parse_rules(source_code, raw_data)
        dataset = await self._create_dataset(source_code, date.today().isoformat())
        for rule in rules:
            await self._insert_rule(dataset.id, rule)
        await self._mark_current(dataset.id)
        return SyncResult(source_code=source_code, success=True, rules_added=len(rules))
```


---

# 32. Feedback & Learning System

## 32.1 Model Retraining Service

```python
# services/model_retraining.py
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

@dataclass
class RetrainingTrigger:
    triggered: bool
    reason: str
    metrics: Dict[str, float]
    recommendation: str

@dataclass
class RetrainingJob:
    job_id: str
    model_key: str
    trigger_reason: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    metrics_before: Dict[str, float]
    metrics_after: Optional[Dict[str, float]]

class ModelRetrainingService:
    """
    Monitors model performance and triggers retraining when needed.
    
    Retraining Triggers:
    1. MAE degradation > 15% vs baseline
    2. Accumulated 1,000+ new validated data points
    3. Manual trigger by admin
    """
    
    # Thresholds
    MAE_DEGRADATION_THRESHOLD = 0.15  # 15%
    NEW_DATA_THRESHOLD = 1000
    MONITORING_WINDOW_DAYS = 30
    
    def __init__(
        self,
        prediction_repository,
        trial_repository,
        model_registry,
        training_pipeline,
    ):
        self.prediction_repo = prediction_repository
        self.trial_repo = trial_repository
        self.model_registry = model_registry
        self.training_pipeline = training_pipeline
    
    async def check_retraining_needed(
        self,
        model_key: str,
        organization_id: str,
    ) -> RetrainingTrigger:
        """
        Check if model needs retraining based on performance metrics.
        """
        # Get baseline metrics
        baseline = await self.model_registry.get_baseline_metrics(model_key)
        
        if not baseline:
            return RetrainingTrigger(
                triggered=False,
                reason="No baseline metrics available",
                metrics={},
                recommendation="Establish baseline before monitoring",
            )
        
        # Calculate recent performance
        since = datetime.utcnow() - timedelta(days=self.MONITORING_WINDOW_DAYS)
        
        recent_predictions = await self.prediction_repo.get_with_feedback(
            model_key=model_key,
            organization_id=organization_id,
            since=since,
        )
        
        if len(recent_predictions) < 50:
            return RetrainingTrigger(
                triggered=False,
                reason="Insufficient recent data for evaluation",
                metrics={"prediction_count": len(recent_predictions)},
                recommendation="Wait for more feedback data",
            )
        
        # Calculate current MAE
        errors = []
        for pred in recent_predictions:
            if pred.actual_value is not None:
                error = abs(pred.predicted_value - pred.actual_value)
                errors.append(error)
        
        if not errors:
            return RetrainingTrigger(
                triggered=False,
                reason="No feedback data available",
                metrics={},
                recommendation="Encourage trial result recording",
            )
        
        current_mae = np.mean(errors)
        baseline_mae = baseline.get("mae", 0)
        
        if baseline_mae == 0:
            degradation = 0
        else:
            degradation = (current_mae - baseline_mae) / baseline_mae
        
        # Check new data accumulation
        new_data_count = await self.trial_repo.count_since_last_training(
            model_key=model_key,
            organization_id=organization_id,
        )
        
        metrics = {
            "current_mae": current_mae,
            "baseline_mae": baseline_mae,
            "degradation_pct": degradation * 100,
            "new_data_count": new_data_count,
            "prediction_count": len(recent_predictions),
        }
        
        # Check triggers
        if degradation > self.MAE_DEGRADATION_THRESHOLD:
            return RetrainingTrigger(
                triggered=True,
                reason=f"MAE degraded by {degradation*100:.1f}% (threshold: {self.MAE_DEGRADATION_THRESHOLD*100}%)",
                metrics=metrics,
                recommendation="Retrain model with recent data to restore accuracy",
            )
        
        if new_data_count >= self.NEW_DATA_THRESHOLD:
            return RetrainingTrigger(
                triggered=True,
                reason=f"Accumulated {new_data_count} new data points (threshold: {self.NEW_DATA_THRESHOLD})",
                metrics=metrics,
                recommendation="Retrain to incorporate new knowledge",
            )
        
        return RetrainingTrigger(
            triggered=False,
            reason="Model performing within acceptable bounds",
            metrics=metrics,
            recommendation="Continue monitoring",
        )
    
    async def trigger_retraining(
        self,
        model_key: str,
        organization_id: str,
        reason: str,
    ) -> RetrainingJob:
        """
        Trigger model retraining job.
        """
        import uuid
        
        job_id = str(uuid.uuid4())
        
        # Get current metrics
        trigger = await self.check_retraining_needed(model_key, organization_id)
        
        job = RetrainingJob(
            job_id=job_id,
            model_key=model_key,
            trigger_reason=reason,
            status="queued",
            started_at=datetime.utcnow(),
            completed_at=None,
            metrics_before=trigger.metrics,
            metrics_after=None,
        )
        
        # Queue training job
        await self.training_pipeline.queue_job({
            "job_id": job_id,
            "model_key": model_key,
            "organization_id": organization_id,
            "config": await self.model_registry.get_training_config(model_key),
        })
        
        return job
    
    async def record_prediction_feedback(
        self,
        prediction_id: str,
        actual_value: float,
        notes: str = None,
    ):
        """
        Record actual value for a prediction (from trial results).
        """
        await self.prediction_repo.update_feedback(
            prediction_id=prediction_id,
            actual_value=actual_value,
            feedback_notes=notes,
            feedback_at=datetime.utcnow(),
        )
```

---

# 33. Analytics & Reporting

## 33.1 Analytics Service

```python
# services/analytics.py
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta

@dataclass
class DashboardMetrics:
    formulations_total: int
    formulations_in_progress: int
    formulations_approved: int
    trials_this_month: int
    prediction_accuracy: Dict[str, float]
    pending_approvals: int
    recent_activity: List[Dict]

@dataclass
class AccuracyTrend:
    property_key: str
    dates: List[str]
    values: List[float]
    trend: str  # "improving", "stable", "declining"

class AnalyticsService:
    """
    Analytics and reporting for ALKEMI platform.
    """
    
    def __init__(
        self,
        formulation_repo,
        trial_repo,
        prediction_repo,
        approval_repo,
        audit_log_repo,
    ):
        self.formulation_repo = formulation_repo
        self.trial_repo = trial_repo
        self.prediction_repo = prediction_repo
        self.approval_repo = approval_repo
        self.audit_log_repo = audit_log_repo
    
    async def get_dashboard_metrics(
        self,
        organization_id: str,
        domain_id: str = None,
    ) -> DashboardMetrics:
        """
        Get metrics for dashboard display.
        """
        # Formulation counts
        total = await self.formulation_repo.count(
            organization_id=organization_id,
            domain_id=domain_id,
        )
        
        in_progress = await self.formulation_repo.count(
            organization_id=organization_id,
            domain_id=domain_id,
            status_in=["draft", "submitted", "in_review"],
        )
        
        approved = await self.formulation_repo.count(
            organization_id=organization_id,
            domain_id=domain_id,
            status_in=["approved", "production"],
        )
        
        # Trials this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        trials_count = await self.trial_repo.count(
            organization_id=organization_id,
            since=month_start,
        )
        
        # Prediction accuracy
        accuracy = await self._calculate_prediction_accuracy(
            organization_id, domain_id
        )
        
        # Pending approvals
        pending = await self.approval_repo.count(
            organization_id=organization_id,
            status="pending",
        )
        
        # Recent activity
        activity = await self.audit_log_repo.get_recent(
            organization_id=organization_id,
            limit=10,
        )
        
        return DashboardMetrics(
            formulations_total=total,
            formulations_in_progress=in_progress,
            formulations_approved=approved,
            trials_this_month=trials_count,
            prediction_accuracy=accuracy,
            pending_approvals=pending,
            recent_activity=[
                {
                    "action": a.action,
                    "entity_type": a.entity_type,
                    "actor": a.actor_name,
                    "timestamp": a.created_at.isoformat(),
                }
                for a in activity
            ],
        )
    
    async def _calculate_prediction_accuracy(
        self,
        organization_id: str,
        domain_id: str = None,
    ) -> Dict[str, float]:
        """Calculate prediction accuracy by property"""
        import numpy as np
        
        # Get predictions with feedback from last 90 days
        since = datetime.utcnow() - timedelta(days=90)
        
        predictions = await self.prediction_repo.get_with_feedback(
            organization_id=organization_id,
            domain_id=domain_id,
            since=since,
        )
        
        # Group by property
        by_property = {}
        for pred in predictions:
            if pred.actual_value is None:
                continue
            
            prop = pred.property_key
            if prop not in by_property:
                by_property[prop] = {"predicted": [], "actual": []}
            
            by_property[prop]["predicted"].append(pred.predicted_value)
            by_property[prop]["actual"].append(pred.actual_value)
        
        # Calculate accuracy (1 - MAPE)
        accuracy = {}
        for prop, data in by_property.items():
            if len(data["predicted"]) < 10:
                continue
            
            predicted = np.array(data["predicted"])
            actual = np.array(data["actual"])
            
            # MAPE
            mape = np.mean(np.abs((actual - predicted) / actual)) * 100
            
            # Accuracy as 100 - MAPE, capped at 0
            accuracy[prop] = max(0, 100 - mape)
        
        return accuracy
    
    async def get_accuracy_trends(
        self,
        organization_id: str,
        property_key: str,
        days: int = 90,
    ) -> AccuracyTrend:
        """Get accuracy trend over time for a property"""
        import numpy as np
        
        # Get weekly accuracy
        end_date = datetime.utcnow()
        weeks = days // 7
        
        dates = []
        values = []
        
        for i in range(weeks):
            week_end = end_date - timedelta(weeks=i)
            week_start = week_end - timedelta(days=7)
            
            predictions = await self.prediction_repo.get_with_feedback(
                organization_id=organization_id,
                property_key=property_key,
                since=week_start,
                until=week_end,
            )
            
            if len(predictions) >= 5:
                errors = [
                    abs(p.predicted_value - p.actual_value) / p.actual_value
                    for p in predictions
                    if p.actual_value is not None and p.actual_value != 0
                ]
                
                if errors:
                    mape = np.mean(errors) * 100
                    accuracy = max(0, 100 - mape)
                    
                    dates.insert(0, week_end.strftime("%Y-%m-%d"))
                    values.insert(0, accuracy)
        
        # Determine trend
        if len(values) >= 3:
            recent_avg = np.mean(values[-3:])
            older_avg = np.mean(values[:3])
            
            if recent_avg > older_avg + 3:
                trend = "improving"
            elif recent_avg < older_avg - 3:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return AccuracyTrend(
            property_key=property_key,
            dates=dates,
            values=values,
            trend=trend,
        )
```

---

# PART H: OPERATIONS

---

# 34. Performance & Scalability

## 34.1 Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API response time (p50) | < 100ms | < 200ms |
| API response time (p95) | < 300ms | < 500ms |
| API response time (p99) | < 500ms | < 1000ms |
| Prediction latency | < 500ms | < 1000ms |
| Debate completion | < 15s | < 30s |
| Search results | < 200ms | < 500ms |
| Dashboard load | < 1s | < 2s |
| Concurrent users | 100+ | 500+ |

## 34.2 Caching Strategy

```python
# cache/strategy.py
from enum import Enum
from dataclasses import dataclass
from typing import Optional

class CacheLayer(Enum):
    L1_REQUEST = "request"      # In-request memo (0 latency)
    L2_LOCAL = "local"          # In-process (sub-ms)
    L3_REDIS = "redis"          # Shared cache (1-5ms)
    L4_DATABASE = "database"    # Query cache (10-50ms)

@dataclass
class CacheConfig:
    key_pattern: str
    ttl_seconds: int
    layer: CacheLayer
    invalidation_events: list[str]

# Cache configurations
CACHE_CONFIGS = {
    # User session
    "user_session": CacheConfig(
        key_pattern="session:{user_id}",
        ttl_seconds=3600,
        layer=CacheLayer.L3_REDIS,
        invalidation_events=["user.logout", "user.update"],
    ),
    
    # Material lookup
    "material": CacheConfig(
        key_pattern="material:{org_id}:{material_id}",
        ttl_seconds=300,
        layer=CacheLayer.L3_REDIS,
        invalidation_events=["material.update", "material.delete"],
    ),
    
    # Material list
    "materials_list": CacheConfig(
        key_pattern="materials:{org_id}:{domain_id}:{hash}",
        ttl_seconds=60,
        layer=CacheLayer.L3_REDIS,
        invalidation_events=["material.create", "material.update", "material.delete"],
    ),
    
    # Predictions
    "prediction": CacheConfig(
        key_pattern="prediction:{version_id}:{input_hash}",
        ttl_seconds=3600,
        layer=CacheLayer.L3_REDIS,
        invalidation_events=["formulation.update", "model.retrain"],
    ),
    
    # Domain pack config
    "domain_pack": CacheConfig(
        key_pattern="domain_pack:{domain_key}",
        ttl_seconds=86400,  # 24 hours
        layer=CacheLayer.L2_LOCAL,
        invalidation_events=["domain_pack.update"],
    ),
    
    # LLM model registry
    "llm_models": CacheConfig(
        key_pattern="llm_models:all",
        ttl_seconds=300,
        layer=CacheLayer.L2_LOCAL,
        invalidation_events=["llm_model.update"],
    ),
}
```

## 34.3 Database Optimization

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_formulations_search 
ON formulation_families USING gin(
  to_tsvector('english', name || ' ' || code || ' ' || coalesce(description, ''))
);

CREATE INDEX CONCURRENTLY idx_materials_search
ON materials USING gin(
  to_tsvector('english', name || ' ' || coalesce(trade_name, '') || ' ' || code)
);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_formulations_active_draft
ON formulation_versions(organization_id, family_id, created_at DESC)
WHERE status = 'draft';

CREATE INDEX CONCURRENTLY idx_approvals_pending
ON approval_requests(organization_id, requested_at)
WHERE status = 'pending';

-- Query optimization hints
-- Use EXPLAIN ANALYZE to verify query plans
```

---


## 34.5 Non-Functional Budgets & Enforcement (v5.1)

### Latency Budgets by Endpoint Class

| Endpoint Class | p50 Target | p95 Target | p99 Hard Limit | Alert Threshold |
|---------------|------------|------------|----------------|-----------------|
| Health/Status | 5ms | 20ms | 100ms | p95 > 50ms |
| CRUD Operations | 30ms | 100ms | 300ms | p95 > 150ms |
| List/Search | 50ms | 200ms | 500ms | p95 > 300ms |
| Predictions | 200ms | 500ms | 1000ms | p95 > 700ms |
| AI Quick Answer | 500ms | 2000ms | 5000ms | p95 > 3000ms |
| AI Debate | 5000ms | 15000ms | 30000ms | p95 > 20000ms |

### Latency Budget Middleware

```python
# middleware/latency_budget.py
import time
from fastapi import Request

LATENCY_BUDGETS = {
    "/health": {"p95": 20, "hard_limit": 100},
    "/api/v1/formulations": {"p95": 200, "hard_limit": 500},
    "/api/v1/predictions": {"p95": 500, "hard_limit": 1000},
    "/api/v1/ai/": {"p95": 2000, "hard_limit": 5000},
    "/api/v1/debate": {"p95": 15000, "hard_limit": 30000},
}

class LatencyBudgetMiddleware:
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        
        budget = self._get_budget(request.url.path)
        if budget and duration_ms > budget["hard_limit"]:
            logger.warning("latency_hard_limit_exceeded", 
                          path=request.url.path, duration_ms=duration_ms)
        
        response.headers["X-Response-Time-Ms"] = str(round(duration_ms, 2))
        return response
```

### LLM Cost Budgets

| Budget Type | Default Limit | Configurable |
|------------|---------------|--------------|
| Per Request | $1.00 | Yes |
| Per User/Day | $10.00 | Yes |
| Per Org/Day | $100.00 | Yes |
| Tokens per Debate | 50,000 | Yes |


---

# 35. Deployment & DevOps

## 35.1 Container Architecture

```yaml
# docker-compose.yml
version: "3.9"

services:
  # API Service
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://alkemi:${DB_PASSWORD}@db:5432/alkemi
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "2"
          memory: 4G
  
  # Web Frontend
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1"
          memory: 2G
  
  # Background Worker
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    command: celery -A app.worker worker -l info
    environment:
      - DATABASE_URL=postgresql://alkemi:${DB_PASSWORD}@db:5432/alkemi
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "2"
          memory: 8G
  
  # PostgreSQL
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=alkemi
      - POSTGRES_USER=alkemi
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U alkemi"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "4"
          memory: 16G
  
  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 2G

volumes:
  postgres_data:
  redis_data:
```

## 35.2 Kubernetes Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alkemi-api
  labels:
    app: alkemi
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: alkemi
      component: api
  template:
    metadata:
      labels:
        app: alkemi
        component: api
    spec:
      containers:
        - name: api
          image: alkemi/api:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: alkemi-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: alkemi-secrets
                  key: redis-url
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: alkemi-api
spec:
  selector:
    app: alkemi
    component: api
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: alkemi-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: alkemi-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

# 36. Monitoring & Alerting

## 36.1 Observability Stack

```yaml
# Prometheus configuration
prometheus:
  scrape_configs:
    - job_name: 'alkemi-api'
      static_configs:
        - targets: ['api:8000']
      metrics_path: '/metrics'
      scrape_interval: 15s
    
    - job_name: 'alkemi-worker'
      static_configs:
        - targets: ['worker:8001']
      metrics_path: '/metrics'
      scrape_interval: 30s

# Key metrics to track
metrics:
  # API Performance
  - http_request_duration_seconds
  - http_requests_total
  - http_request_size_bytes
  - http_response_size_bytes
  
  # Business Metrics
  - alkemi_formulations_created_total
  - alkemi_predictions_requested_total
  - alkemi_predictions_latency_seconds
  - alkemi_debates_completed_total
  - alkemi_debates_duration_seconds
  
  # ML/AI Metrics
  - alkemi_model_prediction_error
  - alkemi_model_inference_latency
  - alkemi_llm_tokens_used_total
  - alkemi_llm_request_latency_seconds
  
  # System Metrics
  - process_cpu_seconds_total
  - process_resident_memory_bytes
  - python_gc_collections_total
```

## 36.2 Alert Rules

```yaml
# alerting/rules.yaml
groups:
  - name: alkemi-critical
    rules:
      - alert: APIHighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate (>5%)"
          
      - alert: APIHighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "API p95 latency exceeding 1s"
          
      - alert: PredictionModelDegraded
        expr: |
          alkemi_model_prediction_error > 0.20
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Prediction model accuracy degraded (>20% error)"
          
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool >80% utilized"
          
      - alert: CeleryQueueBacklog
        expr: |
          celery_queue_length > 1000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Background job queue backlog >1000 tasks"
```

---

# 37. User Adoption Strategy

## 37.1 Cold Start Handling

When a new organization starts with minimal data:

```python
# services/cold_start.py

class ColdStartStrategy:
    """
    Strategies for handling organizations with minimal historical data.
    """
    
    async def initialize_organization(
        self,
        organization_id: str,
        domain_id: str,
    ):
        """Initialize a new organization with bootstrap data"""
        
        # 1. Load domain pack reference materials
        await self._load_reference_materials(organization_id, domain_id)
        
        # 2. Initialize prediction models with transfer learning
        await self._initialize_models(organization_id, domain_id)
        
        # 3. Set up active learning recommendations
        await self._setup_active_learning(organization_id, domain_id)
        
        # 4. Configure uncertainty thresholds
        await self._configure_uncertainty(organization_id, domain_id)
    
    async def _initialize_models(
        self,
        organization_id: str,
        domain_id: str,
    ):
        """
        Initialize models using transfer learning.
        
        Strategy:
        1. Start with pre-trained models on public/shared data
        2. Apply physics constraints as strong priors
        3. Set high uncertainty for all predictions
        4. Recommend active learning experiments
        """
        # Get domain pack
        domain_pack = await self.domain_pack_loader.load(domain_id)
        
        for property_config in domain_pack.properties:
            prop_key = property_config["key"]
            
            # Create organization-specific model config
            model_config = {
                "base_model": f"{domain_id}.{prop_key}.pretrained",
                "uncertainty_multiplier": 2.0,  # Double uncertainty initially
                "physics_prior_weight": 0.7,    # Heavy physics reliance
                "data_weight": 0.3,             # Low data reliance
                "min_samples_for_retraining": 20,
            }
            
            await self.model_registry.create_org_model(
                organization_id=organization_id,
                property_key=prop_key,
                config=model_config,
            )
    
    async def _setup_active_learning(
        self,
        organization_id: str,
        domain_id: str,
    ):
        """
        Configure active learning to prioritize informative experiments.
        
        Strategy:
        1. Identify high-uncertainty regions
        2. Suggest 10-20 experiments that maximize information gain
        3. Prioritize experiments that span the design space
        """
        # Generate recommended experiments
        recommendations = await self.doe_service.generate_initial_experiments(
            domain_id=domain_id,
            n_experiments=20,
            design_type="latin_hypercube",
            criteria={
                "maximize_coverage": True,
                "include_center_points": True,
                "include_extremes": True,
            },
        )
        
        # Store recommendations
        await self.recommendation_repo.save(
            organization_id=organization_id,
            type="initial_experiments",
            recommendations=recommendations,
        )
        
        return recommendations
```

## 37.2 First 30 Days Checklist

```markdown
# ALKEMI Onboarding Checklist

## Week 1: Foundation
- [ ] Complete organization setup
- [ ] Configure SSO integration
- [ ] Import material master (Excel/CSV)
- [ ] Upload 10-20 TDS documents
- [ ] Enter 5-10 historical formulations
- [ ] Run first predictions
- [ ] Complete AI assistant tutorial

## Week 2: Build Knowledge
- [ ] Enter 20+ historical formulations
- [ ] Record 10+ trial results
- [ ] Link trial outcomes to predictions
- [ ] Review prediction accuracy
- [ ] Ask first AI troubleshooting question
- [ ] Set up first approval workflow

## Week 3: Active Use
- [ ] Create first new formulation from scratch
- [ ] Use AI suggestions for optimization
- [ ] Complete first approval cycle
- [ ] Run first DOE experiment set
- [ ] Import production batch data
- [ ] Generate first compliance report

## Week 4: Optimization
- [ ] Review model accuracy metrics
- [ ] Identify high-uncertainty properties
- [ ] Plan targeted experiments
- [ ] Train additional team members
- [ ] Set up scheduled reports
- [ ] Collect user feedback
```

---

# PART I: IMPLEMENTATION

---

# 38. Implementation Roadmap

## 38.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FOUNDATION (Weeks 1-4)                                           │
│  ├── Core infrastructure (Postgres, Redis, Auth)                           │
│  ├── Basic API (CRUD for materials, formulations)                          │
│  ├── Simple UI (dashboard, basic editor)                                   │
│  └── Deliverable: Users can enter and view formulations                    │
│                                                                             │
│  PHASE 2: INTELLIGENCE (Weeks 5-8)                                         │
│  ├── Prediction engine (physics + ML)                                      │
│  ├── Uncertainty quantification                                            │
│  ├── LLM integration (single model)                                        │
│  └── Deliverable: Property predictions with explanations                   │
│                                                                             │
│  PHASE 3: WORKFLOW (Weeks 9-12)                                            │
│  ├── Approval workflow engine                                              │
│  ├── Trial recording and feedback                                          │
│  ├── Document upload and RAG                                               │
│  └── Deliverable: Full formulation lifecycle                               │
│                                                                             │
│  PHASE 4: ADVANCED AI (Weeks 13-16)                                        │
│  ├── Multi-LLM debate engine                                               │
│  ├── Intelligent model router                                              │
│  ├── DOE generator                                                         │
│  ├── Active learning                                                       │
│  └── Deliverable: Full AI capabilities                                     │
│                                                                             │
│  PHASE 5: ENTERPRISE (Weeks 17-20)                                         │
│  ├── Supplier intelligence                                                 │
│  ├── Regulatory compliance                                                 │
│  ├── Analytics and reporting                                               │
│  ├── Performance optimization                                              │
│  └── Deliverable: Production-ready platform                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 38.2 Detailed Sprint Plan

### Phase 1: Foundation (Weeks 1-4)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 1.1 | Infrastructure | Postgres + RLS, Redis, Docker Compose |
| 1.2 | Auth & Users | SSO integration, JWT, RBAC |
| 1.3 | Core Entities | Materials, Suppliers, Formulations CRUD |
| 1.4 | Basic UI | Dashboard, Material list, Simple editor |

### Phase 2: Intelligence (Weeks 5-8)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 2.1 | Feature Extraction | Composition features, Material properties |
| 2.2 | Physics Models | Viscosity, HSP, Beer-Lambert |
| 2.3 | ML Models | XGBoost for key properties |
| 2.4 | UQ + LLM | Uncertainty quantification, Claude integration |

### Phase 3: Workflow (Weeks 9-12)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 3.1 | Workflow Engine | State machine, Approval requests |
| 3.2 | Trials | Trial recording, Outcome logging |
| 3.3 | Documents | Upload, OCR, Chunking |
| 3.4 | RAG | Vector store, Retrieval, Grounded answers |

### Phase 4: Advanced AI (Weeks 13-16)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 4.1 | LLM Router | Model registry, Task routing |
| 4.2 | Debate Engine | Multi-expert debate, Synthesis |
| 4.3 | DOE | Experiment design generator |
| 4.4 | Active Learning | Retraining triggers, Feedback loop |

### Phase 5: Enterprise (Weeks 17-20)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| 5.1 | Supplier Intel | Alternatives, Risk scoring |
| 5.2 | Compliance | REACH, Food contact checks |
| 5.3 | Analytics | Dashboards, Reports |
| 5.4 | Polish | Performance, Testing, Documentation |

---

# 39. Success Metrics

## 39.1 Platform Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|-------------------|
| Active users | 50 | 150 |
| Formulations created | 500 | 2,000 |
| Predictions generated | 5,000 | 25,000 |
| Trials recorded | 1,000 | 5,000 |
| AI queries answered | 2,000 | 10,000 |

## 39.2 Quality Metrics

| Metric | Target |
|--------|--------|
| Prediction accuracy (viscosity) | >90% within 10% |
| Prediction accuracy (overall) | >80% in spec |
| System uptime | 99.9% |
| API response time (p95) | <300ms |
| User satisfaction (NPS) | >50 |

## 39.3 Business Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Formulation development time | 6 months | 3 months |
| First-time-right rate | 35% | 65% |
| Time to find alternatives | 2 weeks | 4 hours |
| Knowledge capture rate | 10% | 90% |

---

# 40. Risk Mitigation

## 40.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API downtime | Medium | High | Multi-provider fallback |
| Model accuracy degradation | Medium | High | Automated monitoring + retraining |
| Data migration complexity | High | Medium | Phased migration, validation |
| Performance under load | Medium | Medium | Load testing, auto-scaling |

## 40.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | Medium | High | Training, champions, quick wins |
| Data quality issues | High | Medium | Validation workflows, cleaning |
| Resistance to AI suggestions | Medium | Medium | Transparency, explainability |
| Scope creep | High | Medium | Clear MVP, phased delivery |

---


---

# 42. Scope & MVP Boundaries (v5.1)

## What's IN for MVP (Weeks 1-20)

| Feature | Phase | Priority |
|---------|-------|----------|
| Core CRUD (formulations, materials, suppliers) | 1 | Must have |
| SSO Authentication | 1 | Must have |
| Basic UI (dashboard, editor) | 1 | Must have |
| Property predictions (physics + ML) | 2 | Must have |
| Uncertainty quantification | 2 | Must have |
| Single LLM integration (Anthropic) | 2 | Must have |
| Approval workflow | 3 | Must have |
| Trial recording | 3 | Must have |
| Document upload + basic RAG | 3 | Must have |
| Multi-LLM routing | 4 | Should have |
| Multi-expert debate | 4 | Should have |
| DOE generator | 4 | Should have |
| Basic compliance checking | 5 | Should have |
| Alternative material finder | 5 | Should have |

## What's DEFERRED Post-MVP

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| Production batch tracking | Lower priority than R&D | Phase 6 |
| Full ERP integration | Customer-specific | Phase 6+ |
| Mobile app | Web works on mobile | Phase 7 |
| Compliance dataset auto-sync | Manual updates acceptable | Phase 6 |
| Multi-language UI | English-only initially | Phase 6 |
| On-premise deployment | Cloud-only initially | Phase 7 |

## MVP Success Criteria

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| User can create formulation | End-to-end test | < 5 minutes |
| User can get prediction | API response time | < 1 second |
| Prediction is useful | User feedback | >70% "helpful" |
| AI answer is accurate | Expert validation | >80% correct |
| System is reliable | Uptime | >99.5% |


# 41. Appendices

## 41.1 Glossary

| Term | Definition |
|------|------------|
| **Formulation** | A recipe consisting of ingredients, specifications, and process steps |
| **Domain Pack** | Pluggable module containing chemistry-specific knowledge and models |
| **RLS** | Row-Level Security - PostgreSQL feature for multi-tenant isolation |
| **HSP** | Hansen Solubility Parameters - 3D solubility space |
| **HLB** | Hydrophilic-Lipophilic Balance - emulsion theory |
| **UQ** | Uncertainty Quantification |
| **DOE** | Design of Experiments |
| **RAG** | Retrieval-Augmented Generation |

## 41.2 API Quick Reference

```
Authentication:
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
  GET  /api/v1/auth/me

Formulations:
  GET  /api/v1/formulations
  POST /api/v1/formulations
  GET  /api/v1/formulations/{family_id}
  GET  /api/v1/formulations/{family_id}/versions
  POST /api/v1/formulations/{family_id}/versions
  GET  /api/v1/formulation-versions/{version_id}
  PUT  /api/v1/formulation-versions/{version_id}
  POST /api/v1/formulation-versions/{version_id}/submit

Materials:
  GET  /api/v1/materials
  POST /api/v1/materials
  GET  /api/v1/materials/{id}
  PUT  /api/v1/materials/{id}
  GET  /api/v1/materials/{id}/alternatives

Predictions:
  POST /api/v1/predictions
  GET  /api/v1/predictions/{id}
  POST /api/v1/predictions/{id}/feedback

AI:
  POST /api/v1/ai/quick-answer
  POST /api/v1/debate
  GET  /api/v1/debate/{id}

Approvals:
  GET  /api/v1/approvals
  POST /api/v1/approvals/{id}/approve
  POST /api/v1/approvals/{id}/reject
```

## 41.3 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/alkemi

# Redis
REDIS_URL=redis://host:6379

# Authentication
JWT_PRIVATE_KEY_PATH=/secrets/jwt.key
JWT_PUBLIC_KEY_PATH=/secrets/jwt.pub
AZURE_AD_CLIENT_ID=xxx
AZURE_AD_CLIENT_SECRET=xxx
AZURE_AD_TENANT_ID=xxx

# LLM Providers
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=alkemi-files
S3_ENDPOINT=https://s3.amazonaws.com

# Vector Store
PINECONE_API_KEY=xxx
PINECONE_ENVIRONMENT=xxx
PINECONE_INDEX=alkemi-docs

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

# Document End

**ALKEMI™ v5.0 Complete Engineering Specification**

*"Formulations at the Speed of Thought"*

---

© 2026 Confidential and Proprietary
