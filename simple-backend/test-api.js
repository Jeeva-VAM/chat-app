// Quick API test script using native http
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    body: data,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testAPI() {
    console.log('🚀 Testing Backend API...\n');
    
    const tests = [
        { url: 'http://localhost:3001/health', name: 'Health Endpoint' },
        { url: 'http://localhost:3001/api/profiles', name: 'Profiles Endpoint' },
        { url: 'http://localhost:3001/api/conversations/115402358892148722452', name: 'User Conversations' }
    ];
    
    for (const test of tests) {
        console.log(`🔄 Testing ${test.name}: ${test.url}`);
        
        try {
            const response = await makeRequest(test.url);
            console.log(`📡 Status: ${response.statusCode} ${response.statusMessage}`);
            console.log(`📡 Headers: ${JSON.stringify(response.headers)}`);
            
            if (response.statusCode !== 200) {
                console.log(`❌ Error: ${response.body}\n`);
                continue;
            }
            
            try {
                const data = JSON.parse(response.body);
                console.log(`✅ Success: ${JSON.stringify(data, null, 2).substring(0, 300)}...\n`);
            } catch (e) {
                console.log(`✅ Success (raw): ${response.body.substring(0, 200)}...\n`);
            }
            
        } catch (error) {
            console.log(`💥 Network Error: ${error.message}\n`);
        }
    }
}

testAPI().catch(console.error);