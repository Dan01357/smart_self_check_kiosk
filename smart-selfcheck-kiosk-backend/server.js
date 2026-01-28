import express from "express";
import cors from "cors";
import net from "net"
import axios from "axios";
import 'dotenv/config';
import { Resend } from "resend";

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const KOHA_URL = "http://192.168.0.149:8080/api/v1";
const KOHA_USER = "administrator";
const KOHA_PASS = "Zxcqwe123$";
const KOHA_IP_SIP2 = '192.168.0.149';
const KOHA_PORT_SIP2 = 6001;
const resend = new Resend('re_QEgYTzMs_PEvRVUoUqmpQr5wbzouhgcDm');

const token = Buffer.from(`${KOHA_USER}:${KOHA_PASS}`).toString('base64');
const authHeader = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${token}`
};

// --- HELPER FUNCTIONS ---

async function safeKohaGet(endpoint) {
    try {
        const response = await axios.get(`${KOHA_URL}${endpoint}`, { headers: authHeader });
        return response.data || [];
    } catch (error) {
        console.error(`Koha API Error (${endpoint}):`, error.response?.data || error.message);
        return [];
    }
}

function getSipTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}    ${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function sendSipMessage(message) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';
        client.connect(KOHA_PORT_SIP2, KOHA_IP_SIP2, () => {
            const login = "9300CNsip_username|COSip2pass|CPMARAWI|\r";
            client.write(login + message + "\r");
        });
        client.on('data', (data) => {
            responseData += data.toString();
            const lines = responseData.split(/[\r\n]+/);
            const checkinResponse = lines.find(line => line.startsWith('10'));
            if (checkinResponse) { client.destroy(); resolve(checkinResponse); }
        });
        client.on('error', (err) => { client.destroy(); reject(err); });
        client.setTimeout(10000, () => { client.destroy(); reject(new Error("SIP2 Timeout")); });
    });
}

// --- AUTHENTICATION ROUTES ---

app.get("/api/v1/auth/check-patron/:cardnumber", async (req, res) => {
    const { cardnumber } = req.params;
    const query = JSON.stringify({ cardnumber });
    const patrons = await safeKohaGet(`/patrons?q=${encodeURIComponent(query)}`);
    const patron = Array.isArray(patrons) ? patrons.find(p => String(p.cardnumber).trim() === String(cardnumber).trim()) : null;
    res.json({ success: !!patron });
});

app.post("/api/v1/auth/login", async (req, res) => {
    try {
        const { cardnumber } = req.body;
        if (!cardnumber) return res.status(400).json({ success: "false", message: "Card number required" });

        const query = JSON.stringify({ cardnumber });
        const patrons = await safeKohaGet(`/patrons?q=${encodeURIComponent(query)}`);
        const patron = patrons.find(p => String(p.cardnumber).trim() === String(cardnumber).trim());

        if (patron) {
            res.json({ success: "true", patron_id: patron.patron_id, patron_name: `${patron.firstname} ${patron.surname}` });
        } else {
            res.status(401).json({ success: "false", message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- LIVE SCANNING & TRANSACTION ROUTES ---

// Fixed: Uses encoded JSON query to prevent "Malformed" error and "Returns everything" bug
app.get('/api/check-book-incheckouts/:barcode', async (req, res) => {
    const itemsRes = await safeKohaGet(`/items?external_id=${req.params.barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === String(req.params.barcode));
    if (!exactBook) return res.status(404).json({ error: "Not found" });

    const query = JSON.stringify({ item_id: exactBook.item_id });
    const checkoutRes = await safeKohaGet(`/checkouts?q=${encodeURIComponent(query)}`);
    res.json({ checkoutRes });
});

