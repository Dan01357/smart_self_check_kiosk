// emailApi.ts
import axios from "axios";

// This should point to your own Express API, not Resend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";
// Use your actual backend URL

export const sendHoldNotification = async (bookTitle: string, patronName: string) => {
  try {
    // We call your backend endpoint
    const response = await axios.post(`${API_BASE}/api/v1/send-hold-email`, {
      bookTitle,
      patronName,
    });

    console.log("Email request sent to backend:", response.data);
    return { success: true };
  } catch (err) {
    console.error("Backend Email Error:", err);
    return { success: false, error: err };
  }
};