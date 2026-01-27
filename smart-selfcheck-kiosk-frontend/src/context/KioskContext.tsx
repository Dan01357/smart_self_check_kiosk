import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface KioskContextType {
  authorized: boolean;
  setAuthorized: (value: boolean) => void;
  patronId: number;
  setPatronId: (id: number) => void;
  logout: () => void;
  isKeyboardOpen: boolean;
  keyboardCallback: (val: string) => void;
  openKeyboard: (onDone: (val: any) => void) => void;
  closeKeyboard: () => void;
  checkouts: any[];
  setCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  biblios: any[];
  setBiblios: (value: any[]) => void;
  items: any[];
  setItems: (value: any[]) => void;
  displayCheckouts: any[];
  setDisplayCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  showScanner: boolean;
  setShowScanner: React.Dispatch<React.SetStateAction<boolean>>;
  displayCheckins: any[];
  setDisplayCheckins: React.Dispatch<React.SetStateAction<any[]>>;
  setPatronName: React.Dispatch<React.SetStateAction<string>>;
  patronName: string;
  handleLoginSuccess: () => void;
  holds: any[];
  setHolds: React.Dispatch<React.SetStateAction<any[]>>;
  // NEW STATES ADDED TO INTERFACE
  allHolds: any[];
  setAllHolds: React.Dispatch<React.SetStateAction<any[]>>;
  allCheckouts: any[];
  setAllCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  patrons: any[];
  setPatrons: React.Dispatch<React.SetStateAction<any[]>>;
  API_BASE: string;
  displayHolds: any[];
  setDisplayHolds: React.Dispatch<React.SetStateAction<any[]>>;
  language: 'EN' | 'JP' | 'KO';
  setLanguage: React.Dispatch<React.SetStateAction<'EN' | 'JP' | 'KO'>>;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  // 1. Initialize states from LocalStorage
  const [authorized, setAuthorized] = useState<boolean>(() => localStorage.getItem("kiosk_auth") === "true");
  const [patronId, setPatronId] = useState<number>(() => Number(localStorage.getItem("kiosk_patron_id")) || 0);
  const [patronName, setPatronName] = useState<string>(() => localStorage.getItem("kiosk_patron_name") || '');

  const [checkouts, setCheckouts] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_checkouts") || "[]"));
  const [biblios, setBiblios] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_biblios") || "[]"));
  const [items, setItems] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_items") || "[]"));
  const [holds, setHolds] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_holds") || "[]"));

  // NEW: Global data lists persistence
  const [allHolds, setAllHolds] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_all_holds") || "[]"));
  const [allCheckouts, setAllCheckouts] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_all_checkouts") || "[]"));
  const [patrons, setPatrons] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_all_patrons") || "[]"));

  const [displayCheckouts, setDisplayCheckouts] = useState<any[]>(() =>
    JSON.parse(localStorage.getItem("kiosk_display_checkouts") || "[]")
  );
  const [displayCheckins, setDisplayCheckins] = useState<any[]>(() =>
    JSON.parse(localStorage.getItem("kiosk_display_checkins") || "[]")
  );
  const [displayHolds, setDisplayHolds] = useState<any[]>(() =>
    JSON.parse(localStorage.getItem("kiosk_display_holds") || "[]")
  );

  const [showScanner, setShowScanner] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => { });

  // 2. Update Persist Logic (Synchronization with LocalStorage)
  useEffect(() => {
    localStorage.setItem("kiosk_patron_id", patronId.toString());
    localStorage.setItem("kiosk_patron_name", patronName);
    localStorage.setItem("kiosk_checkouts", JSON.stringify(checkouts));
    localStorage.setItem("kiosk_biblios", JSON.stringify(biblios));
    localStorage.setItem("kiosk_items", JSON.stringify(items));
    localStorage.setItem("kiosk_holds", JSON.stringify(holds));

    // Persist global lists
    localStorage.setItem("kiosk_all_holds", JSON.stringify(allHolds));
    localStorage.setItem("kiosk_display_holds", JSON.stringify(displayHolds));
    localStorage.setItem("kiosk_all_checkouts", JSON.stringify(allCheckouts));
    localStorage.setItem("kiosk_all_patrons", JSON.stringify(patrons));

    localStorage.setItem("kiosk_display_checkouts", JSON.stringify(displayCheckouts));
    localStorage.setItem("kiosk_display_checkins", JSON.stringify(displayCheckins));
  }, [patronId, patronName, checkouts, biblios, items, holds, allHolds, allCheckouts, patrons, displayCheckouts, displayCheckins, displayHolds]);

  const logout = () => {
    setAuthorized(false);
    setPatronId(0);
    setPatronName('');
    setCheckouts([]);
    setBiblios([]);
    setItems([]);
    setHolds([]);
    setAllHolds([]);
    setAllCheckouts([]);
    setPatrons([]);
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    setDisplayHolds([]);
    setIsKeyboardOpen(false);
    setShowScanner(false);
    localStorage.clear();
  };

  const handleLoginSuccess = () => {
    setAuthorized(true);
    localStorage.setItem("kiosk_auth", "true");
  }

  const [language, setLanguage] = useState<'EN' | 'JP' | 'KO'>('EN');

  const openKeyboard = (onDone: (val: any) => void) => {
    setKeyboardCallback(() => onDone);
    setIsKeyboardOpen(true);
  };

  const closeKeyboard = () => setIsKeyboardOpen(false);

  return (
    <KioskContext.Provider value={{
      authorized, setAuthorized, patronId, setPatronId, logout,
      isKeyboardOpen, openKeyboard, closeKeyboard, keyboardCallback,
      checkouts, setCheckouts, biblios, setBiblios, items, setItems,
      displayCheckouts, setDisplayCheckouts, showScanner, setShowScanner,
      displayCheckins, setDisplayCheckins, patronName, setPatronName,
      handleLoginSuccess, holds, setHolds,
      allHolds, setAllHolds, allCheckouts, setAllCheckouts, patrons, setPatrons, // NEWLY EXPORTED
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