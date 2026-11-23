export interface FutureDeduction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  status: 'Scheduled' | 'Applied' | 'Cancelled';
}

export interface DocumentAttachment {
  name: string;
  data: string; // base64 / data URL
  date: string;
}

export interface Employee {
  no: number | string;
  employerId: string;
  company: string;
  duty: string;
  accommodation: string;
  contractNo: string;
  employeeId: string;
  contractType: string;
  joiningDate: string;
  endContract: string;
  mph: string;
  expireMph: string;
  position: string;
  employeeName: string;
  nationality: string;
  mobile: string;
  whatsapp: string;
  email: string;
  passportNumber: string;
  passportExpiry: string;
  passportDays: string;
  residencyQid: string;
  residencyExpiry: string;
  residencyDays: string;
  payerBank: string;
  payerBankShort: string;
  iban: string;
  basicSalary: number;
  foodAllowance: number;
  transportAllowance: number;
  carOperationAllowance: number;
  otherAllowance: number;
  limitedTransport: number;
  totalSalary: number;
  saleCommissionRate: number;
  saleTargetRate: number;
  totalSalesRate: number;
  targetSales: number;
  prodSaleCommission: number;
  prodSaleTarget: number;
  prodTotalSales: number;
  businessTargetRate: number;
  businessGross: number;
  businessTargetAmount?: number;
  businessCommBase?: 'all_gross' | 'above_target';
  businessBonus: number;
  deductionCurrent: number;
  deductionFuture: number;
  futureDeductions: FutureDeduction[];
  tips: number;
  outstanding: number;
  leaveEntitlement: number;
  annualLeavePaid: string;
  salariesWages: number;
  totalCreditLeave: number;
  lastLeaveDate: string;
  annualLeaveDays: number;
  annualLeaveStatus: string;
  annualLeavePaidAmt: number;
  annualLeaveRemaining: number;
  annualLeaveFees: number;
  ticketCycle: number;
  nextTicketDate: string;
  ticketStatus: string;
  ticketDestination: string;
  confirm: string;
  signature: string;
  date: string;
  status: 'Active' | 'Unemployed' | 'On Leave' | 'Notice Period' | 'Probation' | string;
  photoData?: string | null;
  imageData?: string | null;
  passportData?: DocumentAttachment | null;
  qidData?: DocumentAttachment | null;
  employerDocData?: DocumentAttachment | null;
  lastWorkingDate?: string;
  reasonForLeaving?: string;
  rejoiningDate?: string;
  weeklyOffDay?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;
  employeeRole?: EmployeeRole;
  assignedCategory?: SalonServiceCategory;
  canProvideServices?: boolean;
  availableForBooking?: boolean;
  serviceCategories?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  workingDays?: string[];
  salaryType?: 'Fixed Monthly' | 'Hourly' | 'Daily' | 'Monthly' | 'Contract' | string;
  hourlyRate?: number;
  dailyRate?: number;
  staffOrMilitaryNumber?: string;
  assignedServices?: string[];
  commissionEligible?: boolean;
  businessCommissionEligible?: boolean;
  leaveStatus?: 'Active Duty' | 'On Approved Leave' | 'On Sick Leave' | 'Vacation' | 'Annual Leave' | 'Emergency Leave' | 'On Vacation' | string;
}

export type SalonServiceCategory =
  | 'Hairdresser'
  | 'Eyelash Art'
  | 'Eyebrows Art'
  | 'Nail Art'
  | 'Spa'
  | 'Spray Tan'
  | string;

export type NonServiceRole =
  | 'Manager'
  | 'HR'
  | 'Receptionist'
  | 'Accountant'
  | 'Cleaner'
  | string;

export type EmployeeRole =
  | SalonServiceCategory
  | NonServiceRole
  | 'Cleaner Staff'
  | 'Service Employee'
  | string;

export type BookingAvailabilityStatus =
  | 'Available'
  | 'Not a Service Employee'
  | 'On Vacation / Leave'
  | 'Off Day'
  | 'Outside Working Hours'
  | 'Appointment Conflict'
  | 'Temporarily Unavailable';

