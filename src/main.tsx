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
import { GlobalLoading } from '@/components/GlobalLoading';
import '@/index.css';

// UI Components
import { Toaster } from '@/components/ui/sonner';

// --- Lazy Load Pages ---

// Public & Auth
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterMosquePage = lazy(() => import('@/pages/auth/RegisterMosquePage').then(m => ({ default: m.RegisterMosquePage })));
const PublicPortalPage = lazy(() => import('@/pages/PublicPortalPage'));
const KioskPage = lazy(() => import('@/pages/dashboard/KioskPage'));

// Dashboard Core
const DashboardLayout = lazy(() => import('@/pages/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const OverviewPage = lazy(() => import('@/pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage })));

// Smart Masjid Modules (New)
const SharedInboxPage = lazy(() => import('@/pages/dashboard/SharedInboxPage'));
const KnowledgeManagementPage = lazy(() => import('@/pages/dashboard/KnowledgeManagementPage'));
const PageBuilderPage = lazy(() => import('@/pages/dashboard/PageBuilderPage'));
const BlogManagementPage = lazy(() => import('@/pages/dashboard/BlogManagementPage'));
const MediaManagementPage = lazy(() => import('@/pages/dashboard/MediaManagementPage'));

// Existing Management Modules
const FinancePage = lazy(() => import('@/pages/dashboard/FinancePage'));
const ZisPage = lazy(() => import('@/pages/dashboard/ZisPage'));
const ZisReportPage = lazy(() => import('@/pages/dashboard/ZisReportPage'));
const ZisPaymentPage = lazy(() => import('@/pages/dashboard/ZisPaymentPage'));
const ForumPage = lazy(() => import('@/pages/dashboard/ForumPage'));
const InventoryPage = lazy(() => import('@/pages/dashboard/InventoryPage'));
const EventsPage = lazy(() => import('@/pages/dashboard/EventsPage'));
const MembersPage = lazy(() => import('@/pages/dashboard/MembersPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const PrayerSchedulePage = lazy(() => import('@/pages/dashboard/PrayerSchedulePage'));
const NotificationPage = lazy(() => import('@/pages/dashboard/NotificationPage'));
const ChatUstadzPage = lazy(() => import('@/pages/dashboard/ChatUstadzPage'));
const SearchPage = lazy(() => import('@/pages/dashboard/SearchPage'));
const QrCodePage = lazy(() => import('@/pages/dashboard/QrCodePage'));
const OrganizationPage = lazy(() => import('@/pages/dashboard/OrganizationPage'));

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
    element: (<Suspense fallback={<GlobalLoading />}><LandingPage /></Suspense>),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: (<Suspense fallback={<GlobalLoading />}><LoginPage /></Suspense>),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/register",
    element: (<Suspense fallback={<GlobalLoading />}><RegisterMosquePage /></Suspense>),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/portal/:slug",
    element: (<Suspense fallback={<GlobalLoading />}><PublicPortalPage /></Suspense>),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/kiosk/:slug",
    element: (<Suspense fallback={<GlobalLoading />}><KioskPage /></Suspense>),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/super-admin",
    element: (<Suspense fallback={<GlobalLoading />}><SuperAdminLayout /></Suspense>),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "dashboard", element: <SuperAdminDashboard /> },
      { path: "tenants", element: <SuperTenantsPage /> },
      { path: "users", element: <SuperUsersPage /> },
    ]
  },
  {
    path: "/app/:slug",
    element: (<Suspense fallback={<GlobalLoading />}><DashboardLayout /></Suspense>),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "dashboard", element: <OverviewPage /> },
      { path: "inbox", element: <SharedInboxPage /> },
      { path: "knowledge", element: <KnowledgeManagementPage /> },
      { path: "builder", element: <PageBuilderPage /> },
      { path: "blog", element: <BlogManagementPage /> },
      { path: "media", element: <MediaManagementPage /> },
      { path: "finance", element: <FinancePage /> },
      { path: "zis", element: <ZisPage /> },
      { path: "zis/report", element: <ZisReportPage /> },
      { path: "zis/payment", element: <ZisPaymentPage /> },
      { path: "forum", element: <ForumPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "jadwal-sholat", element: <PrayerSchedulePage /> },
      { path: "notifikasi", element: <NotificationPage /> },
      { path: "chat-ustadz", element: <ChatUstadzPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "qr-code", element: <QrCodePage /> },
      { path: "organization", element: <OrganizationPage /> }
    ]
  }
]);

const rootElement = document.getElementById('root');
if (rootElement) {
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
