const http = require('http');

// Düşük değerli kampanya (kalite filtresinden geçmemeli)
const lowQualityCampaign = {
  sourceName: 'Akbank',
  title: 'Kahve Hediye Kampanyası',
  description: 'Küçük bir hediye',
  campaignUrl: 'https://www.akbank.com/test',
  endDate: '2026-12-31T23:59:59Z',
  category: 'gift',
  channel: 'online'
};

function postCampaign(campaign, label) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(campaign);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/campaigns',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (body) {
          try {
            const result = JSON.parse(body);
            if (res.statusCode >= 400) {
              console.log(`${label} - Rejected (expected): ${result.error || result.message}`);
              resolve({ rejected: true, status: res.statusCode, error: result.error });
            } else {
              console.log(`${label} - Accepted (unexpected): isUpdate=${result.isUpdate}`);
              resolve({ rejected: false, status: res.statusCode });
            }
          } catch (e) {
            console.error(`${label} - Parse error:`, e.message);
            reject(e);
          }
        } else {
          console.error(`${label} - Empty response`);
          reject(new Error(`Empty response: ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => {
      console.error(`${label} - Request error:`, e.message);
      reject(e);
    });
    req.write(data);
    req.end();
  });
}

async function test() {
  console.log('Testing quality filter...');
  const result = await postCampaign(lowQualityCampaign, 'Low Quality Campaign');
  
  if (result.rejected && result.status === 400) {
    console.log('✅ Quality filter working correctly! (Low quality campaign rejected)');
    process.exit(0);
  } else {
    console.log('❌ Quality filter not working as expected');
    process.exit(1);
  }
}

test().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
