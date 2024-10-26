async function getIpAddress() {
    try {
        const response = await fetch('/api/ip');
        const ipAddress = await response.text();
        document.getElementById('ip-address').innerText = `IP Address: ${ipAddress}`;
    } catch (error) {
        console.error(error);
    }
}

async function updateDnsRecords(ipAddress) {
    try {
        const response = await fetch('/api/ip/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipAddress })
        });
        const result = await response.json();
        console.log(`DNS records updated: ${result}`);
    } catch (error) {
        console.error(error);
    }
}

getIpAddress();
setInterval(getIpAddress, 60000); // Poll every 60 seconds

document.addEventListener('DOMContentLoaded', () => {
    const ipAddressElement = document.getElementById('ip-address');
    ipAddressElement.addEventListener('change', () => {
        const ipAddress = ipAddressElement.innerText.split(': ')[1];
        updateDnsRecords(ipAddress);
    });
});
