import { useState } from 'react';
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'

const HelpPage = () => {
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    // { 
    //     id: 1, 
    //     icon: '💳', 
    //     question: 'How do I scan my library card?', 
    //     answer: 'Place your library card barcode-side up under the red scanner beam located below the screen. If it doesn’t scan, try moving it slightly higher or lower.',
    //     color: '#3498db' 
    // },
    { 
        id: 2, 
        icon: '📖', 
        question: 'How many books can I scan at once?', 
        answer: 'You can place up to 5 books on the scanning pad at a time. Wait for all titles to appear on the screen and turn green before removing them.',
        color: '#9b59b6' 
    },
    { 
        id: 3, 
        icon: '❌', 
        question: 'Why is my item showing a red "X"?', 
        answer: 'This usually means the item is on hold for another patron or the security tag wasn’t deactivated. Please take the book to the staff desk.',
        color: '#e74c3c' 
    },
    { 
        id: 4, 
        icon: '🧾', 
        question: 'Will I get a receipt?', 
        answer: 'Yes! After you tap "Finish," you can choose to print a paper receipt, have it emailed to you, or view it on the screen.',
        color: '#1abc9c' 
    },
    { 
        id: 5, 
        icon: '🔄', 
        question: 'Can I return books here?', 
        answer: 'Yes. Select "Return Items" on the home screen and place your books on the pad. You do not need your library card to return items.',
        color: '#34495e' 
    },
    { 
        id: 6, 
        icon: '⚠️', 
        question: 'Why is my account blocked?', 
        answer: 'Accounts are usually blocked if you have over ₱100 in fines or if your library card has expired. Please see a staff member to clear your account.',
        color: '#e67e22' 
    },
    { 
        id: 7, 
        icon: '🎬', 
        question: 'Can I checkout DVDs or Magazines?', 
        answer: 'Yes, but please ensure DVDs are removed from their locking cases at the staff station after scanning them here.',
        color: '#2ecc71' 
    },
    { 
        id: 8, 
        icon: '📍', 
        question: 'Where do I find my reserved books?', 
        answer: 'Reserved (Hold) items are kept on the "Hold Shelf" near the entrance, organized alphabetically by your last name.',
        color: '#7f8c8d' 
    }
  ];

  const toggleFaq = (id:any) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-40'>
        
        <div className='text-center text-[48px] mb-[40px] text-[#2c3e50] font-bold'>
            Help & Support
        </div>

        {/* Call Staff Card */}
        <div className='bg-gradient-to-br from-[#3498db] to-[#2c3e50] rounded-[20px] p-[40px] text-white mb-[40px] shadow-lg text-center'>
          <div className='text-[40px] font-bold mb-[10px]'>Need Immediate Help?</div>
          <div className='text-[26px] mb-[30px] opacity-90'>If the kiosk is malfunctioning or a book won't scan:</div>
          <button className='bg-white text-[#2c3e50] w-full py-[25px] rounded-[15px] text-[32px] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-4'>
            📞 Call Library Staff
          </button>
        </div>

        {/* FAQ Section */}
        <div className='bg-[rgb(236_240_241)] p-[35px] rounded-[20px] mb-[40px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6 text-[36px] flex justify-between items-center'>
            <span>Frequently Asked Questions</span>
          </div>
          
          <div className='flex flex-col gap-6'>
            {faqs.map((faq) => (
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
                            {faq.question}
                        </div>
                    </div>
                    <div className={`text-[35px] text-gray-300 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-90' : ''}`}>❯</div>
                </div>
                
                {/* Expandable Answer */}
                {expandedId === faq.id && (
                    <div className='mt-6 pt-6 border-t border-gray-100 text-[26px] text-[#546e7a] leading-relaxed animate-fadeIn'>
                        {faq.answer}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 mb-5 text-center'>
            <div className='text-[24px] text-gray-400 font-medium'>Kiosk ID: LB-04 • Version 2.1.0</div>
            <button className='flex items-center justify-center gap-4 bg-[#f8f9fa] border-2 border-dashed border-gray-300 p-8 rounded-[20px] text-[30px] font-bold text-[#7f8c8d] active:bg-gray-200'>
                📝 Report a Problem with this Kiosk
            </button>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}

export default HelpPage;