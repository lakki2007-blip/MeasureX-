// Statutory Legal Metrology Fee Schedule and MPE Tolerances
// Based on Legal Metrology (General) Rules

const FEE_SCHEDULE = {
  weighbridge: 3500,
  electronic_counter_scale: 500,
  epos_scale: 800,
  fuel_dispenser: 2000,
  precision_balance: 1000,
  flowmeter: 2800
};

const MPE_TOLERANCES = {
  weighbridge: 0.10, // +/- 0.10%
  electronic_counter_scale: 0.05, // +/- 0.05%
  epos_scale: 0.05, // +/- 0.05%
  fuel_dispenser: 0.25, // +/- 0.25%
  precision_balance: 0.01, // +/- 0.01%
  flowmeter: 0.15 // +/- 0.15%
};

/**
 * Calculates statutory legal metrology fee based on category
 * @param {string} category 
 * @returns {number} fee in INR
 */
function calculateFee(category) {
  const normalized = (category || '').toLowerCase().trim();
  if (FEE_SCHEDULE[normalized] !== undefined) {
    return FEE_SCHEDULE[normalized];
  }
  return 1000; // default fallback fee
}

/**
 * Gets Maximum Permissible Error tolerance percentage for instrument category
 * @param {string} category 
 * @returns {number} MPE percentage
 */
function getMpeTolerance(category) {
  const normalized = (category || '').toLowerCase().trim();
  if (MPE_TOLERANCES[normalized] !== undefined) {
    return MPE_TOLERANCES[normalized];
  }
  return 0.10;
}

module.exports = {
  FEE_SCHEDULE,
  MPE_TOLERANCES,
  calculateFee,
  getMpeTolerance
};
