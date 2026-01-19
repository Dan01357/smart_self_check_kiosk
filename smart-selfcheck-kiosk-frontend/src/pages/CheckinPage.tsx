import { useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import { useKiosk } from '../context/KioskContext';
import Swal from 'sweetalert2';

const CheckinPage = () => {
  const { openKeyboard, items, biblios } = useKiosk();
  const [displayCheckins, setDisplayCheckins] = useState<any[]>([]);

  const API_BASE = "http://192.168.0.127:4040";

  const handleReturnScanner = () => {
    openKeyboard(async (barcodeValue) => {
      Swal.showLoading();
      try {
        const response = await fetch(`${API_BASE}/api/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: barcodeValue })
        });

        const data = await response.json();

        if (data.success) {
          // Find the book title and data from your existing context
          const itemData: any = items.find((i: any) => i.external_id === barcodeValue);
          const biblio: any = biblios.find((b: any) => b.biblio_id === itemData?.biblio_id);

          const newReturn = {
            title: biblio?.title || "Unknown Title",
            barcode: barcodeValue,
            isOverdue: data.raw.includes('overdue'), // Checks SIP2 response for overdue flag
          };

          // Update the list dynamically
          setDisplayCheckins((prev) => [newReturn, ...prev]);

          Swal.fire({
            title: 'Success!',
            text: 'Returning book successful',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            title: 'Not Found',
            text: 'The barcode scanned was not found in the system or not checked out.',
            icon: 'warning'
          });
        }
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: 'Could not connect to the server.',
          icon: 'error'
        });
      }
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className='pt-60 pb-30'>
        <div className=" m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>

          {/* Clickable panel to trigger scanner */}
          <div
            className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer"
            onClick={handleReturnScanner}
          >
            <div className='text-[120px] animate-float relative z-1'>
              <div className='max-w-60'>
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
            <div className='font-bold text-[36px] text-white'>Scanning for returns</div>
            <div className='text-[26px] text-white'>Place books flat on the reader pad below</div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Items Being Returned</div>
            <button className='bg-[rgb(52_152_219)] text-white px-[20px] py-[8px] rounded-[20px] text-[24px]'>
              {displayCheckins.length} Items
            </button>
          </div>

          <div className='flex flex-col gap-5'>
            {displayCheckins.map((item: any, index) => (
              <div key={index} className={`flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[5px] ${item.isOverdue ? 'border-l-[#e74c3c]' : 'border-l-[rgb(46_204_113)]'}`}>
                <div className='text-[50px] min-w-[50px] mr-5'>{item.isOverdue ? '📕' : '📘'}</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{item.title}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>Barcode: {item.barcode}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>{item.isOverdue ? 'Item is overdue' : 'Returned on time'}</div>
                </div>
                <div className='text-[rgb(46_204_113)] ml-auto'>{item.isOverdue ? '⚠️' : '✓'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* The Overdue Notice design from your snippet */}
        <div className='bg-[#fff3cd] border-l-[5px] border-l-solid border-l-[#f39c12] rounded-[20px] p-[30px] m-[30px]'>
          <div className="text-[28px] font-bold text-[#d68910] mb-[15px] flex items-center gap-[15px]">
            ⚠️ Overdue Notice
          </div>
          <div className="text-[24px] text-[#85640]">
            One or more items are overdue. A fine may have been added to your account. You can pay now or later at the circulation desk.
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckinPage;