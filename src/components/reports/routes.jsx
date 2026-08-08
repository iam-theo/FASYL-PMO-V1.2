import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { REPORTS_ROUTE_SEGMENTS } from './constants/routes.constants';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { DetailSkeleton, FormSkeleton, TableSkeleton } from './components/ui/Skeleton';

/**
 * The module's routes, mounted by the host app under its own layout:
 *
 *   <Route path="/reports/*" element={<ReportsRoutes />} />
 *
 * Element-based rather than a route-object array, so the module works whether
 * the host uses `createBrowserRouter` or a plain `<BrowserRouter>` — the host
 * chooses its router, the module supplies a subtree.
 *
 * CODE SPLITTING: each page is its own chunk. Someone who only ever reads
 * reports never downloads the form, and the form pulls in React Hook Form and
 * the Zod schema — the heaviest dependencies in the module.
 *
 * Each fallback is the skeleton of the page being loaded, not a generic
 * spinner, so the chunk arriving does not reshuffle the layout.
 *
 * Toast and error boundaries are wired here rather than left to the host: they
 * are part of the module's contract, and a host that forgot them would get a
 * crash inside `useToast` instead of a working page.
 */

const ReportsListPage = lazy(() =>
  import('./pages/ReportsListPage').then((module) => ({ default: module.ReportsListPage })),
);
const CreateReportPage = lazy(() =>
  import('./pages/CreateReportPage').then((module) => ({ default: module.CreateReportPage })),
);
const ReportDetailsPage = lazy(() =>
  import('./pages/ReportDetailsPage').then((module) => ({ default: module.ReportDetailsPage })),
);
const EditReportPage = lazy(() =>
  import('./pages/EditReportPage').then((module) => ({ default: module.EditReportPage })),
);

const RouteFallback = ({ children }) => (
  <div className="flex flex-col gap-5" role="status" aria-label="Loading page">
    {children}
  </div>
);

export const ReportsRoutes = () => (
  <ToastProvider>
    <ErrorBoundary>
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<RouteFallback><TableSkeleton rows={8} /></RouteFallback>}>
              <ReportsListPage />
            </Suspense>
          }
        />
        <Route
          path={REPORTS_ROUTE_SEGMENTS.create}
          element={
            <Suspense fallback={<RouteFallback><FormSkeleton fields={8} /></RouteFallback>}>
              <CreateReportPage />
            </Suspense>
          }
        />
        <Route
          path={REPORTS_ROUTE_SEGMENTS.details}
          element={
            <Suspense fallback={<RouteFallback><DetailSkeleton /></RouteFallback>}>
              <ReportDetailsPage />
            </Suspense>
          }
        />
        <Route
          path={REPORTS_ROUTE_SEGMENTS.edit}
          element={
            <Suspense fallback={<RouteFallback><FormSkeleton fields={8} /></RouteFallback>}>
              <EditReportPage />
            </Suspense>
          }
        />
        {/* Anything else under /reports is a typo, not a 404 worth a page. */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ErrorBoundary>
  </ToastProvider>
);

export default ReportsRoutes;
