import { Link, useLocation, useNavigate } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import Swal from "sweetalert2";
import axios from "axios";
import { sendHoldNotification } from "../../services/emailApi";
import { translations } from "../../utils/translations";

/**
 * Footer Component
 * Acts as the main navigation and action bar for the Kiosk.
 * Its content changes dynamically based on the current URL path.
 */
const Footer = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  // Destructuring state and functions from the Kiosk Context
  const {
    language,
    displayCheckouts,
    displayCheckins,
    patronId,
    checkouts,
    setCheckouts,
    setDisplayCheckins,
    setDisplayCheckouts,
    API_BASE,
    displayHolds,
    setDisplayHolds
  } = useKiosk();

  // Load translations based on selected language
  const t: any = (translations as any)[language];

  // Base styling for the footer container
  const wrapperClass = "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-[#34495e] py-6 text-white flex justify-between px-8 text-[25px]";

  // --- ACTION FUNCTIONS ---

  /**
   * handleRenewAll:
   * Iterates through all items currently checked out by the patron and attempts to renew them.
   * After renewal, it re-fetches the list to update the UI with new due dates.
   */
  const handleRenewAll = async () => {
    if (checkouts.length === 0) {
      return Swal.fire({ title: "No items", text: "You have no items to renew.", icon: "info" });
    }
    Swal.fire({ title: 'Renewing all items...', text: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      // Map checkouts to renewal API promises
      const promises = checkouts.map(checkout => axios.post(`${API_BASE}/api/v1/renew`, { checkout_id: checkout.checkout_id }));
      await Promise.allSettled(promises);

      // Refresh the local checkout list for the specific patron
      const response = await axios.post(`${API_BASE}/api/v1/my-books`, { patronId });
      setCheckouts(response.data);

      Swal.fire({ title: 'Processed!', text: 'Renewal attempted.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to process.', icon: 'error' });
    }
  };

  /**
   * handleFinalCheckin:
   * Finalizes the return process. If a book has a hold (reservation) by another patron, 
   * it redirects to a warning page instead of finishing immediately.
   */
  const handleFinalCheckin = async () => {
    // Check if any holds were identified during the scanning process
    const hasHolds = displayHolds.length > 0;

    if (!hasHolds) {
      Swal.fire({ title: 'Processing Returns...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      try {
        // Send check-in commands for all scanned items
        const promises = displayCheckins.map(item => axios.post(`${API_BASE}/api/checkin`, { barcode: item.barcode }));
        await Promise.all(promises);
        navigate("/success", { state: { from: path } });
        Swal.close();
      } catch (error) {
        Swal.fire({ title: 'Error', text: 'Failed to process returns.', icon: 'error' });
      }
    } else {
      // Holds detected: show loading then navigate to the hold notification screen
      Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await new Promise(resolve => setTimeout(resolve, 500));
      Swal.close();
      navigate("/onholddetected");
    }
  };

  /**
   * handleFinalCheckout:
   * Finalizes the borrowing process for all items currently in the 'displayCheckouts' list.
   */
  const handleFinalCheckout = async () => {
    if (displayCheckouts.length === 0) return;
    Swal.fire({ title: 'Processing...', text: 'Finalizing your checkouts...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    try {
      // Sequentially process checkouts for each item
      for (const item of displayCheckouts) {
        await axios.post(`${API_BASE}/api/checkout-book/${item.externalId}/${patronId}`);
      }
      Swal.close();
      navigate("/success", { state: { from: path } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Checkout failed";
      Swal.fire({ title: "Error", text: errorMessage, icon: 'error', confirmButtonColor: '#3498db' });
    }
  };

  /**
   * handleContinue (On Hold Detected):
   * Executed when a patron returns a book that is reserved by someone else.
   * 1. Completes the check-in.
   * 2. Hydrates data (gets names/titles).
   * 3. Sends email notifications to the next patron in the queue.
   */
  const handleContinue = async () => {
    Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    try {
      // 1. Process the returns first
      const promises = displayCheckins.map(item => axios.post(`${API_BASE}/api/checkin`, { barcode: item.barcode }));
      await Promise.all(promises);

      // 2. Fetch full details (Title, Patron Name) for the holds detected
      const hydration = await axios.post(`${API_BASE}/api/v1/hydrate-detected-holds`, {
        holds: displayHolds
      });

      const hydratedHolds = hydration.data;

      // 3. Notify the patron whose hold is now at the front of the queue (Priority 1)
      for (const hold of hydratedHolds) {
        if (Number(hold.priority) === 1) {
          await sendHoldNotification(
            hold.title || "Book",
            hold.patronName || "Patron",
            language
          );
        }
      }

      navigate("/success", { state: { from: '/checkin' } });
      Swal.close();
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'Failed to process holds.', icon: 'error' });
    }
  };

  /**
   * handleCancel:
   * Resets all temporary transaction lists and returns the user to the home screen.
   */
  const handleCancel = () => {
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    setDisplayHolds([]);
    navigate("/home");
  };

  // --- RENDER LOGIC ---

  // Default Home Screen Footer (Status info)
  if (path === '/home') {
    return (
      <div className={wrapperClass}>
        <div><span className="text-[#2ecc71]">● {t.available}</span> | {t.kiosk_num}</div>
        <div>📍 {t.main_floor} | {t.service_24_7}</div>
      </div>
    );
  }

  // Authentication/Login Screen Footer
  else if (path === '/') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300">
            <div className="mr-2">⬅️</div>
            <div>{t.back_home}</div>
          </button>
        </Link>
        <button className="py-[15px] px-[35px] rounded-[8px] bg-[#95a5a6]">
          <div>{t.need_assist}</div>
        </button>
      </div>
    );
  }

  // General Account View Footer
  else if (path === '/account') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300">
            <div className="mr-2">⬅️</div>
            <div>{t.back_home}</div>
          </button>
        </Link>
      </div>
    );
  }

  // Checkout Scanning Screen Footer
  else if (path === '/checkout') {
    const isListEmpty = displayCheckouts.length === 0;
    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={handleCancel}>
          <div className="mr-2">❌</div>
          <div>{t.cancel}</div>
        </button>
        <button
          className={`py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] transition-all duration-300 ${isListEmpty ? "!cursor-default opacity-[0.5]" : "hover:bg-[rgb(39_174_96)]"}`}
          onClick={!isListEmpty ? handleFinalCheckout : undefined}
        >
          <div>✓ {t.complete_checkout}</div>
        </button>
      </div>
    );
  }

  // Return Scanning Screen Footer
  else if (path === '/checkin') {
    const isListEmpty = displayCheckins.length === 0;
    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px]" onClick={handleCancel}>
          <div className="mr-2">❌</div>
          <div>{t.cancel}</div>
        </button>
        <button
          className={`py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] transition-all duration-300 ${isListEmpty ? "!cursor-default opacity-[0.5]" : "hover:bg-[rgb(39_174_96)]"}`}
          onClick={!isListEmpty ? handleFinalCheckin : undefined}
        >
          <div>✓ {t.complete_return}</div>
        </button>
      </div>
    );
  }

  // Transaction Success Screen Footer
  else if (path === '/success') {
    const handleMoreCheckout = () => { setDisplayCheckouts([]); navigate("/checkout"); };
    const handleMoreCheckin = () => { setDisplayCheckins([]); setDisplayHolds([]); navigate("/checkin"); };
    const handleDone = async () => {
      setDisplayCheckouts([]); setDisplayCheckins([]); setDisplayHolds([]);
      await Swal.fire({ title: 'Loading...', didOpen: () => Swal.showLoading(), timer:500,allowOutsideClick: false });
      navigate("/home");
    };

    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={handleDone}>
          <div className="mr-2">🏠</div>
          <div>{t.done}</div>
        </button>
        {/* Conditional button based on whether user came from return or checkout */}
        {location.state?.from === '/checkout' ? (
          <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300" onClick={handleMoreCheckout}>
            <div>{t.checkout_more}</div>
          </button>
        ) : (
          <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300" onClick={handleMoreCheckin}>
            <div>{t.return_more}</div>
          </button>
        )}
      </div>
    );
  }

  // Renewal Screen Footer
  else if (path === '/renew') {
    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => navigate("/home")}>
          <div className="mr-2">🏠</div>
          <div>{t.done}</div>
        </button>
        <button className="py-[15px] px-[35px] rounded-[8px] bg-[#16a085]" onClick={handleRenewAll}>
          <div>🔄 {t.renew_all}</div>
        </button>
      </div>
    );
  }

  // Holds/Reservations List Footer
  else if (path === '/hold') {
    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => navigate("/home")}>
          <div className="mr-2">🏠</div>
          <div>{t.done}</div>
        </button>
      </div>
    );
  }

  // Warning screen when a returned book has a hold for another patron
  else if (path === '/onholddetected') {
    return (
      <div className={wrapperClass}>
        <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300" onClick={handleContinue}>
          <div>✓ {t.continue}</div>
        </button>
      </div>
    );
  }

  // Help Screen Footer
  else if (path === '/help') {
    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={() => navigate(-1)}>
          <div className="mr-2">⬅️ {t.back}</div>
        </button>
        <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)]" onClick={() => navigate('/home')}>
          <div>🏠 {t.home}</div>
        </button>
      </div>
    );
  }

  return null;
}

export default Footer;