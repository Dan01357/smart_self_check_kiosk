import { useLocation, useNavigate } from "react-router-dom";
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useKiosk } from '../context/KioskContext';
import { postDataLogin } from "../../app";
import Swal from 'sweetalert2';
import SimpleScanner from "../components/common/TestQrResult";

const LoginPage = () => {
  // 1. Access global context (which initializes from LocalStorage)
  const { 

    // Handlers and setters
    handleLoginSuccess, 
    setPatronId, 
    setPatronName, 
    openKeyboard, 
    showScanner, 
    setShowScanner 
  } = useKiosk();

  const navigate = useNavigate();
  const location = useLocation();

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
            title: 'Submitted!',
            text: `Login successful`,
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
            title: 'Invalid Credentials!',
            text: `Card number ${cardNumber} does not exist`,
            icon: 'error'
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong with the login process.',
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
          <div className="text-[40px] font-[700] pb-5">Please Identify Yourself</div>

          <div className='flex flex-col gap-10 items-center'>
            {/* QR Code Button */}
            <button className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]" onClick={handleShowScanner}>
              <div className='text-[100px]'>📱</div>
              <div className='font-bold text-[32px]'>Scan QR Code</div>
              <div className='text-[24px] text-[#7f8c8d]'>Show your mobile library app QR code</div>
            </button>
            
            {/* Manual Entry Button */}
            <button
              className="flex flex-col items-center rounded-[20px] border border-[#ecf0f1] border-[3px] hover:border-[#3498db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 w-150 p-[50px]"
              onClick={handleManualEntry}
            >
              <div className='text-[100px]'>🔢</div>
              <div className='font-bold text-[32px]'>Enter Card Number</div>
              <div className='text-[24px] text-[#7f8c8d]'>Type your library card number manually</div>
            </button>
          </div>
        </div>

        {showScanner && <SimpleScanner />}
        
        <div className='bg-[#e3f2fd] p-[30px] rounded-[15px] m-[25px]'>
          <div className='text-[30px] font-bold text-[#1565c0] mb-[20px]'>
            💡 First time using self-checkout?
          </div>
          <div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>1</div>
              <div className='text-[24px] text-[#0d47a1]'>Select your preferred login method above</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>2</div>
              <div className='text-[24px] text-[#0d47a1]'>Scan or place your items on the RFID pad</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>3</div>
              <div className='text-[24px] text-[#0d47a1]'>Review your items and confirm checkout</div>
            </div>
            <div className='flex items-center py-1'>
              <div className='bg-[#2196f3] text-white w-[45px] h-[45px] flex items-center justify-center text-[24px] font-bold rounded-[50%] mr-4'>4</div>
              <div className='text-[24px] text-[#0d47a1]'>Take your receipt and enjoy your books!</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;