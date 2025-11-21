import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import BatchGenerator from "./pages/BatchGenerator";
import AgencyDashboard from "./pages/AgencyDashboard";
import ClientProfile from "./pages/ClientProfile";
import ClientWorkflows from "./pages/ClientWorkflows";
import APIDocs from "./pages/APIDocs";
import AgencyDocs from "./pages/AgencyDocs";
import EnterpriseBuilder from "./pages/EnterpriseBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetching when user switches browser tabs
      refetchOnWindowFocus: false,
      // Prevent refetching when network reconnects
      refetchOnReconnect: false,
      // Keep data fresh for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
    },
  },
});

/**
 * Determine which domain we're on
 * Returns 'marketing' | 'app' | 'agency'
 */
function getCurrentDomain(): 'marketing' | 'app' | 'agency' {
  const hostname = window.location.hostname;

  // Development: localhost - determine by path
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const path = window.location.pathname;
    if (path.startsWith('/agency')) return 'agency';
    if (path.startsWith('/app')) return 'app';
    return 'marketing';
  }

  // Production: determine by hostname
  if (hostname.includes('app.')) return 'app';
  if (hostname.includes('agency.')) return 'agency';
  return 'marketing'; // streamsuite.io or www.streamsuite.io
}

const App = () => {
  const currentDomain = getCurrentDomain();

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
                {/* Marketing Domain Routes (streamsuite.io) */}
                {currentDomain === 'marketing' && (
                  <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="*" element={<NotFound />} />
                  </>
                )}

                {/* App Domain Routes (app.streamsuite.io) */}
                {currentDomain === 'app' && (
                  <>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* App Pages (logged-in users) */}
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
                      <Route path="admin" element={<Admin />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </>
                )}

                {/* Agency Domain Routes (agency.streamsuite.io) */}
                {currentDomain === 'agency' && (
                  <>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Agency Dashboard */}
                    <Route path="/agency" element={
                      <ProtectedRoute>
                        <AgencyDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/client/:clientId" element={
                      <ProtectedRoute>
                        <ClientProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/client/:clientId/workflows" element={
                      <ProtectedRoute>
                        <ClientWorkflows />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/api-docs" element={
                      <ProtectedRoute>
                        <APIDocs />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/docs" element={
                      <ProtectedRoute>
                        <AgencyDocs />
                      </ProtectedRoute>
                    } />

                    {/* Agency-specific workflow tools */}
                    <Route path="/agency/generator" element={
                      <ProtectedRoute agencyOnly>
                        <Generator />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/debugger" element={
                      <ProtectedRoute agencyOnly>
                        <Debugger />
                      </ProtectedRoute>
                    } />
                    <Route path="/agency/batch" element={
                      <ProtectedRoute agencyOnly>
                        <BatchGenerator />
                      </ProtectedRoute>
                    } />

                    <Route path="*" element={<NotFound />} />
                  </>
                )}
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
