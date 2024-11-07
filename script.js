async function getServerIpAddress() {
    try {
        const response = await fetch('/api/ip');
        return await response.text();
    } catch (error) {
        console.error('Error fetching server IP:', error);
        return null;
    }
}

async function updateDnsRecords() {
    try {
        // Fetch the latest server IP
        const ipAddress = await getServerIpAddress();
        if (!ipAddress) {
            alert('Failed to fetch server IP.');
            return;
        }

        // Update DNS record with the fetched IP
        const response = await fetch('/api/ip/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipAddress })
        });
        const result = await response.json();

        // Display result or error message
        if (response.ok) {
            alert(result.message);
            document.getElementById('ip-address').innerText = `DNS IP Address: ${ipAddress}`;
        } else {
            alert(`Error updating DNS: ${result.error}`);
        }
    } catch (error) {
        console.error('Error updating DNS:', error);
    }
}

// Event listener for the update button
document.getElementById('update-dns').addEventListener('click', updateDnsRecords);

// Initial DNS IP load and periodic update
async function getDnsIpAddress() {
    try {
        const response = await fetch('/api/dns');
        const data = await response.json();
        document.getElementById('ip-address').innerText = `DNS IP Address: ${data.ipAddress}`;
    } catch (error) {
        console.error('Error fetching DNS IP:', error);
    }
}

// Load DNS IP on page load and every 60 seconds
getDnsIpAddress();
setInterval(getDnsIpAddress, 60000); 
