import { useState, useRef } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./KeyboardPad.css";
import { useKiosk } from "../../context/KioskContext";
import { translations } from "../../utils/translations"; // Import translations

export default function KeyboardPad() {
  const { isKeyboardOpen, closeKeyboard, keyboardCallback, language } = useKiosk(); // Get language
  const [input, setInput] = useState<string>("");
  const [layout, setLayout] = useState<string>("default");
  const keyboard = useRef<any>(null);

  // Translation helper
  const t:any = (translations as any)[language ] || translations.EN;

  if (!isKeyboardOpen) return null;

  const onKeyPress = (button: string): void => {
    if (button === "{shift}" || button === "{lock}") {
      setLayout(layout === "default" ? "shift" : "default");
    }
    if (button === "{enter}") handleDone();
  };

  const handleDone = () => {
    keyboardCallback(input); // Send data to the component that opened the keyboard
    setInput(""); // Reset for next use
    keyboard.current?.setInput("");
    closeKeyboard();
  };

  return (
    <div className="container">
      <div className="blur-overlay">
        <div className="modal-content">
          <h3 className="modal-content-text">{t.enter_details}</h3>
          <input
            autoFocus
            value={input}
            onChange={(e) => {
                setInput(e.target.value);
                keyboard.current?.setInput(e.target.value);
            }}
            className="popup-input"
            onKeyDown={(e) => e.key === "Enter" && handleDone()}
          />
          <button onClick={handleDone} className="done-btn">{t.done_btn_keyboard}</button>
        </div>
        <div className="keyboard-wrapper">
          <Keyboard
            keyboardRef={(r) => (keyboard.current = r)}
            layoutName={layout}
            onChange={(val) => setInput(val)}
            onKeyPress={onKeyPress}
          />
        </div>
      </div>
    </div>
  );
}