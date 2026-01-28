import { useState } from 'react';
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext';
import { translations } from '../utils/translations'; // Import

const HelpPage = () => {
  // Local state to keep track of which FAQ item is currently expanded/opened
  const [expandedId, setExpandedId] = useState(null);
  
  // Access the current language setting from the global Kiosk Context
  const { language } = useKiosk(); 

  // Initialize the translation helper based on the current system language
  const t:any = (translations as any)[language ] || translations.EN;

  /**
   * Toggles the visibility of an FAQ answer.
   * If the clicked ID is already expanded, it closes it (sets to null).
   * Otherwise, it opens the selected ID.
   */
  const toggleFaq = (id: any) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    // Main container designed for a vertical Kiosk screen (1080x1920)
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-40'>
        
        {/* Page Title */}
        <div className='text-center text-[48px] mb-[40px] text-[#2c3e50] font-bold'>
            {t.help_title}
        </div>

        {/* Immediate Assistance Section: "Call Staff" Card */}
        <div className='bg-gradient-to-br from-[#3498db] to-[#2c3e50] rounded-[20px] p-[40px] text-white mb-[40px] shadow-lg text-center'>
          <div className='text-[40px] font-bold mb-[10px]'>{t.need_help_title}</div>
          <div className='text-[26px] mb-[30px] opacity-90'>{t.need_help_desc}</div>
          
          {/* Button used to trigger an alert/notification for library staff */}
          <button className='bg-white text-[#2c3e50] w-full py-[25px] rounded-[15px] text-[32px] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-4'>
            📞 {t.call_staff_btn}
          </button>
        </div>

        {/* Frequently Asked Questions (FAQ) Section */}
        <div className='bg-[rgb(236_240_241)] p-[35px] rounded-[20px] mb-[40px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6 text-[36px] flex justify-between items-center'>
            <span>{t.faq_header}</span>
          </div>
          
          <div className='flex flex-col gap-6'>
            {/* Map through the FAQs provided by the translation file for the current language */}
            {t.faqs.map((faq: any) => (
              <div 
                key={faq.id} 
                onClick={() => toggleFaq(faq.id)}
                className={`flex flex-col bg-white rounded-[15px] p-[30px] border-l-solid border-l-[10px] shadow-sm active:bg-gray-50 cursor-pointer transition-all duration-300`} 
                style={{ borderLeftColor: faq.color }}
              >
                <div className='flex items-center'>
                    {/* Visual representation for the specific FAQ category */}
                    <div className='text-[55px] min-w-[70px] mr-6'>{faq.icon}</div>
                    
                    <div className='flex-grow'>
                        <div className='text-[28px] font-bold text-[#2c3e50] leading-tight'>
                            {faq.q}
                        </div>
                    </div>

                    {/* Chevron icon that rotates when the item is expanded */}
                    <div className={`text-[35px] text-gray-300 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-90' : ''}`}>❯</div>
                </div>
                
                {/* Expandable Answer Section: Only rendered if this specific ID is active */}
                {expandedId === faq.id && (
                    <div className='mt-6 pt-6 border-t border-gray-100 text-[26px] text-[#546e7a] leading-relaxed animate-fadeIn'>
                        {faq.a}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System Information and Troubleshooting */}
        <div className='grid grid-cols-1 gap-6 mb-5 text-center'>
            <div className='text-[24px] text-gray-400 font-medium'>{t.kiosk_info}</div>
            
            {/* Action button for reporting hardware or software issues */}
            <button className='flex items-center justify-center gap-4 bg-[#f8f9fa] border-2 border-dashed border-gray-300 p-8 rounded-[20px] text-[30px] font-bold text-[#7f8c8d] active:bg-gray-200'>
                📝 {t.report_problem_btn}
            </button>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}

export default HelpPage;