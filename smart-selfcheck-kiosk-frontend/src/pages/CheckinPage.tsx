import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Lottie from "lottie-react";
import animationData from "../assets/Scanning Document.json";
import { useKiosk } from '../context/KioskContext';
import SimpleScanner from '../components/common/TestQrResult';

const CheckinPage = () => {
  const { openKeyboard, displayCheckins } = useKiosk();

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <SimpleScanner /> {/* Logic engine runs here */}

      <div className='pt-60 pb-30'>
        <div className="m-auto flex flex-col justify-center items-center overflow-auto">
          <div className="text-[42px] mb-[35px] font-[700]">Place Items on RFID Reader</div>
          
          <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[200px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-[1000px] cursor-pointer"
            onClick={() => openKeyboard(() => {})} // Just opens UI, Scanner handles logic
          >
            <div className='text-[120px] animate-float relative z-1'>
               <div className='max-w-60'><Lottie animationData={animationData} loop={true} /></div>
            </div>
            <div className='font-bold text-[36px] text-white'>Scanning for returns</div>
            <div className='text-[26px] text-white'>Place books flat on the reader pad below</div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] m-[30px] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Items Being Returned ({displayCheckins.length})</div>
          </div>

          <div className='flex flex-col gap-5'>
            {displayCheckins.map((item: any, index: number) => (
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
      </div>
      <Footer />
    </div>
  );
};

export default CheckinPage;