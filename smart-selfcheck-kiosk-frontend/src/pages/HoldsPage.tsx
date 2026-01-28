import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import axios from 'axios';
import { formatDate } from '../utils/formatDate';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

const HoldsPage = () => {
  // REMOVED: biblios (We no longer need to find titles locally)
  const { patronId, holds, setHolds, API_BASE, language } = useKiosk();
  const [loading, setLoading] = useState(true);

  const t: any = (translations as any)[language] || translations.EN;

  const fetchHolds = async () => {
    if (!patronId) return;
    setLoading(true);
    try {
      // SECURE POST: Hides ID from URL and gets titles from server
      const response = await axios.post(`${API_BASE}/api/v1/my-holds`, {
        patronId: patronId
      });
      setHolds(response.data);
    } catch (e) {
      console.error("Holds fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolds();
  }, [patronId]);

  const handleCancelHold = async (holdId: number, title: string) => {
    const result = await Swal.fire({
      title: t.cancel_hold_q,
      text: `${t.cancel_hold_confirm} "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: t.yes_cancel,
      cancelButtonText: t.no_keep
    });
    
    if (result.isConfirmed) {
      Swal.fire({
        title: t.scanning_items || "Processing...",
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const response = await axios.delete(`${API_BASE}/api/v1/holds`, {
          params: { holdId: holdId }
        });

        if (response.data) {
          Swal.fire({
            title: t.cancelled_swal,
            text: t.hold_removed_msg,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          fetchHolds();
        }
      } catch (error: any) {
        Swal.fire({
          title: t.error_title || 'Error',
          text: error.response?.data?.error || t.err_cancel_hold,
          icon: 'error'
        });
      }
    }
  };

  const getStatusDisplay = (hold: any) => {
    if (hold.waiting_date) return { label: t.ready_pickup, color: 'bg-green-500', icon: '✅' };
    if (hold.transit_date) return { label: t.in_transit, color: 'bg-blue-400', icon: '🚚' };
    return { label: `${t.pending} (#${hold.priority} ${t.in_line})`, color: 'bg-amber-500', icon: '⏳' };
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold'>{t.my_holds_reserves}</div>

        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='flex justify-around items-center'>
            <div className='text-center'>
              <div className='text-[50px] font-bold'>{loading ? "..." : holds.length}</div>
              <div className='text-[20px] opacity-80'>{t.total_holds}</div>
            </div>
            <div className='w-[2px] h-[80px] bg-white/30'></div>
            <div className='text-center'>
              <div className='text-[50px] font-bold'>
                {loading ? "..." : holds.filter((h: any) => h.waiting_date).length}
              </div>
              <div className='text-[20px] opacity-80'>{t.ready_for_pickup}</div>
            </div>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='flex flex-col gap-5'>
            {loading ? (
              <div className="text-center py-20 text-[28px]">{t.loading_holds}</div>
            ) : holds.length > 0 ? (
              holds.map((hold: any) => {
                const status = getStatusDisplay(hold);
                
                // FIX: Use the hydrated title from the POST response
                const title = hold.title || "Unknown Title";

                return (
                  <div key={hold.hold_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px] shadow-sm' style={{ borderLeftColor: hold.waiting_date ? '#2ecc71' : '#f39c12' }}>
                    <div className='text-[60px] min-w-[60px] mr-6'>{status.icon}</div>

                    <div className='flex-grow'>
                      <div className='text-[28px] font-bold text-[#2c3e50] leading-tight mb-1'>
                        {title}
                      </div>
                      <div className='text-[20px] text-[#7f8c8d] mb-2'>
                        {t.placed_on}: {formatDate(hold.hold_date)}
                      </div>

                      <span className={`${status.color} text-white px-4 py-1 rounded-full text-[18px] font-bold`}>
                        {status.label}
                      </span>
                    </div>

                    {!hold.waiting_date && (
                      <button
                        onClick={() => handleCancelHold(hold.hold_id, title)}
                        className='bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-[25px] py-[15px] rounded-[12px] text-[20px] font-bold transition-all'
                      >
                        ✕ {t.cancel_hold_btn}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-[28px] text-gray-500">
                {t.no_holds}
              </div>
            )}
          </div>
        </div>

        <div className='bg-[#fff3e0] border-l-[5px] border-l-solid border-l-[#ff9800] rounded-[20px] p-[30px] mt-[30px]'>
          <div className="text-[26px] font-bold text-[#e65100] mb-[10px]">
            📌 {t.pickup_instructions}
          </div>
          <div className="text-[20px] text-[#e65100] opacity-80">
            {t.pickup_text_start} <span className="font-bold">{t.pickup_text_ready}</span> {t.pickup_text_end}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HoldsPage;