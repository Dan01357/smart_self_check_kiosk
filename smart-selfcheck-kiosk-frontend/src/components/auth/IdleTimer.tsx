import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";

const IDLE_TIMEOUT = 60000; // 60 seconds

const IdleTimer = () => {
  const { logout, authorized } = useKiosk();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogout = useCallback(() => {
    if (authorized) {
      console.log("Session timed out due to inactivity.");
      logout(); // Clear context state
      navigate("/"); // Redirect to login
    }
  }, [authorized, logout, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Only start the timer if the user is NOT on the login page
    if (location.pathname !== "/") {
      timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
    }
  }, [handleLogout, location.pathname]);

  useEffect(() => {
    // List of events that count as "activity"
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup logic
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return null; // This component doesn't render anything UI-wise
};

export default IdleTimer;