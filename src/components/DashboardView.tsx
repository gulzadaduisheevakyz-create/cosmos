import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Coins,
  Wallet,
  CheckCircle,
  FileSpreadsheet,
  Search,
  Eye,
  Plus,
  RefreshCw,
  Clock,
  ShieldAlert,
  ReceiptText,
  Building2,
  Calendar,
  CreditCard,
  Zap,
  CheckCircle2,
  X,
  Send,
  FileCheck,
} from 'lucide-react';
import { Employee, PayrollRecord, FixedExpense, SystemSettings } from '../types';
import { formatCurrency, maskIBAN, calculateDaysRemaining, calculateEmployeeCommissions, db } from '../services/db';

interface DashboardViewProps {
  employees: Employee[];
  payrolls?: PayrollRecord[];
  fixedExpenses?: FixedExpense[];
  settings?: SystemSettings;
  onOpenEmployee: (empId: string) => void;
  onNavigateAdd: () => void;
  onNavigateDailySales?: () => void;
  onNavigateBusinessExpenses?: () => void;
  onNavigateMonthlyPayroll?: () => void;
  onLoadSample: () => void;
  onExportExcel: () => void;
  onRefresh?: () => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  payrolls = [],
  fixedExpenses = [],
  settings,
  onOpenEmployee,
  onNavigateAdd,
  onNavigateDailySales,
  onNavigateBusinessExpenses,
  onNavigateMonthlyPayroll,
  onLoadSample,
  onExportExcel,
  onRefresh,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');

