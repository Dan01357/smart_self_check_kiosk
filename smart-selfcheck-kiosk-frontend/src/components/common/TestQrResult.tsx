import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import animationData from "../../assets/QR Code Scanner.json";
import Swal from 'sweetalert2';
import { useKiosk } from '../../context/KioskContext';
import { postDataLogin } from '../../../app';
import { useLocation, useNavigate } from 'react-router';

function SimpleScanner() {
  const scanBuffer = useRef("");
  const { setAuthorized, setPatronId, setShowScanner } = useKiosk();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  const handleShowScanner = () => {
    setShowScanner(false)
  }

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (scanBuffer.current.length > 0) {
          const cardNumber = scanBuffer.current
          console.log("Physical Scanner Value:", cardNumber);
          try {
            const response = await postDataLogin(String(cardNumber));

            if (response.success === "true") {
              // Update Global State
              setPatronId(response.patron_id);
              setAuthorized(true);

              Swal.fire({
                title: 'Submitted!',
                text: `Login successful`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });

              // Redirect
              navigate(from, { replace: true });
            } else {
              Swal.fire({
                title: 'Invalid Credentials!',
                text: `Card number ${cardNumber} does not exist`,
                icon: 'error',
                timer: 1500,
                showConfirmButton: false
              });
            }
          } catch (error) {
            Swal.fire({
              title: 'Error!',
              text: 'Something went wrong with the login process.',
              icon: 'error',
            });
            console.error("Login error:", error);
          }
          scanBuffer.current = "";

        }
      } else {
        if (e.key.length === 1) {
          scanBuffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    /* 1. THE BACKDROP: Full screen, fixed, blurred, and slightly dark */
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-[15px]">

      {/* 2. THE UI CARD: Removed 'fixed' and 'top-1/2' because the parent flexbox handles centering now */}
      <div className="flex flex-col bg-gradient-to-br from-[rgb(30_58_95)] to-[rgb(44_95_158)] py-[50px] px-[100px] items-center rounded-[25px] border border-dashed border-[5px] border-[rgb(52_152_219)] m-[30px] overflow-hidden min-h-[400px] w-full max-w-[900px] shadow-2xl" onClick={handleShowScanner}>

        <div className='text-[120px] animate-float relative z-[1]'>
          <div className='max-w-60 bg-white rounded-[30px]'>
            <Lottie animationData={animationData} loop={true} />
          </div>
        </div>

        <div className='font-bold text-[36px] text-white mt-4'>Scanning for Id</div>
        <div className='text-[26px] text-white text-center mt-2'>
          Place your id flat on the reader pad below<br />
        </div>

      </div>
    </div>
  );
}

export default SimpleScanner;