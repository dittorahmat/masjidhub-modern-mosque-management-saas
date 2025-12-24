import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
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
// Lazy load operational modules
const FinancePage = lazy(() => import('@/pages/dashboard/FinancePage'));
const InventoryPage = lazy(() => import('@/pages/dashboard/InventoryPage'));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
const LoadingFallback = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-12 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
);
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
      }
    ]
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)