import { useState } from 'react';
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useKiosk } from '../context/KioskContext';
import { translations } from '../utils/translations'; // Import

const HelpPage = () => {
  const [expandedId, setExpandedId] = useState(null);
  const { language } = useKiosk(); // Get language

  // Translation helper
 const t:any = (translations as any)[language ] || translations.EN;

  const toggleFaq = (id: any) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-40'>
        
        <div className='text-center text-[48px] mb-[40px] text-[#2c3e50] font-bold'>
            {t.help_title}
        </div>

        {/* Call Staff Card */}
        <div className='bg-gradient-to-br from-[#3498db] to-[#2c3e50] rounded-[20px] p-[40px] text-white mb-[40px] shadow-lg text-center'>
          <div className='text-[40px] font-bold mb-[10px]'>{t.need_help_title}</div>
          <div className='text-[26px] mb-[30px] opacity-90'>{t.need_help_desc}</div>
          <button className='bg-white text-[#2c3e50] w-full py-[25px] rounded-[15px] text-[32px] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-4'>
            📞 {t.call_staff_btn}
          </button>
        </div>

        {/* FAQ Section */}
        <div className='bg-[rgb(236_240_241)] p-[35px] rounded-[20px] mb-[40px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6 text-[36px] flex justify-between items-center'>
            <span>{t.faq_header}</span>
          </div>
          
          <div className='flex flex-col gap-6'>
            {t.faqs.map((faq: any) => (
              <div 
                key={faq.id} 
                onClick={() => toggleFaq(faq.id)}
                className={`flex flex-col bg-white rounded-[15px] p-[30px] border-l-solid border-l-[10px] shadow-sm active:bg-gray-50 cursor-pointer transition-all duration-300`} 
                style={{ borderLeftColor: faq.color }}
              >
                <div className='flex items-center'>
                    <div className='text-[55px] min-w-[70px] mr-6'>{faq.icon}</div>
                    <div className='flex-grow'>
                        <div className='text-[28px] font-bold text-[#2c3e50] leading-tight'>
                            {faq.q}
                        </div>
                    </div>
                    <div className={`text-[35px] text-gray-300 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-90' : ''}`}>❯</div>
                </div>
                
                {/* Expandable Answer */}
                {expandedId === faq.id && (
                    <div className='mt-6 pt-6 border-t border-gray-100 text-[26px] text-[#546e7a] leading-relaxed animate-fadeIn'>
                        {faq.a}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 mb-5 text-center'>
            <div className='text-[24px] text-gray-400 font-medium'>{t.kiosk_info}</div>
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