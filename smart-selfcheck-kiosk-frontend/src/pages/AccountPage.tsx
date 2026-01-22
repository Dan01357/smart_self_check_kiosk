import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext'
import { useEffect } from 'react'
import axios from 'axios'
import { formatDate } from '../utils/formatDate'
import { diffInDaysAccountPage } from '../utils/dueDateFormulate'

const AccountPage = () => {
  // Data is pulled from KioskContext (which hydrates from LocalStorage)
  const { checkouts, setCheckouts, setBiblios, biblios, items, setItems, patronId } = useKiosk()
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // Only fetch if we have a valid patronId
    if (!patronId) return;

    const fetchCheckouts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
        setCheckouts(response.data);
      } catch (e) { console.error("Checkout fetch failed", e); }
    }
    const fetchBiblios = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/biblios`);
        setBiblios(response.data);
      } catch (e) { console.error("Biblio fetch failed", e); }
    }
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/items`);
        setItems(response.data);
      } catch (e) { console.error("Items fetch failed", e); }
    }

    fetchCheckouts();
    fetchBiblios();
    fetchItems();
  }, [patronId, API_BASE, setCheckouts, setBiblios, setItems]);

  const totalOverdueBooks = checkouts.reduce((totalOverdue, book)=>{
    const now = new Date()
    const dueDate = new Date(book.due_date)
    return dueDate < now ? totalOverdue + 1 : totalOverdue
  },0)

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold '>Account Overview</div>

        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px]'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>Current Status</div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
            <span>Items Checked Out:</span>
            <span>{checkouts.length}</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30  text-[26px]'>
            <span>Items on Hold:</span>
            <span>0 ready</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Overdue Items:</span>
            <span>{totalOverdueBooks}</span>
          </div>
          <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
            <span>Outstanding Fines:</span>
            <span>$0</span>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>Currently Checked Out</div>
          </div>
          <div className='flex flex-col gap-5'>
            {checkouts.map((checkout: any) => {
              // Lookup logic using persisted data
              const item = (items as any[]).find((i: any) => i.item_id === checkout?.item_id);
              const biblio = (biblios as any[]).find((b: any) => b.biblio_id === item?.biblio_id);

              return (
                <div key={checkout.checkout_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[rgb(46_204_113)] border-l-[5px]'>
                  <div className='text-[50px] min-w-[50px] mr-5'>📘</div>
                  <div>
                    <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>
                      {biblio?.title || "Loading Title..."}
                    </div>
                    <div className='text-[20px] text-[rgb(127_140_141)]'>Due: {formatDate(checkout.due_date)} </div>
                    
                    {diffInDaysAccountPage(checkout) > 0
                      ? <div className='text-[#2ecc71] text-[22px] font-bold'>
                        {`${diffInDaysAccountPage(checkout)} days left`}
                      </div>
                      : <div className='text-[#e74c3c] text-[22px] font-bold'>
                        {`${Math.abs(diffInDaysAccountPage(checkout)) === 0 || Math.abs(diffInDaysAccountPage(checkout)) === 1 
                          ? '1 day overdue'
                          : `${Math.abs(diffInDaysAccountPage(checkout))} days overdue`
                        }`}
                      </div>}
                  </div>
                  <div className='text-[rgb(46_204_113)] ml-auto'>✓</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default AccountPage;