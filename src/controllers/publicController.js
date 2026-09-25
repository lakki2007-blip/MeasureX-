// Public Verification Controller - Unauthenticated QR Code / Public Stamping Access
const db = require('../config/db');

/**
 * Public endpoint accessed when scanning external physical QR Code mounted on instrument
 * GET /api/public/access/:id
 */
async function verifyPublicQRCode(req, res, next) {
  try {
    const { id } = req.params;
    const queryTerm = (id || '').trim();

    if (!queryTerm) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'QR code string or certificate reference is required.'
      });
    }

    // Search certificates by QR code string, certificate ID, or instrument serial
    const query = `
      SELECT 
        c.*,
        i.serial_number AS instrument_serial,
        i.category AS instrument_category,
        i.make_model AS instrument_model,
        i.location AS installed_location,
        u.name AS owner_name,
        u.entity AS owner_entity,
        insp.name AS inspector_name,
        insp.license_no AS inspector_badge
      FROM certificates c
      JOIN instruments i ON c.instrument_id = i.id
      JOIN users u ON i.owner_id = u.id
      LEFT JOIN users insp ON c.issued_by = insp.id
      WHERE c.qr_code = $1 
         OR c.id = $1 
         OR i.serial_number = $1
      LIMIT 1
    `;

    const result = await db.query(query, [queryTerm]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        verified: false,
        compliance_status: 'UNVERIFIED / UNREGISTERED',
        query_reference: queryTerm,
        message: 'No official Legal Metrology verification certificate found for this reference.',
        warning: 'Warning: Using unstamped or unverified weighing and measuring instruments for commercial trade is punishable under Section 25 of the Legal Metrology Act, 2009.'
      });
    }

    const cert = result.rows[0];

    // Check validity against current timestamp
    const now = new Date();
    const expiry = new Date(cert.valid_till);
    const isExpired = now > expiry;
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      verified: true,
      compliance_status: isExpired ? 'EXPIRED' : 'VALID & STATUTORILY COMPLIANT',
      statutory_valid: !isExpired,
      certificate_info: {
        certificate_no: cert.id,
        issue_date: cert.issue_date,
        valid_till: cert.valid_till,
        days_remaining: daysRemaining,
        verification_result: cert.result,
        lead_security_seal_no: cert.seal_no,
        qr_verification_code: cert.qr_code
      },
      instrument_details: {
        serial_number: cert.instrument_serial,
        category: cert.instrument_category,
        make_model: cert.instrument_model,
        installed_location: cert.installed_location
      },
      owner_entity: {
        name: cert.owner_name,
        entity: cert.owner_entity
      },
      inspector_authorization: {
        inspector_name: cert.inspector_name,
        badge_number: cert.inspector_badge,
        department: 'Government of India - Department of Legal Metrology'
      },
      official_statement: 'This digital record certifies that the above weighing/measuring instrument was tested and stamped by an authorized Legal Metrology Inspector in compliance with Section 24 of the Legal Metrology Act, 2009.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyPublicQRCode
};
