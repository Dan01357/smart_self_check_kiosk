import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";
import { useKiosk } from "../context/KioskContext";
import { useEffect } from "react";
import { translations } from "../utils/translations"; // Import localization mapping

/**
 * HomePage Component
 * Acts as the main dashboard for the kiosk after a patron has logged in.
 * It provides clear navigation buttons for all library services.
 */
const HomePage = () => {
  // Extracting necessary state and setters from the Kiosk context
  const { setDisplayCheckins, setDisplayCheckouts, language } = useKiosk();
  
  // Selecting the appropriate translation strings based on the user's selected language
  const t = (translations as any)[language]; 

  /**
   * useEffect Cleanup:
   * Whenever a user arrives at the Home Page, we clear the temporary scanning lists
   * for check-ins and check-outs to ensure a fresh session for the next transaction.
   */
  useEffect(() => {
    setDisplayCheckins([]);
    setDisplayCheckouts([]);
  }, []);

  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      <Header />

      <div className="max-w-400 m-auto flex flex-col justify-center items-center pt-60 pb-30">
        {/* Welcome Text Section */}
        <div className="text-[40px] font-[700] pb-10 flex flex-col items-center">
          <div>{t.welcome}</div>
          <div>{t.ask_action}</div>
        </div>

        {/* Navigation Grid/List */}
        <div className="flex flex-col gap-[25px]">
          
          {/* Borrowing / Checkout Button */}
          <Link to="/checkout">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">📤</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">{t.check_out_title}</div>
                  <div className="text-[22px] text-white">{t.check_out_sub}</div>
                </div>
              </div>
            </button>
          </Link>

          {/* Return / Check-in Button */}
          <Link to="/checkin">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">📥</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">{t.return_title}</div>
                  <div className="text-[22px] text-white">{t.return_sub}</div>
                </div>
              </div>
            </button>
          </Link>

          {/* Book Renewal Button */}
          <Link to="/renew">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">🔄</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">{t.renew_title}</div>
                  <div className="text-[22px] text-white">{t.renew_sub}</div>
                </div>
              </div>
            </button>
          </Link>

          {/* Reservations / Holds List Button */}
          <Link to="/hold">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white">
                  <div className="text-[80px]">📌</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">{t.holds_title}</div>
                  <div className="text-[22px] text-white">{t.holds_sub}</div>
                </div>
              </div>
            </button>
          </Link>

          {/* Personal Account Information Button */}
          <Link to="/account">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">👤</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">{t.account_title}</div>
                  <div className="text-[22px] text-white">{t.account_sub}</div>
                </div>
              </div>
            </button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;