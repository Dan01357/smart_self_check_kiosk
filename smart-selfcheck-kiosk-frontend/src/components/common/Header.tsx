import { useLocation, useNavigate } from "react-router-dom";
import { UserBtn } from './UserBtn';
import { useState } from 'react'; 
import { translations } from "../../utils/translations";
import { useKiosk } from "../../context/KioskContext";

/**
 * Header Component
 * Provides the top navigation bar, dynamic titles based on current route,
 * language switching functionality, and access to help/user profile.
 */
const Header = () => {
  // Hooks to access routing information and navigation
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  // Accessing global state from KioskContext
  const { language, setLanguage } = useKiosk(); 
  
  // Local state to handle the visibility of the language dropdown menu
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  // Navigation state passed during transitions (used to determine if we came from checkin or checkout)
  const fromPath = location.state?.from;

  // Translation helper: selects the correct dictionary based on the current context language
  const t:any = (translations as any)[language ] || translations.EN;

  // Shared CSS for the header container: fixed position, gradient background, and z-index for layering
  const wrapperClass = "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-7 pb-28 px-10 z-[100]";

  /**
   * Logo Sub-component
   * Renders the library icon and the dynamic page title.
   */
  const Logo = ({ title }: { title: string }) => (
    <div className="flex items-center font-bold flex-shrink-0 whitespace-nowrap ">
      <div className="bg-white px-3 rounded-[8px] mr-3">
        <div className="text-[40px]">📚</div>
      </div>
      <div className="text-[40px]">{title}</div>
    </div>
  );

  /**
   * HelpBtn Sub-component
   * Navigates the user to the help/support page.
   */
  const HelpBtn = () => (
    <button className="border border-white border-2 text-[25px] px-7 py-2 rounded-[10px] flex items-center hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20" onClick={() => navigate('/help')}>
      <div className="mr-1">❓</div>
      <div>{t.help}</div>
    </button>
  );

  /**
   * LangBtn Sub-component
   * A dropdown selector that allows users to change the system language (EN, JP, KO).
   */
  const LangBtn = () => (
    <div className="relative">
      <button 
        className="border border-white border-2 text-[25px] px-8 py-2 rounded-[10px] flex items-center mr-4 hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20"
        onClick={() => setIsLangOpen(!isLangOpen)}
      >
        <div className="mr-1">🌐</div>
        <div>{language}</div>
      </button>

      {/* Language Dropdown Menu */}
      {isLangOpen && (
        <div className="absolute top-full mt-2 left-0 w-[150px] bg-white rounded-[10px] shadow-xl overflow-hidden z-[110]">
          {['EN', 'JP', 'KO'].map((lang: any) => (
            <button
              key={lang}
              className="w-full text-left px-6 py-4 text-[22px] text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-none"
              onClick={() => {
                setLanguage(lang); // Updates global context
                setIsLangOpen(false); // Closes dropdown
              }}
            >
              {lang === 'EN' ? 'English' : lang === 'JP' ? '日本語' : '한국어'}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // --- CONDITIONAL RENDERING BASED ON CURRENT PATH ---

  // Header layout for the Home screen
  if (path === '/home') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.self_checkout} />
          <div className="flex items-center">
            <LangBtn />
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Login screen (Root)
  if (path === '/') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.login_required} />
          <div className="flex">
            <LangBtn />
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Patron Account page
  if (path === '/account') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.my_account} />
          <div className="flex">
            <UserBtn />
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Borrowing/Checkout mode
  if (path === '/checkout') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.checkout_mode} />
          <div className="flex items-center justify-end min-w-0 gap-4">
            <UserBtn />
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Returning/Check-in mode
  if (path === '/checkin') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.return_mode} />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Success/Completion screen
  if (path === '/success') {
    // Dynamically set title based on whether the user just finished a return or a checkout
    const successTitle = fromPath === '/checkin' ? t.return_complete : t.checkout_complete;
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={successTitle} />
          <div className="flex">
            <UserBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Book Renewal screen
  if (path === '/renew') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.renewal_mode} />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Reservations/Holds screen
  if (path === '/hold') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.reservation_mode} />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for when a book with an active hold is detected during return
  if (path === '/onholddetected') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.hold_detected} />
          <div className="flex">
            <HelpBtn  />
          </div>
        </div>
      </div>
    );
  }

  // Header layout for the Help and Support page
  if (path === '/help') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.help_support} />
          <div className="flex"></div>
        </div>
      </div>
    );
  }

  // Fallback if the path does not match any of the above
  return null;
};

export default Header;