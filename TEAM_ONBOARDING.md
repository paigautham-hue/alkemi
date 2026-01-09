# ALKEMI™ Team Onboarding Guide

Welcome to ALKEMI™ - Enterprise Formulation Intelligence Platform for R&D teams.

## Quick Start for Team Members

### 1. Sign In

**Published Site URL:** Your team admin will provide the published site URL (format: `alkemifor-xxxxx.manus.space`)

**Sign-In Process:**
1. Visit the published site URL
2. Click "Sign In" button
3. You'll be redirected to Manus OAuth portal
4. Sign in with your email (Google, Microsoft, or other supported methods)
5. After authentication, you'll be automatically redirected back to ALKEMI™
6. Your personal workspace will be created automatically - no invitation needed!

**First-Time Users:**
- Each team member gets their own isolated workspace: "{Your Name}'s Workspace"
- All your data (materials, formulations, predictions) is private to your workspace
- You can start using all features immediately after sign-in

### 2. Load Demo Data

After signing in for the first time:

1. You'll see the Dashboard with empty stats (0 materials, 0 suppliers, 0 formulations)
2. Click the **"Load Demo Data"** button in the top-right corner
3. Demo data includes:
   - 5 materials (polymers, solvents, additives) with full properties
   - 3 suppliers with contact information
   - 3 formulation families with multiple versions
   - Predictions with physics-based calculations
   - Trial results with measurements
   - FDA compliance rules

4. After loading, the button will disappear and you'll see populated data
5. **Take the guided tour** - Click "Start Tour" to learn about key features (11 steps, ~2 minutes)

### 3. Explore Key Features

**Materials Management** (Navigation → Materials)
- Browse material library with properties (viscosity, density, Tg, etc.)
- Add new materials with CAS numbers and supplier info
- Find alternative materials with "Find Alternatives" button
- View material properties and compatibility data

**Formulations** (Navigation → Formulations)
- Create formulation families with version control
- Add components with percentages (must total 100%)
- Branch versions for experimentation
- Export formulations as PDF reports

**Predictions** (Navigation → Predictions)
- Run AI predictions for formulation properties
- See physics-based calculations (Hansen Solubility, viscosity, Tg)
- Get compatibility assessments
- Compare predicted vs actual results

**Trials** (Navigation → Trials)
- Record experimental results
- Link trials to formulations and predictions
- Track test conditions (temperature, humidity, duration)
- Measure actual properties and compare with predictions

**Compliance** (Navigation → Compliance)
- Activate pre-configured rule templates (FDA, EU Cosmetics, REACH, Prop 65)
- Check formulations against regulations
- See violations with severity levels
- Get regulatory references

**DOE (Design of Experiments)** (Navigation → DOE)
- Generate experimental designs (Latin Hypercube, Factorial, Fractional Factorial, CCD)
- Specify factors and their ranges
- Get optimized test matrices
- Export designs for lab execution

**Documents** (Navigation → Documents)
- Upload PDFs, specifications, research papers
- Ask questions about your documents with AI
- Get answers with source citations
- Full-text search across all documents

**Analytics** (Navigation → Analytics)
- View prediction accuracy trends over time
- Track trial success rates
- Monitor formulation development timeline
- Filter by time range (7 days to 1 year)

**Search** (Navigation → Search)
- Global search across materials, formulations, and documents
- Filter by properties (viscosity, density ranges)
- Filter by category and supplier
- See match reasons and counts

### 4. Super Admin Access

**Super Admin Emails:**
- paigautham@gmail.com
- gpai@msn.com
- gautham@manipalgroup.info

**Super Admin Privileges:**
- Automatically assigned "admin" role on sign-in
- Full access to all platform features
- Can manage compliance rules
- Can view analytics across all data
- Badge displayed in UI (future enhancement)

**Regular Team Members:**
- Assigned "chemist" role by default
- Full access to all features within their workspace
- Cannot access other users' workspaces (isolated tenancy)
- Can collaborate through shared formulations (future enhancement)

### 5. Common Workflows

**Creating Your First Formulation:**
1. Go to Materials → Add materials with properties
2. Go to Suppliers → Add supplier contacts
3. Go to Formulations → Create new family
4. Add components (drag materials, set percentages)
5. Save formulation
6. Run predictions to see calculated properties
7. Check compliance against regulations
8. Create trial to record actual results

**Running Predictions:**
1. Go to Predictions page
2. Select a formulation from dropdown
3. Click "Run Prediction"
4. View AI-generated insights
5. See physics-based calculations (HSP, viscosity, Tg)
6. Check compatibility assessment
7. Compare with trial results later

**Document Intelligence:**
1. Go to Documents page
2. Upload PDF files (specs, papers, reports)
3. Wait for processing (text extraction + embeddings)
4. Click "Ask About Documents"
5. Type your question (e.g., "What is the recommended curing temperature?")
6. Get AI answer with source citations
7. Click citations to see original context

