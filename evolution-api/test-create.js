const fs = require('fs');

async function test() {
    // 1. Testar status de conexão
    const statusRes = await fetch('http://localhost:8085/instance/connectionState/VivaJovem', {
        headers: { 'apikey': '429683C4C977415CAAFCCE10F7D57E11' }
    });
    const statusData = await statusRes.text();

    // 2. Testar fetch instances
    const fetchRes = await fetch('http://localhost:8085/instance/fetchInstances', {
        headers: { 'apikey': '429683C4C977415CAAFCCE10F7D57E11' }
    });
    const fetchData = await fetchRes.text();

    const output = `=== Connection State ===\nStatus: ${statusRes.status}\n${statusData}\n\n=== Fetch Instances ===\nStatus: ${fetchRes.status}\n${fetchData}`;

    fs.writeFileSync('c:/Lideranca/evolution-api/test-result.txt', output);
    console.log(output);
}

test();
