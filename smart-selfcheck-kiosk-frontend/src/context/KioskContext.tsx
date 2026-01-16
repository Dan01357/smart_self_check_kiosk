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
  checkouts:any[];
  setCheckouts:React.Dispatch<React.SetStateAction<any[]>>;
  biblios:[];
  setBiblios:(value: []) => void;
  items:[];
  setItems:(value: []) => void;
  displayCheckouts:any[];
  setDisplayCheckouts:React.Dispatch<React.SetStateAction<any[]>>;
  showScanner:boolean;
  setShowScanner:React.Dispatch<React.SetStateAction<boolean>>;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [patronId, setPatronId] = useState<number>(0);

  const [checkouts, setCheckouts] = useState<any[]>([])
  const [biblios, setBiblios] = useState<[]>([])
  const [items, setItems] = useState<[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const[displayCheckouts, setDisplayCheckouts] = useState<any[]>([])
  // Keyboard states
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => {});

  const logout = () => {
    setAuthorized(false);
    setPatronId(0);
  };

  const openKeyboard = (onDone: (val: number) => void) => {
    setKeyboardCallback(() => onDone);
    setIsKeyboardOpen(true);
  };

  const closeKeyboard = () => setIsKeyboardOpen(false);

  return (
    <KioskContext.Provider value={{ 
      authorized, setAuthorized, patronId, setPatronId, logout,
      isKeyboardOpen, openKeyboard, closeKeyboard, keyboardCallback, checkouts, setCheckouts, biblios, setBiblios, items, setItems, displayCheckouts, setDisplayCheckouts , showScanner, setShowScanner
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