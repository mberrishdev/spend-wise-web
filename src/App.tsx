import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import React from "react";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import Landing from "./pages/Landing";
import DashboardLayout from "./pages/Index";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { DailyLog } from "@/components/DailyLog";
import { Analytics } from "@/components/Analytics";
import { Settings } from "@/components/Settings";
import { UncategorizedTransactions } from "@/components/UncategorizedTransactions";
import { Archive } from "@/components/Archive";
import NotFound from "./pages/NotFound";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FinancialAdvisor } from "@/components/FinancialAdvisor";
import { Summary } from "@/components/Summary";
import { BorrowedMoney } from "@/components/BorrowedMoney";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user)
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  return <>{children}</>;
}

const Login = React.lazy(() => import("./pages/Login"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <PrivacyProvider>
              <BrowserRouter>
                <React.Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route
                      path="/login"
                      element={
                        <RedirectIfAuth>
                          <Login />
                        </RedirectIfAuth>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <RequireAuth>
                          <DashboardLayout />
                        </RequireAuth>
                      }
                    >
                      <Route path="budget" element={<BudgetPlanner />} />
                      <Route path="log" element={<DailyLog />} />
                      <Route path="summary" element={<Summary />} />
                      <Route path="settings" element={<Settings />} />
                      <Route
                        path="uncategorized-transactions"
                        element={<UncategorizedTransactions />}
                      />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="advisor" element={<FinancialAdvisor />} />
                      <Route path="archive" element={<Archive />} />
                      <Route path="borrowed-money" element={<BorrowedMoney />} />
                      <Route index element={<Navigate to="log" replace />} />
                    </Route>
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
            </PrivacyProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
    {import.meta.env.DEV ? null : <VercelAnalytics />}
  </QueryClientProvider>
);

export default App;