**Compliance Checking:**
1. Go to Compliance page
2. Click "Activate Template" for your region (FDA, EU, REACH)
3. Rules are now active in your workspace
4. Go to Formulations → Open a formulation
5. Click "Check Compliance" button
6. View results: Pass/Fail with violation details
7. Fix violations by adjusting components

### 6. Tips & Best Practices

**Data Entry:**
- Use consistent naming conventions for materials (e.g., "PVA-205" not "pva 205")
- Always include CAS numbers for materials when available
- Fill in as many properties as possible for better predictions
- Link materials to suppliers for sourcing information

**Predictions:**
- Run predictions before creating trials to set expectations
- Physics-based predictions are instant, AI predictions take 5-10 seconds
- Compare predicted vs actual results to improve accuracy over time
- Use predictions to prioritize which formulations to test

**Trials:**
- Record test conditions accurately (temperature, humidity, duration)
- Measure all relevant properties (viscosity, density, appearance)
- Link trials to predictions to track accuracy
- Add notes about observations and issues

**Compliance:**
- Activate relevant templates for your industry/region
- Check compliance early in formulation development
- Review violation details and regulatory references
- Update formulations to fix violations before production

**Search:**
- Use global search to find materials across your library
- Filter by property ranges to find suitable candidates
- Search documents by keywords or concepts
- Save time by searching instead of browsing

### 7. Troubleshooting

**Can't Sign In:**
- Make sure you're using the published site URL, not the dev server
- Try clearing browser cookies and cache
- Use incognito/private mode to test
- Check that you're using a supported OAuth provider (Google, Microsoft, etc.)

**Demo Data Not Loading:**
- Refresh the page after clicking "Load Demo Data"
- Check browser console for errors (F12 → Console tab)
- Try signing out and back in
- Contact admin if issue persists

**Predictions Not Working:**
- Ensure formulation has at least 2 components
- Check that component percentages total 100%
- Verify materials have required properties (viscosity, density, etc.)
- Wait 10-15 seconds for AI predictions (they're not instant)

**Compliance Check Fails:**
- Make sure you've activated at least one compliance template
- Check that formulation has all components with CAS numbers
- Verify materials have required safety data
- Review error message for specific missing data

### 8. Getting Help

**Documentation:**
- README.md - Technical setup and architecture
- FEATURES_COMPLETE.md - Complete feature list
- AUDIT_REPORT.md - Implementation verification

**Support:**
- Contact your team admin for workspace-specific questions
- Report bugs or request features through your admin
- Check browser console (F12) for error messages
- Include screenshots when reporting issues

### 9. Next Steps After Onboarding

1. **Populate Your Real Data:**
   - Import your material library (or add manually)
   - Add your supplier contacts
   - Create your actual formulations
   - Upload your technical documents

2. **Set Up Your Workflow:**
   - Activate relevant compliance templates
   - Create test condition sets for your lab
   - Set up formulation families for your product lines
   - Establish naming conventions for your team

3. **Start Using AI Features:**
   - Run predictions on existing formulations
   - Ask questions about your uploaded documents
   - Use DOE generator to plan experiments
   - Track prediction accuracy with trials

4. **Collaborate with Team:**
   - Share formulation insights with colleagues
   - Review trial results together
   - Discuss compliance requirements
   - Plan experiments using DOE designs

---

## Platform Architecture

**Multi-Tenant Design:**
- Each user has their own isolated workspace (organization)
- Data is completely private between workspaces
- No cross-contamination of materials, formulations, or documents
- Super admins have their own workspace like everyone else

**Role-Based Access:**
- **Admin:** Super admins with full platform access
- **Chemist:** Regular users with full feature access in their workspace
- Future roles: Manager, Senior Chemist, Production, Procurement, Viewer

**Data Isolation:**
- All database queries filter by organizationId
- Materials, formulations, documents are workspace-specific
- Predictions and trials are tied to workspace formulations
- Compliance rules are workspace-specific

---

## Feature Checklist

✅ **Core Features:**
- [x] Materials library with properties
- [x] Supplier management
- [x] Formulation families with versioning
- [x] Component management (drag-drop, percentages)
- [x] Physics-based predictions (HSP, viscosity, Tg, density, RI)
- [x] AI predictions with LLM integration
- [x] Trials with test conditions and measurements
- [x] Compliance engine with rule templates
- [x] Document upload and RAG (PDF intelligence)
- [x] DOE generator (4 design types)
- [x] Analytics dashboard with charts
- [x] Global search with filters
- [x] PDF report generation
- [x] Guided tour for onboarding
- [x] Demo data seeding

✅ **Authentication & Access:**
- [x] Manus OAuth integration
- [x] Automatic workspace creation
- [x] Super admin email whitelist
- [x] Role-based access control
- [x] Session management (1 year expiry)

✅ **User Experience:**
- [x] Dark theme with professional design
- [x] Responsive layout (desktop + mobile)
- [x] Loading states and error handling
- [x] Toast notifications
- [x] Confirmation dialogs
- [x] Keyboard shortcuts (future)

---

**Welcome to ALKEMI™! Start by loading demo data and taking the guided tour. Happy formulating! 🧪**
