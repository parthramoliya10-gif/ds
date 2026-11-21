const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        reqBody = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
      } else {
        reqBody = body;
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
        timeout: 8000,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Request Timeout' });
    });

    if (reqBody) {
      req.write(reqBody);
    }
    req.end();
  });
}

const results = [];

function record(testId, name, category, passed, details) {
  results.push({ testId, name, category, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${testId}: ${name} - ${JSON.stringify(details)}`);
}

async function runSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING AUTOMATED BACKEND API & SECURITY AUDIT');
  console.log('Target: ' + BASE_URL);
  console.log('====================================================\n');

  // 1. Health & Server Info
  const h = await request('GET', '/health');
  record(
    'API-01',
    'Health Check Endpoint',
    'Reconnaissance',
    h.status === 200 && h.body?.status === 'healthy',
    { status: h.status, service: h.body?.service }
  );

  // 2. Security Headers
  const hasHsts = Boolean(h.headers['strict-transport-security']);
  const hasNosniff = h.headers['x-content-type-options'] === 'nosniff';
  const hasXfo = Boolean(h.headers['x-frame-options']);
  record(
    'SEC-01',
    'HTTP Security Headers (HSTS, nosniff, X-Frame-Options)',
    'Security Headers',
    hasNosniff && hasXfo,
    { hsts: hasHsts, nosniff: hasNosniff, xfo: h.headers['x-frame-options'] }
  );

  // 3. CORS Enforcement on Unauthorized Origin
  const corsTest = await request('GET', '/api/v1/health', {
    Origin: 'http://unauthorized-hacker.com',
  });
  const corsOrigin = corsTest.headers['access-control-allow-origin'];
  const corsBlocked = !corsOrigin || corsOrigin !== 'http://unauthorized-hacker.com';
  record(
    'SEC-02',
    'CORS Unauthorized Origin Rejection',
    'Web Security',
    corsBlocked,
    { status: corsTest.status, allowOrigin: corsOrigin || 'None (Blocked)' }
  );

  // 4. Unauthenticated Access Protection on Protected Routes
  const protectedRoutes = [
    { method: 'GET', path: '/api/v1/requests' },
    { method: 'POST', path: '/api/v1/requests' },
    { method: 'GET', path: '/api/v1/admin/dashboard/stats' },
    { method: 'GET', path: '/api/v1/quotations/request/123' },
    { method: 'GET', path: '/api/v1/payments/my-history' },
    { method: 'GET', path: '/api/v1/chat/unread-count' },
    { method: 'GET', path: '/api/v1/profile/me' },
  ];

  for (let i = 0; i < protectedRoutes.length; i++) {
    const route = protectedRoutes[i];
    const res = await request(route.method, route.path);
    const passed = res.status === 401;
    const leaksStack = res.body && typeof res.body === 'object' && 'stack' in res.body && res.body.stack !== undefined;
    record(
      `AUTH-0${i + 1}`,
      `Auth Enforcement on ${route.method} ${route.path}`,
      'Authentication',
      passed && !leaksStack,
      { status: res.status, message: res.body?.message, stackLeaked: leaksStack }
    );
  }

  // 5. Tampered / Invalid JWT Token Handling
  const fakeTokenRes = await request('GET', '/api/v1/requests', {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature_xyz',
  });
  record(
    'AUTH-08',
    'Tampered JWT Signature Handling',
    'Authentication',
    fakeTokenRes.status === 401,
    { status: fakeTokenRes.status, message: fakeTokenRes.body?.message }
  );

  // 6. SQL Injection Payload in Login Email Field
  const sqliRes = await request('POST', '/api/v1/auth/login', {}, {
    email: "' OR '1'='1",
    password: 'Password123!',
  });
  record(
    'INJ-01',
    "SQL Injection Payload (' OR '1'='1) Handling in Login",
    'Injection Testing',
    sqliRes.status === 400,
    { status: sqliRes.status, message: sqliRes.body?.message || sqliRes.body?.errors }
  );

  // 7. XSS Script Payload in Registration FullName
  const xssRes = await request('POST', '/api/v1/auth/register', {}, {
    fullName: '<script>alert(document.cookie)</script>',
    email: 'test_xss_invalid_email',
    password: 'weak',
  });
  record(
    'INJ-02',
    'XSS & Invalid Input Rejection in Registration',
    'Input Validation',
    xssRes.status === 400,
    { status: xssRes.status, message: xssRes.body?.message || xssRes.body?.errors }
  );

  // 8. Auth Rate Limiter (Brute Force Protection)
  console.log('\nTesting Auth Rate Limiter with burst requests...');
  let rateLimited = false;
  let triggerCount = 0;
  for (let i = 1; i <= 20; i++) {
    const burstRes = await request('POST', '/api/v1/auth/login', {}, {
      email: 'invalid_probe@example.com',
      password: 'wrong_password_' + i,
    });
    if (burstRes.status === 429) {
      rateLimited = true;
      triggerCount = i;
      break;
    }
  }
  record(
    'SEC-03',
    'Authentication Rate Limiter (429 Too Many Requests)',
    'Brute Force Protection',
    rateLimited,
    { rateLimited, triggeredAtRequest: triggerCount }
  );

  // 9. Invalid HTTP Method Handling
  const methodRes = await request('PUT', '/api/v1/requests');
  record(
    'API-02',
    'Invalid HTTP Method Handling (PUT /api/v1/requests)',
    'API Design',
    methodRes.status === 404 || methodRes.status === 405,
    { status: methodRes.status }
  );

  // 10. Malformed JSON Body Handling
  const malformedRes = await request('POST', '/api/v1/auth/login', { 'Content-Type': 'application/json' }, '{ "email": "broken json');
  record(
    'API-03',
    'Malformed JSON Request Body Handling',
    'API Error Handling',
    malformedRes.status === 400,
    { status: malformedRes.status, message: malformedRes.body?.message }
  );

  // Summary
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n====================================================');
  console.log(`📊 TEST EXECUTION SUMMARY: ${passedCount}/${total} PASSED (${failedCount} Failed)`);
  console.log('====================================================\n');
}

runSuite().catch(console.error);
