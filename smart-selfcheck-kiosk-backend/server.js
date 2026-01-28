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
// 1. API to check if the book is in checkouts

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

app.get('/api/check-book-incheckouts/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const itemsRes = await safeKohaGet(`/items?external_id=${barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === barcode);

    // CRITICAL: Check if book exists before asking for item_id
    if (!exactBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const checkoutRes = await safeKohaGet(`/checkouts?q={"item_id":${exactBook.item_id}}`);
    res.json({ checkoutRes: checkoutRes });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. API to check if the book is in holds
app.get('/api/check-book-inholds/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const itemsRes = await safeKohaGet(`/items?external_id=${barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === barcode);

    if (!exactBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const holdRes = await safeKohaGet(`/holds?q={"biblio_id":${exactBook.biblio_id}}`);
    res.json({ holdRes: holdRes });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post('/api/checkout-book/:barcode/:patronId', async (req, res) => {
  try {
    const { barcode, patronId } = req.params;

    // 1. Get Item & Biblio
    const itemsRes = await safeKohaGet(`/items?external_id=${barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === String(barcode));
    if (!exactBook) return res.status(404).json({ error: "Book not found" });

    // --- CHECK 1: Is it already checked out? ---
    const checkoutRes = await safeKohaGet(`/checkouts?q={"item_id":${exactBook.item_id}}`);
    if (checkoutRes.length > 0) {
      const currentPatron = parseInt(checkoutRes[0].patron_id);
      if (currentPatron === parseInt(patronId)) {
        return res.status(400).json({ error: "A book is already in your checkout list" });
      } else {
        return res.status(400).json({ error: "A book is already checked out by someone else" });
      }
    }

    // --- CHECK 2: Is it reserved by someone else? ---
    // We check holds for the Biblio. If there are holds and the first person isn't this patron:
    const holdRes = await safeKohaGet(`/holds?q={"biblio_id":${exactBook.biblio_id}}`);
    if (holdRes.length > 0) {
      // Sort by priority to find the person next in line
      const activeHolds = holdRes.sort((a, b) => a.priority - b.priority);
      if (parseInt(activeHolds[0].patron_id) !== parseInt(patronId)) {
        return res.status(400).json({ error: "A book is already reserved by someone else" });
      }
    }

    const biblio = await safeKohaGet(`/biblios/${exactBook.biblio_id}`);

    // 3. Perform Actual Checkout if all checks pass
    const response = await axios.post(`${KOHA_URL}/checkouts`, {
      patron_id: parseInt(patronId),
      item_id: parseInt(exactBook.item_id)
    }, { headers: authHeader });

    res.status(201).json({
      ...response.data,
      title: biblio.title || "Unknown Title",
      external_id: barcode
    });

  } catch (error) {
    console.error("Checkout Error:", error.response?.data || error.message);
    const msg = error.response?.data?.errors?.[0]?.message || 
                error.response?.data?.error || 
                "Checkout failed";
    res.status(error.response?.status || 500).json({ error: msg });
  }
});
// NEW ENDPOINT: Search for book details WITHOUT checking it out
app.get('/api/book-details/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const itemsRes = await safeKohaGet(`/items?external_id=${barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === barcode);

    if (!exactBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get Title from Biblio
    const biblio = await safeKohaGet(`/biblios/${exactBook.biblio_id}`);

    res.json({
      item_id: exactBook.item_id,
      title: biblio.title || "Unknown Title",
      external_id: barcode,
      biblio_id: exactBook.biblio_id
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// NEW SECURE ROUTE: Hidden Patron Book Lookup
app.post('/api/v1/my-books', async (req, res) => {
    try {
        const { patronId } = req.body;
        if (!patronId) return res.status(400).json({ error: "Identification required" });

        // 1. Get the checkouts (1 call)
        const checkouts = await safeKohaGet(`/patrons/${patronId}/checkouts`);
        if (checkouts.length === 0) return res.json([]);

        // 2. Collect all item_ids and fetch them in ONE call
        const itemIds = checkouts.map(c => c.item_id);
        // We use the 'q' parameter with an 'in' operator to get all items at once
        const items = await safeKohaGet(`/items?q={"item_id":{"-in":[${itemIds.join(',')}]}}`);

        // 3. Collect all biblio_ids from those items and fetch them in ONE call
        const biblioIds = items.map(i => i.biblio_id);
        const biblios = await safeKohaGet(`/biblios?q={"biblio_id":{"-in":[${biblioIds.join(',')}]}}`);

        // 4. Map them together in memory (instant)
        const hydratedCheckouts = checkouts.map(checkout => {
            const item = items.find(i => i.item_id === checkout.item_id);
            const biblio = item ? biblios.find(b => b.biblio_id === item.biblio_id) : null;
            
            return {
                ...checkout,
                title: biblio ? biblio.title : "Unknown Title"
            };
        });

        res.json(hydratedCheckouts);
    } catch (error) {
        console.error("Optimized Route Error:", error.message);
        res.status(500).json({ error: "Failed to fetch books" });
    }
});

// SECURE POST: Fetch patron's holds with titles (Fast Batching)
app.post('/api/v1/my-holds', async (req, res) => {
    try {
        const { patronId } = req.body;
        if (!patronId) return res.status(400).json({ error: "Identification required" });

        // 1. Get the holds for this patron
        const holds = await safeKohaGet(`/patrons/${patronId}/holds`);
        
        // If no holds, stop here and return empty array
        if (!holds || holds.length === 0) return res.json([]);

        // 2. Batch fetch titles (1 call for all biblios)
        // Use Set to handle cases where a patron has multiple holds on the same title
        const biblioIds = [...new Set(holds.map(h => h.biblio_id))];
        
        // Fast batch request to Koha
        const biblios = await safeKohaGet(`/biblios?q={"biblio_id":{"-in":[${biblioIds.join(',')}]}}`);

        // 3. Map together in memory (Instant)
        const hydratedHolds = holds.map(hold => {
            const biblio = Array.isArray(biblios) ? biblios.find(b => b.biblio_id === hold.biblio_id) : null;
            return {
                ...hold,
                title: biblio ? biblio.title : "Unknown Title"
            };
        });

        // 4. Send to Kiosk
        res.json(hydratedHolds);

    } catch (error) {
        console.error("My Holds Error:", error.message);
        res.status(500).json({ error: "Failed to fetch holds" });
    }
});

app.post('/api/v1/hydrate-detected-holds', async (req, res) => {
  try {
    const { holds } = req.body; // Array of hold objects from displayHolds
    if (!holds || holds.length === 0) return res.json([]);

    // 1. Get Unique IDs to minimize Koha calls
    const biblioIds = [...new Set(holds.map(h => h.biblio_id))];
    const patronIds = [...new Set(holds.map(h => h.patron_id))];

    // 2. Batch fetch Biblios and Patrons
    const [biblios, patrons] = await Promise.all([
      safeKohaGet(`/biblios?q={"biblio_id":{"-in":[${biblioIds.join(',')}]}}`),
      safeKohaGet(`/patrons?q={"patron_id":{"-in":[${patronIds.join(',')}]}}`)
    ]);

    // 3. Map the data back to the holds
    const hydrated = holds.map(hold => {
      const biblio = biblios.find(b => b.biblio_id === hold.biblio_id);
      const patron = patrons.find(p => p.patron_id === hold.patron_id);
      return {
        ...hold,
        title: biblio ? biblio.title : "Unknown Title",
        patronName: patron ? `${patron.firstname} ${patron.surname}` : `Patron #${hold.patron_id}`,
        // We use the item_id from the hold if specific, or the one scanned
        barcode: hold.item_id || "N/A" 
      };
    });

    res.json(hydrated);
  } catch (error) {
    console.error("Hydration Error:", error.message);
    res.status(500).json({ error: "Failed to hydrate holds" });
  }
});

// New endpoint to check if card number exists before asking for PIN
app.get("/api/v1/auth/check-patron/:cardnumber", async (req, res) => {
    try {
        const { cardnumber } = req.params;
        const query = JSON.stringify({ cardnumber: cardnumber });
        const patrons = await safeKohaGet(`/patrons?q=${query}`);

        const patron = Array.isArray(patrons) ? patrons.find(p => 
            String(p.cardnumber).trim() === String(cardnumber).trim()
        ) : null;

        if (patron) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Card number not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});


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




// --- ROUTES ---

// 1. Get Patrons
app.get("/api/v1/patrons", async (req, res) => {
    const data = await safeKohaGet('/patrons');
    res.json(data);
});

// 2. Login Route (Fixed .find() safety)
app.post("/api/v1/auth/login", async (req, res) => {
    try {
        const { cardnumber, password } = req.body;

        if (!cardnumber || !password) {
            return res.status(400).json({ success: "false", message: "Missing credentials" });
        }

        // 1. Get the patron details first using the cardnumber/barcode
        // This is a targeted search, NOT a fetch-all.
        const query = JSON.stringify({ cardnumber: cardnumber });
        const patrons = await safeKohaGet(`/patrons?q=${query}`);

        const patron = Array.isArray(patrons) ? patrons.find(p => 
            String(p.cardnumber).trim() === String(cardnumber).trim()
        ) : null;

        if (!patron) {
            return res.status(401).json({ success: "false", message: "Card number not found" });
        }

        // 2. Validate the password using the endpoint you tested in Postman
        // We use the 'userid' obtained from the patron search
        try {
            await axios.post(`http://192.168.0.149/api/v1/auth/password/validation`, {
                userid: patron.userid, // Using the userid from the database search
                password: password
            }, { headers: authHeader });

            // If we reach here, validation was successful
            console.log(`Login Success: ${cardnumber}`);
            res.json({
                success: "true",
                patron_id: patron.patron_id,
                patron_name: `${patron.firstname} ${patron.surname}`
            });

        } catch (valError) {
            console.log(`Password validation failed for ${cardnumber}`);
            return res.status(401).json({ success: "false", message: "Invalid password" });
        }

    } catch (err) {
        console.error("Login Route Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
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
    else {
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


// backend/server.js or routes/email.js
import { Resend } from "resend";
const resend = new Resend('re_QEgYTzMs_PEvRVUoUqmpQr5wbzouhgcDm');

// inside server.js

const emailTranslations = {
    EN: {
        subject: "Book Ready: ",
        greeting: "Hello",
        ready_msg: "The book you reserved is now ready for pickup!",
        label_title: "Book Title:",
        label_status: "Status:",
        status_val: "Routed to Hold Shelf",
        instructions: "Instructions:",
        instr_desc: "This book has been reserved by you. It has been automatically routed to the Hold Shelf for pickup.",
        no_action_title: "No Action Required:",
        no_action_desc: "You will find the book at the pickup shelf.",
        footer: "NTEK Koha Library Kiosk Service"
    },
    JP: {
        subject: "予約本準備完了: ",
        greeting: "こんにちは",
        ready_msg: "予約されていた本の準備ができました！",
        label_title: "本 のタイトル:",
        label_status: "ステータス:",
        status_val: "予約棚へ回送",
        instructions: "受け取り方法:",
        instr_desc: "この本はあなたによって予約されています。自動的に予約受取棚へ回送されます。",
        no_action_title: "対応不要:",
        no_action_desc: "予約棚で本を見つけることができます。",
        footer: "NTEK Koha 図書館キオ스크 サービス"
    },
    KO: {
        subject: "예약 도서 준비 완료: ",
        greeting: "안녕하세요",
        ready_msg: "예약하신 도서가 준비되었습니다!",
        label_title: "도서명:",
        label_status: "상태:",
        status_val: "예약 도서 선반으로 이동",
        instructions: "안내:",
        instr_desc: "해당 도서는 회원님에 의해 예약되었습니다. 수령을 위해 예약 도서 선반으로 자동 이동됩니다.",
        no_action_title: "조치 불필요:",
        no_action_desc: "예약 도서 선반에서 도서를 찾으실 수 있습니다.",
        footer: "NTEK Koha 도서관 키오스크 서비스"
    }
};

app.post('/api/v1/send-hold-email', async (req, res) => {
    const { bookTitle, patronName, language } = req.body;

    // Default to English if language not found
    const lang = emailTranslations[language] || emailTranslations.EN;

    // Format Greeting based on Language
    let greetingText = `${lang.greeting} ${patronName},`;
    if (language === 'JP') greetingText = `${patronName} 様、${lang.greeting}`;
    if (language === 'KO') greetingText = `안녕하세요 ${patronName} 님,`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'NTEK Koha <onboarding@resend.dev>',
            to: ['daniloalvaro031717@gmail.com'],
            subject: `${lang.subject}${bookTitle}`,
            html: `
        <div style="font-family: sans-serif; color: #2c3e50; line-height: 1.6;">
          <h2 style="color: #e65100;">${greetingText}</h2>
          <p>${lang.ready_msg}</p>
          <div style="background: #fdf2e9; padding: 20px; border-left: 5px solid #f39c12; margin: 20px 0;">
            <strong>${lang.label_title}</strong> ${bookTitle}<br />
            <strong>${lang.label_status}</strong> ${lang.status_val}
          </div>
          <p><strong>${lang.instructions}</strong></p>
          <p>${lang.instr_desc}</p>
          <p style="background: #e3f2fd; padding: 15px; border-radius: 8px; color: #0d47a1;">
            ✅ <strong>${lang.no_action_title}</strong> ${lang.no_action_desc}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #7f8c8d;">${lang.footer}</p>
        </div>
      `,
        });

        if (error) return res.status(400).json({ error });
        res.json({ data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- START SERVER ---
app.listen(4040, "0.0.0.0", () => {
    console.log("SUCCESS: Backend Server listening on port 4040...");
});

