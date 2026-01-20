import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import SimpleScanner from '../components/common/TestQrResult';
import { checkoutBook } from '../services/kohaApi'; // Kept for manual entry bridge
import Swal from 'sweetalert2';

const CheckoutPage = () => {
  const { patronId, openKeyboard, setCheckouts, biblios, items, displayCheckouts, setDisplayCheckouts } = useKiosk();

  const handleManualEntry = () => {
    openKeyboard(async (barcodeValue) => {
      // Re-using same logic structure for manual entry
      const itemData: any = items.find((item: any) => barcodeValue === item.external_id);
      if (itemData) {
        Swal.showLoading();
        try {
          const result = await checkoutBook(patronId, itemData.item_id);
          if (result?.checkout_id) {
            setCheckouts((prev: any) => [result, ...prev]);
            const biblio: any = biblios.find((b: any) => b.biblio_id === itemData.biblio_id);
            const newSessionItem = {
              id: result.checkout_id,
              title: biblio?.title || "Unknown Title",
              externalId: itemData.external_id || "No Barcode",
              dueDate: result.due_date ? new Date(result.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
              checkoutDate: result.checkout_date ? new Date(result.checkout_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
            };
            setDisplayCheckouts((prev: any) => [newSessionItem, ...prev]);
            Swal.fire({ title: 'Success!', text: `Item checked out.`, icon: 'success', timer: 2000, showConfirmButton: false });
          }
        } catch (error: any) {
          Swal.fire({ title: 'Error', text: "Failed to checkout", icon: 'error' });
        }
      } else {
        Swal.fire({ title: 'Not Found', text: 'Barcode not found.', icon: 'warning' });
      }
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <SimpleScanner />
      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>
          <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer" onClick={handleManualEntry}>
            <div className='text-[120px] animate-float relative z-[1]'><div className='max-w-60'><Lottie animationData={animationData} loop={true} /></div></div>
            <div className='font-bold text-[36px] text-white'>Scanning for items</div>
            <div className='text-[26px] text-white text-center'>Place books flat on the reader pad below / <br /> Click this panel to enter barcode manually</div>
          </div>
        </div>
        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4 fy-between'>
            <div className='text-[32px]'>Items Scanned ({displayCheckouts.length})
            </div>
            <div className='text-white bg-[#3498db] py-[8px] px-[20px] rounded-[20px] text-[24px]'> {(displayCheckouts.length === 0 || displayCheckouts.length === 1 ) ? `${displayCheckouts.length} Item` : `${displayCheckouts.length} Items`} </div>
          </div>
          <div className='flex flex-col gap-5'>
            {displayCheckouts.map((item: any, index: number) => (
              <div key={index} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                <div className='text-[50px] min-w-[50px] mr-5'>📘</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{item.title}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>Barcode: {item.externalId}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>Due: {item.dueDate}</div>
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