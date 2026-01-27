import { useLocation, useNavigate } from "react-router-dom";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import { postDataLogin } from "../../app";
import Swal from 'sweetalert2';
import SimpleScanner from "../components/common/TestQrResult";
import { translations } from '../utils/translations'; // Import

const LoginPage = () => {
  const { 
    handleLoginSuccess, 
    setPatronId, 
    setPatronName, 
    openKeyboard, 
    showScanner, 
    setShowScanner,
    language // Get language from context
  } = useKiosk();

  const navigate = useNavigate();
  const location = useLocation();

  // Translation helper
  const t:any = (translations as any)[language ] || translations.EN;

  const handleShowScanner = () => {
    setShowScanner(true)
  }

  const handleManualEntry = () => {
    openKeyboard(async (cardNumber) => {
      try {
        const response = await postDataLogin(String(cardNumber));

        if (response.success === "true") {
          setPatronId(response.patron_id);
          setPatronName(response.patron_name)
          handleLoginSuccess()

          Swal.fire({
            title: t.login_success_title,
            text: t.login_success_text,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });

          navigate("/checkout", {
            replace: true,
            state: location.state 
          });
        } else {
          Swal.fire({
            title: t.login_invalid_title,
            text: `${t.login_invalid_text_prefix} ${cardNumber} ${t.login_invalid_text_suffix}`,
            icon: 'error'
          });
        }
      } catch (error) {
        Swal.fire({
          title: t.login_error_title,
          text: t.login_error_text,
          icon: 'error'
        });
        console.error("Login error:", error);
      }
    });
  };

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />
      <div className='max-w-420 m-auto pt-60 pb-30'>
        <div className="flex flex-col justify-center items-center py-47">
          <div className="text-[40px] font-[700] pb-5">{t.login_identify}</div>

          <div className='flex flex-col gap-10 items-center'>
            {/* QR Code Button */}
            <button className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]" onClick={handleShowScanner}>
              <div className='text-[100px]'>📱</div>
              <div className='font-bold text-[32px]'>{t.scan_qr_title}</div>
              <div className='text-[24px] text-[#7f8c8d]'>{t.scan_qr_sub}</div>
            </button>
            
            {/* Manual Entry Button */}
            <button
              className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]"
              onClick={handleManualEntry}
            >
              <div className='text-[100px]'>🔢</div>
              <div className='font-bold text-[32px]'>{t.enter_card_title}</div>
              <div className='text-[24px] text-[#7f8c8d]'>{t.enter_card_sub}</div>
            </button>
          </div>
        </div>

        {showScanner && <SimpleScanner />}
        
        <div className='bg-[#e3f2fd] p-[30px] rounded-[15px] m-[25px]'>
          <div className='text-[30px] font-bold text-[#1565c0] mb-[20px]'>
            💡 {t.first_time_title}
          </div>
          <div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>1</div>
              <div className='text-[24px] text-[#0d47a1]'>{t.step_1}</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>2</div>
              <div className='text-[24px] text-[#0d47a1]'>{t.step_2}</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>3</div>
              <div className='text-[24px] text-[#0d47a1]'>{t.step_3}</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>4</div>
              <div className='text-[24px] text-[#0d47a1]'>{t.step_4}</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;