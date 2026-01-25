import { useEffect, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import animationData from "../../assets/QR Code Scanner.json";
import Swal from 'sweetalert2';
import { useKiosk } from '../../context/KioskContext';
import { api, postDataLogin } from '../../../app';
import { useLocation, useNavigate } from 'react-router';

function SimpleScanner() {
  const scanBuffer = useRef("");
  const {
   setPatronId, setShowScanner, patronId,
    setItems, items, setCheckouts, checkouts, biblios, setBiblios, // added 'checkouts' here
    setDisplayCheckouts, setDisplayCheckins, displayCheckouts, setPatronName, displayCheckins, handleLoginSuccess, API_BASE
  } = useKiosk();

  const navigate = useNavigate();
  const location = useLocation();

  const currentLocation = location.pathname;

  // --- Centralized Data Fetching ---
  useEffect(() => {
    if (currentLocation === "/checkout" || currentLocation === "/checkin") {
      const fetchData = async () => {
        try {
          const endpoints = [
            api.get(`${API_BASE}/api/v1/biblios`),
            api.get(`${API_BASE}/api/v1/items`)
          ];
          if (currentLocation === "/checkout" || currentLocation === "/checkin") endpoints.push(api.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`));

          const [bibliosRes, itemsRes, checkoutsRes] = await Promise.all(endpoints);
          setBiblios(bibliosRes.data);
          setItems(itemsRes.data);
          if (checkoutsRes) setCheckouts(checkoutsRes.data);
        } catch (e) {
          console.error("Data fetch failed", e);
        }
      };
      fetchData();
    }
  }, [currentLocation, API_BASE]);

  // --- Logic Handlers ---
  const handleLogin = async (cardNumber: string) => {
    try {
      const response = await postDataLogin(String(cardNumber));
      if (response.success === "true") {
        setPatronId(response.patron_id);
        setPatronName(response.patron_name)
        handleLoginSuccess()
        Swal.fire({ title: 'Submitted!', text: `Login successful`, icon: 'success', timer: 1500, showConfirmButton: false });
        navigate("/checkout", { replace: true, state: location.state });
      } else {
        Swal.fire({ title: 'Invalid!', text: `Card ${cardNumber} not found`, icon: 'error', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ title: 'Error!', text: 'Login failed.', icon: 'error' });
    }
  };

  // ... (inside SimpleScanner component, update handleCheckoutLogic)

const handleCheckoutLogic = useCallback(async (barcodeValue: string) => {
  const itemData: any = items.find((item: any) => barcodeValue === item.external_id);

  if (!itemData) {
    return Swal.fire({ title: 'Not Found', text: 'The barcode scanned was not found in the system.', icon: 'warning' });
  }

  // NEW: Check if the item is already checked out (onloan) in the system
  if (itemData.checkout_id || itemData.onloan) {
    return Swal.fire({ 
      title: 'Action Denied', 
      text: `"${itemData.external_id}" is already checked out.`, 
      icon: 'error' 
    });
  }

  if (displayCheckouts.some((i: any) => i.externalId === barcodeValue)) {
    return Swal.fire({ title: 'Already Added', icon: 'info', timer: 1000, showConfirmButton: false });
  }

  const biblio: any = biblios.find((b: any) => b.biblio_id === itemData.biblio_id);

  const estDate = new Date();
  estDate.setDate(estDate.getDate() + 14);
  const formattedEstDue = estDate.toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric'
  });

  const newSessionItem = {
    item_id: itemData.item_id,
    title: biblio?.title || "Unknown Title",
    externalId: itemData.external_id || "No Barcode",
    dueDate: formattedEstDue,
    checkoutDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  };

  setDisplayCheckouts((prev: any) => [newSessionItem, ...prev]);

  Swal.fire({
    title: 'Scanned',
    text: `${newSessionItem.title} added to checkout list`,
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  });
}, [items, biblios, displayCheckouts]);

  const handleCheckinLogic = useCallback(async (barcodeValue: string) => {
    const itemData: any = items.find((i: any) => i.external_id === barcodeValue);

    if (!itemData) {
      return Swal.fire({ title: 'Not Found', text: 'The barcode scanned was not found in the system.', icon: 'warning' });
    }

    // PREVENT DUPLICATE (Logic based on Checkout Page)
    if (displayCheckins.some((i: any) => i.barcode === barcodeValue)) {
      return Swal.fire({ title: 'Already Added', icon: 'info', timer: 1000, showConfirmButton: false });
    }

    const currentCheckout = checkouts.find((c: any) => c.item_id === itemData.item_id);
    if (!currentCheckout) {
      return Swal.fire({ title: 'Action Denied', text: 'This book is not in your checkout list.', icon: 'error' });
    }

    const isActuallyOverdue = new Date(currentCheckout.due_date) < new Date();
    const biblio: any = biblios.find((b: any) => b.biblio_id === itemData?.biblio_id);

    const newReturn = {
      biblioId:biblio.biblio_id,
      title: biblio?.title || "Unknown Title",
      barcode: barcodeValue,
      isOverdue: isActuallyOverdue,
      dueDate: currentCheckout.due_date
    };

    setDisplayCheckins((prev: any) => [newReturn, ...prev]);
    Swal.fire({ title: 'Scanned', text:  `${newReturn.title} added to return list`, icon: 'success', timer: 1000, showConfirmButton: false });

    // CRITICAL: Added displayCheckins to dependencies so the scanner knows what's already in the list
  }, [items, biblios, checkouts, displayCheckins]);
  // --- Hardware Event Listener ---
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevents scanner's "Enter" from closing active alerts
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
          <div className='font-bold text-[36px] text-white mt-4'>Scanning for Id</div>
          <div className='text-[26px] text-white text-center mt-2'>Place your id flat on the reader pad below</div>
        </div>
      </div>
    );
  }
  return null;
}

export default SimpleScanner;