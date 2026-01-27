import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext'
import { useEffect } from 'react'
import axios from 'axios'
import { formatDate } from '../utils/formatDate'
import { translations } from '../utils/translations' // Import

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
    holds,
    allHolds,
    setAllHolds,
    language // Get language
  } = useKiosk()

  const t:any = (translations as any)[language ] || translations.EN;

  useEffect(() => {
    if (!patronId) {
      setHolds([]);
      setCheckouts([]);
      return;
    };

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

    const fetchAllHolds = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/holds`);
        setAllHolds(res.data);
      } catch (e) { console.error("Global holds fetch failed", e); }
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

    fetchCheckouts();
    fetchHolds();
    fetchAllHolds();
    fetchBiblios();
    fetchItems();

  }, [patronId, API_BASE]);

  const totalOverdueBooks = checkouts.reduce((totalOverdue, book) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(book.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? totalOverdue + 1 : totalOverdue
  }, 0)

  const getHoldDisplay = (hold: any) => {
    if (hold.waiting_date) {
      return { label: t.ready_pickup, color: '#2ecc71', icon: '✅', rightIcon: '📍' };
    }
    if (hold.transit_date) {
      return { label: t.in_transit, color: '#3498db', icon: '🚚', rightIcon: '📦' };
    }
    return {
      label: `${t.pending} (#${hold.priority} ${t.in_line})`,
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
        <div className='text-center text-[42px] mb-[35px] text-[#2c3e50] font-bold '>{t.acc_overview}</div>

        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>{t.curr_status}</div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.books_checked_out}</span>
            <span>{checkouts.length}</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.book_reservations}</span>
            <span className={readyHoldsCount > 0 ? "font-bold text-green-300" : ""}>
              {readyHoldsCount} {t.ready} ({holds.length} {t.total})
            </span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.overdue_books}</span>
            <span className={totalOverdueBooks > 0 ? "font-bold text-red-300" : ""}>{totalOverdueBooks}</span>
          </div>
          <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
            <span>{t.outstanding_fines}</span>
            <span>₱0</span>
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px] mb-[30px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-4 text-[32px]'>{t.currently_checked_out}</div>
          <div className='flex flex-col gap-5'>
            {checkouts.length > 0 ? checkouts.map((checkout: any) => {
              const item = (items as any[]).find((i: any) => i.item_id === checkout?.item_id);
              const biblio = (biblios as any[]).find((b: any) => b.biblio_id === item?.biblio_id);

              const isOnHold = allHolds.some((hold: any) =>
                Number(hold.biblio_id) === Number(biblio?.biblio_id) &&
                Number(hold.patron_id) !== Number(patronId)
              );

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dueDateObj = new Date(checkout.due_date);
              dueDateObj.setHours(0, 0, 0, 0);

              const diffInDaysNormalized = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              const isOverdue = diffInDaysNormalized < 0;
              const daysLate = Math.abs(diffInDaysNormalized);
              const daysLeft = diffInDaysNormalized;

              let statusColor = '#3498db';
              let statusEmoji = '📘';

              if (isOverdue) { statusColor = '#e74c3c'; statusEmoji = '📕'; }
              if (isOnHold) { statusColor = '#f39c12'; statusEmoji = '📙'; }

              return (
                <div key={checkout.checkout_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px]' style={{ borderLeftColor: statusColor }}>
                  <div className='text-[50px] min-w-[50px] mr-5'>{statusEmoji}</div>
                  <div className='flex-grow'>
                    <div className='text-[26px] font-bold text-[#2c3e50] leading-tight'>{biblio?.title || t.loading_title}</div>
                    <div className='text-[20px] text-[#7f8c8d]'>{t.due}: {formatDate(checkout.due_date)}</div>
                    <div className='text-[22px] font-bold' style={{ color: statusColor }}>
                      {isOnHold
                        ? t.on_hold
                        : isOverdue
                          ? `${daysLate} ${daysLate === 1 ? t.day_overdue : t.days_overdue}`
                          : `${daysLeft} ${t.days_left}`
                      }
                    </div>
                  </div>
                  <div className='text-[30px] ml-auto'>{(isOverdue || isOnHold) ? '⚠️' : '✓'}</div>
                </div>
              );
            }) : <div className="text-[22px] text-gray-500 italic">{t.no_checkouts}</div>}
          </div>
        </div>

        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-4 text-[32px]'>{t.my_holds_reserves}</div>
          <div className='flex flex-col gap-5'>
            {holds.length > 0 ? holds.map((hold: any) => {
              const biblioInfo = (biblios as any[]).find((b: any) => b.biblio_id === hold.biblio_id);
              const status = getHoldDisplay(hold);

              return (
                <div key={hold.hold_id} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[8px]' style={{ borderLeftColor: status.color }}>
                  <div className='text-[50px] min-w-[50px] mr-5'>{status.icon}</div>
                  <div className='flex-grow'>
                    <div className='text-[26px] font-bold text-[#2c3e50] leading-tight'>
                      {biblioInfo?.title || t.loading_title}
                    </div>
                    <div className='text-[20px] text-[#7f8c8d]'>{t.placed}: {formatDate(hold.hold_date)}</div>
                    <div className='text-[22px] font-bold' style={{ color: status.color }}>
                      {status.label}
                    </div>
                  </div>
                  <div className='text-[30px] ml-auto'>{status.rightIcon}</div>
                </div>
              );
            }) : <div className="text-[22px] text-gray-500 italic">{t.no_holds}</div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AccountPage;