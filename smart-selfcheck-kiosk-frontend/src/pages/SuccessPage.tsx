import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayCheckouts, setDisplayCheckouts, setCheckouts } = useKiosk()
  // Retrieve the previous location from the router state
  const locationBefore = location.state?.from;

  const handlePrint = () => {
    // We navigate and clear state after a short delay to allow the animation to finish
    // without crashing the current view.
    setTimeout(() => {
        navigate('/home');
        setDisplayCheckouts([]);
        setCheckouts([]);
    }, 1500);

    Swal.fire({
      title: 'Get Receipt',
      text: `Printing receipt...`,
      icon: 'success'
    })
  }

  if (locationBefore === '/checkout') {
    return (
      <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
        <Header />
        <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
          <div className='bg-[#d4edda] border-l-[#2ecc71] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
            <div className='text-[120px] mb-[20px]'>✅</div>
            <div className='text-[26px] text-[#155724]'>You have checked out {displayCheckouts?.length > 0 ? displayCheckouts.length : 0} items</div>
            <div className='text-[40px] text-[#155724] font-bold mb-[15px]'>Checkout Successful!</div>
          </div>
          <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px]'>
            <div className='text-[36px] font-bold mb-[30px] text-center'>Transaction Summary</div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>Items Checked Out:</span>
              <span>{displayCheckouts?.length > 0 ? displayCheckouts.length : 0}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>Checkout Date:</span>
              {/* FIXED: Added optional chaining and fallback text to prevent crash */}
              <span>{displayCheckouts[0]?.checkoutDate ? displayCheckouts[0].checkoutDate : 'N/A'}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
              <span>Due:</span>
              {/* FIXED: Added optional chaining and fallback text to prevent crash */}
              <span>{displayCheckouts[0]?.dueDate ? displayCheckouts[0].dueDate : 'N/A'}</span>
            </div>
            <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
              <span>Renewals Available:</span>
              <span>2 per item</span>
            </div>
          </div>
          <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
            <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
              <div className='text-[32px]'>Your Books</div>
            </div>
            <div className='flex flex-col gap-5'>
              {/* books here */}
              
              {displayCheckouts && displayCheckouts.length > 0 ? displayCheckouts.map((displayCheckout, index) => {
                return (
                  <div key={index} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                    <div className='text-[50px] min-w-[50px] mr-5'>📘
                    </div>
                    <div>
                      <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{displayCheckout.title}</div>
                      <div className='text-[20px] text-[rgb(127_140_141)]'>Due: {displayCheckout.dueDate}</div>
                    </div>
                    <div className='text-[rgb(46_204_113)] ml-auto'>✓</div>
                  </div>
                );
              }) : <div className="text-center text-gray-500">No items to display</div>}

            </div>
          </div>
          <div className='bg-[#e3f2fd] rounded-[15px] p-[30px] my-[25px]'>
            <div className='text-[30px] font-bold text-[#1565c0] mb-[20px] flex items-center gap-[15px]'>📧 Receipt Options</div>
            <div className='grid grid-cols-2 gap-[25px] my-[25px]'>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105' onClick={() => handlePrint()}>
                <div className="text-[80px] mb-[15px]">🖨️</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">Print Receipt</div>
              </div>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105'>
                <div className="text-[80px] mb-[15px]">📱</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">Email Receipt</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
  else if (locationBefore === '/checkin') {
    return (
      <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
        <Header />
        <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
          <div className='bg-[#d4edda] border-l-[#2ecc71] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
            <div className='text-[120px] mb-[20px]'>✅</div>
            <div className='text-[40px] text-[#155724] font-bold mb-[15px]'>Return Successful!</div>
            <div className='text-[26px] text-[#155724]'>You have returned 2 items</div>
          </div>
          <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px]'>
            <div className='text-[36px] font-bold mb-[30px] text-center'>Return Summary</div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>Items Returned:</span>
              <span>2</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>On Time:</span>
              <span>1 item</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
              <span>Overdue:</span>
              <span>1 item</span>
            </div>
            <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
              <span>Late Fees:</span>
              <span>$1.50</span>
            </div>
          </div>
          <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
            <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
              <div className='text-[32px]'>Returned Items</div>
            </div>
            <div className='flex flex-col gap-5'>
              <div className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                <div className='text-[50px] min-w-[50px] mr-5'>📘</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>The Great Gatsby</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>Returned on: Jan 15, 2026</div>
                  <div className='text-[22px] font-bold text-[#2ecc71]'>On Time</div>
                </div>
              </div>
              <div className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                <div className='text-[50px] min-w-[50px] mr-5'>📗</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>1984 by George Orwell</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>Returned on: Jan 15, 2026</div>
                  <div className='text-[22px] font-bold text-[#e74c3c]'>3 days late</div>
                </div>
                <div className='text-[rgb(46_204_113)] ml-auto'>✓</div>
              </div>
            </div>
          </div>
          <div className='bg-[#fff3e0] border-l-[5px] border-l-solid border-l-[#ff9800] rounded-[20px] p-[30px] my-[30px]'>
            <div className="text-[28px] font-bold text-[#e65100] mb-[15px] flex items-center gap-[15px]">
              📚 Item on Hold
            </div>
            <div className="text-[24px] text-[#e65100]">
              "1984 by George Orwell" is reserved for another patron. Please place it in the holds bin to your left.
            </div>
          </div>
          <div className='bg-[#e3f2fd] rounded-[15px] p-[30px] my-[25px]'>
            <div className='text-[30px] font-bold text-[#1565c0] mb-[20px] flex items-center gap-[15px]'>💳 Pay Fine Now?</div>
            <div className='grid grid-cols-2 gap-[25px] my-[25px]'>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105'>
                <div className="text-[80px] mb-[15px]">💳</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">Pay Now</div>
              </div>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105'>
                <div className="text-[80px] mb-[15px]">🏦</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">Pay Later</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Fallback if no location state exists
  return (
    <div className='flex items-center justify-center h-screen'>
        <button onClick={() => navigate('/home')} className='p-4 bg-blue-500 text-white rounded'>Back to Home</button>
    </div>
  );
}

export default SuccessPage;