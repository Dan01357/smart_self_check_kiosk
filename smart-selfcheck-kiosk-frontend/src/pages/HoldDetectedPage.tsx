import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import { translations } from '../utils/translations'; // Import

const HoldDetectedPage = () => {
  const { patrons, items, biblios, displayHolds, language } = useKiosk();

  // Translation helper
  const t:any = (translations as any)[language ] || translations.EN;

  const rawHolds = displayHolds || [];

  const displayHoldsDetect = rawHolds
    .filter((hold: any) => Number(hold.priority) === 1)
    .map((hold: any) => {
      const biblioMatch = biblios.find(b => Number(b.biblio_id) === Number(hold.biblio_id));
      const itemMatch = items.find(i => 
        (hold.item_id && Number(i.item_id) === Number(hold.item_id)) || 
        (Number(i.biblio_id) === Number(hold.biblio_id))
      );
      const patronMatch = patrons.find(p => Number(p.patron_id) === Number(hold.patron_id));

      return {
        ...hold,
        title: biblioMatch?.title || t.loading_title,
        barcode: itemMatch?.external_id || itemMatch?.item_id || hold.item_id || "N/A",
        patronName: patronMatch ? `${patronMatch.firstname} ${patronMatch.surname}` : `Patron #${hold.patron_id}`,
        pickupBranch: hold.pickup_library_id || t.main_library
      };
    });

  const uniquePatronNames: any[] = Array.from(new Set(displayHoldsDetect.map((h: any) => h.patronName)));
  const uniqueBranches: any[] = Array.from(new Set(displayHoldsDetect.map((h: any) => h.pickupBranch)));

  if (displayHoldsDetect.length === 0) {
    return (
      <div className='max-w-[1080px] min-h-[1920px] m-auto bg-white'>
        <Header />
        <div className='pt-60 p-[40px] text-center text-[30px]'>{t.no_priority_holds}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-30'>

        {/* --- MAIN WARNING BANNER --- */}
        <div className='bg-[#fff3e0] border-l-[#f39c12] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
          <div className='text-[120px] mb-[20px] animate-bounce'>⚠️</div>
          <div className='text-[40px] text-[#e65100] font-bold mb-[15px] uppercase'>{t.hold_detected_banner}</div>
          <div className='text-[26px] text-[#e65100]'>
            {displayHoldsDetect.length > 1
              ? `${displayHoldsDetect.length} ${t.books_reserved_plural}`
              : t.book_reserved_singular}
          </div>
        </div>

        {/* --- SUMMARY CARD --- */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>{t.hold_info_title}</div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px] items-start'>
            <span>{t.hold_patrons_label}</span>
            <div className='text-right'>
              {uniquePatronNames.map((name, i) => (
                <div key={i} className='font-medium'>{name}</div>
              ))}
            </div>
          </div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.pickup_branch_label}</span>
            <span>{uniqueBranches.join(', ') || t.main_library}</span>
          </div>
          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.status_label}</span>
            <span>{t.res_priority_1}</span>
          </div>
          <div className='text-[34px] font-bold mt-[15px] pt-[25px] border-t border-t-[3px] border-t-solid border-t-white/50 flex justify-between'>
            <span>{t.notif_sent_label}</span>
            <span>{t.notif_channels}</span>
          </div>
        </div>

        {/* --- ITEM DISPLAY LIST --- */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px] mb-8'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>{t.book_details_label}</div>
          </div>
          <div className='flex flex-col gap-5'>
            {displayHoldsDetect.map((hold: any, index: number) => (
              <div key={index} className='flex bg-white rounded-[12px] items-center p-[25px] border-l-solid border-l-[#f39c12] border-l-[5px] shadow-sm'>
                <div className='text-[50px] min-w-[50px] mr-5'>📙</div>
                <div>
                  <div className='text-[26px] font-bold text-[rgb(44_62_80)]'>{hold.title}</div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>
                    {t.barcode_label} <span className='text-black font-bold'>{hold.barcode}</span>
                  </div>
                  <div className='text-[20px] text-[rgb(127_140_141)]'>{t.reserved_for} {hold.patronName}</div>
                  <div className='text-[#f39c12] text-[22px] font-bold'>{t.awaiting_pickup}</div>
                </div>
                <div className='ml-auto text-[32px]'>📌</div>
              </div>
            ))}
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className='bg-[#fff3e0] border-l border-l-[#f39c12] rounded-[15px] p-[30px] mb-[30px] flex gap-5 items-start border-l-[6px] border-l-solid text-[#e65100]'>
          <div className='text-[40px]'>📚</div>
          <div>
            <div className='text-[26px] font-bold'>{t.routed_title}</div>
            <div className='text-[20px] opacity-90'>{t.routed_desc}</div>
          </div>
        </div>

        <div className='bg-[#e3f2fd] border-l-[#2196f3] border-l-[8px] border-l-solid rounded-[15px] p-[30px] flex gap-5 items-start mb-10'>
          <div className='text-[40px]'>✅</div>
          <div>
            <div className='text-[28px] font-bold text-[#1565c0]'>{t.no_action_title}</div>
            <div className='text-[22px] text-[#0d47a1]'>{t.no_action_desc}</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HoldDetectedPage;