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
- [x] Prepare demo data (Load Demo Data button + Reset Workspace)
- [ ] Deliver application to user


## Phase 4.1: Creation Dialogs and Enhanced UI (Current Focus)
- [x] Create MaterialCreateDialog component with full form
- [x] Add domain selector dropdown in material dialog
- [x] Add supplier selector dropdown in material dialog
- [x] Implement material creation with toast notifications
- [x] Create SupplierCreateDialog component with full form
- [x] Add country selector dropdown
- [x] Add qualification status selector
- [x] Implement supplier creation with toast notifications
- [x] Create FormulationFamilyCreateDialog component
- [x] Add domain selector for formulations
- [x] Add confidentiality level selector
- [x] Implement formulation family creation
- [x] Seed database with 8 chemistry domains
- [x] Integrate all creation dialogs into respective pages
- [x] Add loading states for all mutations
- [ ] Create FormulationVersionCreateDialog component
- [ ] Add branch type selector
- [ ] Add parent version selector for branching
- [ ] Implement version creation with proper lineage
- [ ] Add edit dialogs for all entities
- [ ] Add delete confirmation dialogs


## Phase 4.2: Expand Database Schema for AI and Advanced Features (Completed)
- [x] Add test_condition_sets table
- [x] Add test_condition_parameters table
- [x] Add predictions table with uncertainty quantification fields
- [x] Add prediction_features table for explainability
- [x] Add llm_models table
- [x] Add llm_audit_log table for cost tracking
- [x] Add documents table for RAG system
- [x] Add document_chunks table with vector embeddings
- [x] Add compliance_sources table
- [x] Add compliance_datasets table
- [x] Add compliance_rules table (versioned)
- [x] Add approval_requests table
- [x] Add approval_reviews table
- [x] Add trials table
- [x] Add trial_measurements table
- [x] Run database migrations via SQL script
- [x] Verify all 25 tables created successfully


## Phase 5: Test Conditions Management (Completed)
- [x] Add test conditions database helpers to db.ts
- [x] Create testConditions tRPC router with CRUD operations
- [x] Build TestConditionsPage with list view
- [x] Create TestConditionSetCreateDialog component
- [x] Add parameter management UI (add/remove parameters)
- [x] Implement standard/non-standard flag
- [x] Add domain filtering
- [x] Add test condition set deletion
- [ ] Write tests for test conditions API (deferred to final testing phase)

## Phase 6: AI Prediction Engine (Completed)
- [x] Create predictions database helpers
- [x] Build prediction engine service with LLM integration
- [x] Implement uncertainty quantification calculations (95% CI)
- [x] Add feature importance extraction
- [x] Create predictions tRPC router
- [x] Build PredictionsPage with history view
- [x] Create RunPredictionDialog with formulation and test condition selectors
- [x] Add prediction results visualization with confidence intervals
- [x] Implement probability_in_spec calculations
- [x] Link all predictions to test condition sets
- [ ] Write tests for prediction engine (deferred to final testing phase)

## Phase 7: Intelligent LLM Router
- [ ] Seed llm_models table with Anthropic, OpenAI, Google models
- [ ] Create LLM router service with provider selection logic
- [ ] Implement cost budget tracking (per-request, per-user-day, per-org-day)
- [ ] Add content redaction for sensitive data
- [ ] Create organization-level provider allowlist/denylist
- [ ] Build LLM settings page for admins
- [ ] Add cost analytics dashboard
- [ ] Implement LLM audit logging
- [ ] Write tests for LLM router and budget enforcement

## Phase 8: Multi-LLM Debate Engine
- [ ] Create debate engine service
- [ ] Implement persona generation for chemistry experts
- [ ] Build parallel LLM consultation system
- [ ] Add cross-critique mechanism
- [ ] Implement synthesis and consensus building
- [ ] Create debate results visualization
- [ ] Add debate history tracking
- [ ] Build DebatePage UI for complex questions
- [ ] Write tests for debate engine

## Phase 9: Document RAG System
- [ ] Create documents database helpers
- [ ] Build document upload service with S3 integration
- [ ] Implement PDF text extraction
- [ ] Add document chunking logic
- [ ] Integrate vector embedding generation (mock for now, real in production)
- [ ] Create hybrid search (keyword + semantic)
- [ ] Build DocumentsPage with upload and search
- [ ] Add document viewer with source citation
- [ ] Implement ingestion status tracking
- [ ] Write tests for document processing

## Phase 10: Versioned Compliance Engine
- [ ] Create compliance database helpers
- [ ] Seed compliance_sources with sample regulations
- [ ] Seed compliance_datasets with sample data
- [ ] Seed compliance_rules with versioned rules
- [ ] Build compliance checking service
- [ ] Create CompliancePage with rules management
- [ ] Add formulation compliance checking UI
- [ ] Implement compliance violation reporting
- [ ] Add compliance history tracking
- [ ] Write tests for compliance engine

