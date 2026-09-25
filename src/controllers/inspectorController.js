// Inspector Controller - Digital Test Workbench, MPE Tolerances Verification, and Certificate Issuance
const db = require('../config/db');
const { getMpeTolerance } = require('../config/feeSchedule');

/**
 * Submit test readings, verify Legal Metrology MPE tolerances, update instrument status, and issue Certificate
 * POST /api/inspector/testbench
 */
async function submitTestBench(req, res, next) {
  try {
    const {
      request_id,
      zero_load_error,
      half_load_error,
      max_load_error,
      seal_no,
      validity_months
    } = req.body;

    if (!request_id || seal_no === undefined || zero_load_error === undefined || half_load_error === undefined || max_load_error === undefined) {
      return res.status(400).json({
        success: false,
        message: 'request_id, zero_load_error, half_load_error, max_load_error, and seal_no are required.'
      });
    }

    // 1. Fetch verification request
    const reqResult = await db.query('SELECT * FROM verification_requests WHERE id = $1', [request_id]);
    if (reqResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Verification request '${request_id}' not found.`
      });
    }

    const verificationRequest = reqResult.rows[0];

    // 2. Fetch instrument details
    const instResult = await db.query('SELECT * FROM instruments WHERE id = $1', [verificationRequest.instrument_id]);
    if (instResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Associated instrument '${verificationRequest.instrument_id}' not found.`
      });
    }

    const instrument = instResult.rows[0];

    // 3. MPE Verification Logic
    const zeroErr = parseFloat(zero_load_error);
    const halfErr = parseFloat(half_load_error);
    const maxErr = parseFloat(max_load_error);

    const maxObservedError = Math.max(Math.abs(zeroErr), Math.abs(halfErr), Math.abs(maxErr));
    const mpeTolerance = getMpeTolerance(instrument.category);
    const isPassed = maxObservedError <= mpeTolerance;

    const today = new Date();
    const issueDateStr = today.toISOString().split('T')[0];

    const monthsToAdd = validity_months ? parseInt(validity_months, 10) : 12;
    const validUntilDate = new Date(today);
    validUntilDate.setMonth(validUntilDate.getMonth() + monthsToAdd);
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    // Format errors for display
    const formattedObserved = `+ ${(maxObservedError).toFixed(3)}%`;
    const formattedMpe = `+/- ${mpeTolerance}%`;

    if (!isPassed) {
      // Failed inspection
      await db.query(
        "UPDATE instruments SET status = 'expired' WHERE id = $1",
        [instrument.id]
      );
      await db.query(
        "UPDATE verification_requests SET status = 'rejected' WHERE id = $1",
        [verificationRequest.id]
      );

      return res.status(422).json({
        success: false,
        verification_result: 'FAILED',
        message: `Inspection FAILED. Maximum observed error (${formattedObserved}) exceeds statutory MPE tolerance (${formattedMpe}) for ${instrument.category}.`,
        instrument_id: instrument.id,
        serial_number: instrument.serial_number,
        tolerance_benchmark: {
          mpe_limit_percent: mpeTolerance,
          zero_load_error_percent: zeroErr,
          half_load_error_percent: halfErr,
          max_load_error_percent: maxErr,
          maximum_observed_percent: maxObservedError
        },
        statutory_notice: 'Instrument must undergo servicing & recalibration before applying for reverification under Section 24.'
      });
    }

    // =========================================================================
    // Passed: Update Instrument Status to 'valid' and issue Certificate record
    // =========================================================================

    // Update Instrument
    const updateInstQuery = `
      UPDATE instruments 
      SET status = $1, seal_no = $2, last_verification_date = $3, next_due_date = $4
      WHERE id = $5
      RETURNING *
    `;
    const updatedInstRes = await db.query(updateInstQuery, [
      'valid',
      seal_no.trim(),
      issueDateStr,
      validUntilStr,
      instrument.id
    ]);
    const updatedInstrument = updatedInstRes.rows[0];

    // Update Verification Request to 'completed'
    await db.query(
      "UPDATE verification_requests SET status = 'completed' WHERE id = $1",
      [verificationRequest.id]
    );

    // Automatically generate Form VII Certificate record
    const certId = `CERT-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCodeString = `LM-GOV-VERIFY-${instrument.id}-${certId}`;
    const inspectorId = req.user ? req.user.id : (verificationRequest.inspector_id || 'usr_301');

    const insertCertQuery = `
      INSERT INTO certificates (
        id, instrument_id, request_id, issue_date, valid_till,
        issued_by, seal_no, qr_code, result, max_permissible_error, observed_error
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const certResult = await db.query(insertCertQuery, [
      certId,
      instrument.id,
      verificationRequest.id,
      issueDateStr,
      validUntilStr,
      inspectorId,
      seal_no.trim(),
      qrCodeString,
      'PASSED',
      formattedMpe,
      formattedObserved
    ]);

    const createdCertificate = certResult.rows[0];

    res.status(201).json({
      success: true,
      verification_result: 'PASSED',
      message: `Inspection PASSED! Certificate '${createdCertificate.id}' automatically generated and security seal '${seal_no}' authorized.`,
      mpe_evaluation: {
        category: instrument.category,
        mpe_tolerance: formattedMpe,
        observed_error: formattedObserved,
        tolerance_passed: true,
        zero_load_error: zeroErr,
        half_load_error: halfErr,
        max_load_error: maxErr
      },
      certificate: {
        id: createdCertificate.id,
        issue_date: createdCertificate.issue_date,
        valid_till: createdCertificate.valid_till,
        seal_no: createdCertificate.seal_no,
        qr_code: createdCertificate.qr_code,
        result: createdCertificate.result,
        issued_by: inspectorId
      },
      instrument: updatedInstrument
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List tasks assigned to the logged-in inspector
 * GET /api/inspector/tasks
 */
async function getInspectorTasks(req, res, next) {
  try {
    const inspectorId = req.user.id;
    const query = `
      SELECT 
        r.*,
        i.serial_number AS instrument_serial,
        i.make_model AS instrument_name,
        i.category AS instrument_category,
        i.location AS facility_location,
        u.name AS owner_name,
        u.entity AS owner_entity,
        u.phone AS owner_phone
      FROM verification_requests r
      JOIN instruments i ON r.instrument_id = i.id
      JOIN users u ON r.trader_id = u.id
      WHERE (r.inspector_id = $1 OR (r.inspector_id IS NULL AND r.status = 'pending'))
        AND r.status != 'completed'
      ORDER BY r.preferred_date ASC
    `;

    const result = await db.query(query, [inspectorId]);

    res.json({
      success: true,
      count: result.rows.length,
      tasks: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitTestBench,
  getInspectorTasks
};
