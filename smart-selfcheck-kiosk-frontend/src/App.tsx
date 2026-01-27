import { lazy, Suspense } from "react"; // Added lazy and Suspense
import { Route, Routes } from "react-router-dom";

// 1. Keep non-page components as regular imports (they are small and needed for logic)
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import KeyboardPad from "./components/common/KeyboardPad";

// 2. Lazy load all Page components
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyQRCode = lazy(() => import("./pages/Qr"));
const RenewItemsPage = lazy(() => import("./pages/RenewItemsPage"));
const HoldsPage = lazy(() => import("./pages/HoldsPage"));
const HoldDetectedPage = lazy(() => import("./pages/HoldDetectedPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

// Optional: A simple loading component to show during the split-second transition
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontWeight: 'bold' }}>
    Loading...
  </div>
);

function App() {
  return (
    <>
      {/* 3. Wrap Routes in Suspense to handle the loading state of lazy components */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Guest only routes */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/qr" element={<MyQRCode />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/hold" element={<HoldsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/renew" element={<RenewItemsPage />} />
            <Route path="/onholddetected" element={<HoldDetectedPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Global Keyboard */}
      <KeyboardPad />
    </>
  );
}

export default App;