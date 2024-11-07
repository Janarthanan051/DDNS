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
        console.log(result.message);
        alert(result.message);
    } catch (error) {
        console.error(error);
    }
}

document.getElementById('update-dns').addEventListener('click', async () => {
    const ipAddress = document.getElementById('ip-address').innerText.split(': ')[1];
    await updateDnsRecords(ipAddress);
});

getIpAddress();
setInterval(getIpAddress, 60000); // Poll every 60 seconds
