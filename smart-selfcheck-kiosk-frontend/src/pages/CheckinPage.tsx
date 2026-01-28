import { useEffect } from "react";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import { useKiosk } from '../context/KioskContext';
import SimpleScanner from '../components/common/TestQrResult';
import Swal from 'sweetalert2';
import axios from 'axios';
import { translations } from '../utils/translations';

const CheckinPage = () => {
  const {
    openKeyboard,
    displayCheckins,
    setDisplayCheckins,
    patronId,
    API_BASE,
    setDisplayHolds,
    language
  } = useKiosk();

  const t: any = (translations as any)[language] || translations.EN;

  useEffect(() => {
    if (!patronId) return;
  }, [patronId]);

  // handleManualEntry now matches the flow and style of CheckoutPage
  const handleManualEntry = () => {
    openKeyboard(async (barcodeValue) => {
      // 1. Local duplicate check (Same as CheckoutPage)
      if (displayCheckins.some((i: any) => i.barcode === barcodeValue)) {
        return Swal.fire({ title: t.already_added, icon: 'info', timer: 1000, showConfirmButton: false });
      }

      // 2. Loading state (Same as CheckoutPage)
      Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        // 3. Fetch data from backend
        const checkInCheckout = await axios.get(`${API_BASE}/api/check-book-incheckouts/${barcodeValue}`);
        const checkInHolds = await axios.get(`${API_BASE}/api/check-book-inholds/${barcodeValue}`);

        // Logic check: If it's not checked out, it cannot be checked in
        if (checkInCheckout.data.checkoutRes.length === 0) {
          return Swal.fire({
            title: "Error",
            text: t.not_in_list,
            icon: 'warning'
          });
        }

        // 4. Get book details for UI
        const response = await axios.get(`${API_BASE}/api/book-details/${barcodeValue}`);
        const bookData = response.data;

        const checkoutData = checkInCheckout.data.checkoutRes[0];
        const isActuallyOverdue = new Date(checkoutData.due_date) < new Date();
        const hasHold = checkInHolds.data.holdRes.length > 0;

        const newReturn = {
          biblioId: bookData.biblio_id,
          title: bookData.title || "Unknown Title",
          barcode: barcodeValue,
          isOverdue: isActuallyOverdue,
          dueDate: checkoutData.due_date,
          isOnHold: hasHold
        };

        // 5. Global Hold detection (for navigation logic)
        if (hasHold) {
          setDisplayHolds((prev: any) => [...checkInHolds.data.holdRes, ...prev]);
        }

        // 6. Update List and show success Swal (Matching style of CheckoutPage)
        setDisplayCheckins((prev: any) => [newReturn, ...prev]);
        Swal.close();

      } catch (error: any) {
        console.error("Checkin Scan Error:", error);
        Swal.fire({ title: t.not_found, text: t.barcode_error, icon: 'warning' });
      }
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <SimpleScanner />
      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">{t.place_items}</div>

          <div
            className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer"
            onClick={handleManualEntry}
          >
            <div className='text-[120px] animate-float relative z-1'>
              <div className='max-w-60'>
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
            <div className='font-bold text-[36px] text-white'>{t.scanning_returns}</div>
            <div className='text-[26px] text-white text-center'>{t.scan_sub}</div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>{t.items_returned_label} ({displayCheckins.length})</div>
            <div className='text-white bg-[#3498db] py-[8px] px-[20px] rounded-[20px] text-[24px]'>
              {displayCheckins.length === 1
                ? t.one_item
                : `${displayCheckins.length} ${t.multiple_items}`
              }
            </div>
          </div>
          <div className='flex flex-col gap-5'>
            {displayCheckins.map((scannedItem: any, index: number) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dueDateObj = new Date(scannedItem.dueDate);
              dueDateObj.setHours(0, 0, 0, 0);

              const diffInDaysNormalized = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = diffInDaysNormalized < 0;
              const daysLate = Math.abs(diffInDaysNormalized);
              const isOnHold = scannedItem.isOnHold;

              let statusColor = '#3498db';
              let statusEmoji = '📘';

              if (isOverdue) { statusColor = '#e74c3c'; statusEmoji = '📕'; }
              if (isOnHold) { statusColor = '#f39c12'; statusEmoji = '📙'; }

              return (
                <div
                  key={index}
                  className={`flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[5px]`}
                  style={{ borderLeftColor: statusColor }}
                >
                  <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>
                  <div>
                    <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{scannedItem.title}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>{t.barcode_label}: {scannedItem.barcode}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>
                      {isOnHold
                        ? t.on_hold
                        : isOverdue
                          ? `${daysLate} ${daysLate === 1 ? t.day_overdue : t.days_overdue}`
                          : t.returned_on_time
                      }
                    </div>
                  </div>
                  <div className='ml-auto text-[24px]' style={{ color: statusColor }}>
                    {(isOverdue || isOnHold) ? '⚠️' : '✓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckinPage;