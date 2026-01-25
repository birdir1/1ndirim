const http = require('http');

const testCampaign = {
  sourceName: 'Akbank',
  title: 'Test Kampanya %20 İndirim',
  description: 'Test açıklama',
  campaignUrl: 'https://www.akbank.com/test',
  endDate: '2026-12-31T23:59:59Z',
  category: 'discount',
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
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (body) {
            const result = JSON.parse(body);
            if (res.statusCode >= 400) {
              console.error(`${label} - Error:`, result.error || result.message || body);
              reject(new Error(result.error || 'Request failed'));
            } else {
              console.log(`${label} - Status: ${res.statusCode}, isUpdate: ${result.isUpdate}, id: ${result.data?.id}`);
              resolve(result);
            }
          } else {
            console.error(`${label} - Empty response, status: ${res.statusCode}`);
            reject(new Error(`Empty response: ${res.statusCode}`));
          }
        } catch (e) {
          console.error(`${label} - Parse error:`, e.message, 'Body:', body);
          reject(e);
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
  console.log('Testing duplicate detection...');
  const result1 = await postCampaign(testCampaign, '1st POST');
  await new Promise(resolve => setTimeout(resolve, 1000));
  const result2 = await postCampaign(testCampaign, '2nd POST');
  
  if (result1.isUpdate === false && result2.isUpdate === true) {
    console.log('✅ Duplicate filter working correctly!');
  } else {
    console.log('❌ Duplicate filter not working as expected');
  }
  process.exit(0);
}

test().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