export interface BookingAvailabilityResult {
  isAvailable: boolean;
  status: BookingAvailabilityStatus;
  reason: string;
  conflictingDetails?: string;
  allowsOverride: boolean;
}

export interface BookingOverrideRecord {
  id: string;
  bookingId?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timeSlot: string;
  authorizedBy: string;
  reason: string;
  timestamp: string;
}

export type BookingStatus =
  | 'Booked'
  | 'Confirmed'
  | 'In-Service'
  | 'Completed'
  | 'Cancelled'
  | 'No-Show'
  | string;

export interface BookingServiceItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  category: ServiceCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  dealName?: string;
  smartPricingApplied?: boolean;
  smartPricingAdjustment?: number;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  employeeId: string;
  employeeName: string;
}

export interface BookingNoteRecord {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  attachmentName?: string;
}

export interface RepeatConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
  neverEnds?: boolean;
  repeatId: string;
  occurrenceIndex?: number;
}

export interface GroupBookingInfo {
  groupId: string;
  groupName: string;
  organizerCustomerId: string;
  organizerName: string;
  organizerMobile: string;
  isOrganizer: boolean;
  totalGroupMembers?: number;
}

export interface CustomerBooking {
  id: string;
  bookingCode: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  serviceId?: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  servicePrice: number;
  originalPrice?: number;
  discountAmount?: number;
  dealName?: string;
  services?: BookingServiceItem[];
  employeeId: string;
  employeeName: string;
  status: BookingStatus;
  notes?: string;
  recordsNotes?: BookingNoteRecord[];
  isWalkIn?: boolean;
  isVip?: boolean;
  isOnlineBooking?: boolean;
  isRequestedStaff?: boolean;
  isBlockTime?: boolean;
  cardColor?: 'grey' | 'blue' | 'pink' | 'peach' | 'cyan' | 'white';
  repeatConfig?: RepeatConfig;
  groupInfo?: GroupBookingInfo;
  cancellationReason?: string;
  noShowNotes?: string;
  isOverride?: boolean;
  overrideDetails?: {
    authorizedBy: string;
    reason: string;
    timestamp: string;
  };
  convertedToSaleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: number;
  foodAllowance?: number;
  transportAllowance?: number;
  carOperationAllowance?: number;
  otherAllowance?: number;
  limitedTransport?: number;
  tips?: number;
  commissions: number;
  totalMonthlySalary?: number; // Total Monthly Salary & Wages before deductions: Basic + 5 Allowances + Tips + Commissions
  deductions: number;
  netSalary: number; // Total Net Payable: Total Monthly Salary & Wages - Deductions
  paidAmount: number;
  status: 'Draft' | 'Approved' | 'Paid' | 'Cancelled' | 'Partially Paid';
  paymentDate: string;
  notes: string;
  commissionBreakdown: {
    service: number; // Net Services Commission Due
    product: number; // Net Product Commission Due
    business: number; // Net Business Gross Commission Due
    totalCommission?: number;
    serviceTarget?: number;
    serviceActual?: number;
    serviceRate?: number;
    serviceAchievement?: number;
    serviceEligible?: boolean;
    productSales?: number;
    productRate?: number;
    productEligible?: boolean;
    businessTarget?: number;
    businessGross?: number;
    businessRate?: number;
    businessAchievement?: number;
    businessEligible?: boolean;
    businessSelectedByCompany?: boolean;
    businessCommBase?: 'all_gross' | 'above_target';
  };
}

export interface AttendanceRecord {
  attId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shiftType?: 'Split Shift' | 'Morning Shift' | 'Night Shift' | 'Single Shift';
  // Morning shift
  morningTimeIn?: string;
  morningTimeOut?: string;
  morningScheduledStart?: string;
  morningScheduledEnd?: string;
  morningWorkMinutes?: number;
  // Night shift
  nightTimeIn?: string;
  nightTimeOut?: string;
  nightScheduledStart?: string;
  nightScheduledEnd?: string;
  nightWorkMinutes?: number;
  // Single shift fallback
  scheduledStart: string;
  scheduledEnd: string;
  timeIn: string;
  timeOut: string;
  breakStart: string;
  breakEnd: string;
  // Aggregated day totals
  totalWorkMinutes: number;
  scheduledWorkMinutes: number;
  extraMinutes: number;
  shortMinutes?: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Day Off';
  remarks: string;
  createdAt: string;
  createdBy: string;
}

