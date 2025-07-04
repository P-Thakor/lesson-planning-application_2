// Simple test script to verify API endpoints
const BASE_URL = 'http://localhost:3001';

async function testAPI(endpoint, description) {
  try {
    console.log(`Testing ${description}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description}: Success`);
      console.log(`   Data structure:`, Object.keys(data));
      if (data.data) {
        console.log(`   Data keys:`, Object.keys(data.data));
      }
    } else {
      console.log(`❌ ${description}: Failed`);
      console.log(`   Error:`, data.error);
    }
    console.log('---');
  } catch (error) {
    console.log(`❌ ${description}: Error`);
    console.log(`   ${error.message}`);
    console.log('---');
  }
}

async function runTests() {
  console.log('Testing Attendance Monitor APIs...\n');
  
  await testAPI('/api/attendance-monitor/filters', 'Filter Options API');
  await testAPI('/api/attendance-monitor', 'Attendance Monitor API');
  await testAPI('/api/students?division=1&semester=5&batch=A1', 'Students API');
  await testAPI('/api/attendance', 'Attendance API (GET)');
  
  console.log('Testing complete!');
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}
