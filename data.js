// Data Repository for Legal Metrology Online Verification System (SIH PSC26036)

const initialLegalMetrologyData = {
  // Instrument Categories & Official Legal Metrology Fee Schedule
  categories: {
    "weighbridge": {
      id: "weighbridge",
      name: "Heavy Vehicle Weighbridge (Pit / Pitless)",
      unit: "Tons",
      baseFee: 3500,
      verificationIntervalMonths: 12,
      accuracyClass: "Class III",
      mpeTolerancePct: 0.1, // Maximum Permissible Error +/- 0.1%
      description: "Static and dynamic weighbridges used at highway toll plazas, logistics hubs, and industrial yards."
    },
    "electronic_counter_scale": {
      id: "electronic_counter_scale",
      name: "Commercial Electronic Counter Scale",
      unit: "Kg",
      baseFee: 450,
      verificationIntervalMonths: 12,
      accuracyClass: "Class III",
      mpeTolerancePct: 0.05,
      description: "Retail and commercial electronic weighing instruments used in supermarkets, mandis, and trade depots."
    },
    "fuel_dispenser": {
      id: "fuel_dispenser",
      name: "Fuel Dispensing Pump (Petrol / Diesel / CNG)",
      unit: "Liters",
      baseFee: 1200,
      verificationIntervalMonths: 12,
      accuracyClass: "Class 0.5",
      mpeTolerancePct: 0.25,
      description: "Petroleum and CNG dispensing pumps at retail fuel stations."
    },
    "precision_balance": {
      id: "precision_balance",
      name: "High-Precision Laboratory & Jewellery Balance",
      unit: "Grams",
      baseFee: 800,
      verificationIntervalMonths: 12,
      accuracyClass: "Class II / Class I",
      mpeTolerancePct: 0.01,
      description: "Micro-balances used in gold trade, pharmaceuticals, and chemical testing laboratories."
    },
    "flowmeter": {
      id: "flowmeter",
      name: "Industrial Liquid Flowmeter / Pipeline Meter",
      unit: "KL/hr",
      baseFee: 2800,
      verificationIntervalMonths: 12,
      accuracyClass: "Class 0.3",
      mpeTolerancePct: 0.15,
      description: "Bulk oil terminals, milk processing plants, and chemical liquid pipelines."
    },
    "epos_scale": {
      id: "epos_scale",
      name: "ePoS-Integrated Electronic Weighing Scale",
      unit: "Kg",
      baseFee: 550,
      verificationIntervalMonths: 12,
      accuracyClass: "Class III",
      mpeTolerancePct: 0.05,
      description: "Point of Sale integrated electronic weighing instruments used in Fair Price Shops (FPS), public distribution system (PDS), and modern retail checkout counters."
    }
  },

  // Registered Users (Traders, Inspectors, Admins)
  users: [
    {
      id: "usr_201",
      name: "Rajesh Kumar",
      entityName: "Apex Logistics & Freight Hub Pvt Ltd",
      role: "trader",
      email: "rajesh@apexlogistics.in",
      phone: "+91 98765 11223",
      licenseNo: "LM/TR/2024/8892",
      address: "Plot 42, NH-48 Logistics Corridor, Gurugram, Haryana"
    },
    {
      id: "usr_202",
      name: "Suresh Patel",
      entityName: "Greenline Petroleum Retail Station",
      role: "trader",
      email: "spatel@greenlinepetro.com",
      phone: "+91 98765 44556",
      licenseNo: "LM/TR/2023/4512",
      address: "Outfall Ring Road, Sector 18, Ahmedabad, Gujarat"
    },
    {
      id: "usr_301",
      name: "Insp. Vikram Singh",
      entityName: "Legal Metrology Department - Zone 4",
      role: "inspector",
      email: "v.singh@metrology.gov.in",
      phone: "+91 94120 99887",
      badgeId: "LM-INSP-0492",
      jurisdiction: "North Zone Logistics & Industrial Parks"
    },
    {
      id: "usr_401",
      name: "Dr. Anjali Mehta",
      entityName: "Controller of Legal Metrology",
      role: "admin",
      email: "controller@metrology.gov.in",
      phone: "+91 91100 00100",
      badgeId: "LM-HQ-001",
      jurisdiction: "State Legal Metrology Headquarters"
    }
  ],

  // Registered Weighing & Measuring Instruments
  instruments: [
    {
      id: "INST-10092",
      serialNo: "WB-60T-2024-091",
      ownerId: "usr_201",
      ownerName: "Apex Logistics & Freight Hub",
      category: "weighbridge",
      makeModel: "Avery India - Model TruckMaster 60T",
      maxCapacity: "60 Tons",
      minCapacity: "200 Kg",
      accuracyClass: "Class III",
      installedLocation: "Apex Freight Terminal Gate #2, NH-48",
      geoCoordinates: "28.4595° N, 77.0266° E",
      registrationDate: "2024-01-15",
      lastVerificationDate: "2025-01-10",
      nextDueDate: "2026-01-10",
      verificationStatus: "VALID", // VALID, EXPIRING_SOON, EXPIRED, PENDING_VERIFICATION
      sealNo: "LM-SEAL-8821-A",
      certificateNo: "CERT-2025-8821"
    },
    {
      id: "INST-10093",
      serialNo: "FP-DISP-004",
      ownerId: "usr_202",
      ownerName: "Greenline Petroleum Retail",
      category: "fuel_dispenser",
      makeModel: "Gilbarco Veeder-Root Horizon 4-Hose",
      maxCapacity: "50 L/min",
      minCapacity: "2 L/min",
      accuracyClass: "Class 0.5",
      installedLocation: "Greenline Station Pump Bay #3",
      geoCoordinates: "23.0225° N, 72.5714° E",
      registrationDate: "2023-08-20",
      lastVerificationDate: "2024-09-02",
      nextDueDate: "2025-09-02",
      verificationStatus: "EXPIRING_SOON", // Expiry in 5 days!
      sealNo: "LM-SEAL-4412-B",
      certificateNo: "CERT-2024-4412"
    },
    {
      id: "INST-10094",
      serialNo: "SC-RET-559",
      ownerId: "usr_201",
      ownerName: "Apex Logistics & Freight Hub",
      category: "electronic_counter_scale",
      makeModel: "Mettler Toledo BBA231 Commercial",
      maxCapacity: "30 Kg",
      minCapacity: "100 g",
      accuracyClass: "Class III",
      installedLocation: "Warehouse Parcel Sorting Bench #1",
      geoCoordinates: "28.4595° N, 77.0266° E",
      registrationDate: "2023-03-10",
      lastVerificationDate: "2024-03-05",
      nextDueDate: "2025-03-05",
      verificationStatus: "EXPIRED", // Expired
      sealNo: "LM-SEAL-1109-C",
      certificateNo: "CERT-2024-1109"
    },
    {
      id: "INST-10095",
      serialNo: "EPOS-PDS-882",
      ownerId: "usr_201",
      ownerName: "Apex Logistics & Retail Hub",
      category: "epos_scale",
      makeModel: "Essae DS-215 ePoS Smart Scale",
      maxCapacity: "50 Kg",
      minCapacity: "50 g",
      accuracyClass: "Class III",
      installedLocation: "Fair Price Shop #14, Sector 22 Depot",
      geoCoordinates: "28.4595° N, 77.0266° E",
      registrationDate: "2024-06-01",
      lastVerificationDate: "2025-06-01",
      nextDueDate: "2026-06-01",
      verificationStatus: "VALID",
      sealNo: "LM-SEAL-9920-E",
      certificateNo: "CERT-2025-9920"
    }
  ],

  // Verification Requests & Bookings
  verificationRequests: [
    {
      id: "REQ-2026-0041",
      instrumentId: "INST-10093",
      instrumentSerial: "FP-DISP-004",
      instrumentName: "Gilbarco Veeder-Root Fuel Dispenser",
      ownerName: "Greenline Petroleum Retail",
      requestDate: "2026-08-28",
      scheduledDate: "2026-09-05",
      inspectorId: "usr_301",
      inspectorName: "Insp. Vikram Singh",
      feeAmount: 1200,
      paymentStatus: "PAID",
      requestStatus: "SCHEDULED", // PENDING, SCHEDULED, IN_PROGRESS, APPROVED, REJECTED
      notes: "Annual calibration & seal verification request before expiry."
    },
    {
      id: "REQ-2026-0042",
      instrumentId: "INST-10094",
      instrumentSerial: "SC-RET-559",
      instrumentName: "Mettler Toledo Parcel Scale",
      ownerName: "Apex Logistics & Freight Hub",
      requestDate: "2026-09-01",
      scheduledDate: "2026-09-08",
      inspectorId: "usr_301",
      inspectorName: "Insp. Vikram Singh",
      feeAmount: 450,
      paymentStatus: "PAID",
      requestStatus: "PENDING",
      notes: "Re-verification after overdue calibration notice."
    }
  ],

  // Digital Certificates Issued (Official Form VII)
  certificates: [
    {
      certificateNo: "CERT-2025-8821",
      issueDate: "2025-01-10",
      validUntil: "2026-01-10",
      instrumentId: "INST-10092",
      instrumentSerial: "WB-60T-2024-091",
      categoryName: "Heavy Vehicle Weighbridge (60 Tons)",
      ownerName: "Apex Logistics & Freight Hub Pvt Ltd",
      installedLocation: "Apex Freight Terminal Gate #2, NH-48",
      inspectorName: "Insp. Vikram Singh",
      badgeId: "LM-INSP-0492",
      sealNo: "LM-SEAL-8821-A",
      result: "PASSED",
      maxPermissibleError: "+/- 0.1%",
      observedError: "+ 0.02%",
      qrVerificationCode: "LM-GOV-VERIFY-INST-10092-CERT-2025-8821",
      status: "ACTIVE"
    },
    {
      certificateNo: "CERT-2024-4412",
      issueDate: "2024-09-02",
      validUntil: "2025-09-02",
      instrumentId: "INST-10093",
      instrumentSerial: "FP-DISP-004",
      categoryName: "Fuel Dispensing Pump",
      ownerName: "Greenline Petroleum Retail Station",
      installedLocation: "Greenline Station Pump Bay #3",
      inspectorName: "Insp. Vikram Singh",
      badgeId: "LM-INSP-0492",
      sealNo: "LM-SEAL-4412-B",
      result: "PASSED",
      maxPermissibleError: "+/- 0.25%",
      observedError: "- 0.08%",
      qrVerificationCode: "LM-GOV-VERIFY-INST-10093-CERT-2024-4412",
      status: "EXPIRING_SOON"
    }
  ],

  // Automated System Alerts & Reminders
  reminders: [
    {
      id: "REM-801",
      instrumentId: "INST-10093",
      ownerName: "Greenline Petroleum Retail Station",
      serialNo: "FP-DISP-004",
      daysToExpiry: 5,
      type: "EXPIRING_WARNING",
      dueDate: "2025-09-02",
      message: "URGENT: Fuel Dispenser FP-DISP-004 calibration expires in 5 days! Schedule verification to avoid statutory penalty under Legal Metrology Act.",
      status: "ACTION_REQUIRED"
    },
    {
      id: "REM-802",
      instrumentId: "INST-10094",
      ownerName: "Apex Logistics & Freight Hub",
      serialNo: "SC-RET-559",
      daysToExpiry: -180,
      type: "OVERDUE_ALERT",
      dueDate: "2025-03-05",
      message: "CRITICAL: Commercial Scale SC-RET-559 calibration has EXPIRED. Continued commercial operation without reverification attracts seizure & Section 25 fine.",
      status: "OVERDUE"
    }
  ]
};
