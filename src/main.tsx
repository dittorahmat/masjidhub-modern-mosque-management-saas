import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { LandingPage } from '@/pages/LandingPage';
import { RegisterMosquePage } from '@/pages/auth/RegisterMosquePage';
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout';
import { OverviewPage } from '@/pages/dashboard/OverviewPage';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import PublicPortalPage from '@/pages/PublicPortalPage';
// Lazy load operational modules
const FinancePage = lazy(() => import('@/pages/dashboard/FinancePage'));
const InventoryPage = lazy(() => import('@/pages/dashboard/InventoryPage'));
const EventsPage = lazy(() => import('@/pages/dashboard/EventsPage'));
const MembersPage = lazy(() => import('@/pages/dashboard/MembersPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
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
    <div className="p-8 space-y-4">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-64 w-full" />
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
export function AppRoot() {
  return (
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
// Singleton Root Pattern to prevent HMR warnings and multiple initializations
const container = document.getElementById('root');
if (container) {
  const globalRoot = window as any;
  if (!globalRoot.__reactRoot) {
    globalRoot.__reactRoot = createRoot(container);
  }
  (globalRoot.__reactRoot as Root).render(<AppRoot />);
}