import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FlaskConical, 
  Beaker, 
  ScrollText, 
  Wrench, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Brain, 
  Target, 
  Microscope,
  Shield,
  BarChart3,
  Package,
  Building2,
  TestTube,
  Sparkles,
  MessageSquare,
  CheckSquare,
  Search,
  Grid3x3,
  BookOpen,
  Lightbulb,
  Zap,
  Award
} from "lucide-react";

export default function FeaturesGuide() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 pb-8 border-b">
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm px-4 py-1">
              <Award className="h-4 w-4 mr-2" />
              Enterprise Formulation Intelligence Platform
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            ALKEMI™ Platform Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive guide to leveraging AI-powered formulation intelligence 
            for accelerated R&D, competitive analysis, and regulatory compliance.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered Analysis
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Enterprise Security
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Brain className="h-3 w-3 mr-1" />
              PhD-Level Insights
            </Badge>
          </div>
        </div>

        {/* Quick Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Platform Overview
            </CardTitle>
            <CardDescription>
              Understanding the ALKEMI™ formulation intelligence ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              ALKEMI™ is an enterprise-grade formulation intelligence platform designed specifically 
              for R&D teams in the coatings, adhesives, inks, and specialty chemicals industries. 
              The platform combines advanced AI/ML capabilities with deep domain expertise to 
              accelerate formulation development cycles by up to 60%.
            </p>
            <p>
              Built on a foundation of <strong>multi-LLM architecture</strong> (Claude Opus 4.5, GPT-5.2, 
              Claude Sonnet 4.5, Gemini 2.5 Flash), the platform provides redundancy, optimal model 
              selection for specific tasks, and continuous availability. Each AI component is 
              specifically tuned for chemical formulation contexts, ensuring PhD-level accuracy 
              in technical recommendations.
            </p>
          </CardContent>
        </Card>

        {/* Feature Tabs */}
        <Tabs defaultValue="reverse-engineering" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="reverse-engineering" className="flex flex-col gap-1 py-3">
              <Beaker className="h-4 w-4" />
              <span className="text-xs">Reverse Engineering</span>
            </TabsTrigger>
            <TabsTrigger value="patent-analyzer" className="flex flex-col gap-1 py-3">
              <ScrollText className="h-4 w-4" />
              <span className="text-xs">Patent Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="formulations" className="flex flex-col gap-1 py-3">
              <FlaskConical className="h-4 w-4" />
              <span className="text-xs">Formulations</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex flex-col gap-1 py-3">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">AI Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="scale-up" className="flex flex-col gap-1 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Scale-Up</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex flex-col gap-1 py-3">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Compliance</span>
            </TabsTrigger>
          </TabsList>

          {/* Reverse Engineering Tab */}
          <TabsContent value="reverse-engineering" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-blue-500" />
                  Reverse Engineering Assistant
                </CardTitle>
                <CardDescription>
                  Transform competitor marketing claims into actionable technical specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Scientific Methodology</h4>
                  <p>
                    The Reverse Engineering Assistant employs a <strong>two-phase LLM architecture</strong> 
                    specifically designed for chemical formulation analysis:
                  </p>
                  <ol>
                    <li>
                      <strong>Phase 1 - Technical Analysis (Claude Sonnet 4.5):</strong> Performs deep 
                      semantic analysis of marketing claims, extracting implicit technical parameters 
                      using domain-specific knowledge of coating chemistry, polymer science, and 
                      surface phenomena.
                    </li>
                    <li>
                      <strong>Phase 2 - Structured Extraction (GPT-5.2):</strong> Converts the 
                      technical analysis into structured JSON format with ASTM/ISO test method 
                      references, quantitative specifications, and confidence intervals.
                    </li>
                  </ol>

                  <h4>Key Capabilities</h4>
                  <ul>
                    <li>
                      <strong>Performance Claim Translation:</strong> Converts vague marketing 
                      statements ("superior corrosion resistance") into quantitative specifications 
                      (ASTM B117 salt spray &gt;2000 hours, scribe creep &lt;5mm).
                    </li>
                    <li>
                      <strong>Test Method Mapping:</strong> Automatically identifies relevant 
                      ASTM, ISO, and EPA test methods for each claimed property.
                    </li>
                    <li>
                      <strong>Target Product Profile (TPP) Generation:</strong> Creates comprehensive 
                      specification documents suitable for R&D project initiation.
                    </li>
                    <li>
                      <strong>Confidence Scoring:</strong> Each extracted parameter includes a 
                      confidence score (0-100%) based on claim specificity and domain knowledge.
                    </li>
                  </ul>

                  <h4>Data Visualization</h4>
                  <p>
                    The Visualizations tab provides interactive charts for rapid insight:
                  </p>
                  <ul>
                    <li><strong>Parameter Confidence Distribution:</strong> Bar chart showing confidence levels across all extracted parameters</li>
                    <li><strong>Test Method Coverage:</strong> Pie chart showing ASTM vs ISO vs other standards distribution</li>
                    <li><strong>Property Coverage Radar:</strong> Radar chart showing coverage across key performance categories (Corrosion, Adhesion, Durability, Appearance, Chemical, Environmental)</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        Input Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Product Name:</strong> Competitor product identifier</p>
                      <p><strong>Manufacturer:</strong> Company name for context</p>
                      <p><strong>Product Type:</strong> Coating category (epoxy, polyurethane, etc.)</p>
                      <p><strong>Marketing Claims:</strong> 5-15 performance claims from TDS/marketing materials</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Output Deliverables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Technical Parameters:</strong> 15-30 quantitative specifications</p>
                      <p><strong>Test Methods:</strong> ASTM/ISO/EPA method references</p>
                      <p><strong>Critical Properties:</strong> Key performance indicators</p>
                      <p><strong>Formulation Strategy:</strong> Recommended approach to match/exceed</p>
                      <p><strong>Target Product Profile:</strong> Complete specification document</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patent Analyzer Tab */}
          <TabsContent value="patent-analyzer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-purple-500" />
                  Patent & Literature Analyzer
                </CardTitle>
                <CardDescription>
                  Extract chemistry, reaction mechanisms, and technology landscapes from patents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Scientific Methodology</h4>
                  <p>
                    The Patent Analyzer uses specialized NLP models trained on chemical patent 
                    corpora to extract structured information from unstructured patent text. 
                    The system identifies:
                  </p>
                  <ul>
                    <li><strong>Chemical Entities:</strong> Compounds, CAS numbers, IUPAC names, and trade names</li>
                    <li><strong>Reaction Mechanisms:</strong> Synthesis routes, catalysts, and reaction conditions</li>
                    <li><strong>Processing Conditions:</strong> Temperature, pressure, time, and atmosphere requirements</li>
                    <li><strong>Performance Claims:</strong> Quantitative specifications from examples</li>
                  </ul>

                  <h4>Technology Landscape Mapping</h4>
                  <p>
                    Beyond individual patent analysis, the system builds a comprehensive 
                    technology landscape by:
                  </p>
                  <ol>
                    <li>Clustering patents by chemistry type and application domain</li>
                    <li>Identifying white space opportunities where patent coverage is sparse</li>
                    <li>Tracking technology evolution over time</li>
                    <li>Mapping competitive patent portfolios</li>
                  </ol>

                  <h4>Formulation Strategy Generation</h4>
                  <p>
                    The analyzer generates actionable formulation strategies based on patent 
                    insights, including:
                  </p>
                  <ul>
                    <li>Design-around approaches to avoid infringement</li>
                    <li>Improvement opportunities based on patent limitations</li>
                    <li>Synergistic combinations from multiple patents</li>
                    <li>Freedom-to-operate assessments</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulations Tab */}
          <TabsContent value="formulations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-green-500" />
                  Formulation Management System
                </CardTitle>
                <CardDescription>
                  Version-controlled formulation development with branching and lineage tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Version Control Philosophy</h4>
                  <p>
                    ALKEMI™ treats formulations as first-class versioned entities, similar to 
                    source code in software development. This enables:
                  </p>
                  <ul>
                    <li><strong>Complete Audit Trail:</strong> Every change is tracked with timestamp, author, and rationale</li>
                    <li><strong>Branching Strategies:</strong> Create variants, cost reductions, or experimental branches without affecting production formulations</li>
                    <li><strong>Lineage Visualization:</strong> See the complete family tree of formulation evolution</li>
                    <li><strong>Comparison Tools:</strong> Side-by-side comparison of any two versions</li>
                  </ul>

                  <h4>Branch Types</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Branch Type</th>
                        <th>Purpose</th>
                        <th>Use Case</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Revision</strong></td>
                        <td>Minor adjustments</td>
                        <td>Fixing defects, optimizing existing formulation</td>
                      </tr>
                      <tr>
                        <td><strong>Variant</strong></td>
                        <td>Product line extension</td>
                        <td>Different colors, viscosities, or application methods</td>
                      </tr>
                      <tr>
                        <td><strong>Cost Reduction</strong></td>
                        <td>Value engineering</td>
                        <td>Substituting expensive raw materials while maintaining performance</td>
                      </tr>
                      <tr>
                        <td><strong>Customer Specific</strong></td>
                        <td>Custom requirements</td>
                        <td>Meeting specific customer specifications</td>
                      </tr>
                      <tr>
                        <td><strong>Experimental</strong></td>
                        <td>R&D exploration</td>
                        <td>Testing new technologies or approaches</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>Composition Management</h4>
                  <p>
                    The formulation editor enforces chemical best practices:
                  </p>
                  <ul>
                    <li>Automatic validation that components sum to 100%</li>
                    <li>Material property inheritance (Hansen parameters, density, viscosity)</li>
                    <li>Supplier linkage for procurement tracking</li>
                    <li>Regulatory flag propagation (VOC, HAP, REACH)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  AI Property Prediction Engine
                </CardTitle>
                <CardDescription>
                  Machine learning predictions with uncertainty quantification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Prediction Methodology</h4>
                  <p>
                    The prediction engine combines physics-based models with machine learning 
                    to provide accurate property predictions:
                  </p>
                  <ol>
                    <li>
                      <strong>Feature Extraction:</strong> Calculates molecular descriptors, 
                      Hansen Solubility Parameters (HSP), and composition-weighted properties
                    </li>
                    <li>
                      <strong>Physics-Based Models:</strong> Log-mixing rules for viscosity, 
                      HSP distance calculations for compatibility, density predictions
                    </li>
                    <li>
                      <strong>ML Enhancement:</strong> XGBoost models trained on historical 
                      formulation data to capture non-linear effects
                    </li>
                    <li>
                      <strong>Uncertainty Quantification:</strong> Bootstrap aggregation provides 
                      95% confidence intervals for all predictions
                    </li>
                  </ol>

                  <h4>Test Condition Dependency</h4>
                  <p>
                    All predictions are explicitly linked to test conditions, recognizing that 
                    coating performance is highly dependent on:
                  </p>
                  <ul>
                    <li>Substrate type and preparation</li>
                    <li>Application method and film thickness</li>
                    <li>Cure schedule (time, temperature, humidity)</li>
                    <li>Test environment (UV exposure, salt spray, immersion)</li>
                  </ul>

                  <h4>Explainability</h4>
                  <p>
                    Each prediction includes feature importance analysis showing which 
                    formulation components and properties most influence the predicted outcome. 
                    This enables targeted optimization.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scale-Up Tab */}
          <TabsContent value="scale-up" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Scale-Up Risk Analyzer
                </CardTitle>
                <CardDescription>
                  Physics-based analysis of lab-to-production scale-up challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Scale-Up Physics</h4>
                  <p>
                    The Scale-Up Analyzer applies fundamental chemical engineering principles 
                    to identify potential issues when transitioning from lab to production:
                  </p>

                  <h5>Heat Transfer Analysis</h5>
                  <p>
                    Calculates heat transfer coefficients and cooling capacity requirements 
                    based on:
                  </p>
                  <ul>
                    <li>Reaction enthalpy and heat generation rate</li>
                    <li>Vessel geometry and surface area to volume ratio</li>
                    <li>Jacket/coil heat transfer coefficients</li>
                    <li>Temperature control requirements</li>
                  </ul>

                  <h5>Mass Transfer Analysis</h5>
                  <p>
                    Evaluates mixing efficiency and mass transfer limitations:
                  </p>
                  <ul>
                    <li>Reynolds number and mixing regime</li>
                    <li>Power per unit volume requirements</li>
                    <li>Blend time predictions</li>
                    <li>Shear rate distribution</li>
                  </ul>

                  <h5>Reaction Kinetics</h5>
                  <p>
                    Analyzes reaction rate dependencies on scale:
                  </p>
                  <ul>
                    <li>Arrhenius parameters and temperature sensitivity</li>
                    <li>Concentration gradients and mixing effects</li>
                    <li>Side reaction potential at different scales</li>
                  </ul>

                  <h4>Risk Assessment Output</h4>
                  <p>
                    The analyzer provides a comprehensive risk assessment with:
                  </p>
                  <ul>
                    <li>Risk score (0-100) for each identified issue</li>
                    <li>Specific mitigation recommendations</li>
                    <li>Equipment modification suggestions</li>
                    <li>Process parameter adjustments</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Regulatory Compliance Engine
                </CardTitle>
                <CardDescription>
                  Automated compliance checking against global regulations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h4>Regulatory Coverage</h4>
                  <p>
                    The compliance engine maintains up-to-date databases of:
                  </p>
                  <ul>
                    <li><strong>VOC Regulations:</strong> EPA, CARB, EU Directive 2004/42/EC</li>
                    <li><strong>REACH:</strong> Substance restrictions and authorization requirements</li>
                    <li><strong>RoHS:</strong> Restricted substances for electronics applications</li>
                    <li><strong>FDA:</strong> Food contact and pharmaceutical requirements</li>
                    <li><strong>Industry Standards:</strong> SSPC, ISO, ASTM specifications</li>
                  </ul>

                  <h4>Compliance Checking Process</h4>
                  <ol>
                    <li><strong>Ingredient Screening:</strong> Each component checked against restricted substance lists</li>
                    <li><strong>Concentration Limits:</strong> Verify concentrations below regulatory thresholds</li>
                    <li><strong>Calculated Properties:</strong> VOC content, HAP content, heavy metal limits</li>
                    <li><strong>Application-Specific Rules:</strong> Different limits for different end uses</li>
                  </ol>

                  <h4>Versioned Compliance Rules</h4>
                  <p>
                    All compliance rules are versioned with effective dates, allowing:
                  </p>
                  <ul>
                    <li>Historical compliance verification for legacy products</li>
                    <li>Future compliance planning for upcoming regulations</li>
                    <li>Audit trail of rule changes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Features Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Additional Platform Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Materials Database
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Comprehensive raw material library with Hansen parameters, viscosity, 
                density, and supplier information. Supports custom material addition 
                with full property specification.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-500" />
                  Supplier Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Track supplier qualification status, risk assessment, and performance. 
                Includes geographic risk factors and alternative supplier recommendations.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-purple-500" />
                  Test Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Define and manage test condition sets with parameters. Link all 
                predictions and trials to specific test conditions for reproducibility.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-amber-500" />
                  Trials Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Record experimental trials with actual measurements. Compare predicted 
                vs actual results to continuously improve prediction accuracy.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4 text-red-500" />
                  Design of Experiments
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generate statistically optimal experimental designs. Supports factorial, 
                fractional factorial, and response surface methodologies.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  AI Debate Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Multi-LLM debate system for complex technical questions. Multiple 
                expert personas provide diverse perspectives with cross-critique 
                and synthesis.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  Equipment Database
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manage manufacturing equipment with specifications and constraints. 
                Check formulation compatibility with available equipment.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-500" />
                  Manufacturing Docs
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generate SOPs, batch process descriptions, and process flow diagrams. 
                AI-powered documentation with customizable templates.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Issue Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Track formulation issues with root cause analysis. AI-powered 
                improvement recommendations based on historical patterns.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  Approval Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Structured approval process for formulation changes. State machine 
                workflow with audit trail and role-based access control.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  Global Search
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Search across all platform entities - materials, formulations, 
                suppliers, patents, and documents. Semantic search with AI ranking.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Platform-wide analytics including formulation development metrics, 
                prediction accuracy tracking, and LLM usage statistics.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Recommended workflow for new users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                <h4 className="font-semibold mb-2">Add Materials</h4>
                <p className="text-sm text-muted-foreground">
                  Start by adding your raw materials library with properties and suppliers
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                <h4 className="font-semibold mb-2">Create Formulations</h4>
                <p className="text-sm text-muted-foreground">
                  Build formulations with version control and composition management
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                <h4 className="font-semibold mb-2">Run Predictions</h4>
                <p className="text-sm text-muted-foreground">
                  Use AI to predict properties and optimize formulations
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                <h4 className="font-semibold mb-2">Analyze & Scale</h4>
                <p className="text-sm text-muted-foreground">
                  Use reverse engineering and scale-up tools for competitive advantage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>
              Platform architecture and performance characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">AI/ML Infrastructure</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Primary LLM</span>
                    <span>Claude Opus 4.5</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Fallback Chain</span>
                    <span>GPT-5.2 → Claude Sonnet 4.5 → Gemini 2.5</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Prediction Models</span>
                    <span>XGBoost + Physics-based</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Uncertainty Method</span>
                    <span>Bootstrap Aggregation (95% CI)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Performance Targets</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">API Response (CRUD)</span>
                    <span>&lt;100ms</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Property Predictions</span>
                    <span>&lt;500ms</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">AI Quick Analysis</span>
                    <span>&lt;2s</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Complex AI (Debate)</span>
                    <span>&lt;15s</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
