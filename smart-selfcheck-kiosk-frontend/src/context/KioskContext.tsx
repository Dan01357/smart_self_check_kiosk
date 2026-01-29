import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

interface KioskContextType {
  authorized: boolean;
  setAuthorized: (val: boolean) => void;
  patronId: number;
  setPatronId: (id: number) => void;
  patronName: string;
  setPatronName: React.Dispatch<React.SetStateAction<string>>;
  handleLoginSuccess: () => void;
  logout: () => void;

  // UI States
  isKeyboardOpen: boolean;
  keyboardCallback: (val: string) => void;
  keyboardPrompt: string;
  openKeyboard: (onDone: (val: any) => void, prompt?: string) => void;
  closeKeyboard: () => void;
  showScanner: boolean;
  setShowScanner: React.Dispatch<React.SetStateAction<boolean>>;

  // Active Session Data (Scanned during the current visit)
  displayCheckouts: any[];
  setDisplayCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  displayCheckins: any[];
  setDisplayCheckins: React.Dispatch<React.SetStateAction<any[]>>;
  displayHolds: any[];
  setDisplayHolds: React.Dispatch<React.SetStateAction<any[]>>;

  // Account Page Cache (Current User's history)
  checkouts: any[];
  setCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  holds: any[];
  setHolds: React.Dispatch<React.SetStateAction<any[]>>;

  API_BASE: string;
  language: 'EN' | 'JP' | 'KO';
  setLanguage: React.Dispatch<React.SetStateAction<'EN' | 'JP' | 'KO'>>;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  // --- Auth States ---
  const [authorized, setAuthorized] = useState<boolean>(() => localStorage.getItem("kiosk_auth") === "true");
  const [patronId, setPatronId] = useState<number>(() => Number(localStorage.getItem("kiosk_patron_id")) || 0);
  const [patronName, setPatronName] = useState<string>(() => localStorage.getItem("kiosk_patron_name") || '');

  // --- Session Lists ---
  const [displayCheckouts, setDisplayCheckouts] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_display_checkouts") || "[]"));
  const [displayCheckins, setDisplayCheckins] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_display_checkins") || "[]"));
  const [displayHolds, setDisplayHolds] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_display_holds") || "[]"));

  // --- Account Data ---
  const [checkouts, setCheckouts] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_checkouts") || "[]"));
  const [holds, setHolds] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_holds") || "[]"));
  
  // --- UI Logic States ---
  const [keyboardPrompt, setKeyboardPrompt] = useState<string>(() => localStorage.getItem("kiosk_kb_prompt") || "");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(() => localStorage.getItem("kiosk_kb_open") === "true");
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => { });
  const [showScanner, setShowScanner] = useState(() => localStorage.getItem("kiosk_show_scanner") === "true");

  // --- Language ---
  const [language, setLanguage] = useState<'EN' | 'JP' | 'KO'>(() => {
    const stored = localStorage.getItem("kiosk_lang");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return (parsed === "EN" || parsed === "JP" || parsed === "KO") ? parsed : "EN";
      } catch (e) {
        return "EN";
      }
    }
    return "EN";
  });

  // Persist all state values to localStorage
  useEffect(() => {
    localStorage.setItem("kiosk_auth", authorized.toString());
    localStorage.setItem("kiosk_patron_id", patronId.toString());
    localStorage.setItem("kiosk_patron_name", patronName);
    localStorage.setItem("kiosk_lang", JSON.stringify(language));
    
    localStorage.setItem("kiosk_display_checkouts", JSON.stringify(displayCheckouts));
    localStorage.setItem("kiosk_display_checkins", JSON.stringify(displayCheckins));
    localStorage.setItem("kiosk_display_holds", JSON.stringify(displayHolds));
    
    localStorage.setItem("kiosk_checkouts", JSON.stringify(checkouts));
    localStorage.setItem("kiosk_holds", JSON.stringify(holds));
    
    localStorage.setItem("kiosk_kb_prompt", keyboardPrompt);
    localStorage.setItem("kiosk_kb_open", isKeyboardOpen.toString());
    localStorage.setItem("kiosk_show_scanner", showScanner.toString());
  }, [
    authorized, patronId, patronName, language, 
    displayCheckouts, displayCheckins, displayHolds, 
    checkouts, holds, keyboardPrompt, isKeyboardOpen, showScanner
  ]);

  const logout = useCallback(() => {
    setAuthorized(false);
    setPatronId(0);
    setPatronName('');
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    setDisplayHolds([]);
    setCheckouts([]);
    setHolds([]);
    setIsKeyboardOpen(false);
    setShowScanner(false);
    localStorage.clear();
    window.location.href = "/";
  }, []);

  const handleLoginSuccess = () => setAuthorized(true);

  const openKeyboard = (onDone: (val: any) => void, prompt?: string) => { 
    setKeyboardCallback(() => onDone); 
    setKeyboardPrompt(prompt || "");
    setIsKeyboardOpen(true); 
  };

  const closeKeyboard = () => setIsKeyboardOpen(false);

  return (
    <KioskContext.Provider value={{
      authorized, setAuthorized, patronId, setPatronId, logout,
      isKeyboardOpen, openKeyboard, closeKeyboard, keyboardCallback,
      keyboardPrompt,
      displayCheckouts, setDisplayCheckouts, showScanner, setShowScanner,
      displayCheckins, setDisplayCheckins, patronName, setPatronName,
      handleLoginSuccess, holds, setHolds, checkouts, setCheckouts,
      API_BASE, displayHolds, setDisplayHolds, language, setLanguage
    }}>
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) throw new Error("useKiosk must be used within a KioskProvider");
  return context;
};