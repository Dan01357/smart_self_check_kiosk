const express = require('express');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const KOHA_IP = '127.0.0.1'; // Since it's on the same server
const KOHA_PORT = 6001;

// Function to talk to SIP2
function sendSipMessage(message) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';

        client.connect(KOHA_PORT, KOHA_IP, () => {
            // Send Login followed by your actual request
            const login = "9300CNsip_username|COSip2pass|CPMARAWI|\r";
            client.write(login + message + "\r");
        });

        client.on('data', (data) => {
            responseData += data.toString();
            // Once we get the checkin response (starts with 10), we close
            if (responseData.includes('10')) {
                client.destroy();
                resolve(responseData);
            }
        });

        client.on('error', (err) => reject(err));
        client.setTimeout(5000, () => { client.destroy(); reject("Timeout"); });
    });
}

// HTTP Endpoint for React
app.post('/api/checkin', async (req, res) => {
    const { barcode } = req.body;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0].padEnd(18, ' ');
    
    // Construct the 09 Checkin Message
    const checkinMsg = `09N${timestamp}${timestamp}|APMARAWI|AOMARAWI|AB${barcode}|`;

    try {
        const result = await sendSipMessage(checkinMsg);
        // If result contains '101', it was a success
        const success = result.includes('101');
        res.json({ success, raw: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3001, () => console.log('SIP Proxy running on port 3001'));