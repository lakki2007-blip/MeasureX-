-- ============================================================================
-- MeasureX! - Legal Metrology Online Verification Portal
-- PostgreSQL Database Seed Data
-- ============================================================================

-- Clear existing data (in dependency order)
DELETE FROM certificates;
DELETE FROM verification_requests;
DELETE FROM instruments;
DELETE FROM users;

-- 1. Insert Users (Password for all: 'Password@123')
INSERT INTO users (id, name, entity, role, email, password_hash, phone, license_no) VALUES
('usr_201', 'Rajesh Kumar', 'Apex Logistics & Freight Hub Pvt Ltd', 'trader', 'rajesh@apexlogistics.in', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 98765 11223', 'LM/TR/2024/8892'),
('usr_202', 'Suresh Patel', 'Greenline Petroleum Retail Station', 'trader', 'spatel@greenlinepetro.com', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 98765 44556', 'LM/TR/2023/4512'),
('usr_301', 'Insp. Vikram Singh', 'Legal Metrology Department - Zone 4', 'inspector', 'v.singh@metrology.gov.in', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 94120 99887', 'LM-INSP-0492'),
('usr_401', 'Dr. Anjali Mehta', 'Controller of Legal Metrology', 'admin', 'controller@metrology.gov.in', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 91100 00100', 'LM-HQ-001'),
('usr_demo_trader', 'Demo Trader', 'National Freight Logistics Ltd', 'trader', 'trader@measurex.gov', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 98000 00001', 'LM/TR/2026/DEMO'),
('usr_demo_inspector', 'Demo Inspector', 'Zonal Metrology Inspection Unit', 'inspector', 'inspector@measurex.gov', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 98000 00002', 'LM-INSP-DEMO'),
('usr_demo_admin', 'Demo Metrology Admin', 'Directorate of Legal Metrology', 'admin', 'admin@measurex.gov', '$2b$10$SZ1d7wSQGkH91JhxP3GYKel7cuvRH4XbO4lFZRdPqOGOw.gEUVNlO', '+91 98000 00003', 'LM-ADMIN-DEMO')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Instruments
INSERT INTO instruments (id, category, serial_number, location, owner_id, status, make_model, max_capacity, min_capacity, accuracy_class, last_verification_date, next_due_date, seal_no) VALUES
('INST-10092', 'weighbridge', 'WB-60T-2024-091', 'Apex Freight Terminal Gate #2, NH-48, Gurugram', 'usr_201', 'valid', 'Avery India - Model TruckMaster 60T', '60 Tons', '200 Kg', 'Class III', '2025-01-10', '2026-01-10', 'LM-SEAL-8821-A'),
('INST-10093', 'fuel_dispenser', 'FP-DISP-004', 'Greenline Station Pump Bay #3, Ahmedabad', 'usr_202', 'expiring', 'Gilbarco Veeder-Root Horizon 4-Hose', '50 L/min', '2 L/min', 'Class 0.5', '2024-09-02', '2025-09-02', 'LM-SEAL-4412-B'),
('INST-10094', 'electronic_counter_scale', 'SC-RET-559', 'Warehouse Parcel Sorting Bench #1, Gurugram', 'usr_201', 'expired', 'Mettler Toledo BBA231 Commercial', '30 Kg', '100 g', 'Class III', '2024-03-05', '2025-03-05', 'LM-SEAL-1109-C'),
('INST-10095', 'epos_scale', 'EPOS-PDS-882', 'Fair Price Shop #14, Sector 22 Depot, Gurugram', 'usr_201', 'valid', 'Essae DS-215 ePoS Smart Scale', '50 Kg', '50 g', 'Class III', '2025-06-01', '2026-06-01', 'LM-SEAL-9920-E')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Verification Requests
INSERT INTO verification_requests (id, instrument_id, trader_id, inspector_id, preferred_date, fee_amount, status, notes) VALUES
('REQ-2026-0040', 'INST-10092', 'usr_201', 'usr_301', '2025-01-10', 3500.00, 'completed', 'Initial calibration & commissioning stamping completed.'),
('REQ-2026-0041', 'INST-10093', 'usr_202', 'usr_301', '2026-09-05', 2000.00, 'assigned', 'Annual calibration & seal verification request before expiry.'),
('REQ-2026-0042', 'INST-10094', 'usr_201', NULL, '2026-09-08', 500.00, 'pending', 'Re-verification after overdue calibration notice.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Certificates
INSERT INTO certificates (id, instrument_id, request_id, issue_date, valid_till, issued_by, seal_no, qr_code, result, max_permissible_error, observed_error) VALUES
('CERT-2025-8821', 'INST-10092', 'REQ-2026-0040', '2025-01-10', '2026-01-10', 'usr_301', 'LM-SEAL-8821-A', 'LM-GOV-VERIFY-INST-10092-CERT-2025-8821', 'PASSED', '+/- 0.1%', '+ 0.02%')
ON CONFLICT (id) DO NOTHING;
