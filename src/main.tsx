import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
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
const queryClient = new QueryClient();
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