  // Send to Monthly Payroll modal state
  const [sendPayrollModal, setSendPayrollModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'all';
    employee?: Employee;
    targetMonth: string;
    targetYear: string;
    targetStatus: PayrollRecord['status'];
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5500);
  };

  const computePayrollRecordForEmployee = (
    targetEmp: Employee,
    month: string,
    year: string,
    targetStatus: PayrollRecord['status'] = 'Draft'
  ): PayrollRecord => {
    const monthIndex = MONTHS.indexOf(month);
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const periodKey = `${year}-${monthNum}`;
    const monthlySummary = db.getMonthlyCommissions(periodKey);
    const aggMap = new Map(monthlySummary.employeeAggregates.map((a) => [a.employeeId, a]));

    const basic = Number(targetEmp.basicSalary) || 0;
    const allowances =
      (Number(targetEmp.foodAllowance) || 0) +
      (Number(targetEmp.transportAllowance) || 0) +
      (Number(targetEmp.carOperationAllowance) || 0) +
      (Number(targetEmp.otherAllowance) || 0) +
      (Number(targetEmp.limitedTransport) || 0);

    const agg = aggMap.get(targetEmp.employeeId);
    const comms = agg
      ? {
          total: agg.totalCommissionDue,
          service: agg.serviceCommissionDue,
          product: agg.productCommissionDue,
          business: agg.businessCommissionDue,
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
          businessAchievement:
            agg.businessTargetAmount > 0 ? (agg.businessGrossSales / agg.businessTargetAmount) * 100 : 0,
          businessEligible: agg.businessEligible,
          businessSelectedByCompany: agg.businessSelectedByCompany ?? targetEmp.businessCommissionEligible,
          businessCommBase: targetEmp.businessCommBase || settings?.businessCommBase || 'all_gross',
        }
      : calculateEmployeeCommissions(targetEmp, settings);

    const deductions = Number(targetEmp.deductionCurrent) || 0;
    const foodAllowance = Number(targetEmp.foodAllowance) || 0;
    const transportAllowance = Number(targetEmp.transportAllowance) || 0;
    const carOperationAllowance = Number(targetEmp.carOperationAllowance) || 0;
    const otherAllowance = Number(targetEmp.otherAllowance) || 0;
    const limitedTransport = Number(targetEmp.limitedTransport) || 0;
    const tips = Number(targetEmp.tips) || 0;
    const totalMonthlySalary = basic + allowances + tips + comms.total;
    const netSalary = Math.max(0, totalMonthlySalary - deductions);
    const payrollId = `PAY-${targetEmp.employeeId}-${year}-${month}`;

    return {
      id: payrollId,
      employeeId: targetEmp.employeeId,
      month,
      year,
      basicSalary: basic,
      allowances,
      foodAllowance,
      transportAllowance,
      carOperationAllowance,
      otherAllowance,
      limitedTransport,
      tips,
      commissions: comms.total,
      totalMonthlySalary,
      deductions,
      netSalary,
      paidAmount: 0,
      status: targetStatus,
      paymentDate: '',
      notes: `Sent from Payroll & Human Resources Overview for ${month} ${year}`,
      commissionBreakdown: {
        service: comms.service,
        product: comms.product,
        business: comms.business,
        totalCommission: comms.total,
        serviceTarget: comms.serviceTarget,
        serviceActual: comms.serviceActual,
        serviceRate: comms.serviceRate,
        serviceAchievement: comms.serviceAchievement,
        serviceEligible: comms.serviceEligible,
        productSales: comms.productSales,
        productRate: comms.productRate,
        productEligible: comms.productEligible,
        businessTarget: comms.businessTarget,
        businessGross: comms.businessGross,
        businessRate: comms.businessRate,
        businessAchievement: comms.businessAchievement,
        businessEligible: comms.businessEligible,
        businessSelectedByCompany: comms.businessSelectedByCompany,
        businessCommBase: comms.businessCommBase,
      },
    };
  };

  // Stats calculation
  const stats = useMemo(() => {
    let active = 0;
    let basic = 0;
    let allowances = 0;
    let expiringPassports = 0;
    let expiringQids = 0;
    let employeeOutstanding = 0;

    employees.forEach((emp) => {
      const isUnemployed = emp.status === 'Unemployed';
      if (!isUnemployed) {
        active++;
        const basicSal = Number(emp.basicSalary) || 0;
        const allw =
          (Number(emp.foodAllowance) || 0) +
          (Number(emp.transportAllowance) || 0) +
          (Number(emp.carOperationAllowance) || 0) +
          (Number(emp.otherAllowance) || 0) +
          (Number(emp.limitedTransport) || 0);

        basic += basicSal;
        allowances += allw;
        employeeOutstanding += Number(emp.outstanding) || 0;

        const pDays = calculateDaysRemaining(emp.passportExpiry);
        const qDays = calculateDaysRemaining(emp.residencyExpiry);

        if (pDays < 90) expiringPassports++;
        if (qDays < 90) expiringQids++;
      }
    });

    // 1. Monthly Fixed Expenses for selected month & year (WPS Wages, Cash Wages, Leases & Utilities)
    const monthFixedExpenses = (fixedExpenses || []).filter((f) => {
      const matchMonth = !f.month || f.month.toLowerCase() === selectedMonth.toLowerCase();
      const matchYear = !f.year || f.year.toString() === selectedYear.toString();
      return matchMonth && matchYear;
    });
    const monthlyFixedExpensesTotal = monthFixedExpenses.reduce(
      (sum, f) => sum + (Number(f.amount) || 0),
      0
    );

    // 2. Real Monthly Payroll records for selected month & year
    const monthPayrolls = (payrolls || []).filter((p) => {
      return (
        p.month.toLowerCase() === selectedMonth.toLowerCase() &&
        p.year.toString() === selectedYear.toString()
      );
    });

    // Total Monthly Net: strictly from actual processed payroll records for the month.
    // If no payroll records exist for that month, net is strictly 0.00.
    let net = 0;
    let unpaidPayroll = 0;
    let paidPayroll = 0;

    if (monthPayrolls.length > 0) {
      monthPayrolls.forEach((p) => {
        const netSal = Number(p.netSalary) || 0;
        const paidAmt = Number(p.paidAmount) || 0;
        net += netSal;
        paidPayroll += paidAmt;
        const balance = netSal - paidAmt;
        if (balance > 0) {
          unpaidPayroll += balance;
        }
      });
    }

    const totalUnpaid = unpaidPayroll + employeeOutstanding;

    return {
      active,
      monthlyFixedExpenses: monthlyFixedExpensesTotal,
      fixedExpensesCount: monthFixedExpenses.length,
      basic,
      allowances,
      net,
      payrollCount: monthPayrolls.length,
      unpaid: totalUnpaid,
      unpaidPayroll,
      paidPayroll,
      expiringPassports,
      expiringQids,
    };
  }, [employees, fixedExpenses, payrolls, selectedMonth, selectedYear]);

  // Filtered employees for table
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status === 'Unemployed') return false; // Dashboard focuses on active workforce
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        emp.employeeName.toLowerCase().includes(term) ||
        emp.employeeId.toLowerCase().includes(term) ||
        emp.position.toLowerCase().includes(term) ||
        emp.company.toLowerCase().includes(term) ||
        emp.residencyQid.toLowerCase().includes(term) ||
        emp.passportNumber.toLowerCase().includes(term) ||
        emp.nationality.toLowerCase().includes(term) ||
        emp.payerBank.toLowerCase().includes(term)
      );
    });
  }, [employees, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Payroll &amp; Human Resources Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workforce analytics, Qatar compliance tracking, salary packages, and active contracts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month & Year Period Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {['2025', '2026', '2027', '2028'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff, QID, ID, bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={onExportExcel}
            className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {onNavigateDailySales && (
            <button
              onClick={onNavigateDailySales}
              className="px-3.5 py-2 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <ReceiptText className="w-3.5 h-3.5 text-purple-600" />
              <span>Daily Sales Report</span>
            </button>
          )}

          {onNavigateBusinessExpenses && (
            <button
              onClick={onNavigateBusinessExpenses}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Business Expanses</span>
            </button>
          )}

          {onNavigateMonthlyPayroll && (
            <button
              onClick={onNavigateMonthlyPayroll}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Monthly Payroll</span>
            </button>
          )}

          <button
            onClick={() =>
              setSendPayrollModal({
                isOpen: true,
                mode: 'all',
                targetMonth: selectedMonth,
                targetYear: selectedYear,
                targetStatus: 'Draft',
              })
            }
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            title={`Batch generate & send all active salon staff to Monthly Payroll Processing & Batch Approval for ${selectedMonth} ${selectedYear}`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Send All to Monthly Payroll ({selectedMonth} {selectedYear})</span>
          </button>

          <button
            onClick={onNavigateAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Active Staff */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Active Staff
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {stats.active}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Active salon workforce
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Fixed Expanse: WPS Wages, Leases & Utilities */}
        <div
          onClick={onNavigateBusinessExpenses}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 ${
            onNavigateBusinessExpenses ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all' : ''
          }`}
          title="Click to view Monthly Fixed Expenses breakdown"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate"
              title="Monthly Fixed Expanse: WPS Wages, Leases & Utilities"
            >
              Monthly Fixed Expanse: WPS Wages, Leases &amp; Utilities
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">
              QAR {formatCurrency(stats.monthlyFixedExpenses)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {stats.fixedExpensesCount > 0
                ? `${stats.fixedExpensesCount} items (${selectedMonth} ${selectedYear})`
                : `0 items (${selectedMonth} ${selectedYear})`}
            </div>
          </div>
        </div>

        {/* Card 3: Total Basic Salaries */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Basic Salaries
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">
              QAR {formatCurrency(stats.basic)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Active staff contract base ({stats.active} staff)
            </div>
          </div>
        </div>

        {/* Card 4: Total Allowances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Allowances
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">
              QAR {formatCurrency(stats.allowances)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Food, Transport &amp; Operation
            </div>
          </div>
        </div>

        {/* Card 5: Total Monthly Net */}
        <div
          onClick={onNavigateMonthlyPayroll}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 ${
            onNavigateMonthlyPayroll ? 'cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all' : ''
          }`}
          title="Click to view Monthly Payroll Processing & Wages"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Monthly Net
            </div>
            <div className="text-lg font-bold text-emerald-600 tabular-nums">
              QAR {formatCurrency(stats.net)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {stats.payrollCount > 0
                ? `${stats.payrollCount} processed sheets (${selectedMonth} ${selectedYear})`
                : `No ${selectedMonth} ${selectedYear} Payroll Generated`}
            </div>
          </div>
        </div>

        {/* Card 6: Unpaid / Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Unpaid / Outstanding
            </div>
            <div className={`text-lg font-bold tabular-nums ${stats.unpaid > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              QAR {formatCurrency(stats.unpaid)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {stats.unpaid > 0
                ? `Pending payment settlement`
                : `All accounts fully reconciled`}
            </div>
          </div>
        </div>

        {/* Card 7: Passports (<90 Days) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Passports (&lt;90 Days)
            </div>
            <div className={`text-xl font-bold tabular-nums ${stats.expiringPassports > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats.expiringPassports}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {stats.expiringPassports > 0
                ? `${stats.expiringPassports} renewal(s) required`
                : `All passports valid (>90 days)`}
            </div>
          </div>
        </div>

        {/* Card 8: QIDs (<90 Days) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              QIDs (&lt;90 Days)
            </div>
            <div className={`text-xl font-bold tabular-nums ${stats.expiringQids > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.expiringQids}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {stats.expiringQids > 0
                ? `${stats.expiringQids} renewal(s) required`
                : `All QIDs compliant (>90 days)`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Wide Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Master Payroll &amp; Employment Schedule
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredEmployees.length} employees)
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Scroll horizontally to inspect full banking, allowances, and sales targets →
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[3400px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap bg-slate-50">Actions</th>
                <th className="py-2.5 px-3 whitespace-nowrap">No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Employee ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Employee's Name</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Company</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Duty</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Accommodation</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Position</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Contract No.</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Contract Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Joining Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">End Contract</th>
                <th className="py-2.5 px-3 whitespace-nowrap">MPH</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Expire MPH</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Nationality</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Mobile</th>
                <th className="py-2.5 px-3 whitespace-nowrap">WhatsApp</th>
                <th className="py-2.5 px-3 whitespace-nowrap">E-mail</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Passport Number</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Passport Expiry</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Passport Days</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Residency QID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Residency Expiry</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Residency Days</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Payer Bank</th>
                <th className="py-2.5 px-3 whitespace-nowrap font-mono">Payee IBAN</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Basic Salary</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Food Allowance</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Transport Allow.</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Car Operation</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Other Allowance</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Limited Transport</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right font-bold text-slate-800 bg-slate-100/60" title="Fixed Contract Package: Basic + 5 Allowances">
                  Fixed Base Package
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-rose-600">
                  Deduction Current
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Deduction Future</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right font-bold text-purple-700 bg-purple-50/50">
                  7. Tips
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-rose-600">
                  Outstanding
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Annual Leave Paid</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right font-black text-amber-950 bg-amber-100/70 border-x border-amber-200" title="10-Component Gross Wages: Basic + 5 Allowances + Tips + 3 Commissions">
                  Total Salaries &amp; Wages (Gross)
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Sale Comm %</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Sale Target</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Actual Sales</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Target Sales</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Prod Comm %</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Prod Target</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Prod Total</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Business Rate %</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Business Gross</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Business Bonus</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right font-bold text-amber-800 bg-amber-50/50">Combined Commission</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right font-black text-emerald-950 bg-emerald-100/70 border-x border-emerald-200" title="Net Disbursed: Gross Salaries & Wages − Deductions">
                  Total Net Pay (Payable)
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp, index) => {
                const pDays = calculateDaysRemaining(emp.passportExpiry);
                const qDays = calculateDaysRemaining(emp.residencyExpiry);
                const livePreview = computePayrollRecordForEmployee(emp, selectedMonth, selectedYear);
                const comms = {
                  total: livePreview.commissions,
                  service: livePreview.commissionBreakdown?.service || 0,
                  product: livePreview.commissionBreakdown?.product || 0,
                  business: livePreview.commissionBreakdown?.business || 0,
                };

                return (
                  <tr
                    key={emp.employeeId}
                    onClick={() => onOpenEmployee(emp.employeeId)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 whitespace-nowrap sticky left-0 bg-white z-0 group-hover:bg-blue-50/40">
                      {(() => {
                        const payrollId = `PAY-${emp.employeeId}-${selectedYear}-${selectedMonth}`;
                        const existingPayroll = payrolls.find(
                          (p) =>
                            p.id === payrollId ||
                            (p.employeeId === emp.employeeId &&
                              p.month.toLowerCase() === selectedMonth.toLowerCase() &&
                              p.year.toString() === selectedYear.toString())
                        );

                        return (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEmployee(emp.employeeId);
                              }}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="View Employee Profile"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSendPayrollModal({
                                  isOpen: true,
                                  mode: 'single',
                                  employee: emp,
                                  targetMonth: selectedMonth,
                                  targetYear: selectedYear,
                                  targetStatus: existingPayroll ? existingPayroll.status : 'Draft',
                                });
                              }}
                              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                                existingPayroll
                                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                                  : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-2xs'
                              }`}
                              title={
                                existingPayroll
                                  ? `Already in ${selectedMonth} ${selectedYear} Payroll (${existingPayroll.status}). Click to re-calculate or update.`
                                  : `Generate & Send to Monthly Payroll Processing & Batch Approval for ${selectedMonth} ${selectedYear}`
                              }
                            >
                              <CreditCard className="w-3 h-3 text-indigo-600" />
                              <span>{existingPayroll ? `Payroll ✓ (${existingPayroll.status})` : 'Send to Payroll'}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-mono">
                      {emp.no || index + 1}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-900 font-mono">
                      {emp.employeeId}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-900">
                      {emp.employeeName}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700">
                      {emp.company}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {emp.duty}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {emp.accommodation}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-800">
                      {emp.position}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-500">
                      {emp.contractNo}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {emp.contractType}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.joiningDate}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.endContract}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          emp.mph === 'YES'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {emp.mph}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-500">
                      {emp.expireMph || '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700">
                      {emp.nationality}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.mobile}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.whatsapp}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {emp.email}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-800">
                      {emp.passportNumber}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.passportExpiry}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          pDays < 90
                            ? 'bg-rose-100 text-rose-800'
                            : pDays < 180
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Day {pDays}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-800">
                      {emp.residencyQid}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                      {emp.residencyExpiry}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          qDays < 90
                            ? 'bg-rose-100 text-rose-800'
                            : qDays < 180
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Day {qDays}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-800 font-medium">
                      {emp.payerBank}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600 tracking-wider">
                      {maskIBAN(emp.iban)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.basicSalary)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.foodAllowance)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.transportAllowance)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.carOperationAllowance)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.otherAllowance)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.limitedTransport)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-bold text-slate-800 bg-slate-100/60" title="Fixed Package: Basic + 5 Allowances">
                      {formatCurrency(emp.totalSalary)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums text-rose-600 font-medium">
                      {formatCurrency(emp.deductionCurrent)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums text-slate-500">
                      {formatCurrency(emp.deductionFuture)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-bold text-purple-700 bg-purple-50/40">
                      {formatCurrency(livePreview.tips)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-bold text-rose-600">
                      {formatCurrency(emp.outstanding)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {emp.annualLeavePaid || '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-black text-amber-950 bg-amber-50/80 border-x border-amber-200" title="Gross Salaries & Wages (10 Components)">
                      QAR {formatCurrency(livePreview.totalMonthlySalary)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {emp.saleCommissionRate}%
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.saleTargetRate)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.totalSalesRate)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.targetSales)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {emp.prodSaleCommission}%
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.prodSaleTarget)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.prodTotalSales)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {emp.businessTargetRate}%
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.businessGross)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(emp.businessBonus)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-bold text-amber-700 bg-amber-50/40">
                      QAR {formatCurrency(comms.total)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-black text-emerald-950 bg-emerald-50/80 border-x border-emerald-200" title="Total Net Pay (Payable): Gross Salaries & Wages − Deductions">
                      QAR {formatCurrency(livePreview.netSalary)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">No active employees found matching your search.</p>
              <button
                onClick={onLoadSample}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Reload Sample Salon Staff
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOAST NOTIFICATION                                             */}
      {/* ============================================================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-medium flex-1">{toastMessage}</div>
          {onNavigateMonthlyPayroll && (
            <button
              type="button"
              onClick={onNavigateMonthlyPayroll}
              className="px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Open Payroll →
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SEND EMPLOYEE TO MONTHLY PAYROLL & BATCH APPROVAL       */}
      {/* ============================================================== */}
      {sendPayrollModal && sendPayrollModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>
                      {sendPayrollModal.mode === 'single'
                        ? `Send to Monthly Payroll: ${sendPayrollModal.employee?.employeeName}`
                        : 'Batch Send All Staff to Monthly Payroll'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Destination: <span className="font-semibold text-amber-300">Monthly Payroll Processing &amp; Batch Approval</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendPayrollModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-4 text-xs">
              {/* Target Period Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-700 uppercase">
                  Target Payroll Month &amp; Year
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Accounting Month</label>
                    <select
                      value={sendPayrollModal.targetMonth}
                      onChange={(e) =>
                        setSendPayrollModal({
                          ...sendPayrollModal,
                          targetMonth: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Accounting Year</label>
                    <select
                      value={sendPayrollModal.targetYear}
                      onChange={(e) =>
                        setSendPayrollModal({
                          ...sendPayrollModal,
                          targetYear: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer font-mono"
                    >
                      {['2025', '2026', '2027', '2028'].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Initial Batch Approval Status</label>
                  <select
                    value={sendPayrollModal.targetStatus}
                    onChange={(e) =>
                      setSendPayrollModal({
                        ...sendPayrollModal,
                        targetStatus: e.target.value as PayrollRecord['status'],
                      })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <option value="Draft">Draft (HR verification pending)</option>
                    <option value="Approved">Approved (Ready for WPS SIF bank processing)</option>
                    <option value="Paid">Paid (Already disbursed)</option>
                  </select>
                </div>
              </div>

              {/* Single Employee Details & Salary Calculation Preview (Full 10 Components) */}
              {sendPayrollModal.mode === 'single' && sendPayrollModal.employee && (() => {
                const emp = sendPayrollModal.employee;
                const preview = computePayrollRecordForEmployee(
                  emp,
                  sendPayrollModal.targetMonth,
                  sendPayrollModal.targetYear,
                  sendPayrollModal.targetStatus
                );

                const existing = payrolls.find(
                  (p) =>
                    p.id === preview.id ||
                    (p.employeeId === emp.employeeId &&
                      p.month.toLowerCase() === sendPayrollModal.targetMonth.toLowerCase() &&
                      p.year.toString() === sendPayrollModal.targetYear.toString())
                );

                const sComm = preview.commissionBreakdown?.service || 0;
                const pComm = preview.commissionBreakdown?.product || 0;
                const bComm = preview.commissionBreakdown?.business || 0;
                const totalComms = preview.commissions;

                return (
                  <div className="space-y-3">
                    {/* Employee Badge */}
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{emp.employeeName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ID: <span className="font-mono font-bold text-slate-700">{emp.employeeId}</span> • Position: {emp.position} • Bank: {emp.payerBank}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {emp.duty}
                      </span>
                    </div>

                    {/* Complete 10-Component Remuneration Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-slate-900 text-white px-3.5 py-2 font-bold text-xs flex items-center justify-between">
                        <span>10-Component Salary &amp; Wages Breakdown</span>
                        <span className="text-[11px] font-mono font-normal text-amber-300">
                          {sendPayrollModal.targetMonth} {sendPayrollModal.targetYear}
                        </span>
                      </div>
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[9.5px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Remuneration Component</th>
                            <th className="py-2 px-3">Details / Target Formula</th>
                            <th className="py-2 px-3 text-right">Amount (QAR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">1</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900 font-sans">Basic Salary</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Contract fixed basic remuneration</td>
                            <td className="py-1.5 px-3 text-right text-slate-900 font-bold">QAR {formatCurrency(preview.basicSalary)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">2</td>
                            <td className="py-1.5 px-3 text-slate-800 font-sans">Food Allowance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Monthly food stipend</td>
                            <td className="py-1.5 px-3 text-right text-slate-800">QAR {formatCurrency(preview.foodAllowance || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">3</td>
                            <td className="py-1.5 px-3 text-slate-800 font-sans">Transportation Allowance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Contract standard transport</td>
                            <td className="py-1.5 px-3 text-right text-slate-800">QAR {formatCurrency(preview.transportAllowance || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">4</td>
                            <td className="py-1.5 px-3 text-slate-800 font-sans">Car Operation Allowance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Vehicle running / fuel</td>
                            <td className="py-1.5 px-3 text-right text-slate-800">QAR {formatCurrency(preview.carOperationAllowance || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">5</td>
                            <td className="py-1.5 px-3 text-slate-800 font-sans">Other Allowance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Special duties / mobile</td>
                            <td className="py-1.5 px-3 text-right text-slate-800">QAR {formatCurrency(preview.otherAllowance || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-400">6</td>
                            <td className="py-1.5 px-3 text-slate-800 font-sans">Limited Transport Allowance</td>
                            <td className="py-1.5 px-3 text-slate-500 font-sans">Restricted zone transport</td>
                            <td className="py-1.5 px-3 text-right text-slate-800">QAR {formatCurrency(preview.limitedTransport || 0)}</td>
                          </tr>
                          <tr className="bg-purple-50/50">
                            <td className="py-1.5 px-3 text-purple-600 font-bold">7</td>
                            <td className="py-1.5 px-3 font-bold text-purple-900 font-sans">Employee Tips (Gratuity)</td>
                            <td className="py-1.5 px-3 text-purple-700 font-sans">Staff gratuity &amp; customer tips</td>
                            <td className="py-1.5 px-3 text-right font-bold text-purple-900">QAR {formatCurrency(preview.tips || 0)}</td>
                          </tr>
                          <tr className="bg-blue-50/40">
                            <td className="py-1.5 px-3 text-blue-600 font-bold">8</td>
                            <td className="py-1.5 px-3 font-bold text-blue-900 font-sans">Net Services Comm. Due</td>
                            <td className="py-1.5 px-3 text-blue-700 font-sans">
                              {preview.commissionBreakdown?.serviceEligible ? 'Target Met ✓' : 'Below Target'} · Sales QAR {formatCurrency(preview.commissionBreakdown?.serviceActual || 0)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-blue-950">QAR {formatCurrency(sComm)}</td>
                          </tr>
                          <tr className="bg-teal-50/40">
                            <td className="py-1.5 px-3 text-teal-600 font-bold">9</td>
                            <td className="py-1.5 px-3 font-bold text-teal-900 font-sans">Net Product Comm. Due</td>
                            <td className="py-1.5 px-3 text-teal-700 font-sans">
                              Retail Sales QAR {formatCurrency(preview.commissionBreakdown?.productSales || 0)} × {preview.commissionBreakdown?.productRate}%
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-teal-950">QAR {formatCurrency(pComm)}</td>
                          </tr>
                          <tr className="bg-indigo-50/40">
                            <td className="py-1.5 px-3 text-indigo-600 font-bold">10</td>
                            <td className="py-1.5 px-3 font-bold text-indigo-900 font-sans">Net Business Gross Comm. Due</td>
                            <td className="py-1.5 px-3 text-indigo-700 font-sans">
                              {preview.commissionBreakdown?.businessSelectedByCompany
                                ? (preview.commissionBreakdown?.businessEligible ? 'Target Met ✓' : 'Deficit')
                                : 'Not Selected by Company'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-indigo-950">QAR {formatCurrency(bComm)}</td>
                          </tr>
                        </tbody>
                        <tfoot className="border-t-2 border-slate-300 font-mono text-xs">
                          <tr className="bg-amber-100/70 font-black text-amber-950">
                            <td colSpan={3} className="py-2.5 px-3 uppercase font-sans text-xs">
                              Total Monthly Salaries &amp; Wages (Gross 10-Component Sum)
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs">
                              QAR {formatCurrency(preview.totalMonthlySalary)}
                            </td>
                          </tr>
                          <tr className="bg-rose-50 font-bold text-rose-700">
                            <td colSpan={3} className="py-2 px-3 font-sans">
                              Less: Current Deductions
                            </td>
                            <td className="py-2 px-3 text-right">
                              − QAR {formatCurrency(preview.deductions)}
                            </td>
                          </tr>
                          <tr className="bg-emerald-100 font-black text-emerald-950 text-sm">
                            <td colSpan={3} className="py-2.5 px-3 uppercase font-sans">
                              Total Net Pay (Payable to Staff)
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              QAR {formatCurrency(preview.netSalary)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Notice if already exists */}
                    {existing && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold">Existing record found:</span> A payroll record for this employee already exists for {sendPayrollModal.targetMonth} {sendPayrollModal.targetYear} (Status: <span className="font-semibold">{existing.status}</span>). Submitting will recalculate and transfer all 10 updated components.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* All Active Staff Mode with Full 10-Component Table */}
              {sendPayrollModal.mode === 'all' && (() => {
                const activeEmployees = employees.filter((e) => e.status !== 'Unemployed');
                const batchList = activeEmployees.map((emp) =>
                  computePayrollRecordForEmployee(
                    emp,
                    sendPayrollModal.targetMonth,
                    sendPayrollModal.targetYear,
                    sendPayrollModal.targetStatus
                  )
                );

                const totalGrossAll = batchList.reduce((sum, b) => sum + (Number(b.totalMonthlySalary) || 0), 0);
                const totalNetAll = batchList.reduce((sum, b) => sum + (Number(b.netSalary) || 0), 0);
                const totalTipsAll = batchList.reduce((sum, b) => sum + (Number(b.tips) || 0), 0);
                const totalCommsAll = batchList.reduce((sum, b) => sum + (Number(b.commissions) || 0), 0);

                return (
                  <div className="space-y-3">
                    {/* Summary banner */}
                    <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Batch Transfer All {activeEmployees.length} Active Employees to Monthly Payroll &amp; Wages</span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-200/60 text-indigo-900 font-mono">
                          {sendPayrollModal.targetMonth} {sendPayrollModal.targetYear}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-200/60 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Staff Count</span>
                          <strong className="text-slate-900 font-mono text-sm">{activeEmployees.length} Staff</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                          <span className="text-[10px] text-purple-700 block font-semibold uppercase">Total Tips</span>
                          <strong className="text-purple-900 font-mono text-sm">QAR {formatCurrency(totalTipsAll)}</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                          <span className="text-[10px] text-amber-700 block font-semibold uppercase">Gross Salaries</span>
                          <strong className="text-amber-950 font-mono text-sm">QAR {formatCurrency(totalGrossAll)}</strong>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
                          <span className="text-[10px] text-emerald-800 block font-semibold uppercase">Total Net Pay</span>
                          <strong className="text-emerald-950 font-mono text-sm">QAR {formatCurrency(totalNetAll)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Staff Remuneration Sheet */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[380px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                        <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 text-[9.5px] uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Staff Name</th>
                            <th className="py-2 px-3 text-right">1. Basic</th>
                            <th className="py-2 px-3 text-right">2-6. Allowances</th>
                            <th className="py-2 px-3 text-right text-purple-800 bg-purple-50">7. Tips</th>
                            <th className="py-2 px-3 text-right text-amber-800 bg-amber-50">8-10. Comm.</th>
                            <th className="py-2 px-3 text-right font-black text-amber-950 bg-amber-100">Gross Wages</th>
                            <th className="py-2 px-3 text-right text-rose-600">Ded.</th>
                            <th className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-100">Total Net Pay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                          {batchList.map((rec) => {
                            const emp = activeEmployees.find((e) => e.employeeId === rec.employeeId);
                            return (
                              <tr key={rec.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-sans">
                                  <div className="font-bold text-slate-900">{emp?.employeeName || rec.employeeId}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{rec.employeeId} · {emp?.position}</div>
                                </td>
                                <td className="py-2 px-3 text-right">QAR {formatCurrency(rec.basicSalary)}</td>
                                <td className="py-2 px-3 text-right">QAR {formatCurrency(rec.allowances)}</td>
                                <td className="py-2 px-3 text-right text-purple-800 bg-purple-50/40 font-bold">QAR {formatCurrency(rec.tips || 0)}</td>
                                <td className="py-2 px-3 text-right text-amber-800 bg-amber-50/40 font-bold">QAR {formatCurrency(rec.commissions || 0)}</td>
                                <td className="py-2 px-3 text-right font-black text-amber-950 bg-amber-100/60">QAR {formatCurrency(rec.totalMonthlySalary)}</td>
                                <td className="py-2 px-3 text-right text-rose-600">QAR {formatCurrency(rec.deductions)}</td>
                                <td className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-100/80">QAR {formatCurrency(rec.netSalary)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSendPayrollModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (sendPayrollModal.mode === 'single' && sendPayrollModal.employee) {
                    const emp = sendPayrollModal.employee;
                    const record = computePayrollRecordForEmployee(
                      emp,
                      sendPayrollModal.targetMonth,
                      sendPayrollModal.targetYear,
                      sendPayrollModal.targetStatus
                    );
                    await db.savePayrollRecord(record);
                    await db.syncPayrollToBusinessExpenses(
                      sendPayrollModal.targetMonth,
                      sendPayrollModal.targetYear
                    );
                    await db.logAudit(
                      'PAYROLL_GENERATED',
                      `Transferred all 10 salary components for ${emp.employeeName} (${sendPayrollModal.targetMonth} ${sendPayrollModal.targetYear}) - Gross: QAR ${record.totalMonthlySalary}, Net Pay: QAR ${record.netSalary}`
                    );
                    showToast(
                      `✅ Successfully transferred ${emp.employeeName}'s full 10-component wages (Gross: QAR ${formatCurrency(record.totalMonthlySalary)}, Net Pay: QAR ${formatCurrency(record.netSalary)}) to Monthly Payroll Processing & Wages!`
                    );
                  } else {
                    const activeEmployees = employees.filter((e) => e.status !== 'Unemployed');
                    let createdCount = 0;
                    let totalGrossTransferred = 0;
                    let totalNetTransferred = 0;

                    for (const emp of activeEmployees) {
                      const record = computePayrollRecordForEmployee(
                        emp,
                        sendPayrollModal.targetMonth,
                        sendPayrollModal.targetYear,
                        sendPayrollModal.targetStatus
                      );
                      await db.savePayrollRecord(record);
                      createdCount++;
                      totalGrossTransferred += Number(record.totalMonthlySalary) || 0;
                      totalNetTransferred += Number(record.netSalary) || 0;
                    }

                    await db.syncPayrollToBusinessExpenses(
                      sendPayrollModal.targetMonth,
                      sendPayrollModal.targetYear
                    );
                    await db.logAudit(
                      'PAYROLL_BATCH_GENERATED',
                      `Batch transferred ${createdCount} payroll records to Monthly Payroll Processing & Batch Approval for ${sendPayrollModal.targetMonth} ${sendPayrollModal.targetYear}`
                    );
                    showToast(
                      `⚡ Successfully transferred all 10 salary & wage components for ${createdCount} staff (Gross: QAR ${formatCurrency(totalGrossTransferred)}, Net Pay: QAR ${formatCurrency(totalNetTransferred)}) to Monthly Payroll Processing & Wages!`
                    );
                  }

                  setSendPayrollModal(null);
                  if (onRefresh) onRefresh();
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {sendPayrollModal.mode === 'single'
                    ? 'Confirm & Transfer to Monthly Payroll & Wages'
                    : `Batch Transfer All (${employees.filter((e) => e.status !== 'Unemployed').length} Staff) to Monthly Payroll`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
