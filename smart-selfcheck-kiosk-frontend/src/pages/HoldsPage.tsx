import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import axios from 'axios';
import { formatDate } from '../utils/formatDate';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

const HoldsPage = () => {
  // Access global state and configuration from the KioskContext
  const { patronId, holds, setHolds, API_BASE, language } = useKiosk();
  
  // Local state to track API loading progress
  const [loading, setLoading] = useState(true);

  // Initialize translation helper based on the current language selection
  const t: any = (translations as any)[language] || translations.EN;

  /**
   * Fetches the list of holds/reservations for the current patron.
   * Uses a POST request to keep the patron ID out of the URL for better security.
   */
  const fetchHolds = async () => {
    if (!patronId) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/v1/my-holds`, {
        patronId: patronId
      });
      // Update global holds state with the response data (which includes titles)
      setHolds(response.data);
    } catch (e) {
      console.error("Holds fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch holds whenever the patronId changes (e.g., on login)
  useEffect(() => {
    fetchHolds();
  }, [patronId]);

  /**
   * Logic to cancel an existing hold.
   * Displays a confirmation dialog before proceeding with the API call.
   */
  const handleCancelHold = async (holdId: number, title: string) => {
    // Show confirmation popup using SweetAlert2
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
      // Show loading indicator during the deletion process
      Swal.fire({
        title: t.scanning_items || "Processing...",
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        // Send DELETE request to the server with the specific hold ID
        const response = await axios.delete(`${API_BASE}/api/v1/holds`, {
          params: { holdId: holdId }
        });

        if (response.data) {
          // Notify user of success and refresh the holds list
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
        // Error handling for failed cancellation
        Swal.fire({
          title: t.error_title || 'Error',
          text: error.response?.data?.error || t.err_cancel_hold,
          icon: 'error'
        });
      }
    }
  };

  /**
   * Helper function to determine the visual status of a hold.
   * Logic based on Koha hold flags (waiting, transit, or priority queue).
   * Logic Update:
   * 1. Ready: waiting_date exists OR (Priority 1 AND NOT checked out).
   * 2. Pending #1: Priority 1 AND IS checked out.
   * 3. Pending #2+: Always shows line number.
   */
  const getStatusDisplay = (hold: any) => {
    // Logic Rule 1: Ready
    const isReady = hold.waiting_date || (hold.priority === 1 && !hold.is_checked_out);

    // Item is ready for the user to pick up
    if (isReady) return { label: t.ready_pickup, color: 'bg-green-500', icon: '✅' };
    
    // Item is being moved from one branch to another
    if (hold.transit_date) return { label: t.in_transit, color: 'bg-blue-400', icon: '🚚' };
    
    // Logic Rule 2 & 3: Pending #1 (if checked out) or Pending #2+
    return { label: `${t.pending} (#${hold.priority} ${t.in_line})`, color: 'bg-amber-500', icon: '⏳' };
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold'>{t.my_holds_reserves}</div>

        {/* Statistics Dashboard Summary */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='flex justify-around items-center'>
            {/* Total count of all active holds */}
            <div className='text-center'>
              <div className='text-[50px] font-bold'>{loading ? "..." : holds.length}</div>
              <div className='text-[20px] opacity-80'>{t.total_holds}</div>
            </div>
            <div className='w-[2px] h-[80px] bg-white/30'></div>
            {/* Count of items specifically ready for pickup based on new logic */}
            <div className='text-center'>
              <div className='text-[50px] font-bold'>
                {loading ? "..." : holds.filter((h: any) => h.waiting_date || (h.priority === 1 && !h.is_checked_out)).length}
              </div>
              <div className='text-[20px] opacity-80'>{t.ready_for_pickup}</div>
            </div>
          </div>
        </div>

        {/* Holds List Container */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='flex flex-col gap-5'>
            {loading ? (
              <div className="text-center py-20 text-[28px]">{t.loading_holds}</div>
            ) : holds.length > 0 ? (
              // Map through the holds array and render individual cards
              holds.map((hold: any) => {
                const status = getStatusDisplay(hold);
                const title = hold.title || "Unknown Title";
                const isReady = hold.waiting_date || (hold.priority === 1 && !hold.is_checked_out);

                return (
                  <div key={hold.hold_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px] shadow-sm' style={{ borderLeftColor: isReady ? '#2ecc71' : '#f39c12' }}>
                    {/* Status Icon */}
                    <div className='text-[60px] min-w-[60px] mr-6'>{status.icon}</div>

                    {/* Book Information */}
                    <div className='flex-grow'>
                      <div className='text-[28px] font-bold text-[#2c3e50] leading-tight mb-1'>
                        {title}
                      </div>
                      <div className='text-[20px] text-[#7f8c8d] mb-2'>
                        {t.placed_on}: {formatDate(hold.hold_date)}
                      </div>

                      {/* Visual Status Badge */}
                      <span className={`${status.color} text-white px-4 py-1 rounded-full text-[18px] font-bold`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Only show Cancel button if the item is not already ready for pickup */}
                    {!isReady && (
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
              // Empty state when user has no reservations
              <div className="text-center py-20 text-[28px] text-gray-500">
                {t.no_holds}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info Section/Pickup Instructions */}
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