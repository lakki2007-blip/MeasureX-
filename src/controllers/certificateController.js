// Certificate Controller - Fetching, Viewing, and Printing Form VII Certificates
const db = require('../config/db');

/**
 * Fetch certificate details for logged-in user to view/print
 * GET /api/certificates/:id
 */
async function getCertificateById(req, res, next) {
  try {
    const { id } = req.params;
    const certQuery = `
      SELECT 
        c.*,
        i.serial_number AS instrument_serial,
        i.category AS instrument_category,
        i.make_model AS instrument_model,
        i.location AS installed_location,
        i.owner_id,
        u.name AS owner_name,
        u.entity AS owner_entity,
        u.license_no AS trader_license,
        insp.name AS inspector_name,
        insp.license_no AS inspector_badge,
        insp.entity AS inspector_jurisdiction
      FROM certificates c
      JOIN instruments i ON c.instrument_id = i.id
      JOIN users u ON i.owner_id = u.id
      LEFT JOIN users insp ON c.issued_by = insp.id
      WHERE c.id = $1 OR c.qr_code = $1 OR c.request_id = $1
      LIMIT 1
    `;

    const result = await db.query(certQuery, [id.trim()]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Certificate with ID '${id}' not found.`
      });
    }

    const certificate = result.rows[0];

    // RBAC: Traders can only access certificates for instruments they own
    const userRole = req.user.role.toLowerCase();
    if (userRole === 'trader' && certificate.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view certificates for instruments you own.'
      });
    }

    // Determine current statutory validity
    const today = new Date();
    const expiryDate = new Date(certificate.valid_till);
    const isExpired = today > expiryDate;

    res.json({
      success: true,
      certificate: {
        certificate_no: certificate.id,
        issue_date: certificate.issue_date,
        valid_till: certificate.valid_till,
        statutory_status: isExpired ? 'EXPIRED' : 'ACTIVE / COMPLIANT',
        instrument: {
          id: certificate.instrument_id,
          serial_number: certificate.instrument_serial,
          category: certificate.instrument_category,
          model: certificate.instrument_model,
          installed_location: certificate.installed_location
        },
        owner: {
          name: certificate.owner_name,
          entity: certificate.owner_entity,
          license_no: certificate.trader_license
        },
        inspector: {
          name: certificate.inspector_name,
          badge_id: certificate.inspector_badge,
          jurisdiction: certificate.inspector_jurisdiction
        },
        verification_details: {
          result: certificate.result,
          seal_no: certificate.seal_no,
          max_permissible_error: certificate.max_permissible_error,
          observed_error: certificate.observed_error,
          qr_code: certificate.qr_code
        },
        legal_statute: 'Issued under Section 24 of Legal Metrology Act, 2009 and Legal Metrology (General) Rules, 2011'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List certificates based on user role context
 * GET /api/certificates
 */
async function listCertificates(req, res, next) {
  try {
    const userRole = req.user.role.toLowerCase();
    const userId = req.user.id;

    let queryText = `
      SELECT 
        c.*,
        i.serial_number AS instrument_serial,
        i.category AS instrument_category,
        i.make_model AS instrument_model,
        i.location AS installed_location,
        i.owner_id,
        u.name AS owner_name,
        u.entity AS owner_entity,
        insp.name AS inspector_name,
        insp.license_no AS inspector_badge
      FROM certificates c
      JOIN instruments i ON c.instrument_id = i.id
      JOIN users u ON i.owner_id = u.id
      LEFT JOIN users insp ON c.issued_by = insp.id
    `;
    const params = [];

    if (userRole === 'trader') {
      queryText += ' WHERE i.owner_id = $1 ORDER BY c.created_at DESC';
      params.push(userId);
    } else {
      queryText += ' ORDER BY c.created_at DESC';
    }

    const result = await db.query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      certificates: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCertificateById,
  listCertificates
};
