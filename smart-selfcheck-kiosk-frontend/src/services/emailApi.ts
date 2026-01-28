// emailApi.ts
import axios from "axios";

/**
 * API_BASE: The base URL for the backend server.
 * It prioritizes the environment variable VITE_API_BASE_URL, 
 * falling back to the hardcoded IP if not defined.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

/**
 * sendHoldNotification:
 * Sends a request to the backend to trigger an email via the Resend service.
 * This notifies a patron that a book they reserved is now available.
 * 
 * @param bookTitle - The title of the book that was returned/is ready.
 * @param patronName - The name of the patron receiving the book.
 * @param language - The language code (EN, JP, KO) for email translation.
 */
export const sendHoldNotification = async (bookTitle: string, patronName: string, language: string) => {
  try {
    // Making a POST request to the backend email route with the necessary payload
    const response = await axios.post(`${API_BASE}/api/v1/send-hold-email`, {
      bookTitle,
      patronName,
      language, // Pass the language code to the backend for localized content
    });

    console.log("Email request sent to backend:", response.data);
    return { success: true };
  } catch (err) {
    // Log any network or server errors that occur during the request
    console.error("Backend Email Error:", err);
    return { success: false, error: err };
  }
};