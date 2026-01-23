import { useLocation } from "react-router-dom";
import { UserBtn } from './UserBtn'
const Header = () => {
  const location = useLocation();
  const path = location.pathname;

  
  // This replaces the 'locationBefore' prop for the success page logic
  const fromPath = location.state?.from;

  // Base Wrapper Style (Exact same as your original)
  const wrapperClass = "fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1080px] max-h-[1920px] bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-7 pb-28 px-10 z-100";

  // Shared Components to keep code clean but styles identical
  const Logo = ({ title }: { title: string }) => (
    <div className="flex items-center font-bold flex-shrink-0 whitespace-nowrap ">
      <div className="bg-white px-3 rounded-[8px] mr-3">
        <div className="text-[40px]">📚</div>
      </div>
      <div className="text-[40px]">{title}</div>
    </div>
  );

  const HelpBtn = () => (
    <button className="border border-white border-2 text-[25px] px-7 rounded-[10px] flex items-center hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20">
      <div className="mr-1">❓</div>
      <div>Help</div>
    </button>
  );

  const LangBtn = () => (
    <button className="border border-white border-2 text-[25px] px-8 rounded-[10px] flex items-center mr-4 hover:bg-white hover:text-[#27ae60] transition-colors duration-300 bg-white/20">
      <div className="mr-1">🌐</div>
      <div>EN</div>
    </button>
  );

  // --- LOGIC BLOCKS ---

  if (path === '/home') {
    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between">
          <Logo title="Self Checkout" />
          <div className="flex">
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
        <div className="flex text-white justify-between">
          <Logo title="Login Required" />
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
        <div className="flex text-white justify-between">
          <Logo title="My Account" />
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
          <Logo title="Checkout Mode" />
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
        <div className="flex text-white justify-between">
          <Logo title="Return Mode" />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }

  if (path === '/success') {
    // Determine title based on where they came from
    const successTitle = fromPath === '/checkin' ? "Return Complete" : "Checkout Complete";

    return (
      <div className={wrapperClass}>
        <div className="flex text-white justify-between">
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
        <div className="flex text-white justify-between">
          <Logo title="Renewal Mode" />
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
        <div className="flex text-white justify-between">
          <Logo title="Reservation Mode" />
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
        <div className="flex text-white justify-between">
          <Logo title="On Hold Detected" />
          <div className="flex">
            <HelpBtn />
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Header;