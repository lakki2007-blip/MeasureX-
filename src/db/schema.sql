-- ============================================================================
-- MeasureX! - Legal Metrology Online Verification Portal
-- PostgreSQL Database Schema Setup (DDL)
-- ============================================================================

-- Create ENUM types if they do not exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('trader', 'inspector', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instrument_category AS ENUM (
        'weighbridge',
        'electronic_counter_scale',
        'epos_scale',
        'fuel_dispenser',
        'precision_balance',
        'flowmeter'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instrument_status AS ENUM ('valid', 'expiring', 'expired', 'pending_verification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'assigned', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'trader',
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    license_no VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. Instruments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instruments (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    location TEXT NOT NULL,
    owner_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'valid',
    make_model VARCHAR(255),
    max_capacity VARCHAR(100),
    min_capacity VARCHAR(100),
    accuracy_class VARCHAR(50),
    last_verification_date DATE,
    next_due_date DATE,
    seal_no VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instruments_owner ON instruments(owner_id);
CREATE INDEX IF NOT EXISTS idx_instruments_serial ON instruments(serial_number);
CREATE INDEX IF NOT EXISTS idx_instruments_status ON instruments(status);
CREATE INDEX IF NOT EXISTS idx_instruments_category ON instruments(category);

-- ----------------------------------------------------------------------------
-- 3. Verification Requests Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_requests (
    id VARCHAR(100) PRIMARY KEY,
    instrument_id VARCHAR(100) NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    trader_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inspector_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    preferred_date DATE NOT NULL,
    fee_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_instrument ON verification_requests(instrument_id);
CREATE INDEX IF NOT EXISTS idx_requests_trader ON verification_requests(trader_id);
CREATE INDEX IF NOT EXISTS idx_requests_inspector ON verification_requests(inspector_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON verification_requests(status);

-- ----------------------------------------------------------------------------
-- 4. Certificates Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(100) PRIMARY KEY,
    instrument_id VARCHAR(100) NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    request_id VARCHAR(100) UNIQUE NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_till DATE NOT NULL,
    issued_by VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seal_no VARCHAR(100) NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    result VARCHAR(50) NOT NULL DEFAULT 'PASSED',
    max_permissible_error VARCHAR(50),
    observed_error VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_instrument ON certificates(instrument_id);
CREATE INDEX IF NOT EXISTS idx_certificates_request ON certificates(request_id);
CREATE INDEX IF NOT EXISTS idx_certificates_qr ON certificates(qr_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_by ON certificates(issued_by);
