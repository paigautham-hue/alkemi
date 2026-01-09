# ALKEMI™ v5.1 - Project TODO

## Phase 1: Database Schema with RLS and Core Tables
- [x] Set up MySQL/TiDB database (adapted from PostgreSQL spec)
- [x] Create all database enums (user_role, formulation_status, branch_type, confidentiality_level, qualification_status)
- [x] Create organizations table with multi-tenancy support
- [x] Create users table with role-based access control
- [x] Create materials table with Hansen parameters, viscosity, density
- [x] Create suppliers table with qualification status and risk assessment fields
- [x] Create formulation_families table
- [x] Create formulation_versions table with branching support
- [x] Create formulation_components table (junction table)
- [x] Create domains table for chemistry domain packs
- [x] Create organization_domains table for domain enablement
- [x] Implement application-level multi-tenancy (organizationId filtering)
- [x] Set up Drizzle ORM schema matching database schema
- [x] Run database migrations with pnpm db:push
- [ ] Create test_condition_sets table (first-class entity)
- [ ] Create test_condition_parameters table
- [ ] Create trials table linked to test_condition_sets
- [ ] Create trial_measurements table
- [ ] Create predictions table linked to test_condition_sets
- [ ] Create prediction_features table for explainability
- [ ] Create approval_requests table
- [ ] Create approval_reviews table
- [ ] Create documents table for TDS, MSDS, PDS, SOPs
- [ ] Create document_chunks table for RAG
- [ ] Create compliance_sources table
- [ ] Create compliance_datasets table
- [ ] Create compliance_rules table (versioned)
- [ ] Create llm_models table with provider configuration
- [ ] Create llm_audit_log table for cost tracking
- [ ] Create supplier_alternatives table
- [ ] Create supplier_risk_factors table
- [ ] Implement PostgreSQL RLS policies for all tables
- [ ] Create RLS helper functions: current_org_id(), current_user_id()
- [ ] Set up Drizzle ORM schema matching PostgreSQL schema
- [ ] Run database migrations with pnpm db:push

## Phase 2: Authentication with Azure AD SSO and RBAC
- [x] Implement Manus OAuth authentication flow
- [x] Generate session with org_id, user_id, and role claims
- [x] Create middleware for organization context (application-level multi-tenancy)
- [x] Implement scoped database queries with organizationId filtering
- [x] Create RBAC permission checking middleware (adminProcedure)
- [x] Define permissions by role (admin, manager, chemist, viewer)
- [x] Write multi-tenant isolation tests (11 tests passing)
- [x] Implement session management with secure cookies
- [ ] Integrate Azure AD OAuth/OIDC flow (future enhancement)

## Phase 3: Core CRUD APIs for Materials, Suppliers, and Formulations
- [x] Create tRPC router for materials (list, get, create, update, delete)
- [x] Add materials search and filtering
- [x] Create tRPC router for suppliers (list, get, create, update, delete)
- [x] Add supplier qualification status management
- [x] Create tRPC router for formulation families (list, get, create, update, delete)
- [x] Create tRPC router for formulation versions (list, get, create, update, delete)
- [x] Implement formulation branching (revision, variant, cost_reduction, customer_specific, experimental)
- [x] Create formulation components management (add, remove)
- [x] Implement formulation search and filtering
- [x] Add comprehensive validation with Zod schemas
- [ ] Add formulation lineage tracking UI
- [ ] Add validation for formulation composition (sum to 100%)

## Phase 4: Formulation Editor UI with Version Control
- [x] Design professional dashboard layout for R&D platform
- [x] Create Dashboard page with overview statistics
- [x] Create Materials page with search and list view
- [x] Create Suppliers page with qualification status badges
- [x] Create Formulations page with family listing
- [x] Create FormulationEditor page with version management
- [x] Implement DashboardLayout with sidebar navigation
- [x] Add professional styling with Tailwind 4
- [ ] Create materials selector component
- [ ] Build composition table with percentage inputs
- [ ] Add real-time validation for composition totals
- [ ] Implement version history viewer
- [ ] Create branching UI (select branch type and create new version)
- [ ] Add formulation comparison view
- [ ] Implement formulation lineage visualization
- [ ] Add formulation export functionality
- [ ] Create formulation import from CSV/Excel

## Phase 5: Test Conditions as First-Class Entities
- [ ] Create test conditions CRUD API
- [ ] Build test condition sets management UI
- [ ] Add test condition parameters configuration
- [ ] Pre-populate standard UV Inks domain test conditions
- [ ] Link predictions to test_condition_set
- [ ] Link trials to test_condition_set
- [ ] Validate all predictions require test_condition_set_id
- [ ] Validate all trials require test_condition_set_id

## Phase 6: Approval Workflow State Machine with UI
- [ ] Implement state machine (draft→submitted→in_review→revision_requested→approved/rejected)
- [ ] Create approval request submission API
- [ ] Create approval review API with comments
- [ ] Build approval request UI for chemists
- [ ] Build approval review UI for managers
- [ ] Add approval history tracking
- [ ] Implement email notifications for approval events
- [ ] Add approval dashboard for managers
- [ ] Create audit trail for all state transitions

