import { Link, useLocation } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import { checkoutBook } from "../../services/kohaApi";

const Footer = () => {
  const location = useLocation();
  const path = location.pathname;
  const { setDisplayCheckouts, setDisplayCheckins, displayCheckouts, displayCheckins, patronId, items } = useKiosk()
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";
  // This replaces the locationBefore prop by reading the state passed during navigation
  const locationBefore = location.state?.from;

  // Style Constant (Exact copy of your original wrapper)
  const wrapperClass = "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-[#34495e] py-6 text-white flex justify-between px-8 text-[25px]";

  if (path === '/home') {
    return (
      <div className={wrapperClass}>
        <div><span className="text-[#2ecc71]">● Available</span> | Kiosk #3</div>
        <div>📍 Main Floor | ⏰ 24/7 Service</div>
      </div>
    );
  }

  else if (path === '/') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300">
            <div className="mr-2">⬅️</div>
            <div>Back to Home</div>
          </button>
        </Link>

        <button className="py-[15px] px-[35px] rounded-[8px] bg-[#95a5a6]">
          <div>Need Assistance?</div>
        </button>
      </div>
    );
  }

  else if (path === '/account') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300">
            <div className="mr-2">⬅️</div>
            <div>Back to Home</div>
          </button>
        </Link>
        <Link to="/checkout">
          <button className="py-[15px] px-[35px] rounded-[8px] bg-[#16a085]">
            <div>🔄 Renew All</div>
          </button>
        </Link>
      </div>
    );
  }

  else if (path === '/checkout') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => {
            displayCheckouts.map(async (displayCheckout) => {
              await fetch(`${API_BASE}/api/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: displayCheckout.externalId })
              });
            })
            setDisplayCheckouts([])

          }}>
            <div className="mr-2">❌</div>
            <div>Cancel</div>
          </button>
        </Link>
        <Link to="/success" state={{ from: path }}>
          <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300">
            <div>✓ Complete Checkout</div>
          </button>
        </Link>
      </div>
    );
  }

  else if (path === '/checkin') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => {
            displayCheckins.map(async (displayCheckin) => {
              const itemData: any = items.find((item: any) => displayCheckin.barcode === item.external_id);
              
              await checkoutBook(patronId, itemData.item_id);
            })
            setDisplayCheckins([])
            console.log(displayCheckins)
          }}>
            <div className="mr-2">❌</div>
            <div>Cancel</div>
          </button>
        </Link>
        <Link to="/success" state={{ from: path }}>
          <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300">
            <div>✓ Complete Return</div>
          </button>
        </Link>
      </div>
    );
  }

  else if (path === '/success') {
    // Exact logic for handling where the user came from using navigation state

    if (locationBefore === '/checkout') {

      return (
        <div className={wrapperClass}>
          <Link to="/home">
            <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => { setDisplayCheckouts([]); }}>
              <div className="mr-2">🏠</div>
              <div>Done</div>
            </button>
          </Link>
          <Link to="/checkout">
            <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)]">
              <div>Checkout More Items</div>
            </button>
          </Link>
        </div>
      );
    }
    else if (locationBefore === '/checkin') {
      return (
        <div className={wrapperClass}>
          <Link to="/home">
            <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => { setDisplayCheckins([]); }}>
              <div className="mr-2">🏠</div>
              <div>Done</div>
            </button>
          </Link>
          <Link to="/checkin">
            <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)]">
              <div>Return More Items</div>
            </button>
          </Link>
        </div>
      );
    }
  }

  return null;
}

export default Footer;