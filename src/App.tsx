import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { AuthProvider } from '@/providers/AuthProvider';
import Index from '@/pages/Index';
import EditorPage from '@/pages/Editor';
import AccountPage from '@/pages/Account';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminCategories from '@/pages/admin/Categories';
import AdminSets from '@/pages/admin/Sets';
import AdminOverlays from '@/pages/admin/Overlays';
import AdminStats from '@/pages/admin/Stats';
import ShareView from '@/pages/ShareView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="editor" element={<EditorPage />} />
                <Route path="share/:shareId" element={<ShareView />} />
                <Route element={<ProtectedRoute role="customer" />}>
                  <Route path="account" element={<AccountPage />} />
                </Route>
                <Route element={<ProtectedRoute role="admin" allowAdminFallback={false} />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="sets" element={<AdminSets />} />
                    <Route path="overlays" element={<AdminOverlays />} />
                    <Route path="stats" element={<AdminStats />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
