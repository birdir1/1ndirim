const http = require('http');

// Kaliteli test kampanyası (quality filter'dan geçmeli - %20 indirim + 100 TL değer)
const testCampaign = {
  sourceName: 'Akbank',
  title: 'Akbank %20 İndirim ve 100 TL Cashback',
  description: 'Seçili ürünlerde %20 indirim ve 100 TL cashback fırsatı',
  campaignUrl: 'https://www.akbank.com/kampanyalar/test',
  endDate: '2026-12-31T23:59:59Z',
  category: 'discount',
  channel: 'online'
};

function postCampaign(campaign, label) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(campaign);
    console.log(`${label} - Sending:`, data.substring(0, 100));
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
        console.log(`${label} - Status: ${res.statusCode}, Body length: ${body.length}`);
        if (body) {
          try {
            const result = JSON.parse(body);
            if (res.statusCode >= 400) {
              console.error(`${label} - Error:`, result.error || result.message);
              reject(new Error(result.error || 'Request failed'));
            } else {
              console.log(`${label} - Success: isUpdate=${result.isUpdate}, id=${result.data?.id}`);
              resolve(result);
            }
          } catch (e) {
            console.error(`${label} - Parse error:`, e.message, 'Body:', body.substring(0, 200));
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
  console.log('Testing duplicate detection...');
  try {
    const result1 = await postCampaign(testCampaign, '1st POST');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result2 = await postCampaign(testCampaign, '2nd POST');
    
    if (result1.isUpdate === false && result2.isUpdate === true) {
      console.log('✅ Duplicate filter working correctly!');
      process.exit(0);
    } else {
      console.log('❌ Duplicate filter not working as expected');
      process.exit(1);
    }
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

test();
