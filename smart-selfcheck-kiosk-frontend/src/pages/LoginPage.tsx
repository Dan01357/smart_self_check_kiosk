import { useNavigate } from "react-router-dom";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import Swal from 'sweetalert2';
import SimpleScanner from "../components/common/TestQrResult";
import { translations } from '../utils/translations';
import axios from "axios";

const LoginPage = () => {
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

  const t: any = (translations as any)[language] || translations.EN;

  const handleShowScanner = () => {
    setShowScanner(true)
  }

  const handleManualEntry = () => {
  // Step 1: Ask for Card Number
  openKeyboard(async (cardNumber) => {
    if (!cardNumber) return;

    // Loading indicator for existence check
    Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // Verification Step
      const check = await axios.get(`${API_BASE}/api/v1/auth/check-patron/${cardNumber}`);
      
      if (!check.data.success) {
        return Swal.fire({
          title: t.login_invalid_title,
          text: `${t.card_label || "Card"} ${cardNumber} ${t.not_found}`,
          icon: 'error'
        });
      }

      // If exists, clear loading and move to Password
      Swal.close();

      setTimeout(() => {
        openKeyboard(async (password) => {
          if (!password) return;

          Swal.fire({ title: t.scanning_items, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

          try {
            const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
              cardnumber: String(cardNumber),
              password: String(password)
            });

            if (response.data.success === "true") {
              setPatronId(response.data.patron_id);
              setPatronName(response.data.patron_name);
              handleLoginSuccess();
              Swal.fire({ title: t.login_success_title, icon: 'success', timer: 1500, showConfirmButton: false });
              navigate("/checkout", { replace: true });
            }
          } catch (error: any) {
            Swal.fire({ title: t.login_invalid_title, text: t.login_error_text, icon: 'error' });
          }
        }, t.enter_password_prompt || "Enter Password");
      }, 400);

    } catch (err) {
      Swal.fire({ title: "Error", text: "Connection failed", icon: 'error' });
    }
  }, t.enter_card_prompt || "Enter Card Number");
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