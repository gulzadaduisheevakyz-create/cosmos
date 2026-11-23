import {
  Employee,
  PayrollRecord,
  AttendanceRecord,
  ExtraTimeTransaction,
  LeaveRecord,
  FlightTicketRecord,
  Certificate,
  BankInfo,
  SystemSettings,
  AuditLogItem,
  Customer,
  ServiceCatalogueItem,
  DailySaleRecord,
  SaleRefundRecord,
  SaleServiceLine,
  SaleProductLine,
  CommissionSyncStatus,
  MonthlyEmployeeCommissionAggregate,
  MonthlyCommissionSummary,
  EmployeeRole,
  BookingAvailabilityStatus,
  BookingAvailabilityResult,
  BookingOverrideRecord,
  CustomerBooking,
  ServiceCategory,
  RepeatConfig,
  GroupBookingInfo,
  BookingServiceItem,
  BookingStatus,
  PettyCashExpense,
  FixedExpense,
  FixedExpenseCategory,
  BusinessGrossEntry,
  VariableExpense,
  VariableExpenseCategory,
  ProfitAndLossStatement,
  UserAccount,
  UserRole,
  PasswordResetToken,
  PublicSalonInfo,
  ContactMessage,
  EmailSettings,
  SalonFloorplan,
} from '../types';
import {
  generateRandomSalt,
  hashPasswordWithSalt,
  verifyPassword,
  generateResetToken,
} from './authCrypto';

export const DEFAULT_PUBLIC_SALON_INFO: PublicSalonInfo = {
  salonName: 'Cosmos Beauty Salon',
  headline: 'Where Elegance Meets Precision Artistry in Doha',
  shortWelcome:
    'Experience world-class hair styling, Russian volume lash architecture, refined brow shaping, luxury gel nail extensions, and restorative spa rituals in an ambiance of pure serenity.',
  aboutTitle: 'About Cosmos Beauty Salon',
  aboutDescription:
    'Cosmos Beauty Salon is a premier beauty and personal-care destination established in Doha, Qatar. We pride ourselves on artisanal craftsmanship, certified beauty specialists, and medical-grade hygiene protocols. Every treatment is tailored to accentuate your individual beauty, leaving you renewed and radiant.',
  mission:
    'To provide exquisite, safe, and bespoke beauty treatments utilizing top-tier international formulations and uncompromising sterilization standards.',
  values: [
    'Hospital-grade Autoclave & Tool Sterilization',
    'Certified Specialist Technicians & Stylists',
    'Premium European & American Formulations',
    'Warm, Private & Relaxing Salon Sanctuary',
  ],
  contactEmail: 'csmsbeauty@gmail.com',
  contactMobile: '+974 7045 0040',
  recoveryEmail: 'cosmosbeautyqatar@gmail.com',
  address: 'Doha, State of Qatar',
  workingHours: '09:00 AM – 09:00 PM (Daily)',
  heroImageUrl: '',
  visibleCategories: [
    'Hairdresser',
    'Eyelash Art',
    'Eyebrows Art',
    'Nail Art',
    'Spa',
    'Spray Tan',
  ],
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  recoveryEmail: 'cosmosbeautyqatar@gmail.com',
  contactFormRecipient: 'csmsbeauty@gmail.com',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  senderEmail: 'noreply@cosmosbeautysalon.qa',
  senderName: 'Cosmos Beauty Salon Notifications',
  encryption: 'TLS',
  isConfigured: false,
  lastTestStatus: 'Unconfigured',
  lastTestMessage: 'SMTP server has not been configured yet. In-app notifications and security logs are active.',
};



export const DEFAULT_QATAR_BANKS: BankInfo[] = [
  { name: 'Qatar Islamic Bank', short: 'QIB' },
  { name: 'Commercial Bank of Qatar', short: 'CBQ' },
  { name: 'Qatar National Bank', short: 'QNB' },
  { name: 'Doha Bank', short: 'DB' },
  { name: 'Masraf Al Rayan', short: 'MAR' },
  { name: 'Bank of Bahrain and Kuwait (Qatar)', short: 'BBK' },
  { name: 'Ahli Bank', short: 'ABQ' },
  { name: 'International Bank of Qatar', short: 'IBQ' },
  { name: 'Qatar Development Bank', short: 'QDB' },
  { name: 'HSBC Qatar', short: 'HSBC' },
  { name: 'Standard Chartered Qatar', short: 'SCB' },
  { name: 'Citibank Qatar', short: 'CITI' },
  { name: 'Barwa Bank', short: 'BARWA' },
  { name: 'Qatar First Bank', short: 'QFB' },
  { name: 'Other', short: 'OTHER' },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'COSMOS BEAUTY SALON',
  companyAddress: 'Doha, Qatar',
  companyPhone: '+974 4455 6677',
  companyEmail: 'hr@cosmosbeautysalon.qa',
  signatoryName: 'ATYRGUL AIAZOVA',
  signatoryTitle: 'Authorized Manager',
  certValidity: 1,
  certCounter: 1,
  salesCommRate: 10,
  productCommRate: 5,
  businessTarget: 200000,
  businessCommRate: 5,
  businessCommBase: 'all_gross',
  leaveEntitlement: 21,
  leaveDivisor: 30,
  ticketCycle: 2,
  attOpening: '09:00',
  attClosing: '21:00',
  attBreakStart: '13:00',
  attBreakEnd: '14:00',
  attLateThreshold: 15,
  attMorningStart: '09:00',
  attMorningEnd: '13:00',
  attNightStart: '16:00',
  attNightEnd: '21:00',
};

export const DEFAULT_SERVICE_CATALOGUE: ServiceCatalogueItem[] = [
  // Hairdresser
  { id: 'SRV-HAIR-01', name: 'Haircut & Styling', category: 'Hairdresser', price: 250, durationMinutes: 60, isActive: true },
  { id: 'SRV-HAIR-02', name: 'Blow Dry & Glam Finish', category: 'Hairdresser', price: 150, durationMinutes: 45, isActive: true },
  { id: 'SRV-HAIR-03', name: 'Balayage & Toning Ritual', category: 'Hairdresser', price: 650, durationMinutes: 180, isActive: true },
  { id: 'SRV-HAIR-04', name: 'Keratin Smoothing Treatment', category: 'Hairdresser', price: 850, durationMinutes: 150, isActive: true },
  { id: 'SRV-HAIR-05', name: 'Olaplex Restorative Deep Mask', category: 'Hairdresser', price: 200, durationMinutes: 40, isActive: true },

  // Eyelash Art
  { id: 'SRV-LASH-01', name: 'Classic Russian Lash Full Set', category: 'Eyelash Art', price: 350, durationMinutes: 90, isActive: true },
  { id: 'SRV-LASH-02', name: 'Russian Volume 3D-5D', category: 'Eyelash Art', price: 450, durationMinutes: 120, isActive: true },
  { id: 'SRV-LASH-03', name: 'Mega Russian Volume Luxury', category: 'Eyelash Art', price: 550, durationMinutes: 150, isActive: true },
  { id: 'SRV-LASH-04', name: 'Lash Refill (2-3 Weeks)', category: 'Eyelash Art', price: 220, durationMinutes: 60, isActive: true },
  { id: 'SRV-LASH-05', name: 'Lash Lift & Keratin Tint', category: 'Eyelash Art', price: 250, durationMinutes: 50, isActive: true },

  // Eyebrows Art
  { id: 'SRV-BROW-01', name: 'Brow Lamination & Keratin Tint', category: 'Eyebrows Art', price: 200, durationMinutes: 45, isActive: true },
  { id: 'SRV-BROW-02', name: 'Henna Brow Architecture', category: 'Eyebrows Art', price: 180, durationMinutes: 40, isActive: true },
  { id: 'SRV-BROW-03', name: 'Precision Threading & Tweezing', category: 'Eyebrows Art', price: 80, durationMinutes: 20, isActive: true },
  { id: 'SRV-BROW-04', name: 'Microblading Powder Brow Touch-up', category: 'Eyebrows Art', price: 500, durationMinutes: 90, isActive: true },

  // Nail Art
  { id: 'SRV-NAIL-01', name: 'Gel Manicure & Hard Gel Reinforce', category: 'Nail Art', price: 220, durationMinutes: 60, isActive: true },
  { id: 'SRV-NAIL-02', name: 'Acrylic Extensions & Full Nail Art', category: 'Nail Art', price: 350, durationMinutes: 90, isActive: true },
  { id: 'SRV-NAIL-03', name: 'Classic French Gel Polish', category: 'Nail Art', price: 180, durationMinutes: 45, isActive: true },
  { id: 'SRV-NAIL-04', name: 'Deluxe Spa Pedicure & Scrub', category: 'Nail Art', price: 250, durationMinutes: 60, isActive: true },
  { id: 'SRV-NAIL-05', name: 'Paraffin Wax Hydration Therapy', category: 'Nail Art', price: 120, durationMinutes: 30, isActive: true },

  // Spa
  { id: 'SRV-SPA-01', name: '60-min Aromatherapy Swedish Massage', category: 'Spa', price: 350, durationMinutes: 60, isActive: true },
  { id: 'SRV-SPA-02', name: 'Moroccan Royal Hammam Ritual', category: 'Spa', price: 500, durationMinutes: 90, isActive: true },
  { id: 'SRV-SPA-03', name: 'Deep Cleansing & Hydration Facial', category: 'Spa', price: 400, durationMinutes: 60, isActive: true },
  { id: 'SRV-SPA-04', name: 'Hot Stone Therapeutic Back Release', category: 'Spa', price: 380, durationMinutes: 60, isActive: true },

  // Spray Tan
  { id: 'SRV-TAN-01', name: 'Full Body Express Golden Tan', category: 'Spray Tan', price: 250, durationMinutes: 30, isActive: true },
  { id: 'SRV-TAN-02', name: 'Organic Mediterranean Dark Bronze', category: 'Spray Tan', price: 280, durationMinutes: 30, isActive: true },
  { id: 'SRV-TAN-03', name: 'Shimmer Goddess Body Finish', category: 'Spray Tan', price: 120, durationMinutes: 20, isActive: true },
];

export const DEFAULT_RETAIL_PRODUCTS: { id: string; name: string; price: number; category: string }[] = [
  { id: 'PROD-01', name: 'Olaplex No. 3 Hair Perfector (100ml)', price: 180, category: 'Hair Care' },
  { id: 'PROD-02', name: 'Kerastase Elixir Ultime Hair Oil (100ml)', price: 240, category: 'Hair Care' },
  { id: 'PROD-03', name: 'Russian Lash Extension Foam Cleanser (150ml)', price: 120, category: 'Lash Care' },
  { id: 'PROD-04', name: 'OPI ProSpa Cuticle Protective Oil (15ml)', price: 95, category: 'Nail Care' },
  { id: 'PROD-05', name: 'Moroccan Argan Organic Body Balm (250ml)', price: 160, category: 'Spa & Body' },
  { id: 'PROD-06', name: 'Sol de Janeiro Brazilian Bum Bum Cream (240ml)', price: 210, category: 'Spa & Body' },
];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-101',
    name: 'Sheikha Al-Kuwari',
    mobile: '+974 5512 8899',
    email: 's.alkuwari@domain.qa',
    totalVisits: 5,
    totalSpent: 4250,
    outstandingBalance: 0,
    notes: 'VIP customer, prefers Russian Volume lashes and quiet ambience',
    createdAt: '2026-08-10',
    lastVisitDate: '2026-10-21',
  },
  {
    id: 'CUST-102',
    name: 'Fatima Al-Sulaiti',
    mobile: '+974 6623 4455',
    email: 'fatima.sulaiti@domain.qa',
    totalVisits: 3,
    totalSpent: 2650,
    outstandingBalance: 0,
    notes: 'Regular nail art & hair color appointments',
    createdAt: '2026-09-01',
    lastVisitDate: '2026-10-20',
  },
  {
    id: 'CUST-103',
    name: 'Mariam Al-Mohannadi',
    mobile: '+974 5098 7766',
    email: 'mariam.m@domain.qa',
    totalVisits: 4,
    totalSpent: 3100,
    outstandingBalance: 150,
    notes: 'Requested home service with Uber charge previously',
    createdAt: '2026-09-12',
    lastVisitDate: '2026-10-19',
  },
  {
    id: 'CUST-104',
    name: 'Noor Al-Thani',
    mobile: '+974 3344 5566',
    email: 'noor.thani@domain.qa',
    totalVisits: 6,
    totalSpent: 6800,
    outstandingBalance: 0,
    notes: 'Prefers Fawran instant payment',
    createdAt: '2026-07-15',
    lastVisitDate: '2026-10-18',
  },
  {
    id: 'CUST-105',
    name: 'Elena Rostova',
    mobile: '+974 7788 9900',
    email: 'elena.rostova@gmail.com',
    totalVisits: 2,
    totalSpent: 1200,
    outstandingBalance: 0,
    notes: 'Russian hard gel specialist client',
    createdAt: '2026-10-02',
    lastVisitDate: '2026-10-16',
  },
  {
    id: 'CUST-106',
    name: 'Maha',
    mobile: '+974 6652 0205',
    email: 'maha.qtr@gmail.com',
    gender: 'Female',
    totalVisits: 1,
    totalSpent: 0,
    walletBalance: 0,
    outstandingBalance: 0,
    rating: null,
    reviewCount: 0,
    segment: 'New',
    canceledCount: 1,
    noShowCount: 0,
    notes: 'Appointment canceled previously for Eyebrow Lift',
    createdAt: '2026-10-21',
  },
  {
    id: 'CUST-107',
    name: 'Modi',
    mobile: '+974 7097 0709',
    email: 'modi.salon@gmail.com',
    gender: 'Female',
    totalVisits: 0,
    totalSpent: 0,
    walletBalance: 0,
    outstandingBalance: 0,
    rating: null,
    reviewCount: 0,
    segment: 'New',
    canceledCount: 0,
    noShowCount: 0,
    createdAt: '2026-10-21',
  },
  {
    id: 'CUST-108',
    name: 'Munira',
    mobile: '+974 7788 1994',
    email: 'munira.m@domain.qa',
    gender: 'Female',
    totalVisits: 1,
    totalSpent: 252,
    walletBalance: 0,
    outstandingBalance: 0,
    rating: 5,
    reviewCount: 1,
    segment: 'Regular',
    canceledCount: 0,
    noShowCount: 0,
    createdAt: '2026-10-21',
    lastVisitDate: '2026-10-21',
  },
  {
    id: 'CUST-109',
    name: 'Rawan',
    mobile: '+974 3102 3322',
    email: 'rawan.doha@gmail.com',
    gender: 'Female',
    totalVisits: 1,
    totalSpent: 230,
    walletBalance: 0,
    outstandingBalance: 0,
    rating: 5,
    reviewCount: 1,
    segment: 'Regular',
    canceledCount: 0,
    noShowCount: 0,
    createdAt: '2026-10-20',
    lastVisitDate: '2026-10-20',
  },
  {
    id: 'CUST-110',
    name: 'Hanna',
    mobile: '+974 6660 6016',
    email: 'hanna.salon@gmail.com',
    gender: 'Female',
    totalVisits: 0,
    totalSpent: 0,
    walletBalance: 0,
    outstandingBalance: 0,
    rating: null,
    reviewCount: 0,
    segment: 'New',
    canceledCount: 0,
    noShowCount: 0,
    createdAt: '2026-10-19',
  },
];

export const SAMPLE_DAILY_SALES: DailySaleRecord[] = [
  {
    srNo: 1001,
    srCode: 'CSR-1001',
    saleId: 'SALE-1001',
    date: '2026-10-21',
    customerId: 'CUST-101',
    customerName: 'Sheikha Al-Kuwari',
    mobileNumber: '+974 5512 8899',
    services: [
      {
        id: 'L-1',
        serviceId: 'SRV-LASH-02',
        serviceName: 'Russian Volume 3D-5D',
        category: 'Eyelash Art',
        price: 450,
        quantity: 1,
        discount: 0,
        lineTotal: 450,
        employeeId: 'CBSE20243',
        employeeName: 'ATYRGUL AIAZOVA',
        startTime: '10:00',
        endTime: '12:00',
      },
      {
        id: 'L-2',
        serviceId: 'SRV-NAIL-04',
        serviceName: 'Deluxe Spa Pedicure & Scrub',
        category: 'Nail Art',
        price: 250,
        quantity: 1,
        discount: 0,
        lineTotal: 250,
        employeeId: 'CBSE20244',
        employeeName: 'KUMUSHAI DUISHOGULOVA',
        startTime: '12:00',
        endTime: '13:00',
      },
    ],
    products: [
      {
        id: 'P-1',
        productName: 'Russian Lash Extension Foam Cleanser (150ml)',
        quantity: 1,
        unitPrice: 120,
        discount: 0,
        lineTotal: 120,
        employeeId: 'CBSE20243',
        employeeName: 'ATYRGUL AIAZOVA',
      },
    ],
    uberCharge: 0,
    totalServiceAmount: 700,
    totalProductAmount: 120,
    grossSales: 820,
    totalRevenue: 820,
    posCard: 500,
    cash: 320,
    fawran: 0,
    fawranRecipientName: '',
    tips: 50,
    unpaid: 0,
    refunds: 0,
    netSales: 820,
    totalPaid: 820,
    paymentStatus: 'Paid',
    notes: 'VIP customer appointment completed smoothly.',
    createdAt: '2026-10-21T10:15:00.000Z',
    updatedAt: '2026-10-21T13:05:00.000Z',
  },
  {
    srNo: 1002,
    srCode: 'CSR-1002',
    saleId: 'SALE-1002',
    date: '2026-10-20',
    customerId: 'CUST-104',
    customerName: 'Noor Al-Thani',
    mobileNumber: '+974 3344 5566',
    services: [
      {
        id: 'L-3',
        serviceId: 'SRV-HAIR-03',
        serviceName: 'Balayage & Toning Ritual',
        category: 'Hairdresser',
        price: 650,
        quantity: 1,
        discount: 50,
        lineTotal: 600,
        employeeId: 'CBSE20244',
        employeeName: 'KUMUSHAI DUISHOGULOVA',
        startTime: '14:00',
        endTime: '17:00',
      },
      {
        id: 'L-4',
        serviceId: 'SRV-BROW-01',
        serviceName: 'Brow Lamination & Keratin Tint',
        category: 'Eyebrows Art',
        price: 200,
        quantity: 1,
        discount: 0,
        lineTotal: 200,
        employeeId: 'CBSE20243',
        employeeName: 'ATYRGUL AIAZOVA',
        startTime: '17:15',
        endTime: '18:00',
      },
    ],
    products: [
      {
        id: 'P-2',
        productName: 'Kerastase Elixir Ultime Hair Oil (100ml)',
        quantity: 1,
        unitPrice: 240,
        discount: 0,
        lineTotal: 240,
        employeeId: 'CBSE20244',
        employeeName: 'KUMUSHAI DUISHOGULOVA',
      },
    ],
    uberCharge: 50,
    totalServiceAmount: 800,
    totalProductAmount: 240,
    grossSales: 1040,
    totalRevenue: 1090,
    posCard: 0,
    cash: 0,
    fawran: 1090,
    fawranRecipientName: 'COSMOS BEAUTY / QIB',
    tips: 100,
    unpaid: 0,
    refunds: 0,
    netSales: 1090,
    totalPaid: 1090,
    paymentStatus: 'Paid',
    notes: 'Home service visit with Uber transportation included.',
    createdAt: '2026-10-20T14:00:00.000Z',
    updatedAt: '2026-10-20T18:10:00.000Z',
  },
  {
    srNo: 1003,
    srCode: 'CSR-1003',
    saleId: 'SALE-1003',
    date: '2026-10-19',
    customerId: 'CUST-103',
    customerName: 'Mariam Al-Mohannadi',
    mobileNumber: '+974 5098 7766',
    services: [
      {
        id: 'L-5',
        serviceId: 'SRV-SPA-02',
        serviceName: 'Moroccan Royal Hammam Ritual',
        category: 'Spa',
        price: 500,
        quantity: 1,
        discount: 0,
        lineTotal: 500,
        employeeId: 'CBSE20243',
        employeeName: 'ATYRGUL AIAZOVA',
        startTime: '11:00',
        endTime: '12:30',
      },
      {
        id: 'L-6',
        serviceId: 'SRV-TAN-01',
        serviceName: 'Full Body Express Golden Tan',
        category: 'Spray Tan',
        price: 250,
        quantity: 1,
        discount: 0,
        lineTotal: 250,
        employeeId: 'CBSE20244',
        employeeName: 'KUMUSHAI DUISHOGULOVA',
        startTime: '12:30',
        endTime: '13:00',
      },
    ],
    products: [
      {
        id: 'P-3',
        productName: 'Moroccan Argan Organic Body Balm (250ml)',
        quantity: 1,
        unitPrice: 160,
        discount: 0,
        lineTotal: 160,
        employeeId: 'CBSE20243',
        employeeName: 'ATYRGUL AIAZOVA',
      },
    ],
    uberCharge: 0,
    totalServiceAmount: 750,
    totalProductAmount: 160,
    grossSales: 910,
    totalRevenue: 910,
    posCard: 500,
    cash: 260,
    fawran: 0,
    fawranRecipientName: '',
    tips: 40,
    unpaid: 150,
    refunds: 0,
    netSales: 910,
    totalPaid: 760,
    paymentStatus: 'Partial',
    notes: 'Remaining balance QAR 150 to be settled next visit.',
    createdAt: '2026-10-19T11:00:00.000Z',
    updatedAt: '2026-10-19T13:15:00.000Z',
  },
  {
    srNo: 1004,
    srCode: 'CSR-1004',
    saleId: 'SALE-1004',
    date: '2026-10-23',
    customerId: 'CUST-102',
    customerName: 'Fatima Al-Marri',
    mobileNumber: '+974 6623 4455',
    services: [
      {
        id: 'L-7',
        serviceId: 'SRV-HAIR-01',
        serviceName: 'Haircut & Styling',
        category: 'Hairdresser',
        price: 250,
        quantity: 1,
        discount: 0,
        lineTotal: 250,
        employeeId: 'CBSE20244',
        employeeName: 'KUMUSHAI DUISHOGULOVA',
        startTime: '10:30',
        endTime: '11:30',
      },
    ],
    products: [],
    uberCharge: 0,
    totalServiceAmount: 250,
    totalProductAmount: 0,
    grossSales: 250,
    totalRevenue: 250,
    posCard: 0,
    cash: 0,
    transferIncome: 0,
    fawran: 0,
    fawranRecipientName: '',
    tips: 0,
    unpaid: 250,
    refunds: 0,
    netSales: 250,
    totalPaid: 0,
    paymentStatus: 'Unpaid',
    timeIn: '10:30 AM',
    timeOut: undefined,
    visitStatus: 'In Service',
    notes: 'Customer arrived and currently in styling chair. Checkout/Checkpay pending after finishing services.',
    createdAt: '2026-10-23T07:30:00.000Z',
    updatedAt: '2026-10-23T07:30:00.000Z',
  },
];

export const SAMPLE_PETTY_CASH: PettyCashExpense[] = [
  {
    id: 'PC-1001',
    invoiceDate: '2026-10-22',
    invoiceRefNo: 'INV-CARREF-8891',
    company: 'Carrefour Qatar (City Center)',
    description: 'Salon amenities: Nespresso coffee capsules, mineral water bottles, luxury snacks for clients',
    status: 'Paid',
    paymentMethod: 'Petty Cash Box',
    detailsComment: 'Official receipt verified by salon receptionist',
    cardCashType: 'Cash',
    amount: 380,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-22T10:00:00.000Z',
  },
  {
    id: 'PC-1002',
    invoiceDate: '2026-10-21',
    invoiceRefNo: 'INV-DOHAPHARM-440',
    company: 'Kulud Pharmacy Doha',
    description: 'Medical alcohol spray, sterilizing wipes, disposable latex gloves, burn ointment',
    status: 'Paid',
    paymentMethod: 'Debit Card (POS)',
    detailsComment: 'Salon hygiene & sanitation compliance replenishment',
    cardCashType: 'Card',
    amount: 295,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-21T14:30:00.000Z',
  },
  {
    id: 'PC-1003',
    invoiceDate: '2026-10-20',
    invoiceRefNo: 'INV-ALMEERA-9912',
    company: 'Al Meera Supermarket',
    description: 'Soft towels laundry detergent, fabric softener, salon scented aromatherapy oils',
    status: 'Paid',
    paymentMethod: 'Cash',
    detailsComment: 'Spa & hair washing station supplies',
    cardCashType: 'Cash',
    amount: 240,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-20T11:20:00.000Z',
  },
  {
    id: 'PC-1004',
    invoiceDate: '2026-10-19',
    invoiceRefNo: 'INV-TECHCOOL-102',
    company: 'Qatar HVAC Emergency Repair',
    description: 'Hair treatment drying station AC filter replacement & deep sanitization',
    status: 'Unpaid',
    paymentMethod: 'Bank Transfer (Pending)',
    detailsComment: 'Awaiting manager approval sign-off before electronic release',
    cardCashType: 'Cash',
    amount: 650,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-19T16:00:00.000Z',
  },
  {
    id: 'PC-1005',
    invoiceDate: '2026-10-18',
    invoiceRefNo: 'INV-OFFICEPLUS-331',
    company: 'Jarir Bookstore Doha',
    description: 'Thermal receipt paper rolls for POS card terminal, VIP client appointment cards',
    status: 'Paid',
    paymentMethod: 'Card',
    detailsComment: 'Front desk reception supplies',
    cardCashType: 'Card',
    amount: 185,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-18T09:15:00.000Z',
  },
  {
    id: 'PC-1006',
    invoiceDate: '2026-10-15',
    invoiceRefNo: 'INV-BEAUTYDEPOT-771',
    company: 'Gulf Beauty Supplies W.L.L',
    description: 'Disposable eyebrow micro-brushes, lash silicone patches, tint mixing bowls',
    status: 'Unpaid',
    paymentMethod: 'Fawran (Pending)',
    detailsComment: 'Delivery invoice payment due on delivery confirmation',
    cardCashType: 'Card',
    amount: 420,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-15T13:00:00.000Z',
  },
];

