import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import { translations } from '../utils/translations';
import axios from 'axios';

/**
 * HoldDetectedPage Component
 * 
 * This page is displayed when a patron returns a book that is reserved (on hold) 
 * by another patron. It informs the current user that the book should be placed 
 * on the hold shelf rather than returned to the general collection.
 */
const HoldDetectedPage = () => {
  // Destructuring necessary state and configuration from global Kiosk context
  const { displayHolds, language, API_BASE } = useKiosk();
  
  // Local state to store hold data enriched with Patron Names and Book Titles
  const [hydratedHolds, setHydratedHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Translation helper based on the current kiosk language
  const t: any = (translations as any)[language] || translations.EN;

  /**
   * Data Hydration Effect:
   * Converts raw hold data (IDs) into human-readable details (Names/Titles).
   */
  useEffect(() => {
    const fetchHoldDetails = async () => {
      // Exit if there are no holds detected
      if (!displayHolds || displayHolds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Call backend utility to match patron IDs with names and biblio IDs with titles
        const response = await axios.post(`${API_BASE}/api/v1/hydrate-detected-holds`, {
          holds: displayHolds
        });
        
        // Filter the list to only show patrons who are first in the queue (Priority 1)
        const priorityHolds = response.data.filter((h: any) => Number(h.priority) === 1);
        setHydratedHolds(priorityHolds);
      } catch (err) {
        console.error("Failed to hydrate holds", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldDetails();
  }, [displayHolds, API_BASE]);

  // Derived helper arrays for the Summary Card UI
  const uniquePatronNames = Array.from(new Set(hydratedHolds.map((h: any) => h.patronName)));
  const uniqueBranches = Array.from(new Set(hydratedHolds.map((h: any) => h.pickup_library_id || t.main_library)));

  // Fallback UI if the process finishes and no priority holds were found
  if (!loading && hydratedHolds.length === 0) {
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
        {/* Visually alerts the patron that the return requires special handling */}
        <div className='bg-[#fff3e0] border-l-[#f39c12] border-l-[5px] border-l-solid rounded-[10px] p-[40px] my-[30px] text-center'>
          <div className='text-[120px] mb-[20px] animate-bounce'>⚠️</div>
          <div className='text-[40px] text-[#e65100] font-bold mb-[15px] uppercase'>{t.hold_detected_banner}</div>
          <div className='text-[26px] text-[#e65100]'>
            {loading ? "..." : hydratedHolds.length > 1
              ? `${hydratedHolds.length} ${t.books_reserved_plural}`
              : t.book_reserved_singular}
          </div>
        </div>

        {/* --- SUMMARY CARD --- */}
        {/* Displays a high-level summary of the hold destination and priority */}
        <div className='bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-[40px] text-white mb-[30px] shadow-lg'>
          <div className='text-[36px] font-bold mb-[30px] text-center'>{t.hold_info_title}</div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px] items-start'>
            <span>{t.hold_patrons_label}</span>
            <div className='text-right'>
              {loading ? "..." : uniquePatronNames.map((name: any, i) => (
                <div key={i} className='font-medium'>{name}</div>
              ))}
            </div>
          </div>

          <div className='flex justify-between py-[15px] border-b-[2px] border-b-solid border-b-white/30 text-[26px]'>
            <span>{t.pickup_branch_label}</span>
            <span>{loading ? "..." : uniqueBranches.join(', ') || t.main_library}</span>
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
        {/* Lists each specific book that has a hold attached to it */}
        <div className='bg-[rgb(236_240_241)] p-[30px] rounded-[15px] mb-8'>
          <div className='font-bold text-[rgb(44_62_80)] flex items-center justify-between mb-4'>
            <div className='text-[32px]'>{t.book_details_label}</div>
          </div>
          <div className='flex flex-col gap-5'>
            {loading ? (
              <div className="text-center py-10 text-[22px] text-gray-500 italic">{t.scanning_items}...</div>
            ) : hydratedHolds.map((hold: any, index: number) => (
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

        {/* INSTRUCTIONS SECTION */}
        {/* Guides the patron on where to physically place the item */}
        <div className='bg-[#fff3e0] border-l border-l-[#f39c12] rounded-[15px] p-[30px] mb-[30px] flex gap-5 items-start border-l-[6px] border-l-solid text-[#e65100]'>
          <div className='text-[40px]'>📚</div>
          <div>
            <div className='text-[26px] font-bold'>{t.routed_title}</div>
            <div className='text-[20px] opacity-90'>{t.routed_desc}</div>
          </div>
        </div>

        {/* REASSURANCE SECTION */}
        {/* Confirms the transaction is safe and no manual library action is required */}
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