export interface ExtraTimeTransaction {
  extraId: string;
  employeeId: string;
  date: string;
  type: 'Earned' | 'Used';
  minutes: number;
  reason: string;
  balanceAfter: number;
  approvedBy: string;
  createdAt: string;
}

export interface LeaveRecord {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  days: number;
  leaveType: string;
  paidStatus: 'Paid' | 'Unpaid';
  status: 'Pending' | 'Approved' | 'Cancelled';
  period: string;
  remarks: string;
  requestedDate: string;
  approvedBy?: string | null;
  approvedDate?: string | null;
}

export interface FlightTicketRecord {
  ticketId: string;
  employeeId: string;
  employeeName: string;
  period: string;
  eligibleDate: string;
  bookedDate: string;
  destination: string;
  cost: number;
  status: 'Not Eligible' | 'Eligible' | 'Pending' | 'Approved' | 'Booked' | 'Used';
  createdAt: string;
}

export interface Certificate {
  certId: string;
  certType: 'salary' | 'employment' | 'termination' | 'vacating' | 'entitlements';
  certTypeName: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  employeeQid: string;
  employeeNationality: string;
  employeeJoiningDate: string;
  recipient: string;
  correspondingDate: string;
  reference: string;
  signatoryName: string;
  signatoryTitle: string;
  salaryData: {
    basicSalary: number;
    foodAllowance: number;
    transportAllowance: number;
    carOperationAllowance: number;
    otherAllowance: number;
    totalSalary: number;
  };
  includeBasic: boolean;
  includeFood: boolean;
  includeTransport: boolean;
  includeCar: boolean;
  includeOther: boolean;
  createdAt: string;
  htmlContent?: string;
  lastWorkingDate?: string;
  terminationReason?: string;
  customPositionName?: string;
  vacatingDate?: string;
  vacatingReason?: 'Resignation' | 'Termination' | 'Transfer to Another Company' | string;
  employmentEndDate?: string;
  entitlementReason?: 'Resignation' | 'Termination' | 'Transfer to Another Company' | string;
}

export interface BankInfo {
  name: string;
  short: string;
}

export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  signatoryName: string;
  signatoryTitle: string;
  certValidity: number;
  certCounter: number;
  salesCommRate: number;
  productCommRate: number;
  businessTarget: number;
  businessCommRate: number;
  businessCommBase: 'all_gross' | 'above_target';
  leaveEntitlement: number;
  leaveDivisor: number;
  ticketCycle: number;
  attOpening: string;
  attClosing: string;
  attBreakStart: string;
  attBreakEnd: string;
  attLateThreshold: number;
  attMorningStart: string;
  attMorningEnd: string;
  attNightStart: string;
  attNightEnd: string;
}

export interface AuditLogItem {
  id?: number;
  timestamp: string;
  action: string;
  details: string;
}

// ---------------------------------------------
// Daily Sales Report & Customer / Catalogue Types
// ---------------------------------------------

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  gender?: 'Female' | 'Male' | 'Other';
  birthday?: string;
  totalVisits: number;
  totalSpent: number;
  walletBalance?: number;
  outstandingBalance: number;
  rating?: number | null;
  reviewCount?: number;
  segment?: 'VIP' | 'Regular' | 'New' | 'At Risk' | 'Lapsed';
  loyaltyPoints?: number;
  canceledCount?: number;
  noShowCount?: number;
  notes?: string;
  isVip?: boolean;
  createdAt: string;
  lastVisitDate?: string;
}

export type ServiceCategory =
  | 'Hairdresser'
  | 'Eyelash Art'
  | 'Eyebrows Art'
  | 'Nail Art'
  | 'Spa'
  | 'Spray Tan'
  | string;

export interface ServiceCatalogueItem {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number; // in QAR
  durationMinutes?: number;
  isActive: boolean;
  description?: string;
}

