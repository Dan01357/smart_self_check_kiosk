import Header from '../components/common/Header'
import Footer from '../components/common/Footer'

const HelpPage = () => {
  const faqs = [
    { id: 1, icon: '❓', question: 'How do I get a library card?', color: '#3498db' },
    { id: 2, icon: '🔑', question: 'I forgot my password', color: '#e67e22' },
    { id: 3, icon: '📅', question: 'What are the library hours?', color: '#2ecc71' },
    { id: 4, icon: '📚', question: 'How many books can I borrow?', color: '#9b59b6' },
    { id: 5, icon: '💳', question: 'What payment methods accepted?', color: '#1abc9c' },
    { id: 6, icon: '🔄', question: 'How do I renew my books?', color: '#34495e' },
    { id: 7, icon: '📍', question: 'Where are other branches?', color: '#e74c3c' },
    { id: 8, icon: '🖨️', question: 'Can I print or scan documents?', color: '#7f8c8d' },
    { id: 9, icon: '👥', question: 'How to register family members?', color: '#f1c40f' },
    { id: 10, icon: '📖', question: 'E-books and digital resources?', color: '#2980b9' },
  ];

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700 bg-white'>
      <Header />

      <div className='pt-60 flex p-[40px] flex-col overflow-auto pb-40'>
        

        <div className='text-center text-[48px] mb-[40px] text-[#2c3e50] font-bold'>
            Help & Support
        </div>

        {/* Call Staff Emergency Card - Matches Account Summary Style */}
        <div className='bg-gradient-to-br from-[#3498db] to-[#2c3e50] rounded-[20px] p-[40px] text-white mb-[40px] shadow-lg text-center'>
          <div className='text-[40px] font-bold mb-[10px]'>Need Immediate Help?</div>
          <div className='text-[26px] mb-[30px] opacity-90'>A librarian is available to assist you.</div>
          <button className='bg-white text-[#2c3e50] w-full py-[25px] rounded-[15px] text-[32px] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-4'>
            📞 Call Library Staff
          </button>
        </div>

        {/* FAQ Section */}
        <div className='bg-[rgb(236_240_241)] p-[35px] rounded-[20px] mb-[40px]'>
          <div className='font-bold text-[rgb(44_62_80)] mb-6 text-[36px] flex justify-between items-center'>
            <span>Frequently Asked Questions</span>
            <span className='text-[24px] font-normal text-gray-500'>Tap to view</span>
          </div>
          
          <div className='flex flex-col gap-6'>
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className='flex bg-white rounded-[15px] items-center p-[30px] border-l-solid border-l-[10px] shadow-sm active:bg-gray-50' 
                style={{ borderLeftColor: faq.color }}
              >
                <div className='text-[55px] min-w-[70px] mr-6'>{faq.icon}</div>
                <div className='flex-grow'>
                  <div className='text-[28px] font-bold text-[#2c3e50] leading-tight'>
                    {faq.question}
                  </div>
                </div>
                <div className='text-[35px] text-gray-300'>❯</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className='grid grid-cols-1 gap-6 mb-20'>
            <button className='flex items-center justify-center gap-4 bg-[#f8f9fa] border-2 border-dashed border-gray-300 p-8 rounded-[20px] text-[30px] font-bold text-[#7f8c8d] active:bg-gray-200'>
                📝 Leave Feedback
            </button>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}

export default HelpPage;