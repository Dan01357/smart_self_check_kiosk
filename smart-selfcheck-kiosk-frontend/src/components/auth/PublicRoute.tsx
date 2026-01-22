import { Navigate, Outlet } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext"; // Adjust path as needed

const PublicRoute = () => {
  const { authorized } = useKiosk();

  // If the user is already authorized, send them to the home page
  // instead of showing the login page
  if (authorized) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;