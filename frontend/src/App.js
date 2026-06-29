import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { setGetToken } from "./lib/api";
import Layout from "./components/layout/Layout";

// ── Lazy-loaded pages (split each page into its own chunk) ─────────────────
const AuthPage             = lazy(() => import("./pages/AuthPage"));
const DashboardPage        = lazy(() => import("./pages/DashboardPage"));
const ReportsPage          = lazy(() => import("./pages/ReportsPage"));
const AddReportPage        = lazy(() => import("./pages/AddReportPage"));
const ReportDetailPage     = lazy(() => import("./pages/ReportDetailPage"));
const VitalsPage           = lazy(() => import("./pages/VitalsPage"));
const VitalDetailPage      = lazy(() => import("./pages/VitalDetailPage"));
const HospitalPage         = lazy(() => import("./pages/HospitalPage"));
const EmergencyPage        = lazy(() => import("./pages/EmergencyPage"));
const ProfilePage          = lazy(() => import("./pages/ProfilePage"));
const HospitalManagementPage = lazy(() => import("./pages/admin/HospitalManagementPage"));
const EmergencyManagementPage= lazy(() => import("./pages/admin/EmergencyManagementPage"));
const SettingsPage         = lazy(() => import("./pages/admin/SettingsPage"));
const NotFoundPage         = lazy(() => import("./pages/NotFoundPage"));

// ── Auth guards ────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <FullLoader />;
  return isSignedIn ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <FullLoader />;
  return !isSignedIn ? children : <Navigate to="/dashboard" replace />;
}

// ── Token sync ─────────────────────────────────────────────────────────────
function TokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setGetToken(getToken);
    const sync = async () => { window.__clerkToken = await getToken(); };
    sync();
    const id = setInterval(sync, 55000);
    return () => clearInterval(id);
  }, [getToken]);
  return null;
}

// ── Full-screen loader (shown while auth loads or lazy chunks load) ─────────
function FullLoader() {
  return (
    <div className="fixed inset-0 grad-hero flex flex-col items-center justify-center z-50">
      <div className="font-display font-black text-4xl text-white mb-6 tracking-tight">
        Health<span className="text-teal-100">Mate</span>
      </div>
      <div className="flex gap-2">
        <span className="ai-dot" />
        <span className="ai-dot" />
        <span className="ai-dot" />
      </div>
      <p className="text-white/60 text-sm mt-4">Sehat ka Smart Dost</p>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const { isSignedIn } = useAuth();
  return (
    <>
      {isSignedIn && <TokenSync />}
      <Suspense fallback={<FullLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard"         element={<DashboardPage />} />
            <Route path="/reports"           element={<ReportsPage />} />
            <Route path="/reports/add"       element={<AddReportPage />} />
            <Route path="/reports/:id"       element={<ReportDetailPage />} />
            <Route path="/vitals"            element={<VitalsPage />} />
            <Route path="/vitals/:id"        element={<VitalDetailPage />} />
            <Route path="/hospitals"         element={<HospitalPage />} />
            <Route path="/admin/hospitals"   element={<HospitalManagementPage />} />
            <Route path="/admin/emergency"   element={<EmergencyManagementPage />} />
            <Route path="/admin/settings"    element={<SettingsPage />} />
            <Route path="/emergency"         element={<EmergencyPage />} />
            <Route path="/profile"           element={<ProfilePage />} />
            <Route path="/404"               element={<NotFoundPage />} />
            <Route path="*"                  element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
