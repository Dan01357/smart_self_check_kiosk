import { Link, useLocation, useNavigate } from "react-router-dom";
import { useKiosk } from "../../context/KioskContext";
import Swal from "sweetalert2";
import axios from "axios";
import { checkoutBook } from "../../services/kohaApi";
import { useEffect } from "react";
import { sendHoldNotification } from "../../services/emailApi";
import { translations } from "../../utils/translations"; // Import your translations

const Footer = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  
  // Pull language from context
  const { 
    language, 
    displayCheckouts, 
    displayCheckins, 
    patronId, 
    checkouts, 
    setCheckouts, 
    setDisplayCheckins, 
    setDisplayCheckouts, 
    setHolds, 
    allHolds, 
    API_BASE, 
    allCheckouts, 
    setAllHolds, 
    setAllCheckouts, 
    setPatrons, 
    displayHolds, 
    biblios, 
    patrons 
  } = useKiosk();

  // Translation helper
  const t: any = (translations as any)[language];

  const locationBefore = location.state?.from;
  const wrapperClass = "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-[#34495e] py-6 text-white flex justify-between px-8 text-[25px]";

  // --- LOGIC FUNCTIONS (Unchanged) ---
  const handleRenewAll = async () => {
    if (checkouts.length === 0) {
      return Swal.fire({ title: "No items", text: "You have no items to renew.", icon: "info" });
    }
    Swal.fire({ title: 'Renewing all items...', text: 'Please wait...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const promises = checkouts.map(checkout => axios.post(`${API_BASE}/api/v1/renew`, { checkout_id: checkout.checkout_id }));
      await Promise.allSettled(promises);
      const response = await axios.get(`${API_BASE}/api/v1/checkouts?patronId=${patronId}`);
      setCheckouts(response.data);
      Swal.fire({ title: 'Processed!', text: 'Renewal attempted.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to process.', icon: 'error' });
    }
  };

  const fetchHolds = async () => { try { const response = await axios.get(`${API_BASE}/api/v1/holds?patronId=${patronId}`); setHolds(response.data); } catch (e) { console.error(e); } };
  const fetchAllHolds = async () => { try { const response = await axios.get(`${API_BASE}/api/v1/holds`); setAllHolds(response.data); } catch (e) { console.error(e); } };
  const fetchAllCheckouts = async () => { try { const response = await axios.get(`${API_BASE}/api/v1/checkouts`); setAllCheckouts(response.data); } catch (e) { console.error(e); } };
  const fetchPatrons = async () => { try { const res = await axios.get(`${API_BASE}/api/v1/patrons`); setPatrons(res.data); } catch (e) { console.error(e); } };

  useEffect(() => { if (patronId) { fetchHolds(); fetchAllHolds(); fetchAllCheckouts(); fetchPatrons(); }; }, [patronId, API_BASE]);

  const handleFinalCheckin = async () => {
    await fetchAllHolds();
    const allValidated = displayHolds.length === 0;
    if (allValidated) {
      Swal.fire({ title: 'Processing Returns...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      try {
        const promises = displayCheckins.map(item => fetch(`${API_BASE}/api/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: item.barcode }) }));
        await Promise.all(promises);
        navigate("/success", { state: { from: path } });
        Swal.close();
      } catch (error) { Swal.fire({ title: 'Error', text: 'Failed.', icon: 'error' }); }
    } else {
      Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await new Promise(resolve => setTimeout(resolve, 800));
      Swal.close();
      navigate("/onholddetected");
    }
  };

  const handleFinalCheckout = async () => {
    await fetchHolds(); await fetchAllHolds(); await fetchAllCheckouts();
    if (displayCheckouts.length === 0) return;
    Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    try {
      const { data: latestItems } = await axios.get(`${API_BASE}/api/v1/items`);
      for (const stagedItem of displayCheckouts) {
        const dbItem = latestItems.find((i: any) => i.item_id === stagedItem.item_id);
        if (!dbItem) continue;
        if (checkouts.some(c => c.item_id === stagedItem.item_id)) throw new Error("MY_LIST");
        const inCheckouts = allCheckouts.find(c => c.item_id === stagedItem.item_id);
        if (inCheckouts && inCheckouts.patron_id !== patronId) throw new Error("CHECKOUT_OTHER");
        const itemHolds = allHolds.filter((hold: any) => hold.biblio_id === dbItem.biblio_id).sort((a: any, b: any) => a.priority - b.priority);
        if (itemHolds.length > 0 && itemHolds[0].patron_id !== patronId) throw new Error("RESERVED_OTHER");
      }
      for (const item of displayCheckouts) { await checkoutBook(patronId, item.item_id); }
      Swal.close();
      navigate("/success", { state: { from: path } });
    } catch (error: any) {
      let message = error.message === "RESERVED_OTHER" ? "Reserved by someone else" : error.message === "MY_LIST" ? "Already on your list" : error.message === "CHECKOUT_OTHER" ? "Checked out by someone else" : error.message;
      Swal.fire({ title: "Error", text: message, icon: 'error' });
    }
  };

  const handleCancel = () => { setDisplayCheckouts([]); setDisplayCheckins([]); navigate("/home"); };

  const handleContinue = async () => {
    Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    try {
      const promises = displayCheckins.map(item => fetch(`${API_BASE}/api/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: item.barcode }) }));
      await Promise.all(promises);
      const priorityHolds = displayHolds.filter((hold: any) => Number(hold.priority) === 1);
      for (const hold of priorityHolds) {
        const biblio = biblios.find((b: any) => Number(b.biblio_id) === Number(hold.biblio_id));
        const patron = patrons.find((p: any) => Number(p.patron_id) === Number(hold.patron_id));
        await sendHoldNotification(biblio?.title || "Book", patron ? `${patron.firstname} ${patron.surname}` : "Patron");
      }
      navigate("/success", { state: { from: '/checkin' } });
      Swal.close();
    } catch (error) { Swal.fire({ title: 'Error', icon: 'error' }); }
  };

  // --- RENDER LOGIC (Translated) ---

  if (path === '/home') {
    return (
      <div className={wrapperClass}>
        <div><span className="text-[#2ecc71]">● {t.available}</span> | {t.kiosk_num}</div>
        <div>📍 {t.main_floor} | ⏰ {t.service_24_7}</div>
      </div>
    );
  }

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

  else if (path === '/success') {
    const handleMoreCheckout = () => { setDisplayCheckouts([]); navigate("/checkout"); };
    const handleMoreCheckin = () => { setDisplayCheckins([]); navigate("/checkin"); };
    const handleDone = () => { setDisplayCheckouts([]); setDisplayCheckins([]); navigate("/home"); };

    return (
      <div className={wrapperClass}>
        <button className="bg-[rgb(52_152_219)] hover:bg-[rgb(41_128_185)] flex items-center py-[15px] px-[35px] rounded-[8px] transition-all duration-300" onClick={handleDone}>
          <div className="mr-2">🏠</div>
          <div>{t.done}</div>
        </button>
        {locationBefore === '/checkout' ? (
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

  else if (path === '/onholddetected') {
    return (
      <div className={wrapperClass}>
        <button className="py-[15px] px-[35px] rounded-[8px] bg-[rgb(46_204_113)] hover:bg-[rgb(39_174_96)] transition-all duration-300" onClick={handleContinue}>
          <div>✓ {t.continue}</div>
        </button>
      </div>
    );
  }

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