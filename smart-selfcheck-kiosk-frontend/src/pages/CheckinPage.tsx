import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import { useKiosk } from '../context/KioskContext';
import SimpleScanner from '../components/common/TestQrResult';
import { diffInDays } from '../utils/dueDateFormulate';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
import axios from 'axios';

const CheckinPage = () => {
  const {
    openKeyboard,
    displayCheckins,
    items,
    checkouts,
    biblios,
    setDisplayCheckins,
    setCheckouts,
    setBiblios,
    setItems,
    patronId, 
    API_BASE
  } = useKiosk();

  // 1. EXACT FETCH LOGIC FROM ACCOUNT PAGE (Fastest updates)
  useEffect(() => {
    if (!patronId) return;

    const fetchCheckouts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
        setCheckouts(response.data);
      } catch (e) { console.error("Checkout fetch failed", e); }
    }
    const fetchBiblios = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/biblios`);
        setBiblios(response.data);
      } catch (e) { console.error("Biblio fetch failed", e); }
    }
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/items`);
        setItems(response.data);
      } catch (e) { console.error("Items fetch failed", e); }
    }

    fetchCheckouts();
    fetchBiblios();
    fetchItems();
  }, [patronId, API_BASE, setCheckouts, setBiblios, setItems]);


  const handleManualEntry = () => {
    openKeyboard((barcodeValue) => {
      const itemData: any = items.find((i: any) => i.external_id === barcodeValue);
      if (!itemData) {
        return Swal.fire({ title: 'Not Found', text: 'The barcode scanned was not found in the system', icon: 'warning' });
      }

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
      Swal.fire({ title: 'Scanned', text: `${newReturn.title} added to return list`, icon: 'success', timer: 1500, showConfirmButton: false });
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <SimpleScanner />
      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>

          <div
            className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer"
            onClick={handleManualEntry}
          >
            <div className='text-[120px] animate-float relative z-1'>
              <div className='max-w-60'>
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
            <div className='font-bold text-[36px] text-white'>Scanning for returns</div>
            <div className='text-[26px] text-white'>Place books flat on the reader pad below / <br /> Click this panel to enter barcode manually</div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Items Being Returned ({displayCheckins.length})</div>
            <div className='text-white bg-[#3498db] py-[8px] px-[20px] rounded-[20px] text-[24px]'>
              {(displayCheckins.length === 0 || displayCheckins.length === 1) ? `${displayCheckins.length} Item` : `${displayCheckins.length} Items`}
            </div>
          </div>
          <div className='flex flex-col gap-5'>
            {displayCheckins.map((scannedItem: any, index: number) => {
              // 2. LIVE LOOKUP LOGIC: This ensures data updates instantly on the first refresh
              const itemInfo = items.find((i: any) => i.external_id === scannedItem.barcode);
              const checkoutInfo = checkouts.find((c: any) => c.item_id === itemInfo?.item_id);

              // Use fresh data from checkout if available, otherwise fallback to scanned item data
              const finalDueDate = checkoutInfo ? checkoutInfo.due_date : scannedItem.dueDate;
              const isOverdue = new Date(finalDueDate) < new Date();

              // Calculate days late using the fresh date
              const rawDiff = diffInDays({ ...scannedItem, dueDate: finalDueDate });
              const daysLate = Math.max(1, Math.abs(rawDiff));

              let statusColor = '#3498db';
              let statusEmoji = '📘';

              if (isOverdue) {
                statusColor = '#e74c3c';
                statusEmoji = '📕';
              }

              return (
                <div
                  key={index}
                  className={`flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[5px]`}
                  style={{ borderLeftColor: statusColor }}
                >
                  <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>

                  <div>
                    <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{scannedItem.title}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>Barcode: {scannedItem.barcode}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>
                      {isOverdue
                        ? `${daysLate} ${daysLate === 1 ? 'day' : 'days'} overdue`
                        : 'Returned on time'
                      }
                    </div>
                  </div>

                  <div className='ml-auto text-[24px]' style={{ color: statusColor }}>
                    {isOverdue ? '⚠️' : '✓'}
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