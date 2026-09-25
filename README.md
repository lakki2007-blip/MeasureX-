# MeasureX! - Legal Metrology Online Verification Portal (Backend API)

An enterprise-grade, RESTful API backend for **MeasureX!** — a Legal Metrology Online Verification Portal built with **Node.js**, **Express.js**, and **PostgreSQL** (supporting both **Prisma ORM** and standard **pg** queries).

---

## 🏛️ System Architecture & Highlights

- **JWT-Based Authentication & RBAC**: Strict Role-Based Access Control enforcing distinct permissions for **Traders**, **Inspectors**, and **Admins**.
- **Dual Database Engine**:
  - Full **PostgreSQL** schema (`src/db/schema.sql`) and **Prisma ORM** schema (`prisma/schema.prisma`).
  - Automatic table creation and database seed loading (`src/db/seed.sql` & `prisma/seed.js`).
  - Resilient database adapter that seamlessly connects to PostgreSQL, or runs persistently in memory if PostgreSQL daemon is offline, ensuring zero-downtime development and testing.
- **Statutory Legal Metrology Fee Engine**: Automatic fee calculation based on instrument category under Legal Metrology Rules.
- **Amazon Delivery-Style 4-Step Status Tracker**: Real-time progress calculation (`25%`, `50%`, `75%`, `100%`) for verification applications.
- **Inspector Digital Test Workbench**: Automated Maximum Permissible Error (MPE) tolerance checking, digital stamping, and instant Form VII certificate generation.
- **Public QR Code Access**: Unauthenticated external endpoint allowing the general public and enforcement officers to verify physical instruments on site.

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | Trader | Inspector | Admin | Public |
| :--- | :---: | :---: | :---: | :---: |
| Register & Login (`/api/auth/*`) | ✅ | ✅ | ✅ | ❌ |
| Register Instrument (`POST /api/instruments`) | ✅ | ❌ | ✅ | ❌ |
| List Instruments (`GET /api/instruments`) | Own Only | All | All | ❌ |
| Book Verification (`POST /api/requests`) | ✅ (Own) | ❌ | ✅ | ❌ |
| List Booking Requests (`GET /api/requests`) | Own Only | Assigned/Queue | All | ❌ |
| Assign Field Inspector (`PUT /api/requests/:id/assign`) | ❌ | ❌ | ✅ | ❌ |
| Live 4-Step Tracker (`GET /api/requests/track/:id`) | ✅ | ✅ | ✅ | ✅ |
| Submit Test Readings (`POST /api/inspector/testbench`) | ❌ | ✅ | ✅ | ❌ |
| Form VII Certificates (`GET /api/certificates/:id`) | Own Only | All | All | ❌ |
| Public QR Code Scan (`GET /api/public/access/:id`) | ✅ | ✅ | ✅ | ✅ |

---

## 🗄️ Database Schema & Models

### 1. `users`
- `id`: Primary Key (`VARCHAR(100)`)
- `name`: User full name
- `entity`: Business entity or departmental division
- `role`: Enum (`'trader'`, `'inspector'`, `'admin'`)
- `email`: Unique email address
- `password_hash`: Salted bcrypt hash (cost 10)
- `phone`: Mobile number
- `license_no`: Trade license or Inspector badge ID
- `created_at` / `updated_at`: Timestamps