## Phase 7: AI Prediction Engine with Uncertainty Quantification
- [ ] Implement FormulationFeatureExtractor
- [ ] Build physics-based models (log-mixing viscosity, HSP distance)
- [ ] Integrate XGBoost property predictor
- [ ] Implement uncertainty quantification module
- [ ] Add confidence interval calculations
- [ ] Calculate probability_in_spec for predictions
- [ ] Generate feature importance for explainability
- [ ] Create prediction API endpoint (POST /api/v1/predictions)
- [ ] Require condition_set_id in prediction requests
- [ ] Set up MLflow for model tracking
- [ ] Build prediction results UI with uncertainty visualization

## Phase 8: Intelligent LLM Router with Cost Budgets and Content Redaction
- [ ] Create LLMModel class distinguishing llm_model_pk vs provider_model_id
- [ ] Implement multi-provider support (Anthropic, OpenAI, Google)
- [ ] Build intelligent router with model selection logic
- [ ] Add cost budget tracking ($1/request, $10/user/day, $100/org/day)
- [ ] Implement per-organization provider allowlists
- [ ] Implement per-organization provider denylists
- [ ] Create ContentRedactor class for sensitive data removal
- [ ] Add redaction rules for formulation details, supplier names, pricing
- [ ] Implement cost enforcement before LLM calls
- [ ] Add LLM usage dashboard for administrators

## Phase 9: Multi-LLM Debate Engine with Persona Generation
- [ ] Implement persona generation for expert roles
- [ ] Build parallel consultation phase
- [ ] Create cross-critique phase
- [ ] Implement synthesis phase
- [ ] Add debate orchestration logic
- [ ] Create debate API endpoint
- [ ] Build debate UI with streaming responses
- [ ] Add debate history tracking
- [ ] Implement debate export functionality

## Phase 10: Document RAG System with Vector Embeddings
- [ ] Implement secure S3 document upload
- [ ] Add PDF text extraction using PyMuPDF
- [ ] Create document chunking logic
- [ ] Implement VectorStore interface (Pinecone/pgvector)
- [ ] Generate embeddings using text-embedding-3-large
- [ ] Build hybrid search (vector + keyword)
- [ ] Add source citation in RAG responses
- [ ] Create document management UI
- [ ] Build document search interface
- [ ] Add document viewer with highlighting

## Phase 11: Versioned Compliance Engine
- [ ] Create compliance sources management API
- [ ] Create compliance datasets management API
- [ ] Create compliance rules management API
- [ ] Implement versioned compliance rule queries
- [ ] Build compliance screening for formulations
- [ ] Add compliance violation detection
- [ ] Create compliance dashboard
- [ ] Implement compliance report generation
- [ ] Add compliance rule editor UI

## Phase 12: Supplier Intelligence and Risk Assessment
- [ ] Implement find_alternatives() with similarity scoring
- [ ] Build assess_supplier_risk() with geographic factors
- [ ] Add supplier risk scoring algorithm
- [ ] Create supplier alternatives recommendation API
- [ ] Build supplier risk assessment UI
- [ ] Add supplier comparison view
- [ ] Implement supplier risk alerts
- [ ] Create supplier intelligence dashboard

## Phase 13: Analytics Dashboards and LLM Audit Logging
- [ ] Build platform metrics dashboard
- [ ] Add formulation development cycle time tracking
- [ ] Implement first-time-right rate calculations
- [ ] Create LLM cost tracking dashboard
- [ ] Add LLM token usage analytics
- [ ] Implement prompt hash tracking for auditing
- [ ] Build user activity analytics
- [ ] Create organization usage reports
- [ ] Add export functionality for all analytics

## Phase 14: Data Digitization Pipeline UI
- [ ] Create document upload interface for scanning
- [ ] Build OCR processing workflow
- [ ] Implement data extraction review UI
- [ ] Add validation rules interface
- [ ] Create digitization queue management
- [ ] Build digitization status tracking
- [ ] Add bulk import functionality
- [ ] Implement digitization quality metrics

## Phase 15: Comprehensive Testing and Polish
- [ ] Write unit tests for all tRPC procedures
- [ ] Write integration tests for workflows
- [ ] Test RLS isolation across organizations
- [ ] Test all AI prediction scenarios
- [ ] Test LLM router cost enforcement
- [ ] Test compliance engine with various rules
- [ ] Verify latency budgets (Health: 20ms, CRUD: 100ms, Predictions: 500ms, AI Quick: 2s, AI Debate: 15s)
- [ ] Conduct security audit focusing on RLS
- [ ] Test all approval workflow transitions
- [ ] Verify document RAG accuracy
- [ ] Polish UI/UX based on feedback
- [ ] Add loading states and error handling throughout
- [ ] Optimize database queries for performance
- [ ] Add comprehensive error messages

## Phase 16: Checkpoint and Delivery
- [ ] Create final checkpoint
- [ ] Generate deployment documentation
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Prepare demo data
- [ ] Deliver application to user
