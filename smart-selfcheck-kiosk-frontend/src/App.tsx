import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CheckinPage from "./pages/CheckinPage";
import CheckoutPage from "./pages/CheckoutPage";
import SuccessPage from "./pages/SuccessPage";
import AccountPage from "./pages/AccountPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import KeyboardPad from "./components/common/KeyboardPad";
import MyQRCode from "./pages/Qr";
import RenewItemsPage from "./pages/RenewItemsPage";
import PublicRoute from "./components/auth/PublicRoute";
import HoldsPage from "./pages/HoldsPage";
import HoldDetectedPage from "./pages/HoldDetectedPage";
// import Try from "./Try";

function App() {
  return (
    <>
      <Routes>
        {/* Guest only routes (Redirect to /home if already logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/qr" element={<MyQRCode />} />
        </Route>
        {/* Protected Routes (Wrapper) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/hold" element={<HoldsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/renew" element={<RenewItemsPage />} />
          <Route path="/onholddetected" element={<HoldDetectedPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 
         This is now global. 
         It has no props because it reads 'isKeyboardOpen' from Context.
      */}
      <KeyboardPad />
    </>
  );
}

export default App;