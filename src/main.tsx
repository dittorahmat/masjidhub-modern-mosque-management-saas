import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, lazy, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { GlobalLoading } from '@/components/GlobalLoading';
import '@/index.css';
// Core Pages
import { LandingPage } from '@/pages/LandingPage';
import { RegisterMosquePage } from '@/pages/auth/RegisterMosquePage';
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout';
import { OverviewPage } from '@/pages/dashboard/OverviewPage';
import PublicPortalPage from '@/pages/PublicPortalPage';
// UI
import { Toaster } from '@/components/ui/sonner';
// Lazy Components
const FinancePage = lazy(() => import('@/pages/dashboard/FinancePage'));
const InventoryPage = lazy(() => import('@/pages/dashboard/InventoryPage'));
const EventsPage = lazy(() => import('@/pages/dashboard/EventsPage'));
const MembersPage = lazy(() => import('@/pages/dashboard/MembersPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ZisPage = lazy(() => import('@/pages/dashboard/ZisPage'));
const ForumPage = lazy(() => import('@/pages/dashboard/ForumPage'));
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
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<GlobalLoading />}>
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
      <Suspense fallback={<GlobalLoading />}>
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
      { path: "dashboard", element: <OverviewPage /> },
      {
        path: "finance",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <FinancePage />
          </Suspense>
        ),
      },
      {
        path: "zis",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <ZisPage />
          </Suspense>
        ),
      },
      {
        path: "forum",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <ForumPage />
          </Suspense>
        ),
      },
      {
        path: "inventory",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <InventoryPage />
          </Suspense>
        ),
      },
      {
        path: "events",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <EventsPage />
          </Suspense>
        ),
      },
      {
        path: "members",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <MembersPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<GlobalLoading />}>
            <SettingsPage />
          </Suspense>
        ),
      }
    ]
  }
]);
const rootElement = document.getElementById('root');
if (rootElement) {
  // Clean up existing root for HMR (React Refresh safe)
  const existingRoot = (rootElement as any)._reactRootContainer?._internalRoot;
  if (existingRoot) {
    existingRoot.unmount();
  }
  
  const root = createRoot(rootElement);
  root.render(
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