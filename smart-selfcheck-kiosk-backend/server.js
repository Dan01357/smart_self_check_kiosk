import express from "express";
import cors from "cors";
import net from "net"
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

const KOHA_IP_SIP2 = '192.168.0.149';
const KOHA_PORT_SIP2 = 6001;

const token = Buffer.from(`${KOHA_USER}:${KOHA_PASS}`).toString('base64');
const authHeader = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${token}`
};

console.log("-----------------------------------------");
console.log(`Backend targeting Koha at: ${KOHA_URL}`);
console.log("-----------------------------------------");

function getSipTimestamp() {
    const now = new Date();
    const Y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const D = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    // SIP2 format: YYYYMMDD    HHMMSS (4 spaces between)
    return `${Y}${M}${D}    ${h}${m}${s}`;
}

// Function to talk to SIP2
// --- SIP2 FUNCTION ---
function sendSipMessage(message) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';

        client.connect(KOHA_PORT_SIP2, KOHA_IP_SIP2, () => {
            console.log("Connected to SIP2. Sending Login + Checkin...");
            const login = "9300CNsip_username|COSip2pass|CPMARAWI|\r";
            client.write(login + message + "\r");
        });

        client.on('data', (data) => {
            responseData += data.toString();
            console.log("Buffer contains:", responseData);

            // Check if the buffer contains a message starting with '10' (Checkin Response)
            // We split by \r because Koha sends multiple messages
            const lines = responseData.split(/[\r\n]+/);
            const checkinResponse = lines.find(line => line.startsWith('10'));

            if (checkinResponse) {
                console.log("Found Checkin Response:", checkinResponse);
                client.destroy();
                resolve(checkinResponse); // Send only the 101... part back
            }
        });

        client.on('error', (err) => {
            client.destroy();
            reject(err);
        });

        // Increased timeout to 10 seconds because Zebra indexing can be slow
        client.setTimeout(10000, () => {
            client.destroy();
            reject(new Error("Koha SIP2 Timeout - But check Koha, it might have worked!"));
        });
    });
}

// HTTP Endpoint for React
app.post('/api/checkin', async (req, res) => {
    const { barcode } = req.body;

    try {
        // 1. Find the item ID first using the barcode
        const items = await safeKohaGet(`/items?external_id=${barcode}`);
        const item = items[0];

        let isOverdue = false;

        if (item) {
            // 2. Look for an active checkout for this item
            const checkouts = await safeKohaGet(`/checkouts?item_id=${item.item_id}`);
            if (checkouts.length > 0) {
                const dueDate = new Date(checkouts[0].due_date);
                const now = new Date();
                // 3. Compare dates manually
                isOverdue = dueDate < now;
            }
        }

        // 4. Proceed with the SIP2 Checkin
        const sipDate = getSipTimestamp();
        const checkinMsg = `09N${sipDate}${sipDate}|APMARAWI|AOMARAWI|AB${barcode}|`;
        const result = await sendSipMessage(checkinMsg);

        const success = result.substring(0, 3) === '101';

        res.json({
            success,
            raw: result,
            isOverdue: isOverdue // This is now calculated accurately from the DB
        });
    } catch (error) {
        console.error("Checkin Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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
            res.json({
                success: "true", message: "Login Successful", patron_id: authorized.patron_id,
                patron_name: `${authorized.firstname} ${authorized.surname}`
            });
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
app.get(`/api/v1/checkouts`, async (req, res) => {
    const { patronId } = await req.query
    if (patronId) {
        const data = await safeKohaGet(`/patrons/${patronId}/checkouts`);
        res.json(data);
    }
    else{
        const data = await safeKohaGet(`/checkouts`);
        res.json(data);
    }

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
// --- RENEWAL ROUTE ---
app.post("/api/v1/renew", async (req, res) => {
    const { checkout_id } = req.body;

    if (!checkout_id) {
        return res.status(400).json({ error: "Missing checkout_id" });
    }

    try {
        console.log(`Attempting renewal for Checkout ID: ${checkout_id}`);

        // Koha API renewal endpoint: POST /checkouts/{checkout_id}/renewal
        const response = await axios.post(
            `${KOHA_URL}/checkouts/${checkout_id}/renewal`,
            {}, // Koha expects an empty body for this POST
            { headers: authHeader }
        );

        // Success! Return the new checkout data (with the new due_date)
        res.json(response.data);

    } catch (error) {
        console.error("KOHA RENEWAL ERROR:", error.response?.data || error.message);

        // Forward the specific error from Koha
        // Example: Koha might return "unrenewable_overdue" or "too_many_holds"
        const kohaError = error.response?.data?.error || "Koha API Error";
        res.status(error.response?.status || 500).json({ error: kohaError });
    }
});

//Holds
app.get('/api/v1/holds', async (req, res) => {
    try {
        const { patronId } = req.query; // No need for 'await' on req.query

        // 1. Strict check: If patronId is missing, null, or the string "undefined"
        if (!patronId || patronId === 'undefined' || patronId === 'null') {
            const data = await safeKohaGet(`/holds`);

            return res.json(data);
        }

        // 2. Only fetch specific patron holds
        const data = await safeKohaGet(`/patrons/${patronId}/holds`);
        res.json(data);
    } catch (error) {
        console.error("Backend Holds Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- DELETE (CANCEL) HOLD ROUTE ---
app.delete('/api/v1/holds', async (req, res) => {
    // Get holdId from query string (from frontend ?holdId=...)
    const { holdId } = req.query;

    if (!holdId) {
        return res.status(400).json({ error: "Missing holdId" });
    }

    try {
        console.log(`Attempting to cancel Hold ID: ${holdId}`);

        // IMPORTANT: Use axios.delete, NOT safeKohaGet
        // Koha Path: DELETE /holds/{hold_id}
        const response = await axios.delete(
            `${KOHA_URL}/holds/${holdId}`,
            { headers: authHeader }
        );

        // Koha returns 204 No Content on successful deletion
        if (response.status === 204 || response.status === 200) {
            console.log(`Successfully cancelled Hold: ${holdId}`);
            return res.json({ success: true, message: "Hold cancelled" });
        }

    } catch (error) {
        console.error("KOHA DELETE HOLD ERROR:", error.response?.data || error.message);

        // If Koha returns an HTML 404, it means the REST API path is wrong or the ID doesn't exist
        const status = error.response?.status || 500;
        const msg = error.response?.data?.error || "Koha API Error or Hold ID not found";

        res.status(status).json({ error: msg });
    }
});
// --- START SERVER ---
app.listen(4040, "0.0.0.0", () => {
    console.log("SUCCESS: Backend Server listening on port 4040...");
});

