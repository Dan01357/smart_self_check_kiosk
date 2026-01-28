import { useEffect, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import animationData from "../../assets/QR Code Scanner.json";
import Swal from 'sweetalert2';
import { useKiosk } from '../../context/KioskContext';
import { postDataLogin } from '../../../app';
import { useLocation, useNavigate } from 'react-router';
import { translations } from '../../utils/translations';
import axios from 'axios';

function SimpleScanner() {
  const scanBuffer = useRef("");
  const {
    setPatronId, setShowScanner, patronId,
    setDisplayCheckouts, setDisplayCheckins, displayCheckouts, setPatronName, 
    displayCheckins, handleLoginSuccess, API_BASE, language 
  } = useKiosk();

  const navigate = useNavigate();
  const location = useLocation();
  const currentLocation = location.pathname;

  const t: any = (translations as any)[language] || translations.EN;

  // --- Logic Handlers ---
  const handleLogin = async (cardNumber: string) => {
    try {
      const response = await postDataLogin(String(cardNumber));
      if (response.success === "true") {
        setPatronId(response.patron_id);
        setPatronName(response.patron_name)
        handleLoginSuccess()
        Swal.fire({ title: t.login_success_title, text: t.login_success_text, icon: 'success', timer: 1500, showConfirmButton: false });
        navigate("/checkout", { replace: true, state: location.state });
      } else {
        Swal.fire({ title: t.login_invalid_title, text: `${t.card_label} ${cardNumber} ${t.not_found}`, icon: 'error', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ title: t.login_error_title, text: t.login_failed_err, icon: 'error' });
    }
  };

  const handleCheckoutLogic = useCallback(async (barcodeValue: string) => {
    // 1. Local Duplicate Check
    if (displayCheckouts.some((i: any) => i.externalId === barcodeValue)) {
      return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
    }

    Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 2. LIVE Check: Is it already checked out?
      const checkInCheckout = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
      if (checkInCheckout.data.checkoutRes.length > 0) {
        const c = checkInCheckout.data.checkoutRes[0];
        // Compare current patron with checkout patron (handling number vs string)
        if (String(c.patron_id) === String(patronId)) {
          return Swal.fire({ title: "Error", text: "A book is already in your checkout list", icon: 'warning' });
        } else {
          return Swal.fire({ title: "Error", text: "A book is already checked out by someone else", icon: 'warning' });
        }
      }

      // 3. LIVE Check: Is it reserved?
      const checkInHolds = await axios.get(`${API_BASE}/api/check-book-inholds/${barcodeValue}`);
      if (checkInHolds.data.holdRes.length > 0) {
        const activeHolds = checkInHolds.data.holdRes.sort((a: any, b: any) => a.priority - b.priority);
        if (String(activeHolds[0].patron_id) !== String(patronId)) {
          return Swal.fire({ title: "Error", text: "A book is already reserved by someone else", icon: 'warning' });
        }
      }

      // 4. Fetch Details for UI display
      const response = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);
      const bookData = response.data;

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

  const handleCheckinLogic = useCallback(async (barcodeValue: string) => {
    if (displayCheckins.some((i: any) => i.barcode === barcodeValue)) {
      return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
    }

    Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 1. Fetch live checkout info for this barcode
      const checkRes = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
      const checkoutData = checkRes.data.checkoutRes[0];

      if (!checkoutData) {
        return Swal.fire({ title: t.not_found, text: t.not_in_list, icon: 'error' });
      }

      // 2. Fetch Biblio info for title
      const bookDetails = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);
      
      const isActuallyOverdue = new Date(checkoutData.due_date) < new Date();

      const newReturn = {
        biblioId: bookDetails.data.biblio_id,
        title: bookDetails.data.title,
        barcode: barcodeValue,
        isOverdue: isActuallyOverdue,
        dueDate: checkoutData.due_date
      };

      setDisplayCheckins((prev: any) => [newReturn, ...prev]);
      Swal.close();
      Swal.fire({ title: t.scanned_swal, text: `${newReturn.title} ${t.added_to_return}`, icon: 'success', timer: 1000, showConfirmButton: false });

    } catch (error) {
      Swal.fire({ title: t.not_found, text: t.barcode_error, icon: 'warning' });
    }
  }, [displayCheckins, API_BASE, t, setDisplayCheckins]);

  // --- Hardware Event Listener ---
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (scanBuffer.current.trim().length > 0) {
          const code = scanBuffer.current.trim();
          if (currentLocation === '/') handleLogin(code);
          else if (currentLocation === '/checkout') handleCheckoutLogic(code);
          else if (currentLocation === '/checkin') handleCheckinLogic(code);
          scanBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLocation, handleCheckoutLogic, handleCheckinLogic]);

  // Render Login Scanner Overlay
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