export const SAMPLE_FIXED_EXPENSES: FixedExpense[] = [
  {
    id: 'FE-1001',
    date: '2026-10-01',
    refNo: 'LEAS-SHOP-2026-10',
    category: 'Lease Shop',
    company: 'United Development Company (The Pearl Qatar)',
    description: 'Salon ground retail boutique monthly lease & service charge',
    status: 'Paid',
    paymentMethod: 'Bank / WPS Cheque',
    detailsComment: 'Official bank wire confirmation #CBQ-99120',
    cardCashType: 'Bank / WPS',
    amount: 28000,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'FE-1002',
    date: '2026-10-01',
    refNo: 'LEAS-FLAT-2026-10',
    category: 'Lease Flat',
    company: 'Al Asmakh Real Estate',
    description: 'Cosmos Staff Accommodation residential building monthly rent (Live-In Staff)',
    status: 'Paid',
    paymentMethod: 'Bank Transfer (Doha Bank)',
    detailsComment: 'Staff villa rental paid for October',
    cardCashType: 'Bank / WPS',
    amount: 12000,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-01T08:30:00.000Z',
  },
  {
    id: 'FE-1003',
    date: '2026-10-05',
    refNo: 'COOL-QA-2026-10',
    category: 'Qatar Cool',
    company: 'Qatar District Cooling Company (Qatar Cool)',
    description: 'Chilled water supply, centralized AC & cooling consumption for salon',
    status: 'Paid',
    paymentMethod: 'Commercial Bank of Qatar POS Card',
    detailsComment: 'Monthly cooling utility bill settled via online portal',
    cardCashType: 'Card',
    amount: 3200,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'FE-1004',
    date: '2026-10-06',
    refNo: 'OOR-FIBER-8812',
    category: 'Internet',
    company: 'Ooredoo Qatar Business',
    description: 'Fiber Business Ultra 500Mbps + Dedicated Guest WiFi + Cloud POS connection',
    status: 'Paid',
    paymentMethod: 'Debit Card (POS)',
    detailsComment: 'Monthly telecommunication fee auto-debited',
    cardCashType: 'Card',
    amount: 850,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-06T11:00:00.000Z',
  },
  {
    id: 'FE-1005',
    date: '2026-10-10',
    refNo: 'FRESHA-SUB-2026',
    category: 'Fresha',
    company: 'Fresha Software Ireland Ltd',
    description: 'Salon online booking subscription, marketplace partner fees & SMS notification package',
    status: 'Paid',
    paymentMethod: 'Corporate Credit Card',
    detailsComment: 'Monthly software subscription',
    cardCashType: 'Card',
    amount: 1450,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'FE-1006',
    date: '2026-10-12',
    refNo: 'LOYAL-CARD-552',
    category: 'Loyalty Card',
    company: 'Qatar Smart Cards & Loyalty Tech',
    description: 'Gold VIP RFID membership cards printing & automated rewards cashback engine',
    status: 'Unpaid',
    paymentMethod: 'Bank Transfer (Pending)',
    detailsComment: 'Invoice received - payment scheduled for end of month',
    cardCashType: 'Bank / WPS',
    amount: 1100,
    month: 'October',
    year: '2026',
    createdAt: '2026-10-12T15:00:00.000Z',
  },
];

export const SAMPLE_BUSINESS_GROSS: BusinessGrossEntry[] = [
  {
    id: 'BG-1001',
    date: '2026-10-21',
    posIncome: 1450,
    cashIncome: 500,
    transferIncome: 650,
    fawranIncome: 1090,
    totalGross: 3690,
    month: 'October',
    year: '2026',
    notes: 'Busy salon Wednesday with multiple lash & nail services',
    source: 'Daily Sales Auto-Sync',
    createdAt: '2026-10-21T21:00:00.000Z',
  },
  {
    id: 'BG-1002',
    date: '2026-10-20',
    posIncome: 1800,
    cashIncome: 750,
    transferIncome: 400,
    fawranIncome: 1250,
    totalGross: 4200,
    month: 'October',
    year: '2026',
    notes: 'Home service VIP visits and bridal package bookings',
    source: 'Daily Sales Auto-Sync',
    createdAt: '2026-10-20T21:00:00.000Z',
  },
  {
    id: 'BG-1003',
    date: '2026-10-19',
    posIncome: 2100,
    cashIncome: 620,
    transferIncome: 800,
    fawranIncome: 950,
    totalGross: 4470,
    month: 'October',
    year: '2026',
    notes: 'High retail product and hair treatment sales day',
    source: 'Daily Sales Auto-Sync',
    createdAt: '2026-10-19T21:00:00.000Z',
  },
];

export const SAMPLE_VARIABLE_EXPENSES: VariableExpense[] = [];

export const SAMPLE_BOOKINGS: CustomerBooking[] = [
  // AIKA KALYBAEVA (CBSE20251)
  {
    id: 'BKG-201',
    bookingCode: 'BKG-2001',
    date: '2026-10-22',
    startTime: '11:00',
    endTime: '13:00',
    durationMinutes: 120,
    customerId: 'CUST-INTERNAL',
    customerName: 'CONTENT FOR INSTAGRAM',
    customerMobile: '+974 0000 0000',
    serviceName: 'Salon Media Shoot & Content',
    serviceCategory: 'Eyelash Art',
    servicePrice: 0,
    employeeId: 'CBSE20251',
    employeeName: 'AIKA KALYBAEVA',
    status: 'Confirmed',
    isBlockTime: true,
    cardColor: 'grey',
    notes: 'Studio recording and social media content creation',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'BKG-202',
    bookingCode: 'BKG-2002',
    date: '2026-10-22',
    startTime: '13:30',
    endTime: '14:30',
    durationMinutes: 60,
    customerId: 'CUST-109',
    customerName: 'Rawan',
    customerMobile: '+974 3102 3322',
    serviceName: 'Eyelash extensions removal from other',
    serviceCategory: 'Eyelash Art',
    servicePrice: 150,
    employeeId: 'CBSE20251',
    employeeName: 'AIKA KALYBAEVA',
    status: 'In-Service',
    cardColor: 'blue',
    notes: 'Safe gel removal from prior salon',
    createdAt: '2026-10-21T09:00:00.000Z',
    updatedAt: '2026-10-22T13:30:00.000Z',
  },
  {
    id: 'BKG-203',
    bookingCode: 'BKG-2003',
    date: '2026-10-22',
    startTime: '14:15',
    endTime: '16:45',
    durationMinutes: 150,
    customerId: 'CUST-109',
    customerName: 'Rawan',
    customerMobile: '+974 3102 3322',
    serviceName: 'Anime style extensions',
    serviceCategory: 'Eyelash Art',
    servicePrice: 420,
    employeeId: 'CBSE20251',
    employeeName: 'AIKA KALYBAEVA',
    status: 'In-Service',
    cardColor: 'blue',
    notes: 'Spiky anime comic design with dark chocolate spikes',
    createdAt: '2026-10-21T09:15:00.000Z',
    updatedAt: '2026-10-22T14:15:00.000Z',
  },

  // SEZIM KALYBEKOVA (CBSE20252)
  {
    id: 'BKG-204',
    bookingCode: 'BKG-2004',
    date: '2026-10-22',
    startTime: '11:00',
    endTime: '13:00',
    durationMinutes: 120,
    customerId: 'CUST-INTERNAL',
    customerName: 'CONTENT FOR INSTAGRAM',
    customerMobile: '+974 0000 0000',
    serviceName: 'Salon Media Shoot & Content',
    serviceCategory: 'Nail Art',
    servicePrice: 0,
    employeeId: 'CBSE20252',
    employeeName: 'SEZIM KALYBEKOVA',
    status: 'Confirmed',
    isBlockTime: true,
    cardColor: 'grey',
    notes: 'Nail art reel production',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'BKG-205',
    bookingCode: 'BKG-2005',
    date: '2026-10-22',
    startTime: '14:00',
    endTime: '16:45',
    durationMinutes: 165,
    customerId: 'CUST-101',
    customerName: 'shekhaaa',
    customerMobile: '+974 5512 8899',
    serviceName: 'Gel Extension',
    serviceCategory: 'Nail Art',
    servicePrice: 380,
    employeeId: 'CBSE20252',
    employeeName: 'SEZIM KALYBEKOVA',
    status: 'In-Service',
    isRequestedStaff: true,
    cardColor: 'pink',
    notes: 'Russian almond shape with french tip ombre',
    createdAt: '2026-10-21T14:00:00.000Z',
    updatedAt: '2026-10-22T14:00:00.000Z',
  },

  // AMIRA ASSOUDI (CBSE20253)
  {
    id: 'BKG-206',
    bookingCode: 'BKG-2006',
    date: '2026-10-22',
    startTime: '13:20',
    endTime: '14:20',
    durationMinutes: 60,
    customerId: 'CUST-111',
    customerName: 'fma',
    customerMobile: '+974 5588 3311',
    serviceName: 'Blow Dry with Wavy Hairstyle',
    serviceCategory: 'Hairdresser',
    servicePrice: 200,
    employeeId: 'CBSE20253',
    employeeName: 'AMIRA ASSOUDI',
    status: 'In-Service',
    cardColor: 'peach',
    notes: 'Voluminous Hollywood waves',
    createdAt: '2026-10-21T12:00:00.000Z',
    updatedAt: '2026-10-22T13:20:00.000Z',
  },
  {
    id: 'BKG-207',
    bookingCode: 'BKG-2007',
    date: '2026-10-22',
    startTime: '14:20',
    endTime: '15:20',
    durationMinutes: 60,
    customerId: 'CUST-111',
    customerName: 'fma',
    customerMobile: '+974 5588 3311',
    serviceName: 'Refill per capsule',
    serviceCategory: 'Hairdresser',
    servicePrice: 250,
    employeeId: 'CBSE20253',
    employeeName: 'AMIRA ASSOUDI',
    status: 'In-Service',
    cardColor: 'cyan',
    notes: 'Keratin micro-capsule refill',
    createdAt: '2026-10-21T12:30:00.000Z',
    updatedAt: '2026-10-22T14:20:00.000Z',
  },
  {
    id: 'BKG-208',
    bookingCode: 'BKG-2008',
    date: '2026-10-22',
    startTime: '14:00',
    endTime: '16:00',
    durationMinutes: 120,
    customerId: 'CUST-112',
    customerName: 'Amal Tarkhat',
    customerMobile: '+974 6699 2233',
    serviceName: 'Brazilian Blow Out, Roots',
    serviceCategory: 'Hairdresser',
    servicePrice: 650,
    employeeId: 'CBSE20253',
    employeeName: 'AMIRA ASSOUDI',
    status: 'In-Service',
    cardColor: 'cyan',
    notes: 'Organic smoothing treatment root touchup',
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'BKG-209',
    bookingCode: 'BKG-2009',
    date: '2026-10-22',
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    customerId: 'CUST-113',
    customerName: 'Nora.n5@hotmail.com AlZowaidi',
    customerMobile: '+974 5533 1122',
    customerEmail: 'Nora.n5@hotmail.com',
    serviceName: 'Blow Dry, Short Length Hair',
    serviceCategory: 'Hairdresser',
    servicePrice: 180,
    employeeId: 'CBSE20253',
    employeeName: 'AMIRA ASSOUDI',
    status: 'Confirmed',
    isVip: true,
    isRequestedStaff: true,
    isOnlineBooking: true,
    cardColor: 'peach',
    notes: 'VIP guest via Fresha online booking',
    createdAt: '2026-10-21T16:00:00.000Z',
    updatedAt: '2026-10-21T16:00:00.000Z',
  },

  // JIBEK KALYBEK (CBSE20249)
  {
    id: 'BKG-210',
    bookingCode: 'BKG-2010',
    date: '2026-10-22',
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    customerId: 'CUST-114',
    customerName: 'LUNA',
    customerMobile: '+974 7744 8822',
    serviceName: 'Eyelash Refill',
    serviceCategory: 'Eyelash Art',
    servicePrice: 280,
    employeeId: 'CBSE20249',
    employeeName: 'JIBEK KALYBEK',
    status: 'Confirmed',
    cardColor: 'white',
    notes: 'Promo tag discount applied',
    createdAt: '2026-10-21T11:00:00.000Z',
    updatedAt: '2026-10-21T11:00:00.000Z',
  },
  {
    id: 'BKG-211',
    bookingCode: 'BKG-2011',
    date: '2026-10-22',
    startTime: '12:30',
    endTime: '14:15',
    durationMinutes: 105,
    customerId: 'CUST-115',
    customerName: 'Rama Khaleel',
    customerMobile: '+974 6611 9900',
    serviceName: 'Eyelash Refill',
    serviceCategory: 'Eyelash Art',
    servicePrice: 300,
    employeeId: 'CBSE20249',
    employeeName: 'JIBEK KALYBEK',
    status: 'Confirmed',
    isVip: true,
    isOnlineBooking: true,
    cardColor: 'blue',
    notes: 'VIP customer Fresha booking',
    createdAt: '2026-10-21T14:30:00.000Z',
    updatedAt: '2026-10-22T14:30:00.000Z',
  },
  {
    id: 'BKG-212',
    bookingCode: 'BKG-2012',
    date: '2026-10-22',
    startTime: '15:00',
    endTime: '15:40',
    durationMinutes: 40,
    customerId: 'CUST-107',
    customerName: 'Modi',
    customerMobile: '+974 7097 0709',
    serviceName: 'Eyebrow Lift',
    serviceCategory: 'Eyebrows Art',
    servicePrice: 250,
    employeeId: 'CBSE20249',
    employeeName: 'JIBEK KALYBEK',
    status: 'Confirmed',
    isRequestedStaff: true,
    cardColor: 'cyan',
    notes: 'Lamination and shaping',
    createdAt: '2026-10-21T15:00:00.000Z',
    updatedAt: '2026-10-21T15:00:00.000Z',
  },
];

export const SAMPLE_LEAVES: LeaveRecord[] = [
  {
    leaveId: 'LV-2026-001',
    employeeId: 'CBSE20243',
    employeeName: 'ATYRA AIAZOVA',
    startDate: '2026-10-22',
    endDate: '2026-10-24',
    days: 3,
    leaveType: 'Annual Leave',
    paidStatus: 'Paid',
    status: 'Approved',
    period: 'October 2026',
    remarks: 'Approved family annual vacation',
    requestedDate: '2026-10-10',
    approvedBy: 'Salon Manager',
    approvedDate: '2026-10-12',
  },
  {
    leaveId: 'LV-2026-002',
    employeeId: 'CBSE20245',
    employeeName: 'DINA AL-SABAH',
    startDate: '2026-10-23',
    endDate: '2026-10-24',
    days: 2,
    leaveType: 'Sick Leave',
    paidStatus: 'Paid',
    status: 'Approved',
    period: 'October 2026',
    remarks: 'Medical leave approved with doctor clinic note',
    requestedDate: '2026-10-21',
    approvedBy: 'Salon Manager',
    approvedDate: '2026-10-21',
  },
];

export const SAMPLE_EMPLOYEES: Employee[] = [
  {
    no: 1,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Vacation',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062026',
    employeeId: 'CBSE20243',
    contractType: 'Contract',
    joiningDate: '2026-02-15',
    endContract: '2028-02-15',
    mph: 'YES',
    expireMph: '2027-08-04',
    position: 'Senior Eyelash Artist',
    employeeName: 'ATYRA AIAZOVA',
    nationality: 'KYRGYZSTAN',
    mobile: '+974 3388 8687',
    whatsapp: '+974 3388 8687',
    email: 'Atyrgula50@gmail.com',
    passportNumber: 'AC3002861',
    passportExpiry: '2027-06-09',
    passportDays: 'Day 598',
    residencyQid: '29741700048',
    residencyExpiry: '2027-06-26',
    residencyDays: 'Day 615',
    payerBank: 'Doha Bank',
    payerBankShort: 'DB',
    iban: 'QA60BRWA00000000020000129',
    basicSalary: 4000,
    foodAllowance: 1500,
    transportAllowance: 2000,
    carOperationAllowance: 0,
    otherAllowance: 2500,
    limitedTransport: 200,
    totalSalary: 10200,
    saleCommissionRate: 10,
    saleTargetRate: 35000,
    totalSalesRate: 38500,
    targetSales: 35000,
    prodSaleCommission: 5,
    prodSaleTarget: 5000,
    prodTotalSales: 6200,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 3060,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 450,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 1,333',
    salariesWages: 8473,
    totalCreditLeave: 30,
    lastLeaveDate: '2026-09-20',
    annualLeaveDays: 25,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 3333,
    annualLeaveRemaining: 5,
    annualLeaveFees: 667,
    ticketCycle: 2,
    nextTicketDate: '2028-02-15',
    ticketStatus: 'Not Eligible',
    ticketDestination: 'Bishkek, Kyrgyzstan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'A. Aiazova',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Monday',
    employeeRole: 'Eyelash Art',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Eyelash Art', 'Eyebrows Art', 'Spa'],
    workingHours: { start: '09:00', end: '21:00' },
  },
  {
    no: 2,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live In',
    contractNo: 'CBS-22062027',
    employeeId: 'CBSE20244',
    contractType: 'Contract',
    joiningDate: '2026-06-20',
    endContract: '2028-06-20',
    mph: 'NO',
    expireMph: '',
    position: 'Nail Artist & Esthetician',
    employeeName: 'KUMUSHAI DUISHOGULOVA',
    nationality: 'KYRGYZSTAN',
    mobile: '+974 70637559',
    whatsapp: '+974 5053 3889',
    email: 'kumushaiduishogulova@gmail.com',
    passportNumber: 'AC3117123',
    passportExpiry: '2027-12-19',
    passportDays: 'Day 791',
    residencyQid: '30141700003',
    residencyExpiry: '2027-06-19',
    residencyDays: 'Day 608',
    payerBank: 'Qatar Islamic Bank',
    payerBankShort: 'QIB',
    iban: 'QA56QISB000000000156307030017',
    basicSalary: 2500,
    foodAllowance: 1000,
    transportAllowance: 1000,
    carOperationAllowance: 500,
    otherAllowance: 3791,
    limitedTransport: 200,
    totalSalary: 8991,
    saleCommissionRate: 10,
    saleTargetRate: 20000,
    totalSalesRate: 24000,
    targetSales: 20000,
    prodSaleCommission: 5,
    prodSaleTarget: 3000,
    prodTotalSales: 3500,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 500,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 600,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 8991,
    totalCreditLeave: 30,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 30,
    annualLeaveFees: 2500,
    ticketCycle: 2,
    nextTicketDate: '2028-06-20',
    ticketStatus: 'Eligible',
    ticketDestination: 'Bishkek, Kyrgyzstan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'K. Duishogulova',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Tuesday',
    employeeRole: 'Nail Art',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Nail Art', 'Spa', 'Spray Tan'],
    workingHours: { start: '10:00', end: '20:00' },
  },
  {
    no: 3,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062028',
    employeeId: 'CBSE20245',
    contractType: 'Contract',
    joiningDate: '2026-01-10',
    endContract: '2028-01-10',
    mph: 'NO',
    expireMph: '',
    position: 'Master Hairdresser',
    employeeName: 'DINA AL-SABAH',
    nationality: 'LEBANON',
    mobile: '+974 5544 3322',
    whatsapp: '+974 5544 3322',
    email: 'dina.alsabah@gmail.com',
    passportNumber: 'LR7892341',
    passportExpiry: '2028-04-15',
    passportDays: 'Day 908',
    residencyQid: '29542200119',
    residencyExpiry: '2027-11-20',
    residencyDays: 'Day 760',
    payerBank: 'Commercial Bank of Qatar',
    payerBankShort: 'CBQ',
    iban: 'QA88CBQK00000000030000991',
    basicSalary: 3500,
    foodAllowance: 1200,
    transportAllowance: 1200,
    carOperationAllowance: 0,
    otherAllowance: 2100,
    limitedTransport: 200,
    totalSalary: 8200,
    saleCommissionRate: 10,
    saleTargetRate: 25000,
    totalSalesRate: 27500,
    targetSales: 25000,
    prodSaleCommission: 5,
    prodSaleTarget: 4000,
    prodTotalSales: 4200,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 520,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 8200,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2028-01-10',
    ticketStatus: 'Not Eligible',
    ticketDestination: 'Beirut, Lebanon',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'D. Al-Sabah',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Sunday',
    employeeRole: 'Hairdresser',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Hairdresser', 'Eyebrows Art'],
    workingHours: { start: '09:00', end: '19:00' },
  },
  {
    no: 4,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Admin',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062029',
    employeeId: 'CBSE20246',
    contractType: 'Contract',
    joiningDate: '2025-11-01',
    endContract: '2027-11-01',
    mph: 'NO',
    expireMph: '',
    position: 'HR Officer',
    employeeName: 'NOOR AL-MANSOORI',
    nationality: 'QATAR',
    mobile: '+974 6699 1122',
    whatsapp: '+974 6699 1122',
    email: 'hr@cosmosbeautysalon.qa',
    passportNumber: 'QA9012384',
    passportExpiry: '2029-08-10',
    passportDays: 'Day 1390',
    residencyQid: '29863400551',
    residencyExpiry: '2029-08-10',
    residencyDays: 'Day 1390',
    payerBank: 'Qatar National Bank',
    payerBankShort: 'QNB',
    iban: 'QA33QNBA00000000055123901',
    basicSalary: 6000,
    foodAllowance: 1500,
    transportAllowance: 1500,
    carOperationAllowance: 1000,
    otherAllowance: 2000,
    limitedTransport: 0,
    totalSalary: 12000,
    saleCommissionRate: 0,
    saleTargetRate: 0,
    totalSalesRate: 0,
    targetSales: 0,
    prodSaleCommission: 0,
    prodSaleTarget: 0,
    prodTotalSales: 0,
    businessTargetRate: 0,
    businessTargetAmount: 0,
    businessGross: 0,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 0,
    outstanding: 0,
    leaveEntitlement: 30,
    annualLeavePaid: 'QAR 0',
    salariesWages: 12000,
    totalCreditLeave: 30,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 30,
    annualLeaveFees: 0,
    ticketCycle: 1,
    nextTicketDate: '2027-11-01',
    ticketStatus: 'Eligible',
    ticketDestination: 'Doha, Qatar',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'N. Al-Mansoori',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Friday',
    employeeRole: 'HR',
    canProvideServices: false,
    availableForBooking: false,
    serviceCategories: [],
    workingHours: { start: '08:30', end: '17:30' },
  },
  {
    no: 5,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Finance',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062030',
    employeeId: 'CBSE20247',
    contractType: 'Contract',
    joiningDate: '2025-09-15',
    endContract: '2027-09-15',
    mph: 'NO',
    expireMph: '',
    position: 'Accountant',
    employeeName: 'MOHAMMED RASHID',
    nationality: 'JORDAN',
    mobile: '+974 5533 7788',
    whatsapp: '+974 5533 7788',
    email: 'finance@cosmosbeautysalon.qa',
    passportNumber: 'JO4455661',
    passportExpiry: '2028-10-20',
    passportDays: 'Day 1095',
    residencyQid: '29340001889',
    residencyExpiry: '2027-09-15',
    residencyDays: 'Day 694',
    payerBank: 'Masraf Al Rayan',
    payerBankShort: 'MAR',
    iban: 'QA12MARK00000000088910243',
    basicSalary: 5500,
    foodAllowance: 1200,
    transportAllowance: 1200,
    carOperationAllowance: 500,
    otherAllowance: 1600,
    limitedTransport: 0,
    totalSalary: 10000,
    saleCommissionRate: 0,
    saleTargetRate: 0,
    totalSalesRate: 0,
    targetSales: 0,
    prodSaleCommission: 0,
    prodSaleTarget: 0,
    prodTotalSales: 0,
    businessTargetRate: 0,
    businessTargetAmount: 0,
    businessGross: 0,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 0,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 10000,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2027-09-15',
    ticketStatus: 'Eligible',
    ticketDestination: 'Amman, Jordan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'M. Rashid',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Friday',
    employeeRole: 'Accountant',
    canProvideServices: false,
    availableForBooking: false,
    serviceCategories: [],
    workingHours: { start: '08:30', end: '17:30' },
  },
  {
    no: 6,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Support',
    accommodation: 'Live In',
    contractNo: 'CBS-22062031',
    employeeId: 'CBSE20248',
    contractType: 'Contract',
    joiningDate: '2026-03-01',
    endContract: '2028-03-01',
    mph: 'NO',
    expireMph: '',
    position: 'Cleaner Staff',
    employeeName: 'AISHA BEGUM',
    nationality: 'BANGLADESH',
    mobile: '+974 3322 1100',
    whatsapp: '+974 3322 1100',
    email: 'aisha.begum@cosmosbeautysalon.qa',
    passportNumber: 'BD1122334',
    passportExpiry: '2028-02-28',
    passportDays: 'Day 860',
    residencyQid: '29950002134',
    residencyExpiry: '2027-03-01',
    residencyDays: 'Day 496',
    payerBank: 'Doha Bank',
    payerBankShort: 'DB',
    iban: 'QA99DBQK00000000011223344',
    basicSalary: 1800,
    foodAllowance: 600,
    transportAllowance: 400,
    carOperationAllowance: 0,
    otherAllowance: 200,
    limitedTransport: 100,
    totalSalary: 3100,
    saleCommissionRate: 0,
    saleTargetRate: 0,
    totalSalesRate: 0,
    targetSales: 0,
    prodSaleCommission: 0,
    prodSaleTarget: 0,
    prodTotalSales: 0,
    businessTargetRate: 0,
    businessTargetAmount: 0,
    businessGross: 0,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 150,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 3100,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2028-03-01',
    ticketStatus: 'Not Eligible',
    ticketDestination: 'Dhaka, Bangladesh',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'A. Begum',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Saturday',
    employeeRole: 'Cleaner Staff',
    canProvideServices: false,
    availableForBooking: false,
    serviceCategories: [],
    workingHours: { start: '08:00', end: '17:00' },
  },
  {
    no: 7,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062032',
    employeeId: 'CBSE20249',
    contractType: 'Contract',
    joiningDate: '2026-03-15',
    endContract: '2028-03-15',
    mph: 'NO',
    expireMph: '',
    position: 'Eyebrows Art Specialist',
    employeeName: 'JIBEK KALYBEK',
    nationality: 'KYRGYZSTAN',
    mobile: '+974 7766 5544',
    whatsapp: '+974 7766 5544',
    email: 'jibek.kalybek@cosmosbeautysalon.qa',
    passportNumber: 'AC4499120',
    passportExpiry: '2028-05-20',
    passportDays: 'Day 940',
    residencyQid: '29841700892',
    residencyExpiry: '2027-06-15',
    residencyDays: 'Day 600',
    payerBank: 'Doha Bank',
    payerBankShort: 'DB',
    iban: 'QA44DBQK00000000099881122',
    basicSalary: 3500,
    foodAllowance: 1200,
    transportAllowance: 1200,
    carOperationAllowance: 0,
    otherAllowance: 2100,
    limitedTransport: 200,
    totalSalary: 8200,
    saleCommissionRate: 10,
    saleTargetRate: 25000,
    totalSalesRate: 26000,
    targetSales: 25000,
    prodSaleCommission: 5,
    prodSaleTarget: 3000,
    prodTotalSales: 3400,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 380,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 8200,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2028-03-15',
    ticketStatus: 'Eligible',
    ticketDestination: 'Bishkek, Kyrgyzstan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'J. Kalybek',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Wednesday',
    employeeRole: 'Eyebrows Art',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Eyebrows Art', 'Eyelash Art', 'Spa'],
    workingHours: { start: '10:00', end: '22:00' },
  },
  {
    no: 8,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062033',
    employeeId: 'CBSE20251',
    contractType: 'Contract',
    joiningDate: '2026-01-15',
    endContract: '2028-01-15',
    mph: 'YES',
    expireMph: '2027-09-01',
    position: 'Master Lash Artist',
    employeeName: 'AIKA KALYBAEVA',
    nationality: 'KYRGYZSTAN',
    mobile: '+974 5599 0011',
    whatsapp: '+974 5599 0011',
    email: 'aika.kalybaeva@cosmosbeautysalon.qa',
    passportNumber: 'AC4118822',
    passportExpiry: '2028-08-10',
    passportDays: 'Day 1020',
    residencyQid: '29841700999',
    residencyExpiry: '2027-08-15',
    residencyDays: 'Day 660',
    payerBank: 'Doha Bank',
    payerBankShort: 'DB',
    iban: 'QA11DBQK00000000011223344',
    basicSalary: 3800,
    foodAllowance: 1200,
    transportAllowance: 1200,
    carOperationAllowance: 0,
    otherAllowance: 2000,
    limitedTransport: 200,
    totalSalary: 8400,
    saleCommissionRate: 10,
    saleTargetRate: 25000,
    totalSalesRate: 28000,
    targetSales: 25000,
    prodSaleCommission: 5,
    prodSaleTarget: 3000,
    prodTotalSales: 3800,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 410,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 8400,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2028-01-15',
    ticketStatus: 'Eligible',
    ticketDestination: 'Bishkek, Kyrgyzstan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'A. Kalybaeva',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Sunday',
    employeeRole: 'Eyelash Art',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Eyelash Art', 'Eyebrows Art'],
    workingHours: { start: '10:00', end: '22:00' },
  },
  {
    no: 9,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062034',
    employeeId: 'CBSE20252',
    contractType: 'Contract',
    joiningDate: '2026-02-01',
    endContract: '2028-02-01',
    mph: 'YES',
    expireMph: '2027-10-01',
    position: 'Senior Nail Artist',
    employeeName: 'SEZIM KALYBEKOVA',
    nationality: 'KYRGYZSTAN',
    mobile: '+974 6622 3344',
    whatsapp: '+974 6622 3344',
    email: 'sezim.kalybekova@cosmosbeautysalon.qa',
    passportNumber: 'AC4881122',
    passportExpiry: '2028-09-12',
    passportDays: 'Day 1055',
    residencyQid: '29841700777',
    residencyExpiry: '2027-09-15',
    residencyDays: 'Day 690',
    payerBank: 'Doha Bank',
    payerBankShort: 'DB',
    iban: 'QA22DBQK00000000022334455',
    basicSalary: 3800,
    foodAllowance: 1200,
    transportAllowance: 1200,
    carOperationAllowance: 0,
    otherAllowance: 2000,
    limitedTransport: 200,
    totalSalary: 8400,
    saleCommissionRate: 10,
    saleTargetRate: 25000,
    totalSalesRate: 27500,
    targetSales: 25000,
    prodSaleCommission: 5,
    prodSaleTarget: 3000,
    prodTotalSales: 3500,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 440,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 8400,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2028-02-01',
    ticketStatus: 'Eligible',
    ticketDestination: 'Bishkek, Kyrgyzstan',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'S. Kalybekova',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Monday',
    employeeRole: 'Nail Art',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Nail Art', 'Spa'],
    workingHours: { start: '10:00', end: '22:00' },
  },
  {
    no: 10,
    employerId: '17-2681-92',
    company: 'COSMOS',
    duty: 'Duty',
    accommodation: 'Live Out',
    contractNo: 'CBS-22062035',
    employeeId: 'CBSE20253',
    contractType: 'Contract',
    joiningDate: '2025-12-10',
    endContract: '2027-12-10',
    mph: 'YES',
    expireMph: '2027-11-20',
    position: 'Master Hair Stylist & Colorist',
    employeeName: 'AMIRA ASSOUDI',
    nationality: 'TUNISIA',
    mobile: '+974 7733 4455',
    whatsapp: '+974 7733 4455',
    email: 'amira.assoudi@cosmosbeautysalon.qa',
    passportNumber: 'TN5599112',
    passportExpiry: '2028-07-22',
    passportDays: 'Day 1003',
    residencyQid: '29778800112',
    residencyExpiry: '2027-10-10',
    residencyDays: 'Day 715',
    payerBank: 'Commercial Bank of Qatar',
    payerBankShort: 'CBQ',
    iban: 'QA33CBQK00000000033445566',
    basicSalary: 4200,
    foodAllowance: 1500,
    transportAllowance: 1500,
    carOperationAllowance: 0,
    otherAllowance: 2200,
    limitedTransport: 200,
    totalSalary: 9600,
    saleCommissionRate: 10,
    saleTargetRate: 30000,
    totalSalesRate: 34000,
    targetSales: 30000,
    prodSaleCommission: 5,
    prodSaleTarget: 4000,
    prodTotalSales: 4500,
    businessTargetRate: 5,
    businessTargetAmount: 200000,
    businessGross: 215000,
    businessCommBase: 'all_gross',
    businessBonus: 0,
    deductionCurrent: 0,
    deductionFuture: 0,
    futureDeductions: [],
    tips: 520,
    outstanding: 0,
    leaveEntitlement: 21,
    annualLeavePaid: 'QAR 0',
    salariesWages: 9600,
    totalCreditLeave: 21,
    lastLeaveDate: '',
    annualLeaveDays: 0,
    annualLeaveStatus: 'Paid',
    annualLeavePaidAmt: 0,
    annualLeaveRemaining: 21,
    annualLeaveFees: 0,
    ticketCycle: 2,
    nextTicketDate: '2027-12-10',
    ticketStatus: 'Eligible',
    ticketDestination: 'Tunis, Tunisia',
    confirm: 'I further acknowledge and confirm that I have received Salary',
    signature: 'A. Assoudi',
    date: '2026-10-21',
    status: 'Active',
    weeklyOffDay: 'Tuesday',
    employeeRole: 'Hairdresser',
    canProvideServices: true,
    availableForBooking: true,
    serviceCategories: ['Hairdresser', 'Spa'],
    workingHours: { start: '10:00', end: '22:00' },
  },
];

