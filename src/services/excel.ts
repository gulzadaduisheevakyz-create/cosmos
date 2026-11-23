import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord, Certificate, LeaveRecord, FlightTicketRecord, DailySaleRecord, Customer, PayrollRecord, PettyCashExpense, FixedExpense } from '../types';
import { calculateDaysRemaining, formatDate, getDayOfWeek, formatTime12, minutesToTimeStr, formatCurrency } from './db';


export function exportEmployeesToExcel(employees: Employee[], filename?: string) {
  if (!employees || employees.length === 0) {
    throw new Error('No employee records to export');
  }

  const exportData = employees.map((emp, idx) => ({
    'No': emp.no || idx + 1,
    'EMPLOYER ID': emp.employerId || '',
    'COMPANY': emp.company || '',
    'Duty': emp.duty || '',
    'Accommodation': emp.accommodation || '',
    'CONTRACT No': emp.contractNo || '',
    'EMPLOYEE ID': emp.employeeId || '',
    'CONTRACT Type': emp.contractType || '',
    'JOINING DATE': emp.joiningDate || '',
    'END CONTRACT': emp.endContract || '',
    'MPH CERTIFICATE': emp.mph || '',
    'EXPIRE MPH': emp.expireMph || '',
    'POSITION': emp.position || '',
    "EMPLOYEE'S NAME": emp.employeeName || '',
    'NATIONALITY': emp.nationality || '',
    'MOBILE': emp.mobile || '',
    'WHATSAPP': emp.whatsapp || '',
    'E-MAIL': emp.email || '',
    'PASSPORT NUMBER': emp.passportNumber || '',
    'PASSPORT EXPIRY': emp.passportExpiry || '',
    'PASSPORT DAYS': emp.passportDays || '',
    'RESIDENCY QID': emp.residencyQid || '',
    'RESIDENCY EXPIRY': emp.residencyExpiry || '',
    'RESIDENCY DAYS': emp.residencyDays || '',
    'PAYER BANK': emp.payerBank || '',
    'PAYER BANK SHORT': emp.payerBankShort || '',
    'PAYE BANK IBAN': emp.iban || '',
    'BASIC SALARY': Number(emp.basicSalary) || 0,
    'FOOD ALLOWANCE': Number(emp.foodAllowance) || 0,
    'TRANSPORTATION ALLOWANCE': Number(emp.transportAllowance) || 0,
    'CAR OPERATION ALLOWANCE': Number(emp.carOperationAllowance) || 0,
    'OTHER ALLOWANCE': Number(emp.otherAllowance) || 0,
    'LIMITED TRANSPORTATION': Number(emp.limitedTransport) || 0,
    'TOTAL SALARIES': Number(emp.totalSalary) || 0,
    'SALE COMMISSION RATE (%)': Number(emp.saleCommissionRate) || 10,
    'SALE TARGET RATE': Number(emp.saleTargetRate) || 0,
    'TOTAL SALES RATE': Number(emp.totalSalesRate) || 0,
    'TARGET SALES': Number(emp.targetSales) || 0,
    'PRODUCTS SALE COMMISSION (%)': Number(emp.prodSaleCommission) || 5,
    "PRODUCTS SALE'S TARGET": Number(emp.prodSaleTarget) || 0,
    "PRODUCTS TOTAL SALE'S": Number(emp.prodTotalSales) || 0,
    'BUSINESS TARGET 200,000 RATE (%)': Number(emp.businessTargetRate) || 5,
    'BUSINESS TARGET AMOUNT': Number(emp.businessTargetAmount) || 200000,
    'BUSINESS GROSS': Number(emp.businessGross) || 0,
    'BUSINESS COMMISSION BASE': emp.businessCommBase || 'all_gross',
    'BUSINESS BONUS': Number(emp.businessBonus) || 0,
    'DEDUCTION IN THE CURRENT MONTH': Number(emp.deductionCurrent) || 0,
    'DEDUCTION SCHEDULED FOR A FUTURE': Number(emp.deductionFuture) || 0,
    "TIP'S": Number(emp.tips) || 0,
    'OUTSTANDING': Number(emp.outstanding) || 0,
    'LEAVE ENTITLEMENT': Number(emp.leaveEntitlement) || 21,
    'Annual Leave Paid': emp.annualLeavePaid || '',
    'SALARIES & WAGES': Number(emp.salariesWages) || 0,
    'Total Credit Leave Days': Number(emp.totalCreditLeave) || 21,
    'LAST ANNUAL LEAVES DATE': emp.lastLeaveDate || '',
    'ANNUAL LEAVE DAYS': Number(emp.annualLeaveDays) || 0,
    'Annual Leave (Paid/Unpaid)': emp.annualLeaveStatus || 'Paid',
    'Annual Leave Paid Amount': Number(emp.annualLeavePaidAmt) || 0,
    'Annual Leave Remaining': Number(emp.annualLeaveRemaining) || 21,
    'Annual Leave Fees': Number(emp.annualLeaveFees) || 0,
    'TICKET CYCLE (YEARS)': Number(emp.ticketCycle) || 2,
    'NEXT TICKET DATE': emp.nextTicketDate || '',
    'TICKET STATUS': emp.ticketStatus || '',
    'TICKET DESTINATION': emp.ticketDestination || '',
    'I confirm': emp.confirm || '',
    'signature': emp.signature || '',
    'Date': emp.date || '',
    'STATUS': emp.status || 'Active',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  const outName = filename || `Cosmos_Beauty_Salon_Employees_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, outName);
}

export async function parseEmployeesFromExcel(file: File): Promise<{
  importedCount: number;
  updatedCount: number;
  employees: Employee[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });

  const parsedEmployees: Employee[] = [];
  let index = 1;

  for (const row of jsonData) {
    const empId = String(row['EMPLOYEE ID'] || row['Employee ID'] || `CBSE${20240 + index}`).trim();

    // Auto-calculate end contract (+2 years) if not provided
    let joiningDate = String(row['JOINING DATE'] || row['Joining Date'] || '').trim();
    let endContract = String(row['END CONTRACT'] || row['End Contract'] || '').trim();
    if (!endContract && joiningDate) {
      const join = new Date(joiningDate);
      if (!isNaN(join.getTime())) {
        join.setFullYear(join.getFullYear() + 2);
        endContract = join.toISOString().split('T')[0];
      }
    }

    // Auto-calculate passport & residency days
    const passportExpiry = String(row['PASSPORT EXPIRY'] || row['Passport Expiry'] || '').trim();
    let passportDays = String(row['PASSPORT DAYS'] || row['Passport Days'] || '').trim();
    if (passportExpiry && !passportDays) {
      const pDays = calculateDaysRemaining(passportExpiry);
      passportDays = `Day ${pDays}`;
    }

    const residencyExpiry = String(row['RESIDENCY EXPIRY'] || row['Residency Expiry'] || '').trim();
    let residencyDays = String(row['RESIDENCY DAYS'] || row['Residency Days'] || '').trim();
    if (residencyExpiry && !residencyDays) {
      const rDays = calculateDaysRemaining(residencyExpiry);
      residencyDays = `Day ${rDays}`;
    }

    const basicSalary = parseFloat(String(row['BASIC SALARY'] || row['Basic Salary'] || 0)) || 0;
    const foodAllowance = parseFloat(String(row['FOOD ALLOWANCE'] || row['Food Allowance'] || 0)) || 0;
    const transportAllowance = parseFloat(String(row['TRANSPORTATION ALLOWANCE'] || row['Transportation Allowance'] || 0)) || 0;
    const carOperationAllowance = parseFloat(String(row['CAR OPERATION ALLOWANCE'] || row['Car Operation Allowance'] || 0)) || 0;
    const otherAllowance = parseFloat(String(row['OTHER ALLOWANCE'] || row['Other Allowance'] || 0)) || 0;
    const limitedTransport = parseFloat(String(row['LIMITED TRANSPORTATION'] || row['Limited Transportation'] || 0)) || 0;
    const totalSalary = basicSalary + foodAllowance + transportAllowance + carOperationAllowance + otherAllowance + limitedTransport;

    const emp: Employee = {
      no: row['No'] ? String(row['No']) : index,
      employerId: String(row['EMPLOYER ID'] || row['Employer ID'] || '17-2681-92'),
      company: String(row['COMPANY'] || row['Company'] || 'COSMOS'),
      duty: String(row['Duty'] || 'Duty'),
      accommodation: String(row['Accommodation'] || 'Live In'),
      contractNo: String(row['CONTRACT No'] || row['Contract No'] || `CBS-${Date.now().toString().slice(-8)}`),
      employeeId: empId,
      contractType: String(row['CONTRACT Type'] || row['Contract Type'] || 'Contract'),
      joiningDate,
      endContract,
      mph: String(row['MPH CERTIFICATE'] || row['MPH'] || 'NO'),
      expireMph: String(row['EXPIRE MPH'] || row['Expire MPH'] || ''),
      position: String(row['POSITION'] || row['Position'] || 'Staff'),
      employeeName: String(row["EMPLOYEE'S NAME"] || row['Employee Name'] || row['Name'] || 'Employee ' + index),
      nationality: String(row['NATIONALITY'] || row['Nationality'] || 'KYRGYZSTAN'),
      mobile: String(row['MOBILE'] || row['Mobile'] || ''),
      whatsapp: String(row['WHATSAPP'] || row['WhatsApp'] || ''),
      email: String(row['E-MAIL'] || row['Email'] || ''),
      passportNumber: String(row['PASSPORT NUMBER'] || row['Passport Number'] || ''),
      passportExpiry,
      passportDays,
      residencyQid: String(row['RESIDENCY QID'] || row['QID'] || ''),
      residencyExpiry,
      residencyDays,
      payerBank: String(row['PAYER BANK'] || row['Payer Bank'] || 'Doha Bank'),
      payerBankShort: String(row['PAYER BANK SHORT'] || row['Bank Short'] || 'DB'),
      iban: String(row['PAYE BANK IBAN'] || row['IBAN'] || ''),
      basicSalary,
      foodAllowance,
      transportAllowance,
      carOperationAllowance,
      otherAllowance,
      limitedTransport,
      totalSalary,
      saleCommissionRate: parseFloat(String(row['SALE COMMISSION RATE (%)'] || 10)) || 10,
      saleTargetRate: parseFloat(String(row['SALE TARGET RATE'] || 0)) || 0,
      totalSalesRate: parseFloat(String(row['TOTAL SALES RATE'] || 0)) || 0,
      targetSales: parseFloat(String(row['TARGET SALES'] || 0)) || 0,
      prodSaleCommission: parseFloat(String(row['PRODUCTS SALE COMMISSION (%)'] || 5)) || 5,
      prodSaleTarget: parseFloat(String(row["PRODUCTS SALE'S TARGET"] || 0)) || 0,
      prodTotalSales: parseFloat(String(row["PRODUCTS TOTAL SALE'S"] || 0)) || 0,
      businessTargetRate: parseFloat(String(row['BUSINESS TARGET 200,000 RATE (%)'] || row['Business Target Rate'] || 5)) || 5,
      businessTargetAmount: parseFloat(String(row['BUSINESS TARGET AMOUNT'] || row['Business Target'] || 200000)) || 200000,
      businessGross: parseFloat(String(row['BUSINESS GROSS'] || row['Business Gross'] || 0)) || 0,
      businessCommBase: String(row['BUSINESS COMMISSION BASE'] || row['Business Comm Base'] || '').toLowerCase().includes('above') ? 'above_target' : 'all_gross',
      businessBonus: parseFloat(String(row['BUSINESS BONUS'] || 0)) || 0,
      deductionCurrent: parseFloat(String(row['DEDUCTION IN THE CURRENT MONTH'] || 0)) || 0,
      deductionFuture: parseFloat(String(row['DEDUCTION SCHEDULED FOR A FUTURE'] || 0)) || 0,
      futureDeductions: [],
      tips: parseFloat(String(row["TIP'S"] || row['Tips'] || 0)) || 0,
      outstanding: parseFloat(String(row['OUTSTANDING'] || row['Outstanding'] || 0)) || 0,
      leaveEntitlement: parseFloat(String(row['LEAVE ENTITLEMENT'] || 21)) || 21,
      annualLeavePaid: String(row['Annual Leave Paid'] || ''),
      salariesWages: parseFloat(String(row['SALARIES & WAGES'] || 0)) || totalSalary,
      totalCreditLeave: parseFloat(String(row['Total Credit Leave Days'] || 21)) || 21,
      lastLeaveDate: String(row['LAST ANNUAL LEAVES DATE'] || ''),
      annualLeaveDays: parseFloat(String(row['ANNUAL LEAVE DAYS'] || 0)) || 0,
      annualLeaveStatus: String(row['Annual Leave (Paid/Unpaid)'] || 'Paid'),
      annualLeavePaidAmt: parseFloat(String(row['Annual Leave Paid Amount'] || 0)) || 0,
      annualLeaveRemaining: parseFloat(String(row['Annual Leave Remaining'] || 21)) || 21,
      annualLeaveFees: parseFloat(String(row['Annual Leave Fees'] || 0)) || 0,
      ticketCycle: parseInt(String(row['TICKET CYCLE (YEARS)'] || 2)) || 2,
      nextTicketDate: String(row['NEXT TICKET DATE'] || ''),
      ticketStatus: String(row['TICKET STATUS'] || 'Not Eligible'),
      ticketDestination: String(row['TICKET DESTINATION'] || ''),
      confirm: String(row['I confirm'] || 'I further acknowledge and confirm that I have received Salary'),
      signature: String(row['signature'] || ''),
      date: String(row['Date'] || new Date().toISOString().slice(0, 10)),
      status: String(row['STATUS'] || row['Status'] || 'Active') === 'Unemployed' ? 'Unemployed' : 'Active',
    };

    parsedEmployees.push(emp);
    index++;
  }

  return {
    importedCount: parsedEmployees.length,
    updatedCount: 0,
    employees: parsedEmployees,
  };
}

export function exportAttendanceToExcel(records: AttendanceRecord[], monthTitle?: string) {
  const exportData = records.map((r) => {
    const extraMinutes = r.extraMinutes || 0;
    const shortMinutes = r.shortMinutes !== undefined ? r.shortMinutes : (r.totalWorkMinutes < r.scheduledWorkMinutes ? r.scheduledWorkMinutes - r.totalWorkMinutes : 0);

    return {
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Date': r.date,
      'Day': getDayOfWeek(r.date),
      'Shift': 'Morning to Night (Single Shift)',
      'Scheduled Start': r.scheduledStart || '09:00',
      'Time In (Morning)': r.timeIn ? formatTime12(r.timeIn) : '-',
      'Time Out (Night)': r.timeOut ? formatTime12(r.timeOut) : '-',
      'Scheduled End': r.scheduledEnd || '21:00',
      'Total Work Hours': minutesToTimeStr(r.totalWorkMinutes),
      'Scheduled Hours': minutesToTimeStr(r.scheduledWorkMinutes),
      'Extra Hours': extraMinutes > 0 ? `+${minutesToTimeStr(extraMinutes)}` : '0h 0m',
      'Short Hours': shortMinutes > 0 ? `-${minutesToTimeStr(shortMinutes)}` : '0h 0m',
      'Status': r.status,
      'Remarks': r.remarks || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
  const filename = monthTitle ? `Cosmos_Attendance_${monthTitle}.xlsx` : `Cosmos_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportCertificatesToExcel(certificates: Certificate[]) {
  const exportData = certificates.map((c) => ({
    'Reference': c.reference,
    'Type': c.certTypeName,
    'Employee ID': c.employeeId,
    'Employee Name': c.employeeName,
    'Position': c.employeePosition,
    'QID': c.employeeQid,
    'Nationality': c.employeeNationality,
    'Joining Date': formatDate(c.employeeJoiningDate),
    'Recipient': c.recipient,
    'Corresponding Date': formatDate(c.correspondingDate),
    'Signatory Name': c.signatoryName,
    'Signatory Title': c.signatoryTitle,
    'Last Working Date': c.lastWorkingDate ? formatDate(c.lastWorkingDate) : '-',
    'Vacating Date': c.vacatingDate ? formatDate(c.vacatingDate) : '-',
    'Vacating Reason': c.vacatingReason || '-',
    'Employment End Date': c.employmentEndDate ? formatDate(c.employmentEndDate) : '-',
    'Entitlement Reason': c.entitlementReason || '-',
    'Basic Salary': c.salaryData.basicSalary,
    'Food Allowance': c.salaryData.foodAllowance,
    'Transport Allowance': c.salaryData.transportAllowance,
    'Car Operation Allowance': c.salaryData.carOperationAllowance,
    'Other Allowance': c.salaryData.otherAllowance,
    'Total Salary': c.salaryData.totalSalary,
    'Created At': new Date(c.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
  XLSX.writeFile(workbook, `Cosmos_Certificates_Archive_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportLeaveAndTicketsToExcel(employees: Employee[], leaves: LeaveRecord[], tickets: FlightTicketRecord[]) {
  const exportData = employees.filter((e) => e.status !== 'Unemployed').map((emp) => {
    const empLeaves = leaves.filter((l) => l.employeeId === emp.employeeId);
    const entitlement = Number(emp.leaveEntitlement) || 21;
    const taken = empLeaves.filter((l) => l.status === 'Approved').reduce((sum, l) => sum + (Number(l.days) || 0), 0);
    const pending = empLeaves.filter((l) => l.status === 'Pending').reduce((sum, l) => sum + (Number(l.days) || 0), 0);
    const remaining = entitlement - taken - pending;
    const basic = Number(emp.basicSalary) || 0;
    const dailyRate = basic / 30;

    return {
      'Employee ID': emp.employeeId,
      'Name': emp.employeeName,
      'Position': emp.position,
      'Joining Date': formatDate(emp.joiningDate),
      'Leave Entitlement': entitlement,
      'Leave Days Taken': taken,
      'Leave Days Pending': pending,
      'Remaining Balance': remaining,
      'Daily Basic Rate (÷30)': dailyRate,
      'Leave Payment Value': remaining * dailyRate,
      'Flight Ticket Cycle (Years)': emp.ticketCycle || 2,
      'Next Eligible Ticket Date': emp.nextTicketDate ? formatDate(emp.nextTicketDate) : '-',
      'Ticket Status': emp.ticketStatus || 'Not Eligible',
      'Destination': emp.ticketDestination || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave & Flight Tickets');
  XLSX.writeFile(workbook, `Cosmos_Leave_Flight_Tickets_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportDailySalesToExcel(sales: DailySaleRecord[], employees: Employee[]) {
  if (!sales || sales.length === 0) {
    throw new Error('No sales records to export');
  }

  // 1. Transaction level sheet
  const salesData = sales.map((s) => ({
    'Sr#': s.srCode,
    'Date': s.date,
    'Customer Name': s.customerName,
    'Mobile Number': s.mobileNumber,
    'Services Rendered': s.services.map((sv) => `${sv.serviceName} (${sv.employeeName} - QAR ${sv.lineTotal})`).join('; '),
    'Service Revenue (QAR)': s.totalServiceAmount,
    'Product Sales': s.products.map((p) => `${p.productName} (x${p.quantity} - QAR ${p.lineTotal})`).join('; '),
    'Product Revenue (QAR)': s.totalProductAmount,
    'Uber for Home Service (QAR)': s.uberCharge,
    'Gross Business Sales (QAR)': s.grossSales,
    'Total Revenue (QAR)': s.totalRevenue,
    'POS Card (QAR)': s.posCard,
    'Cash (QAR)': s.cash,
    'Fawran (QAR)': s.fawran,
    'Fawran Recipient': s.fawranRecipientName || '-',
    'Tips (QAR)': s.tips,
    'Un-Paid (QAR)': s.unpaid,
    'Refunds (QAR)': s.refunds,
    'Net Sales (QAR)': s.netSales,
    'Total Paid (QAR)': s.totalPaid,
    'Payment Status': s.paymentStatus,
    'Notes': s.notes || '-',
  }));

  // 2. Employee breakdown sheet
  const empMap: Record<string, { name: string; serviceSales: number; productSales: number }> = {};
  employees.forEach((e) => {
    empMap[e.employeeId] = { name: e.employeeName, serviceSales: 0, productSales: 0 };
  });

  sales.forEach((s) => {
    s.services.forEach((srv) => {
      if (empMap[srv.employeeId]) {
        empMap[srv.employeeId].serviceSales += Number(srv.lineTotal) || 0;
      }
    });
    s.products.forEach((prd) => {
      if (empMap[prd.employeeId]) {
        empMap[prd.employeeId].productSales += Number(prd.lineTotal) || 0;
      }
    });
  });

  const empSummaryData = Object.keys(empMap).map((empId) => {
    const item = empMap[empId];
    return {
      'Employee ID': empId,
      'Employee Name': item.name,
      'Eligible Service Sales (QAR)': item.serviceSales,
      'Eligible Product Sales (QAR)': item.productSales,
      'Total Sales Generated (QAR)': item.serviceSales + item.productSales,
    };
  });

  // 3. Payment Mode Summary
  let totalPOS = 0, totalCash = 0, totalFawran = 0, totalTips = 0, totalUnpaid = 0, totalRefunds = 0, totalNet = 0;
  sales.forEach((s) => {
    totalPOS += Number(s.posCard) || 0;
    totalCash += Number(s.cash) || 0;
    totalFawran += Number(s.fawran) || 0;
    totalTips += Number(s.tips) || 0;
    totalUnpaid += Number(s.unpaid) || 0;
    totalRefunds += Number(s.refunds) || 0;
    totalNet += Number(s.netSales) || 0;
  });

  const paymentSummaryData = [
    { 'Payment Mode': 'POS Card', 'Total Collected (QAR)': totalPOS },
    { 'Payment Mode': 'Cash', 'Total Collected (QAR)': totalCash },
    { 'Payment Mode': 'Fawran (Instant)', 'Total Collected (QAR)': totalFawran },
    { 'Payment Mode': 'Tips (Gratuity)', 'Total Collected (QAR)': totalTips },
    { 'Payment Mode': 'Un-Paid (Outstanding)', 'Total Collected (QAR)': totalUnpaid },
    { 'Payment Mode': 'Refunds (Deducted)', 'Total Collected (QAR)': totalRefunds },
    { 'Payment Mode': 'Net Sales', 'Total Collected (QAR)': totalNet },
  ];

  const workbook = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(salesData);
  const ws2 = XLSX.utils.json_to_sheet(empSummaryData);
  const ws3 = XLSX.utils.json_to_sheet(paymentSummaryData);

  XLSX.utils.book_append_sheet(workbook, ws1, 'Daily Sales Transactions');
  XLSX.utils.book_append_sheet(workbook, ws2, 'Employee Sales Summary');
  XLSX.utils.book_append_sheet(workbook, ws3, 'Payment Reconciliation');

  XLSX.writeFile(workbook, `Cosmos_Daily_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportBusinessExpensesToExcel(
  grossEntries: import('../types').BusinessGrossEntry[],
  fixedExpenses: import('../types').FixedExpense[],
  pettyCash: import('../types').PettyCashExpense[],
  summary: ReturnType<typeof import('./db').db.calculateFinancialSummary>,
  periodTitle?: string
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Financial Auto-Calculation Summary
  const summaryData = [
    { 'Financial Metric': 'POS Income (QAR)', 'Amount (QAR)': summary.posIncome, 'Status / Notes': 'Card payments' },
    { 'Financial Metric': 'Cash Income (QAR)', 'Amount (QAR)': summary.cashIncome, 'Status / Notes': 'Cash drawer' },
    { 'Financial Metric': 'Transfer Income (QAR)', 'Amount (QAR)': summary.transferIncome, 'Status / Notes': 'Bank wire' },
    { 'Financial Metric': 'Fawran Income (QAR)', 'Amount (QAR)': summary.fawranIncome, 'Status / Notes': 'Instant transfers' },
    { 'Financial Metric': 'TOTAL BUSINESS GROSS (QAR)', 'Amount (QAR)': summary.totalBusinessGross, 'Status / Notes': 'Auto-calculated' },
    { 'Financial Metric': 'Salaries & Wages by WPS (QAR)', 'Amount (QAR)': summary.wagesByWps, 'Status / Notes': 'Qatar WPS System' },
    { 'Financial Metric': 'Salaries & Wages by CASH (QAR)', 'Amount (QAR)': summary.salariesByCash, 'Status / Notes': 'Cash vouchers' },
    { 'Financial Metric': 'TOTAL SALARIES & WAGES (QAR)', 'Amount (QAR)': summary.totalSalaries, 'Status / Notes': 'WPS + Cash' },
    { 'Financial Metric': 'Monthly Petty Daily Expenses Total (QAR)', 'Amount (QAR)': summary.pettyCashTotal, 'Status / Notes': 'VOICE expenses' },
    { 'Financial Metric': 'Monthly Petty Daily Expenses PAID (QAR)', 'Amount (QAR)': summary.pettyCashPaid, 'Status / Notes': 'Settled' },
    { 'Financial Metric': 'Monthly Petty Daily Expenses UNPAID (QAR)', 'Amount (QAR)': summary.pettyCashUnpaid, 'Status / Notes': 'REMAINDER / ALERT' },
    { 'Financial Metric': 'Monthly Fixed Expenses Total (QAR)', 'Amount (QAR)': summary.fixedExpensesTotal, 'Status / Notes': 'Fixed salon expenses' },
    { 'Financial Metric': 'Monthly Fixed Expenses PAID (QAR)', 'Amount (QAR)': summary.fixedExpensesPaid, 'Status / Notes': 'Settled' },
    { 'Financial Metric': 'Monthly Fixed Expenses UNPAID (QAR)', 'Amount (QAR)': summary.fixedExpensesUnpaid, 'Status / Notes': 'REMAINDER / ALERT' },
    { 'Financial Metric': 'COMBINED TOTAL SALON EXPENSES (QAR)', 'Amount (QAR)': summary.totalSalonExpenses, 'Status / Notes': 'Petty + Fixed + Salaries' },
    { 'Financial Metric': 'TOTAL SALON EXPENSES PAID (QAR)', 'Amount (QAR)': summary.totalSalonPaid, 'Status / Notes': 'Total Settled' },
    { 'Financial Metric': 'TOTAL SALON UNPAID REMAINDER (QAR)', 'Amount (QAR)': summary.totalSalonUnpaid, 'Status / Notes': 'PENDING TO BE PAID (RED)' },
    { 'Financial Metric': 'NET OPERATING PROFIT (QAR)', 'Amount (QAR)': summary.netSalonProfit, 'Status / Notes': 'Business Gross - Expenses' },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Financial Overview');

  // Sheet 2: Business Gross Register
  const grossData = grossEntries.map((g) => ({
    'Date': g.date,
    'Month': g.month,
    'Year': g.year,
    'POS Income (QAR)': g.posIncome,
    'Cash Income (QAR)': g.cashIncome,
    'Transfer Income (QAR)': g.transferIncome,
    'Fawran Income (QAR)': g.fawranIncome,
    'Total Business Gross (QAR)': g.totalGross,
    'Source': g.source,
    'Notes': g.notes || '-',
  }));
  const wsGross = XLSX.utils.json_to_sheet(grossData);
  XLSX.utils.book_append_sheet(workbook, wsGross, 'Business Gross Register');

  // Sheet 3: Fixed Expenses
  const fixedData = fixedExpenses.map((f) => ({
    'DATE': f.date,
    'REF No / VOICE No': f.refNo,
    'CATEGORY': f.category,
    'COMPANY': f.company,
    'DESCRIPTION': f.description,
    'PAID / UNPAID': f.status,
    'Payment Method (Name)': f.paymentMethod,
    'DETAILS COMMENT': f.detailsComment,
    'CARD / CASH / WPS': f.cardCashType,
    'AMOUNT (QAR)': f.amount,
    'Month': f.month,
    'Year': f.year,
  }));
  const wsFixed = XLSX.utils.json_to_sheet(fixedData);
  XLSX.utils.book_append_sheet(workbook, wsFixed, 'Fixed Expenses');

  // Sheet 4: Monthly Petty Daily Expenses
  const pettyData = pettyCash.map((p) => ({
    'VOICE DATE': p.invoiceDate,
    'VOICE REF No / VOICE No': p.invoiceRefNo,
    'VOICE COMPANY': p.company,
    'VOICE DESCRIPTION': p.description,
    'VOICE PAID / UNPAID': p.status,
    'VOICE Payment Method (Name)': p.paymentMethod,
    'VOICE DETAILS COMMENT': p.detailsComment,
    'VOICE CARD / CASH': p.cardCashType,
    'VOICE AMOUNT (QAR)': p.amount,
    'Month': p.month,
    'Year': p.year,
  }));
  const wsPetty = XLSX.utils.json_to_sheet(pettyData);
  XLSX.utils.book_append_sheet(workbook, wsPetty, 'Petty Daily Expenses (VOICE)');

  const filename = periodTitle
    ? `Cosmos_Business_Expenses_${periodTitle}.xlsx`
    : `Cosmos_Business_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportCustomersToExcel(customers: Customer[], filename?: string) {
  if (!customers || customers.length === 0) {
    throw new Error('No customer records to export');
  }

  const exportData = customers.map((c) => ({
    'Customer ID': c.id,
    'Client Name': c.name,
    'Mobile Number': c.mobile,
    'Email Address': c.email || 'N/A',
    'Gender': c.gender || 'Not Specified',
    'Segment': c.segment || (c.isVip ? 'VIP' : 'Regular'),
    'Total Visits': Number(c.totalVisits) || 0,
    'Total Spent (QAR)': Number(c.totalSpent) || 0,
    'Outstanding Balance (QAR)': Number(c.outstandingBalance) || 0,
    'Wallet Balance (QAR)': Number(c.walletBalance) || 0,
    'Last Visit Date': c.lastVisitDate || 'N/A',
    'Registration Date': c.createdAt ? c.createdAt.slice(0, 10) : 'N/A',
    'Notes': c.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cosmos Clients');

  const exportFilename = filename || `Cosmos_Clients_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, exportFilename);
}

export function exportPayrollToExcel(payrolls: PayrollRecord[], employees: Employee[], filename?: string) {
  if (!payrolls || payrolls.length === 0) {
    throw new Error('No payroll records to export');
  }

  const exportData = payrolls.map((p) => {
    const emp = employees.find((e) => e.employeeId === p.employeeId);
    const remaining = Number(p.netSalary) - Number(p.paidAmount);
    const basic = Number(p.basicSalary) || Number(emp?.basicSalary) || 0;
    const food = Number(p.foodAllowance) || Number(emp?.foodAllowance) || 0;
    const transport = Number(p.transportAllowance) || Number(emp?.transportAllowance) || 0;
    const carOp = Number(p.carOperationAllowance) || Number(emp?.carOperationAllowance) || 0;
    const other = Number(p.otherAllowance) || Number(emp?.otherAllowance) || 0;
    const limitedTrans = Number(p.limitedTransport) || Number(emp?.limitedTransport) || 0;
    const allowances = food + transport + carOp + other + limitedTrans;
    const tips = Number(p.tips) || Number(emp?.tips) || 0;
    const sComm = Number(p.commissionBreakdown?.service) || 0;
    const pComm = Number(p.commissionBreakdown?.product) || 0;
    const bComm = Number(p.commissionBreakdown?.business) || 0;
    const totalCommissions = sComm + pComm + bComm;
    const totalMonthlySalary = p.totalMonthlySalary || (basic + allowances + tips + totalCommissions);

    return {
      'Payroll ID': p.id,
      'Employee ID': p.employeeId,
      'Employee Name': emp ? emp.employeeName : 'Unknown',
      'Position': emp ? emp.position : '',
      'Month': p.month,
      'Year': p.year,
      'Payer Bank': emp?.payerBank || 'Commercial Bank of Qatar',
      'IBAN': emp?.iban || 'N/A',
      '1. Basic Salary (QAR)': basic,
      '2. Food Allowance (QAR)': food,
      '3. Transport Allowance (QAR)': transport,
      '4. Car Operation Allowance (QAR)': carOp,
      '5. Other Allowance (QAR)': other,
      '6. Limited Transport (QAR)': limitedTrans,
      'Total Allowances (QAR)': allowances,
      '7. Tips (QAR)': tips,
      '8. Net Services Commission (QAR)': sComm,
      '9. Net Product Commission (QAR)': pComm,
      '10. Net Business Gross Commission (QAR)': bComm,
      'Total Combined Commission (QAR)': totalCommissions,
      'Total Monthly Salary & Wages (QAR)': totalMonthlySalary,
      'Deductions (QAR)': Number(p.deductions) || 0,
      'Total Most Paid (Net Payable QAR)': Number(p.netSalary) || 0,
      'Paid Amount (QAR)': Number(p.paidAmount) || 0,
      'Remaining Balance (QAR)': remaining > 0 ? remaining : 0,
      'Status': p.status,
      'Payment Date': p.paymentDate || 'N/A',
      'Notes': p.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Payroll');

  const exportFilename = filename || `Cosmos_Payroll_${payrolls[0]?.month || 'Report'}_${payrolls[0]?.year || new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(workbook, exportFilename);
}

// ----------------------------------------------------------------------
// Monthly Petty Daily Expanse (VOICE Invoices) Excel Import & Export
// ----------------------------------------------------------------------

export function downloadPettyExpenseTemplate() {
  const templateRows = [
    {
      'VOICE DATE': '2026-10-21',
      'VOICE REF No / VOICE No': 'INV-DOHAPHARM-440',
      'VOICE COMPANY': 'Kulud Pharmacy Doha',
      'VOICE DESCRIPTION': 'Medical alcohol spray, sterilizing wipes, disposable latex gloves',
      'VOICE PAID / UNPAID': 'Paid',
      'VOICE Payment Method (Name)': 'Debit Card (POS)',
      'VOICE DETAILS COMMENT': 'Salon hygiene & sanitation compliance replenishment',
      'VOICE CARD / CASH': 'Card',
      'VOICE AMOUNT': 295,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'VOICE DATE': '2026-10-22',
      'VOICE REF No / VOICE No': 'INV-ALMEERA-9912',
      'VOICE COMPANY': 'Al Meera Supermarket',
      'VOICE DESCRIPTION': 'Soft towels laundry detergent, fabric softener, salon scented aromatherapy oils',
      'VOICE PAID / UNPAID': 'Paid',
      'VOICE Payment Method (Name)': 'Cash',
      'VOICE DETAILS COMMENT': 'Spa & hair washing station supplies',
      'VOICE CARD / CASH': 'Cash',
      'VOICE AMOUNT': 240,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'VOICE DATE': '2026-10-23',
      'VOICE REF No / VOICE No': 'INV-TECHCOOL-102',
      'VOICE COMPANY': 'Qatar HVAC Emergency Repair',
      'VOICE DESCRIPTION': 'Hair treatment drying station AC filter replacement & deep sanitization',
      'VOICE PAID / UNPAID': 'Unpaid',
      'VOICE Payment Method (Name)': 'Bank Transfer (Pending)',
      'VOICE DETAILS COMMENT': 'Awaiting manager approval sign-off before electronic release',
      'VOICE CARD / CASH': 'Cash',
      'VOICE AMOUNT': 650,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'VOICE DATE': '2026-10-24',
      'VOICE REF No / VOICE No': 'INV-OFFICEPLUS-331',
      'VOICE COMPANY': 'Jarir Bookstore Doha',
      'VOICE DESCRIPTION': 'Thermal receipt paper rolls for POS card terminal, VIP client appointment cards',
      'VOICE PAID / UNPAID': 'Paid',
      'VOICE Payment Method (Name)': 'Card',
      'VOICE DETAILS COMMENT': 'Front desk reception supplies',
      'VOICE CARD / CASH': 'Card',
      'VOICE AMOUNT': 185,
      'Month': 'October',
      'Year': '2026',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Petty Expenses (VOICE)');
  XLSX.writeFile(workbook, 'Cosmos_Petty_Daily_Expense_VOICE_Template.xlsx');
}

export function exportPettyExpensesToExcel(
  pettyCash: PettyCashExpense[],
  filename?: string
) {
  if (!pettyCash || pettyCash.length === 0) {
    throw new Error('No petty cash expense vouchers to export');
  }

  const exportData = pettyCash.map((p) => ({
    'VOICE DATE': p.invoiceDate,
    'VOICE REF No / VOICE No': p.invoiceRefNo,
    'VOICE COMPANY': p.company,
    'VOICE DESCRIPTION': p.description,
    'VOICE PAID / UNPAID': p.status,
    'VOICE Payment Method (Name)': p.paymentMethod,
    'VOICE DETAILS COMMENT': p.detailsComment || '',
    'VOICE CARD / CASH': p.cardCashType,
    'VOICE AMOUNT (QAR)': Number(p.amount) || 0,
    'Month': p.month,
    'Year': p.year,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Petty Daily Expenses (VOICE)');
  const exportFilename =
    filename ||
    `Cosmos_Petty_Daily_Expenses_VOICE_${pettyCash[0]?.month || 'All'}_${pettyCash[0]?.year || new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(workbook, exportFilename);
}

export async function parsePettyExpensesFromExcel(
  file: File,
  defaultMonth: string = 'October',
  defaultYear: string = '2026'
): Promise<{
  importedCount: number;
  expenses: PettyCashExpense[];
  errors: string[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName =
    workbook.SheetNames.find(
      (s) => s.toLowerCase().includes('petty') || s.toLowerCase().includes('voice')
    ) || workbook.SheetNames[0];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });

  const expenses: PettyCashExpense[] = [];
  const errors: string[] = [];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const rowMap: Record<string, unknown> = {};
    Object.entries(row).forEach(([k, v]) => {
      rowMap[normalizeKey(k)] = v;
    });

    const getVal = (...keys: string[]): unknown => {
      for (const k of keys) {
        const norm = normalizeKey(k);
        if (rowMap[norm] !== undefined && rowMap[norm] !== '') {
          return rowMap[norm];
        }
      }
      return '';
    };

    // Extract Date
    const rawDate = getVal('voicedate', 'date', 'invoicedate', 'receiptdate', 'voucherdate', 'day');
    let invoiceDate = '';

    if (typeof rawDate === 'number' && !isNaN(rawDate)) {
      // Excel serial date number
      const parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        invoiceDate = parsedDate.toISOString().slice(0, 10);
      }
    } else if (rawDate) {
      const dateStr = String(rawDate).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        invoiceDate = dateStr;
      } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(dateStr)) {
        const parts = dateStr.split(/[/-]/);
        if (parseInt(parts[0], 10) > 12) {
          // DD/MM/YYYY
          invoiceDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parseInt(parts[1], 10) > 12) {
          // MM/DD/YYYY
          invoiceDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        } else {
          // Default DD/MM/YYYY
          invoiceDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          invoiceDate = d.toISOString().slice(0, 10);
        }
      }
    }

    if (!invoiceDate) {
      const dayStr = String((index % 28) + 1).padStart(2, '0');
      invoiceDate = `${defaultYear}-10-${dayStr}`;
    }

    // Ref No
    let invoiceRefNo = String(
      getVal(
        'voicerefnovoiceno',
        'voicerefno',
        'voiceno',
        'refno',
        'invoiceno',
        'receiptno',
        'ref'
      )
    ).trim();
    if (!invoiceRefNo) {
      invoiceRefNo = `VOICE-${Date.now().toString().slice(-4)}-${index + 1}`;
    }

    // Company / Supplier
    const company =
      String(
        getVal('voicecompany', 'company', 'vendor', 'supplier', 'merchant', 'store', 'payee')
      ).trim() || 'General Salon Supplier';

    // Description
    const description =
      String(
        getVal('voicedescription', 'description', 'particulars', 'item', 'items', 'details')
      ).trim() || 'Petty cash salon supplies';

    // Status (Paid / Unpaid)
    const rawStatus = String(
      getVal('voicepiadunpaid', 'voicepaidunpaid', 'status', 'paidunpaid', 'piadunpaid', 'paid')
    )
      .trim()
      .toLowerCase();
    const status: 'Paid' | 'Unpaid' =
      rawStatus.includes('unpaid') || rawStatus.includes('pending') || rawStatus === 'no'
        ? 'Unpaid'
        : 'Paid';

    // Payment Method
    const paymentMethod =
      String(
        getVal('voicepaymentmethodname', 'voicepaymentmethod', 'paymentmethod', 'method', 'paidby')
      ).trim() || (status === 'Unpaid' ? 'Pending Approval' : 'Cash');

    // Details comment
    const detailsComment = String(
      getVal('voicedetailscomment', 'detailscomment', 'comment', 'notes', 'remarks')
    ).trim();

    // Card / Cash
    const rawCardCash = String(
      getVal('voicecardcash', 'cardcash', 'type', 'paymenttype')
    )
      .trim()
      .toLowerCase();
    const cardCashType: 'Card' | 'Cash' =
      rawCardCash.includes('card') ||
      paymentMethod.toLowerCase().includes('card') ||
      paymentMethod.toLowerCase().includes('pos')
        ? 'Card'
        : 'Cash';

    // Amount
    const rawAmount = getVal(
      'voiceamount',
      'voiceamountqar',
      'amount',
      'amountqar',
      'total',
      'qar',
      'price',
      'cost'
    );
    let amount = 0;
    if (typeof rawAmount === 'number') {
      amount = rawAmount;
    } else {
      const cleanNum = String(rawAmount).replace(/[^0-9.-]/g, '');
      amount = parseFloat(cleanNum) || 0;
    }

    if (amount <= 0) {
      errors.push(`Row ${rowNum}: Skipped voucher "${invoiceRefNo}" because amount was 0 or invalid.`);
      return;
    }

    // Month & Year
    let month = String(getVal('month')).trim();
    let year = String(getVal('year')).trim();

    if (!month && invoiceDate) {
      const d = new Date(invoiceDate);
      if (!isNaN(d.getTime())) {
        month = MONTH_NAMES[d.getMonth()] || defaultMonth;
      }
    }
    if (!month) month = defaultMonth;

    if (!year && invoiceDate) {
      const d = new Date(invoiceDate);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear().toString();
      }
    }
    if (!year) year = defaultYear;

    expenses.push({
      id: `PC-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceDate,
      invoiceRefNo,
      company,
      description,
      status,
      paymentMethod,
      detailsComment,
      cardCashType,
      amount: Math.round(amount * 100) / 100,
      month,
      year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    importedCount: expenses.length,
    expenses,
    errors,
  };
}

// ----------------------------------------------------------------------
// Monthly Fixed Expense (WPS Wages, Leases & Utilities) Excel Import & Export
// ----------------------------------------------------------------------

export function downloadFixedExpenseTemplate() {
  const templateRows = [
    {
      'DATE': '2026-10-01',
      'REF No / VOICE No': 'FX-WPS-2026-10',
      'CATEGORY': 'Salaries & wages by WPS',
      'COMPANY': 'Doha Bank WPS Salary Processing',
      'DESCRIPTION': 'Monthly staff wages batch electronic transfer via Qatar WPS SIF file',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Doha Bank WPS SIF Electronic',
      'DETAILS COMMENT': 'Processed through Ministry of Labour electronic wages portal',
      'CARD / CASH': 'Bank / WPS',
      'AMOUNT': 48200,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-01',
      'REF No / VOICE No': 'FX-CASH-2026-10',
      'CATEGORY': 'Salaries & wages by CASH',
      'COMPANY': 'Cosmos Salon Internal Cash Treasury',
      'DESCRIPTION': 'Cash payroll envelopes for non-banked / trial personnel & cash wage payouts',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Cash Payout Envelopes',
      'DETAILS COMMENT': 'Signed by salon floor manager and wage recipients',
      'CARD / CASH': 'Cash',
      'AMOUNT': 6450,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-01',
      'REF No / VOICE No': 'LEAS-SHOP-OCT26',
      'CATEGORY': 'Lease Shop',
      'COMPANY': 'The Pearl Real Estate Properties LLC',
      'DESCRIPTION': 'Commercial salon premises rent - Unit 14B Porto Arabia',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Commercial Cheque #90214',
      'DETAILS COMMENT': 'Quarterly rental schedule installment cleared',
      'CARD / CASH': 'Bank / WPS',
      'AMOUNT': 28000,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-01',
      'REF No / VOICE No': 'LEAS-FLAT-OCT26',
      'CATEGORY': 'Lease Flat',
      'COMPANY': 'Al Asmakh Staff Accommodations',
      'DESCRIPTION': 'Staff residential flat rental accommodations (Units 401 & 402)',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Direct Bank Transfer',
      'DETAILS COMMENT': 'Cosmos salon full staff accommodation covered',
      'CARD / CASH': 'Bank / WPS',
      'AMOUNT': 9000,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-05',
      'REF No / VOICE No': 'QCOOL-OCT26',
      'CATEGORY': 'Qatar Cool',
      'COMPANY': 'Qatar District Cooling Co.',
      'DESCRIPTION': 'Central cooling capacity and chilled water utility charges for salon',
      'PAID / UNPAID': 'Unpaid',
      'Payment Method (Name)': 'Online Banking (Pending)',
      'DETAILS COMMENT': 'Monthly utility invoice due on 28th October',
      'CARD / CASH': 'Bank / WPS',
      'AMOUNT': 1450,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-08',
      'REF No / VOICE No': 'OOREDOO-FIBER-10',
      'CATEGORY': 'Internet',
      'COMPANY': 'Ooredoo Qatar Business',
      'DESCRIPTION': 'High-speed fiber broadband (500 Mbps), salon Wi-Fi & landline',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Corporate Credit Card',
      'DETAILS COMMENT': 'Direct debit auto-billing monthly cycle',
      'CARD / CASH': 'Card',
      'AMOUNT': 650,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-10',
      'REF No / VOICE No': 'FRESHA-SUB-OCT',
      'CATEGORY': 'Fresha',
      'COMPANY': 'Fresha Marketplace Software',
      'DESCRIPTION': 'Salon appointment booking software platform monthly subscription & marketplace fee',
      'PAID / UNPAID': 'Paid',
      'Payment Method (Name)': 'Company Visa Card',
      'DETAILS COMMENT': 'SaaS software license renewal',
      'CARD / CASH': 'Card',
      'AMOUNT': 920,
      'Month': 'October',
      'Year': '2026',
    },
    {
      'DATE': '2026-10-12',
      'REF No / VOICE No': 'LOYALTY-SYS-26',
      'CATEGORY': 'Loyalty Card',
      'COMPANY': 'Digital Wallet Stamp & Loyalty System',
      'DESCRIPTION': 'VIP client loyalty cards printing, NFC cards and points tracking subscription',
      'PAID / UNPAID': 'Unpaid',
      'Payment Method (Name)': 'Bank Transfer',
      'DETAILS COMMENT': 'Invoice received, pending authorization',
      'CARD / CASH': 'Bank / WPS',
      'AMOUNT': 450,
      'Month': 'October',
      'Year': '2026',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixed Expenses');
  XLSX.writeFile(workbook, 'Cosmos_Monthly_Fixed_Expenses_Template.xlsx');
}

export function exportFixedExpensesToExcel(
  fixedExpenses: FixedExpense[],
  filename?: string
) {
  if (!fixedExpenses || fixedExpenses.length === 0) {
    throw new Error('No fixed expense records to export');
  }

  const exportData = fixedExpenses.map((f) => ({
    'DATE': f.date,
    'REF No / VOICE No': f.refNo,
    'CATEGORY': f.category,
    'COMPANY': f.company,
    'DESCRIPTION': f.description,
    'PAID / UNPAID': f.status,
    'Payment Method (Name)': f.paymentMethod,
    'DETAILS COMMENT': f.detailsComment || '',
    'CARD / CASH': f.cardCashType,
    'AMOUNT (QAR)': Number(f.amount) || 0,
    'Month': f.month,
    'Year': f.year,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Fixed Expenses');
  const exportFilename =
    filename ||
    `Cosmos_Monthly_Fixed_Expenses_${fixedExpenses[0]?.month || 'All'}_${fixedExpenses[0]?.year || new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(workbook, exportFilename);
}

export async function parseFixedExpensesFromExcel(
  file: File,
  defaultMonth: string = 'October',
  defaultYear: string = '2026'
): Promise<{
  importedCount: number;
  expenses: FixedExpense[];
  errors: string[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName =
    workbook.SheetNames.find(
      (s) =>
        s.toLowerCase().includes('fixed') ||
        s.toLowerCase().includes('expanse') ||
        s.toLowerCase().includes('wps')
    ) || workbook.SheetNames[0];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });

  const expenses: FixedExpense[] = [];
  const errors: string[] = [];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const rowMap: Record<string, unknown> = {};
    Object.entries(row).forEach(([k, v]) => {
      rowMap[normalizeKey(k)] = v;
    });

    const getVal = (...keys: string[]): unknown => {
      for (const k of keys) {
        const norm = normalizeKey(k);
        if (rowMap[norm] !== undefined && rowMap[norm] !== '') {
          return rowMap[norm];
        }
      }
      return '';
    };

    // Extract Date
    const rawDate = getVal('date', 'fixedexpensedate', 'invoicedate', 'receiptdate', 'voucherdate', 'day');
    let expenseDate = '';

    if (typeof rawDate === 'number' && !isNaN(rawDate)) {
      // Excel serial date number
      const parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        expenseDate = parsedDate.toISOString().slice(0, 10);
      }
    } else if (rawDate) {
      const dateStr = String(rawDate).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        expenseDate = dateStr;
      } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(dateStr)) {
        const parts = dateStr.split(/[/-]/);
        if (parseInt(parts[0], 10) > 12) {
          // DD/MM/YYYY
          expenseDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parseInt(parts[1], 10) > 12) {
          // MM/DD/YYYY
          expenseDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        } else {
          // Default DD/MM/YYYY
          expenseDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          expenseDate = d.toISOString().slice(0, 10);
        }
      }
    }

    if (!expenseDate) {
      const dayStr = String((index % 28) + 1).padStart(2, '0');
      expenseDate = `${defaultYear}-10-${dayStr}`;
    }

    // Ref No
    let refNo = String(
      getVal(
        'refnovoiceno',
        'refno',
        'voiceno',
        'invoiceno',
        'reference',
        'ref',
        'voucherno',
        'billno'
      ) || ''
    ).trim();

    if (!refNo) {
      refNo = `FX-${defaultYear}-${String(index + 1).padStart(3, '0')}`;
    }

    // Category
    const rawCategory = String(
      getVal('category', 'fixedcategory', 'expensecategory', 'cattype', 'type') || ''
    ).trim();

    // Company
    const company = String(
      getVal('company', 'vendor', 'supplier', 'payee', 'merchant', 'biller') || ''
    ).trim() || 'Cosmos Salon Operations';

    // Description
    const description = String(
      getVal('description', 'expensedescription', 'details', 'item', 'particulars', 'purpose') || ''
    ).trim() || 'Monthly fixed contractual obligation';

    // Infer category if missing or normalize
    let category = rawCategory;
    const descCombined = (rawCategory + ' ' + company + ' ' + description).toLowerCase();

    if (!category || category === 'Fixed Expense' || category === 'General') {
      if (descCombined.includes('wps') || (descCombined.includes('salar') && descCombined.includes('bank'))) {
        category = 'Salaries & wages by WPS';
      } else if (descCombined.includes('cash') && descCombined.includes('salar')) {
        category = 'Salaries & wages by CASH';
      } else if (descCombined.includes('shop') || descCombined.includes('rent shop') || descCombined.includes('lease shop')) {
        category = 'Lease Shop';
      } else if (descCombined.includes('flat') || descCombined.includes('rent flat') || descCombined.includes('lease flat') || descCombined.includes('accommodation')) {
        category = 'Lease Flat';
      } else if (descCombined.includes('qatar cool') || descCombined.includes('district cooling') || descCombined.includes('cooling')) {
        category = 'Qatar Cool';
      } else if (descCombined.includes('internet') || descCombined.includes('ooredoo') || descCombined.includes('vodafone') || descCombined.includes('wifi')) {
        category = 'Internet';
      } else if (descCombined.includes('fresha')) {
        category = 'Fresha';
      } else if (descCombined.includes('loyalty')) {
        category = 'Loyalty Card';
      } else {
        category = rawCategory || 'Lease Shop';
      }
    }

    // Status (Paid / Unpaid)
    const rawStatus = String(
      getVal('paidunpaid', 'status', 'piadunpaid', 'paymentstatus', 'paidstatus', 'state') || ''
    ).toLowerCase();

    let status: 'Paid' | 'Unpaid' = 'Paid';
    if (
      rawStatus.includes('unpaid') ||
      rawStatus.includes('pending') ||
      rawStatus.includes('due') ||
      rawStatus.includes('not paid') ||
      rawStatus === 'no' ||
      rawStatus === '0'
    ) {
      status = 'Unpaid';
    } else if (
      rawStatus.includes('paid') ||
      rawStatus.includes('settled') ||
      rawStatus.includes('cleared') ||
      rawStatus === 'yes' ||
      rawStatus === '1'
    ) {
      status = 'Paid';
    }

    // Payment Method
    const paymentMethod = String(
      getVal(
        'paymentmethodname',
        'paymentmethod',
        'method',
        'paymenttype',
        'mode',
        'paymethod'
      ) || ''
    ).trim() || (category === 'Salaries & wages by WPS' ? 'Doha Bank WPS SIF Electronic' : category === 'Salaries & wages by CASH' ? 'Cash' : 'Bank Transfer');

    // Details Comment
    const detailsComment = String(
      getVal('detailscomment', 'comment', 'comments', 'notes', 'remark', 'remarks') || ''
    ).trim();

    // Card / Cash / Bank
    const rawCardCash = String(
      getVal('cardcash', 'cardcashtype', 'modeofpayment', 'accounttype') || ''
    ).toLowerCase();

    let cardCashType: 'Card' | 'Cash' | 'Bank / WPS' = 'Bank / WPS';
    if (rawCardCash.includes('cash')) {
      cardCashType = 'Cash';
    } else if (rawCardCash.includes('card')) {
      cardCashType = 'Card';
    } else if (rawCardCash.includes('bank') || rawCardCash.includes('wps') || rawCardCash.includes('transfer')) {
      cardCashType = 'Bank / WPS';
    } else if (category.includes('WPS') || category.includes('Lease') || category.includes('Qatar Cool')) {
      cardCashType = 'Bank / WPS';
    } else if (category.includes('CASH')) {
      cardCashType = 'Cash';
    }

    // Amount
    const rawAmount = getVal('amount', 'amountqar', 'total', 'price', 'val', 'cost', 'qar');
    let amount = 0;
    if (typeof rawAmount === 'number') {
      amount = rawAmount;
    } else if (typeof rawAmount === 'string') {
      const cleaned = rawAmount.replace(/[^0-9.-]/g, '');
      amount = parseFloat(cleaned) || 0;
    }

    if (amount <= 0) {
      errors.push(`Row ${rowNum} (${refNo}): Amount is 0 or invalid (${rawAmount}). Fixed expense skipped.`);
      return;
    }

    // Month & Year (use row data, or infer from date, or fallback to defaults)
    let month = String(getVal('month', 'monthname') || '').trim();
    let year = String(getVal('year') || '').trim();

    if (!month && expenseDate) {
      const d = new Date(expenseDate);
      if (!isNaN(d.getTime())) {
        month = MONTH_NAMES[d.getMonth()] || defaultMonth;
        year = String(d.getFullYear()) || defaultYear;
      }
    }

    if (!month) month = defaultMonth;
    if (!year) year = defaultYear;

    // Capitalize month properly
    const matchedMonth = MONTH_NAMES.find((m) => m.toLowerCase() === month.toLowerCase());
    if (matchedMonth) month = matchedMonth;

    expenses.push({
      id: `FE-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      date: expenseDate,
      refNo,
      category,
      company,
      description,
      status,
      paymentMethod,
      detailsComment,
      cardCashType,
      amount: Math.round(amount * 100) / 100,
      month,
      year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    importedCount: expenses.length,
    expenses,
    errors,
  };
}


