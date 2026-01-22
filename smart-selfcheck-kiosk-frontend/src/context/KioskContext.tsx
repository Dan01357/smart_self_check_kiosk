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
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize states directly from LocalStorage (Added displayCheckouts)
  const [authorized, setAuthorized] = useState<boolean>(() => localStorage.getItem("kiosk_auth") === "true");
  const [patronId, setPatronId] = useState<number>(() => Number(localStorage.getItem("kiosk_patron_id")) || 0);
  const [patronName, setPatronName] = useState<string>(() => localStorage.getItem("kiosk_patron_name") || '');
  const [checkouts, setCheckouts] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_checkouts") || "[]"));
  const [biblios, setBiblios] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_biblios") || "[]"));
  const [items, setItems] = useState<any[]>(() => JSON.parse(localStorage.getItem("kiosk_items") || "[]"));
  
  // PERSIST SCANNED ITEMS: Initialize from local storage instead of empty array
  const [displayCheckouts, setDisplayCheckouts] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem("kiosk_display_checkouts") || "[]")
  );
  const [displayCheckins, setDisplayCheckins] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem("kiosk_display_checkins") || "[]")
  );

  const [showScanner, setShowScanner] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => { });

  // 2. Update Persist Logic to include displayCheckouts and displayCheckins
  useEffect(() => {
    localStorage.setItem("kiosk_patron_id", patronId.toString());
    localStorage.setItem("kiosk_patron_name", patronName);
    localStorage.setItem("kiosk_checkouts", JSON.stringify(checkouts));
    localStorage.setItem("kiosk_biblios", JSON.stringify(biblios));
    localStorage.setItem("kiosk_items", JSON.stringify(items));
    
    // Save the UI display lists so they survive refresh
    localStorage.setItem("kiosk_display_checkouts", JSON.stringify(displayCheckouts));
    localStorage.setItem("kiosk_display_checkins", JSON.stringify(displayCheckins));
  }, [patronId, patronName, checkouts, biblios, items, displayCheckouts, displayCheckins]);

  const logout = () => {
    setAuthorized(false);
    setPatronId(0);
    setPatronName('');
    setCheckouts([]);
    setBiblios([]);
    setItems([]);
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    setIsKeyboardOpen(false);
    setShowScanner(false);
    localStorage.clear(); 
  };

  const handleLoginSuccess = () => {
    setAuthorized(true);
    localStorage.setItem("kiosk_auth", "true");
  }

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
      displayCheckins, setDisplayCheckins, patronName, setPatronName, handleLoginSuccess
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