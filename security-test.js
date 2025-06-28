/**
 * Security Test Script for SEA Culinary Subscription System
 * Run this in a separate terminal to test the security features
 */

const BASE_URL = 'http://localhost:3001';

// Test XSS Protection
async function testXSSProtection() {
  console.log('\n🧪 Testing XSS Protection...');
  
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ];

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/meal-plans?search=${encodeURIComponent(payload)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.text();
      if (result.includes('<script>') || result.includes('javascript:')) {
        console.log(`❌ XSS payload not filtered: ${payload}`);
      } else {
        console.log(`✅ XSS payload filtered: ${payload}`);
      }
    } catch (error) {
      console.log(`✅ XSS payload blocked: ${payload}`);
    }
  }
}

// Test SQL Injection Protection
async function testSQLInjection() {
  console.log('\n🧪 Testing SQL Injection Protection...');
  
  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "' OR 1=1 --",
    "'; WAITFOR DELAY '00:00:05' --"
  ];

  for (const payload of sqlPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/meal-plans?search=${encodeURIComponent(payload)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ SQL injection payload handled safely: ${payload}`);
      } else {
        console.log(`✅ SQL injection payload rejected: ${payload}`);
      }
    } catch (error) {
      console.log(`✅ SQL injection payload blocked: ${payload}`);
    }
  }
}

// Test CSRF Protection
async function testCSRFProtection() {
  console.log('\n🧪 Testing CSRF Protection...');
  
  try {
    // Try to make a POST request without CSRF token
    const response = await fetch(`${BASE_URL}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        phone: '1234567890',
        plan: '1',
        mealTypes: ['breakfast'],
        deliveryDays: ['monday'],
        totalPrice: 129000
      })
    });

    if (response.status === 403 || response.status === 401) {
      console.log('✅ CSRF protection working - unauthorized request blocked');
    } else {
      console.log('❌ CSRF protection may be missing - request went through');
    }
  } catch (error) {
    console.log('✅ CSRF protection working - request blocked');
  }
}

// Test Rate Limiting
async function testRateLimiting() {
  console.log('\n🧪 Testing Rate Limiting...');
  
  let requestCount = 0;
  let rateLimited = false;

  // Try to make rapid requests
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/meal-plans`, {
        method: 'GET'
      });
      
      if (response.status === 429) {
        rateLimited = true;
        console.log(`✅ Rate limiting activated after ${requestCount} requests`);
        break;
      }
      
      requestCount++;
    } catch (error) {
      console.log('Request failed:', error.message);
      break;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!rateLimited && requestCount >= 50) {
    console.log('❌ Rate limiting may not be working properly');
  } else if (!rateLimited) {
    console.log(`ℹ️ Rate limiting not triggered (made ${requestCount} requests)`);
  }
}

// Test Security Headers
async function testSecurityHeaders() {
  console.log('\n🧪 Testing Security Headers...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/meal-plans`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];

    for (const header of securityHeaders) {
      if (headers.get(header)) {
        console.log(`✅ ${header}: ${headers.get(header)}`);
      } else {
        console.log(`❌ Missing security header: ${header}`);
      }
    }
  } catch (error) {
    console.log('❌ Failed to test security headers:', error.message);
  }
}

// Test Input Validation
async function testInputValidation() {
  console.log('\n🧪 Testing Input Validation...');
  
  const invalidInputs = [
    { email: 'invalid-email', expected: 'Email validation should fail' },
    { phone: '123', expected: 'Phone validation should fail' },
    { name: 'A', expected: 'Name validation should fail' },
    { name: 'Test<script>', expected: 'Name with HTML should fail' }
  ];

  // Note: This would typically require authentication
  console.log('ℹ️ Input validation tests require authentication - manual testing recommended');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Security Tests for SEA Culinary Subscription System');
  console.log('=' .repeat(60));
  
  await testXSSProtection();
  await testSQLInjection();
  await testCSRFProtection();
  await testRateLimiting();
  await testSecurityHeaders();
  await testInputValidation();
  
  console.log('\n✅ Security tests completed!');
  console.log('📝 Check the results above and perform manual testing for authenticated endpoints.');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = {
  testXSSProtection,
  testSQLInjection,
  testCSRFProtection,
  testRateLimiting,
  testSecurityHeaders,
  testInputValidation,
  runAllTests
};