## Phase 11: Approval Workflow State Machine
- [ ] Create approval workflow database helpers
- [ ] Build approval state machine service
- [ ] Implement state transitions (draft→submitted→in_review→approved/rejected)
- [ ] Create ApprovalsPage with request list
- [ ] Build ApprovalRequestDialog
- [ ] Add review UI for managers/admins
- [ ] Implement approval notifications
- [ ] Add approval history and audit trail
- [ ] Write tests for approval workflow

## Phase 12: Supplier Intelligence & Risk Assessment
- [ ] Add supplier risk scoring algorithm
- [ ] Implement supplier performance tracking
- [ ] Create supplier comparison tool
- [ ] Add supplier qualification workflow
- [ ] Build supplier analytics dashboard
- [ ] Implement supplier alerts for risk changes
- [ ] Write tests for supplier intelligence

## Phase 13: Analytics Dashboards & Monitoring
- [ ] Create analytics database helpers
- [ ] Build organization-wide analytics dashboard
- [ ] Add formulation success rate tracking
- [ ] Implement prediction accuracy monitoring
- [ ] Create LLM cost analytics with charts
- [ ] Add user activity tracking
- [ ] Build admin monitoring dashboard
- [ ] Implement real-time notifications for critical events
- [ ] Write tests for analytics

## Phase 14: Data Digitization Pipeline
- [ ] Create digitization workflow UI
- [ ] Add scan upload interface
- [ ] Implement OCR integration (mock for now)
- [ ] Build data extraction UI
- [ ] Add review and validation interface
- [ ] Implement batch processing
- [ ] Create digitization queue management
- [ ] Write tests for digitization pipeline

## Phase 15: Final Testing & Polish
- [ ] Run comprehensive integration tests
- [ ] Test all CRUD operations end-to-end
- [ ] Verify multi-tenant isolation across all features
- [ ] Test RBAC permissions for all roles
- [ ] Add loading states and error handling everywhere
- [ ] Implement proper empty states
- [ ] Add helpful tooltips and documentation
- [ ] Optimize database queries
- [ ] Add proper indexes for performance
- [ ] Final UI polish and consistency check


## Phase 15: Approval Workflow State Machine (Completed)
- [x] Add approval workflow database helpers
- [x] Create approval workflow state machine service
- [x] Implement state transitions (draft→submitted→in_review→approved/rejected)
- [x] Add review comment system
- [x] Create approval request API endpoints (create, review, resubmit, listPending, listMyRequests, getHistory, getByFormulation)
- [x] Build approval workflow UI components
- [x] Add approval status badges with icons
- [x] Create review dialog for managers/admins with approve/reject/request_revision actions
- [x] Implement revision request flow
- [x] Add Approvals page to navigation
- [x] Create tabs for pending reviews and my requests

## Phase 16: Enhanced Formulation Editor
- [ ] Build component selector with material search
- [ ] Add drag-and-drop component reordering
- [ ] Implement real-time composition validation (sum to 100%)
- [ ] Add percentage input with automatic recalculation
- [ ] Create version comparison view (side-by-side)
- [ ] Build formulation lineage visualization
- [ ] Add formulation export to CSV/Excel
- [ ] Implement formulation cloning
- [ ] Add formulation notes and comments
- [ ] Create formulation print view

## Phase 17: Analytics Dashboard & Final Polish (Completed)
- [x] Create analytics page layout with 3 tabs (Overview, AI Usage, Formulations)
- [x] Add LLM usage statistics and request tracking
- [x] Add cost analytics with budget visualization
- [x] Create prediction accuracy tracking (85% success rate)
- [x] Add formulation statistics (families, test conditions, predictions)
- [x] Implement material usage analytics
- [x] Add supplier performance metrics (qualified suppliers tracking)
- [x] Create system activity overview
- [x] Add cost budget status with progress bars
- [x] Add Analytics page to navigation
- [x] Implement comprehensive metrics dashboard
- [ ] Write comprehensive tests for all new features (deferred)
- [ ] Final checkpoint and delivery


## Phase 18: Enhanced Formulation Editor (Completed)
- [x] Redesign FormulationEditor page with tabbed interface (Composition, Properties, History)
- [x] Create component management table with add/remove
- [x] Add material selector with search functionality
- [x] Implement percentage input with real-time validation
- [x] Add total percentage display with visual indicator (must sum to 100%)
- [x] Add formulation properties section (target properties, notes)
- [x] Implement version selector for switching between versions
- [x] Add version history view with clickable version cards
- [x] Create add component dialog with material selection and percentage input
- [x] Add validation warnings when total percentage != 100%
- [ ] Create component reordering functionality (deferred)
- [ ] Implement version comparison view (deferred)
- [ ] Add formulation cloning functionality (deferred)
- [ ] Create formulation export to PDF/Excel (deferred)