export interface SaleServiceLine {
  id: string;
  serviceId?: string;
  serviceName: string;
  category: ServiceCategory;
  price: number;
  quantity: number;
  discount: number; // in QAR
  lineTotal: number; // (price * quantity) - discount
  employeeId: string; // assigned primary employee
  employeeName: string;
  startTime?: string;
  endTime?: string;
  // Shared service allocation
  sharedWithEmployeeId?: string;
  sharedWithEmployeeName?: string;
  sharedAmount?: number; // allocated QAR to second employee (must not exceed lineTotal)
}

export interface SaleProductLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // in QAR
  lineTotal: number; // (unitPrice * quantity) - discount
  employeeId: string; // assigned salesperson
  employeeName: string;
}

export interface SaleRefundRecord {
  refundId: string;
  date: string;
  amount: number;
  reason: string;
  refundMethod: 'Cash' | 'POS Card' | 'Fawran' | 'Credit';
  affectedEmployeeId?: string;
  processedBy?: string;
}

export interface DailySaleRecord {
  srNo: number; // Auto-generated sequential number (e.g. 1001, 1002...)
  srCode: string; // e.g. "CSR-1001"
  saleId: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  customerName: string;
  mobileNumber: string;

  // Items
  services: SaleServiceLine[];
  products: SaleProductLine[];

  // Transportation
  uberCharge: number; // Uber for Home Service (isolated)

  // Financial Subtotals & Revenues
  totalServiceAmount: number;
  totalProductAmount: number;
  grossSales: number; // totalServiceAmount + totalProductAmount (eligible business gross)
  totalRevenue: number; // grossSales + uberCharge (gross billable)

  // Payments
  posCard: number;
  cash: number;
  transferIncome?: number; // Bank Transfer payments
  fawran: number;
  fawranRecipientName: string;
  tips: number; // Separate, never inflates eligible sales
  unpaid: number; // Outstanding balance
  refunds: number; // Total refunded
  refundRecords?: SaleRefundRecord[];

  // Visit Timings & Flow
  timeIn?: string; // Time customer checked in / service started (e.g. "10:30 AM")
  timeOut?: string; // Time customer checkout/payment completed (e.g. "12:15 PM")
  visitStatus?: 'In Service' | 'Completed';

  // Reconciled Measures
  netSales: number; // totalRevenue - refunds
  totalPaid: number; // posCard + cash + fawran + (transferIncome || 0)
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Refunded';

  notes: string;
  createdAt: string;
  updatedAt: string;
}


export type CommissionSyncStatus =
  | 'Live – Saved'
  | 'Calculating Monthly Totals'
  | 'Synced'
  | 'Needs Attention';

export interface MonthlyEmployeeCommissionAggregate {
  employeeId: string;
  employeeName: string;
  position: string;
  // Stream 1: Service (10% target)
  serviceSalesTarget: number;
  actualEligibleSales: number; // Actual Eligible Sales (QAR) for the entire month
  serviceCommissionRate: number; // 10%
  serviceCommissionDue: number; // if actual >= target: actual * 10%, else 0
  serviceEligible: boolean;
  serviceAchievementRate: number;

  // Stream 2: Product (5%)
  eligibleProductSales: number; // Eligible Product Sales (QAR) for the entire month
  productCommissionRate: number; // 5%
  productCommissionDue: number; // productSales * 5%

  // Stream 3: Business Gross (5%)
  businessGrossSales: number; // Combined business gross for entire month
  businessTargetAmount: number;
  businessCommissionRate: number;
  businessCommissionDue: number;
  businessEligible: boolean;
  businessSelectedByCompany?: boolean;

  // Tips
  tips?: number;

  // Total
  totalCommissionDue: number;
  serviceTransactionCount: number;
  productTransactionCount: number;
}

export interface MonthlyCommissionSummary {
  monthYear: string; // "YYYY-MM"
  monthName: string; // e.g. "October 2026"
  syncStatus: CommissionSyncStatus;
  lastCalculatedAt: string;
  totalServiceSales: number;
  totalProductSales: number;
  totalBusinessGross: number;
  totalCommissionsDue: number;
  employeeAggregates: MonthlyEmployeeCommissionAggregate[];
  validationIssues?: string[];
}

