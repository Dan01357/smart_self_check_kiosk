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
  keyboardPrompt: string; // NEW
  openKeyboard: (onDone: (val: any) => void, prompt?: string) => void; // UPDATED
  closeKeyboard: () => void;
  showScanner: boolean;
  setShowScanner: React.Dispatch<React.SetStateAction<boolean>>;

  // Scanned Session Data
  displayCheckouts: any[];
  setDisplayCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  displayCheckins: any[];
  setDisplayCheckins: React.Dispatch<React.SetStateAction<any[]>>;
  displayHolds: any[];
  setDisplayHolds: React.Dispatch<React.SetStateAction<any[]>>;

  // Account Page Cache
  checkouts: any[];
  setCheckouts: React.Dispatch<React.SetStateAction<any[]>>;
  holds: any[];
  setHolds: React.Dispatch<React.SetStateAction<any[]>>;

  // Legacy / Compatibility
  biblios: any[];
  setBiblios: (v: any[]) => void;
  items: any[];
  setItems: (v: any[]) => void;
  patrons: any[];
  setPatrons: (v: any[]) => void;

  API_BASE: string;
  language: 'EN' | 'JP' | 'KO';
  setLanguage: React.Dispatch<React.SetStateAction<'EN' | 'JP' | 'KO'>>;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

  // Auth States
  const [authorized, setAuthorized] = useState<boolean>(() => localStorage.getItem("kiosk_auth") === "true");
  const [patronId, setPatronId] = useState<number>(() => Number(localStorage.getItem("kiosk_patron_id")) || 0);
  const [patronName, setPatronName] = useState<string>(() => localStorage.getItem("kiosk_patron_name") || '');

  // Session Data
  const [displayCheckouts, setDisplayCheckouts] = useState<any[]>([]);
  const [displayCheckins, setDisplayCheckins] = useState<any[]>([]);
  const [displayHolds, setDisplayHolds] = useState<any[]>([]);

  // Account Data
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [holds, setHolds] = useState<any[]>([]);
  
  // Keyboard Logic States
  const [keyboardPrompt, setKeyboardPrompt] = useState<string>(""); // NEW
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardCallback, setKeyboardCallback] = useState<(val: string) => void>(() => () => { });

  // Compatibility
  const [biblios, setBiblios] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [patrons, setPatrons] = useState<any[]>([]);

  // Language
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

  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    localStorage.setItem("kiosk_auth", authorized.toString());
    localStorage.setItem("kiosk_patron_id", patronId.toString());
    localStorage.setItem("kiosk_patron_name", patronName);
    localStorage.setItem("kiosk_lang", JSON.stringify(language));
  }, [authorized, patronId, patronName, language]);

  const logout = useCallback(() => {
    setAuthorized(false);
    setPatronId(0);
    setPatronName('');
    setDisplayCheckouts([]);
    setDisplayCheckins([]);
    setDisplayHolds([]);
    setCheckouts([]);
    setHolds([]);
    localStorage.clear();
    window.location.href = "/";
  }, []);

  const handleLoginSuccess = () => setAuthorized(true);

  // UPDATED: Now accepts a second "prompt" argument
  const openKeyboard = (onDone: (val: any) => void, prompt?: string) => { 
    setKeyboardCallback(() => onDone); 
    setKeyboardPrompt(prompt || ""); // Set the prompt text
    setIsKeyboardOpen(true); 
  };

  const closeKeyboard = () => setIsKeyboardOpen(false);

  return (
    <KioskContext.Provider value={{
      authorized, setAuthorized, patronId, setPatronId, logout,
      isKeyboardOpen, openKeyboard, closeKeyboard, keyboardCallback,
      keyboardPrompt, // NEW
      displayCheckouts, setDisplayCheckouts, showScanner, setShowScanner,
      displayCheckins, setDisplayCheckins, patronName, setPatronName,
      handleLoginSuccess, holds, setHolds, checkouts, setCheckouts,
      biblios, setBiblios, items, setItems, patrons, setPatrons,
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