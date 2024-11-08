import express from 'express';
import os from 'os';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const apiToken = process.env.CLOUDFLARE_API_TOKEN || '58Zge2uLO0_okwYC5evpdzFnqwoFC8BN3eM1jEoK';
const zoneId = process.env.CLOUDFLARE_ZONE_ID || 'aa195c71d22fda9edc6377df45871c34';
const recordName = process.env.CLOUDFLARE_RECORD_NAME || 'computernetworks.com';

// Serve static files
app.use(express.static(path.join(__dirname, '')));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to get the current DNS record IP from Cloudflare
app.get('/api/dns', async (req, res) => {
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        const dnsRecord = data.result?.find(record => record.name === recordName);

        if (!dnsRecord) {
            return res.status(404).json({ error: `DNS record ${recordName} not found.` });
        }

        res.json({ ipAddress: dnsRecord.content });
    } catch (error) {
        console.error('Error fetching DNS record:', error);
        res.status(500).json({ error: 'Failed to fetch DNS record' });
    }
});

// Existing endpoint to get the server's local IP address
app.get('/api/ip', (req, res) => {
    const ipAddress = getIpAddress();
    res.send(ipAddress);
});

// Update DNS record
app.post('/api/ip/update', async (req, res) => {
    const ipAddress = req.body.ipAddress;
    try {
        await updateDnsRecords(ipAddress);
        res.json({ message: `DNS records updated: ${ipAddress}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Function to get current IP address
function getIpAddress() {
    const interfaces = os.networkInterfaces();
    const ipAddress = Object.values(interfaces).flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address;
    return ipAddress || 'IP address not found';
}

// Function to update DNS records
async function updateDnsRecords(ipAddress) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    const dnsRecord = data.result?.find(record => record.name === recordName);

    if (!dnsRecord) {
        throw new Error(`DNS record ${recordName} not found.`);
    }

    const updateResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${dnsRecord.id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'A',
            name: recordName,
            content: ipAddress,
            ttl: 1,
            proxied: false,
        }),
    });

    const updateData = await updateResponse.json();
    if (!updateData.success) {
        throw new Error(`Failed to update DNS record: ${updateData.errors[0].message}`);
    }

    return updateData;
}

// Start the server and display the localhost link
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