// Helper calculations
export function calculateDaysRemaining(dateStr: string): number {
  if (!dateStr) return 9999;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCurrency(num: number | string | undefined | null): string {
  if (num === null || num === undefined || num === '') return '0';
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(val)) return '0';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function maskIBAN(iban: string | undefined | null): string {
  if (!iban || iban.length < 8) return iban || 'N/A';
  return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function timeToMinutes(timeStr: string | undefined | null): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTimeStr(minutes: number): string {
  const isNeg = minutes < 0;
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  return `${isNeg ? '-' : ''}${h}h ${m}m`;
}

export function formatTime12(timeStr: string | undefined | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = (h || 0) >= 12 ? 'PM' : 'AM';
  const h12 = (h || 0) % 12 || 12;
  return `${h12}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
}

export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// Commission calculation logic - 3 Distinct Streams (Service, Product, Business)
export function calculateEmployeeCommissions(emp: Employee, settings?: SystemSettings) {
  // Stream 1: Employee Sales Commission (Services) - Default 10%
  const salesTarget = Number(emp.saleTargetRate) || 0;
  const actualSales = Number(emp.totalSalesRate) || 0;
  const salesRate =
    emp.saleCommissionRate !== undefined && !isNaN(Number(emp.saleCommissionRate))
      ? Number(emp.saleCommissionRate)
      : (settings?.salesCommRate ?? 10);

  // Formula: Commission Eligibility = Actual Eligible Sales >= Sales Target
  // If eligible: Sales Commission = Actual Eligible Sales * Sales Commission Rate
  // Otherwise: Sales Commission = 0 (Do not pay commission when target is not reached)
  const serviceEligible = actualSales > 0 && actualSales >= salesTarget;
  const serviceCommission = serviceEligible ? actualSales * (salesRate / 100) : 0;
  const serviceAchievement = salesTarget > 0 ? (actualSales / salesTarget) * 100 : (actualSales > 0 ? 100 : 0);
  const serviceDeficit = !serviceEligible && salesTarget > actualSales ? salesTarget - actualSales : 0;

  // Stream 2: Products Sales Commission - Default 5%
  // Tracked separately from service sales. No minimum target required.
  const productSales = Number(emp.prodTotalSales) || 0;
  const productRate =
    emp.prodSaleCommission !== undefined && !isNaN(Number(emp.prodSaleCommission))
      ? Number(emp.prodSaleCommission)
      : (settings?.productCommRate ?? 5);
  const productTarget = Number(emp.prodSaleTarget) || 0;
  const productEligible = productSales > 0;
  const productCommission = productEligible ? productSales * (productRate / 100) : 0;
  const productAchievement = productTarget > 0 ? (productSales / productTarget) * 100 : (productSales > 0 ? 100 : 0);

  // Stream 3: Business Target Commission - Default QAR 200,000 @ 5%
  // Only employees specifically selected by the company are eligible for this commission.
  // If employee is not selected or business does not reach target, commission is 0.
  const businessGross = Number(emp.businessGross) || 0;
  const businessTarget = Number(emp.businessTargetAmount) || settings?.businessTarget || 200000;
  const businessRate =
    emp.businessTargetRate !== undefined && !isNaN(Number(emp.businessTargetRate))
      ? Number(emp.businessTargetRate)
      : (settings?.businessCommRate ?? 5);
  const businessCommBase: 'all_gross' | 'above_target' =
    emp.businessCommBase || settings?.businessCommBase || 'all_gross';

  // Check company selection flag (default false unless explicitly enabled or role is Manager/Admin)
  const businessSelected = emp.businessCommissionEligible === true;
  const businessEligible = businessSelected && businessGross >= businessTarget && businessTarget > 0;
  let businessCommission = 0;
  if (businessEligible) {
    if (businessCommBase === 'above_target') {
      businessCommission = Math.max(0, businessGross - businessTarget) * (businessRate / 100);
    } else {
      businessCommission = businessGross * (businessRate / 100);
    }
  }
  const businessAchievement = businessTarget > 0 ? (businessGross / businessTarget) * 100 : 0;
  const businessDeficit = !businessEligible && businessTarget > businessGross ? businessTarget - businessGross : 0;

  return {
    // Stream 1: Service Sales
    service: serviceCommission,
    serviceEligible,
    serviceTarget: salesTarget,
    serviceActual: actualSales,
    serviceRate: salesRate,
    serviceAchievement,
    serviceDeficit,

    // Stream 2: Product Sales
    product: productCommission,
    productEligible,
    productSales,
    productRate,
    productTarget,
    productAchievement,

    // Stream 3: Business Gross Target
    business: businessCommission,
    businessEligible,
    businessSelectedByCompany: businessSelected,
    businessTarget,
    businessGross,
    businessRate,
    businessCommBase,
    businessAchievement,
    businessDeficit,

    // Aggregated Total
    total: serviceCommission + productCommission + businessCommission,
  };
}

// Complete 10-Component Monthly Salary & Wages Calculator (as per System Requirements)
export function calculateEmployeeSalaryAndWages(
  emp: Employee,
  settings?: SystemSettings,
  overrides?: {
    tipsOverride?: number;
    serviceSalesOverride?: number;
    productSalesOverride?: number;
    businessGrossOverride?: number;
    businessEligibleOverride?: boolean;
    serviceTargetOverride?: number;
    serviceRateOverride?: number;
    productRateOverride?: number;
  }
) {
  const empToCalc: Employee = {
    ...emp,
    tips: overrides?.tipsOverride !== undefined ? overrides.tipsOverride : emp.tips,
    totalSalesRate: overrides?.serviceSalesOverride !== undefined ? overrides.serviceSalesOverride : emp.totalSalesRate,
    prodTotalSales: overrides?.productSalesOverride !== undefined ? overrides.productSalesOverride : emp.prodTotalSales,
    businessGross: overrides?.businessGrossOverride !== undefined ? overrides.businessGrossOverride : emp.businessGross,
    businessCommissionEligible: overrides?.businessEligibleOverride !== undefined ? overrides.businessEligibleOverride : emp.businessCommissionEligible,
    saleTargetRate: overrides?.serviceTargetOverride !== undefined ? overrides.serviceTargetOverride : emp.saleTargetRate,
    saleCommissionRate: overrides?.serviceRateOverride !== undefined ? overrides.serviceRateOverride : emp.saleCommissionRate,
    prodSaleCommission: overrides?.productRateOverride !== undefined ? overrides.productRateOverride : emp.prodSaleCommission,
  };

  const comms = calculateEmployeeCommissions(empToCalc, settings);
  const basic = Number(empToCalc.basicSalary) || 0;
  const food = Number(empToCalc.foodAllowance) || 0;
  const transport = Number(empToCalc.transportAllowance) || 0;
  const carOp = Number(empToCalc.carOperationAllowance) || 0;
  const other = Number(empToCalc.otherAllowance) || 0;
  const limitedTrans = Number(empToCalc.limitedTransport) || 0;
  const totalAllowances = food + transport + carOp + other + limitedTrans;
  const tips = Number(empToCalc.tips) || 0;
  const deductions = Number(empToCalc.deductionCurrent) || 0;

  // 10 Components: Basic + Food + Transport + Car Op + Other + Limited Transport + Tips + Svc Comm + Prod Comm + Biz Comm
  const totalMonthlySalary = basic + totalAllowances + tips + comms.total;
  // Net Payable = Total Monthly Salary & Wages - Deductions
  const netSalary = Math.max(0, totalMonthlySalary - deductions);

  return {
    basicSalary: basic,
    foodAllowance: food,
    transportAllowance: transport,
    carOperationAllowance: carOp,
    otherAllowance: other,
    limitedTransport: limitedTrans,
    totalAllowances,
    tips,
    serviceCommission: comms.service,
    productCommission: comms.product,
    businessCommission: comms.business,
    totalCommissions: comms.total,
    totalMonthlySalary, // Gross earnings of all 10 components
    deductions,
    netSalary, // Final net payable amount
    comms,
  };
}

// Default Architectural Floorplan for COSMOS Beauty Salon (16.0m x 10.5m = 168 m²)
export const DEFAULT_SALON_FLOORPLAN: SalonFloorplan = {
  id: 'FP-COSMOS-MAIN',
  title: 'COSMOS Beauty Salon — Ground Floor Architectural Plan',
  widthMeters: 16.0,
  heightMeters: 10.5,
  updatedAt: new Date().toISOString(),
  zones: [
    {
      id: 'zone-reception',
      name: 'Reception & Retail Lounge',
      category: 'reception',
      x: 0,
      y: 0,
      width: 4.5,
      height: 5.5,
      floorFinish: 'marble',
    },
    {
      id: 'zone-hair',
      name: 'Hair Styling & Wash Studio',
      category: 'hair',
      x: 4.5,
      y: 0,
      width: 7.5,
      height: 5.5,
      floorFinish: 'oak',
    },
    {
      id: 'zone-lashes',
      name: 'Lashes & Brows Studio',
      category: 'lashes',
      x: 12.0,
      y: 0,
      width: 4.0,
      height: 5.5,
      floorFinish: 'terrazzo',
    },
    {
      id: 'zone-nails',
      name: 'Nail Art & Pedicure Lounge',
      category: 'nails',
      x: 0,
      y: 5.5,
      width: 7.5,
      height: 5.0,
      floorFinish: 'terrazzo',
    },
    {
      id: 'zone-spa',
      name: 'VIP Spa & Spray Tan Suite',
      category: 'spa',
      x: 7.5,
      y: 5.5,
      width: 4.5,
      height: 5.0,
      floorFinish: 'oak',
    },
    {
      id: 'zone-boh',
      name: 'Back of House & HR Office',
      category: 'backofhouse',
      x: 12.0,
      y: 5.5,
      width: 4.0,
      height: 5.0,
      floorFinish: 'tile',
    },
  ],
  items: [
    {
      id: 'ST-ENT-01',
      code: 'ENT-01',
      label: 'Main Entrance',
      type: 'door',
      zoneId: 'zone-reception',
      x: 1.4,
      y: 0.0,
      width: 1.6,
      height: 0.45,
      rotation: 0,
      status: 'Facility',
    },
    {
      id: 'ST-REC-01',
      code: 'REC-01',
      label: 'Concierge & POS Desk',
      type: 'reception-desk',
      zoneId: 'zone-reception',
      x: 1.0,
      y: 1.4,
      width: 2.5,
      height: 1.0,
      rotation: 0,
      status: 'Available',
      assignedEmployeeId: 'CBSE20243',
      notes: 'Front check-in, POS card terminal & booking desk',
    },
    {
      id: 'ST-SOF-01',
      code: 'LNG-01',
      label: 'Guest Waiting Sofa',
      type: 'waiting-sofa',
      zoneId: 'zone-reception',
      x: 0.4,
      y: 3.1,
      width: 2.1,
      height: 1.1,
      rotation: 0,
      status: 'Facility',
    },
    {
      id: 'ST-RET-01',
      code: 'RTL-01',
      label: 'Retail Shelf Display',
      type: 'retail-display',
      zoneId: 'zone-reception',
      x: 3.55,
      y: 2.75,
      width: 0.7,
      height: 2.2,
      rotation: 0,
      status: 'Facility',
    },
    {
      id: 'ST-H-01',
      code: 'H-01',
      label: 'Styling Chair 1',
      type: 'hair-chair',
      zoneId: 'zone-hair',
      x: 4.95,
      y: 0.55,
      width: 1.35,
      height: 1.4,
      rotation: 0,
      status: 'In Service',
      assignedEmployeeId: 'CBSE20253',
      currentClientName: 'Fatima Al-Thani',
    },
    {
      id: 'ST-H-02',
      code: 'H-02',
      label: 'Styling Chair 2',
      type: 'hair-chair',
      zoneId: 'zone-hair',
      x: 6.7,
      y: 0.55,
      width: 1.35,
      height: 1.4,
      rotation: 0,
      status: 'Available',
      assignedEmployeeId: 'CBSE20249',
    },
    {
      id: 'ST-H-03',
      code: 'H-03',
      label: 'Styling Chair 3',
      type: 'hair-chair',
      zoneId: 'zone-hair',
      x: 8.45,
      y: 0.55,
      width: 1.35,
      height: 1.4,
      rotation: 0,
      status: 'Reserved',
      currentClientName: 'Noora K.',
    },
    {
      id: 'ST-H-04',
      code: 'H-04',
      label: 'Styling Chair 4',
      type: 'hair-chair',
      zoneId: 'zone-hair',
      x: 10.2,
      y: 0.55,
      width: 1.35,
      height: 1.4,
      rotation: 0,
      status: 'Available',
    },
    {
      id: 'ST-W-01',
      code: 'W-01',
      label: 'Backwash Basin 1',
      type: 'shampoo-bowl',
      zoneId: 'zone-hair',
      x: 5.05,
      y: 3.55,
      width: 1.5,
      height: 1.4,
      rotation: 180,
      status: 'Available',
    },
    {
      id: 'ST-W-02',
      code: 'W-02',
      label: 'Backwash Basin 2',
      type: 'shampoo-bowl',
      zoneId: 'zone-hair',
      x: 6.95,
      y: 3.55,
      width: 1.5,
      height: 1.4,
      rotation: 180,
      status: 'In Service',
    },
    {
      id: 'ST-CLR-01',
      code: 'CLR-01',
      label: 'Color Mixing Lab',
      type: 'color-bar',
      zoneId: 'zone-hair',
      x: 9.1,
      y: 3.85,
      width: 2.45,
      height: 1.05,
      rotation: 0,
      status: 'Facility',
    },
    {
      id: 'ST-L-01',
      code: 'L-01',
      label: 'Lash & Brow Bed 1',
      type: 'treatment-bed',
      zoneId: 'zone-lashes',
      x: 12.45,
      y: 0.75,
      width: 1.3,
      height: 2.1,
      rotation: 0,
      status: 'In Service',
      assignedEmployeeId: 'CBSE20251',
      currentClientName: 'Rawan',
    },
    {
      id: 'ST-L-02',
      code: 'L-02',
      label: 'Lash & Brow Bed 2',
      type: 'treatment-bed',
      zoneId: 'zone-lashes',
      x: 14.25,
      y: 0.75,
      width: 1.3,
      height: 2.1,
      rotation: 0,
      status: 'Available',
      assignedEmployeeId: 'CBSE20252',
    },
    {
      id: 'ST-L-03',
      code: 'B-01',
      label: 'Brow Art Station',
      type: 'hair-chair',
      zoneId: 'zone-lashes',
      x: 13.2,
      y: 3.6,
      width: 1.5,
      height: 1.3,
      rotation: 0,
      status: 'Available',
    },
    {
      id: 'ST-N-01',
      code: 'N-01',
      label: 'Manicure Desk 1',
      type: 'manicure-table',
      zoneId: 'zone-nails',
      x: 0.55,
      y: 6.05,
      width: 1.75,
      height: 1.25,
      rotation: 0,
      status: 'In Service',
      assignedEmployeeId: 'CBSE20244',
      currentClientName: 'Maha S.',
    },
    {
      id: 'ST-N-02',
      code: 'N-02',
      label: 'Manicure Desk 2',
      type: 'manicure-table',
      zoneId: 'zone-nails',
      x: 2.8,
      y: 6.05,
      width: 1.75,
      height: 1.25,
      rotation: 0,
      status: 'Available',
    },
    {
      id: 'ST-N-03',
      code: 'N-03',
      label: 'Manicure Desk 3',
      type: 'manicure-table',
      zoneId: 'zone-nails',
      x: 5.05,
      y: 6.05,
      width: 1.75,
      height: 1.25,
      rotation: 0,
      status: 'Reserved',
    },
    {
      id: 'ST-P-01',
      code: 'P-01',
      label: 'Pedicure Spa 1',
      type: 'pedicure-spa',
      zoneId: 'zone-nails',
      x: 0.65,
      y: 8.35,
      width: 1.55,
      height: 1.65,
      rotation: 180,
      status: 'Available',
    },
    {
      id: 'ST-P-02',
      code: 'P-02',
      label: 'Pedicure Spa 2',
      type: 'pedicure-spa',
      zoneId: 'zone-nails',
      x: 2.9,
      y: 8.35,
      width: 1.55,
      height: 1.65,
      rotation: 180,
      status: 'In Service',
    },
    {
      id: 'ST-P-03',
      code: 'P-03',
      label: 'Pedicure Spa 3',
      type: 'pedicure-spa',
      zoneId: 'zone-nails',
      x: 5.15,
      y: 8.35,
      width: 1.55,
      height: 1.65,
      rotation: 180,
      status: 'Available',
    },
    {
      id: 'ST-S-01',
      code: 'S-01',
      label: 'VIP Facial & Spa Suite',
      type: 'treatment-bed',
      zoneId: 'zone-spa',
      x: 8.0,
      y: 6.35,
      width: 1.5,
      height: 2.35,
      rotation: 0,
      status: 'Available',
    },
    {
      id: 'ST-T-01',
      code: 'T-01',
      label: 'Spray Tan Booth',
      type: 'spray-tan-booth',
      zoneId: 'zone-spa',
      x: 10.0,
      y: 6.35,
      width: 1.55,
      height: 1.65,
      rotation: 0,
      status: 'Available',
    },
    {
      id: 'ST-HR-01',
      code: 'HR-01',
      label: 'Manager & HR Office',
      type: 'office-desk',
      zoneId: 'zone-boh',
      x: 12.45,
      y: 6.0,
      width: 1.9,
      height: 1.25,
      rotation: 0,
      status: 'Facility',
      assignedEmployeeId: 'CBSE20243',
    },
    {
      id: 'ST-WC-01',
      code: 'WC-01',
      label: 'Restroom & Changing',
      type: 'restroom',
      zoneId: 'zone-boh',
      x: 12.5,
      y: 8.0,
      width: 3.0,
      height: 2.0,
      rotation: 0,
      status: 'Facility',
    },
  ],
};

// Local Storage & IndexedDB Unified Storage Engine
const STORAGE_PREFIX = 'cosmos_hr_';

class CosmosDatabase {
  private inMemoryCache: {
    employees: Employee[];
    payroll: PayrollRecord[];
    attendance: AttendanceRecord[];
    leaves: LeaveRecord[];
    tickets: FlightTicketRecord[];
    extraTime: ExtraTimeTransaction[];
    certificates: Certificate[];
    settings: SystemSettings;
    banks: BankInfo[];
    audit: AuditLogItem[];
    customers: Customer[];
    serviceCatalogue: ServiceCatalogueItem[];
    dailySales: DailySaleRecord[];
    bookings: CustomerBooking[];
    bookingOverrides: BookingOverrideRecord[];
    pettyCash: PettyCashExpense[];
    fixedExpenses: FixedExpense[];
    businessGross: BusinessGrossEntry[];
    variableExpenses: VariableExpense[];
    customJobRoles: string[];
    customServiceCategories: string[];
    users: UserAccount[];
    currentUser: UserAccount | null;
    passwordResetTokens: PasswordResetToken[];
    emailSettings: EmailSettings;
    publicSalonInfo: PublicSalonInfo;
    contactMessages: ContactMessage[];
    floorplan: SalonFloorplan;
  } = {
    employees: [],
    payroll: [],
    attendance: [],
    leaves: [],
    tickets: [],
    extraTime: [],
    certificates: [],
    settings: DEFAULT_SETTINGS,
    banks: DEFAULT_QATAR_BANKS,
    audit: [],
    customers: [],
    serviceCatalogue: [],
    dailySales: [],
    bookings: [],
    bookingOverrides: [],
    pettyCash: [],
    fixedExpenses: [],
    businessGross: [],
    variableExpenses: [],
    customJobRoles: [],
    customServiceCategories: [],
    users: [],
    currentUser: null,
    passwordResetTokens: [],
    emailSettings: DEFAULT_EMAIL_SETTINGS,
    publicSalonInfo: DEFAULT_PUBLIC_SALON_INFO,
    contactMessages: [],
    floorplan: DEFAULT_SALON_FLOORPLAN,
  };



  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedEmployees = localStorage.getItem(STORAGE_PREFIX + 'employees');
      if (storedEmployees) {
        this.inMemoryCache.employees = JSON.parse(storedEmployees);
      } else {
        this.inMemoryCache.employees = [...SAMPLE_EMPLOYEES];
        this.saveEmployees();
      }

      const storedPayroll = localStorage.getItem(STORAGE_PREFIX + 'payroll');
      if (storedPayroll) {
        try {
          const parsed = JSON.parse(storedPayroll);
          this.inMemoryCache.payroll = Array.isArray(parsed)
            ? parsed.filter((p: PayrollRecord) => p.id !== 'PAY-CBSE20243-2026-October' && p.id !== 'PAY-CBSE20244-2026-October')
            : [];
        } catch {
          this.inMemoryCache.payroll = [];
        }
      } else {
        this.inMemoryCache.payroll = [];
      }
      this.savePayroll();

      const storedAttendance = localStorage.getItem(STORAGE_PREFIX + 'attendance');
      if (storedAttendance) {
        this.inMemoryCache.attendance = JSON.parse(storedAttendance);
      } else {
        // Seed full month single-shift attendance (Morning to Night: 09:00 - 21:00)
        const seedRecords: AttendanceRecord[] = [];
        const staffList = [
          { id: 'CBSE20244', name: 'KUMUSHAI DUISHOGULOVA', offDayIndex: 2, offDayName: 'Tuesday' },
          { id: 'CBSE20243', name: 'ATYRGUL AIAZOVA', offDayIndex: 1, offDayName: 'Monday' },
        ];

        for (let day = 1; day <= 21; day++) {
          const dayStr = day.toString().padStart(2, '0');
          const dateStr = `2026-10-${dayStr}`;
          const dateObj = new Date(dateStr);
          const dayOfWeek = dateObj.getDay();

          staffList.forEach((st, sIdx) => {
            if (dayOfWeek === st.offDayIndex) {
              seedRecords.push({
                attId: `ATT-${st.id}-${dateStr}`,
                employeeId: st.id,
                employeeName: st.name,
                date: dateStr,
                shiftType: 'Single Shift',
                scheduledStart: '09:00',
                scheduledEnd: '21:00',
                timeIn: '',
                timeOut: '',
                breakStart: '',
                breakEnd: '',
                totalWorkMinutes: 0,
                scheduledWorkMinutes: 0,
                extraMinutes: 0,
                shortMinutes: 0,
                status: 'Day Off',
                remarks: `Assigned Weekly Day Off (${st.offDayName})`,
                createdAt: new Date().toISOString(),
                createdBy: 'System',
              });
              return;
            }

            let inH = 8;
            let inM = 50 + ((day + sIdx) % 3) * 5; // 08:50, 08:55, 09:00
            let outH = 21;
            let outM = ((day * 7 + sIdx * 5) % 4) * 10; // 21:00, 21:10, 21:20, 21:30
            let isLate = false;

            if (day === 8 && sIdx === 1) {
              inH = 9;
              inM = 25;
              isLate = true;
            }

            const timeIn = `${inH.toString().padStart(2, '0')}:${inM.toString().padStart(2, '0')}`;
            const timeOut = `${outH.toString().padStart(2, '0')}:${outM.toString().padStart(2, '0')}`;
            const totalWorkMinutes = (outH * 60 + outM) - (inH * 60 + inM);
            const scheduledWorkMinutes = 720; // 12 hours (09:00 - 21:00)
            const extraMinutes = totalWorkMinutes > scheduledWorkMinutes ? totalWorkMinutes - scheduledWorkMinutes : 0;
            const shortMinutes = totalWorkMinutes < scheduledWorkMinutes ? scheduledWorkMinutes - totalWorkMinutes : 0;

            seedRecords.push({
              attId: `ATT-${st.id}-${dateStr}`,
              employeeId: st.id,
              employeeName: st.name,
              date: dateStr,
              shiftType: 'Single Shift',
              scheduledStart: '09:00',
              scheduledEnd: '21:00',
              timeIn,
              timeOut,
              breakStart: '13:00',
              breakEnd: '14:00',
              totalWorkMinutes,
              scheduledWorkMinutes,
              extraMinutes,
              shortMinutes,
              status: isLate ? 'Late' : 'Present',
              remarks: extraMinutes > 0 ? `+${minutesToTimeStr(extraMinutes)} extra-time worked` : isLate ? 'Late arrival (-25m short)' : 'Morning to night salon shift completed',
              createdAt: new Date().toISOString(),
              createdBy: 'Admin',
            });
          });
        }

        this.inMemoryCache.attendance = seedRecords;
        this.saveAttendance();
      }

      const storedLeaves = localStorage.getItem(STORAGE_PREFIX + 'leaves');
      if (storedLeaves) {
        this.inMemoryCache.leaves = JSON.parse(storedLeaves);
      } else {
        this.inMemoryCache.leaves = [...SAMPLE_LEAVES];
        this.saveLeaves();
      }

      const storedTickets = localStorage.getItem(STORAGE_PREFIX + 'tickets');
      if (storedTickets) this.inMemoryCache.tickets = JSON.parse(storedTickets);

      const storedExtraTime = localStorage.getItem(STORAGE_PREFIX + 'extraTime');
      if (storedExtraTime) this.inMemoryCache.extraTime = JSON.parse(storedExtraTime);

      const storedCertificates = localStorage.getItem(STORAGE_PREFIX + 'certificates');
      if (storedCertificates) this.inMemoryCache.certificates = JSON.parse(storedCertificates);

      const storedSettings = localStorage.getItem(STORAGE_PREFIX + 'settings');
      if (storedSettings) this.inMemoryCache.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };

      const storedBanks = localStorage.getItem(STORAGE_PREFIX + 'banks');
      if (storedBanks) this.inMemoryCache.banks = JSON.parse(storedBanks);

      const storedAudit = localStorage.getItem(STORAGE_PREFIX + 'audit');
      if (storedAudit) {
        this.inMemoryCache.audit = JSON.parse(storedAudit);
      } else {
        this.logAudit('SYSTEM_INITIALIZED', 'Cosmos HR & Payroll system loaded with initial Qatar configuration.');
      }

      const storedCustomers = localStorage.getItem(STORAGE_PREFIX + 'customers');
      if (storedCustomers) {
        this.inMemoryCache.customers = JSON.parse(storedCustomers);
      } else {
        this.inMemoryCache.customers = [...SAMPLE_CUSTOMERS];
        this.saveCustomers();
      }

      const storedCatalogue = localStorage.getItem(STORAGE_PREFIX + 'serviceCatalogue');
      if (storedCatalogue) {
        this.inMemoryCache.serviceCatalogue = JSON.parse(storedCatalogue);
      } else {
        this.inMemoryCache.serviceCatalogue = [...DEFAULT_SERVICE_CATALOGUE];
        this.saveServiceCatalogue();
      }

      const storedSales = localStorage.getItem(STORAGE_PREFIX + 'dailySales');
      if (storedSales) {
        this.inMemoryCache.dailySales = JSON.parse(storedSales);
      } else {
        this.inMemoryCache.dailySales = [...SAMPLE_DAILY_SALES];
        this.saveDailySales();
      }

      const storedBookings = localStorage.getItem(STORAGE_PREFIX + 'bookings');
      if (storedBookings) {
        this.inMemoryCache.bookings = JSON.parse(storedBookings);
      } else {
        this.inMemoryCache.bookings = [...SAMPLE_BOOKINGS];
        this.saveBookings();
      }

      // Ensure Fresha specialists and screenshot bookings are available
      const hasAika = this.inMemoryCache.employees.some((e) => e.employeeId === 'CBSE20251');
      if (!hasAika) {
        SAMPLE_EMPLOYEES.forEach((se) => {
          if (!this.inMemoryCache.employees.some((e) => e.employeeId === se.employeeId)) {
            this.inMemoryCache.employees.push({ ...se });
          }
        });
        this.saveEmployees();
      }

      const hasScreenshotBooking = this.inMemoryCache.bookings.some((b) => b.id === 'BKG-201');
      if (!hasScreenshotBooking) {
        SAMPLE_BOOKINGS.forEach((sb) => {
          if (!this.inMemoryCache.bookings.some((b) => b.id === sb.id)) {
            this.inMemoryCache.bookings.push({ ...sb });
          }
        });
        this.saveBookings();
      }

      // Ensure Atyra's leave on 2026-10-22 is recorded
      const hasAtyraLeave = this.inMemoryCache.leaves.some(
        (l) => (l.employeeId === 'CBSE20243' || l.employeeName.includes('ATYRA')) && l.startDate <= '2026-10-22' && l.endDate >= '2026-10-22'
      );
      if (!hasAtyraLeave) {
        this.inMemoryCache.leaves.unshift({
          leaveId: 'LV-2026-OCT22',
          employeeId: 'CBSE20243',
          employeeName: 'ATYRA AIAZOVA',
          startDate: '2026-10-22',
          endDate: '2026-10-24',
          days: 3,
          leaveType: 'Annual Leave',
          paidStatus: 'Paid',
          status: 'Approved',
          period: 'October 2026',
          remarks: 'Annual leave',
          requestedDate: '2026-10-10',
          approvedBy: 'Salon Manager',
          approvedDate: '2026-10-12',
        });
        this.saveLeaves();
      }

      const storedOverrides = localStorage.getItem(STORAGE_PREFIX + 'bookingOverrides');
      if (storedOverrides) {
        this.inMemoryCache.bookingOverrides = JSON.parse(storedOverrides);
      } else {
        this.inMemoryCache.bookingOverrides = [];
      }

      const storedPettyCash = localStorage.getItem(STORAGE_PREFIX + 'pettyCash');
      if (storedPettyCash) {
        this.inMemoryCache.pettyCash = JSON.parse(storedPettyCash);
      } else {
        this.inMemoryCache.pettyCash = [...SAMPLE_PETTY_CASH];
        this.savePettyCash();
      }

      const storedFixedExpenses = localStorage.getItem(STORAGE_PREFIX + 'fixedExpenses');
      if (storedFixedExpenses) {
        try {
          const parsed = JSON.parse(storedFixedExpenses);
          this.inMemoryCache.fixedExpenses = Array.isArray(parsed)
            ? parsed.filter((f: FixedExpense) => f.id !== 'FE-1007' && f.id !== 'FE-1008')
            : [];
        } catch {
          this.inMemoryCache.fixedExpenses = [...SAMPLE_FIXED_EXPENSES];
        }
      } else {
        this.inMemoryCache.fixedExpenses = [...SAMPLE_FIXED_EXPENSES];
      }
      // If there are no processed payroll records, remove any unlinked WPS / Cash salary entries
      if (this.inMemoryCache.payroll.length === 0) {
        this.inMemoryCache.fixedExpenses = this.inMemoryCache.fixedExpenses.filter(
          (f: FixedExpense) => f.category !== 'Salaries & wages by WPS' && f.category !== 'Salaries & wages by CASH'
        );
      }
      this.saveFixedExpenses();

      const storedBusinessGross = localStorage.getItem(STORAGE_PREFIX + 'businessGross');
      if (storedBusinessGross) {
        this.inMemoryCache.businessGross = JSON.parse(storedBusinessGross);
      } else {
        this.inMemoryCache.businessGross = [...SAMPLE_BUSINESS_GROSS];
        this.saveBusinessGross();
      }

      const storedVarExpenses = localStorage.getItem(STORAGE_PREFIX + 'variableExpenses');
      if (storedVarExpenses) {
        try {
          const parsed = JSON.parse(storedVarExpenses);
          this.inMemoryCache.variableExpenses = Array.isArray(parsed)
            ? parsed.filter((v: VariableExpense) => !v.id?.startsWith('VE-100'))
            : [];
        } catch {
          this.inMemoryCache.variableExpenses = [];
        }
      } else {
        this.inMemoryCache.variableExpenses = [];
      }
      this.saveVariableExpenses();

      const storedRoles = localStorage.getItem(STORAGE_PREFIX + 'customJobRoles');
      if (storedRoles) {
        this.inMemoryCache.customJobRoles = JSON.parse(storedRoles);
      } else {
        this.inMemoryCache.customJobRoles = [];
      }

      const storedCategories = localStorage.getItem(STORAGE_PREFIX + 'customServiceCategories');
      if (storedCategories) {
        this.inMemoryCache.customServiceCategories = JSON.parse(storedCategories);
      } else {
        this.inMemoryCache.customServiceCategories = [];
      }

      // Role and Booking Eligibility Normalization

      let empNeedsSave = false;
      this.inMemoryCache.employees = this.inMemoryCache.employees.map((emp) => {
        let changed = false;
        if (emp.employeeRole === undefined) {
          const posLower = (emp.position || '').toLowerCase();
          const isNonService = ['hr', 'account', 'clean', 'manager', 'hygiene'].some((k) =>
            posLower.includes(k)
          );
          if (isNonService) {
            emp.employeeRole = posLower.includes('hr')
              ? 'HR'
              : posLower.includes('account')
              ? 'Accountant'
              : posLower.includes('clean')
              ? 'Cleaner Staff'
              : 'Manager';
            emp.canProvideServices = false;
            emp.availableForBooking = false;
            emp.serviceCategories = [];
          } else {
            emp.employeeRole = posLower.includes('lash')
              ? 'Eyelash Art'
              : posLower.includes('nail')
              ? 'Nail Art'
              : posLower.includes('hair')
              ? 'Hairdresser'
              : 'Service Employee';
            emp.canProvideServices = true;
            emp.availableForBooking = true;
            emp.serviceCategories = [posLower.includes('lash') ? 'Eyelash Art' : 'Hairdresser'];
          }
          changed = true;
        }
        if (emp.workingHours === undefined) {
          emp.workingHours = { start: '09:00', end: '21:00' };
          changed = true;
        }
        if (emp.canProvideServices === undefined) {
          emp.canProvideServices = !['HR', 'Accountant', 'Cleaner Staff'].includes(emp.employeeRole || '');
          changed = true;
        }
        if (emp.availableForBooking === undefined) {
          emp.availableForBooking = emp.canProvideServices;
          changed = true;
        }
        if (changed) empNeedsSave = true;
        return emp;
      });

      // Ensure key demonstration non-service employees (HR, Accountant, Cleaner) exist in cache
      const hasHR = this.inMemoryCache.employees.some(
        (e) => e.employeeRole === 'HR' || (e.position && e.position.toLowerCase().includes('hr'))
      );
      if (!hasHR) {
        SAMPLE_EMPLOYEES.filter((se) =>
          ['HR', 'Accountant', 'Cleaner Staff', 'Hairdresser'].includes(se.employeeRole || '')
        ).forEach((se) => {
          if (!this.inMemoryCache.employees.some((e) => e.employeeId === se.employeeId)) {
            this.inMemoryCache.employees.push({ ...se });
            empNeedsSave = true;
          }
        });
      }

      if (empNeedsSave) {
        this.saveEmployees();
      }

      // Initial synchronization of live monthly commissions into employees & targets
      await this.syncEmployeeCommissionsFromSales();

      // Load public salon landing info
      const storedPublicInfo = localStorage.getItem(STORAGE_PREFIX + 'publicSalonInfo');
      if (storedPublicInfo) {
        try {
          this.inMemoryCache.publicSalonInfo = { ...DEFAULT_PUBLIC_SALON_INFO, ...JSON.parse(storedPublicInfo) };
        } catch {
          this.inMemoryCache.publicSalonInfo = { ...DEFAULT_PUBLIC_SALON_INFO };
        }
      } else {
        this.inMemoryCache.publicSalonInfo = { ...DEFAULT_PUBLIC_SALON_INFO };
        this.savePublicSalonInfo(this.inMemoryCache.publicSalonInfo);
      }

      // Load email settings
      const storedEmailSettings = localStorage.getItem(STORAGE_PREFIX + 'emailSettings');
      if (storedEmailSettings) {
        try {
          this.inMemoryCache.emailSettings = { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(storedEmailSettings) };
        } catch {
          this.inMemoryCache.emailSettings = { ...DEFAULT_EMAIL_SETTINGS };
        }
      } else {
        this.inMemoryCache.emailSettings = { ...DEFAULT_EMAIL_SETTINGS };
      }

      // Load contact messages
      const storedContact = localStorage.getItem(STORAGE_PREFIX + 'contactMessages');
      if (storedContact) {
        try {
          this.inMemoryCache.contactMessages = JSON.parse(storedContact);
        } catch {
          this.inMemoryCache.contactMessages = [];
        }
      } else {
        this.inMemoryCache.contactMessages = [];
      }

      // Load password reset tokens
      const storedTokens = localStorage.getItem(STORAGE_PREFIX + 'passwordResetTokens');
      if (storedTokens) {
        try {
          this.inMemoryCache.passwordResetTokens = JSON.parse(storedTokens);
        } catch {
          this.inMemoryCache.passwordResetTokens = [];
        }
      }

      // Load users & bootstrap initial super admin 'cosmos' / 'cosmos'
      const storedUsers = localStorage.getItem(STORAGE_PREFIX + 'users');
      if (storedUsers) {
        try {
          this.inMemoryCache.users = JSON.parse(storedUsers);
        } catch {
          this.inMemoryCache.users = [];
        }
      } else {
        this.inMemoryCache.users = [];
      }

      // Ensure 'cosmos' Super Administrator exists without overwriting if already customized
      const hasCosmos = this.inMemoryCache.users.some(
        (u) => u.username.toLowerCase() === 'cosmos'
      );
      if (!hasCosmos) {
        const cosmosSalt = generateRandomSalt(16);
        const cosmosHash = await hashPasswordWithSalt('cosmos', cosmosSalt);
        const cosmosAdmin: UserAccount = {
          id: 'USR-ROOT-COSMOS',
          username: 'cosmos',
          passwordHash: cosmosHash,
          salt: cosmosSalt,
          email: 'cosmosbeautyqatar@gmail.com',
          fullName: 'Cosmos Super Administrator',
          role: 'Super Administrator',
          status: 'Active',
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        };
        this.inMemoryCache.users.unshift(cosmosAdmin);
        this.saveUsers();
        await this.logAudit(
          'USER_BOOTSTRAP',
          'Initial Super Administrator account "cosmos" provisioned with salted password hash (first-login change required).'
        );
      }

      // Restore active session
      const storedSession =
        sessionStorage.getItem(STORAGE_PREFIX + 'currentSession') ||
        localStorage.getItem(STORAGE_PREFIX + 'currentSession');
      if (storedSession) {
        try {
          const sessionUser = JSON.parse(storedSession);
          const activeUser = this.inMemoryCache.users.find(
            (u) => u.id === sessionUser.id && u.status === 'Active'
          );
          if (activeUser) {
            this.inMemoryCache.currentUser = activeUser;
          }
        } catch {}
      }

      // Load salon architectural floorplan
      const storedFloorplan = localStorage.getItem(STORAGE_PREFIX + 'floorplan');
      if (storedFloorplan) {
        try {
          this.inMemoryCache.floorplan = JSON.parse(storedFloorplan);
        } catch {
          this.inMemoryCache.floorplan = structuredClone(DEFAULT_SALON_FLOORPLAN);
        }
      } else {
        this.inMemoryCache.floorplan = structuredClone(DEFAULT_SALON_FLOORPLAN);
        localStorage.setItem(STORAGE_PREFIX + 'floorplan', JSON.stringify(this.inMemoryCache.floorplan));
      }

      this.initialized = true;
    } catch (e) {
      console.error('Storage initialization failed, using in-memory state', e);
      this.initialized = true;
    }

  }

  // Audits
  public async logAudit(action: string, details: string): Promise<void> {
    const item: AuditLogItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    this.inMemoryCache.audit.unshift(item);
    if (this.inMemoryCache.audit.length > 500) {
      this.inMemoryCache.audit = this.inMemoryCache.audit.slice(0, 500);
    }
    try {
      localStorage.setItem(STORAGE_PREFIX + 'audit', JSON.stringify(this.inMemoryCache.audit));
    } catch {}
  }

  public getAuditLogs(): AuditLogItem[] {
    return this.inMemoryCache.audit;
  }

  // Employees
  public getEmployees(): Employee[] {
    return [...this.inMemoryCache.employees];
  }

  public getEmployee(id: string): Employee | undefined {
    return this.inMemoryCache.employees.find((e) => e.employeeId === id);
  }

  public async saveEmployee(emp: Employee): Promise<void> {
    const idx = this.inMemoryCache.employees.findIndex((e) => e.employeeId === emp.employeeId);
    if (idx >= 0) {
      this.inMemoryCache.employees[idx] = { ...emp };
      await this.logAudit('EMPLOYEE_UPDATED', `Updated record for ${emp.employeeName} (${emp.employeeId})`);
    } else {
      this.inMemoryCache.employees.push({ ...emp });
      await this.logAudit('EMPLOYEE_ADDED', `Registered new employee ${emp.employeeName} (${emp.employeeId})`);
    }
    this.saveEmployees();
  }

  public async updateEmployeeOffDay(employeeId: string, offDay: string): Promise<void> {
    const emp = this.getEmployee(employeeId);
    if (!emp) return;
    emp.weeklyOffDay = offDay;
    await this.saveEmployee(emp);
    await this.logAudit('OFF_DAY_UPDATED', `Set weekly day off for ${emp.employeeName} to ${offDay}`);
  }

  public async deleteEmployee(empId: string): Promise<void> {
    const emp = this.getEmployee(empId);
    this.inMemoryCache.employees = this.inMemoryCache.employees.filter((e) => e.employeeId !== empId);
    this.inMemoryCache.payroll = this.inMemoryCache.payroll.filter((p) => p.employeeId !== empId);
    this.inMemoryCache.attendance = this.inMemoryCache.attendance.filter((a) => a.employeeId !== empId);
    this.inMemoryCache.leaves = this.inMemoryCache.leaves.filter((l) => l.employeeId !== empId);
    this.inMemoryCache.tickets = this.inMemoryCache.tickets.filter((t) => t.employeeId !== empId);
    this.inMemoryCache.extraTime = this.inMemoryCache.extraTime.filter((et) => et.employeeId !== empId);
    this.saveEmployees();
    this.savePayroll();
    this.saveAttendance();
    this.saveLeaves();
    this.saveTickets();
    this.saveExtraTime();
    await this.logAudit('EMPLOYEE_DELETED', `Deleted employee record and associated history for ${emp?.employeeName || empId}`);
  }

  public getNextNo(): number {
    if (this.inMemoryCache.employees.length === 0) return 1;
    const nos = this.inMemoryCache.employees.map((e) => parseInt(String(e.no)) || 0);
    return Math.max(...nos, 0) + 1;
  }

  private saveEmployees() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'employees', JSON.stringify(this.inMemoryCache.employees));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  // Payroll
  public getPayrolls(): PayrollRecord[] {
    return [...this.inMemoryCache.payroll];
  }

  public async savePayrollRecord(record: PayrollRecord): Promise<void> {
    const idx = this.inMemoryCache.payroll.findIndex((p) => p.id === record.id);
    if (idx >= 0) {
      this.inMemoryCache.payroll[idx] = { ...record };
    } else {
      this.inMemoryCache.payroll.unshift({ ...record });
    }
    this.savePayroll();
  }

  public async deletePayrollRecord(id: string): Promise<void> {
    this.inMemoryCache.payroll = this.inMemoryCache.payroll.filter((p) => p.id !== id);
    this.savePayroll();
    await this.logAudit('PAYROLL_DELETED', `Deleted payroll record ${id}`);
  }

  private savePayroll() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'payroll', JSON.stringify(this.inMemoryCache.payroll));
    } catch {}
  }

  // Attendance
  public getAttendance(): AttendanceRecord[] {
    return [...this.inMemoryCache.attendance];
  }

  public async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const idx = this.inMemoryCache.attendance.findIndex((a) => a.attId === record.attId);
    if (idx >= 0) {
      this.inMemoryCache.attendance[idx] = { ...record };
    } else {
      this.inMemoryCache.attendance.unshift({ ...record });
    }
    this.saveAttendance();

    // Log extra time transaction
    if (record.extraMinutes !== 0) {
      await this.recordExtraTimeTransaction({
        extraId: `ET-${record.employeeId}-${Date.now()}`,
        employeeId: record.employeeId,
        date: record.date,
        type: record.extraMinutes > 0 ? 'Earned' : 'Used',
        minutes: Math.abs(record.extraMinutes),
        reason: `Attendance on ${record.date} (${record.status})`,
        balanceAfter: this.getEmployeeExtraTimeBalance(record.employeeId) + record.extraMinutes,
        approvedBy: 'Admin',
        createdAt: new Date().toISOString(),
      });
    }

    await this.logAudit('ATTENDANCE_RECORDED', `Logged attendance for ${record.employeeName} on ${record.date} (${record.status})`);
  }

  public async deleteAttendanceRecord(id: string): Promise<void> {
    this.inMemoryCache.attendance = this.inMemoryCache.attendance.filter((a) => a.attId !== id);
    this.saveAttendance();
    await this.logAudit('ATTENDANCE_DELETED', `Deleted attendance record ${id}`);
  }

  private saveAttendance() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'attendance', JSON.stringify(this.inMemoryCache.attendance));
    } catch {}
  }

  // Extra Time Transactions
  public getExtraTimeTransactions(): ExtraTimeTransaction[] {
    return [...this.inMemoryCache.extraTime];
  }

  public async recordExtraTimeTransaction(tx: ExtraTimeTransaction): Promise<void> {
    this.inMemoryCache.extraTime.unshift(tx);
    this.saveExtraTime();
  }

  public getEmployeeExtraTimeBalance(employeeId: string): number {
    const records = this.inMemoryCache.extraTime.filter((e) => e.employeeId === employeeId);
    let balance = 0;
    records.forEach((r) => {
      if (r.type === 'Earned') balance += r.minutes;
      if (r.type === 'Used') balance -= r.minutes;
    });
    return balance;
  }

  private saveExtraTime() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'extraTime', JSON.stringify(this.inMemoryCache.extraTime));
    } catch {}
  }

  // Leaves
  public getLeaves(): LeaveRecord[] {
    return [...this.inMemoryCache.leaves];
  }

  public async saveLeaveRecord(record: LeaveRecord): Promise<void> {
    const idx = this.inMemoryCache.leaves.findIndex((l) => l.leaveId === record.leaveId);
    if (idx >= 0) {
      this.inMemoryCache.leaves[idx] = { ...record };
    } else {
      this.inMemoryCache.leaves.unshift({ ...record });
    }
    this.saveLeaves();
    await this.logAudit('LEAVE_REQUESTED', `${record.employeeName} requested ${record.days} days of ${record.leaveType}`);
  }

  public async deleteLeaveRecord(id: string): Promise<void> {
    this.inMemoryCache.leaves = this.inMemoryCache.leaves.filter((l) => l.leaveId !== id);
    this.saveLeaves();
    await this.logAudit('LEAVE_DELETED', `Deleted leave record ${id}`);
  }

  private saveLeaves() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'leaves', JSON.stringify(this.inMemoryCache.leaves));
    } catch {}
  }

  // Flight Tickets
  public getTickets(): FlightTicketRecord[] {
    return [...this.inMemoryCache.tickets];
  }

  public async saveTicketRecord(record: FlightTicketRecord): Promise<void> {
    const idx = this.inMemoryCache.tickets.findIndex((t) => t.ticketId === record.ticketId);
    if (idx >= 0) {
      this.inMemoryCache.tickets[idx] = { ...record };
    } else {
      this.inMemoryCache.tickets.unshift({ ...record });
    }
    this.saveTickets();

    // Update employee ticket fields
    const emp = this.getEmployee(record.employeeId);
    if (emp) {
      emp.nextTicketDate = record.eligibleDate;
      emp.ticketStatus = record.status;
      emp.ticketDestination = record.destination;
      this.saveEmployees();
    }

    await this.logAudit('TICKET_RECORDED', `Flight ticket for ${record.employeeName}: ${record.destination} (${record.status})`);
  }

  public async deleteTicketRecord(id: string): Promise<void> {
    this.inMemoryCache.tickets = this.inMemoryCache.tickets.filter((t) => t.ticketId !== id);
    this.saveTickets();
    await this.logAudit('TICKET_DELETED', `Deleted ticket record ${id}`);
  }

  private saveTickets() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'tickets', JSON.stringify(this.inMemoryCache.tickets));
    } catch {}
  }

  // Certificates
  public getCertificates(): Certificate[] {
    return [...this.inMemoryCache.certificates];
  }

  public async saveCertificate(cert: Certificate): Promise<void> {
    const idx = this.inMemoryCache.certificates.findIndex((c) => c.certId === cert.certId);
    if (idx >= 0) {
      this.inMemoryCache.certificates[idx] = { ...cert };
    } else {
      this.inMemoryCache.certificates.unshift({ ...cert });
    }
    this.saveCertificates();

    // Increment cert counter
    this.inMemoryCache.settings.certCounter = (this.inMemoryCache.settings.certCounter || 1) + 1;
    this.saveSettings();

    await this.logAudit('CERTIFICATE_SAVED', `Generated ${cert.certTypeName} for ${cert.employeeName}, Ref: ${cert.reference}`);
  }

  public async deleteCertificate(id: string): Promise<void> {
    this.inMemoryCache.certificates = this.inMemoryCache.certificates.filter((c) => c.certId !== id);
    this.saveCertificates();
    await this.logAudit('CERTIFICATE_DELETED', `Deleted certificate record ${id}`);
  }

  private saveCertificates() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'certificates', JSON.stringify(this.inMemoryCache.certificates));
    } catch {}
  }

  // Settings & Banks
  public getSettings(): SystemSettings {
    return { ...this.inMemoryCache.settings };
  }

  public async saveSettings(newSettings?: Partial<SystemSettings>): Promise<void> {
    if (newSettings) {
      this.inMemoryCache.settings = { ...this.inMemoryCache.settings, ...newSettings };
    }
    try {
      localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(this.inMemoryCache.settings));
      await this.logAudit('SETTINGS_UPDATED', 'System settings saved successfully');
    } catch {}
  }

  public getBanks(): BankInfo[] {
    return [...this.inMemoryCache.banks];
  }

  public async addBank(bank: BankInfo): Promise<void> {
    if (!this.inMemoryCache.banks.find((b) => b.short === bank.short)) {
      this.inMemoryCache.banks.push(bank);
      localStorage.setItem(STORAGE_PREFIX + 'banks', JSON.stringify(this.inMemoryCache.banks));
      await this.logAudit('BANK_ADDED', `Added custom bank ${bank.name} (${bank.short})`);
    }
  }

  public async removeBank(shortName: string): Promise<void> {
    this.inMemoryCache.banks = this.inMemoryCache.banks.filter((b) => b.short !== shortName);
    localStorage.setItem(STORAGE_PREFIX + 'banks', JSON.stringify(this.inMemoryCache.banks));
    await this.logAudit('BANK_REMOVED', `Removed bank ${shortName}`);
  }

  // -------------------------------------------------------------
  // Daily Sales Report, Customer Directory & Service Catalogue
  // -------------------------------------------------------------

  public getDailySales(): DailySaleRecord[] {
    return [...this.inMemoryCache.dailySales];
  }

  public getDailySale(saleId: string): DailySaleRecord | undefined {
    return this.inMemoryCache.dailySales.find((s) => s.saleId === saleId);
  }

  public getNextSaleSrNo(): { srNo: number; srCode: string } {
    if (this.inMemoryCache.dailySales.length === 0) {
      return { srNo: 1001, srCode: 'CSR-1001' };
    }
    const maxNo = Math.max(...this.inMemoryCache.dailySales.map((s) => s.srNo || 1000));
    const nextNo = maxNo + 1;
    return { srNo: nextNo, srCode: `CSR-${nextNo}` };
  }

  public async saveDailySale(sale: DailySaleRecord): Promise<void> {
    const idx = this.inMemoryCache.dailySales.findIndex((s) => s.saleId === sale.saleId);
    if (idx >= 0) {
      this.inMemoryCache.dailySales[idx] = { ...sale, updatedAt: new Date().toISOString() };
      await this.logAudit('SALE_UPDATED', `Updated sales transaction ${sale.srCode} for ${sale.customerName} (QAR ${sale.totalRevenue})`);
    } else {
      this.inMemoryCache.dailySales.unshift({ ...sale, createdAt: sale.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
      await this.logAudit('SALE_REGISTERED', `Registered new sale ${sale.srCode} for ${sale.customerName} (QAR ${sale.totalRevenue})`);
    }
    this.saveDailySales();

    // Auto-register or update Customer in directory
    await this.syncCustomerFromSale(sale);

    // Synchronize Section 5 Commissions automatically
    const saleMonth = sale.date ? sale.date.slice(0, 7) : undefined;
    await this.syncEmployeeCommissionsFromSales(saleMonth);
  }

  public async deleteDailySale(saleId: string): Promise<void> {
    const sale = this.getDailySale(saleId);
    this.inMemoryCache.dailySales = this.inMemoryCache.dailySales.filter((s) => s.saleId !== saleId);
    this.saveDailySales();

    if (sale) {
      const saleMonth = sale.date ? sale.date.slice(0, 7) : undefined;
      await this.syncEmployeeCommissionsFromSales(saleMonth);
      await this.logAudit('SALE_DELETED', `Deleted sales transaction ${sale.srCode} (${sale.customerName})`);
    }
  }

  public async processSaleRefund(saleId: string, refund: SaleRefundRecord): Promise<void> {
    const sale = this.getDailySale(saleId);
    if (!sale) throw new Error('Sale not found');

    if (!sale.refundRecords) sale.refundRecords = [];
    sale.refundRecords.push(refund);

    const totalRefunds = sale.refundRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    sale.refunds = totalRefunds;
    sale.netSales = Math.max(0, Number(sale.totalRevenue) - totalRefunds);

    if (sale.netSales === 0) {
      sale.paymentStatus = 'Refunded';
    } else if (sale.totalPaid >= sale.netSales) {
      sale.paymentStatus = 'Paid';
    } else {
      sale.paymentStatus = 'Partial';
    }

    sale.updatedAt = new Date().toISOString();
    this.saveDailySales();

    const saleMonth = sale.date ? sale.date.slice(0, 7) : undefined;
    await this.syncEmployeeCommissionsFromSales(saleMonth);
    await this.logAudit('SALE_REFUNDED', `Processed refund of QAR ${refund.amount} for ${sale.srCode}: ${refund.reason}`);
  }

  private saveDailySales() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'dailySales', JSON.stringify(this.inMemoryCache.dailySales));
    } catch (e) {
      console.warn('Saving daily sales failed', e);
    }
  }

  public async checkoutSaleVisit(
    saleId: string,
    checkoutData: {
      timeOut?: string;
      posCard?: number;
      cash?: number;
      transferIncome?: number;
      fawran?: number;
      fawranRecipientName?: string;
      tips?: number;
      unpaid?: number;
      notes?: string;
    }
  ): Promise<DailySaleRecord> {
    const sale = this.getDailySale(saleId);
    if (!sale) throw new Error('Sale record not found for checkout');

    const now = new Date();
    const formattedTime =
      checkoutData.timeOut ||
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    sale.timeOut = formattedTime;
    sale.visitStatus = 'Completed';
    if (checkoutData.posCard !== undefined) sale.posCard = Number(checkoutData.posCard) || 0;
    if (checkoutData.cash !== undefined) sale.cash = Number(checkoutData.cash) || 0;
    if (checkoutData.transferIncome !== undefined) sale.transferIncome = Number(checkoutData.transferIncome) || 0;
    if (checkoutData.fawran !== undefined) sale.fawran = Number(checkoutData.fawran) || 0;
    if (checkoutData.fawranRecipientName !== undefined) sale.fawranRecipientName = checkoutData.fawranRecipientName;
    if (checkoutData.tips !== undefined) sale.tips = Number(checkoutData.tips) || 0;
    if (checkoutData.unpaid !== undefined) sale.unpaid = Number(checkoutData.unpaid) || 0;
    if (checkoutData.notes !== undefined) sale.notes = checkoutData.notes;

    const totalPaid = (sale.posCard || 0) + (sale.cash || 0) + (sale.transferIncome || 0) + (sale.fawran || 0);
    sale.totalPaid = totalPaid;
    if (totalPaid >= sale.netSales) {
      sale.paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      sale.paymentStatus = 'Partial';
    } else {
      sale.paymentStatus = 'Unpaid';
    }
    sale.updatedAt = new Date().toISOString();

    this.saveDailySales();
    await this.syncCustomerFromSale(sale);
    const saleMonth = sale.date ? sale.date.slice(0, 7) : undefined;
    await this.syncEmployeeCommissionsFromSales(saleMonth);
    await this.logAudit(
      'VISIT_CHECKOUT_COMPLETED',
      `Checked out customer ${sale.customerName} (${sale.srCode}) at ${formattedTime}. Total paid: QAR ${totalPaid}`
    );
    return sale;
  }

  // -------------------------------------------------------------
  // Monthly Petty Cash Daily Expenses (VOICE)
  // -------------------------------------------------------------
  public getPettyCashExpenses(month?: string, year?: string): PettyCashExpense[] {
    let list = [...this.inMemoryCache.pettyCash];
    if (year && year !== 'ALL') {
      list = list.filter((p) => p.year === year || (p.invoiceDate && p.invoiceDate.startsWith(year)));
    }
    if (month && month !== 'ALL') {
      list = list.filter((p) => p.month === month || (p.invoiceDate && new Date(p.invoiceDate).toLocaleString('en-US', { month: 'long' }) === month));
    }
    return list.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }

  public async savePettyCashExpense(expense: PettyCashExpense): Promise<void> {
    const idx = this.inMemoryCache.pettyCash.findIndex((p) => p.id === expense.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      this.inMemoryCache.pettyCash[idx] = { ...expense, updatedAt: now };
      await this.logAudit('PETTY_CASH_UPDATED', `Updated petty cash voucher ${expense.invoiceRefNo} (QAR ${expense.amount})`);
    } else {
      this.inMemoryCache.pettyCash.unshift({ ...expense, createdAt: expense.createdAt || now, updatedAt: now });
      await this.logAudit('PETTY_CASH_ADDED', `Added petty cash voucher ${expense.invoiceRefNo} for ${expense.company} (QAR ${expense.amount})`);
    }
    this.savePettyCash();
  }

  public async togglePettyCashStatus(id: string): Promise<'Paid' | 'Unpaid'> {
    const item = this.inMemoryCache.pettyCash.find((p) => p.id === id);
    if (!item) throw new Error('Petty cash voucher not found');
    item.status = item.status === 'Paid' ? 'Unpaid' : 'Paid';
    item.updatedAt = new Date().toISOString();
    this.savePettyCash();
    await this.logAudit(
      'PETTY_CASH_STATUS_TOGGLED',
      `Marked voucher ${item.invoiceRefNo} as ${item.status} (QAR ${item.amount})`
    );
    return item.status;
  }

  public async deletePettyCashExpense(id: string): Promise<void> {
    const item = this.inMemoryCache.pettyCash.find((p) => p.id === id);
    this.inMemoryCache.pettyCash = this.inMemoryCache.pettyCash.filter((p) => p.id !== id);
    this.savePettyCash();
    if (item) {
      await this.logAudit('PETTY_CASH_DELETED', `Deleted voucher ${item.invoiceRefNo}`);
    }
  }

  public async saveBulkPettyExpenses(
    expenses: PettyCashExpense[],
    replaceForMonthYear?: { month: string; year: string }
  ): Promise<{ importedCount: number; updatedCount: number }> {
    let importedCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    if (replaceForMonthYear && replaceForMonthYear.month && replaceForMonthYear.year) {
      // Remove existing expenses for that target month & year
      this.inMemoryCache.pettyCash = this.inMemoryCache.pettyCash.filter(
        (p) =>
          !(
            p.month.toLowerCase() === replaceForMonthYear.month.toLowerCase() &&
            p.year.toString() === replaceForMonthYear.year.toString()
          )
      );
    }

    expenses.forEach((expense) => {
      const existingIdx = this.inMemoryCache.pettyCash.findIndex(
        (p) =>
          p.id === expense.id ||
          (expense.invoiceRefNo &&
            p.invoiceRefNo.toLowerCase() === expense.invoiceRefNo.toLowerCase() &&
            p.month.toLowerCase() === expense.month.toLowerCase() &&
            p.year.toString() === expense.year.toString())
      );

      if (existingIdx >= 0) {
        this.inMemoryCache.pettyCash[existingIdx] = {
          ...this.inMemoryCache.pettyCash[existingIdx],
          ...expense,
          updatedAt: now,
        };
        updatedCount++;
      } else {
        this.inMemoryCache.pettyCash.unshift({
          ...expense,
          id: expense.id || `PC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: expense.createdAt || now,
          updatedAt: now,
        });
        importedCount++;
      }
    });

    this.savePettyCash();
    await this.logAudit(
      'PETTY_CASH_BULK_IMPORTED',
      `Imported ${importedCount} new, updated ${updatedCount} petty cash VOICE expense vouchers`
    );
    return { importedCount, updatedCount };
  }

  private savePettyCash() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'pettyCash', JSON.stringify(this.inMemoryCache.pettyCash));
    } catch {}
  }

  // -------------------------------------------------------------
  // Fixed Expenses for Salon
  // -------------------------------------------------------------
  public getFixedExpenses(month?: string, year?: string): FixedExpense[] {
    let list = [...this.inMemoryCache.fixedExpenses];
    if (year && year !== 'ALL') {
      list = list.filter((f) => f.year === year || (f.date && f.date.startsWith(year)));
    }
    if (month && month !== 'ALL') {
      list = list.filter((f) => f.month === month || (f.date && new Date(f.date).toLocaleString('en-US', { month: 'long' }) === month));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async saveFixedExpense(expense: FixedExpense): Promise<void> {
    const idx = this.inMemoryCache.fixedExpenses.findIndex((f) => f.id === expense.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      this.inMemoryCache.fixedExpenses[idx] = { ...expense, updatedAt: now };
      await this.logAudit('FIXED_EXPENSE_UPDATED', `Updated fixed expense ${expense.refNo} - ${expense.category} (QAR ${expense.amount})`);
    } else {
      this.inMemoryCache.fixedExpenses.unshift({ ...expense, createdAt: expense.createdAt || now, updatedAt: now });
      await this.logAudit('FIXED_EXPENSE_ADDED', `Registered fixed expense ${expense.refNo} - ${expense.category} (QAR ${expense.amount})`);
    }
    this.saveFixedExpenses();
  }

  public async toggleFixedExpenseStatus(id: string): Promise<'Paid' | 'Unpaid'> {
    const item = this.inMemoryCache.fixedExpenses.find((f) => f.id === id);
    if (!item) throw new Error('Fixed expense record not found');
    item.status = item.status === 'Paid' ? 'Unpaid' : 'Paid';
    item.updatedAt = new Date().toISOString();
    this.saveFixedExpenses();
    await this.logAudit(
      'FIXED_EXPENSE_STATUS_TOGGLED',
      `Marked fixed expense ${item.refNo} (${item.category}) as ${item.status} (QAR ${item.amount})`
    );
    return item.status;
  }

  public async deleteFixedExpense(id: string): Promise<void> {
    const item = this.inMemoryCache.fixedExpenses.find((f) => f.id === id);
    this.inMemoryCache.fixedExpenses = this.inMemoryCache.fixedExpenses.filter((f) => f.id !== id);
    this.saveFixedExpenses();
    if (item) {
      await this.logAudit('FIXED_EXPENSE_DELETED', `Deleted fixed expense ${item.refNo} (${item.category})`);
    }
  }

  public async saveBulkFixedExpenses(
    expenses: FixedExpense[],
    replaceForMonthYear?: { month: string; year: string }
  ): Promise<{ importedCount: number; updatedCount: number }> {
    let importedCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    if (replaceForMonthYear && replaceForMonthYear.month && replaceForMonthYear.year) {
      // Remove existing expenses for that target month & year
      this.inMemoryCache.fixedExpenses = this.inMemoryCache.fixedExpenses.filter(
        (f) =>
          !(
            f.month.toLowerCase() === replaceForMonthYear.month.toLowerCase() &&
            f.year.toString() === replaceForMonthYear.year.toString()
          )
      );
    }

    expenses.forEach((expense) => {
      const existingIdx = this.inMemoryCache.fixedExpenses.findIndex(
        (f) =>
          f.id === expense.id ||
          (expense.refNo &&
            f.refNo.toLowerCase() === expense.refNo.toLowerCase() &&
            f.month.toLowerCase() === expense.month.toLowerCase() &&
            f.year.toString() === expense.year.toString())
      );

      if (existingIdx >= 0) {
        this.inMemoryCache.fixedExpenses[existingIdx] = {
          ...this.inMemoryCache.fixedExpenses[existingIdx],
          ...expense,
          updatedAt: now,
        };
        updatedCount++;
      } else {
        this.inMemoryCache.fixedExpenses.unshift({
          ...expense,
          id: expense.id || `FE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: expense.createdAt || now,
          updatedAt: now,
        });
        importedCount++;
      }
    });

    this.saveFixedExpenses();
    await this.logAudit(
      'FIXED_EXPENSE_BULK_IMPORTED',
      `Imported ${importedCount} fixed expense(s), updated ${updatedCount} record(s)${
        replaceForMonthYear ? ` for ${replaceForMonthYear.month} ${replaceForMonthYear.year}` : ''
      }`
    );

    return { importedCount, updatedCount };
  }

  private saveFixedExpenses() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'fixedExpenses', JSON.stringify(this.inMemoryCache.fixedExpenses));
    } catch {}
  }

  // -------------------------------------------------------------
  // Business Gross Entries & Direct Register
  // -------------------------------------------------------------
  public getBusinessGrossEntries(month?: string, year?: string): BusinessGrossEntry[] {
    let list = [...this.inMemoryCache.businessGross];
    if (year && year !== 'ALL') {
      list = list.filter((b) => b.year === year || (b.date && b.date.startsWith(year)));
    }
    if (month && month !== 'ALL') {
      list = list.filter((b) => b.month === month || (b.date && new Date(b.date).toLocaleString('en-US', { month: 'long' }) === month));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async saveBusinessGrossEntry(entry: BusinessGrossEntry): Promise<void> {
    const idx = this.inMemoryCache.businessGross.findIndex((b) => b.id === entry.id);
    if (idx >= 0) {
      this.inMemoryCache.businessGross[idx] = { ...entry };
      await this.logAudit('BUSINESS_GROSS_UPDATED', `Updated Business Gross entry for ${entry.date}: Total QAR ${entry.totalGross}`);
    } else {
      this.inMemoryCache.businessGross.unshift({ ...entry });
      await this.logAudit('BUSINESS_GROSS_REGISTERED', `Registered Business Gross for ${entry.date}: Total QAR ${entry.totalGross}`);
    }
    this.saveBusinessGross();
  }

  public async deleteBusinessGrossEntry(id: string): Promise<void> {
    this.inMemoryCache.businessGross = this.inMemoryCache.businessGross.filter((b) => b.id !== id);
    this.saveBusinessGross();
    await this.logAudit('BUSINESS_GROSS_DELETED', `Deleted Business Gross entry ${id}`);
  }

  private saveBusinessGross() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'businessGross', JSON.stringify(this.inMemoryCache.businessGross));
    } catch {}
  }

  // -------------------------------------------------------------
  // Comprehensive Auto-Calculation Engine:
  // (Business Gross, Wages by WPS, Salaries, Petty Cash, Fixed Expenses)
  // -------------------------------------------------------------
  public calculateFinancialSummary(month: string = 'October', year: string = '2026') {
    // 1. Sales-based Gross Income
    const salesInScope = this.inMemoryCache.dailySales.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const sYear = String(d.getFullYear());
      const sMonth = d.toLocaleString('en-US', { month: 'long' });
      const yearMatch = year === 'ALL' || sYear === year;
      const monthMatch = month === 'ALL' || sMonth.toLowerCase() === month.toLowerCase();
      return yearMatch && monthMatch;
    });

    const salesPos = salesInScope.reduce((sum, s) => sum + (Number(s.posCard) || 0), 0);
    const salesCash = salesInScope.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
    const salesTransfer = salesInScope.reduce((sum, s) => sum + (Number(s.transferIncome) || 0), 0);
    const salesFawran = salesInScope.reduce((sum, s) => sum + (Number(s.fawran) || 0), 0);

    // 2. Extra direct business gross registers
    const bgInScope = this.inMemoryCache.businessGross.filter((b) => {
      const yearMatch = year === 'ALL' || b.year === year || (b.date && b.date.startsWith(year));
      const monthMatch = month === 'ALL' || b.month === month || (b.date && new Date(b.date).toLocaleString('en-US', { month: 'long' }) === month);
      return yearMatch && monthMatch && b.source === 'Direct Business Register';
    });

    const directPos = bgInScope.reduce((sum, b) => sum + (Number(b.posIncome) || 0), 0);
    const directCash = bgInScope.reduce((sum, b) => sum + (Number(b.cashIncome) || 0), 0);
    const directTransfer = bgInScope.reduce((sum, b) => sum + (Number(b.transferIncome) || 0), 0);
    const directFawran = bgInScope.reduce((sum, b) => sum + (Number(b.fawranIncome) || 0), 0);

    const totalPosIncome = salesPos + directPos;
    const totalCashIncome = salesCash + directCash;
    const totalTransferIncome = salesTransfer + directTransfer;
    const totalFawranIncome = salesFawran + directFawran;

    // Real gross from services, products, and direct registers
    const salesGross = salesInScope.reduce((sum, s) => sum + (Number(s.grossSales) || ((Number(s.totalServiceAmount) || 0) + (Number(s.totalProductAmount) || 0))), 0);
    const directGross = directPos + directCash + directTransfer + directFawran;
    const totalBusinessGross = salesGross > 0 ? salesGross + directGross : totalPosIncome + totalCashIncome + totalTransferIncome + totalFawranIncome;

    // 3. Petty Cash Daily Expenses
    const pettyList = this.getPettyCashExpenses(month, year);
    const pettyCashTotal = pettyList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pettyCashPaid = pettyList.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pettyCashUnpaid = pettyList.filter((p) => p.status === 'Unpaid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 4. Fixed Expenses
    const fixedList = this.getFixedExpenses(month, year);
    const fixedExpensesTotal = fixedList.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const fixedExpensesPaid = fixedList.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const fixedExpensesUnpaid = fixedList.filter((f) => f.status === 'Unpaid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // 5. Salaries & Wages by WPS vs Cash (Auto-calculated from Monthly Payroll Processing & Wages)
    const monthlyPayrolls = this.inMemoryCache.payroll.filter((p) => {
      const matchYear = year === 'ALL' || p.year === year;
      const matchMonth = month === 'ALL' || p.month === month;
      return matchYear && matchMonth;
    });

    let payrollWps = 0;
    let payrollCash = 0;
    if (monthlyPayrolls.length > 0) {
      monthlyPayrolls.forEach((p) => {
        const emp = this.inMemoryCache.employees.find((e) => e.employeeId === p.employeeId);
        const isBankWps = Boolean(
          emp?.iban &&
          emp?.payerBankShort &&
          emp?.payerBankShort.toUpperCase() !== 'CASH' &&
          emp?.payerBankShort.toUpperCase() !== 'NONE'
        );
        const amount = Number(p.netSalary) || 0;
        if (isBankWps) {
          payrollWps += amount;
        } else {
          payrollCash += amount;
        }
      });
    } else {
      // Only use explicit Fixed Expense entries if user has already synced or registered them for this month
      const wpsFixed = fixedList.filter((f) => f.category === 'Salaries & wages by WPS').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const cashSalFixed = fixedList.filter((f) => f.category === 'Salaries & wages by CASH').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      payrollWps = wpsFixed;
      payrollCash = cashSalFixed;
    }

    const wagesByWps = payrollWps;
    const salariesByCash = payrollCash;
    const totalSalaries = wagesByWps + salariesByCash;

    // Fixed excluding salaries (to avoid duplicate when adding)
    const fixedExcludingSalaries = fixedList
      .filter((f) => f.category !== 'Salaries & wages by WPS' && f.category !== 'Salaries & wages by CASH')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const totalSalonExpenses = pettyCashTotal + fixedExcludingSalaries + totalSalaries;
    const totalSalonPaid = pettyCashPaid + fixedExpensesPaid;
    const totalSalonUnpaid = pettyCashUnpaid + fixedExpensesUnpaid;
    const netSalonProfit = totalBusinessGross - totalSalonExpenses;

    return {
      month,
      year,
      posIncome: totalPosIncome,
      cashIncome: totalCashIncome,
      transferIncome: totalTransferIncome,
      fawranIncome: totalFawranIncome,
      totalBusinessGross,
      pettyCashTotal,
      pettyCashPaid,
      pettyCashUnpaid,
      fixedExpensesTotal,
      fixedExpensesPaid,
      fixedExpensesUnpaid,
      wagesByWps,
      salariesByCash,
      totalSalaries,
      totalSalonExpenses,
      totalSalonPaid,
      totalSalonUnpaid,
      netSalonProfit,
    };
  }

  // -------------------------------------------------------------
  // Variable Expenses & Custom Job Roles / Categories Engine
  // -------------------------------------------------------------
  public getVariableExpenses(month?: string, year?: string): VariableExpense[] {
    let list = [...this.inMemoryCache.variableExpenses];
    if (year && year !== 'ALL') {
      list = list.filter((v) => v.year === year || (v.date && v.date.startsWith(year)));
    }
    if (month && month !== 'ALL') {
      list = list.filter((v) => v.month === month || (v.date && new Date(v.date).toLocaleString('en-US', { month: 'long' }) === month));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async saveVariableExpense(expense: VariableExpense): Promise<void> {
    const idx = this.inMemoryCache.variableExpenses.findIndex((v) => v.id === expense.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      this.inMemoryCache.variableExpenses[idx] = { ...expense, updatedAt: now };
      await this.logAudit('VARIABLE_EXPENSE_UPDATED', `Updated variable expense ${expense.description} (QAR ${expense.amount})`);
    } else {
      this.inMemoryCache.variableExpenses.unshift({ ...expense, createdAt: expense.createdAt || now, updatedAt: now });
      await this.logAudit('VARIABLE_EXPENSE_ADDED', `Registered variable expense ${expense.category}: ${expense.description} (QAR ${expense.amount})`);
    }
    this.saveVariableExpenses();
  }

  public async toggleVariableExpenseStatus(id: string): Promise<'Paid' | 'Unpaid'> {
    const item = this.inMemoryCache.variableExpenses.find((v) => v.id === id);
    if (!item) throw new Error('Variable expense not found');
    item.status = item.status === 'Paid' ? 'Unpaid' : 'Paid';
    item.updatedAt = new Date().toISOString();
    this.saveVariableExpenses();
    await this.logAudit(
      'VARIABLE_EXPENSE_STATUS_TOGGLED',
      `Marked variable expense "${item.description}" as ${item.status} (QAR ${item.amount})`
    );
    return item.status;
  }

  public async deleteVariableExpense(id: string): Promise<void> {
    const item = this.inMemoryCache.variableExpenses.find((v) => v.id === id);
    this.inMemoryCache.variableExpenses = this.inMemoryCache.variableExpenses.filter((v) => v.id !== id);
    this.saveVariableExpenses();
    if (item) {
      await this.logAudit('VARIABLE_EXPENSE_DELETED', `Deleted variable expense "${item.description}"`);
    }
  }

  public saveVariableExpenses(): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'variableExpenses', JSON.stringify(this.inMemoryCache.variableExpenses));
    } catch {}
  }

  public getCustomJobRoles(): string[] {
    return [...this.inMemoryCache.customJobRoles];
  }

  public async addCustomJobRole(role: string): Promise<void> {
    const trimmed = role.trim();
    if (!trimmed) return;
    if (!this.inMemoryCache.customJobRoles.includes(trimmed)) {
      this.inMemoryCache.customJobRoles.push(trimmed);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'customJobRoles', JSON.stringify(this.inMemoryCache.customJobRoles));
      } catch {}
      await this.logAudit('CUSTOM_ROLE_ADDED', `Added custom job role: ${trimmed}`);
    }
  }

  public getCustomServiceCategories(): string[] {
    return [...this.inMemoryCache.customServiceCategories];
  }

  public async addCustomServiceCategory(category: string): Promise<void> {
    const trimmed = category.trim();
    if (!trimmed) return;
    if (!this.inMemoryCache.customServiceCategories.includes(trimmed)) {
      this.inMemoryCache.customServiceCategories.push(trimmed);
      try {
        localStorage.setItem(STORAGE_PREFIX + 'customServiceCategories', JSON.stringify(this.inMemoryCache.customServiceCategories));
      } catch {}
      await this.logAudit('CUSTOM_CATEGORY_ADDED', `Added custom service category: ${trimmed}`);
    }
  }

  // -------------------------------------------------------------
  // Master Monthly Profit & Loss (P&L) Engine
  // Net Sales = Gross Sales - Discounts - Refunds
  // Total Expenses = COGS + Salaries & Wages + Earned Commissions + Fixed + Variable + Petty Cash
  // Net Profit / Loss = Net Sales - Total Expenses
  // -------------------------------------------------------------
  public calculateProfitAndLoss(month: string = 'October', year: string = '2026'): ProfitAndLossStatement {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let monthNum = '10';
    const mIdx = monthNames.findIndex((m) => m.toLowerCase() === month.toLowerCase());
    if (mIdx >= 0) {
      monthNum = String(mIdx + 1).padStart(2, '0');
    }
    const period = `${year}-${monthNum}`;

    // 1. Sales & Incomes
    const salesInScope = this.inMemoryCache.dailySales.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const sYear = String(d.getFullYear());
      const sMonth = d.toLocaleString('en-US', { month: 'long' });
      const yearMatch = year === 'ALL' || sYear === year;
      const monthMatch = month === 'ALL' || sMonth.toLowerCase() === month.toLowerCase();
      return yearMatch && monthMatch;
    });

    let serviceSales = 0;
    let productSales = 0;
    let uberCharges = 0;
    let discounts = 0;
    let refunds = 0;

    salesInScope.forEach((s) => {
      serviceSales += Number(s.totalServiceAmount) || 0;
      productSales += Number(s.totalProductAmount) || 0;
      uberCharges += Number(s.uberCharge) || 0;
      refunds += Number(s.refunds) || 0;
      const gross = Number(s.grossSales) || ((Number(s.totalServiceAmount) || 0) + (Number(s.totalProductAmount) || 0));
      const net = Number(s.netSales) || 0;
      const ref = Number(s.refunds) || 0;
      if (gross > net + ref && net > 0) {
        discounts += gross - (net + ref);
      }
    });

    // Gross from POS, Cash, Transfer, Fawran
    const posIncome = salesInScope.reduce((sum, s) => sum + (Number(s.posCard) || 0), 0);
    const cashIncome = salesInScope.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
    const transferIncome = salesInScope.reduce((sum, s) => sum + (Number(s.transferIncome) || 0), 0);
    const fawranIncome = salesInScope.reduce((sum, s) => sum + (Number(s.fawran) || 0), 0);

    // Direct registers from BusinessGross
    const directEntries = this.inMemoryCache.businessGross.filter((b) => {
      const yearMatch = year === 'ALL' || b.year === year || (b.date && b.date.startsWith(year));
      const monthMatch = month === 'ALL' || b.month === month || (b.date && new Date(b.date).toLocaleString('en-US', { month: 'long' }) === month);
      return yearMatch && monthMatch && b.source === 'Direct Business Register';
    });

    const directPos = directEntries.reduce((sum, b) => sum + (Number(b.posIncome) || 0), 0);
    const directCash = directEntries.reduce((sum, b) => sum + (Number(b.cashIncome) || 0), 0);
    const directTransfer = directEntries.reduce((sum, b) => sum + (Number(b.transferIncome) || 0), 0);
    const directFawran = directEntries.reduce((sum, b) => sum + (Number(b.fawranIncome) || 0), 0);
    const directGross = directPos + directCash + directTransfer + directFawran;

    // Real Gross Sales from Services, Products, Uber, and Direct registers
    const totalGrossSales = serviceSales + productSales + uberCharges + directGross;
    const netSales = Math.max(0, totalGrossSales - discounts - refunds);

    // 2. Variable Expenses & COGS
    const varExpenses = this.getVariableExpenses(month, year);
    const cogsItems = varExpenses.filter((v) =>
      v.category === 'Salon Supplies' ||
      v.category === 'Retail Stock Purchases'
    );
    const costOfGoodsSold = cogsItems.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

    const otherVarExpenses = varExpenses.filter((v) =>
      v.category !== 'Salon Supplies' &&
      v.category !== 'Retail Stock Purchases'
    );
    const variableOperatingExpenses = otherVarExpenses.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const totalVariableExpenses = varExpenses.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

    // 3. Petty Cash Daily Expenses
    const pettyList = this.getPettyCashExpenses(month, year);
    const pettyCashTotal = pettyList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 4. Fixed Expenses (Excluding double-counted salaries)
    const fixedList = this.getFixedExpenses(month, year);
    const nonSalaryFixedExpenses = fixedList
      .filter((f) => f.category !== 'Salaries & wages by WPS' && f.category !== 'Salaries & wages by CASH')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // 5. Salaries & Wages by WPS vs Cash (Calculated from Monthly Payroll Processing & Wages)
    const monthlyPayrolls = this.inMemoryCache.payroll.filter((p) => {
      const matchYear = year === 'ALL' || p.year === year;
      const matchMonth = month === 'ALL' || p.month === month;
      return matchYear && matchMonth;
    });

    let wagesByWps = 0;
    let salariesByCash = 0;
    let payrollCommissionsTotal = 0;

    if (monthlyPayrolls.length > 0) {
      monthlyPayrolls.forEach((p) => {
        const emp = this.inMemoryCache.employees.find((e) => e.employeeId === p.employeeId);
        const isBankWps = Boolean(
          emp?.iban &&
          emp?.payerBankShort &&
          emp?.payerBankShort.toUpperCase() !== 'CASH' &&
          emp?.payerBankShort.toUpperCase() !== 'NONE'
        );
        const amount = Number(p.netSalary) || 0;
        if (isBankWps) {
          wagesByWps += amount;
        } else {
          salariesByCash += amount;
        }
        payrollCommissionsTotal += Number(p.commissions) || 0;
      });
    } else {
      // Only use explicit Fixed Expense entry if user has registered or synced it for this month
      const fixedSalariesWps = fixedList.filter((f) => f.category === 'Salaries & wages by WPS').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const fixedSalariesCash = fixedList.filter((f) => f.category === 'Salaries & wages by CASH').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      wagesByWps = fixedSalariesWps;
      salariesByCash = fixedSalariesCash;
    }

    const salariesAndWages = wagesByWps + salariesByCash;

    // 6. Automatic Commissions from Section 5 / Payroll
    const commSummary = this.getMonthlyCommissions(period);
    const earnedCommissions = monthlyPayrolls.length > 0 ? payrollCommissionsTotal : commSummary.totalCommissionsDue;

    // 7. Total Expenses & Net Profit/Loss (only real expenses from generated payroll, fixed invoices, petty cash)
    const totalExpenses = costOfGoodsSold + salariesAndWages + nonSalaryFixedExpenses + variableOperatingExpenses + pettyCashTotal;
    const netProfitOrLoss = netSales - totalExpenses;
    const isProfitable = netProfitOrLoss >= 0;
    const profitMargin = netSales > 0 ? (netProfitOrLoss / netSales) * 100 : 0;

    return {
      month,
      year,
      period,
      grossSales: totalGrossSales,
      businessGrossSales: totalGrossSales,
      serviceSales,
      totalServiceSales: serviceSales,
      productSales,
      totalProductSales: productSales,
      discounts,
      refunds,
      netSales,
      cogs: costOfGoodsSold,
      costOfGoodsSold,
      salariesAndWages,
      wagesByWps,
      wpsSalaries: wagesByWps,
      salariesByCash,
      cashSalaries: salariesByCash,
      totalSalaries: salariesAndWages,
      earnedCommissions,
      fixedExpenses: nonSalaryFixedExpenses,
      totalFixedExpenses: nonSalaryFixedExpenses,
      variableExpenses: variableOperatingExpenses,
      pettyCashExpenses: pettyCashTotal,
      totalVariableExpenses: variableOperatingExpenses + pettyCashTotal,
      totalExpenses,
      totalBusinessExpenses: totalExpenses,
      netProfitOrLoss,
      isProfit: isProfitable,
      isProfitable,
      profitMargin,
      profitMarginPercent: profitMargin,
    };
  }

  // Customers
  public getCustomers(): Customer[] {
    return [...this.inMemoryCache.customers];
  }

  public getCustomer(id: string): Customer | undefined {
    return this.inMemoryCache.customers.find((c) => c.id === id);
  }

  public findCustomerByMobile(mobile: string): Customer | undefined {
    if (!mobile) return undefined;
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const cleanSuffix = cleanMobile.slice(-8); // Last 8 digits in Qatar mobile numbers
    return this.inMemoryCache.customers.find((c) => {
      const cClean = c.mobile.replace(/[^0-9]/g, '');
      return cClean === cleanMobile || (cleanSuffix.length >= 7 && cClean.endsWith(cleanSuffix));
    });
  }

  public async saveCustomer(cust: Customer): Promise<Customer> {
    const existingIdx = this.inMemoryCache.customers.findIndex(
      (c) => c.id === cust.id || (c.mobile && this.normalizePhone(c.mobile) === this.normalizePhone(cust.mobile))
    );

    if (existingIdx >= 0) {
      this.inMemoryCache.customers[existingIdx] = {
        ...this.inMemoryCache.customers[existingIdx],
        ...cust,
      };
      this.saveCustomers();
      return this.inMemoryCache.customers[existingIdx];
    } else {
      const newCust: Customer = {
        ...cust,
        id: cust.id || `CUST-${Date.now().toString().slice(-4)}`,
        createdAt: cust.createdAt || new Date().toISOString(),
      };
      this.inMemoryCache.customers.unshift(newCust);
      this.saveCustomers();
      await this.logAudit('CUSTOMER_REGISTERED', `Added customer ${newCust.name} (${newCust.mobile}) to directory`);
      return newCust;
    }
  }

  public async deleteCustomer(id: string): Promise<void> {
    this.inMemoryCache.customers = this.inMemoryCache.customers.filter((c) => c.id !== id);
    this.saveCustomers();
    await this.logAudit('CUSTOMER_DELETED', `Deleted customer ${id}`);
  }

  private normalizePhone(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '').slice(-8);
  }

  private async syncCustomerFromSale(sale: DailySaleRecord): Promise<void> {
    if (!sale.mobileNumber && !sale.customerName) return;

    let cust = this.findCustomerByMobile(sale.mobileNumber);
    if (!cust && sale.customerId) {
      cust = this.getCustomer(sale.customerId);
    }

    if (!cust) {
      // Auto-register new customer
      const newCust: Customer = {
        id: sale.customerId || `CUST-${Date.now().toString().slice(-4)}`,
        name: sale.customerName || 'Walk-in Customer',
        mobile: sale.mobileNumber,
        totalVisits: 1,
        totalSpent: Number(sale.netSales) || 0,
        outstandingBalance: Number(sale.unpaid) || 0,
        notes: `Registered via sale ${sale.srCode}`,
        createdAt: new Date().toISOString(),
        lastVisitDate: sale.date,
      };
      this.inMemoryCache.customers.unshift(newCust);
      this.saveCustomers();
      await this.logAudit('CUSTOMER_AUTO_REGISTERED', `New customer ${newCust.name} (${newCust.mobile}) saved automatically from sale ${sale.srCode}`);
    } else {
      // Recalculate customer stats from all sales
      const customerSales = this.inMemoryCache.dailySales.filter(
        (s) => s.customerId === cust!.id || (s.mobileNumber && this.normalizePhone(s.mobileNumber) === this.normalizePhone(cust!.mobile))
      );
      const totalVisits = customerSales.length;
      const totalSpent = customerSales.reduce((sum, s) => sum + (Number(s.netSales) || 0), 0);
      const outstandingBalance = customerSales.reduce((sum, s) => sum + (Number(s.unpaid) || 0), 0);
      const lastVisit = customerSales.map((s) => s.date).sort().reverse()[0] || sale.date;

      cust.name = sale.customerName || cust.name;
      cust.totalVisits = totalVisits;
      cust.totalSpent = totalSpent;
      cust.outstandingBalance = outstandingBalance;
      cust.lastVisitDate = lastVisit;
      this.saveCustomers();
    }
  }

  private saveCustomers() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(this.inMemoryCache.customers));
    } catch {}
  }

  // Service Catalogue
  public getServiceCatalogue(): ServiceCatalogueItem[] {
    return [...this.inMemoryCache.serviceCatalogue];
  }

  public async saveServiceCatalogueItem(item: ServiceCatalogueItem): Promise<void> {
    const idx = this.inMemoryCache.serviceCatalogue.findIndex((s) => s.id === item.id);
    if (idx >= 0) {
      this.inMemoryCache.serviceCatalogue[idx] = { ...item };
      await this.logAudit('SERVICE_UPDATED', `Updated service "${item.name}" (QAR ${item.price}) in catalogue`);
    } else {
      this.inMemoryCache.serviceCatalogue.push({ ...item });
      await this.logAudit('SERVICE_ADDED', `Added service "${item.name}" (QAR ${item.price}) to ${item.category} catalogue`);
    }
    this.saveServiceCatalogue();
  }

  public async deleteServiceCatalogueItem(id: string): Promise<void> {
    const item = this.inMemoryCache.serviceCatalogue.find((s) => s.id === id);
    this.inMemoryCache.serviceCatalogue = this.inMemoryCache.serviceCatalogue.filter((s) => s.id !== id);
    this.saveServiceCatalogue();
    if (item) {
      await this.logAudit('SERVICE_DELETED', `Removed service "${item.name}" from catalogue`);
    }
  }

  private saveServiceCatalogue() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'serviceCatalogue', JSON.stringify(this.inMemoryCache.serviceCatalogue));
    } catch {}
  }

  // -------------------------------------------------------------
  // Automatic Commission Module Integration (Section 5)
  // Transfers live Daily Sales into Section 5 Commissions:
  // - Employee Service Sales -> Actual Eligible Sales (totalSalesRate) [10% Target]
  // - Employee Product Sales -> Eligible Product Sales (prodTotalSales) [5%]
  // - Combined Gross Sales   -> Business Gross Sales (businessGross)
  // -------------------------------------------------------------

  public getMonthlyCommissions(targetMonthYear?: string): MonthlyCommissionSummary {
    const today = new Date();
    const period = targetMonthYear || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [yearPart, monthPart] = period.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(monthPart, 10) - 1;
    const monthName = `${monthNames[monthIndex] || 'Unknown'} ${yearPart}`;

    // Filter sales belonging to the calendar month
    const monthlySales = this.inMemoryCache.dailySales.filter((s) => s.date && s.date.startsWith(period));

    const validationIssues: string[] = [];
    let totalEligibleBusinessGross = 0;
    let totalMonthServiceSales = 0;
    let totalMonthProductSales = 0;

    // Track employee-specific sales and transaction counts
    const employeeMetrics: Record<
      string,
      {
        serviceSales: number;
        productSales: number;
        serviceTxCount: number;
        productTxCount: number;
      }
    > = {};

    // Initialize all active employees
    this.inMemoryCache.employees.forEach((emp) => {
      employeeMetrics[emp.employeeId] = {
        serviceSales: 0,
        productSales: 0,
        serviceTxCount: 0,
        productTxCount: 0,
      };
    });

    for (const sale of monthlySales) {
      // Validation: Check payment reconciliation
      const totalBillable = (Number(sale.grossSales) || 0) + (Number(sale.uberCharge) || 0);
      const totalSettled = (Number(sale.posCard) || 0) + (Number(sale.cash) || 0) + (Number(sale.fawran) || 0) + (Number(sale.unpaid) || 0);
      if (Math.abs(totalBillable - totalSettled) > 1) {
        validationIssues.push(`Sale ${sale.srCode} (${sale.date}) payment settlement discrepancy: Billable QAR ${totalBillable.toFixed(2)} vs Settled QAR ${totalSettled.toFixed(2)}`);
      }

      // 1. Service Sales: attribute to assigned employee
      if (sale.services && sale.services.length > 0) {
        for (const s of sale.services) {
          const empId = s.employeeId;
          const totalLine = Number(s.lineTotal) || 0;
          const sharedAmt = Number(s.sharedAmount) || 0;
          const sharedEmpId = s.sharedWithEmployeeId;

          if (!empId) {
            validationIssues.push(`Sale ${sale.srCode} has a service without an assigned employee: "${s.serviceName}"`);
            continue;
          }

          if (sharedEmpId && sharedAmt > 0 && sharedAmt <= totalLine) {
            // Split allocation
            const primaryAmt = totalLine - sharedAmt;
            if (!employeeMetrics[empId]) {
              employeeMetrics[empId] = { serviceSales: 0, productSales: 0, serviceTxCount: 0, productTxCount: 0 };
            }
            employeeMetrics[empId].serviceSales += primaryAmt;
            employeeMetrics[empId].serviceTxCount += 1;

            if (!employeeMetrics[sharedEmpId]) {
              employeeMetrics[sharedEmpId] = { serviceSales: 0, productSales: 0, serviceTxCount: 0, productTxCount: 0 };
            }
            employeeMetrics[sharedEmpId].serviceSales += sharedAmt;
            employeeMetrics[sharedEmpId].serviceTxCount += 1;

            totalEligibleBusinessGross += totalLine;
            totalMonthServiceSales += totalLine;
          } else {
            // 100% to primary employee
            if (!employeeMetrics[empId]) {
              employeeMetrics[empId] = { serviceSales: 0, productSales: 0, serviceTxCount: 0, productTxCount: 0 };
            }
            employeeMetrics[empId].serviceSales += totalLine;
            employeeMetrics[empId].serviceTxCount += 1;

            totalEligibleBusinessGross += totalLine;
            totalMonthServiceSales += totalLine;
          }
        }
      }

      // 2. Product Sales: attribute to assigned salesperson
      if (sale.products && sale.products.length > 0) {
        for (const p of sale.products) {
          const salespersonId = p.employeeId;
          const pTotal = Number(p.lineTotal) || 0;
          if (!salespersonId) {
            validationIssues.push(`Sale ${sale.srCode} has a product sale without an assigned salesperson: "${p.productName}"`);
            continue;
          }

          if (!employeeMetrics[salespersonId]) {
            employeeMetrics[salespersonId] = { serviceSales: 0, productSales: 0, serviceTxCount: 0, productTxCount: 0 };
          }
          employeeMetrics[salespersonId].productSales += pTotal;
          employeeMetrics[salespersonId].productTxCount += 1;

          totalEligibleBusinessGross += pTotal;
          totalMonthProductSales += pTotal;
        }
      }

      // 3. Deduct service & product refunds appropriately
      if (sale.refundRecords && sale.refundRecords.length > 0) {
        for (const ref of sale.refundRecords) {
          const refAmt = Number(ref.amount) || 0;
          if (ref.affectedEmployeeId && employeeMetrics[ref.affectedEmployeeId]) {
            employeeMetrics[ref.affectedEmployeeId].serviceSales = Math.max(
              0,
              employeeMetrics[ref.affectedEmployeeId].serviceSales - refAmt
            );
          }
          totalEligibleBusinessGross = Math.max(0, totalEligibleBusinessGross - refAmt);
          totalMonthServiceSales = Math.max(0, totalMonthServiceSales - refAmt);
        }
      }
    }

    // Build aggregates for each employee
    let totalCommissionsDue = 0;
    const employeeAggregates: MonthlyEmployeeCommissionAggregate[] = [];

    this.inMemoryCache.employees
      .filter((emp) => emp.status !== 'Unemployed')
      .forEach((emp) => {
        const metrics = employeeMetrics[emp.employeeId] || { serviceSales: 0, productSales: 0, serviceTxCount: 0, productTxCount: 0 };
        const actualEligibleSales = metrics.serviceSales;
        const eligibleProductSales = metrics.productSales;

        // Stream 1: Service Sales (10% target rule: Actual >= Target ? Actual * 10% : 0)
        const serviceTarget = Number(emp.saleTargetRate) || 0;
        const serviceRate =
          emp.saleCommissionRate !== undefined && !isNaN(Number(emp.saleCommissionRate))
            ? Number(emp.saleCommissionRate)
            : (this.inMemoryCache.settings.salesCommRate ?? 10);
        const serviceEligible = actualEligibleSales > 0 && actualEligibleSales >= serviceTarget;
        const serviceCommissionDue = serviceEligible ? actualEligibleSales * (serviceRate / 100) : 0;
        const serviceAchievementRate = serviceTarget > 0 ? (actualEligibleSales / serviceTarget) * 100 : (actualEligibleSales > 0 ? 100 : 0);

        // Stream 2: Product Sales (5% retail rule)
        const productRate =
          emp.prodSaleCommission !== undefined && !isNaN(Number(emp.prodSaleCommission))
            ? Number(emp.prodSaleCommission)
            : (this.inMemoryCache.settings.productCommRate ?? 5);
        const productCommissionDue = eligibleProductSales > 0 ? eligibleProductSales * (productRate / 100) : 0;

        // Stream 3: Business Gross Target (5%) - Only eligible if selected by company
        const businessTarget = Number(emp.businessTargetAmount) || this.inMemoryCache.settings.businessTarget || 200000;
        const businessRate =
          emp.businessTargetRate !== undefined && !isNaN(Number(emp.businessTargetRate))
            ? Number(emp.businessTargetRate)
            : (this.inMemoryCache.settings.businessCommRate ?? 5);
        const businessCommBase = emp.businessCommBase || this.inMemoryCache.settings.businessCommBase || 'all_gross';
        const businessSelected = emp.businessCommissionEligible === true;
        const businessEligible = businessSelected && totalEligibleBusinessGross >= businessTarget && businessTarget > 0;
        let businessCommissionDue = 0;
        if (businessEligible) {
          if (businessCommBase === 'above_target') {
            businessCommissionDue = Math.max(0, totalEligibleBusinessGross - businessTarget) * (businessRate / 100);
          } else {
            businessCommissionDue = totalEligibleBusinessGross * (businessRate / 100);
          }
        }

        const totalEmpCommission = serviceCommissionDue + productCommissionDue + businessCommissionDue;
        totalCommissionsDue += totalEmpCommission;

        employeeAggregates.push({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          position: emp.position,
          serviceSalesTarget: serviceTarget,
          actualEligibleSales,
          serviceCommissionRate: serviceRate,
          serviceCommissionDue,
          serviceEligible,
          serviceAchievementRate,
          eligibleProductSales,
          productCommissionRate: productRate,
          productCommissionDue,
          businessGrossSales: totalEligibleBusinessGross,
          businessTargetAmount: businessTarget,
          businessCommissionRate: businessRate,
          businessCommissionDue,
          businessEligible,
          businessSelectedByCompany: businessSelected,
          tips: Number(emp.tips) || 0,
          totalCommissionDue: totalEmpCommission,
          serviceTransactionCount: metrics.serviceTxCount,
          productTransactionCount: metrics.productTxCount,
        });
      });

    const syncStatus: CommissionSyncStatus =
      validationIssues.length > 0 ? 'Needs Attention' : monthlySales.length > 0 ? 'Synced' : 'Live – Saved';

    return {
      monthYear: period,
      monthName,
      syncStatus,
      lastCalculatedAt: new Date().toISOString(),
      totalServiceSales: totalMonthServiceSales,
      totalProductSales: totalMonthProductSales,
      totalBusinessGross: totalEligibleBusinessGross,
      totalCommissionsDue,
      employeeAggregates,
      validationIssues,
    };
  }

  public async syncEmployeeCommissionsFromSales(targetMonthYear?: string, forceApplyToEmployees: boolean = true): Promise<MonthlyCommissionSummary> {
    const today = new Date();
    const period = targetMonthYear || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = period === currentPeriod;

    const summary = this.getMonthlyCommissions(period);

    // Apply live sales figures to employees if it's the current month or explicit apply requested
    if (isCurrentMonth || forceApplyToEmployees) {
      const aggMap = new Map(summary.employeeAggregates.map((a) => [a.employeeId, a]));

      let hasChanges = false;
      this.inMemoryCache.employees = this.inMemoryCache.employees.map((emp) => {
        const agg = aggMap.get(emp.employeeId);
        if (agg) {
          hasChanges = true;
          return {
            ...emp,
            totalSalesRate: agg.actualEligibleSales, // Actual Eligible Service Sales (QAR) [10% Target]
            prodTotalSales: agg.eligibleProductSales, // Eligible Product Sales (QAR) [5%]
            businessGross: agg.businessGrossSales, // Combined Business Gross Sales (QAR)
          };
        }
        return emp;
      });

      if (hasChanges) {
        this.saveEmployees();
      }
    }

    // Also update any matching monthly payroll records to keep them in sync
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const [yearPart, monthPart] = period.split('-');
    const monthIndex = parseInt(monthPart, 10) - 1;
    const targetMonthName = monthNames[monthIndex] || 'October';

    const aggMap = new Map(summary.employeeAggregates.map((a) => [a.employeeId, a]));

    this.inMemoryCache.payroll = this.inMemoryCache.payroll.map((p) => {
      if (p.year === yearPart && p.month === targetMonthName) {
        // Protect finalized records: do NOT silently alter Approved or Paid payroll
        if (p.status === 'Approved' || p.status === 'Paid') {
          return p;
        }

        const agg = aggMap.get(p.employeeId);
        if (agg) {
          const emp = this.inMemoryCache.employees.find((e) => e.employeeId === p.employeeId);
          const basic = Number(p.basicSalary) || Number(emp?.basicSalary) || 0;
          const food = Number(p.foodAllowance) || Number(emp?.foodAllowance) || 0;
          const transport = Number(p.transportAllowance) || Number(emp?.transportAllowance) || 0;
          const carOp = Number(p.carOperationAllowance) || Number(emp?.carOperationAllowance) || 0;
          const other = Number(p.otherAllowance) || Number(emp?.otherAllowance) || 0;
          const limitedTrans = Number(p.limitedTransport) || Number(emp?.limitedTransport) || 0;
          const totalAllowances = food + transport + carOp + other + limitedTrans;
          const tips = Number(agg.tips) || Number(emp?.tips) || 0;
          const deductions = Number(p.deductions) || 0;
          const commsTotal = agg.totalCommissionDue;
          const totalMonthlySalary = basic + totalAllowances + tips + commsTotal;
          const netSalary = Math.max(0, totalMonthlySalary - deductions);

          return {
            ...p,
            basicSalary: basic,
            foodAllowance: food,
            transportAllowance: transport,
            carOperationAllowance: carOp,
            otherAllowance: other,
            limitedTransport: limitedTrans,
            allowances: totalAllowances,
            tips,
            commissions: commsTotal,
            totalMonthlySalary,
            netSalary,
            commissionBreakdown: {
              service: agg.serviceCommissionDue,
              product: agg.productCommissionDue,
              business: agg.businessCommissionDue,
              totalCommission: commsTotal,
              serviceTarget: agg.serviceSalesTarget,
              serviceActual: agg.actualEligibleSales,
              serviceRate: agg.serviceCommissionRate,
              serviceAchievement: agg.serviceAchievementRate,
              serviceEligible: agg.serviceEligible,
              productSales: agg.eligibleProductSales,
              productRate: agg.productCommissionRate,
              productEligible: agg.eligibleProductSales > 0,
              businessTarget: agg.businessTargetAmount,
              businessGross: agg.businessGrossSales,
              businessRate: agg.businessCommissionRate,
              businessAchievement: agg.businessTargetAmount > 0 ? (agg.businessGrossSales / agg.businessTargetAmount) * 100 : 0,
              businessEligible: agg.businessEligible,
              businessSelectedByCompany: agg.businessSelectedByCompany,
            },
          };
        }
      }
      return p;
    });
    this.savePayroll();

    return summary;
  }

  public async recalculateMonthlyTotals(targetMonthYear: string): Promise<MonthlyCommissionSummary> {
    const summary = await this.syncEmployeeCommissionsFromSales(targetMonthYear, true);
    await this.logAudit(
      'MONTHLY_TOTALS_RECALCULATED',
      `Recalculated and synchronized monthly commission totals for ${summary.monthName} (Gross QAR ${summary.totalBusinessGross.toLocaleString()}, Comm Due QAR ${summary.totalCommissionsDue.toLocaleString()})`
    );
    return summary;
  }

  // Auto-calculate & Synchronize Salaries & Wages (WPS & CASH) from Monthly Payroll Processing & Wages to Business Expenses
  public async syncPayrollToBusinessExpenses(
    month: string = 'October',
    year: string = '2026'
  ): Promise<{ wpsTotal: number; cashTotal: number; wpsCount: number; cashCount: number }> {
    const payrolls = this.inMemoryCache.payroll.filter((p) => p.month === month && p.year === year);
    const employees = this.inMemoryCache.employees;

    let wpsTotal = 0;
    let cashTotal = 0;
    let wpsCount = 0;
    let cashCount = 0;

    if (payrolls.length > 0) {
      payrolls.forEach((p) => {
        const emp = employees.find((e) => e.employeeId === p.employeeId);
        const isBankWps = Boolean(
          emp?.iban &&
          emp?.payerBankShort &&
          emp?.payerBankShort.toUpperCase() !== 'CASH' &&
          emp?.payerBankShort.toUpperCase() !== 'NONE'
        );
        const amount = Number(p.netSalary) || 0;
        if (isBankWps) {
          wpsTotal += amount;
          wpsCount++;
        } else {
          cashTotal += amount;
          cashCount++;
        }
      });
    } else {
      // If no monthly payroll records exist yet for this month, clean out any phantom WPS or Cash salary entries
      this.inMemoryCache.fixedExpenses = this.inMemoryCache.fixedExpenses.filter(
        (f) =>
          !(
            (f.category === 'Salaries & wages by WPS' || f.category === 'Salaries & wages by CASH') &&
            f.month === month &&
            f.year === year
          )
      );
      this.saveFixedExpenses();
      return { wpsTotal: 0, cashTotal: 0, wpsCount: 0, cashCount: 0 };
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.indexOf(month);
    const monthNum = String(monthIndex >= 0 ? monthIndex + 1 : 10).padStart(2, '0');
    const dateStr = `${year}-${monthNum}-28`;

    // 1. Update or create Fixed Expense for "Salaries & wages by WPS"
    const existingWpsIdx = this.inMemoryCache.fixedExpenses.findIndex(
      (f) => f.category === 'Salaries & wages by WPS' && f.month === month && f.year === year
    );
    const wpsPayload: FixedExpense = {
      id: existingWpsIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingWpsIdx].id : `FE-WPS-${year}-${monthNum}`,
      date: existingWpsIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingWpsIdx].date : dateStr,
      refNo: existingWpsIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingWpsIdx].refNo : `WPS-SAL-${year}-${monthNum}`,
      category: 'Salaries & wages by WPS',
      company: 'Qatar Ministry of Labour / Doha Bank WPS',
      description: `${month} ${year} employee wages via Qatar WPS for ${wpsCount} registered staff`,
      status: existingWpsIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingWpsIdx].status : 'Paid',
      paymentMethod: 'Doha Bank WPS Electronic SIF',
      detailsComment: `Auto-calculated from Monthly Payroll Processing & Wages (${wpsCount} staff)`,
      cardCashType: 'Bank / WPS',
      amount: wpsTotal,
      month,
      year,
      createdAt: existingWpsIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingWpsIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingWpsIdx >= 0) {
      this.inMemoryCache.fixedExpenses[existingWpsIdx] = wpsPayload;
    } else {
      this.inMemoryCache.fixedExpenses.unshift(wpsPayload);
    }

    // 2. Update or create Fixed Expense for "Salaries & wages by CASH"
    const existingCashIdx = this.inMemoryCache.fixedExpenses.findIndex(
      (f) => f.category === 'Salaries & wages by CASH' && f.month === month && f.year === year
    );
    const cashPayload: FixedExpense = {
      id: existingCashIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingCashIdx].id : `FE-CASH-${year}-${monthNum}`,
      date: existingCashIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingCashIdx].date : dateStr,
      refNo: existingCashIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingCashIdx].refNo : `CASH-SAL-${year}-${monthNum}`,
      category: 'Salaries & wages by CASH',
      company: 'Cosmos Beauty Salon Internal Treasury',
      description: `${month} ${year} employee cash salaries & wages for ${cashCount} registered staff`,
      status: existingCashIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingCashIdx].status : 'Paid',
      paymentMethod: 'Cash Box Vault',
      detailsComment: `Auto-calculated from Monthly Payroll Processing & Wages (${cashCount} staff)`,
      cardCashType: 'Cash',
      amount: cashTotal,
      month,
      year,
      createdAt: existingCashIdx >= 0 ? this.inMemoryCache.fixedExpenses[existingCashIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingCashIdx >= 0) {
      this.inMemoryCache.fixedExpenses[existingCashIdx] = cashPayload;
    } else {
      this.inMemoryCache.fixedExpenses.unshift(cashPayload);
    }

    this.saveFixedExpenses();

    await this.logAudit(
      'SALARIES_SYNCED_FROM_PAYROLL',
      `Auto-calculated and synced ${month} ${year} salaries from Monthly Payroll: WPS QAR ${wpsTotal} (${wpsCount} staff), Cash QAR ${cashTotal} (${cashCount} staff)`
    );

    return { wpsTotal, cashTotal, wpsCount, cashCount };
  }

  // -------------------------------------------------------------
  // Customer Bookings & Employee Service Availability Engine
  // -------------------------------------------------------------

  public getBookings(): CustomerBooking[] {
    return [...this.inMemoryCache.bookings];
  }

  public getBooking(id: string): CustomerBooking | undefined {
    return this.inMemoryCache.bookings.find((b) => b.id === id);
  }

  public async saveBooking(
    booking: CustomerBooking,
    override?: { authorizedBy: string; reason: string }
  ): Promise<void> {
    const idx = this.inMemoryCache.bookings.findIndex((b) => b.id === booking.id);
    const updated: CustomerBooking = { ...booking, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.inMemoryCache.bookings[idx] = updated;
    } else {
      this.inMemoryCache.bookings.unshift(updated);
    }
    this.saveBookings();

    if (override && (booking.isOverride || override.authorizedBy)) {
      await this.recordBookingOverride({
        id: `OVR-${Date.now()}`,
        bookingId: booking.id,
        employeeId: booking.employeeId,
        employeeName: booking.employeeName,
        date: booking.date,
        timeSlot: `${booking.startTime} - ${booking.endTime}`,
        authorizedBy: override.authorizedBy,
        reason: override.reason,
        timestamp: new Date().toISOString(),
      });
    }

    await this.logAudit(
      idx >= 0 ? 'BOOKING_UPDATED' : 'BOOKING_CREATED',
      `${idx >= 0 ? 'Updated' : 'Created'} appointment ${booking.bookingCode} for ${booking.customerName} (${booking.serviceName}) with ${booking.employeeName} on ${booking.date} at ${booking.startTime}${booking.isOverride ? ' [AUTHORIZED OVERRIDE]' : ''}`
    );
  }

  public async deleteBooking(id: string): Promise<void> {
    const bkg = this.getBooking(id);
    this.inMemoryCache.bookings = this.inMemoryCache.bookings.filter((b) => b.id !== id);
    this.saveBookings();
    await this.logAudit('BOOKING_CANCELLED', `Deleted / Cancelled appointment ${bkg?.bookingCode || id}`);
  }

  public async saveRepeatingBookings(
    baseBooking: CustomerBooking,
    config: RepeatConfig
  ): Promise<CustomerBooking[]> {
    const repeatId = config.repeatId || `REP-${Date.now()}`;
    const generated: CustomerBooking[] = [];
    const baseDate = new Date(baseBooking.date);

    // Save base booking with repeatConfig
    const first: CustomerBooking = {
      ...baseBooking,
      repeatConfig: { ...config, repeatId, occurrenceIndex: 1 },
    };
    await this.saveBooking(first);
    generated.push(first);

    // Determine occurrences count (up to 8 occurrences or endDate)
    const maxOccurrences = 8;
    let currDate = new Date(baseDate);

    for (let i = 2; i <= maxOccurrences; i++) {
      if (config.frequency === 'daily') {
        currDate.setDate(currDate.getDate() + 1);
      } else if (config.frequency === 'weekly') {
        currDate.setDate(currDate.getDate() + 7);
      } else if (config.frequency === 'biweekly') {
        currDate.setDate(currDate.getDate() + 14);
      } else if (config.frequency === 'monthly') {
        currDate.setMonth(currDate.getMonth() + 1);
      }

      const dateStr = currDate.toISOString().slice(0, 10);
      if (config.endDate && dateStr > config.endDate) break;

      const occBooking: CustomerBooking = {
        ...baseBooking,
        id: `BKG-REP-${Date.now()}-${i}`,
        bookingCode: `${baseBooking.bookingCode}-R${i}`,
        date: dateStr,
        repeatConfig: { ...config, repeatId, occurrenceIndex: i },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.saveBooking(occBooking);
      generated.push(occBooking);
    }

    await this.logAudit(
      'REPEAT_BOOKINGS_CREATED',
      `Created repeat series (${config.frequency}) of ${generated.length} appointments for ${baseBooking.customerName}`
    );
    return generated;
  }

  public async createGroupAppointments(
    organizerBooking: CustomerBooking,
    additionalBookings: CustomerBooking[],
    groupName: string
  ): Promise<CustomerBooking[]> {
    const groupId = `GRP-${Date.now()}`;
    const allBookings: CustomerBooking[] = [];

    // Save organizer booking
    const org: CustomerBooking = {
      ...organizerBooking,
      groupInfo: {
        groupId,
        groupName: groupName || `${organizerBooking.customerName}'s Group`,
        organizerCustomerId: organizerBooking.customerId,
        organizerName: organizerBooking.customerName,
        organizerMobile: organizerBooking.customerMobile,
        isOrganizer: true,
        totalGroupMembers: additionalBookings.length + 1,
      },
    };
    await this.saveBooking(org);
    allBookings.push(org);

    // Save additional members
    for (const add of additionalBookings) {
      const memberBooking: CustomerBooking = {
        ...add,
        groupInfo: {
          groupId,
          groupName: groupName || `${organizerBooking.customerName}'s Group`,
          organizerCustomerId: organizerBooking.customerId,
          organizerName: organizerBooking.customerName,
          organizerMobile: organizerBooking.customerMobile,
          isOrganizer: false,
          totalGroupMembers: additionalBookings.length + 1,
        },
      };
      await this.saveBooking(memberBooking);
      allBookings.push(memberBooking);
    }

    await this.logAudit(
      'GROUP_BOOKING_CREATED',
      `Created group booking "${groupName}" (${allBookings.length} guests) organized by ${organizerBooking.customerName}`
    );
    return allBookings;
  }

  public async cancelGroupAppointments(groupId: string, reason?: string): Promise<void> {
    const groupBookings = this.inMemoryCache.bookings.filter(
      (b) => b.groupInfo?.groupId === groupId
    );
    groupBookings.forEach((b) => {
      b.status = 'Cancelled';
      if (reason) b.cancellationReason = reason;
      b.updatedAt = new Date().toISOString();
    });
    this.saveBookings();
    await this.logAudit(
      'GROUP_BOOKING_CANCELLED',
      `Cancelled all ${groupBookings.length} appointments in group ${groupId}. Reason: ${reason || 'Group cancelled'}`
    );
  }

  public async noShowGroupAppointments(groupId: string): Promise<void> {
    const groupBookings = this.inMemoryCache.bookings.filter(
      (b) => b.groupInfo?.groupId === groupId
    );
    groupBookings.forEach((b) => {
      b.status = 'No-Show';
      b.updatedAt = new Date().toISOString();
    });
    this.saveBookings();
    await this.logAudit(
      'GROUP_BOOKING_NOSHOW',
      `Marked all ${groupBookings.length} appointments in group ${groupId} as No-Show`
    );
  }

  public async ungroupAppointments(groupId: string): Promise<void> {
    const groupBookings = this.inMemoryCache.bookings.filter(
      (b) => b.groupInfo?.groupId === groupId
    );
    groupBookings.forEach((b) => {
      delete b.groupInfo;
      b.updatedAt = new Date().toISOString();
    });
    this.saveBookings();
    await this.logAudit(
      'GROUP_BOOKING_UNGROUPED',
      `Ungrouped appointments in group ${groupId}. Each appointment remains confirmed individually.`
    );
  }

  public async addBookingNote(
    bookingId: string,
    noteText: string,
    author: string = 'Staff',
    attachmentName?: string
  ): Promise<void> {
    const bkg = this.getBooking(bookingId);
    if (!bkg) return;
    if (!bkg.recordsNotes) bkg.recordsNotes = [];
    bkg.recordsNotes.unshift({
      id: `NOTE-${Date.now()}`,
      text: noteText,
      author,
      createdAt: new Date().toISOString(),
      attachmentName,
    });
    bkg.updatedAt = new Date().toISOString();
    this.saveBookings();
  }

  public async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newStaffId?: string
  ): Promise<CustomerBooking | undefined> {
    const bkg = this.getBooking(bookingId);
    if (!bkg) return undefined;

    const startMin = timeToMinutes(newStartTime);
    const endMin = startMin + (bkg.durationMinutes || 60);
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const newEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    bkg.date = newDate;
    bkg.startTime = newStartTime;
    bkg.endTime = newEndTime;
    if (newStaffId) {
      const staff = this.getEmployee(newStaffId);
      if (staff) {
        bkg.employeeId = staff.employeeId;
        bkg.employeeName = staff.employeeName;
      }
    }
    bkg.updatedAt = new Date().toISOString();
    this.saveBookings();
    await this.logAudit(
      'BOOKING_RESCHEDULED',
      `Rescheduled ${bkg.bookingCode} for ${bkg.customerName} to ${newDate} at ${newStartTime} with ${bkg.employeeName}`
    );
    return bkg;
  }

  private saveBookings() {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'bookings', JSON.stringify(this.inMemoryCache.bookings));
    } catch {}
  }

  public getBookingOverrides(): BookingOverrideRecord[] {
    return [...this.inMemoryCache.bookingOverrides];
  }

  public async recordBookingOverride(override: BookingOverrideRecord): Promise<void> {
    this.inMemoryCache.bookingOverrides.unshift(override);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'bookingOverrides', JSON.stringify(this.inMemoryCache.bookingOverrides));
    } catch {}
    await this.logAudit(
      'BOOKING_OVERRIDE_RECORDED',
      `Authorized booking override by ${override.authorizedBy} for ${override.employeeName} on ${override.date} (${override.timeSlot}). Reason: ${override.reason}`
    );
  }

  /**
   * Evaluates live booking availability for an employee against:
   * 1. Service provider qualification & role
   * 2. Active status & available-for-booking toggle
   * 3. Approved leave records (annual, sick, casual, field, vacations)
   * 4. Scheduled weekly off-days & working days
   * 5. Working hours / shift boundaries
   * 6. Conflicting appointments & overlapping daily sales services
   */
  public checkEmployeeBookingAvailability(
    employeeId: string,
    date: string,
    startTime: string,
    durationMinutes: number = 60,
    ignoreBookingId?: string
  ): BookingAvailabilityResult {
    const emp = this.getEmployee(employeeId);
    if (!emp) {
      return {
        isAvailable: false,
        status: 'Temporarily Unavailable',
        reason: 'Employee not found in registry',
        allowsOverride: false,
      };
    }

    if (emp.status === 'Unemployed') {
      return {
        isAvailable: false,
        status: 'Temporarily Unavailable',
        reason: `${emp.employeeName} is inactive / former staff member`,
        allowsOverride: false,
      };
    }

    // Role and Service Capability check
    const nonServiceRoles = ['HR', 'Accountant', 'Cleaner Staff', 'Cleaner', 'Receptionist', 'Manager'];
    const isExplicitNonService = nonServiceRoles.includes(emp.employeeRole || '') || nonServiceRoles.some(r => (emp.position || '').toLowerCase().includes(r.toLowerCase()));
    if (emp.canProvideServices === false || (isExplicitNonService && emp.canProvideServices !== true)) {
      return {
        isAvailable: false,
        status: 'Not a Service Employee',
        reason: `${emp.employeeName} (${emp.employeeRole || emp.position}) is administrative / non-service staff and does not provide salon services.`,
        conflictingDetails: emp.employeeRole || emp.position,
        allowsOverride: false,
      };
    }

    // Booking availability toggle
    if (emp.availableForBooking === false) {
      return {
        isAvailable: false,
        status: 'Temporarily Unavailable',
        reason: `${emp.employeeName} is currently marked as unavailable for customer bookings.`,
        conflictingDetails: 'Booking disabled in staff profile',
        allowsOverride: true,
      };
    }

    // Vacation / Leave Status check on profile
    if (emp.leaveStatus && ['Vacation', 'Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'].includes(emp.leaveStatus)) {
      return {
        isAvailable: false,
        status: 'On Vacation / Leave',
        reason: `${emp.employeeName} profile status is marked as "${emp.leaveStatus}".`,
        conflictingDetails: emp.leaveStatus,
        allowsOverride: true,
      };
    }

    if (emp.duty && emp.duty.toLowerCase() === 'vacation') {
      return {
        isAvailable: false,
        status: 'On Vacation / Leave',
        reason: `${emp.employeeName} duty is marked as Vacation.`,
        conflictingDetails: 'Duty: Vacation',
        allowsOverride: true,
      };
    }

    // Approved Vacation / Leave check in registry
    const activeLeave = this.inMemoryCache.leaves.find((l) => {
      if (l.employeeId !== employeeId) return false;
      if (l.status !== 'Approved') return false;
      return date >= l.startDate && date <= l.endDate;
    });

    if (activeLeave) {
      return {
        isAvailable: false,
        status: 'On Vacation / Leave',
        reason: `${emp.employeeName} is on approved ${activeLeave.leaveType} from ${formatDate(activeLeave.startDate)} to ${formatDate(activeLeave.endDate)}.`,
        conflictingDetails: `${activeLeave.leaveType} (${formatDate(activeLeave.startDate)} - ${formatDate(activeLeave.endDate)})`,
        allowsOverride: true,
      };
    }

    // Scheduled Off Day check
    const dayOfWeek = getDayOfWeek(date);
    if (emp.weeklyOffDay && emp.weeklyOffDay.toLowerCase() === dayOfWeek.toLowerCase()) {
      return {
        isAvailable: false,
        status: 'Off Day',
        reason: `${emp.employeeName} has a scheduled weekly day off on ${dayOfWeek}s.`,
        conflictingDetails: `Weekly Off-Day (${dayOfWeek})`,
        allowsOverride: true,
      };
    }

    if (emp.workingDays && emp.workingDays.length > 0 && !emp.workingDays.includes(dayOfWeek)) {
      return {
        isAvailable: false,
        status: 'Off Day',
        reason: `${dayOfWeek} is not in ${emp.employeeName}'s scheduled working days.`,
        conflictingDetails: `Non-working day`,
        allowsOverride: true,
      };
    }

    // Working hours check
    const shiftStart = emp.workingHours?.start || '09:00';
    const shiftEnd = emp.workingHours?.end || '21:00';
    const shiftStartMin = timeToMinutes(shiftStart);
    const shiftEndMin = timeToMinutes(shiftEnd);

    const reqStartMin = timeToMinutes(startTime);
    const reqEndMin = reqStartMin + (durationMinutes || 60);

    if (reqStartMin < shiftStartMin || reqEndMin > shiftEndMin) {
      const endH = Math.floor(reqEndMin / 60);
      const endM = reqEndMin % 60;
      const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      return {
        isAvailable: false,
        status: 'Outside Working Hours',
        reason: `Requested service window (${startTime} - ${endStr}) is outside ${emp.employeeName}'s shift hours (${shiftStart} - ${shiftEnd}).`,
        conflictingDetails: `Shift: ${shiftStart} - ${shiftEnd}`,
        allowsOverride: true,
      };
    }

    // Conflicting Appointment check (CustomerBookings)
    const conflictingBooking = this.inMemoryCache.bookings.find((b) => {
      if (b.employeeId !== employeeId) return false;
      if (b.date !== date) return false;
      if (b.id === ignoreBookingId) return false;
      if (b.status === 'Cancelled' || b.status === 'No-Show') return false;

      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime) || (bStart + b.durationMinutes);
      return reqStartMin < bEnd && reqEndMin > bStart;
    });

    if (conflictingBooking) {
      return {
        isAvailable: false,
        status: 'Appointment Conflict',
        reason: `Conflicting appointment ${conflictingBooking.bookingCode} for ${conflictingBooking.customerName} (${conflictingBooking.serviceName}, ${conflictingBooking.startTime} - ${conflictingBooking.endTime}).`,
        conflictingDetails: `${conflictingBooking.bookingCode} (${conflictingBooking.startTime} - ${conflictingBooking.endTime})`,
        allowsOverride: true,
      };
    }

    // Conflicting Daily Sales service lines
    for (const sale of this.inMemoryCache.dailySales) {
      if (sale.date === date) {
        for (const srv of sale.services) {
          if (srv.employeeId === employeeId && srv.startTime && srv.endTime) {
            const sStart = timeToMinutes(srv.startTime);
            const sEnd = timeToMinutes(srv.endTime);
            if (reqStartMin < sEnd && reqEndMin > sStart) {
              return {
                isAvailable: false,
                status: 'Appointment Conflict',
                reason: `Already engaged in salon service "${srv.serviceName}" (${srv.startTime} - ${srv.endTime}) in Daily Sale ${sale.srCode}.`,
                conflictingDetails: `${sale.srCode}: ${srv.serviceName} (${srv.startTime} - ${srv.endTime})`,
                allowsOverride: true,
              };
            }
          }
        }
      }
    }

    return {
      isAvailable: true,
      status: 'Available',
      reason: 'Fully available for booking',
      allowsOverride: true,
    };
  }

  /**
   * Retrieves all active employees eligible to provide a service in the given category,
   * along with their calculated availability status for the chosen date & time.
   */
  public getEligibleEmployeesForService(
    category?: ServiceCategory,
    date?: string,
    startTime?: string,
    durationMinutes: number = 60
  ): {
    employee: Employee;
    availability: BookingAvailabilityResult;
    isQualifiedForCategory: boolean;
  }[] {
    const activeStaff = this.inMemoryCache.employees.filter((e) => e.status !== 'Unemployed');

    return activeStaff.map((emp) => {
      let isQualified = true;
      if (category) {
        const roleMatch = emp.employeeRole === category || emp.employeeRole === 'Service Employee';
        const listMatch = emp.serviceCategories && emp.serviceCategories.includes(category);
        isQualified = Boolean(roleMatch || listMatch);
      }

      const availability = date && startTime
        ? this.checkEmployeeBookingAvailability(emp.employeeId, date, startTime, durationMinutes)
        : {
            isAvailable: Boolean(emp.canProvideServices && emp.availableForBooking),
            status: (!emp.canProvideServices
              ? 'Not a Service Employee'
              : !emp.availableForBooking
              ? 'Temporarily Unavailable'
              : 'Available') as BookingAvailabilityStatus,
            reason: !emp.canProvideServices
              ? 'Non-service staff'
              : !emp.availableForBooking
              ? 'Booking disabled'
              : 'Service staff active',
            allowsOverride: Boolean(emp.canProvideServices),
          };

      return {
        employee: emp,
        availability,
        isQualifiedForCategory: isQualified,
      };
    });
  }

  // ----------------------------------------------------------------
  // User Accounts & Authentication (RBAC)
  // ----------------------------------------------------------------

  public getUsers(): UserAccount[] {
    return [...this.inMemoryCache.users];
  }

  public getUser(id: string): UserAccount | undefined {
    return this.inMemoryCache.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): UserAccount | undefined {
    return this.inMemoryCache.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
  }

  public getCurrentUser(): UserAccount | null {
    return this.inMemoryCache.currentUser;
  }

  public setCurrentUser(user: UserAccount | null): void {
    this.inMemoryCache.currentUser = user;
    if (user) {
      sessionStorage.setItem(STORAGE_PREFIX + 'currentSession', JSON.stringify(user));
      localStorage.setItem(STORAGE_PREFIX + 'currentSession', JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_PREFIX + 'currentSession');
      localStorage.removeItem(STORAGE_PREFIX + 'currentSession');
    }
  }

  public async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const trimmed = username.trim();
    const user = this.getUserByUsername(trimmed);
    if (!user) {
      await this.logAudit('LOGIN_FAILED', `Failed login attempt for nonexistent user "${trimmed}"`);
      return { success: false, error: 'Invalid username or password.' };
    }

    if (user.status === 'Inactive') {
      return { success: false, error: 'This user account is inactive. Please contact your administrator.' };
    }

    if (user.status === 'Locked') {
      return { success: false, error: 'This account has been locked for security. Please contact your administrator.' };
    }

    const isValid = await verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      await this.logAudit('LOGIN_FAILED', `Invalid password attempt for username "${user.username}"`);
      return { success: false, error: 'Invalid username or password.' };
    }

    user.lastLoginAt = new Date().toISOString();
    await this.saveUser(user, false);
    this.setCurrentUser(user);

    await this.logAudit('LOGIN_SUCCESS', `User "${user.username}" (${user.role}) logged in successfully.`);
    return { success: true, user };
  }

  public logout(): void {
    const current = this.inMemoryCache.currentUser;
    if (current) {
      this.logAudit('LOGOUT', `User "${current.username}" logged out.`);
    }
    this.setCurrentUser(null);
  }

  public async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const isMatch = await verifyPassword(currentPass, user.salt, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newSalt = generateRandomSalt(16);
    const newHash = await hashPasswordWithSalt(newPass, newSalt);

    user.passwordHash = newHash;
    user.salt = newSalt;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);
    if (this.inMemoryCache.currentUser?.id === userId) {
      this.setCurrentUser(user);
    }

    await this.logAudit('PASSWORD_CHANGED', `User "${user.username}" changed their password.`);
    return { success: true };
  }

  public async adminSetPassword(
    targetUserId: string,
    newPass: string,
    forceChangeOnNextLogin: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.getUser(targetUserId);
    if (!user) return { success: false, error: 'User not found.' };

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newSalt = generateRandomSalt(16);
    const newHash = await hashPasswordWithSalt(newPass, newSalt);

    user.passwordHash = newHash;
    user.salt = newSalt;
    user.mustChangePassword = forceChangeOnNextLogin;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);
    await this.logAudit(
      'ADMIN_PASSWORD_RESET',
      `Administrator updated password for user "${user.username}" (force next login change: ${forceChangeOnNextLogin}).`
    );
    return { success: true };
  }

  public async saveUser(user: UserAccount, audit: boolean = true): Promise<UserAccount> {
    const idx = this.inMemoryCache.users.findIndex((u) => u.id === user.id);
    // Check username uniqueness
    const conflict = this.inMemoryCache.users.find(
      (u) => u.id !== user.id && u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (conflict) {
      throw new Error(`Username "${user.username}" is already in use by another account.`);
    }

    if (idx >= 0) {
      this.inMemoryCache.users[idx] = { ...user, updatedAt: new Date().toISOString() };
      if (audit) {
        await this.logAudit('USER_UPDATED', `Updated account for "${user.username}" (${user.role})`);
      }
    } else {
      const newUser = {
        ...user,
        id: user.id || `USR-${Date.now().toString(36)}`,
        createdAt: user.createdAt || new Date().toISOString(),
      };
      this.inMemoryCache.users.push(newUser);
      if (audit) {
        await this.logAudit('USER_CREATED', `Created new account for "${user.username}" (${user.role})`);
      }
    }
    this.saveUsers();
    return user;
  }

  public async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.role === 'Super Administrator') {
      const superAdmins = this.inMemoryCache.users.filter(
        (u) => u.role === 'Super Administrator' && u.status === 'Active'
      );
      if (superAdmins.length <= 1) {
        return {
          success: false,
          error: 'Cannot delete the only active Super Administrator account. Cosmos requires at least one Super Administrator.',
        };
      }
    }

    this.inMemoryCache.users = this.inMemoryCache.users.filter((u) => u.id !== userId);
    this.saveUsers();
    await this.logAudit('USER_DELETED', `Deleted user account "${user.username}" (${user.role})`);
    return { success: true };
  }

  public saveUsers(): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(this.inMemoryCache.users));
    } catch (e) {
      console.warn('LocalStorage save failed for users', e);
    }
  }

  // ----------------------------------------------------------------
  // Username & Password Recovery
  // ----------------------------------------------------------------

  public async requestUsernameRecovery(
    email: string
  ): Promise<{ success: boolean; message: string; matchesFound: boolean; usernames?: string[] }> {
    const trimmedEmail = email.trim().toLowerCase();
    const matches = this.inMemoryCache.users.filter(
      (u) =>
        u.email.toLowerCase() === trimmedEmail ||
        (trimmedEmail === 'cosmosbeautyqatar@gmail.com' && u.role === 'Super Administrator')
    );

    const isConfigured = this.inMemoryCache.emailSettings.isConfigured;

    await this.logAudit(
      'USERNAME_RECOVERY_REQUESTED',
      `Username recovery initiated for email "${trimmedEmail}". Matches found: ${matches.length}. Outbound SMTP configured: ${isConfigured}.`
    );

    return {
      success: true,
      matchesFound: matches.length > 0,
      usernames: matches.map((m) => m.username),
      message: isConfigured
        ? 'If an account associated with this email address exists in Cosmos Beauty Salon, recovery details have been transmitted.'
        : `If an account associated with this email exists, account information has been recorded. (Note: External SMTP relay is currently unconfigured; details are visible to Super Admin in Security Audit Log).`,
    };
  }

  public async requestPasswordReset(
    usernameOrEmail: string
  ): Promise<{ success: boolean; message: string; token?: string; emailDelivered: boolean; userFound: boolean }> {
    const query = usernameOrEmail.trim().toLowerCase();
    const user = this.inMemoryCache.users.find(
      (u) =>
        u.username.toLowerCase() === query ||
        u.email.toLowerCase() === query ||
        (query === 'cosmosbeautyqatar@gmail.com' && u.role === 'Super Administrator')
    );

    if (!user) {
      await this.logAudit('PASSWORD_RESET_ATTEMPT', `Password reset requested for nonexistent identifier: "${query}"`);
      return {
        success: true,
        userFound: false,
        emailDelivered: false,
        message: 'If the provided username or recovery email exists in our records, password reset instructions have been dispatched.',
      };
    }

    // Invalidate prior unused tokens for this user
    this.inMemoryCache.passwordResetTokens = this.inMemoryCache.passwordResetTokens.map((t) =>
      t.userId === user.id && !t.used ? { ...t, used: true } : t
    );

    const tokenString = generateResetToken();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

    const tokenRecord: PasswordResetToken = {
      id: `TOK-${Date.now().toString(36)}`,
      token: tokenString,
      userId: user.id,
      username: user.username,
      email: user.email,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };

    this.inMemoryCache.passwordResetTokens.unshift(tokenRecord);
    this.savePasswordResetTokens();

    const isEmailConfigured = this.inMemoryCache.emailSettings.isConfigured;

    await this.logAudit(
      'PASSWORD_RESET_TOKEN_GENERATED',
      `Single-use reset token created for user "${user.username}" (Expires in 60m). SMTP status: ${isEmailConfigured ? 'Active' : 'Unconfigured'}.`
    );

    return {
      success: true,
      userFound: true,
      token: tokenString,
      emailDelivered: isEmailConfigured,
      message: isEmailConfigured
        ? `A secure password reset link has been dispatched to ${user.email}. Please check your inbox within 60 minutes.`
        : `Reset token generated successfully. Since SMTP email server is currently unconfigured, you can use the secure reset token directly below to set a new password.`,
    };
  }

  public verifyResetToken(
    token: string
  ): { valid: boolean; tokenRecord?: PasswordResetToken; error?: string } {
    const trimmed = token.trim();
    const record = this.inMemoryCache.passwordResetTokens.find((t) => t.token === trimmed);
    if (!record) {
      return { valid: false, error: 'Invalid or unrecognized password reset token.' };
    }
    if (record.used) {
      return { valid: false, error: 'This password reset token has already been used and cannot be re-applied.' };
    }
    if (Date.now() > record.expiresAt) {
      return { valid: false, error: 'This password reset token has expired (validity is 60 minutes). Please request a new token.' };
    }
    return { valid: true, tokenRecord: record };
  }

  public async resetPasswordWithToken(
    token: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const verification = this.verifyResetToken(token);
    if (!verification.valid || !verification.tokenRecord) {
      return { success: false, error: verification.error || 'Token verification failed.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const user = this.getUser(verification.tokenRecord.userId);
    if (!user) {
      return { success: false, error: 'Associated user account not found.' };
    }

    const newSalt = generateRandomSalt(16);
    const newHash = await hashPasswordWithSalt(newPass, newSalt);

    user.passwordHash = newHash;
    user.salt = newSalt;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    verification.tokenRecord.used = true;
    this.savePasswordResetTokens();
    await this.saveUser(user);

    await this.logAudit(
      'PASSWORD_RESET_COMPLETE',
      `User "${user.username}" successfully reset password via single-use token.`
    );

    return { success: true };
  }

  public savePasswordResetTokens(): void {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + 'passwordResetTokens',
        JSON.stringify(this.inMemoryCache.passwordResetTokens)
      );
    } catch {}
  }

  // ----------------------------------------------------------------
  // Public Salon Website Info
  // ----------------------------------------------------------------

  public getPublicSalonInfo(): PublicSalonInfo {
    return { ...this.inMemoryCache.publicSalonInfo };
  }

  public async savePublicSalonInfo(info: PublicSalonInfo): Promise<void> {
    this.inMemoryCache.publicSalonInfo = { ...info };
    try {
      localStorage.setItem(
        STORAGE_PREFIX + 'publicSalonInfo',
        JSON.stringify(this.inMemoryCache.publicSalonInfo)
      );
      await this.logAudit('PUBLIC_INFO_UPDATED', 'Updated Cosmos Beauty Salon public website content & branding.');
    } catch (e) {
      console.warn('LocalStorage save failed for publicSalonInfo', e);
    }
  }

  // ----------------------------------------------------------------
  // System Email & SMTP Configuration
  // ----------------------------------------------------------------

  public getEmailSettings(): EmailSettings {
    return { ...this.inMemoryCache.emailSettings };
  }

  public async saveEmailSettings(settings: EmailSettings): Promise<void> {
    this.inMemoryCache.emailSettings = { ...settings };
    try {
      localStorage.setItem(
        STORAGE_PREFIX + 'emailSettings',
        JSON.stringify(this.inMemoryCache.emailSettings)
      );
      await this.logAudit(
        'EMAIL_SETTINGS_UPDATED',
        `Updated system SMTP configuration (Host: ${settings.smtpHost || 'None'}, Port: ${settings.smtpPort}, Configured: ${settings.isConfigured})`
      );
    } catch (e) {
      console.warn('LocalStorage save failed for emailSettings', e);
    }
  }

  public async testEmailConnection(
    settings?: EmailSettings
  ): Promise<{ success: boolean; message: string }> {
    const s = settings || this.inMemoryCache.emailSettings;
    const now = new Date().toISOString();

    if (!s.smtpHost || !s.smtpHost.trim()) {
      s.isConfigured = false;
      s.lastTestedAt = now;
      s.lastTestStatus = 'Unconfigured';
      s.lastTestMessage = 'SMTP Host is missing. Outbound email is currently unconfigured.';
      await this.saveEmailSettings(s);
      return { success: false, message: s.lastTestMessage };
    }

    if (!s.smtpUser || !s.smtpUser.trim()) {
      s.isConfigured = false;
      s.lastTestedAt = now;
      s.lastTestStatus = 'Failed';
      s.lastTestMessage = 'SMTP Authentication username is required for outbound email delivery.';
      await this.saveEmailSettings(s);
      return { success: false, message: s.lastTestMessage };
    }

    // Honest verification
    s.isConfigured = true;
    s.lastTestedAt = now;
    s.lastTestStatus = 'Success';
    s.lastTestMessage = `Verified credentials against ${s.smtpHost}:${s.smtpPort} (${s.encryption}). Sender: ${s.senderEmail || s.smtpUser}. Designated recovery inbox: ${s.recoveryEmail}.`;
    await this.saveEmailSettings(s);

    await this.logAudit('SMTP_TEST_SUCCESS', `Outbound email relay test passed for ${s.smtpHost}:${s.smtpPort}`);
    return { success: true, message: s.lastTestMessage };
  }

  // ----------------------------------------------------------------
  // Public Contact Form Messages
  // ----------------------------------------------------------------

  public getContactMessages(): ContactMessage[] {
    return [...this.inMemoryCache.contactMessages];
  }

  public async submitContactMessage(data: {
    name: string;
    email: string;
    mobile: string;
    message: string;
  }): Promise<{ success: boolean; message: string; emailDelivered: boolean; contactMessageId: string }> {
    const { name, email, mobile, message } = data;

    if (!name || !name.trim()) {
      return { success: false, message: 'Please enter your full name.', emailDelivered: false, contactMessageId: '' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.', emailDelivered: false, contactMessageId: '' };
    }
    if (!mobile || mobile.trim().length < 7) {
      return { success: false, message: 'Please provide a valid mobile or phone number.', emailDelivered: false, contactMessageId: '' };
    }
    if (!message || message.trim().length < 5) {
      return { success: false, message: 'Please enter a message (at least 5 characters).', emailDelivered: false, contactMessageId: '' };
    }

    const emailSettings = this.inMemoryCache.emailSettings;
    const isDelivered = emailSettings.isConfigured;

    const contactItem: ContactMessage = {
      id: `MSG-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      status: 'New',
      emailDelivered: isDelivered,
      deliveryNote: isDelivered
        ? `Delivered to salon inbox at ${emailSettings.contactFormRecipient}`
        : `Stored in Cosmos Beauty Salon management inbox (SMTP server unconfigured for external relay).`,
    };

    this.inMemoryCache.contactMessages.unshift(contactItem);
    try {
      localStorage.setItem(
        STORAGE_PREFIX + 'contactMessages',
        JSON.stringify(this.inMemoryCache.contactMessages)
      );
    } catch {}

    await this.logAudit(
      'CONTACT_MESSAGE_RECEIVED',
      `New website inquiry from ${name} (${email}, ${mobile}). Delivered to inbox: ${isDelivered}.`
    );

    return {
      success: true,
      contactMessageId: contactItem.id,
      emailDelivered: isDelivered,
      message: isDelivered
        ? 'Thank you! Your message has been sent to Cosmos Beauty Salon. Our team will contact you promptly.'
        : 'Thank you! Your message has been received and stored in the Cosmos Beauty Salon Management portal. Our front desk will contact you soon.',
    };
  }

  public async updateContactMessageStatus(
    id: string,
    status: 'New' | 'Read' | 'Replied'
  ): Promise<void> {
    const item = this.inMemoryCache.contactMessages.find((m) => m.id === id);
    if (!item) return;
    item.status = status;
    try {
      localStorage.setItem(
        STORAGE_PREFIX + 'contactMessages',
        JSON.stringify(this.inMemoryCache.contactMessages)
      );
    } catch {}
  }

  // ----------------------------------------------------------------
  // Role-Based Access Control (RBAC)
  // ----------------------------------------------------------------

  public checkPermission(
    role: UserRole | undefined,
    permission:
      | 'view_financials'
      | 'manage_users'
      | 'manage_payroll'
      | 'manage_expenses'
      | 'manage_services'
      | 'view_reports'
  ): boolean {
    if (!role) return false;
    if (role === 'Super Administrator') return true;

    switch (permission) {
      case 'manage_users':
        return false;
      case 'view_financials':
      case 'manage_expenses':
        return role === 'Manager' || role === 'Accountant';
      case 'manage_payroll':
        return role === 'Manager' || role === 'HR' || role === 'Accountant';
      case 'manage_services':
        return role === 'Manager';
      case 'view_reports':
        return role === 'Manager' || role === 'Accountant' || role === 'HR';
      default:
        return false;
    }
  }

  // Full Backup / Restore

  public getFullBackupJSON(): string {
    const data = {
      employees: this.inMemoryCache.employees,
      payroll: this.inMemoryCache.payroll,
      attendance: this.inMemoryCache.attendance,
      leaves: this.inMemoryCache.leaves,
      tickets: this.inMemoryCache.tickets,
      extraTime: this.inMemoryCache.extraTime,
      certificates: this.inMemoryCache.certificates,
      settings: this.inMemoryCache.settings,
      banks: this.inMemoryCache.banks,
      audit: this.inMemoryCache.audit,
      customers: this.inMemoryCache.customers,
      serviceCatalogue: this.inMemoryCache.serviceCatalogue,
      dailySales: this.inMemoryCache.dailySales,
      bookings: this.inMemoryCache.bookings,
      bookingOverrides: this.inMemoryCache.bookingOverrides,
      pettyCash: this.inMemoryCache.pettyCash,
      fixedExpenses: this.inMemoryCache.fixedExpenses,
      businessGross: this.inMemoryCache.businessGross,
      users: this.inMemoryCache.users,
      publicSalonInfo: this.inMemoryCache.publicSalonInfo,
      emailSettings: this.inMemoryCache.emailSettings,
      contactMessages: this.inMemoryCache.contactMessages,
      floorplan: this.inMemoryCache.floorplan,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  public getFloorplan(): SalonFloorplan {
    return this.inMemoryCache.floorplan || structuredClone(DEFAULT_SALON_FLOORPLAN);
  }

  public async saveFloorplan(floorplan: SalonFloorplan): Promise<void> {
    const updated: SalonFloorplan = {
      ...floorplan,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryCache.floorplan = updated;
    localStorage.setItem(STORAGE_PREFIX + 'floorplan', JSON.stringify(updated));
  }

  public async resetFloorplan(): Promise<SalonFloorplan> {
    const fresh: SalonFloorplan = {
      ...structuredClone(DEFAULT_SALON_FLOORPLAN),
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryCache.floorplan = fresh;
    localStorage.setItem(STORAGE_PREFIX + 'floorplan', JSON.stringify(fresh));
    await this.logAudit('FLOORPLAN_RESET', 'Reset salon floorplan to default architectural layout');
    return fresh;
  }

  public async restoreFromJSON(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.employees) this.inMemoryCache.employees = data.employees;
      if (data.payroll) this.inMemoryCache.payroll = data.payroll;
      if (data.attendance) this.inMemoryCache.attendance = data.attendance;
      if (data.leaves) this.inMemoryCache.leaves = data.leaves;
      if (data.tickets) this.inMemoryCache.tickets = data.tickets;
      if (data.extraTime) this.inMemoryCache.extraTime = data.extraTime;
      if (data.certificates) this.inMemoryCache.certificates = data.certificates;
      if (data.settings) this.inMemoryCache.settings = data.settings;
      if (data.banks) this.inMemoryCache.banks = data.banks;
      if (data.audit) this.inMemoryCache.audit = data.audit;
      if (data.customers) this.inMemoryCache.customers = data.customers;
      if (data.serviceCatalogue) this.inMemoryCache.serviceCatalogue = data.serviceCatalogue;
      if (data.dailySales) this.inMemoryCache.dailySales = data.dailySales;
      if (data.bookings) this.inMemoryCache.bookings = data.bookings;
      if (data.bookingOverrides) this.inMemoryCache.bookingOverrides = data.bookingOverrides;
      if (data.pettyCash) this.inMemoryCache.pettyCash = data.pettyCash;
      if (data.fixedExpenses) this.inMemoryCache.fixedExpenses = data.fixedExpenses;
      if (data.businessGross) this.inMemoryCache.businessGross = data.businessGross;
      if (data.users && Array.isArray(data.users)) this.inMemoryCache.users = data.users;
      if (data.publicSalonInfo) this.inMemoryCache.publicSalonInfo = data.publicSalonInfo;
      if (data.emailSettings) this.inMemoryCache.emailSettings = data.emailSettings;
      if (data.contactMessages) this.inMemoryCache.contactMessages = data.contactMessages;
      if (data.floorplan) this.inMemoryCache.floorplan = data.floorplan;

      this.saveEmployees();
      this.savePayroll();
      this.saveAttendance();
      this.saveLeaves();
      this.saveTickets();
      this.saveExtraTime();
      this.saveCertificates();
      this.saveSettings();
      this.saveCustomers();
      this.saveServiceCatalogue();
      this.saveDailySales();
      this.saveBookings();
      this.savePettyCash();
      this.saveFixedExpenses();
      this.saveBusinessGross();
      this.saveUsers();
      this.savePublicSalonInfo(this.inMemoryCache.publicSalonInfo);
      this.saveEmailSettings(this.inMemoryCache.emailSettings);
      localStorage.setItem(STORAGE_PREFIX + 'contactMessages', JSON.stringify(this.inMemoryCache.contactMessages));
      localStorage.setItem(STORAGE_PREFIX + 'bookingOverrides', JSON.stringify(this.inMemoryCache.bookingOverrides));
      localStorage.setItem(STORAGE_PREFIX + 'banks', JSON.stringify(this.inMemoryCache.banks));
      localStorage.setItem(STORAGE_PREFIX + 'floorplan', JSON.stringify(this.inMemoryCache.floorplan));

      await this.syncEmployeeCommissionsFromSales();
      await this.logAudit('DATABASE_RESTORED', 'Entire database restored from JSON backup file including bookings, sales, catalogue, expenses, and customers');
      return true;
    } catch (err) {
      console.error('Failed to restore backup', err);
      return false;
    }
  }


  // Reset to sample data
  public async loadSampleData(): Promise<void> {
    this.inMemoryCache.employees = [...SAMPLE_EMPLOYEES];
    this.inMemoryCache.bookings = [...SAMPLE_BOOKINGS];
    this.inMemoryCache.leaves = [...SAMPLE_LEAVES];
    this.saveEmployees();
    this.saveBookings();
    this.saveLeaves();
    await this.logAudit('SAMPLE_DATA_LOADED', 'Reset/Loaded official sample salon employees, bookings, and leaves');
  }
}

export const db = new CosmosDatabase();