## Phase 19: Document Upload System
- [ ] Add documents table integration to UI
- [ ] Create document upload component with S3 integration
- [ ] Add document type selector (TDS, MSDS, PDS, SOP, Report, Lab Notebook)
- [ ] Implement file upload with progress tracking
- [ ] Create documents list page with search and filtering
- [ ] Add document viewer/download functionality
- [ ] Implement document metadata editing
- [ ] Add document deletion with confirmation

## Phase 20: Supplier Risk Assessment
- [ ] Create risk assessment algorithm
- [ ] Add risk score calculation based on qualification status, delivery time, quality metrics
- [ ] Implement risk level badges (low, medium, high, critical)
- [ ] Add risk assessment history tracking
- [ ] Create supplier performance metrics
- [ ] Add automated risk alerts for critical suppliers
- [ ] Implement risk mitigation recommendations

## Phase 21: User Management & Organization Settings
- [ ] Create users management page
- [ ] Add user invitation system
- [ ] Implement role assignment UI (admin, manager, chemist, viewer)
- [ ] Create organization settings page
- [ ] Add organization profile editing
- [ ] Implement LLM provider allowlist/denylist UI
- [ ] Add cost budget configuration UI
- [ ] Create user activity log viewer

## Phase 22: Final Testing & Polish
- [ ] Write comprehensive tests for all new features
- [ ] Test all creation dialogs end-to-end
- [ ] Verify multi-tenant isolation across all features
- [ ] Test approval workflow state transitions
- [ ] Verify LLM cost tracking accuracy
- [ ] Test prediction engine with various formulations
- [ ] Verify debate engine synthesis quality
- [ ] Add loading skeletons for all pages
- [ ] Implement comprehensive error boundaries
- [ ] Add helpful empty states with CTAs
- [ ] Optimize database queries
- [ ] Final checkpoint and delivery


## Phase 19: Document Upload System (Completed)
- [x] Create Documents page with list view
- [x] Add document upload component with file selection
- [x] Implement S3 file upload integration with storagePut
- [x] Add document metadata form (title, type, description)
- [x] Create document type selector (TDS, MSDS, PDS, SOP, Report, Lab Notebook, Other)
- [x] Add document download functionality (opens in new tab)
- [x] Implement document search and filtering by type
- [x] Create document deletion with confirmation dialog
- [x] Add Documents to navigation (10 pages total now)
- [x] Display file size, upload date, and filename
- [x] Add empty state with helpful message
- [ ] Add document preview for PDFs (deferred)
- [ ] Link documents to formulations and materials (deferred)

## Phase 20: User Management & Organization Settings
- [ ] Create Settings page with tabs
- [ ] Add organization profile section
- [ ] Create user list view with roles
- [ ] Add user invitation dialog
- [ ] Implement email invitation system
- [ ] Add user role assignment UI
- [ ] Create user deactivation functionality
- [ ] Add organization domain management
- [ ] Implement LLM provider preferences UI
- [ ] Add cost budget configuration UI

## Phase 21: Formulation Export
- [ ] Add export button to formulation editor
- [ ] Create PDF export functionality
- [ ] Add Excel export functionality
- [ ] Include composition table in exports
- [ ] Add material properties to exports
- [ ] Include test conditions in exports
- [ ] Add prediction results to exports
- [ ] Create branded export template
- [ ] Add export history tracking

## Phase 22: Final UI Polish
- [ ] Add loading skeletons to all list pages
- [ ] Implement empty states with helpful messages
- [ ] Add error boundaries to all major components
- [ ] Improve form validation messages
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement keyboard shortcuts for common actions
- [ ] Add tooltips to complex UI elements
- [ ] Improve mobile responsiveness
- [ ] Add accessibility improvements (ARIA labels, focus management)
- [ ] Final comprehensive testing

## Phase 23: Comprehensive Demo Data Enhancement
- [ ] Add formulation components with realistic material percentages (must sum to 100%)
- [ ] Add multiple test condition sets (UV exposure, temperature cycling, humidity, accelerated aging)
- [ ] Add more predictions with varying confidence levels and feature importance
- [ ] Add more trials with actual measurement data and pass/fail results
- [ ] Add approval workflow examples (draft, submitted, in_review, approved, rejected states)
- [ ] Add sample documents (TDS, MSDS, PDS) for the Documents section
- [ ] Add more compliance rules to showcase compliance engine capabilities
- [ ] Add supplier alternatives data
- [ ] Add more material categories (solvents, additives, pigments, catalysts)
- [ ] Ensure demo data covers all navigation sections


## Phase 23: Comprehensive Demo Data Enhancement (Completed)
- [x] Add formulation components with realistic percentages (totaling 100%)
- [x] Add more test condition sets (standard, UV exposure, high-temperature)
- [x] Add more predictions with different confidence levels and uncertainty quantification
- [x] Add more trials with actual measurement data
- [x] Fix formulation composition display (showing NaN% and Unknown Material)
- [x] Fix frontend data structure to access component.percentage correctly
- [x] Verify all demo data loads successfully
- [x] Test formulation composition display with real materials
- [x] Test predictions page with confidence intervals
- [x] Test trials page with measurement data
