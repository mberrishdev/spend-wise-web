import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import React from "react";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Landing from "./pages/Landing";
import DashboardLayout from "./pages/Index";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { DailyLog } from "@/components/DailyLog";
import { Summary } from "@/components/Summary";
import { Settings } from "@/components/Settings";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";

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
  if (user) return <Navigate to="/dashboard" state={{ from: location }} replace />;
  return <>{children}</>;
}

const Login = React.lazy(() => import("./pages/Login"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <React.Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={
                  <RedirectIfAuth>
                    <Login />
                  </RedirectIfAuth>
                } />
                <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                  <Route path="budget" element={<BudgetPlanner />} />
                  <Route path="log" element={<DailyLog />} />
                  <Route path="summary" element={<Summary />} />
                  <Route path="settings" element={<Settings />} />
                  <Route index element={<Navigate to="log" replace />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </CurrencyProvider>
      </AuthProvider>
    </TooltipProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
