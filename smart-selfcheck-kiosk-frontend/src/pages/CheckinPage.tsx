import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import { useKiosk } from '../context/KioskContext';
import SimpleScanner from '../components/common/TestQrResult';
import { diffInDays } from '../utils/dueDateFormulate';
import Swal from 'sweetalert2'; // Make sure Swal is imported

const CheckinPage = () => {
  // Destructure the necessary data from context
  const {
    openKeyboard,
    displayCheckins,
    items,
    checkouts,
    biblios,
    setDisplayCheckins
  } = useKiosk();

  const handleManualEntry = () => {
    openKeyboard((barcodeValue) => {
      // 1. Find the item in the global items list
      const itemData: any = items.find((i: any) => i.external_id === barcodeValue);

      if (!itemData) {
        return Swal.fire({
          title: 'Not Found',
          text: 'The barcode entered was not found in the system.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }

      // 2. CHECK: Does this item exist in the current patron's checkout list?
      const currentCheckout = checkouts.find((c: any) => c.item_id === itemData.item_id);

      if (!currentCheckout) {
        return Swal.fire({
          title: 'Action Denied',
          text: 'This book is not in your checkout list. You can only return items you personally borrowed.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }

      // 3. Logic for overdue calculation
      const isActuallyOverdue = new Date(currentCheckout.due_date) < new Date();
      const biblio: any = biblios.find((b: any) => b.biblio_id === itemData?.biblio_id);

      const newReturn = {
        title: biblio?.title || "Unknown Title",
        barcode: barcodeValue,
        isOverdue: isActuallyOverdue,
        dueDate: currentCheckout.due_date
      };

      // 4. Update the UI list (Delayed Commit - no API call yet)
      setDisplayCheckins((prev: any) => [newReturn, ...prev]);

      Swal.fire({
        title: 'Added!',
        text: 'Item added to return list',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <SimpleScanner />
      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>

          {/* UPDATED: Calling handleManualEntry instead of empty arrow function */}
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
            {displayCheckins.map((item: any, index: number) => {
              // Synchronize logic: Get the absolute difference and ensure it's at least 1 if overdue
              const rawDiff = diffInDays(item);
              const daysLate = Math.max(1, Math.abs(rawDiff));

              // Logic for the three states
              let statusColor = '#3498db'; // Blue (On time)
              let statusEmoji = '📘';

              if (item.isOverdue) {
                if (daysLate >= 4) {
                  statusColor = '#e74c3c'; // Red (4+ days)
                  statusEmoji = '📕';
                } else {
                  statusColor = '#e67e22'; // Orange (1-3 days)
                  statusEmoji = '📙';
                }
              }

              return (
                <div
                  key={index}
                  className={`flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[5px]`}
                  style={{ borderLeftColor: statusColor }}
                >
                  <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>

                  <div>
                    <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{item.title}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>Barcode: {item.barcode}</div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>
                      {item.isOverdue
                        ? `${daysLate} ${daysLate === 1 ? 'day' : 'days'} overdue`
                        : 'Returned on time'
                      }
                    </div>
                  </div>

                  <div className='ml-auto text-[24px]' style={{ color: statusColor }}>
                    {item.isOverdue ? '⚠️' : '✓'}
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