import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import Swal from 'sweetalert2';
import { useEffect } from "react";
import { translations } from "../../utils/translations";

const ProtectedRoute = () => {
  const { authorized, patronId, language } = useKiosk();
  const location = useLocation();

  const t: any = (translations as any)[language] || translations.EN;

  useEffect(() => {
    if (!authorized || !patronId) {
      Swal.fire({
        title: t.login_required || 'Login required!',
        text: t.login_first_msg || `Please login first to proceed`,
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, [authorized, patronId, t]);

  if (!authorized || !patronId) {
    // Redirect to login, but save the current location so we can go back
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Outlet tells React Router where to render the child routes (HomePage, etc.)
  return <Outlet />;
};

export default ProtectedRoute;