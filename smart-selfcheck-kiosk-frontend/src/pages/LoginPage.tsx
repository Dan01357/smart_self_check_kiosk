import { useNavigate } from "react-router-dom";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import Swal from 'sweetalert2';
import SimpleScanner from "../components/common/SimpleScanner";
import { translations } from '../utils/translations';
import axios from "axios";

/**
 * LoginPage Component
 * The initial landing page where patrons identify themselves using either
 * a physical ID card (scanned via QR/Barcode) or manual card number entry.
 */
const LoginPage = () => {
  // Destructuring global state and actions from the Kiosk Context
  const {
    handleLoginSuccess,
    setPatronId,
    setPatronName,
    openKeyboard,
    showScanner,
    setShowScanner,
    language,
    API_BASE
  } = useKiosk();

  const navigate = useNavigate();

  // Selecting the translation dictionary based on current language
  const t: any = (translations as any)[language] || translations.EN;

  /**
   * handleShowScanner:
   * Triggers the visibility of the SimpleScanner overlay component.
   */
  const handleShowScanner = () => {
    setShowScanner(true)
  }

  /**
   * handleManualEntry:
   * Opens the virtual on-screen keyboard for manual card number input.
   * On submission, it validates the credentials against the Koha backend.
   */
  const handleManualEntry = () => {
    // openKeyboard takes a callback function that receives the user's input
    openKeyboard(async (cardNumber) => {
      if (!cardNumber) return;

      // Display a loading spinner while the network request is in progress
      Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        // Attempt to log in by sending the card number to the proxy server
        const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
          cardnumber: String(cardNumber)
        });

        if (response.data.success === "true") {
          // Save patron details to global state on successful authentication
          setPatronId(response.data.patron_id);
          setPatronName(response.data.patron_name);
          handleLoginSuccess(); // Clears any previous session data

          Swal.fire({
            title: t.login_success_title,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });

          // Direct the user to the checkout screen to start borrowing
          navigate("/checkout", { replace: true });
        }
      } catch (error: any) {
        // Handle failed logins (e.g., card not found or server error)
        Swal.fire({
          title: t.login_invalid_title,
          text: `${t.card_label || "Card"} ${cardNumber} ${t.not_found}`,
          icon: 'error'
        });
      }
    }, t.enter_card_prompt || "Enter Card Number");
  };

  // Handler for Quick Return
  const handleQuickReturn = () => {
    navigate("/checkin");
  };
  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className='max-w-420 m-auto pt-60 pb-30'>
        <div className="flex flex-col justify-center items-center">
          <div className="text-[40px] font-[700] pb-5">{t.login_identify}</div>

          <div className='flex flex-col gap-10 items-center'>

            {/* Action Button: Triggers hardware scanner overlay */}
            <button className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]" onClick={handleShowScanner}>
              <div className='text-[100px]'>📱</div>
              <div className='font-bold text-[32px]'>{t.scan_qr_title}</div>
              <div className='text-[24px] text-[#7f8c8d]'>{t.scan_qr_sub}</div>
            </button>

            {/* Action Button: Triggers on-screen keyboard for touch input */}
            <button
              className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]"
              onClick={handleManualEntry}
            >
              <div className='text-[100px]'>🔢</div>
              <div className='font-bold text-[32px]'>{t.enter_card_title}</div>
              <div className='text-[24px] text-[#7f8c8d]'>{t.enter_card_sub}</div>
            </button>

            {/* Quick Return Button */}
            <button
              className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]"
              onClick={handleQuickReturn}
            >
              <div className='text-[100px]'>🚀</div>
              <div className='font-bold text-[32px]'>{t.quick_return_title || "Quick Return (No Login)"}</div>
              <div className='text-[24px] text-[#7f8c8d]'>{t.quick_return_sub || "Drop books without scanning your card"}</div>
            </button>

          </div>
        </div>

        {/* The SimpleScanner handles global keydown events from the hardware scanner */}
        {showScanner && <SimpleScanner />}

        {/* Instructional Guide for New Users */}
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