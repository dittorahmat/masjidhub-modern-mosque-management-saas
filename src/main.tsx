import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css';
// Core Pages
import { LandingPage } from '@/pages/LandingPage';
import { RegisterMosquePage } from '@/pages/auth/RegisterMosquePage';
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout';
import { OverviewPage } from '@/pages/dashboard/OverviewPage';
import PublicPortalPage from '@/pages/PublicPortalPage';
// UI
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
// Lazy Components
const FinancePage = lazy(() => import('@/pages/dashboard/FinancePage'));
const InventoryPage = lazy(() => import('@/pages/dashboard/InventoryPage'));
const EventsPage = lazy(() => import('@/pages/dashboard/EventsPage'));
const MembersPage = lazy(() => import('@/pages/dashboard/MembersPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
// Super Admin
const SuperAdminLayout = lazy(() => import('@/pages/super-admin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const SuperTenantsPage = lazy(() => import('@/pages/super-admin/SuperTenantsPage'));
const SuperUsersPage = lazy(() => import('@/pages/super-admin/SuperUsersPage'));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-4">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-64 w-full max-w-4xl" />
      <p className="text-sm text-muted-foreground animate-pulse text-center">Memuat...</p>
    </div>
  );
}
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/register",
    element: <RegisterMosquePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/portal/:slug",
    element: <PublicPortalPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/super-admin",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <SuperAdminLayout />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "dashboard", element: <SuperAdminDashboard /> },
      { path: "tenants", element: <SuperTenantsPage /> },
      { path: "users", element: <SuperUsersPage /> },
    ]
  },
  {
    path: "/app/:slug",
    element: <DashboardLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "dashboard",
        element: <OverviewPage />,
      },
      {
        path: "finance",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <FinancePage />
          </Suspense>
        ),
      },
      {
        path: "inventory",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <InventoryPage />
          </Suspense>
        ),
      },
      {
        path: "events",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EventsPage />
          </Suspense>
        ),
      },
      {
        path: "members",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MembersPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      }
    ]
  }
]);
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>
  );
}