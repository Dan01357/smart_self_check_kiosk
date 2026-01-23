import { Link, useLocation, useNavigate } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import Swal from "sweetalert2";
import axios from "axios";
import { checkoutBook } from "../../services/kohaApi";

const Footer = () => {
  const location = useLocation();
  const path = location.pathname;
  const { displayCheckouts, displayCheckins, patronId, checkouts, setCheckouts, setDisplayCheckins, setDisplayCheckouts } = useKiosk()
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";
  // This replaces the locationBefore prop by reading the state passed during navigation
  const locationBefore = location.state?.from;

  // Style Constant (Exact copy of your original wrapper)
  const wrapperClass = "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-[#34495e] py-6 text-white flex justify-between px-8 text-[25px]";

  // --- RENEW ALL LOGIC ---
  const handleRenewAll = async () => {
    if (checkouts.length === 0) {
      return Swal.fire({ title: "No items", text: "You have no items to renew.", icon: "info" });
    }

    Swal.fire({
      title: 'Renewing all items...',
      text: 'Please wait while we process your request.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      // Create a list of promises for all checkouts
      // We use allSettled so that if one book has a hold/error, the others still proceed
      const promises = checkouts.map(checkout =>
        axios.post(`${API_BASE}/api/v1/renew`, { checkout_id: checkout.checkout_id })
      );

      await Promise.allSettled(promises);

      // Fetch the updated checkout list from the server to refresh the UI
      const response = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
      setCheckouts(response.data);

      Swal.fire({
        title: 'Processed!',
        text: 'The system has attempted to renew all eligible items.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Bulk renewal failed", error);
      Swal.fire({ title: 'Error', text: 'Failed to process bulk renewal.', icon: 'error' });
    }
  };
  const navigate = useNavigate();

  const handleFinalCheckin = async () => {
    Swal.fire({
      title: 'Processing Returns...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    try {
      // Perform the actual checkins only now
      const promises = displayCheckins.map(item =>
        fetch(`${API_BASE}/api/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: item.barcode })
        })
      );

      await Promise.all(promises);
      // Clear state and navigate
      navigate("/success", { state: { from: path } });
      Swal.close();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Some items failed to return.', icon: 'error' });
    }
  };

  // ... (inside Footer component)

  const handleFinalCheckout = async () => {
    if (displayCheckouts.length === 0) return;

    Swal.fire({
      title: 'Processing Checkouts...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    try {
      // 1. PRE-VALIDATION: Fetch latest items status to ensure none were checked out 
      // while the user was standing at the kiosk.
      const { data: latestItems } = await axios.get(`${API_BASE}/api/v1/items`);

      for (const stagedItem of displayCheckouts) {
        const dbItem = latestItems.find((i: any) => i.item_id === stagedItem.item_id);

        // If the item has a checkout_id or an 'onloan' date, it's already taken
        if (dbItem && (dbItem.checkout_id || dbItem.onloan)) {
          throw new Error(`The item "${stagedItem.title}" is already checked out by someone else.`);
        }
      }

      // 2. TRANSACTION: Only if ALL items passed validation do we proceed
      const allValidated = displayCheckouts.every(displayCheckout =>
        // Ensure that for every display item, there is NOT a matching item in checkouts
        !checkouts.some(checkout => checkout.item_id === displayCheckout.item_id)
      );

      if (allValidated) {
        for (const item of displayCheckouts) {
          await checkoutBook(patronId, item.item_id);
        }

        Swal.close();
        navigate("/success", { state: { from: path } });
      }
      else {
        const errorMessage = "A book has already been checked out";

        Swal.fire({ title: 'Checkout Error', text: errorMessage, icon: 'error' });
      }


    } catch (error: any) {
      console.error("Checkout Error:", error);
      // This message now triggers BEFORE any database changes are made if validation fails
      const errorMessage = "A book has already been checked out";

      Swal.fire({ title: 'Checkout Error', text: errorMessage, icon: 'error' });
    }
  };

  const handleCancel = () => {
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    navigate("/home");
  };

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

        <button className="py-[15px] px-[35px] rounded-[8px] bg-[#16a085]" onClick={handleRenewAll}>
          <div>🔄 Renew All</div>
        </button>

      </div>
    );
  }

  else if (path === '/checkout') {
    const isListEmpty = displayCheckouts.length === 0;
   
    return (
      <div className={wrapperClass}>
        {/* CANCEL: Just go home. No API calls = No trace in Koha */}
        <button
          className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300"
          onClick={handleCancel}
        >
          <div className="mr-2">❌</div>
          <div>Cancel</div>
        </button>

        {/* COMPLETE: Actually perform the checkouts in the DB now */}
        {isListEmpty
          ? <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] !cursor-default opacity-[0.5]"
          >
            <div>✓ Complete Checkout</div>
          </button>
          : <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300"
            onClick={handleFinalCheckout}
          >
            <div>✓ Complete Checkout</div>
          </button>
        }

      </div>
    );
  }

  else if (path === '/checkin') {
    const isListEmpty = displayCheckins.length === 0;
    return (
      <div className={wrapperClass}>
        {/* CANCEL: Just go home. No API calls = No date changes! */}
        <button
          className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px]"
          onClick={handleCancel}
        >
          <div className="mr-2">❌</div>
          <div>Cancel</div>
        </button>

        {/* COMPLETE: Now we actually talk to the server */}
        {isListEmpty
          ? <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] !cursor-default opacity-[0.5]"
          >
            <div>✓ Complete Return</div>
          </button>
          : <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300"
            onClick={handleFinalCheckin}
          >
            <div>✓ Complete Return</div>
          </button>
        }
      </div>
    );
  }

  else if (path === '/success') {
    // 1. Create the reset and navigate functions
    const handleMoreCheckout = () => {
      setDisplayCheckouts([]); // Clear the checkout list
      navigate("/checkout");   // Navigate
    };

    const handleMoreCheckin = () => {
      setDisplayCheckins([]);  // Clear the return list
      navigate("/checkin");    // Navigate
    };

    const handleDone = () => {
      setDisplayCheckouts([]);
      setDisplayCheckins([]);
      navigate("/home");
    };

    if (locationBefore === '/checkout') {
      return (
        <div className={wrapperClass}>
          {/* Use handleDone instead of Link */}
          <button
            className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300"
            onClick={handleDone}
          >
            <div className="mr-2">🏠</div>
            <div>Done</div>
          </button>

          {/* Use handleMoreCheckout instead of Link */}
          <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300"
            onClick={handleMoreCheckout}
          >
            <div>Checkout More Items</div>
          </button>
        </div>
      );
    }
    else if (locationBefore === '/checkin') {
      return (
        <div className={wrapperClass}>
          {/* Use handleDone instead of Link */}
          <button
            className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300"
            onClick={handleDone}
          >
            <div className="mr-2">🏠</div>
            <div>Done</div>
          </button>

          {/* Use handleMoreCheckin instead of Link */}
          <button
            className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300"
            onClick={handleMoreCheckin}
          >
            <div>Return More Items</div>
          </button>
        </div>
      );
    }
  }
  else if (path === '/renew') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" >
            <div className="mr-2">🏠</div>
            <div>Done</div>
          </button>
        </Link>

      </div>
    );
  }
  else if (path === '/hold') {
    return (
      <div className={wrapperClass}>
        <Link to="/home">
          <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" >
            <div className="mr-2">🏠</div>
            <div>Done</div>
          </button>
        </Link>

      </div>
    );
  }
  return null;
}

export default Footer;