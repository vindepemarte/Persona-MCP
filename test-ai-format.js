// Test script to verify AI agent format compatibility
const http = require('http');

// Test data that mimics exactly what the AI agent sends
const testData = [
  {
    "tool_name": "learn_persona",
    "arguments": "{\"content\":\"Alex loves music and spends a lot of time on his MacBook M1 Max.\",\"content_type\":\"text\",\"context\":\"User introduction\"}"
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

console.log('🧪 Testing AI agent format compatibility...');
console.log('📤 Sending request:', JSON.stringify(testData, null, 2));

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
      
      if (response.success !== false) {
        console.log('✅ SUCCESS: AI agent format is now working!');
      } else {
        console.log('❌ FAILED: Still getting error:', response.error || response.message);
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