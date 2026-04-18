const res = await fetch('http://localhost:8085/instance/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': '429683C4C977415CAAFCCE10F7D57E11'
    },
    body: JSON.stringify({
        instanceName: 'teste',
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true
    })
});

const data = await res.text();
console.log('Status:', res.status);
console.log('Response:', data);
