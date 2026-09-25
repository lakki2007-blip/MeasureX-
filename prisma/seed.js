// Prisma Database Seed Script
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma seeding for MeasureX!...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Upsert Users
  const trader1 = await prisma.user.upsert({
    where: { email: 'rajesh@apexlogistics.in' },
    update: {},
    create: {
      id: 'usr_201',
      name: 'Rajesh Kumar',
      entity: 'Apex Logistics & Freight Hub Pvt Ltd',
      role: 'trader',
      email: 'rajesh@apexlogistics.in',
      password_hash: passwordHash,
      phone: '+91 98765 11223',
      license_no: 'LM/TR/2024/8892'
    }
  });

  const trader2 = await prisma.user.upsert({
    where: { email: 'spatel@greenlinepetro.com' },
    update: {},
    create: {
      id: 'usr_202',
      name: 'Suresh Patel',
      entity: 'Greenline Petroleum Retail Station',
      role: 'trader',
      email: 'spatel@greenlinepetro.com',
      password_hash: passwordHash,
      phone: '+91 98765 44556',
      license_no: 'LM/TR/2023/4512'
    }
  });

  const inspector = await prisma.user.upsert({
    where: { email: 'v.singh@metrology.gov.in' },
    update: {},
    create: {
      id: 'usr_301',
      name: 'Insp. Vikram Singh',
      entity: 'Legal Metrology Department - Zone 4',
      role: 'inspector',
      email: 'v.singh@metrology.gov.in',
      password_hash: passwordHash,
      phone: '+91 94120 99887',
      license_no: 'LM-INSP-0492'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'controller@metrology.gov.in' },
    update: {},
    create: {
      id: 'usr_401',
      name: 'Dr. Anjali Mehta',
      entity: 'Controller of Legal Metrology',
      role: 'admin',
      email: 'controller@metrology.gov.in',
      password_hash: passwordHash,
      phone: '+91 91100 00100',
      license_no: 'LM-HQ-001'
    }
  });

  console.log('✅ Users seeded successfully.');

  // 2. Upsert Instruments
  const inst1 = await prisma.instrument.upsert({
    where: { serial_number: 'WB-60T-2024-091' },
    update: {},
    create: {
      id: 'INST-10092',
      category: 'weighbridge',
      serial_number: 'WB-60T-2024-091',
      location: 'Apex Freight Terminal Gate #2, NH-48, Gurugram',
      owner_id: trader1.id,
      status: 'valid',
      make_model: 'Avery India - Model TruckMaster 60T',
      max_capacity: '60 Tons',
      min_capacity: '200 Kg',
      accuracy_class: 'Class III',
      last_verification_date: new Date('2025-01-10'),
      next_due_date: new Date('2026-01-10'),
      seal_no: 'LM-SEAL-8821-A'
    }
  });

  const inst2 = await prisma.instrument.upsert({
    where: { serial_number: 'FP-DISP-004' },
    update: {},
    create: {
      id: 'INST-10093',
      category: 'fuel_dispenser',
      serial_number: 'FP-DISP-004',
      location: 'Greenline Station Pump Bay #3, Ahmedabad',
      owner_id: trader2.id,
      status: 'expiring',
      make_model: 'Gilbarco Veeder-Root Horizon 4-Hose',
      max_capacity: '50 L/min',
      min_capacity: '2 L/min',
      accuracy_class: 'Class 0.5',
      last_verification_date: new Date('2024-09-02'),
      next_due_date: new Date('2025-09-02'),
      seal_no: 'LM-SEAL-4412-B'
    }
  });

  console.log('✅ Instruments seeded successfully.');

  // 3. Upsert Verification Request
  const req1 = await prisma.verificationRequest.upsert({
    where: { id: 'REQ-2026-0040' },
    update: {},
    create: {
      id: 'REQ-2026-0040',
      instrument_id: inst1.id,
      trader_id: trader1.id,
      inspector_id: inspector.id,
      preferred_date: new Date('2025-01-10'),
      fee_amount: 3500.00,
      status: 'completed',
      notes: 'Initial calibration & commissioning stamping completed.'
    }
  });

  // 4. Upsert Certificate
  await prisma.certificate.upsert({
    where: { request_id: req1.id },
    update: {},
    create: {
      id: 'CERT-2025-8821',
      instrument_id: inst1.id,
      request_id: req1.id,
      issue_date: new Date('2025-01-10'),
      valid_till: new Date('2026-01-10'),
      issued_by: inspector.id,
      seal_no: 'LM-SEAL-8821-A',
      qr_code: 'LM-GOV-VERIFY-INST-10092-CERT-2025-8821',
      result: 'PASSED',
      max_permissible_error: '+/- 0.1%',
      observed_error: '+ 0.02%'
    }
  });

  console.log('✅ Certificates seeded successfully.');
  console.log('🎉 Prisma seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during Prisma seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
