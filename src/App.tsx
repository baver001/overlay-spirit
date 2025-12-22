import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TermsPage from "./pages/TermsPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundsPage from "./pages/RefundsPage";
import Index from "./pages/Index";
import { AdminRoutes } from "./pages/admin";
import { AccountRoutes } from "./pages/account";
import { Helmet } from "react-helmet";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Создаем QueryClient с оптимизированными настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
    },
  },
});

const DomainHandler: React.FC = () => {
  const { user, loading } = useAuth();
  const hostname = window.location.hostname;
  const isAppDomain = hostname === 'app.loverlay.com';
  const isMainDomain = hostname === 'loverlay.com';
  
  // Handling "guest" access via query param ?guest=true to allow "Try without registration"
  const searchParams = new URLSearchParams(window.location.search);
  const isGuest = searchParams.get('guest') === 'true';
  
  // Защита от бесконечного редиректа - проверяем флаг "redirected"
  const wasRedirected = searchParams.get('r') === '1';

  useEffect(() => {
    if (loading) return;
    
    // Не редиректим, если уже был редирект (защита от циклов)
    if (wasRedirected) return;

    if (isAppDomain) {
        if (!user && !isGuest) {
            // Redirect to landing if not logged in and not guest
            window.location.href = 'https://loverlay.com?r=1';
        }
    } else if (isMainDomain) {
        if (user) {
            // Redirect to editor if logged in
            window.location.href = 'https://app.loverlay.com?r=1';
        }
    }
  }, [user, loading, isAppDomain, isMainDomain, isGuest, wasRedirected]);

  if (loading) {
     return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Loading...</div>;
  }

  // App Domain Logic
  if (isAppDomain) {
      // Если нет пользователя и не гость - но уже был редирект, показываем редактор в guest режиме
      if (!user && !isGuest && !wasRedirected) return null; // Redirecting
      return (
        <Routes>
           <Route path="/" element={<Index />} />
           <Route path="/editor" element={<Index />} />
           <Route path="/account/*" element={<AccountRoutes />} />
           <Route path="/admin/*" element={<AdminRoutes />} />
           <Route path="*" element={<Index />} /> 
        </Routes>
      );
  }
  
  // Main Domain Logic
  if (isMainDomain) {
      // Если есть пользователь - но уже был редирект, показываем лендинг
      if (user && !wasRedirected) return null; // Redirecting
      return (
        <Routes>
           <Route path="/" element={<LandingPage />} />
           <Route path="/terms" element={<TermsPage />} />
           <Route path="/privacy" element={<PrivacyPage />} />
           <Route path="/refunds" element={<RefundsPage />} />
           <Route path="/pricing" element={<PricingPage />} />
           <Route path="*" element={<LandingPage />} /> 
        </Routes>
      );
  }

  // Dev / Fallback Logic
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/editor" element={<Index />} />
        <Route path="/account/*" element={<AccountRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
  );
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Helmet>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
      </Helmet>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
            <BrowserRouter>
                <DomainHandler />
            </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
