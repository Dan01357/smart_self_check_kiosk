import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface KioskContextType {
  authorized: boolean;
  setAuthorized: (value: boolean) => void;
  patronId: number;
  setPatronId: (id: number) => void;
  logout: () => void;
  // Keyboard Global State
  isKeyboardOpen: boolean;
  keyboardCallback: (val: string) => void;
  openKeyboard: (onDone: (val: number) => void) => void;
  closeKeyboard: () => void;
  checkouts: any[];
  setCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  biblios: [];
  setBiblios: (value: []) => void;
  items: [];
  setItems: (value: []) => void;
  displayCheckouts: any[];
  setDisplayCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  showScanner: boolean;
  setShowScanner: React.Dispatch<React.SetStateAction<boolean>>;
  displayCheckins: any[];
  setDisplayCheckins: React.Dispatch<React.SetStateAction<any[]>>;
  setPatronName: React.Dispatch<React.SetStateAction<string>>;
  patronName: string;
  handleLoginSuccess:()=>void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const [authorized, setAuthorized] = useState<boolean>(() => {
    return localStorage.getItem("kiosk_auth") === "true";
  });

  const [patronId, setPatronId] = useState<number>(0);
  const [patronName, setPatronName] = useState<string>('');

  // Data from API
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [biblios, setBiblios] = useState<[]>([]);
  const [items, setItems] = useState<[]>([]);

  // UI Session Lists (The "shopping carts")
  const [displayCheckouts, setDisplayCheckouts] = useState<any[]>([]);
  const [displayCheckins, setDisplayCheckins] = useState<any[]>([]);

  // UI States
  const [showScanner, setShowScanner] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => { });

  // UPDATED: Clear EVERYTHING related to the user session
  const logout = () => {
    setAuthorized(false);
    setPatronId(0);
    setPatronName('');

    // Clear the books lists so the next user starts fresh
    setCheckouts([]);
    setDisplayCheckouts([]);
    setDisplayCheckins([]);

    // Close any open UI elements
    setIsKeyboardOpen(false);
    setShowScanner(false);
  };
  const handleLoginSuccess = () => {
    setAuthorized(true);
    localStorage.setItem("kiosk_auth", "true");
  }


  const openKeyboard = (onDone: (val: number) => void) => {
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