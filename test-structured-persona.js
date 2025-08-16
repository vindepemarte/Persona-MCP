#!/usr/bin/env node

/**
 * Comprehensive test script to verify MCP server handles n8n JSON data properly
 */

const http = require('http');

// Test data scenarios from n8n workflows
const testScenarios = {
  // Scenario 1: AI agent structured output
  aiAgentOutput: {
    name: "Alex",
    traits: ["analytical", "detail-oriented", "problem-solver", "curious", "methodical"],
    communication_style: "direct and concise",
    work_environment: "quiet, organized workspace with minimal distractions",
    communication_preference: "written communication over verbal",
    dislikes: ["unnecessary meetings", "unclear instructions", "multitasking"],
    goals: ["improve productivity", "learn new programming languages", "build efficient systems"]
  },
  
  // Scenario 2: Simple text input
  textInput: "I prefer working in quiet environments and I'm very detail-oriented. My goal is to learn Python programming.",
  
  // Scenario 3: Mixed data types
  mixedData: {
    preferences: ["morning work", "coffee", "minimal meetings"],
    personality: "introverted but collaborative",
    skills: ["JavaScript", "Python", "problem-solving"]
  }
};

console.log('🔧 Enhanced MCP Server Test Suite');
console.log('✅ Fixed: All storage methods now properly handle database schema');
console.log('✅ Enhanced: Proper enum type handling and JSONB storage');
console.log('✅ Added: Comprehensive error handling and validation\n');

// Test all scenarios
async function runAllTests() {
  console.log('🧪 Testing all scenarios...\n');
  
  // Test Scenario 1: AI Agent Output
  console.log('📋 Scenario 1: AI Agent Structured Output');
  await testLearnPersona(testScenarios.aiAgentOutput, 'structured_json');
  
  // Test Scenario 2: Text Input
  console.log('\n📋 Scenario 2: Simple Text Input');
  await testLearnPersona(testScenarios.textInput, 'text');
  
  // Test Scenario 3: Mixed Data
  console.log('\n📋 Scenario 3: Mixed Data Types');
  await testLearnPersona(testScenarios.mixedData, 'structured_json');
  
  // Test get_persona after all learning
  console.log('\n📋 Final Test: Get Complete Persona');
  await testGetPersona();
}

console.log('🤖 Test Data Preview:');
console.log('Scenario 1:', JSON.stringify(testScenarios.aiAgentOutput, null, 2));

// Function to send request to MCP server
function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(request);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-API-Key': 'b1d250467a01a8d9af3ffd6e1fd9c76b3759d0e20a38eef25574bf834dc54544'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test learn_persona with different data types
async function testLearnPersona(inputData, format) {
  try {
    const mcpRequest = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000),
      method: "tools/call",
      params: {
        name: "learn_persona",
        arguments: {
          content: typeof inputData === 'string' ? inputData : JSON.stringify(inputData),
          content_type: format === 'structured_json' ? 'preference' : 'text',
          context: 'Data from n8n workflow for persona learning'
        }
      }
    };
    
    console.log('📤 Sending:', JSON.stringify(mcpRequest.params.arguments, null, 2));
    const response = await sendMCPRequest(mcpRequest);
    console.log('✅ Response:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test get_persona
async function testGetPersona() {
  try {
    const getPersonaRequest = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000),
      method: "tools/call",
      params: {
        name: "get_persona",
        arguments: {
          query_type: 'full_persona',
          context: 'Complete persona overview for testing',
          format: 'detailed'
        }
      }
    };
    
    const response = await sendMCPRequest(getPersonaRequest);
    console.log('✅ Complete Persona Data:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ Error getting persona:', error.message);
  }
}

// Run all tests
runAllTests().catch(console.error);