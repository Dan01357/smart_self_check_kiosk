import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from "../../assets/QR Code Scanner.json";
import Swal from 'sweetalert2';
import { useKiosk } from '../../context/KioskContext';
import { api, postDataLogin } from '../../../app';
import { useLocation, useNavigate } from 'react-router';
import { checkoutBook } from '../../services/kohaApi';
import { formatDate } from '../../utils/formatDate';

function SimpleScanner() {
  const scanBuffer = useRef("");
  const { setAuthorized, setPatronId, setShowScanner, patronId, setItems, items, setCheckouts, biblios, setBiblios, setDisplayCheckouts, setDisplayCheckins } = useKiosk();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  const curentLocation = location.pathname

  if (curentLocation === '/') {

    const handleShowScanner = () => {
      setShowScanner(false)
    }

    useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (scanBuffer.current.length > 0) {
            const cardNumber = scanBuffer.current

            try {
              const response = await postDataLogin(String(cardNumber));

              if (response.success === "true") {
                setPatronId(response.patron_id);
                setAuthorized(true);

                Swal.fire({
                  title: 'Submitted!',
                  text: `Login successful`,
                  icon: 'success',
                  timer: 1500,
                  showConfirmButton: false
                });

                navigate("/checkout", {
                  replace: true,
                  state: location.state
                });

              } else {
                Swal.fire({
                  title: 'Invalid Credentials!',
                  text: `Card number ${cardNumber} does not exist`,
                  icon: 'error',
                  timer: 1500,
                  showConfirmButton: false
                });
              }
            } catch (error) {
              Swal.fire({
                title: 'Error!',
                text: 'Something went wrong with the login process.',
                icon: 'error',
              });
              console.error("Login error:", error);
            }
            scanBuffer.current = "";

          }
        } else {
          if (e.key.length === 1) {
            scanBuffer.current += e.key;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-[15px]">
        <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[100px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-full max-w-[900px] shadow-2xl" onClick={handleShowScanner}>
          <div className='text-[120px] animate-float relative z-[1]'>
            <div className='max-w-60 bg-white rounded-[30px]'>
              <Lottie animationData={animationData} loop={true} />
            </div>
          </div>
          <div className='font-bold text-[36px] text-white mt-4'>Scanning for Id</div>
          <div className='text-[26px] text-white text-center mt-2'>
            Place your id flat on the reader pad below<br />
          </div>
        </div>
      </div>
    );
  }
  else if (curentLocation === "/checkout") {
    useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const [checkoutsRes, bibliosRes, itemsRes] = await Promise.all([
            api.get(`${API_BASE}/api/v1/checkouts`),
            api.get(`${API_BASE}/api/v1/biblios`),
            api.get(`${API_BASE}/api/v1/items`)
          ]);

          setCheckouts(checkoutsRes.data);
          setBiblios(bibliosRes.data);
          setItems(itemsRes.data);
        } catch (e) {
          console.error("Data fetch failed", e);
        }
      };

      fetchInitialData();
    }, [API_BASE]);

    useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (scanBuffer.current.length > 0) {
            const barcodeValue = scanBuffer.current;

            // Logic Change: Finding item in the updated 'items' state
            const itemData: any = items.find((item: any) => barcodeValue === item.external_id);

            if (itemData) {
              Swal.showLoading();
              try {
                const result = await checkoutBook(patronId, itemData.item_id);

                if (!result || !result.checkout_id) {
                  throw new Error("The server did not return a valid checkout record.");
                }

                setCheckouts((prev: any) => [result, ...prev]);

                const biblio: any = biblios.find((b: any) => b.biblio_id === itemData.biblio_id);

                const newSessionItem = {
                  id: result.checkout_id,
                  title: biblio?.title || "Unknown Title",
                  externalId: itemData.external_id || "No Barcode",
                  dueDate: result.due_date ? new Date(result.due_date).toLocaleDateString('en-US', {
                    month: 'short', day: '2-digit', year: 'numeric'
                  }) : "N/A",
                  checkoutDate: result.checkout_date ? new Date(result.checkout_date).toLocaleDateString('en-US', {
                    month: 'short', day: '2-digit', year: 'numeric'
                  }) : "N/A",
                };

                setDisplayCheckouts((prev: any) => [newSessionItem, ...prev]);

                Swal.fire({
                  title: 'Success!',
                  text: `Item checked out. Due date: ${result.due_date ? formatDate(result.due_date) : 'N/A'}`,
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                });

              } catch (error: any) {
                console.error("Detailed Checkout Error:", error);
                const errorMessage = error.response?.data?.error || error.message || "Failed to checkout";
                Swal.fire({
                  title: 'Checkout Error',
                  text: errorMessage === "Confirmation error" ? "Book already Checked Out" : errorMessage,
                  icon: 'error'
                });
              }
            } else {
              Swal.fire({
                title: 'Not Found',
                text: 'The barcode scanned was not found in the system.',
                icon: 'warning'
              });
            }

            scanBuffer.current = "";
          }
        } else {
          if (e.key.length === 1) {
            scanBuffer.current += e.key;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
      // LOGIC CHANGE: Added dependencies so the listener updates when data is fetched
    }, [items, biblios, patronId]);

    return null;
  }
  else if (curentLocation === "/checkin") {
    // 1. Fetch metadata on mount for title lookups
    useEffect(() => {
      const fetchMetadata = async () => {
        try {
          const [bibliosRes, itemsRes] = await Promise.all([
            api.get(`${API_BASE}/api/v1/biblios`),
            api.get(`${API_BASE}/api/v1/items`)
          ]);
          setBiblios(bibliosRes.data);
          setItems(itemsRes.data);
        } catch (e) {
          console.error("Metadata fetch failed", e);
        }
      };
      fetchMetadata();
    }, [API_BASE]);

    // 2. Hardware Listener for Check-in
    useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (scanBuffer.current.length > 0) {
            const barcodeValue = scanBuffer.current;
            Swal.showLoading();

            try {
              // Call the SIP2 Backend
              const response = await fetch(`${API_BASE}/api/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: barcodeValue })
              });

              const data = await response.json();

              if (data.success) {
                // Find metadata to show Title
                const itemData: any = items.find((i: any) => i.external_id === barcodeValue);
                const biblio: any = biblios.find((b: any) => b.biblio_id === itemData?.biblio_id);

                const newReturn = {
                  title: biblio?.title || "Unknown Title",
                  barcode: barcodeValue,
                  isOverdue: data.raw.toLowerCase().includes('overdue'),
                };

                // Update the global state for the list
                setDisplayCheckins((prev: any) => [newReturn, ...prev]);

                Swal.fire({
                  title: 'Success!',
                  text: 'Returning book successful',
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                });
              } else {
                // Swal.fire({
                //   title: 'Not Found',
                //   text: 'The barcode scanned was not found or not checked out.',
                //   icon: 'warning'
                // });
              }
            } catch (err) {
              console.error(err);
              Swal.fire({ title: 'Error', text: 'Connection failed', icon: 'error' });
            }
            scanBuffer.current = "";
          }
        } else if (e.key.length === 1) {
          scanBuffer.current += e.key;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, biblios, setDisplayCheckins]);

    return null;
  }
}

export default SimpleScanner;