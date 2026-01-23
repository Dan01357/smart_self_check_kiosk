import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Link } from "react-router-dom";
import { useKiosk } from "../context/KioskContext";
import { useEffect } from "react";

const HomePage = () => {
  const { setDisplayCheckins, setDisplayCheckouts } = useKiosk()

  useEffect(() => {
    setDisplayCheckins([]);
    setDisplayCheckouts([]);
  }, [])
  return (
    <div className='max-w-[1080px] min-h-[1920px] m-auto border-x border-x-solid border-x-gray-700'>
      {/* Prop 'locationBefore' removed - Header now uses internal logic */}
      <Header />

      <div className="max-w-400 m-auto flex flex-col justify-center items-center pt-60 pb-30">
        <div className="text-[40px] font-[700] pb-10 flex flex-col items-center">
          <div>Welcome!</div>
          <div>What would you like to do?</div>
        </div>

        <div className="flex flex-col gap-[25px]">
          <Link to="/checkout">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">📤</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">Check Out Books</div>
                  <div className="text-[22px] text-white">Borrow library materials</div>
                </div>
              </div>
            </button>
          </Link>

          <Link to="/checkin">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">📤</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">Return Books</div>
                  <div className="text-[22px] text-white">Return Borrowed Materials</div>
                </div>
              </div>
            </button>
          </Link>
          <Link to="/renew">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">🔄</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">Renew Books</div>
                  <div className="text-[22px] text-white">Extend your due dates</div>
                </div>
              </div>
            </button>
          </Link>
          <Link to="/hold">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white">
                  <div className="text-[80px]">📌</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">My Holds</div>
                  <div className="text-[22px] text-white">View and manage your reservations</div>
                </div>
              </div>
            </button>
          </Link>
          <Link to="/account">
            <button className="bg-gradient-to-br from-[#667eea] to-[#764ba2] w-[900px] py-[60px] px-[40px] rounded-[20px] hover:-translate-y-[5px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
              <div className="flex items-center">
                <div className="pr-5 text-white text-[40px]">
                  <div className="text-[80px]">👤</div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[35px] text-white font-bold">My Account</div>
                  <div className="text-[22px] text-white">View account and holds</div>
                </div>
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* Prop 'locationBefore' removed - Footer now uses internal logic */}
      <Footer />
    </div>
  );
}

export default HomePage;