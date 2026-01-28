import { lazy, Suspense } from "react"; // Importing lazy for code-splitting and Suspense to handle loading states
import { Route, Routes } from "react-router-dom";

// 1. Regular Imports: These components are loaded immediately because they handle 
// core logic (Auth guards) or are small enough to be included in the main bundle.
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import KeyboardPad from "./components/common/KeyboardPad";

// 2. Lazy Loading: These page components are only downloaded by the browser 
// when the user actually navigates to the specific route. This improves 
// the initial loading speed of the application.
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RenewItemsPage = lazy(() => import("./pages/RenewItemsPage"));
const HoldsPage = lazy(() => import("./pages/HoldsPage"));
const HoldDetectedPage = lazy(() => import("./pages/HoldDetectedPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));

/**
 * PageLoader:
 * A fallback component that displays a "Loading..." message while the lazy-loaded 
 * chunks for the pages are being fetched over the network.
 */
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontWeight: 'bold' }}>
    Loading...
  </div>
);

function App() {
  return (
    <>
      {/* 
          3. Suspense Wrapper:
          All Routes containing lazy-loaded components must be wrapped in <Suspense>. 
          The 'fallback' prop defines what UI is shown while waiting for the code to load.
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 
              Guest only routes:
              PublicRoute prevents logged-in users from accessing the login page.
          */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginPage />} />
          </Route>
          {/* Moved /checkin /success and /onholddetected here so it is accessible without login */}
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/onholddetected" element={<HoldDetectedPage />} />

          {/* 
              Protected Routes:
              ProtectedRoute ensures only authenticated patrons can access 
              kiosk features like checkout, return, and account management.
          */}

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            <Route path="/hold" element={<HoldsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/renew" element={<RenewItemsPage />} />
            
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* 404 - Catch-all route for any undefined URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* 
          Global Keyboard:
          Placed outside the Routes so it can be triggered from any page 
          in the application for data entry via the touch interface.
      */}
      <KeyboardPad />
    </>
  );
}

export default App;