app.get('/api/check-book-inholds/:barcode', async (req, res) => {
    try {
        const { barcode } = req.params;
        const itemsRes = await safeKohaGet(`/items?external_id=${barcode}`);
        const exactBook = itemsRes.find(item => String(item.external_id) === String(barcode));

        if (!exactBook) return res.status(404).json({ error: "Book not found" });

        // Koha REST API v1 for holds works best with this specific JSON structure
        const query = JSON.stringify({ biblio_id: exactBook.biblio_id });
        const holdRes = await safeKohaGet(`/holds?q=${encodeURIComponent(query)}`);
        
        // Safety check: Filter the results to make sure they match the biblio_id 
        // (In case Koha ignores the filter)
        const actualHolds = holdRes.filter(h => h.biblio_id === exactBook.biblio_id);
        
        res.json({ holdRes: actualHolds });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/checkout-book/:barcode/:patronId', async (req, res) => {
    try {
        const { barcode, patronId } = req.params;
        const items = await safeKohaGet(`/items?external_id=${barcode}`);
        const exactBook = items.find(item => String(item.external_id) === String(barcode));
        if (!exactBook) return res.status(404).json({ error: "Book not found" });

        const response = await axios.post(`${KOHA_URL}/checkouts`, {
            patron_id: parseInt(patronId),
            item_id: parseInt(exactBook.item_id)
        }, { headers: authHeader });

        res.status(201).json(response.data);
    } catch (error) {
        res.status(400).json({ error: error.response?.data?.error || "Checkout failed" });
    }
});

app.post('/api/checkin', async (req, res) => {
    try {
        const { barcode } = req.body;
        const items = await safeKohaGet(`/items?external_id=${barcode}`);
        const item = items.find(i => String(i.external_id) === String(barcode));
        let isOverdue = false;
        if (item) {
            const query = JSON.stringify({ item_id: item.item_id });
            const checkouts = await safeKohaGet(`/checkouts?q=${encodeURIComponent(query)}`);
            if (checkouts[0]) isOverdue = new Date(checkouts[0].due_date) < new Date();
        }
        const result = await sendSipMessage(`09N${getSipTimestamp()}${getSipTimestamp()}|APMARAWI|AOMARAWI|AB${barcode}|`);
        res.json({ success: result.substring(0, 3) === '101', isOverdue });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/book-details/:barcode', async (req, res) => {
    const itemsRes = await safeKohaGet(`/items?external_id=${req.params.barcode}`);
    const exactBook = itemsRes.find(item => String(item.external_id) === String(req.params.barcode));
    if (!exactBook) return res.status(404).json({ error: "Book not found" });

    const biblio = await safeKohaGet(`/biblios/${exactBook.biblio_id}`);
    res.json({ item_id: exactBook.item_id, title: biblio.title, external_id: req.params.barcode, biblio_id: exactBook.biblio_id });
});

// --- PATRON ACCOUNT ROUTES ---

app.post('/api/v1/my-books', async (req, res) => {
    try {
        const { patronId } = req.body;
        if (!patronId) return res.status(400).json({ error: "Identification required" });

        // 1. Get the checkouts
        const checkouts = await safeKohaGet(`/patrons/${patronId}/checkouts`);
        if (checkouts.length === 0) return res.json([]);

        // 2. Collect IDs for batch fetching
        const itemIds = checkouts.map(c => c.item_id);
        const items = await safeKohaGet(`/items?q=${encodeURIComponent(JSON.stringify({ item_id: { "-in": itemIds } }))}`);
        const biblioIds = items.map(i => i.biblio_id);
        const biblios = await safeKohaGet(`/biblios?q=${encodeURIComponent(JSON.stringify({ biblio_id: { "-in": biblioIds } }))}`);

        // 3. FETCH HOLDS for these biblios to see if OTHERS are waiting
        const holds = await safeKohaGet(`/holds?q=${encodeURIComponent(JSON.stringify({ biblio_id: { "-in": biblioIds } }))}`);

        // 4. Map them together
        const hydratedCheckouts = checkouts.map(checkout => {
            const item = items.find(i => i.item_id === checkout.item_id);
            const biblio = item ? biblios.find(b => b.biblio_id === item.biblio_id) : null;
            
            // LOGIC: Is there a hold on this biblio for anyone OTHER than the current patron?
            const hasHoldForOthers = holds.some(h => 
                h.biblio_id === item?.biblio_id && 
                String(h.patron_id) !== String(patronId)
            );

            return {
                ...checkout,
                title: biblio ? biblio.title : "Unknown Title",
                is_on_hold_for_others: hasHoldForOthers // This flag triggers the Orange UI
            };
        });

        res.json(hydratedCheckouts);
    } catch (error) {
        console.error("My Books Error:", error.message);
        res.status(500).json({ error: "Failed to fetch books" });
    }
});
app.post('/api/v1/my-holds', async (req, res) => {
    try {
        const { patronId } = req.body;
        const holds = await safeKohaGet(`/patrons/${patronId}/holds`);
        if (!holds || holds.length === 0) return res.json([]);

        const biblioIds = [...new Set(holds.map(h => h.biblio_id))];
        
        // Ensure the -in operator is formatted correctly as a JSON array
        const biblioQuery = JSON.stringify({ "biblio_id": { "-in": biblioIds } });
        const biblios = await safeKohaGet(`/biblios?q=${encodeURIComponent(biblioQuery)}`);

        res.json(holds.map(h => {
            const b = Array.isArray(biblios) ? biblios.find(bib => bib.biblio_id === h.biblio_id) : null;
            return { 
                ...h, 
                title: b ? b.title : "Unknown Title" 
            };
        }));
    } catch (error) {
        res.status(500).json([]);
    }
});

app.post('/api/v1/renew', async (req, res) => {
    try {
        const response = await axios.post(`${KOHA_URL}/checkouts/${req.body.checkout_id}/renewal`, {}, { headers: authHeader });
        res.json(response.data);
    } catch (error) {
        res.status(400).json({ error: "Renewal failed" });
    }
});

// --- HYDRATION & EMAILS ---

app.post('/api/v1/hydrate-detected-holds', async (req, res) => {
    const { holds } = req.body;
    const bibIds = [...new Set(holds.map(h => h.biblio_id))];
    const patIds = [...new Set(holds.map(h => h.patron_id))];
    const [biblios, patrons] = await Promise.all([
        safeKohaGet(`/biblios?q=${encodeURIComponent(JSON.stringify({ biblio_id: { "-in": bibIds } }))}`),
        safeKohaGet(`/patrons?q=${encodeURIComponent(JSON.stringify({ patron_id: { "-in": patIds } }))}`)
    ]);
    res.json(holds.map(h => ({
        ...h,
        title: biblios.find(b => b.biblio_id === h.biblio_id)?.title || "Unknown",
        patronName: patrons.find(p => p.patron_id === h.patron_id) ? `${patrons.find(p => p.patron_id === h.patron_id).firstname} ${patrons.find(p => p.patron_id === h.patron_id).surname}` : "Unknown"
    })));
});

// Ensure Resend is initialized at the top of your file
// import { Resend } from "resend";
// const resend = new Resend('re_QEgYTzMs_PEvRVUoUqmpQr5wbzouhgcDm');

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
        footer: "NTEK Koha 図書館キオスク サービス"
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

    const lang = emailTranslations[language] || emailTranslations.EN;

    let greetingText = `${lang.greeting} ${patronName},`;
    if (language === 'JP') greetingText = `${patronName} 様、${lang.greeting}`;
    if (language === 'KO') greetingText = `안녕하세요 ${patronName} 님,`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'NTEK Koha <onboarding@resend.dev>',
            to: ['daniloalvaro031717@gmail.com'], // Hardcoded as requested
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

        if (error) {
            console.error("Resend Error:", error);
            return res.status(400).json({ error });
        }
        res.json({ success: true, data });
    } catch (err) {
        console.error("Email Route Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/v1/send-hold-email', async (req, res) => {
    // ... existing email code ...
    res.json({ message: "Notification handled" });
});

app.listen(4040, "0.0.0.0", () => console.log("CLEAN SERVER: Running on 4040"));