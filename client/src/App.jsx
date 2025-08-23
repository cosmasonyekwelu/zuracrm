// src/App.jsx
import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { OnboardingProvider } from "./context/OnboardingContext.jsx";

// Eager pages
import Landing from "./pages/Landing.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";

// Lazy pages
const SearchPage        = lazy(() => import("./pages/SearchPage.jsx"));
const Leads             = lazy(() => import("./pages/Leads.jsx"));
const Contacts          = lazy(() => import("./pages/Contacts.jsx"));
const Deals             = lazy(() => import("./pages/Deals.jsx"));
const Activities        = lazy(() => import("./pages/Activities.jsx"));
const Tasks             = lazy(() => import("./pages/Tasks.jsx"));
const Meetings          = lazy(() => import("./pages/Meetings.jsx"));
const Calls             = lazy(() => import("./pages/Calls.jsx"));
const Products          = lazy(() => import("./pages/Products.jsx"));
const Quotes            = lazy(() => import("./pages/Quotes.jsx"));
const SalesOrder        = lazy(() => import("./pages/SalesOrder.jsx"));
const Invoice           = lazy(() => import("./pages/Invoice.jsx"));
const Forecasts         = lazy(() => import("./pages/Forecasts.jsx"));
const Campaigns         = lazy(() => import("./pages/Campaigns.jsx"));
const Documents         = lazy(() => import("./pages/Documents.jsx"));
const InviteTeam        = lazy(() => import("./pages/setup/InviteTeam.jsx"));
const ConfigurePipeline = lazy(() => import("./pages/setup/ConfigurePipeline.jsx"));
const ConnectEmail      = lazy(() => import("./pages/setup/ConnectEmail.jsx"));
const MigrateData       = lazy(() => import("./pages/setup/MigrateData.jsx"));
const Integrations      = lazy(() => import("./pages/setup/Integrations.jsx"));

// ✅ Settings pages (point to files that exist)
const PersonalSettings  = lazy(() => import("./pages/settings/PersonalSettings.jsx"));
const Users             = lazy(() => import("./pages/settings/Users.jsx"));
const CompanySettings   = lazy(() => import("./pages/settings/CompanySettings.jsx"));
const CalendarSettings  = lazy(() => import("./pages/settings/CalendarBooking.jsx"));
const SecurityPolicies  = lazy(() => import("./pages/settings/SecurityPolicies.jsx"));
const RolesSharing      = lazy(() => import("./pages/settings/RolesSharing.jsx"));
const AuditLog          = lazy(() => import("./pages/settings/AuditLog.jsx"));
const EmailSettings     = lazy(() => import("./pages/settings/EmailSettings.jsx"));

function FullPageLoader() {
  return <div className="container" style={{ padding: 24 }}>Loading…</div>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PrivateRoute({ children, roles }) {
  const { token, user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!token) return <Navigate to="/signin" replace />;
  if (roles?.length && !roles.includes(user?.role)) return <Navigate to="/home" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return token ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Suspense fallback={<FullPageLoader />}>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/"       element={<PublicOnly><Landing /></PublicOnly>} />
            <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
            <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />

            {/* Authenticated */}
            <Route path="/home"   element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />

            {/* Core CRM */}
            <Route path="/leads"      element={<PrivateRoute><Leads /></PrivateRoute>} />
            <Route path="/contacts"   element={<PrivateRoute><Contacts /></PrivateRoute>} />
            <Route path="/deals"      element={<PrivateRoute><Deals /></PrivateRoute>} />
            <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
            <Route path="/tasks"      element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/meetings"   element={<PrivateRoute><Meetings /></PrivateRoute>} />
            <Route path="/calls"      element={<PrivateRoute><Calls /></PrivateRoute>} />

            {/* Catalog / Sales docs */}
            <Route path="/products"     element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/quotes"       element={<PrivateRoute><Quotes /></PrivateRoute>} />
            <Route path="/sales-orders" element={<PrivateRoute><SalesOrder /></PrivateRoute>} />
            <Route path="/invoices"     element={<PrivateRoute><Invoice /></PrivateRoute>} />

            {/* Optional modules */}
            <Route path="/forecasts" element={<PrivateRoute><Forecasts /></PrivateRoute>} />
            <Route path="/campaigns" element={<PrivateRoute><Campaigns /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />

            {/* Setup */}
            <Route path="/setup/invite"       element={<PrivateRoute><InviteTeam /></PrivateRoute>} />
            <Route path="/setup/pipeline"     element={<PrivateRoute><ConfigurePipeline /></PrivateRoute>} />
            <Route path="/setup/email"        element={<PrivateRoute><ConnectEmail /></PrivateRoute>} />
            <Route path="/setup/import"       element={<PrivateRoute><MigrateData /></PrivateRoute>} />
            <Route path="/setup/integrations" element={<PrivateRoute><Integrations /></PrivateRoute>} />

            {/* Settings */}
            <Route path="/settings"           element={<Navigate to="/settings/personal" replace />} />
            <Route path="/settings/personal"  element={<PrivateRoute><PersonalSettings /></PrivateRoute>} />
            <Route path="/settings/users"     element={<PrivateRoute roles={["admin"]}><Users /></PrivateRoute>} />
            <Route path="/settings/company"   element={<PrivateRoute roles={["admin"]}><CompanySettings /></PrivateRoute>} />
            <Route path="/settings/calendar"  element={<PrivateRoute><CalendarSettings /></PrivateRoute>} />
            <Route path="/settings/security"  element={<PrivateRoute roles={["admin"]}><SecurityPolicies /></PrivateRoute>} />
            <Route path="/settings/roles"     element={<PrivateRoute roles={["admin"]}><RolesSharing /></PrivateRoute>} />
            <Route path="/settings/audit"     element={<PrivateRoute roles={["admin"]}><AuditLog /></PrivateRoute>} />
            <Route path="/settings/email"     element={<PrivateRoute><EmailSettings /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </OnboardingProvider>
    </AuthProvider>
  );
}
