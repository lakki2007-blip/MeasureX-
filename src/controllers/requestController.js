// Verification Requests Controller - Booking, Role-Based Listing, and Amazon-Style Status Tracker
const db = require('../config/db');
const { calculateFee } = require('../config/feeSchedule');

/**
 * Submit a verification booking (Trader only or Admin)
 * POST /api/requests
 */
async function createRequest(req, res, next) {
  try {
    const { instrument_id, preferred_date, notes } = req.body;

    if (!instrument_id || !preferred_date) {
      return res.status(400).json({
        success: false,
        message: 'instrument_id and preferred_date are required fields.'
      });
    }

    // Verify instrument exists
    const instResult = await db.query('SELECT * FROM instruments WHERE id = $1', [instrument_id]);
    if (instResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Instrument with ID '${instrument_id}' does not exist.`
      });
    }

    const instrument = instResult.rows[0];

    // RBAC: If trader, verify ownership
    if (req.user.role.toLowerCase() === 'trader' && instrument.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only book verifications for instruments you own.'
      });
    }

    // Business Logic: Calculate statutory Legal Metrology fee based on instrument category
    const fee_amount = calculateFee(instrument.category);

    const requestId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const traderId = req.user.id;
    const initialStatus = 'pending';

    const insertQuery = `
      INSERT INTO verification_requests (
        id, instrument_id, trader_id, inspector_id, preferred_date, fee_amount, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      requestId,
      instrument.id,
      traderId,
      null, // inspector initially unassigned
      preferred_date,
      fee_amount,
      initialStatus,
      notes || null
    ]);

    const createdRequest = result.rows[0];
    if (createdRequest && createdRequest.fee_amount !== undefined) {
      createdRequest.fee_amount = parseFloat(createdRequest.fee_amount);
    }

    res.status(201).json({
      success: true,
      message: `Verification booking '${createdRequest.id}' created. Statutory fee of ₹${fee_amount} calculated.`,
      fee_breakdown: {
        category: instrument.category,
        statutory_fee: fee_amount,
        currency: 'INR'
      },
      request: createdRequest
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List verification requests based on user role context
 * GET /api/requests
 */
async function getRequests(req, res, next) {
  try {
    const userRole = req.user.role.toLowerCase();
    const userId = req.user.id;

    let queryText = `
      SELECT 
        r.*,
        i.serial_number AS instrument_serial,
        i.make_model AS instrument_name,
        i.category AS instrument_category,
        i.location AS instrument_location,
        t.name AS trader_name,
        t.entity AS trader_entity,
        t.email AS trader_email,
        t.phone AS trader_phone,
        insp.name AS inspector_name,
        insp.license_no AS inspector_badge
      FROM verification_requests r
      LEFT JOIN instruments i ON r.instrument_id = i.id
      LEFT JOIN users t ON r.trader_id = t.id
      LEFT JOIN users insp ON r.inspector_id = insp.id
    `;
    const params = [];

    if (userRole === 'trader') {
      // Trader sees only their own requests
      queryText += ' WHERE r.trader_id = $1 ORDER BY r.created_at DESC';
      params.push(userId);
    } else if (userRole === 'inspector') {
      // Inspector sees assigned requests OR unassigned pending requests in queue
      queryText += ' WHERE (r.inspector_id = $1 OR r.inspector_id IS NULL) ORDER BY r.created_at DESC';
      params.push(userId);
    } else {
      // Admin sees all
      queryText += ' ORDER BY r.created_at DESC';
    }

    const result = await db.query(queryText, params);
    result.rows.forEach(r => {
      if (r.fee_amount !== undefined) r.fee_amount = parseFloat(r.fee_amount);
    });

    res.json({
      success: true,
      count: result.rows.length,
      role: userRole,
      requests: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Amazon-Style 4-Step Status Tracker Timeline
 * GET /api/requests/track/:id
 * 
 * Step 1: Application Submitted & Fee Paid (True if request exists).
 * Step 2: Inspector Assigned (True if inspector_id is NOT null).
 * Step 3: Field Verification (True if test bench data is currently being entered/pending).
 * Step 4: Certificate Issued (True if a related certificate record exists).
 */
async function trackRequestStatus(req, res, next) {
  try {
    const { id } = req.params;
    const queryTerm = (id || '').trim();

    if (!queryTerm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid tracking ID (Request ID, Instrument Serial, or Certificate ID).'
      });
    }

    // Try finding matching request first
    let requestQuery = `
      SELECT 
        r.*,
        i.id AS inst_id,
        i.serial_number AS instrument_serial,
        i.make_model AS instrument_name,
        i.category AS instrument_category,
        i.location AS instrument_location,
        i.status AS instrument_status,
        t.name AS trader_name,
        t.entity AS trader_entity,
        insp.name AS inspector_name,
        insp.license_no AS inspector_badge
      FROM verification_requests r
      LEFT JOIN instruments i ON r.instrument_id = i.id
      LEFT JOIN users t ON r.trader_id = t.id
      LEFT JOIN users insp ON r.inspector_id = insp.id
      WHERE r.id = $1 OR i.serial_number = $1 OR i.id = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    let reqResult = await db.query(requestQuery, [queryTerm]);
    let reqRecord = reqResult.rows[0];

    // If not found by request or instrument, try certificate query
    let certRecord = null;
    if (reqRecord) {
      const certResult = await db.query(
        'SELECT * FROM certificates WHERE request_id = $1 OR instrument_id = $2 ORDER BY created_at DESC LIMIT 1',
        [reqRecord.id, reqRecord.instrument_id]
      );
      if (certResult.rows.length > 0) {
        certRecord = certResult.rows[0];
      }
    } else {
      const certResult = await db.query(
        `SELECT c.*, i.serial_number AS instrument_serial, i.make_model AS instrument_name,
                i.category AS instrument_category, i.location AS instrument_location,
                u.name AS trader_name, u.entity AS trader_entity,
                insp.name AS inspector_name, insp.license_no AS inspector_badge
         FROM certificates c
         LEFT JOIN instruments i ON c.instrument_id = i.id
         LEFT JOIN users u ON i.owner_id = u.id
         LEFT JOIN users insp ON c.issued_by = insp.id
         WHERE c.id = $1 OR c.qr_code = $1
         LIMIT 1`,
        [queryTerm]
      );
      if (certResult.rows.length > 0) {
        certRecord = certResult.rows[0];
        // Fetch related request
        const rResult = await db.query('SELECT * FROM verification_requests WHERE id = $1', [certRecord.request_id]);
        if (rResult.rows.length > 0) {
          reqRecord = rResult.rows[0];
          reqRecord.instrument_serial = certRecord.instrument_serial;
          reqRecord.instrument_name = certRecord.instrument_name;
          reqRecord.instrument_category = certRecord.instrument_category;
          reqRecord.trader_name = certRecord.trader_name;
          reqRecord.trader_entity = certRecord.trader_entity;
          reqRecord.inspector_name = certRecord.inspector_name;
        }
      }
    }

    if (!reqRecord && !certRecord) {
      return res.status(404).json({
        success: false,
        message: `No active verification or certificate record found for tracking query '${queryTerm}'.`
      });
    }

    // =========================================================================
    // BUSINESS LOGIC: 4-Step Amazon Delivery-Style Timeline Calculation
    // =========================================================================

    // Step 1: Application Submitted & Fee Paid (True if request exists)
    const step1Completed = Boolean(reqRecord);

    // Step 2: Inspector Assigned (True if inspector_id is NOT null)
    const step2Completed = Boolean(reqRecord && reqRecord.inspector_id);

    // Step 3: Field Verification (True if test bench data is currently being entered/pending or completed)
    // Active if inspector is assigned and certificate not yet issued; Completed if certificate issued or status is completed.
    const hasCertificate = Boolean(certRecord);
    const step3Active = step2Completed && !hasCertificate;
    const step3Completed = hasCertificate || (reqRecord && (reqRecord.status === 'completed' || reqRecord.status === 'approved'));

    // Step 4: Certificate Issued (True if a related certificate record exists)
    const step4Completed = hasCertificate;

    // Calculate current stage & progress percentage
    let currentStepNumber = 1;
    let overallStatus = 'Application Submitted';
    let progressPercentage = 25;

    if (step4Completed) {
      currentStepNumber = 4;
      overallStatus = 'Certificate Issued & Security Seal Mounted';
      progressPercentage = 100;
    } else if (step3Active || step3Completed) {
      currentStepNumber = 3;
      overallStatus = 'Field Verification & MPE Testing In Progress';
      progressPercentage = 75;
    } else if (step2Completed) {
      currentStepNumber = 2;
      overallStatus = 'Inspector Assigned to Field Jurisdiction';
      progressPercentage = 50;
    }

    const timeline = {
      step1_submitted: {
        step: 1,
        title: 'Application Submitted & Fee Paid',
        completed: step1Completed,
        active: currentStepNumber === 1,
        details: `Statutory fee of ₹${reqRecord ? reqRecord.fee_amount : '3,500'} received and verified under Legal Metrology Schedule.`,
        date: reqRecord ? (reqRecord.created_at || reqRecord.preferred_date) : null
      },
      step2_inspector_assigned: {
        step: 2,
        title: 'Inspector Assigned',
        completed: step2Completed,
        active: currentStepNumber === 2,
        details: step2Completed 
          ? `Inspector ${reqRecord.inspector_name || 'Vikram Singh'} assigned to jurisdiction.` 
          : 'Pending inspector assignment by Zonal Metrology Controller.',
        inspector: reqRecord ? reqRecord.inspector_name : null
      },
      step3_field_verification: {
        step: 3,
        title: 'Field Verification & MPE Testing',
        completed: step3Completed,
        active: currentStepNumber === 3,
        details: step3Completed
          ? 'Physical calibration and MPE load tolerance tests completed on site.'
          : (step3Active ? 'Inspector conducting live calibration load tests.' : 'Scheduled calibration test pending.')
      },
      step4_certificate_issued: {
        step: 4,
        title: 'Certificate Issued & Security Seal Attached',
        completed: step4Completed,
        active: currentStepNumber === 4,
        details: step4Completed
          ? `Digital Certificate Form VII issued (${certRecord.id}). QR code activated.`
          : 'Awaiting inspector authorization and lead security seal installation.',
        certificate_id: certRecord ? certRecord.id : null,
        seal_no: certRecord ? certRecord.seal_no : null
      }
    };

    res.json({
      success: true,
      tracking_id: queryTerm,
      current_step: currentStepNumber,
      total_steps: 4,
      progress_percentage: progressPercentage,
      overall_status: overallStatus,
      request_details: {
        request_id: reqRecord ? reqRecord.id : null,
        instrument_serial: reqRecord ? reqRecord.instrument_serial : (certRecord ? certRecord.instrument_serial : 'N/A'),
        instrument_name: reqRecord ? reqRecord.instrument_name : 'Legal Metrology Instrument',
        category: reqRecord ? reqRecord.instrument_category : 'N/A',
        owner_name: reqRecord ? reqRecord.trader_name : 'Authorized Trader',
        owner_entity: reqRecord ? reqRecord.trader_entity : '',
        fee_amount: reqRecord ? reqRecord.fee_amount : 0,
        inspector_name: reqRecord ? reqRecord.inspector_name : (certRecord ? certRecord.inspector_name : null)
      },
      certificate_details: certRecord ? {
        certificate_id: certRecord.id,
        issue_date: certRecord.issue_date,
        valid_till: certRecord.valid_till,
        seal_no: certRecord.seal_no,
        qr_code: certRecord.qr_code,
        result: certRecord.result
      } : null,
      timeline
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign inspector to verification request (Admin only)
 * PUT /api/requests/:id/assign
 */
async function assignInspector(req, res, next) {
  try {
    const { id } = req.params;
    const { inspector_id } = req.body;

    if (!inspector_id) {
      return res.status(400).json({
        success: false,
        message: 'inspector_id is required in request body.'
      });
    }

    const checkInsp = await db.query("SELECT * FROM users WHERE id = $1 AND role = 'inspector'", [inspector_id]);
    if (checkInsp.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Inspector with ID '${inspector_id}' not found.`
      });
    }

    const updateQuery = `
      UPDATE verification_requests 
      SET inspector_id = $1, status = 'assigned' 
      WHERE id = $2 
      RETURNING *
    `;

    const result = await db.query(updateQuery, [inspector_id, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Verification request with ID '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: `Inspector ${checkInsp.rows[0].name} assigned to request ${id}.`,
      request: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRequest,
  getRequests,
  trackRequestStatus,
  assignInspector
};
