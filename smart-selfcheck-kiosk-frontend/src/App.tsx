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

function App() {
  return (
    <>
      <Routes>
        {/* Public Route */}
         {/* <Route path="/checkin" element={<CheckinComponent />} /> */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/qr" element={<MyQRCode />}/>
        {/* Protected Routes (Wrapper) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/account" element={<AccountPage />} />
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