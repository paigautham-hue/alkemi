import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Suppliers from "./pages/Suppliers";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/materials" component={Materials} />
      <Route path="/suppliers" component={Suppliers} />
        <Route path="/formulations" component={Formulations} />
      <Route path="/formulations/:id" component={FormulationEditor} />
      <Route path="/predictions" component={Predictions} />
      <Route path="/test-conditions" component={TestConditions} />
      <Route path="/trials" component={Trials} />
      <Route path="/doe" component={DOE} />
      <Route path="/debate" component={Debate} />
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