### 2. `instruments`
- `id`: Primary Key (e.g. `INST-10092`)
- `category`: Enum (`'weighbridge'`, `'electronic_counter_scale'`, `'epos_scale'`, `'fuel_dispenser'`, `'precision_balance'`, `'flowmeter'`)
- `serial_number`: Unique serial number
- `location`: Facility address & GPS coordinates
- `owner_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `status`: Enum (`'valid'`, `'expiring'`, `'expired'`, `'pending_verification'`)
- `make_model`: Manufacturer make and model
- `max_capacity` / `min_capacity`: Rated capacity
- `accuracy_class`: Class I, Class II, Class III, or Class 0.5
- `last_verification_date` / `next_due_date`: Calibration dates
- `seal_no`: Lead security seal serial tag

### 3. `verification_requests`
- `id`: Primary Key (e.g. `REQ-2026-0041`)
- `instrument_id`: Foreign key referencing `instruments(id)`
- `trader_id`: Foreign key referencing `users(id)`
- `inspector_id`: Foreign key referencing `users(id)` (Nullable)
- `preferred_date`: Inspection slot date
- `fee_amount`: Calculated statutory fee (`NUMERIC(10, 2)`)
- `status`: Enum (`'pending'`, `'assigned'`, `'completed'`, `'rejected'`)
- `notes`: Operational constraints or directions

### 4. `certificates` (Form VII)
- `id`: Primary Key (e.g. `CERT-2025-8821`)
- `instrument_id`: Foreign key referencing `instruments(id)`
- `request_id`: Foreign key referencing `verification_requests(id)` (Unique)
- `issue_date`: Date issued
- `valid_till`: Expiry date (typically 12 months)
- `issued_by`: Foreign key referencing `users(id)` (Inspector)
- `seal_no`: Official security seal serial tag
- `qr_code`: Unique QR string (`LM-GOV-VERIFY-INST-XXXX-CERT-XXXX`)
- `result`: Outcome (`'PASSED'`)
- `max_permissible_error`: Statutory limit (e.g. `'+/- 0.1%'`)
- `observed_error`: Maximum observed load error (e.g. `'+ 0.02%'`)

---

## 💰 Statutory Metrology Fee Schedule

When a trader books a verification request (`POST /api/requests`), the backend calculates the statutory fee automatically:

| Instrument Category | Statutory Fee (INR) | Calibration Interval | Standard MPE Tolerance |
| :--- | :---: | :---: | :---: |
| `weighbridge` | **₹3,500** | 12 Months | $\pm 0.10\%$ |
| `electronic_counter_scale` | **₹500** | 12 Months | $\pm 0.05\%$ |
| `epos_scale` | **₹800** | 12 Months | $\pm 0.05\%$ |
| `fuel_dispenser` | **₹2,000** | 12 Months | $\pm 0.25\%$ |
| `precision_balance` | **₹1,000** | 12 Months | $\pm 0.01\%$ |
| `flowmeter` | **₹2,800** | 12 Months | $\pm 0.15\%$ |

---

## 🚚 Amazon-Style 4-Step Status Tracker (`GET /api/requests/track/:id`)

Calculates step-by-step progress from application submission to official stamping:

- **Step 1: Application Submitted & Fee Paid** (`True` if request exists in database).
- **Step 2: Inspector Assigned** (`True` if `inspector_id` is NOT null).
- **Step 3: Field Verification & MPE Testing** (`True` if inspector is assigned and test bench data is in progress or completed).
- **Step 4: Certificate Issued & Security Seal Attached** (`True` if a related certificate record exists).

---

## 📡 API Endpoints Documentation

### 1. Authentication
- `POST /api/auth/register`
  - Body: `{ name, entity, role, email, password, phone, license_no }`
  - Returns: JWT token and sanitized user profile.
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: JWT token (containing `id`, `role`, `email`, `name`, `entity`).
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Current authenticated user details.

### 2. Instruments
- `POST /api/instruments` *(Trader or Admin)*
  - Body: `{ category, serial_number, location, make_model, max_capacity, min_capacity, accuracy_class }`
  - Registers new instrument owned by authenticated trader.
- `GET /api/instruments` *(Authenticated)*
  - Returns: Traders see only their own instruments; Inspectors and Admins see all.
- `GET /api/instruments/:id` *(Authenticated)*
  - Returns: Instrument details.

### 3. Verification & Tracking
- `POST /api/requests` *(Trader or Admin)*
  - Body: `{ instrument_id, preferred_date, notes }`
  - Enforces fee calculation rule based on category and creates request.
- `GET /api/requests` *(Authenticated)*
  - Returns: Scoped requests according to user role context.
- `PUT /api/requests/:id/assign` *(Admin only)*
  - Body: `{ inspector_id }`
  - Assigns an inspector and updates status to `'assigned'`.
- `GET /api/requests/track/:id` *(Public or Authenticated)*
  - Parameter: Request ID (e.g. `REQ-2026-0041`), Serial Number, or Certificate ID.
  - Returns: 4-step status timeline, percentage, and audit log.

### 4. Inspector Digital Test Workbench
- `POST /api/inspector/testbench` *(Inspector or Admin)*
  - Body: `{ request_id, zero_load_error, half_load_error, max_load_error, seal_no, validity_months }`
  - Evaluates readings against category MPE tolerance.
  - If $\le \text{MPE}$: Sets instrument status to `'valid'`, marks request `'completed'`, and generates Form VII Certificate record with QR code.
  - If $> \text{MPE}$: Sets instrument status to `'expired'`, marks request `'rejected'`, and issues statutory rectification notice.
- `GET /api/inspector/tasks` *(Inspector or Admin)*
  - Returns: Pending inspections within inspector's jurisdiction.

### 5. Certificates & Public Access
- `GET /api/certificates/:id` *(Authenticated)*
  - Returns: Official Form VII Certificate details for viewing and printing.
- `GET /api/public/access/:id` *(Public Unauthenticated)*
  - Parameter: QR verification code string or certificate serial.
  - Returns: Public authenticity verification, statutory compliance status, seal number, and Legal Metrology Act notice.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Configure Environment (`.env`)
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=measurex_legal_metrology_jwt_secret_key_2026_secure
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/measurex_db
```

### 3. Running the Server
```bash
# Production / Standard Run:
npm start

# Or directly:
node server.js
```
The server will be available at:
- **API URL**: `http://localhost:5000/api`
- **Frontend Portal**: `http://localhost:5000/`

### 4. Running PostgreSQL Migrations (Optional)
```bash
# Using Prisma:
npx prisma db push
node prisma/seed.js

# Using standard SQL:
psql -U postgres -d measurex_db -f src/db/schema.sql
psql -U postgres -d measurex_db -f src/db/seed.sql
```

### 5. Running Automated Test Suite
```bash
npm test
```
Executes all 22 integration tests verifying JWT auth, RBAC permissions, category fee calculation, MPE tolerance evaluation, and status tracking.

---

## 🔑 Pre-Seeded Demo Credentials

All test accounts use the password: `Password@123`

| Role | Email | Name & Organization |
| :--- | :--- | :--- |
| **Trader** | `rajesh@apexlogistics.in` | Rajesh Kumar (Apex Logistics & Freight Hub) |
| **Trader** | `spatel@greenlinepetro.com` | Suresh Patel (Greenline Petroleum Retail Station) |
| **Inspector** | `v.singh@metrology.gov.in` | Insp. Vikram Singh (Legal Metrology Dept Zone 4) |
| **Admin** | `controller@metrology.gov.in` | Dr. Anjali Mehta (Controller of Legal Metrology) |
