import express from 'express';
import os from 'os';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const apiToken = '58Zge2uLO0_okwYC5evpdzFnqwoFC8BN3eM1jEoK'; 
const zoneId = 'aa195c71d22fda9edc6377df45871c34'; 
const recordName = 'computernetworks.com'; 

// Get current IP
app.get('/api/ip', (req, res) => {
    console.log('GET /api/ip received');
    const ipAddress = getIpAddress();
    console.log(`IP Address: ${ipAddress}`);
    res.send(ipAddress);
});



// Update DNS record
app.post('/api/ip/update', async (req, res) => {
    console.log('POST /api/ip/update received');
    const ipAddress = req.body.ipAddress;
    console.log(`Updating DNS with IP: ${ipAddress}`);
    try {
        await updateDnsRecords(ipAddress);
        res.json({ message: `DNS records updated: ${ipAddress}` });
    } catch (err) {
        console.error('Error updating DNS:', err.message);
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
    console.log('Fetching DNS records from Cloudflare');
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

    console.log(`Found DNS record: ${dnsRecord.id}. Updating to new IP: ${ipAddress}`);

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
            ttl: 1, // Automatic TTL
            proxied: false,
        }),
    });

    const updateData = await updateResponse.json();
    if (!updateData.success) {
        throw new Error(`Failed to update DNS record: ${updateData.errors[0].message}`);
    }

    console.log(`DNS record updated successfully to IP: ${ipAddress}`);
    return updateData;
}

// Start the server and display output immediately
app.listen(3001, () => {
    console.log('Server listening on port 3001');
    const ipAddress = getIpAddress();
    console.log(`Server IP Address: ${ipAddress}`);
    updateDnsRecords(ipAddress).then(() => {
        console.log(`DNS record updated to IP: ${ipAddress}`);
    }).catch(err => {
        console.error('Error during DNS update:', err.message);
    });

});
