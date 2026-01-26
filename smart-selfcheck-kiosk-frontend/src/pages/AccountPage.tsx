import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext'
import { useEffect } from 'react'
import axios from 'axios'
import { formatDate } from '../utils/formatDate'
import { diffInDaysAccountPage } from '../utils/dueDateFormulate'

const AccountPage = () => {
  const {
    checkouts,
    setCheckouts,
    setBiblios,
    biblios,
    items,
    setItems,
    patronId,
    API_BASE,
    setHolds,
    holds
  } = useKiosk()

  useEffect(() => {
    if (!patronId) {
      setHolds([]);
      setCheckouts([]);
      return;
    };

    // --- INDIVIDUAL FETCHERS ---

    const fetchCheckouts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
        setCheckouts(res.data);
      } catch (e) { console.error("Checkouts fetch failed", e); }
    };

    const fetchHolds = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/holds?patronId=${patronId}`);
        setHolds(res.data);
      } catch (e) { console.error("Holds fetch failed", e); }
    };

    const fetchBiblios = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/biblios`);
        setBiblios(res.data);
      } catch (e) { console.error("Biblios fetch failed", e); }
    };

    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/items`);
        setItems(res.data);
      } catch (e) { console.error("Items fetch failed", e); }
    };

    // Fire them all independently. They will update the UI as soon as they arrive.
    fetchCheckouts();
    fetchHolds();
    fetchBiblios();
    fetchItems();

  }, [patronId, API_BASE]);


  const totalOverdueBooks = checkouts.reduce((totalOverdue, book) => {
    const now = new Date()
    const dueDate = new Date(book.due_date)
    return dueDate < now ? totalOverdue + 1 : totalOverdue
  }, 0)

  const getHoldDisplay = (hold: any) => {
    if (hold.waiting_date) {
      return { label: 'READY FOR PICKUP', color: '#2ecc71', icon: '✅', rightIcon: '📍' };
    }
    if (hold.transit_date) {
      return { label: 'IN TRANSIT', color: '#3498db', icon: '🚚', rightIcon: '📦' };
    }
    return {
      label: `PENDING (#${hold.priority} in line)`,
      color: '#f39c12',
      icon: '⏳',
      rightIcon: '💤'
    };
  };

  const readyHoldsCount = holds.filter(h => h.waiting_date).length;

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold '>Account Overview</div>

        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>Current Status</div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Items Checked Out:</span>
            <span>{checkouts.length}</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Items on Hold:</span>
            <span className={readyHoldsCount > 0 ? "font-bold text-green-300" : ""}>
              {readyHoldsCount} ready ({holds.length} total)
            </span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>Overdue Items:</span>
            <span className={totalOverdueBooks > 0 ? "font-bold text-red-300" : ""}>{totalOverdueBooks}</span>
          </div>
          <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
            <span>Outstanding Fines:</span>
            <span>₱0</span>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px] mb-[30px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-4 text-[32px]'>Currently Checked Out</div>
          <div className='flex flex-col gap-5'>
            {checkouts.length > 0 ? checkouts.map((checkout: any) => {
              const item = (items as any[]).find((i: any) => i.item_id === checkout?.item_id);
              const biblio = (biblios as any[]).find((b: any) => b.biblio_id === item?.biblio_id);
              const diff = diffInDaysAccountPage(checkout);
              const isOverdue = diff <= 0;
              const daysLate = Math.max(1, Math.abs(diff));

              let statusColor = '#3498db';
              let statusEmoji = '📘';
              if (isOverdue) {
                statusColor = '#e74c3c';
                statusEmoji = '📕';
              }

              return (
                <div key={checkout.checkout_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px]' style={{ borderLeftColor: statusColor }}>
                  <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>
                  <div className='flex-grow'>
                    <div className='text-[26px] font-bold text-[#2c3e50] leading-tight'>{biblio?.title || "Loading Title..."}</div>
                    <div className='text-[20px] text-[#7f8c8d]'>Due: {formatDate(checkout.due_date)}</div>
                    <div className='text-[22px] font-bold' style={{ color: statusColor }}>
                      {isOverdue ? `${daysLate} ${daysLate === 1 ? 'day' : 'days'} overdue` : `${diff} days left`}
                    </div>
                  </div>
                  <div className='text-[30px] ml-auto'>{isOverdue ? '⚠️' : '✓'}</div>
                </div>
              );
            }) : <div className="text-[22px] text-gray-500 italic">No items checked out.</div>}
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-4 text-[32px]'>My Holds & Reserves</div>
          <div className='flex flex-col gap-5'>
            {holds.length > 0 ? holds.map((hold: any) => {
              const biblioInfo = (biblios as any[]).find((b: any) => b.biblio_id === hold.biblio_id);
              const status = getHoldDisplay(hold);

              return (
                <div key={hold.hold_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px]' style={{ borderLeftColor: status.color }}>
                  <div className='text-[50px] min-w-[50px] mr-5'>{status.icon}</div>
                  <div className='flex-grow'>
                    <div className='text-[26px] font-bold text-[#2c3e50] leading-tight'>
                      {biblioInfo?.title || "Loading Title..."}
                    </div>
                    <div className='text-[20px] text-[#7f8c8d]'>Placed: {formatDate(hold.hold_date)}</div>
                    <div className='text-[22px] font-bold' style={{ color: status.color }}>
                      {status.label}
                    </div>
                  </div>
                  <div className='text-[30px] ml-auto'>{status.rightIcon}</div>
                </div>
              );
            }) : <div className="text-[22px] text-gray-500 italic">No active holds.</div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AccountPage;