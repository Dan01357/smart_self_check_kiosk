import { useState, useRef } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./KeyboardPad.css";
import { useKiosk } from "../../context/KioskContext";
import { translations } from "../../utils/translations";

export default function KeyboardPad() {
  const { isKeyboardOpen, closeKeyboard, keyboardCallback, language, keyboardPrompt } = useKiosk();
  const [input, setInput] = useState<string>("");
  const [layout, setLayout] = useState<string>("default");
  const keyboard = useRef<any>(null);

  const t: any = (translations as any)[language] || translations.EN;

  if (!isKeyboardOpen) return null;

  const onKeyPress = (button: string): void => {
    if (button === "{shift}" || button === "{lock}") {
      setLayout(layout === "default" ? "shift" : "default");
    }
    if (button === "{enter}") handleDone();
  };

  const handleDone = () => {
    keyboardCallback(input);
    setInput("");
    keyboard.current?.setInput("");
    closeKeyboard();
  };

  // Logic to check if the prompt requires a hidden input
  const isPassword = keyboardPrompt?.toLowerCase().includes("password") || 
                     keyboardPrompt?.toLowerCase().includes("pin");

  return (
    <div className="container">
      <div className="blur-overlay">
        <div className="modal-content">
          {/* Display the prompt provided by the caller, fallback to translation */}
          <h3 className="modal-content-text">{keyboardPrompt || t.enter_details}</h3>
          
          <input
            autoFocus
            type={isPassword ? "password" : "text"}
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