import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import axios from 'axios';
// import Swal from 'sweetalert2';
import { formatDate } from '../utils/formatDate';
import Swal from 'sweetalert2';

const HoldsPage = () => {
  const { patronId, biblios, holds, setHolds, API_BASE } = useKiosk();

  const [loading, setLoading] = useState(true);

  // 1. Fetch Holds Data
  const fetchHolds = async () => {
    setLoading(true);
    try {
      // Note: This endpoint should join hold data with biblio/title data in your Express backend
      const response = await axios.get(`${API_BASE}/api/v1/holds?patronId=${patronId}`);
      setHolds(response.data);
      console.log(response)
    } catch (e) {
      console.error("Holds fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patronId) fetchHolds();
  }, [patronId]);

  // 2. Handle Cancel Hold
  const handleCancelHold = async (holdId: number, title: string) => {
  const result = await Swal.fire({
    title: 'Cancel Hold?',
    text: `Are you sure you want to remove your reservation for "${title}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Yes, Cancel it',
    cancelButtonText: 'No, Keep it'
  });
  
  if (result.isConfirmed) {
    Swal.showLoading(); // Show loading while waiting for backend
    try {
      // Calling our new DELETE route
      const response = await axios.delete(`${API_BASE}/api/v1/holds`, {
        params: { holdId: holdId } // This sends ?holdId=5
      });

      if (response.data) {
        Swal.fire({
          title: 'Cancelled',
          text: 'Your hold has been removed.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchHolds(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Cancellation error", error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Could not cancel hold. It may have already been processed.',
        icon: 'error'
      });
    }
  }
};

  // Helper to determine status color/text
  const getStatusDisplay = (hold: any) => {
    if (hold.waiting_date) return { label: 'READY FOR PICKUP', color: 'bg-green-500', icon: '✅' };
    if (hold.transit_date) return { label: 'IN TRANSIT', color: 'bg-blue-400', icon: '🚚' };
    return { label: `PENDING (#${hold.priority} in line)`, color: 'bg-amber-500', icon: '⏳' };
  };
  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold'>My Holds & Reserves</div>

        {/* --- SUMMARY CARD --- */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='flex justify-around items-center'>
            <div className='text-center'>
              <div className='text-[50px] font-bold'>{holds.length}</div>
              <div className='text-[20px] opacity-80'>Total Holds</div>
            </div>
            <div className='w-[2px] h-[80px] bg-white/30'></div>
            <div className='text-center'>
              <div className='text-[50px] font-bold'>
                {holds.filter(h => h.waiting_date).length}
              </div>
              <div className='text-[20px] opacity-80'>Ready for Pickup</div>
            </div>
          </div>
        </div>

        {/* --- HOLDS LIST --- */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='flex flex-col gap-5'>
            {loading ? (
              <div className="text-center py-20 text-[28px]">Loading holds...</div>
            ) : holds.length > 0 ? (
              holds.map((hold: any) => {
                const biblioInfo = biblios.find((b: any) => b.biblio_id === hold.biblio_id);
                const status = getStatusDisplay(hold);
                return (
                  <div key={hold.hold_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px] shadow-sm' style={{ borderLeftColor: status.color === 'bg-green-500' ? '#2ecc71' : '#f39c12' }}>
                    <div className='text-[60px] min-w-[60px] mr-6'>{status.icon}</div>

                    <div className='flex-grow'>
                      <div className='text-[28px] font-bold text-[#2c3e50] leading-tight mb-1'>
                        {biblioInfo.title}
                      </div>
                      <div className='text-[20px] text-[#7f8c8d] mb-2'>
                        Placed on: {formatDate(hold.hold_date)}
                      </div>

                      {/* Status Badge */}
                      <span className={`${status.color} text-white px-4 py-1 rounded-full text-[18px] font-bold`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Action Button */}
                    {!hold.waiting_date && (
                      <button
                        onClick={() => handleCancelHold(hold.hold_id, biblioInfo.title)}
                        className='bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-[25px] py-[15px] rounded-[12px] text-[20px] font-bold transition-all'
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-[28px] text-gray-500">
                You have no active holds.
              </div>
            )}
          </div>
        </div>

        {/* --- INFO BOX --- */}
        <div className='bg-[#fff3e0] border-l-[5px] border-l-solid border-l-[#ff9800] rounded-[20px] p-[30px] mt-[30px]'>
          <div className="text-[26px] font-bold text-[#e65100] mb-[10px]">
            📌 Pickup Instructions
          </div>
          <div className="text-[20px] text-[#e65100] opacity-80">
            Items marked as <span className="font-bold">READY</span> can be found on the hold shelf organized by your last name. You must check them out at this kiosk before leaving.
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HoldsPage;