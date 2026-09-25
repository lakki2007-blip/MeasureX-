// Instruments Controller - Registration and Inventory Listing
const db = require('../config/db');

const VALID_CATEGORIES = [
  'weighbridge',
  'electronic_counter_scale',
  'epos_scale',
  'fuel_dispenser',
  'precision_balance',
  'flowmeter'
];

/**
 * Register a new instrument (Trader only or Admin)
 * POST /api/instruments
 */
async function registerInstrument(req, res, next) {
  try {
    const {
      category,
      serial_number,
      location,
      make_model,
      max_capacity,
      min_capacity,
      accuracy_class
    } = req.body;

    if (!category || !serial_number || !location) {
      return res.status(400).json({
        success: false,
        message: 'Category, serial_number, and location are required fields.'
      });
    }

    const normalizedCategory = category.toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Valid categories are: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Check if serial_number already registered
    const existing = await db.query('SELECT * FROM instruments WHERE serial_number = $1', [serial_number.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `An instrument with serial number '${serial_number}' is already registered.`
      });
    }

    const instrumentId = `INST-${Date.now().toString().slice(-5)}`;
    const ownerId = req.user.id;
    const initialStatus = 'valid';
    const sealNo = 'PENDING';

    const insertQuery = `
      INSERT INTO instruments (
        id, category, serial_number, location, owner_id, status,
        make_model, max_capacity, min_capacity, accuracy_class, seal_no
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      instrumentId,
      normalizedCategory,
      serial_number.trim(),
      location.trim(),
      ownerId,
      initialStatus,
      make_model || 'Standard Metrology Equipment',
      max_capacity || 'N/A',
      min_capacity || 'N/A',
      accuracy_class || 'Class III',
      sealNo
    ]);

    const createdInstrument = result.rows[0];

    res.status(201).json({
      success: true,
      message: `Instrument '${createdInstrument.serial_number}' registered successfully.`,
      instrument: createdInstrument
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List instruments based on user role context
 * Traders see their own; Admins and Inspectors see all.
 * GET /api/instruments
 */
async function getInstruments(req, res, next) {
  try {
    const userRole = req.user.role.toLowerCase();
    const userId = req.user.id;

    let queryText = `
      SELECT 
        i.*,
        u.name AS owner_name,
        u.entity AS owner_entity,
        u.email AS owner_email,
        u.phone AS owner_phone
      FROM instruments i
      LEFT JOIN users u ON i.owner_id = u.id
    `;
    const params = [];

    if (userRole === 'trader') {
      queryText += ' WHERE i.owner_id = $1 ORDER BY i.created_at DESC';
      params.push(userId);
    } else {
      queryText += ' ORDER BY i.created_at DESC';
    }

    const result = await db.query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      role: userRole,
      instruments: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single instrument by ID
 * GET /api/instruments/:id
 */
async function getInstrumentById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT i.*, u.name AS owner_name, u.entity AS owner_entity 
       FROM instruments i 
       LEFT JOIN users u ON i.owner_id = u.id 
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Instrument with ID '${id}' not found.`
      });
    }

    const instrument = result.rows[0];

    // RBAC: If trader, check ownership
    if (req.user.role.toLowerCase() === 'trader' && instrument.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this instrument.'
      });
    }

    res.json({
      success: true,
      instrument
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerInstrument,
  getInstruments,
  getInstrumentById
};
