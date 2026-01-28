import { useNavigate } from "react-router";
import { useKiosk } from "../../context/KioskContext";
import { useEffect, useRef, useState } from "react";
import { translations } from "../../utils/translations"; // Import translations

export const UserBtn = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { patronName, logout, language } = useKiosk(); // Get language from context
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Translation helper
  const t: any = (translations as any)[language] || translations.EN;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="relative inline-block mr-4" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border border-white border-2 text-[25px] px-7 py-2 rounded-[10px] flex items-center justify-between transition-all duration-300 z-20 relative
          ${isOpen ? 'bg-white text-[#2c3e50]' : 'bg-white/20 text-white hover:bg-white hover:text-[#27ae60]'}`}
      >
        <div className="flex items-center">
          <div className="mr-2">👤</div>
          <div className="font-semibold whitespace-nowrap truncate max-w-[250px] inline-block">{patronName ? patronName : "Guest"}</div>
        </div>
        <div className={`ml-3 text-[18px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute left-0 top-full mt-2 w-full bg-white rounded-[12px] shadow-2xl overflow-hidden transition-all duration-300 origin-top z-10
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-y-100'
            : 'opacity-0 -translate-y-4 scale-y-0 pointer-events-none'
          }`}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-4 text-[22px] text-[#e74c3c] hover:bg-red-50 transition-colors font-bold"
        >
          <span className="mr-2 text-[26px]">🚪</span>
          {t.logout_btn}
        </button>
      </div>
    </div>
  );
};