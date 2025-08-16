// Test script to verify handling of malformed AI JSON with excessive escaping
const http = require('http');

// Test data that mimics the exact malformed format the user showed
const testData = [
  {
    "tool_name": "learn_persona",
    "arguments": "{\"content\":\"{\\\"name\\\":\\\"Alex\\\",\\\"preferences\\\":[\\\"beach trips\\\"],\\\"behaviors\\\":{\\\"work_habits\\\":\\\"prefers working on MacBook M1 Max, often skips beach trips despite liking them\\\"}}\",\"content_type\":\"text\",\"context\":\"User personal traits and preferences\"}"
  }
];

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'b1d250467a01a8d9af3ffd6e1fd9c76b3759d0e20a38eef25574bf834dc54544'
  }
};

console.log('🧪 Testing malformed AI JSON handling...');
console.log('📤 Sending malformed request with excessive escaping');
console.log('Raw arguments:', testData[0].arguments);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response received:');
    console.log('Status:', res.statusCode);
    
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.content) {
        console.log('✅ SUCCESS: Malformed JSON handled correctly!');
        console.log('✅ Server successfully parsed multiple levels of JSON escaping');
      } else {
        console.log('❌ FAILED: Server could not handle malformed JSON');
        console.log('Error:', response.error || response.message);
      }
    } catch (e) {
      console.log('❌ FAILED: Invalid JSON response');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(JSON.stringify(testData));
req.end();