# ALKEMI™ v5.1 - Complete 100% Implementation TODO

## Phase 1: Physics-Based Models (Critical) ✅ COMPLETE
- [x] Create physics models service file (server/physicsModels.ts)
- [x] Implement Hansen Solubility Parameters (HSP) distance calculation
- [x] Implement log-mixing rule for viscosity prediction
- [x] Implement refractive index mixing rules
- [x] Implement density mixing rules
- [x] Implement glass transition temperature (Tg) prediction
- [x] Integrate physics models with prediction engine
- [x] Update prediction API to use both physics and LLM predictions
- [x] Add physics model results to prediction response
- [ ] Write tests for physics calculations
- [x] Update Predictions UI to show physics-based results
- [x] Add refractive_index and glass_transition_temp columns to materials table

## Phase 2: RAG System with Vector Embeddings (Critical) ✅ COMPLETE
- [x] Add document_chunks table if not exists
- [x] Create PDF text extraction service using pdf-parse
- [x] Implement document chunking (500-1000 tokens per chunk)
- [x] Create vector embedding service (simple hash-based for now)
- [x] Store embeddings in database (use JSON column)
- [x] Implement semantic search functionality
- [x] Create hybrid search (semantic + keyword)
- [x] Build RAG retrieval service
- [x] Add source citation in responses
- [x] Create RAG query API endpoint
- [x] Build RAG query UI component
- [x] Add "Ask about documents" feature to Documents page
- [ ] Write tests for RAG system

## Phase 3: Trials Management (Critical)
- [ ] Create trials database helpers in db.ts
- [ ] Create trials router with CRUD endpoints
- [ ] Build Trials page with list view
- [ ] Create Trial creation dialog
- [ ] Add trial measurements input (multiple properties)
- [ ] Link trials to formulations and test conditions
- [ ] Implement predicted vs actual comparison view
- [ ] Add trial metadata (date, operator, equipment, notes)
- [ ] Create trial results visualization
- [ ] Add trials to navigation
- [ ] Write tests for trials API

## Phase 4: Supplier Intelligence (High Priority)
- [ ] Create supplier intelligence service file
- [ ] Implement find_alternatives() function
- [ ] Calculate material similarity scores based on properties
- [ ] Implement assess_supplier_risk() function
- [ ] Add geographic risk factors
- [ ] Add political risk factors
- [ ] Add financial risk scoring
- [ ] Create supplier intelligence API endpoints
- [ ] Build supplier alternatives UI component
- [ ] Add risk assessment display to Suppliers page
- [ ] Write tests for supplier intelligence

## Phase 5: Versioned Compliance Engine (High Priority)
- [ ] Create compliance engine service file
- [ ] Implement rule querying from compliance_rules table
- [ ] Add version management for compliance datasets
- [ ] Create check_formulation_compliance() function
- [ ] Support multiple regions (US, EU, China, etc.)
- [ ] Create compliance API endpoints
- [ ] Build compliance check UI component
- [ ] Add compliance status badges to formulations
- [ ] Create compliance report generation
- [ ] Write tests for compliance engine

## Phase 6: DOE Generator (High Priority)
- [ ] Create DOE generator service file
- [ ] Implement Latin Hypercube Sampling
- [ ] Implement Factorial designs
- [ ] Implement Response Surface Methodology
- [ ] Add constraint handling
- [ ] Create DOE API endpoints
- [ ] Build DOE generator UI page
- [ ] Add parameter input form
- [ ] Add constraint definition
- [ ] Implement Excel export for DOE
- [ ] Add DOE to navigation
- [ ] Write tests for DOE generator

## Phase 7: Formulation Export (Medium Priority)
- [ ] Install PDF generation library (jsPDF or similar)
- [ ] Create formulation export service
- [ ] Implement PDF export with composition table
- [ ] Add material properties to PDF
- [ ] Include predictions in PDF export
- [ ] Implement Excel export
- [ ] Add export buttons to Formulation Editor
- [ ] Create export dialog with options
- [ ] Write tests for export functionality

## Phase 8: Email Notifications (Medium Priority)
- [ ] Request email service credentials (SendGrid, AWS SES, etc.)
- [ ] Create email service wrapper
- [ ] Implement user invitation email template
- [ ] Implement approval request notification email
- [ ] Implement approval decision notification email
- [ ] Update user invitation mutation to send actual emails
- [ ] Add email notification preferences to user settings
- [ ] Write tests for email service

## Phase 9: Data Digitization Pipeline (Low Priority)
- [ ] Create digitization workflow page
- [ ] Add file upload for scanned documents
- [ ] Integrate OCR service (Tesseract.js or external API)
- [ ] Create extraction review UI
- [ ] Implement manual correction interface
- [ ] Add validation rules
- [ ] Create batch processing queue
- [ ] Add digitization status tracking
- [ ] Write tests for digitization pipeline

## Phase 10: Final Polish & Testing
- [ ] Run comprehensive test suite
- [ ] Fix any failing tests
- [ ] Performance testing for all endpoints
- [ ] Security audit
- [ ] Update all documentation
- [ ] Create user guide
- [ ] Create API documentation
- [ ] Final checkpoint and delivery
