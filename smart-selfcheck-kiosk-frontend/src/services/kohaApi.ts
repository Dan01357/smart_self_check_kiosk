import axios from 'axios';

/**
 * Configuration for the API connection.
 * Uses environment variables if available, otherwise defaults to the local network IP of the backend server.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.149:4040";

/**
 * Basic Authentication token generation.
 * Encodes the Koha administrative credentials into a Base64 string for the Authorization header.
 */
const token = btoa("administrator:Zxcqwe123$");

/**
 * checkoutBook:
 * Sends a request to the backend/Koha API to finalize the borrowing process for a specific item.
 * 
 * @param patronId - The unique numerical ID of the patron borrowing the book.
 * @param itemId - The internal Koha item ID of the book being borrowed.
 */
export async function checkoutBook(patronId: number, itemId: number | undefined) {
  // Guard clause to ensure an Item ID is present before attempting the request
  if (!itemId) throw new Error("Invalid Item ID");

  try {
    // API endpoint for creating new checkouts
    const url = `${API_BASE}/api/v1/checkouts`;
    
    // Request payload containing the patron and item relationship
    const body = { patron_id: patronId, item_id: itemId };
    
    // Request configuration including necessary security and content-type headers
    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`
      }
    };

    // Execute the POST request to the server
    const response = await axios.post(url, body, config);

    /**
     * CRITICAL VALIDATION:
     * We verify that the response from Koha contains a valid checkout_id.
     * This ensures the transaction was actually recorded in the database.
     */
    if (response.data && response.data.checkout_id) {
      return response.data;
    }

    // Throw error if the server response is malformed or missing the ID
    throw new Error("Checkout failed: Server did not return a checkout ID");

  } catch (error: any) {
    /**
     * Comprehensive Error Handling:
     * Captures specific error messages returned by the Koha backend (e.g., "Item is restricted")
     * or generic network/server errors.
     */
    const errorMessage = error.response?.data?.error || error.message || "Network Error";
    throw new Error(errorMessage);
  }
}