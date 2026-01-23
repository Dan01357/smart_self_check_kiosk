import { useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/formatDate';
import { diffInDaysAccountPage } from '../utils/dueDateFormulate';

const RenewItemsPage = () => {
  const { patronId, checkouts, setCheckouts, biblios, setBiblios, items, setItems } = useKiosk();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  // 1. Initial Data Fetching (Same logic as Account Page)
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
      title: 'Confirm Renewal',
      text: `Would you like to extend the due date for "${title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3498db',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Yes, Renew it'
    });

    if (result.isConfirmed) {
      Swal.showLoading();
      try {
        // Calling the renewal endpoint (assumes you added this to your Express backend)
        const response = await axios.post(`${API_BASE}/api/v1/renew`, {
          checkout_id: checkoutId
        });

        if (response.data) {
          Swal.fire({
            title: 'Renewal Success!',
            text: `New due date: ${formatDate(response.data.due_date)}`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });

          // Refresh the list to show the new due date
          const updatedCheckouts = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
          setCheckouts(updatedCheckouts.data);
        }
      } catch (error: any) {
        // 1. Log the actual error to your browser console so you can see it!
        console.log("Full Error Object:", error.response?.data);

        const errorMsg = error.response?.data?.error || "";

        let friendlyMessage = "This item cannot be renewed at this time.";

        // 2. Add more conditions based on common Koha error strings
        if (errorMsg.includes("too_many_holds")) {
          friendlyMessage = "This item is reserved for another patron.";
        } else if (errorMsg.includes("too_many_renewals")) {
          friendlyMessage = "Maximum renewal limit reached.";
        } else if (errorMsg.includes("overdue") || errorMsg.includes("restriction")) {
          // This is likely what is happening now
          friendlyMessage = "Cannot renew an overdue item. Please see the librarian.";
        }

        Swal.fire({
          title: 'Renewal Blocked',
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
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold'>Renew Books</div>

        {/* --- STATUS SUMMARY CARD --- */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[20px] text-center'>Renewal Eligibility</div>
          <div className='text-[24px] text-center opacity-90 mb-[30px]'>
            Select an item below to extend your borrowing period.
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Renewable Items:</span>
            <span>{checkouts.length}</span>
          </div>
          <div className='flex justify-between py-[15px] text-[26px]'>
            <span>Standard Extension:</span>
            <span>+14 Days</span>
          </div>
        </div>

        {/* --- ITEMS LIST --- */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6'>
            <div className='text-[32px]'>Your Borrowed Books</div>
          </div>

          <div className='flex flex-col gap-5'>
            {checkouts.map((checkout: any) => {
              // Lookup Title
              const itemInfo = (items as any[]).find((i: any) => i.item_id === checkout?.item_id);
              const biblioInfo = (biblios as any[]).find((b: any) => b.biblio_id === itemInfo?.biblio_id);
              const title = biblioInfo?.title || "Unknown Title";

              const isOverdue = diffInDaysAccountPage(checkout) <= 0;

              return (
                <div key={checkout.checkout_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[#3498db] border-l-[8px] shadow-sm'>
                  <div className='text-[60px] min-w-[60px] mr-6'>📖</div>

                  <div className='flex-grow'>
                    <div className='text-[28px] font-bold text-[#2c3e50] leading-tight mb-1'>
                      {title}
                    </div>
                    <div className='text-[20px] text-[#7f8c8d] mb-2'>
                      Current Due: {formatDate(checkout.due_date)}
                    </div>

                    {/* Status Badge */}
                    <div className='flex items-center gap-3'>
                      <span className={`text-[18px] px-3 py-1 rounded-full font-bold ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isOverdue ? 'Overdue' : 'Active Loan'}
                      </span>
                      <span className='text-[18px] text-gray-400'>
                        | Renewals used: {checkout.renewals_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Renew Button */}
                  <button
                    onClick={() => handleRenew(checkout.checkout_id, title)}
                    className='bg-[#3498db] hover:bg-[#2980b9] text-white px-[35px] py-[20px] rounded-[12px] text-[24px] font-bold transition-all active:scale-95 shadow-md flex items-center gap-2'
                  >
                    🔄 Renew
                  </button>
                </div>
              );
            })}

            {checkouts.length === 0 && (
              <div className="text-center py-20 text-[28px] text-gray-500">
                You have no items currently checked out.
              </div>
            )}
          </div>
        </div>

        {/* --- INFO BOX --- */}
        <div className='bg-[#e3f2fd] border-l-[5px] border-l-solid border-l-[#1565c0] rounded-[20px] p-[30px] mt-[30px]'>
          <div className="text-[26px] font-bold text-[#1565c0] mb-[10px] flex items-center gap-[10px]">
            ℹ️ Renewal Policy
          </div>
          <div className="text-[20px] text-[#1565c0] opacity-80">
            Items cannot be renewed if they are reserved by another patron or if the maximum renewal limit has been reached.
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RenewItemsPage;