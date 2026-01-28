import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import Swal from 'sweetalert2';
import { useEffect } from "react";

const ProtectedRoute = () => {
  const { authorized, patronId } = useKiosk();
  const location = useLocation();

  useEffect(() => {
    if (!authorized || !patronId) {
      Swal.fire({
        title: 'Login required!',
        text: `Please login first to proceed`,
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, [authorized, patronId]);

  if (!authorized || !patronId)  {
    // Redirect to login, but save the current location so we can go back
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Outlet tells React Router where to render the child routes (HomePage, etc.)
  return <Outlet />;
};

export default ProtectedRoute;