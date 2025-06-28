/**
 * Simple Security Test for Local Development
 */

const BASE_URL = 'http://localhost:3000';

// Test if server is running
async function testServerConnection() {
  console.log('🧪 Testing server connection...');
  try {
    const response = await fetch(`${BASE_URL}/api/meal-plans`);
    console.log(`✅ Server responding with status: ${response.status}`);
    
    // Test security headers
    console.log('\n🔍 Checking Security Headers:');
    const headers = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy',
      'content-security-policy'
    ];
    
    headers.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`✅ ${header}: ${value}`);
      } else {
        console.log(`❌ Missing header: ${header}`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Server connection failed: ${error.message}`);
    return false;
  }
}

// Test a simple endpoint
async function testMealPlansEndpoint() {
  console.log('\n🧪 Testing Meal Plans API...');
  try {
    const response = await fetch(`${BASE_URL}/api/meal-plans`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Meal plans API working, returned ${data.data?.length || 0} plans`);
    } else {
      console.log(`❌ Meal plans API failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Meal plans API error: ${error.message}`);
  }
}

// Run basic tests
async function runBasicTests() {
  console.log('🚀 Starting Basic Security Tests\n');
  
  const serverRunning = await testServerConnection();
  if (serverRunning) {
    await testMealPlansEndpoint();
  }
  
  console.log('\n✅ Basic tests completed!');
}

runBasicTests().catch(console.error);
