import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Generator from "./pages/Generator";
import Converter from "./pages/Converter";
import Templates from "./pages/Templates";
import Debugger from "./pages/Debugger";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Monitoring from "./pages/Monitoring";
import WorkflowAnalytics from "./pages/WorkflowAnalytics";
import Docs from "./pages/Docs";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import BatchGenerator from "./pages/BatchGenerator";
import AgencyDashboard from "./pages/AgencyDashboard";
import EnterpriseBuilder from "./pages/EnterpriseBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // For now, we'll use the current domain for both marketing and app
  // In production, we'll split this based on subdomain (streamsuite.io vs app.streamsuite.io)
  // See DEPLOYMENT.md for full subdomain setup instructions

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <GenerationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                {/* Marketing Pages (streamsuite.io) */}
                <Route path="/landing" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Agency Dashboard (agency.streamsuite.io - for now on same domain) */}
                <Route path="/agency" element={
                  <ProtectedRoute>
                    <AgencyDashboard />
                  </ProtectedRoute>
                } />

                {/* App Pages (app.streamsuite.io - for now on same domain) */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<Generator />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="converter" element={<Converter />} />
                  <Route path="debugger" element={<Debugger />} />
                  <Route path="batch" element={<BatchGenerator />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="monitoring/:connectionId" element={<WorkflowAnalytics />} />
                  <Route path="enterprise-builder" element={<EnterpriseBuilder />} />
                  <Route path="history" element={<History />} />
                  <Route path="docs" element={<Docs />} />
                  <Route path="settings" element={<Settings />} />

                  {/* Admin Panel (employee.streamsuite.io - for now on same domain) */}
                  <Route path="admin" element={<Admin />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </GenerationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
