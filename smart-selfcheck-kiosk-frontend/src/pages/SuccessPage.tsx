import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { formatDate } from '../utils/formatDate';
import { translations } from '../utils/translations'; // Import

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Access global state for processed checkouts, checkins, and active holds
  const { displayCheckouts, setDisplayCheckouts, displayCheckins, setDisplayCheckins, displayHolds, language } = useKiosk()
  
  // Determine if the user arrived here from the checkout or checkin flow
  const locationBefore = location.state?.from;

  // Initialize translation object based on selected language
  const t:any = (translations as any)[language ] || translations.EN;
  
  // Normalize current date for comparison calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /**
   * Process returned items to determine their specific status.
   * Checks if an item is overdue or if it's currently reserved by another patron.
   */
  const itemsWithStatus = displayCheckins.map(item => {
    const dueDateObj = new Date(item.dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
    // Calculate difference in days to check for lateness
    const diffInDaysNormalized = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = diffInDaysNormalized < 0;
    const daysLate = Math.abs(diffInDaysNormalized);
    
    // Check if the returned item has a pending hold in the system
    const isOnHold = displayHolds.some((hold: any) => Number(hold.biblio_id) === Number(item.biblioId));
    
    return { ...item, isOverdue, daysLate, isOnHold };
  });

  // Aggregated counts for the summary dashboard
  const overdueCount = itemsWithStatus.filter(i => i.isOverdue).length;
  const holdCount = itemsWithStatus.filter(i => i.isOnHold).length;
  const onTimeCount = itemsWithStatus.filter(i => !i.isOverdue).length;

  /**
   * Handles the print/email receipt action for Checkouts.
   * Clears state and redirects to home after a short delay.
   */
  const handlePrint = () => {
    setTimeout(() => {
      navigate('/home');
      setDisplayCheckouts([]); // Reset checkout buffer
    }, 1500);

    Swal.fire({
      title: t.swal_receipt_title,
      text: t.swal_receipt_text,
      icon: 'success'
    })
  }

  /**
   * Handles fine payment interaction for Checkins.
   * Clears state and redirects to home after a short delay.
   */
  const handlePayNow = () => {
    setTimeout(() => {
      navigate('/home');
      setDisplayCheckins([]); // Reset checkin buffer
    }, 1500);

    Swal.fire({
      title: t.swal_pay_success_title,
      text: t.swal_pay_success_text,
      icon: 'success'
    })
  }

  // UI rendering specifically for successful Checkouts
  if (locationBefore === '/checkout') {
    return (
      <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
        <Header />
        <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
          
          {/* Success Banner */}
          <div className='bg-[#d4edda] border-l-[#2ecc71] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
            <div className='text-[120px] mb-[20px]'>✅</div>
            <div className='text-[26px] text-[#155724]'>
                {t.checked_out_prefix} {displayCheckouts?.length || 0} {displayCheckouts?.length === 1 ? t.item_singular : t.items_plural}
            </div>
            <div className='text-[40px] text-[#155724] font-bold mb-[15px]'>{t.checkout_success_title}</div>
          </div>

          {/* Transaction Summary Card */}
          <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px]'>
            <div className='text-[36px] font-bold mb-[30px] text-center'>{t.trans_summary}</div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>{t.items_scanned_label}:</span>
              <span>{displayCheckouts?.length || 0}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>{t.checkout_date_label}</span>
              <span>{displayCheckouts[0]?.checkoutDate || 'N/A'}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
              <span>{t.due_label}:</span>
              <span>{displayCheckouts[0]?.dueDate || 'N/A'}</span>
            </div>
            <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
              <span>{t.renewals_avail_label}</span>
              <span>10 {t.per_item}</span>
            </div>
          </div>

          {/* List of successfully checked out items */}
          <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
            <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
              <div className='text-[32px]'>{t.your_books_label}</div>
            </div>
            <div className='flex flex-col gap-5'>
              {displayCheckouts && displayCheckouts.length > 0 ? displayCheckouts.map((displayCheckout, index) => {
                return (
                  <div key={index} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                    <div className='text-[50px] min-w-[50px] mr-5'>📘</div>
                    <div>
                      <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{displayCheckout.title}</div>
                      <div className='text-[20px] text-[rgb(127_140_141)]'>{t.due_label}: {displayCheckout.dueDate}</div>
                    </div>
                    <div className='text-[rgb(46_204_113)] ml-auto'>✓</div>
                  </div>
                );
              }) : <div className="text-center text-gray-500">{t.no_items_display}</div>}
            </div>
          </div>

          {/* Receipt Actions */}
          <div className='bg-[#e3f2fd] rounded-[15px] p-[30px] my-[25px]'>
            <div className='text-[30px] font-bold text-[#1565c0] mb-[20px] flex items-center gap-[15px]'>📧 {t.receipt_options}</div>
            <div className='grid grid-cols-2 gap-[25px] my-[25px]'>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105' onClick={() => handlePrint()}>
                <div className="text-[80px] mb-[15px]">🖨️</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">{t.print_receipt}</div>
              </div>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105' onClick={() => handlePrint()}>
                <div className="text-[80px] mb-[15px]">📱</div>
                <div className="text-[26px] font-bold text-[#2c3e50]" >{t.email_receipt}</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
  // UI rendering specifically for successful Checkins (Returns)
  else if (locationBefore === '/checkin') {
    return (
      <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
        <Header />
        <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
          
          {/* Success Banner */}
          <div className='bg-[#d4edda] border-l-[#2ecc71] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
            <div className='text-[120px] mb-[20px]'>✅</div>
            <div className='text-[26px] text-[#155724]'>
                {t.returned_prefix} {displayCheckins?.length || 0} {displayCheckins?.length === 1 ? t.item_singular : t.items_plural}
            </div>
            <div className='text-[40px] text-[#155724] font-bold mb-[15px]'>{t.return_success_title}</div>
          </div>

          {/* Return Summary Statistics */}
          <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px]'>
            <div className='text-[36px] font-bold mb-[30px] text-center'>{t.return_summary}</div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>{t.items_returned_label}:</span>
              <span>{displayCheckins?.length || 0}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>{t.on_time_label}</span>
              <span>{onTimeCount} {onTimeCount === 1 ? t.item_singular : t.items_plural}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
              <span>{t.on_hold_label}</span>
              <span>{holdCount} {holdCount === 1 ? t.item_singular : t.items_plural}</span>
            </div>
            <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
              <span>{t.overdue_label_summary}</span>
              <span>{overdueCount} {overdueCount === 1 ? t.item_singular : t.items_plural}</span>
            </div>
            <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
              <span>{t.late_fees_label}</span>
              <span>₱0</span>
            </div>
          </div>

          {/* List of returned items with dynamic status indicators */}
          <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
            <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
              <div className='text-[32px]'>{t.returned_items_label}</div>
            </div>
            <div className='flex flex-col gap-5'>
              {itemsWithStatus && itemsWithStatus.length > 0 ? itemsWithStatus.map((item, index) => {
                const now = new Date();

                // Define visual styles based on item condition
                let statusColor = '#3498db'; // Default Blue
                let statusEmoji = '📘';

                if (item.isOverdue) {
                    statusColor = '#e74c3c'; // Red
                    statusEmoji = '📕';
                }

                if (item.isOnHold) {
                  statusColor = '#f39c12'; // Orange
                  statusEmoji = '📙';
                }

                return (
                  <div 
                    key={index} 
                    className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[5px]'
                    style={{ borderLeftColor: statusColor }}
                  >
                    <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>
                    <div>
                      <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{item.title}</div>
                      <div className='text-[20px] text-[rgb(127_140_141)]'>{t.returned_on} {formatDate(now)} </div>
                      
                      {/* Detailed status messaging */}
                      {item.isOnHold ? (
                        <div className='text-[22px] font-bold' style={{ color: statusColor }}>
                          {t.on_hold}
                        </div>
                      ) : item.isOverdue ? (
                        <div className='text-[22px] font-bold' style={{ color: statusColor }}>
                          {item.daysLate} {item.daysLate === 1 ? t.day_late_text : t.days_late_text}
                        </div>
                      ) : (
                        <div className='text-[#3498db] text-[22px] font-bold'>
                          {t.returned_on_time}
                        </div>
                      )}
                    </div>
                    {/* Warning icon for alerts, checkmark for standard returns */}
                    <div className='ml-auto text-[24px]' style={{ color: statusColor }}>
                      {(item.isOverdue || item.isOnHold) ? '⚠️' : '✓'}
                    </div>
                  </div>
                );
              }) : <div className="text-center text-gray-500">{t.no_items_display}</div>}
            </div>
          </div>

          {/* Payment CTA for potential fines */}
          <div className='bg-[#e3f2fd] rounded-[15px] p-[30px] my-[25px]'>
            <div className='text-[30px] font-bold text-[#1565c0] mb-[20px] flex items-center gap-[15px]'>💳 {t.pay_fine_now}</div>
            <div className='grid grid-cols-2 gap-[25px] my-[25px]'>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105' onClick={() => handlePayNow()}>
                <div className="text-[80px] mb-[15px]">💳</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">{t.pay_now}</div>
              </div>
              <div className='bg-white border border-[3px] border-solid border-[#bdc3c7] rounded-[15px] py-[40px] px-[30px] text-center cursor-pointer transition-all duration-300 hover:border-[#2ecc71] hover:scale-105' onClick={() => handlePayNow()}>
                <div className="text-[80px] mb-[15px]">🏦</div>
                <div className="text-[26px] font-bold text-[#2c3e50]">{t.pay_later}</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Fallback UI if the user accesses the page directly without transaction data
  return (
    <div className='flex items-center justify-center h-screen'>
      <button onClick={() => navigate('/home')} className='p-4 bg-blue-500 text-white rounded'>{t.back_home}</button>
    </div>
  );
}

export default SuccessPage;