import { useState } from "react";
import { useKiosk } from "../../context/KioskContext";
import { translations } from "../../utils/translations";
 
export default function Numpad() {
  const { isKeyboardOpen, closeKeyboard, keyboardCallback, language, keyboardPrompt } = useKiosk();
  const [input, setInput] = useState<string>("");

  const t: any = (translations as any)[language] || translations.EN;

  if (!isKeyboardOpen) return null;

  const handlePress = (val: string) => {
    setInput((prev) => prev + val);
  };

  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleDone = () => {
    keyboardCallback(input);
    setInput("");
    closeKeyboard();
  };

  // Logic to check if the prompt requires a hidden input
  const isPassword = keyboardPrompt?.toLowerCase().includes("password") || 
                     keyboardPrompt?.toLowerCase().includes("pin");

  // Reusable button component to maintain your requested design
  const KeyButton = ({ children, onClick, className = "" }: any) => (
    <button
      onClick={onClick}
      className={`bg-gray-200 border-none px-4 py-4 rounded-lg text-[22px] min-w-[80px] font-bold cursor-pointer active:scale-95 transition-all duration-100 shadow-md ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        {/* Modal Content / Input Area */}
        <div className="bg-white p-6 rounded-t-[15px] w-full max-w-[400px] text-center shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            {keyboardPrompt || t.enter_details}
          </h3>
          
          <input
            autoFocus
            readOnly // Readonly because we use the custom buttons
            type={isPassword ? "password" : "text"}
            value={input}
            className="w-full p-4 text-2xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4 bg-gray-50"
            placeholder="••••"
          />
        </div>

        {/* Numpad Container based on your design code */}
        <div className="bg-[#34495e] p-[20px] rounded-b-[15px] w-full max-w-[400px] shadow-2xl">
          <div className="grid grid-cols-3 gap-[10px] justify-items-center">
            {/* Row 1 */}
            <KeyButton onClick={() => handlePress("1")}>1</KeyButton>
            <KeyButton onClick={() => handlePress("2")}>2</KeyButton>
            <KeyButton onClick={() => handlePress("3")}>3</KeyButton>

            {/* Row 2 */}
            <KeyButton onClick={() => handlePress("4")}>4</KeyButton>
            <KeyButton onClick={() => handlePress("5")}>5</KeyButton>
            <KeyButton onClick={() => handlePress("6")}>6</KeyButton>

            {/* Row 3 */}
            <KeyButton onClick={() => handlePress("7")}>7</KeyButton>
            <KeyButton onClick={() => handlePress("8")}>8</KeyButton>
            <KeyButton onClick={() => handlePress("9")}>9</KeyButton>

            {/* Row 4 */}
            <KeyButton onClick={handleDelete} className="bg-red-200 text-red-700">⌫</KeyButton>
            <KeyButton onClick={() => handlePress("0")}>0</KeyButton>
            <KeyButton onClick={handleDone} className="bg-green-500 text-white min-w-[100px]">
              {t.done_btn_keyboard || "OK"}
            </KeyButton>
          </div>
        </div>
      </div>
    </div>
  );
}