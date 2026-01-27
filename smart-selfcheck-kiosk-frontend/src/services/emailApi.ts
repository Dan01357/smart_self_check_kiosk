// emailApi.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

export const sendHoldNotification = async (bookTitle: string, patronName: string, language: string) => {
  try {
    const response = await axios.post(`${API_BASE}/api/v1/send-hold-email`, {
      bookTitle,
      patronName,
      language, // Pass the language here
    });

    console.log("Email request sent to backend:", response.data);
    return { success: true };
  } catch (err) {
    console.error("Backend Email Error:", err);
    return { success: false, error: err };
  }
};