// ---------------------------------------------
// Petty Cash Daily Expenses (VOICE)
// ---------------------------------------------
export interface PettyCashExpense {
  id: string;
  invoiceDate: string; // VOICE DATE (YYYY-MM-DD)
  invoiceRefNo: string; // VOICE REF No / VOICE No
  company: string; // VOICE COMPANY
  description: string; // VOICE DESCRIPTION
  status: 'Paid' | 'Unpaid'; // VOICE PIAD/Unpaid
  paymentMethod: string; // VOICE Payment Method (Name) (e.g. Cash, Card, Transfer, Fawran, Petty Cash Box)
  detailsComment: string; // VOICE DETAILS COMMENT
  cardCashType: 'Card' | 'Cash'; // VOICE CARD/CASH
  amount: number; // VOICE AMOUNT (QAR)
  month: string; // e.g. "October"
  year: string; // e.g. "2026"
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------
// Fixed Salon Expenses (Salaries, Leases, Utilities)
// ---------------------------------------------
export type FixedExpenseCategory =
  | 'Salaries & wages by WPS'
  | 'Salaries & wages by CASH'
  | 'Lease Shop'
  | 'Lease Flat'
  | 'Qatar Cool'
  | 'Internet'
  | 'Fresha'
  | 'Loyalty Card'
  | string;

export interface FixedExpense {
  id: string;
  date: string; // DATE (YYYY-MM-DD)
  refNo: string; // REF No / VOICE No
  category: FixedExpenseCategory; // Category
  company: string; // COMPANY
  description: string; // DESCRIPTION
  status: 'Paid' | 'Unpaid'; // PIAD/Unpaid
  paymentMethod: string; // Payment Method (Name)
  detailsComment: string; // DETAILS COMMENT
  cardCashType: 'Card' | 'Cash' | 'Bank / WPS'; // CARD/CASH
  amount: number; // AMOUNT (QAR)
  month: string; // e.g. "October"
  year: string; // e.g. "2026"
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------
// Business Gross Register (Daily, Monthly, Yearly)
// ---------------------------------------------
export interface BusinessGrossEntry {
  id: string;
  date: string; // YYYY-MM-DD
  posIncome: number; // POS in come
  cashIncome: number; // Cash in come
  transferIncome: number; // Transfer in come
  fawranIncome: number; // Fawran in come
  totalGross: number; // Total POS + Cash + Transfer + Fawran
  month: string;
  year: string;
  entryType?: 'Daily' | 'Monthly' | 'Yearly';
  notes?: string;
  registeredBy?: string;
  source: 'Daily Sales Auto-Sync' | 'Direct Business Register';
  createdAt: string;
}

// ---------------------------------------------
// Variable Salon Operating Expenses
// ---------------------------------------------
export type VariableExpenseCategory =
  | 'Salon Supplies'
  | 'Retail Stock Purchases'
  | 'Utilities'
  | 'Maintenance & Repairs'
  | 'Marketing & Advertising'
  | 'Laundry'
  | 'Transportation (Uber)'
  | 'Other Operating'
  | string;

export interface VariableExpense {
  id: string;
  date: string; // YYYY-MM-DD
  category: VariableExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: string;
  supplier?: string;
  receiptAttachment?: string;
  approvedBy: string;
  status: 'Paid' | 'Unpaid';
  month: string;
  year: string;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------
// Monthly Profit & Loss Statement (P&L)
// ---------------------------------------------
export interface ProfitAndLossStatement {
  month: string;
  year: string;
  period?: string;
  // Revenue
  grossSales: number;
  businessGrossSales: number;
  serviceSales: number;
  totalServiceSales: number;
  productSales: number;
  totalProductSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  // Cost & Expenses
  cogs: number;
  costOfGoodsSold: number;
  salariesAndWages: number;
  wagesByWps: number;
  wpsSalaries: number;
  salariesByCash: number;
  cashSalaries: number;
  totalSalaries: number;
  earnedCommissions: number;
  rentShop?: number;
  rentFlat?: number;
  totalRent?: number;
  utilitiesAndCooling?: number;
  softwareSubscriptions?: number;
  otherFixedExpenses?: number;
  fixedExpenses: number;
  totalFixedExpenses: number;
  variableExpenses: number;
  pettyCashExpenses: number;
  totalVariableExpenses: number;
  totalExpenses: number;
  totalBusinessExpenses: number;
  // Result
  netProfitOrLoss: number;
  isProfit: boolean;
  isProfitable: boolean;
  profitMargin: number;
  profitMarginPercent: number;
}

// ---------------------------------------------
// User Accounts & Authentication (RBAC)
// ---------------------------------------------
export type UserRole =
  | 'Super Administrator'
  | 'Manager'
  | 'HR'
  | 'Accountant'
  | 'Receptionist'
  | 'Service Employee';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // SHA-256 salted hash
  salt: string; // Unique random salt
  email: string; // Account recovery email
  fullName: string;
  role: UserRole;
  employeeId?: string;
  status: 'Active' | 'Inactive' | 'Locked';
  mustChangePassword: boolean; // Mandatory change on first login
  createdAt: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  username: string;
  email: string;
  expiresAt: number; // unix timestamp in ms
  used: boolean;
  createdAt: string;
}

// ---------------------------------------------
// Salon Public Website & Contact Details
// ---------------------------------------------
export interface PublicSalonInfo {
  salonName: string;
  headline: string;
  shortWelcome: string;
  aboutTitle: string;
  aboutDescription: string;
  mission: string;
  values: string[];
  contactEmail: string; // csmsbeauty@gmail.com
  contactMobile: string; // +974 7045 0040
  recoveryEmail: string; // cosmosbeautyqatar@gmail.com
  logoUrl?: string;
  address: string; // Doha, Qatar
  workingHours: string;
  heroImageUrl?: string;
  visibleCategories: string[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  submittedAt: string;
  status: 'New' | 'Read' | 'Replied';
  emailDelivered: boolean;
  deliveryNote?: string;
}

// ---------------------------------------------
// System Email & SMTP Configuration
// ---------------------------------------------
export interface EmailSettings {
  recoveryEmail: string; // Default: cosmosbeautyqatar@gmail.com
  contactFormRecipient: string; // Default: csmsbeauty@gmail.com
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderEmail: string;
  senderName: string;
  encryption: 'TLS' | 'SSL' | 'None';
  isConfigured: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'Success' | 'Failed' | 'Unconfigured';
  lastTestMessage?: string;
}

// ---------------------------------------------
// Interactive Salon Floorplan & Station Map
// ---------------------------------------------
export type FloorplanZoneType =
  | 'reception'
  | 'hair'
  | 'nails'
  | 'lashes'
  | 'spa'
  | 'backofhouse';

export type FloorplanStationType =
  | 'hair-chair'
  | 'shampoo-bowl'
  | 'manicure-table'
  | 'pedicure-spa'
  | 'treatment-bed'
  | 'spray-tan-booth'
  | 'reception-desk'
  | 'waiting-sofa'
  | 'retail-display'
  | 'color-bar'
  | 'office-desk'
  | 'restroom'
  | 'door'
  | 'partition';

export type FloorplanStationStatus =
  | 'Available'
  | 'In Service'
  | 'Reserved'
  | 'Maintenance'
  | 'Facility';

export interface FloorplanZone {
  id: string;
  name: string;
  category: FloorplanZoneType;
  x: number; // meters from left
  y: number; // meters from top
  width: number; // meters
  height: number; // meters
  floorFinish: 'terrazzo' | 'oak' | 'marble' | 'slate' | 'tile';
}

export interface FloorplanItem {
  id: string;
  code: string;
  label: string;
  type: FloorplanStationType;
  zoneId: string;
  x: number; // meters from left
  y: number; // meters from top
  width: number; // meters
  height: number; // meters
  rotation: 0 | 90 | 180 | 270;
  status: FloorplanStationStatus;
  assignedEmployeeId?: string;
  currentClientName?: string;
  notes?: string;
}

export interface SalonFloorplan {
  id: string;
  title: string;
  widthMeters: number;
  heightMeters: number;
  updatedAt: string;
  zones: FloorplanZone[];
  items: FloorplanItem[];
}


