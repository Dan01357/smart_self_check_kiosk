import axios from 'axios';

// Ensure this matches your Ubuntu IP
const API_BASE = "http://192.168.0.172:4040"; 
const token = btoa("administrator:Zxcqwe123$"); 

export async function checkoutBook(patronId: number, itemId: number | undefined) {
  if (!itemId) throw new Error("Invalid Item ID");

  try {
    const url = `${API_BASE}/api/v1/checkouts`;
    const body = { patron_id: patronId, item_id: itemId };
    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`
      }
    };

    const response = await axios.post(url, body, config);

    // CRITICAL: Check if response.data exists before returning
    if (response.data && response.data.checkout_id) {
        return response.data;
    }
    
    throw new Error("Checkout failed: Server did not return a checkout ID");

  } catch (error: any) {
    // This will catch the "Unknown error during checkout" from your backend
    const errorMessage = error.response?.data?.error || error.message || "Network Error";
    throw new Error(errorMessage);
  }
}
