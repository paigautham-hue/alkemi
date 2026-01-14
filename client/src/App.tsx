import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Suppliers from "./pages/Suppliers";
import SupplierRiskDashboard from "./pages/SupplierRiskDashboard";
import Formulations from "./pages/Formulations";
import FormulationEditor from "./pages/FormulationEditor";
import Predictions from "./pages/Predictions";
import TestConditions from "./pages/TestConditions";
import Debate from "./pages/Debate";
import Approvals from "./pages/Approvals";
import ComplianceTemplates from "./pages/ComplianceTemplates";
import Analytics from "./pages/Analytics";
import Documents from "@/pages/Documents";
import Settings from "@/pages/Settings";
import Trials from "@/pages/Trials";
import DOE from "@/pages/DOE";
import Search from "@/pages/Search";
import ReverseEngineering from "./pages/ReverseEngineering";
import PatentAnalyzer from "./pages/PatentAnalyzer";
import Equipment from "./pages/Equipment";
import ScaleUpAnalyzer from "./pages/ScaleUpAnalyzer";
import IssueTracking from "./pages/IssueTracking";
import ManufacturingDocs from "./pages/ManufacturingDocs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/materials" component={Materials} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/supplier-risk" component={SupplierRiskDashboard} />
        <Route path="/formulations" component={Formulations} />
      <Route path="/formulations/:id" component={FormulationEditor} />
      <Route path="/predictions" component={Predictions} />
      <Route path="/test-conditions" component={TestConditions} />
      <Route path="/trials" component={Trials} />
        <Route path="/doe" component={DOE} />
        <Route path="/search" component={Search} />
      <Route path="/debate" component={Debate} />
        <Route path="/reverse-engineering" component={ReverseEngineering} />
        <Route path="/patents" component={PatentAnalyzer} />
          <Route path="/equipment" component={Equipment} />
          <Route path="/scale-up" component={ScaleUpAnalyzer} />
          <Route path="/issues" component={IssueTracking} />
          <Route path="/manufacturing-docs" component={ManufacturingDocs} />
        <Route path="/approvals" component={Approvals} />
        <Route path="/compliance-templates" component={ComplianceTemplates} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/documents" component={Documents} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
