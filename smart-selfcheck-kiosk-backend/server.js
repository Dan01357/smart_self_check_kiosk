import express from "express";
import cors from "cors";
import axios from "axios";
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
// Hardcoding these to ensure the backend talks to Koha (8080) and not itself (4040)
const KOHA_URL = "http://192.168.0.149:8080/api/v1";
const KOHA_USER = "administrator";
const KOHA_PASS = "Zxcqwe123$";

const token = Buffer.from(`${KOHA_USER}:${KOHA_PASS}`).toString('base64');
const authHeader = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${token}`
};

console.log("-----------------------------------------");
console.log(`Backend targeting Koha at: ${KOHA_URL}`);
console.log("-----------------------------------------");

// --- REUSABLE SAFE FETCH FUNCTION ---
async function safeKohaGet(endpoint) {
    try {
        const response = await axios.get(`${KOHA_URL}${endpoint}`, { headers: authHeader });
        return response.data || [];
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.response?.data || error.message);
        return []; // Always return an array to prevent .find() crashes
    }
}

// --- ROUTES ---

// 1. Get Patrons
app.get("/api/v1/patrons", async (req, res) => {
    const data = await safeKohaGet('/patrons');
    res.json(data);
});

// 2. Login Route (Fixed .find() safety)
app.post("/api/v1/auth/login", async (req, res) => {
    try {
        const { cardnumber } = req.body;
        const patrons = await safeKohaGet('/patrons');

        // Safety check: ensure patrons is an array
        const patronList = Array.isArray(patrons) ? patrons : [];
        const authorized = patronList.find(p => p.cardnumber === cardnumber);

        if (authorized) {
            console.log(`Login Success: ${cardnumber}`);
            res.json({ success: "true", message: "Login Successful", patron_id: authorized.patron_id });
        } else {
            console.log(`Login Failed: ${cardnumber}`);
            res.json({ success: "false", message: "Card number does not exist" });
        }
    } catch (err) {
        console.error("Login Route Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Checkout POST Route (The logic that handles scanning books)
app.post("/api/v1/checkouts", async (req, res) => {
    try {
        const { patron_id, item_id } = req.body;

        if (!patron_id || !item_id) {
            return res.status(400).json({ error: "Missing patron_id or item_id" });
        }

        console.log(`Checkout Request -> Patron: ${patron_id}, Item: ${item_id}`);

        const response = await axios.post(`${KOHA_URL}/checkouts`, {
            patron_id: patron_id,
            item_id: item_id
        }, { headers: authHeader });

        // Return the actual checkout data from Koha to the frontend
        res.json(response.data);

    } catch (error) {
        console.error('KOHA API CHECKOUT ERROR:', error.response?.data || error.message);
        
        // Send specific library error back to UI (e.g. "Book already out")
        const errorMessage = error.response?.data?.error || "Koha API Error";
        res.status(error.response?.status || 500).json({ error: errorMessage });
    }
});

// 4. Get Checkouts (For UI History)
app.get("/api/v1/checkouts", async (req, res) => {
    const data = await safeKohaGet('/checkouts');
    res.json(data);
});

// 5. Get Biblios (For UI Title lookup)
app.get("/api/v1/biblios", async (req, res) => {
    const data = await safeKohaGet('/biblios');
    res.json(data);
});

// 6. Get Items (For UI Barcode lookup)
app.get("/api/v1/items", async (req, res) => {
    const data = await safeKohaGet('/items');
    res.json(data);
});

// --- START SERVER ---
app.listen(4040, "0.0.0.0", () => {
    console.log("SUCCESS: Backend Server listening on port 4040...");
});
