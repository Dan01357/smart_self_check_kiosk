import { useEffect, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import animationData from "../../assets/QR Code Scanner.json";
import Swal from 'sweetalert2';
import { useKiosk } from '../../context/KioskContext';
import { useLocation, useNavigate } from 'react-router';
import { translations } from '../../utils/translations';
import axios from 'axios';

/**
 * SimpleScanner Component
 * Handles hardware barcode/QR scanner input via global keyboard event listeners.
 * Processes scanning logic for Login, Checkout, and Check-in paths.
 */
function SimpleScanner() {
  // scanBuffer stores incoming keystrokes from the hardware scanner (which acts as a keyboard)
  const scanBuffer = useRef("");
  const {
    setPatronId, setShowScanner, patronId,
    setDisplayCheckouts, setDisplayCheckins, displayCheckouts, setPatronName,
    displayCheckins, handleLoginSuccess, API_BASE, language,setDisplayHolds
  } = useKiosk();

  const navigate = useNavigate();
  const location = useLocation();
  const currentLocation = location.pathname;

  // Translation helper based on the current kiosk language
  const t: any = (translations as any)[language] || translations.EN;

  // --- Logic Handlers ---

  /**
   * handleLogin:
   * Validates a scanned patron card number against the Koha database via the backend API.
   */
 const handleLogin = async (cardNumber: string) => {
  // Show loading while verifying patron identity
  Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    // Authenticate with the scanned card number
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      cardnumber: String(cardNumber)
    });

    if (response.data.success === "true") {
      // Set patron info in global context on success
      setPatronId(response.data.patron_id);
      setPatronName(response.data.patron_name);
      handleLoginSuccess();
      setShowScanner(false);
      
      Swal.fire({ 
        title: t.login_success_title, 
        icon: 'success', 
        timer: 1500, 
        showConfirmButton: false 
      });
      
      // Redirect to the checkout page
      navigate("/checkout", { replace: true, state: location.state });
    }
  } catch (error: any) {
    // Show error if card is invalid or patron not found
    Swal.fire({ 
      title: t.login_invalid_title, 
      text: `${t.card_label || "Card"} ${cardNumber} ${t.not_found}`, 
      icon: 'error' 
    });
  }
};

  /**
   * handleCheckoutLogic:
   * Validates a scanned book barcode for borrowing.
   * Checks for local duplicates, remote checkout status, and existing holds.
   */
  const handleCheckoutLogic = useCallback(async (barcodeValue: string) => {
    // 1. Local Duplicate Check: Ensure the book isn't already in the current scanning session list
    if (displayCheckouts.some((i: any) => i.externalId === barcodeValue)) {
      return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
    }

    Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 2. LIVE Check: Check if the book is already checked out to someone else in Koha
      const checkInCheckout = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
      if (checkInCheckout.data.checkoutRes.length > 0) {
        const c = checkInCheckout.data.checkoutRes[0];
        if (String(c.patron_id) === String(patronId)) {
          return Swal.fire({ title: "Error", text: "A book is already in your checkout list", icon: 'warning' });
        } else {
          return Swal.fire({ title: "Error", text: "A book is already checked out by someone else", icon: 'warning' });
        }
      }

      // 3. LIVE Check: Check if the book is reserved (held) for a different patron
      const checkInHolds = await axios.get(`${API_BASE}/api/check-book-inholds/${barcodeValue}`);
      if (checkInHolds.data.holdRes.length > 0) {
        const activeHolds = checkInHolds.data.holdRes.sort((a: any, b: any) => a.priority - b.priority);
        // If someone else is first in the queue, this patron cannot borrow it
        if (String(activeHolds[0].patron_id) !== String(patronId)) {
          return Swal.fire({ title: "Error", text: "A book is already reserved by someone else", icon: 'warning' });
        }
      }

      // 4. Fetch Details: Get title and ID for display in the scan list UI
      const response = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);
      const bookData = response.data;

      // Calculate estimated due date (Default 14 days)
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + 14);
      const formattedEstDue = estDate.toLocaleDateString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric'
      });

      const newSessionItem = {
        item_id: bookData.item_id,
        title: bookData.title,
        externalId: barcodeValue,
        dueDate: formattedEstDue,
        checkoutDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      };

      // Add to checkout list state
      setDisplayCheckouts((prev: any) => [newSessionItem, ...prev]);
      Swal.close();

      Swal.fire({
        title: t.scanned_swal,
        text: `${newSessionItem.title} ${t.added_msg}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error: any) {
      console.error("Scan Error:", error);
      Swal.fire({ title: t.not_found, text: t.barcode_error, icon: 'warning' });
    }
  }, [displayCheckouts, patronId, API_BASE, t, setDisplayCheckouts]);

  /**
   * handleCheckinLogic:
   * Validates a scanned book barcode for returning.
   * Checks if it's currently borrowed and detects if it satisfies a reservation (hold).
   */
  const handleCheckinLogic = useCallback(async (barcodeValue: string) => {
    // Local duplicate check for current return session
    if (displayCheckins.some((i: any) => i.barcode === barcodeValue)) {
      return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
    }

    Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 1. Fetch live checkout info to ensure the book is actually borrowed
      const checkRes = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
      const checkoutData = checkRes.data.checkoutRes[0];

      if (!checkoutData) {
        return Swal.fire({ title: t.not_found, text: t.not_in_list, icon: 'error' });
      }

      // 2. Fetch hold info: See if another patron is waiting for this book
      const holdRes = await axios.get(`${API_BASE}/api/check-book-inholds/${barcodeValue}`);
      const hasHold = holdRes.data.holdRes.length > 0;

      // 3. Fetch Biblio info for UI title display
      const bookDetails = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);

      // Check if the book return is overdue
      const isActuallyOverdue = new Date(checkoutData.due_date) < new Date();

      const newReturn = {
        biblioId: bookDetails.data.biblio_id,
        title: bookDetails.data.title,
        barcode: barcodeValue,
        isOverdue: isActuallyOverdue,
        dueDate: checkoutData.due_date,
        isOnHold: hasHold // Flag to trigger routing to hold shelf after check-in
      };

      // 4. Update Global Holds state: Tracks which holds are satisfied during this return session
      if (hasHold) {
        setDisplayHolds((prev: any) => [...holdRes.data.holdRes, ...prev]);
      }

      setDisplayCheckins((prev: any) => [newReturn, ...prev]);
      Swal.close();
      
    } catch (error) {
      Swal.fire({ title: t.not_found, text: t.barcode_error, icon: 'warning' });
    }
}, [displayCheckins, API_BASE, t, setDisplayCheckins, setDisplayHolds]);

  // --- Hardware Event Listener ---
  /**
   * Monitors keyboard events globally. 
   * Hardware HID scanners transmit barcodes as a rapid sequence of keys followed by 'Enter'.
   */
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Process the accumulated buffer once 'Enter' is received
        if (scanBuffer.current.trim().length > 0) {
          const code = scanBuffer.current.trim();
          if (currentLocation === '/') handleLogin(code);
          else if (currentLocation === '/checkout') handleCheckoutLogic(code);
          else if (currentLocation === '/checkin') handleCheckinLogic(code);
          scanBuffer.current = ""; // Reset buffer after processing
        }
      } else if (e.key.length === 1) {
        // Build the barcode string character by character
        scanBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLocation, handleCheckoutLogic, handleCheckinLogic]);

  // Render Logic Scanner Overlay only on the landing/login page
  if (currentLocation === '/') {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-[15px]">
        <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[100px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-full max-w-[900px] shadow-2xl" onClick={() => setShowScanner(false)}>
          <div className='text-[120px] animate-float relative z-[1]'>
            <div className='max-w-60 bg-white rounded-[30px]'>
              <Lottie animationData={animationData} loop={true} />
            </div>
          </div>
          <div className='font-bold text-[36px] text-white mt-4'>{t.scanning_for_id}</div>
          <div className='text-[26px] text-white text-center mt-2'>{t.place_id_flat}</div>
        </div>
      </div>
    );
  }
  return null;
}

export default SimpleScanner;