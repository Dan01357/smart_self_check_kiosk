import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext';
import { checkoutBook } from '../services/kohaApi';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
import Lottie from "lottie-react"
import animationData from "../assets/Scanning Document.json"
import { formatDate } from '../utils/formatDate';
import { api } from '../../app';
import SimpleScanner from '../components/common/TestQrResult';

const CheckoutPage = () => {
  const { 
    patronId, 
    openKeyboard, 
    setCheckouts, 
    biblios, 
    setBiblios, 
    items, 
    setItems, 
    displayCheckouts, 
    setDisplayCheckouts 
  } = useKiosk();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  // 1. Fetch necessary data for lookups on mount
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
  }, []);

  const handleRFIDScanner = () => {
    openKeyboard(async (barcodeValue) => {
      // Find the item in our local state to get the item_id
      console.log(barcodeValue, "bcValue", typeof barcodeValue)
      const itemData: any = items.find((item: any) => barcodeValue === item.external_id);

      if (itemData) {
        Swal.showLoading();
        try {
          // 1. Call the Koha API
          const result = await checkoutBook(patronId, itemData.item_id);

          // SAFETY CHECK: This prevents the 'E.checkout_id' crash
          if (!result || !result.checkout_id) {
            throw new Error("The server did not return a valid checkout record.");
          }

          // 2. Update global checkouts state
          setCheckouts((prev: any) => [result, ...prev]);

          // 3. Update display list for this session
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

          // 4. Success Alert
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
    });
  }

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>
          <SimpleScanner />
          <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer"
            onClick={handleRFIDScanner}
          >
            <div className='text-[120px] animate-float relative z-[1]'>
              <div className='max-w-60'>
                <Lottie animationData={animationData} loop={true} />
              </div>
            </div>
            <div className='font-bold text-[36px] text-white'>Scanning for items</div>
            <div className='text-[26px] text-white text-center'>
              Place books flat on the reader pad below / <br />
              Click this panel to enter barcode manually
            </div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Items Scanned ({displayCheckouts.length})</div>
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
  )
}

export default CheckoutPage;
