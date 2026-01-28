import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import SimpleScanner from '../components/common/SimpleScanner';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';
import axios from 'axios';

/**
 * CheckoutPage Component
 * This page handles the scanning phase of borrowing books. 
 * Items scanned here are added to a temporary session list before final processing.
 */
const CheckoutPage = () => {
  const {
    authorized,
    patronId,
    displayCheckouts,
    setDisplayCheckouts,
    openKeyboard,
    language,
    API_BASE
  } = useKiosk();

  const navigate = useNavigate();

  // Load translations based on global language setting
  const t: any = (translations as any)[language] || translations.EN;

  /**
   * Security Check:
   * Ensures the user is logged in. If not, they are redirected back to the login page.
   */
  useEffect(() => {
    if (!authorized || !patronId) {
      navigate("/", { replace: true });
    }
  }, [authorized, patronId, navigate]);

  /**
   * handleManualEntry:
   * Triggered when the user clicks the scanning area to manually type a barcode.
   * Performs real-time validation against Koha to ensure the book is available for borrowing.
   */
  const handleManualEntry = () => {
    openKeyboard(async (barcodeValue) => {
      // 1. Local duplicate check: Ensure the book isn't already scanned in this session
      if (displayCheckouts.some((i: any) => i.externalId === barcodeValue)) {
        return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
      }

      Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        // 2. LIVE Check: Check if the book is currently checked out or has active reservations (holds)
        const checkInCheckout = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
        const checkInHolds = await axios.get(`${API_BASE}/api/check-book-inholds/${barcodeValue}`);

        // Logic for scan-time warnings:
        // Check if already checked out by current user or someone else
        if (checkInCheckout.data.checkoutRes.length > 0) {
          const c = checkInCheckout.data.checkoutRes[0];
          if (String(c.patron_id) === String(patronId)) {
            return Swal.fire({ title: "Error", text: t.already_in_list, icon: 'warning' });
          } else {
            return Swal.fire({ title: "Error", text: t.already_borrowed, icon: 'warning' });
          }
        }

        // Check if another patron has a priority hold on this item
        if (checkInHolds.data.holdRes.length > 0) {
          const h = checkInHolds.data.holdRes.sort((a: any, b: any) => a.priority - b.priority)[0];
          if (String(h.patron_id) !== String(patronId)) {
            return Swal.fire({ title: "Error", text: t.already_reserved, icon: 'warning' });
          }
        }

        // 3. Data Fetching: If the book is available, retrieve title and ID details
        const response = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);
        const bookData = response.data;

        // Calculate a 14-day loan period for UI display purposes
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + 14);
        const formattedEstDue = estDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        const newSessionItem = {
          item_id: bookData.item_id,
          title: bookData.title,
          externalId: barcodeValue,
          dueDate: formattedEstDue,
          checkoutDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        };

        // Add to the local list displayed on the screen
        setDisplayCheckouts((prev: any) => [newSessionItem, ...prev]);
        Swal.close();

      } catch (error: any) {
        // Error handling for invalid barcodes or server issues
        Swal.fire({ title: t.not_found, text: t.barcode_error, icon: 'warning' });
      }
    });
  };


  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      {/* Invisible component that listens for hardware scanner inputs */}
      <SimpleScanner />

      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">
            {t.place_items}
          </div>

          {/* Interactive Scanning Area */}
          <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer" onClick={handleManualEntry}>
            <div className='text-[120px] animate-float relative z-[1]'>
              <div className='max-w-60'>
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
            <div className='font-bold text-[36px] text-white'>{t.scanning_items}</div>
            <div className='text-[26px] text-white text-center'>
              {t.scan_sub}
            </div>
          </div>
        </div>

        {/* List of scanned items display */}
        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4 fy-between'>
            <div className='text-[32px]'>{t.items_scanned_label} ({displayCheckouts.length})</div>
            <div className='text-white bg-[#3498db] py-[8px] px-[20px] rounded-[20px] text-[24px]'>
              {displayCheckouts.length === 1 ? t.one_item : `${displayCheckouts.length} ${t.multiple_items}`}
            </div>
          </div>

          <div className='flex flex-col gap-5'>
            {/* Map through displayCheckouts state to render item cards */}
            {displayCheckouts.map((item: any, index: number) => (
              <div key={index} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                <div className='text-[50px] min-w-[50px] mr-5'>📘</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{item.title}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>{t.barcode_label}: {item.externalId}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>{t.due_label}: {item.dueDate}</div>
                </div>
                <div className='text-[rgb(46_204_113)] ml-auto'>✓</div>
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;