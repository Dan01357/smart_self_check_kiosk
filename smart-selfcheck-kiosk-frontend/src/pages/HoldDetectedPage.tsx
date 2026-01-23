import { useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const HoldDetectedPage = () => {
  const location = useLocation();

  // Retrieve hold details from navigation state
  const holdData = location.state?.holdData || {
    title: "The Great Gatsby",
    barcode: "30001234567891",
    patronName: "Jane Smith",
    pickupBranch: "Main Library",
    holdDate: "Jan 10, 2026"
  };


  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>

        {/* --- MAIN WARNING BANNER (Styled like Success Banner) --- */}
        <div className='bg-[#fff3e0] border-l-[#f39c12] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
          <div className='text-[120px] mb-[20px] animate-bounce'>⚠️</div>
          <div className='text-[40px] text-[#e65100] font-bold mb-[15px] uppercase'>Hold Item Detected</div>
          <div className='text-[26px] text-[#e65100]'>This book is reserved for another patron!</div>

        </div>

        {/* --- SUMMARY CARD (Styled like Success Summary) --- */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>Hold Information</div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span >Hold Patron:</span>
            <span>{holdData.patronName}</span>
          </div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Pickup Branch:</span>
            <span>{holdData.pickupBranch}</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span >Hold Placed:</span>
            <span >Jan 10, 2026</span>
          </div>
          <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
            <span>Notification Sent:</span>
            <span>Email + SMS ✓</span>
          </div>
        </div>
        {/* --- ITEM DISPLAY LIST (Styled like "Your Books" list) --- */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px] mb-8'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Book Details</div>
          </div>
          <div className='flex flex-col gap-5'>
            <div className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[#f39c12] border-l-[5px]'>
              <div className='text-[50px] min-w-[50px] mr-5'>📙</div>
              <div>
                <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{holdData.title}</div>
                <div className='text-[20px] text-[rgb(127_140_141)]'>Barcode: {holdData.barcode}</div>
                <div className='text-[20px] text-[rgb(127_140_141)]'>Reserved for: Jane Smith</div>
                <div className='text-[#f39c12] text-[22px] font-bold'>Awaiting Hold Pickup</div>
              </div>
              <div className='ml-auto text-[32px]'>📌</div>
            </div>
          </div>
        </div>
        <div className='bg-[#fff3e0] border-l border-l-[#f39c12] rounded-[15px] p-[30px] mb-[30px] flex gap-5 items-start border-l-[6px] border-l-solid text-[#e65100]'>
          <div className='text-[40px]'>📚</div>
          <div>
            <div className='text-[26px] font-bold'>Routed to Hold Shelf</div>
            <div className='text-[20px] opacity-90'>
              This book has been reserved by another patron. It will be automatically routed to the Hold Shelf for pickup. The patron will be notified that their book is ready.
            </div>
          </div>
        </div>


        {/* --- ACTION INSTRUCTION BOX --- */}
        <div className='bg-[#e3f2fd] border-l-[#2196f3] border-l-[8px] border-l-solid rounded-[15px] p-[30px] flex gap-5 items-start mb-10'>
          <div className='text-[40px]'>✅</div>
          <div>
            <div className='text-[28px] font-bold text-[#1565c0]'>No Action Required</div>
            <div className='text-[22px] text-[#0d47a1]'>
              The book has been automatically sorted to the Hold Shelf bin. Library staff will place it on the hold shelf for patron pickup.
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HoldDetectedPage;