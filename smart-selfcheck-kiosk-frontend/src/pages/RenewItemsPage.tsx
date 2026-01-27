import { useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/formatDate';
import { diffInDaysAccountPage } from '../utils/dueDateFormulate';
import { translations } from '../utils/translations'; // Import translations

const RenewItemsPage = () => {
  const { patronId, checkouts, setCheckouts, biblios, setBiblios, items, setItems, API_BASE, language } = useKiosk();
  
  // Translation helper
  const t:any = (translations as any)[language ] || translations.EN;
  // 1. Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [checkoutsRes, bibliosRes, itemsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`),
          axios.get(`${API_BASE}/api/v1/biblios`),
          axios.get(`${API_BASE}/api/v1/items`)
        ]);
        setCheckouts(checkoutsRes.data);
        setBiblios(bibliosRes.data);
        setItems(itemsRes.data);
      } catch (e) {
        console.error("Data fetch failed", e);
      }
    };
    fetchData();
  }, [patronId, API_BASE]);

  // 2. Renewal Handler
  const handleRenew = async (checkoutId: number, title: string) => {
    const result = await Swal.fire({
      title: t.confirm_renewal,
      text: `${t.extend_ask} "${title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3498db',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: t.yes_renew
    });

    if (result.isConfirmed) {
      Swal.showLoading();
      try {
        const response = await axios.post(`${API_BASE}/api/v1/renew`, {
          checkout_id: checkoutId
        });

        if (response.data) {
          Swal.fire({
            title: t.renewal_success,
            text: `${t.new_due_date}: ${formatDate(response.data.due_date)}`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });

          const updatedCheckouts = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
          setCheckouts(updatedCheckouts.data);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || "";
        let friendlyMessage = t.err_generic;

        if (errorMsg.includes("too_many_holds")) {
          friendlyMessage = t.err_reserved;
        } else if (errorMsg.includes("too_many_renewals")) {
          friendlyMessage = t.err_limit;
        } else if (errorMsg.includes("overdue") || errorMsg.includes("restriction")) {
          friendlyMessage = t.err_overdue;
        }

        Swal.fire({
          title: t.renewal_blocked,
          text: friendlyMessage,
          icon: 'error'
        });
      }
    }
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold'>{t.renew_books}</div>

        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[20px] text-center'>{t.renewal_eligibility}</div>
          <div className='text-[24px] text-center opacity-90 mb-[30px]'>
            {t.select_item_extend}
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.renewable_items}</span>
            <span>{checkouts.length}</span>
          </div>
          <div className='flex justify-between py-[15px] text-[26px]'>
            <span>{t.std_extension}</span>
            <span>{t.plus_14_days}</span>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6'>
            <div className='text-[32px]'>{t.your_borrowed_books}</div>
          </div>

          <div className='flex flex-col gap-5'>
            {checkouts.map((checkout: any) => {
              const itemInfo = (items as any[]).find((i: any) => i.item_id === checkout?.item_id);
              const biblioInfo = (biblios as any[]).find((b: any) => b.biblio_id === itemInfo?.biblio_id);
              const title = biblioInfo?.title || t.loading_title;
              const isOverdue = diffInDaysAccountPage(checkout) <= 0;

              return (
                <div key={checkout.checkout_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[#3498db] border-l-[8px] shadow-sm'>
                  <div className='text-[60px] min-w-[60px] mr-6'>📖</div>

                  <div className='flex-grow'>
                    <div className='text-[28px] font-bold text-[#2c3e50] leading-tight mb-1'>
                      {title}
                    </div>
                    <div className='text-[20px] text-[#7f8c8d] mb-2'>
                      {t.current_due}: {formatDate(checkout.due_date)}
                    </div>

                    <div className='flex items-center gap-3'>
                      <span className={`text-[18px] px-3 py-1 rounded-full font-bold ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isOverdue ? t.overdue_label : t.active_loan}
                      </span>
                      <span className='text-[18px] text-gray-400'>
                        | {t.renewals_used}: {checkout.renewals_count || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRenew(checkout.checkout_id, title)}
                    className='bg-[#3498db] hover:bg-[#2980b9] text-white px-[35px] py-[20px] rounded-[12px] text-[24px] font-bold transition-all active:scale-95 shadow-md flex items-center gap-2'
                  >
                    🔄 {t.renew_btn}
                  </button>
                </div>
              );
            })}

            {checkouts.length === 0 && (
              <div className="text-center py-20 text-[28px] text-gray-500">
                {t.no_items_checked_out}
              </div>
            )}
          </div>
        </div>

        <div className='bg-[#e3f2fd] border-l-[5px] border-l-solid border-l-[#1565c0] rounded-[20px] p-[30px] mt-[30px]'>
          <div className="text-[26px] font-bold text-[#1565c0] mb-[10px] flex items-center gap-[10px]">
            ℹ️ {t.renewal_policy}
          </div>
          <div className="text-[20px] text-[#1565c0] opacity-80">
            {t.renewal_policy_text}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RenewItemsPage;