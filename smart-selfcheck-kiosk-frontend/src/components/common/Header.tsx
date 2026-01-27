import { useLocation, useNavigate } from "react-router-dom";
import { UserBtn } from './UserBtn';
import { useState } from 'react'; // Added
import { translations } from "../../utils/translations";
import { useKiosk } from "../../context/KioskContext";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { language, setLanguage } = useKiosk(); // Pull language from Context
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const fromPath = location.state?.from;
  const t:any = (translations as any)[language ] || translations.EN; // Shortcut for translation

  const wrapperClass = "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-7 pb-28 px-10 z-[100]";

  const Logo = ({ title }: { title: string }) => (
    <div className="flex items-center font-bold flex-shrink-0 whitespace-nowrap ">
      <div className="bg-white px-3 rounded-[8px] mr-3">
        <div className="text-[40px]">📚</div>
      </div>
      <div className="text-[40px]">{title}</div>
    </div>
  );

  const HelpBtn = () => (
    <button className="border border-white border-2 text-[25px] px-7 py-2 rounded-[10px] flex items-center hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20" onClick={() => navigate('/help')}>
      <div className="mr-1">❓</div>
      <div>{t.help}</div>
    </button>
  );

  const LangBtn = () => (
    <div className="relative">
      <button 
        className="border border-white border-2 text-[25px] px-8 py-2 rounded-[10px] flex items-center mr-4 hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20"
        onClick={() => setIsLangOpen(!isLangOpen)}
      >
        <div className="mr-1">🌐</div>
        <div>{language}</div>
      </button>

      {isLangOpen && (
        <div className="absolute top-full mt-2 left-0 w-[150px] bg-white rounded-[10px] shadow-xl overflow-hidden z-[110]">
          {['EN', 'JP', 'KO'].map((lang: any) => (
            <button
              key={lang}
              className="w-full text-left px-6 py-4 text-[22px] text-gray-800 hover:bg-gray-100 border-b border-gray-100 last:border-none"
              onClick={() => {
                setLanguage(lang);
                setIsLangOpen(false);
              }}
            >
              {lang === 'EN' ? 'English' : lang === 'JP' ? '日本語' : '한국어'}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // LOGIC BLOCKS using translated titles
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

  if (path === '/') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between items-center">
          <Logo title={t.login_required} />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

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

  if (path === '/success') {
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
  return null;
};

export default Header;