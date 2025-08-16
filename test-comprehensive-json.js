// Comprehensive test for both malformed and properly formatted JSON
const http = require('http');

const API_KEY = 'b1d250467a01a8d9af3ffd6e1fd9c76b3759d0e20a38eef25574bf834dc54544';

function makeRequest(testData, testName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    };

    console.log(`\n🧪 ${testName}`);
    console.log('📤 Request:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📥 Status:', res.statusCode);
          console.log('📥 Response:', JSON.stringify(response, null, 2));
          resolve({ status: res.statusCode, response });
        } catch (e) {
          console.log('❌ Invalid JSON response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(testData));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running comprehensive JSON formatting tests...');
  
  // Test 1: Properly formatted JSON (RECOMMENDED)
  const properFormat = [{
    "tool_name": "learn_persona",
    "arguments": {
      "content": {
        "name": "Alex",
        "preferences": ["beach trips", "MacBook M1 Max"],
        "behaviors": {
          "work_habits": "prefers working on MacBook, often skips beach trips despite liking them"
        }
      },
      "content_type": "json",
      "context": "User personal traits and preferences"
    }
  }];
  
  // Test 2: Malformed JSON with excessive escaping (SHOULD STILL WORK)
  const malformedFormat = [{
    "tool_name": "learn_persona",
    "arguments": "{\"content\":\"{\\\"name\\\":\\\"Sarah\\\",\\\"preferences\\\":[\\\"coffee\\\",\\\"reading\\\"]}\",\"content_type\":\"text\",\"context\":\"User info\"}"
  }];
  
  try {
    // Test proper format
    const result1 = await makeRequest(properFormat, 'Test 1: Proper JSON Format (RECOMMENDED)');
    const success1 = result1.status === 200 && result1.response.content;
    console.log(success1 ? '✅ SUCCESS: Proper format works perfectly!' : '❌ FAILED: Proper format failed');
    
    // Test malformed format
    const result2 = await makeRequest(malformedFormat, 'Test 2: Malformed JSON (SHOULD STILL WORK)');
    const success2 = result2.status === 200 && result2.response.content;
    console.log(success2 ? '✅ SUCCESS: Malformed format handled gracefully!' : '❌ FAILED: Malformed format not handled');
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Proper Format: ${success1 ? 'PASS' : 'FAIL'}`);
    console.log(`🛡️ Malformed Handling: ${success2 ? 'PASS' : 'FAIL'}`);
    
    if (success1 && success2) {
      console.log('\n🎉 ALL TESTS PASSED! Server handles both formats correctly.');
      console.log('💡 AI agents should use the proper format, but malformed requests won\'t break the system.');
    } else {
      console.log('\n⚠️ Some tests failed. Check server implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

runTests();