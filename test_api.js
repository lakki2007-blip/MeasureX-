// ============================================================================
// MeasureX! API Backend Test Suite
// Validates all endpoints, RBAC, Fee calculation, MPE logic & Status Tracker
// ============================================================================

const http = require('http');
const app = require('./server');

let server;
const PORT = 5001; // Test on port 5001 to avoid any port conflicts

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n====================================================================');
  console.log('🧪 Starting MeasureX! Backend Automated Test Suite');
  console.log('====================================================================\n');

  server = app.listen(PORT);
  // Wait 500ms for server to bind
  await new Promise(r => setTimeout(r, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('--- 1. Health & Server Check ---');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'UP', 'GET /api/health returns UP');

    // 2. Authentication & RBAC
    console.log('\n--- 2. Authentication & JWT RBAC ---');

    // Register Trader
    const traderEmail = `test_trader_${Date.now()}@test.com`;
    const regTrader = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Trader Org',
      entity: 'Supermarket Wholesale Ltd',
      role: 'trader',
      email: traderEmail,
      password: 'Password@123',
      phone: '+91 99999 88888',
      license_no: 'LM/TR/2026/TEST'
    });
    assert(regTrader.status === 201 && regTrader.body.token, 'Trader registration issues valid JWT');
    const traderToken = regTrader.body.token;

    // Login with existing seed user (Inspector)
    const loginInspector = await makeRequest('POST', '/api/auth/login', {
      email: 'v.singh@metrology.gov.in',
      password: 'Password@123'
    });
    assert(loginInspector.status === 200 && loginInspector.body.token, 'Inspector login successful with JWT');
    const inspectorToken = loginInspector.body.token;

    // Login with seed Admin
    const loginAdmin = await makeRequest('POST', '/api/auth/login', {
      email: 'controller@metrology.gov.in',
      password: 'Password@123'
    });
    assert(loginAdmin.status === 200 && loginAdmin.body.user.role === 'admin', 'Admin login authenticates admin role');
    const adminToken = loginAdmin.body.token;

    // Invalid password test
    const badLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'controller@metrology.gov.in',
      password: 'WrongPassword!'
    });
    assert(badLogin.status === 401, 'Invalid password correctly returns 401 Unauthorized');

    // 3. Instrument Management
    console.log('\n--- 3. Instrument Registration & Scoped Listing ---');

    // Trader registers a new fuel dispenser
    const newDispenser = await makeRequest('POST', '/api/instruments', {
      category: 'fuel_dispenser',
      serial_number: `FD-TEST-${Date.now().toString().slice(-4)}`,
      location: 'Highway Plaza Dispenser #5',
      make_model: 'Wayne Ovation Fuel Pump',
      max_capacity: '50 L/min',
      min_capacity: '2 L/min'
    }, traderToken);
    assert(newDispenser.status === 201, 'Trader can register new instrument');
    const registeredInstId = newDispenser.body.instrument.id;

    // Inspector tries to register an instrument (Should be rejected with 403 Forbidden)
    const inspectorRegisterAttempt = await makeRequest('POST', '/api/instruments', {
      category: 'weighbridge',
      serial_number: `WB-DENY-${Date.now().toString().slice(-4)}`,
      location: 'Restricted Yard'
    }, inspectorToken);
    assert(inspectorRegisterAttempt.status === 403, 'Inspector forbidden from registering instruments (RBAC enforced)');

    // Scoped listing: Trader sees only their own
    const traderInstList = await makeRequest('GET', '/api/instruments', null, traderToken);
    const traderHasOnlyOwn = traderInstList.body.instruments.every(i => i.owner_id === regTrader.body.user.id);
    assert(traderInstList.status === 200 && traderHasOnlyOwn, 'Trader GET /api/instruments returns only trader owned instruments');

    // Scoped listing: Admin sees all instruments
    const adminInstList = await makeRequest('GET', '/api/instruments', null, adminToken);
    assert(adminInstList.status === 200 && adminInstList.body.instruments.length >= 4, 'Admin GET /api/instruments sees all instruments');

    // 4. Verification Booking & Fee Calculation Rules
    console.log('\n--- 4. Verification Booking & Fee Calculation Rules ---');

    // Test fee calculation for weighbridge (₹3500)
    // First register a weighbridge for this trader
    const wbInst = await makeRequest('POST', '/api/instruments', {
      category: 'weighbridge',
      serial_number: `WB-TEST-${Date.now().toString().slice(-4)}`,
      location: 'Apex Toll Plaza Gate 1',
      make_model: 'Essae 60T Weighbridge'
    }, traderToken);

    const wbBooking = await makeRequest('POST', '/api/requests', {
      instrument_id: wbInst.body.instrument.id,
      preferred_date: '2026-10-15',
      notes: 'Urgent highway weighbridge verification'
    }, traderToken);
    assert(wbBooking.status === 201 && wbBooking.body.request.fee_amount === 3500, 'Fee calculation: Weighbridge fee = ₹3,500');

    // Test fee calculation for electronic_counter_scale (₹500)
    const scaleInst = await makeRequest('POST', '/api/instruments', {
      category: 'electronic_counter_scale',
      serial_number: `SC-TEST-${Date.now().toString().slice(-4)}`,
      location: 'Retail Counter #2',
      make_model: 'Citizen Commercial Scale'
    }, traderToken);

    const scaleBooking = await makeRequest('POST', '/api/requests', {
      instrument_id: scaleInst.body.instrument.id,
      preferred_date: '2026-10-20'
    }, traderToken);
    assert(scaleBooking.status === 201 && scaleBooking.body.request.fee_amount === 500, 'Fee calculation: Counter Scale fee = ₹500');

    // Test fee calculation for epos_scale (₹800)
    const eposInst = await makeRequest('POST', '/api/instruments', {
      category: 'epos_scale',
      serial_number: `EPOS-TEST-${Date.now().toString().slice(-4)}`,
      location: 'FPS Store #40'
    }, traderToken);

    const eposBooking = await makeRequest('POST', '/api/requests', {
      instrument_id: eposInst.body.instrument.id,
      preferred_date: '2026-10-22'
    }, traderToken);
    assert(eposBooking.status === 201 && eposBooking.body.request.fee_amount === 800, 'Fee calculation: ePoS Scale fee = ₹800');

    // Test fee calculation for fuel_dispenser (₹2000)
    const fuelBooking = await makeRequest('POST', '/api/requests', {
      instrument_id: registeredInstId,
      preferred_date: '2026-10-25'
    }, traderToken);
    assert(fuelBooking.status === 201 && fuelBooking.body.request.fee_amount === 2000, 'Fee calculation: Fuel Dispenser fee = ₹2,000');
    const activeRequestId = fuelBooking.body.request.id;

    // 5. Amazon-Style 4-Step Status Tracker
    console.log('\n--- 5. Amazon-Style 4-Step Status Tracker ---');

    // State 1: Request just submitted (Step 1 True, Step 2 False)
    const track1 = await makeRequest('GET', `/api/requests/track/${activeRequestId}`);
    assert(
      track1.status === 200 &&
      track1.body.timeline.step1_submitted.completed === true &&
      track1.body.timeline.step2_inspector_assigned.completed === false &&
      track1.body.current_step === 1,
      'Tracker Step 1: Application Submitted & Fee Paid = True, Step 2 = False'
    );

    // Assign Inspector to request (Admin action)
    await makeRequest('PUT', `/api/requests/${activeRequestId}/assign`, {
      inspector_id: loginInspector.body.user.id
    }, adminToken);

    // State 2: Inspector assigned (Step 2 True)
    const track2 = await makeRequest('GET', `/api/requests/track/${activeRequestId}`);
    assert(
      track2.body.timeline.step2_inspector_assigned.completed === true &&
      track2.body.timeline.step3_field_verification.active === true &&
      track2.body.current_step === 3,
      'Tracker Step 2: Inspector Assigned = True, Step 3 Field Verification = Active'
    );

    // 6. Inspector Workbench & MPE Verification
    console.log('\n--- 6. Inspector Workbench & MPE Tolerances Verification ---');

    // Trader tries to access workbench (Should be rejected with 403)
    const traderWorkbenchAttempt = await makeRequest('POST', '/api/inspector/testbench', {
      request_id: activeRequestId,
      zero_load_error: 0.02,
      half_load_error: 0.03,
      max_load_error: 0.04,
      seal_no: 'LM-SEAL-TEST'
    }, traderToken);
    assert(traderWorkbenchAttempt.status === 403, 'Trader forbidden from inspector workbench (RBAC enforced)');

    // Inspector submits readings WITHIN MPE tolerance for fuel dispenser (MPE = 0.25%)
    const testbenchPass = await makeRequest('POST', '/api/inspector/testbench', {
      request_id: activeRequestId,
      zero_load_error: 0.02,
      half_load_error: 0.08,
      max_load_error: 0.12,
      seal_no: 'LM-SEAL-2026-PASS'
    }, inspectorToken);
    assert(
      testbenchPass.status === 201 &&
      testbenchPass.body.verification_result === 'PASSED' &&
      testbenchPass.body.certificate &&
      testbenchPass.body.instrument.status === 'valid',
      'Testbench PASSED: MPE verified, instrument status set to valid, Form VII Certificate generated'
    );
    const issuedCertId = testbenchPass.body.certificate.id;
    const issuedQrCode = testbenchPass.body.certificate.qr_code;

    // State 4: Certificate Issued on Tracker
    const track3 = await makeRequest('GET', `/api/requests/track/${activeRequestId}`);
    assert(
      track3.body.timeline.step4_certificate_issued.completed === true &&
      track3.body.current_step === 4 &&
      track3.body.progress_percentage === 100,
      'Tracker Step 4: Certificate Issued = True, Progress = 100%'
    );

    // Test MPE failure case
    // Create new scale booking and test exceeding tolerance (scale MPE = 0.05%)
    const failScale = await makeRequest('POST', '/api/instruments', {
      category: 'electronic_counter_scale',
      serial_number: `SC-FAIL-${Date.now().toString().slice(-4)}`,
      location: 'Faulty Scale Bench'
    }, traderToken);
    const failBooking = await makeRequest('POST', '/api/requests', {
      instrument_id: failScale.body.instrument.id,
      preferred_date: '2026-10-30'
    }, traderToken);

    const testbenchFail = await makeRequest('POST', '/api/inspector/testbench', {
      request_id: failBooking.body.request.id,
      zero_load_error: 0.10, // 0.10% > 0.05% MPE limit!
      half_load_error: 0.20,
      max_load_error: 0.35,
      seal_no: 'REJECTED'
    }, inspectorToken);
    assert(
      testbenchFail.status === 422 &&
      testbenchFail.body.verification_result === 'FAILED',
      'Testbench FAILED: Exceeding MPE tolerance sets status to expired and rejects certification'
    );

    // 7. Certificates & Public QR Verification
    console.log('\n--- 7. Certificates (Form VII) & Public QR Access ---');

    // Authenticated certificate fetch
    const certView = await makeRequest('GET', `/api/certificates/${issuedCertId}`, null, traderToken);
    assert(
      certView.status === 200 &&
      certView.body.certificate.certificate_no === issuedCertId &&
      certView.body.certificate.statutory_status.includes('ACTIVE'),
      'GET /api/certificates/:id returns complete Form VII certificate for viewing/printing'
    );

    // Public QR Access: Completely Unauthenticated
    const publicScan = await makeRequest('GET', `/api/public/access/${issuedQrCode}`);
    assert(
      publicScan.status === 200 &&
      publicScan.body.verified === true &&
      publicScan.body.compliance_status.includes('VALID') &&
      publicScan.body.certificate_info.lead_security_seal_no === 'LM-SEAL-2026-PASS',
      'GET /api/public/access/:id verified unauthenticated QR scan with official legal metrology record'
    );

    // Public scan of invalid QR code
    const invalidScan = await makeRequest('GET', '/api/public/access/FAKE-QR-NON-EXISTENT');
    assert(
      invalidScan.status === 404 &&
      invalidScan.body.verified === false,
      'Public scan of invalid QR code correctly returns 404 UNVERIFIED warning'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================================');
    console.log(`🏁 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
