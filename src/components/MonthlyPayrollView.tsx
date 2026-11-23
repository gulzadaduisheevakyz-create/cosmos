import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Zap,
  CheckCheck,
  CheckCircle2,
  Trash2,
  Eye,
  Filter,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Printer,
  X,
  Check,
  Settings,
  Calculator,
  FileText,
  ChevronRight,
  HelpCircle,
  UserCheck,
  ShieldAlert,
  Coins,
  Percent,
  Target,
  ArrowRight,
  Send,
  Wallet,
  Pencil,
  Sliders,
  Edit3,
  Save,
  Download,
  Loader2,
} from 'lucide-react';
import { Employee, PayrollRecord, SystemSettings } from '../types';
import { db, formatCurrency, calculateEmployeeCommissions, calculateEmployeeSalaryAndWages, maskIBAN } from '../services/db';
import { exportPayrollToExcel } from '../services/excel';
import { exportElementToPdf, printElement } from '../services/pdfService';
import { ConfirmModal } from './ConfirmModal';

interface MonthlyPayrollViewProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  settings: SystemSettings;
  onRefresh: () => void;
  onOpenEmployee: (empId: string) => void;
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

export const MonthlyPayrollView: React.FC<MonthlyPayrollViewProps> = ({
  employees,
  payrolls,
  settings,
  onRefresh,
  onOpenEmployee,
}) => {
  const currentMonthName = MONTHS[new Date().getMonth()];
  const currentYearVal = new Date().getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYearVal);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showManualTipsModal, setShowManualTipsModal] = useState(false);
  const [breakdownRecord, setBreakdownRecord] = useState<PayrollRecord | null>(null);
  const [payTransferRecord, setPayTransferRecord] = useState<PayrollRecord | null>(null);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [editPayrollRecord, setEditPayrollRecord] = useState<PayrollRecord | null>(null);

  // Quick Inline Edit Mode State
  const [quickEditMode, setQuickEditMode] = useState<boolean>(false);
  const [quickRowEdits, setQuickRowEdits] = useState<
    Record<
      string,
      {
        basicSalary?: number;
        allowances?: number;
        tips?: number;
        serviceActual?: number;
        productSales?: number;
        deductions?: number;
        status?: PayrollRecord['status'];
      }
    >
  >({});

  // Inline Tips State
  const [inlineTips, setInlineTips] = useState<Record<string, number>>({});

  // In-app Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    action: () => Promise<void> | void;
  } | null>(null);

  // In-app Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Handler: Save Inline Tips directly from the table row
  const handleSaveInlineTips = async (record: PayrollRecord, newTips: number) => {
    const currentTips = Number(record.tips) || 0;
    if (currentTips === newTips) return;

    const emp = employees.find((e) => e.employeeId === record.employeeId);
    const basic = Number(record.basicSalary) || Number(emp?.basicSalary) || 0;
    const food = Number(record.foodAllowance) || Number(emp?.foodAllowance) || 0;
    const transport = Number(record.transportAllowance) || Number(emp?.transportAllowance) || 0;
    const carOp = Number(record.carOperationAllowance) || Number(emp?.carOperationAllowance) || 0;
    const other = Number(record.otherAllowance) || Number(emp?.otherAllowance) || 0;
    const limitedTrans = Number(record.limitedTransport) || Number(emp?.limitedTransport) || 0;
    const allowances = food + transport + carOp + other + limitedTrans;

    const sComm = Number(record.commissionBreakdown?.service) || 0;
    const pComm = Number(record.commissionBreakdown?.product) || 0;
    const bComm = Number(record.commissionBreakdown?.business) || 0;
    const totalComms = sComm + pComm + bComm;

    const deductions = Number(record.deductions) || 0;
    const newGross = basic + allowances + newTips + totalComms;
    const newNet = Math.max(0, newGross - deductions);

    const updatedRecord: PayrollRecord = {
      ...record,
      tips: newTips,
      totalMonthlySalary: newGross,
      netSalary: newNet,
    };

    await db.savePayrollRecord(updatedRecord);

    if (emp) {
      await db.saveEmployee({
        ...emp,
        tips: newTips,
      });
    }

    await db.syncPayrollToBusinessExpenses(record.month, record.year);
    showToast(
      `Saved manual tips for ${emp?.employeeName || record.employeeId}: QAR ${formatCurrency(newTips)}. Gross: QAR ${formatCurrency(newGross)}, Net: QAR ${formatCurrency(newNet)}`
    );
    onRefresh();
  };

  // Handler: Save Complete 10-Component Record from Modal
  const handleSaveEditRecord = async (updated: PayrollRecord, syncToMaster: boolean) => {
    await db.savePayrollRecord(updated);

    if (syncToMaster) {
      const emp = employees.find((e) => e.employeeId === updated.employeeId);
      if (emp) {
        await db.saveEmployee({
          ...emp,
          basicSalary: updated.basicSalary,
          foodAllowance: updated.foodAllowance !== undefined ? updated.foodAllowance : emp.foodAllowance,
          transportAllowance: updated.transportAllowance !== undefined ? updated.transportAllowance : emp.transportAllowance,
          carOperationAllowance: updated.carOperationAllowance !== undefined ? updated.carOperationAllowance : emp.carOperationAllowance,
          otherAllowance: updated.otherAllowance !== undefined ? updated.otherAllowance : emp.otherAllowance,
          limitedTransport: updated.limitedTransport !== undefined ? updated.limitedTransport : emp.limitedTransport,
          totalSalary: updated.basicSalary + (updated.allowances || 0),
          tips: updated.tips !== undefined ? updated.tips : emp.tips,
          saleTargetRate: updated.commissionBreakdown?.serviceTarget !== undefined ? updated.commissionBreakdown.serviceTarget : emp.saleTargetRate,
          saleCommissionRate: updated.commissionBreakdown?.serviceRate !== undefined ? updated.commissionBreakdown.serviceRate : emp.saleCommissionRate,
          totalSalesRate: updated.commissionBreakdown?.serviceActual !== undefined ? updated.commissionBreakdown.serviceActual : emp.totalSalesRate,
          prodSaleCommission: updated.commissionBreakdown?.productRate !== undefined ? updated.commissionBreakdown.productRate : emp.prodSaleCommission,
          prodTotalSales: updated.commissionBreakdown?.productSales !== undefined ? updated.commissionBreakdown.productSales : emp.prodTotalSales,
          businessCommissionEligible: updated.commissionBreakdown?.businessSelectedByCompany ?? emp.businessCommissionEligible,
          businessTargetAmount: updated.commissionBreakdown?.businessTarget !== undefined ? updated.commissionBreakdown.businessTarget : emp.businessTargetAmount,
          businessTargetRate: updated.commissionBreakdown?.businessRate !== undefined ? updated.commissionBreakdown.businessRate : emp.businessTargetRate,
          businessGross: updated.commissionBreakdown?.businessGross !== undefined ? updated.commissionBreakdown.businessGross : emp.businessGross,
          deductionCurrent: updated.deductions,
        });
      }
    }

    await db.syncPayrollToBusinessExpenses(updated.month, updated.year);
    await db.logAudit(
      'PAYROLL_RECORD_EDITED',
      `Updated 10-component remuneration for ${updated.employeeId} (${updated.month} ${updated.year}): Gross QAR ${updated.totalMonthlySalary}, Net QAR ${updated.netSalary}`
    );
    setEditPayrollRecord(null);
    showToast(`✅ Successfully saved and recalculated payroll sheet for ${updated.employeeId}! (Gross: QAR ${formatCurrency(updated.totalMonthlySalary || 0)}, Net: QAR ${formatCurrency(updated.netSalary)})`);
    onRefresh();
  };

  // Handler: Save All Quick Inline Table Edits
  const handleSaveAllQuickEdits = async () => {
    const empMap = new Map(employees.map((e) => [e.employeeId, e]));
    let count = 0;

    for (const [payrollId, edits] of Object.entries(quickRowEdits)) {
      const record = payrolls.find((p) => p.id === payrollId);
      if (!record) continue;
      const emp = empMap.get(record.employeeId);

      const basic = edits.basicSalary !== undefined ? edits.basicSalary : (Number(record.basicSalary) || Number(emp?.basicSalary) || 0);
      const food = Number(record.foodAllowance) || Number(emp?.foodAllowance) || 0;
      const transport = Number(record.transportAllowance) || Number(emp?.transportAllowance) || 0;
      const carOp = Number(record.carOperationAllowance) || Number(emp?.carOperationAllowance) || 0;
      const other = Number(record.otherAllowance) || Number(emp?.otherAllowance) || 0;
      const limitedTrans = Number(record.limitedTransport) || Number(emp?.limitedTransport) || 0;
      const totalAllw = edits.allowances !== undefined ? edits.allowances : (food + transport + carOp + other + limitedTrans);

      const tips = edits.tips !== undefined ? edits.tips : (Number(record.tips) || Number(emp?.tips) || 0);
      const deductions = edits.deductions !== undefined ? edits.deductions : (Number(record.deductions) || 0);
      const status = edits.status !== undefined ? edits.status : record.status;

      // Service Commission
      const sTarget = Number(record.commissionBreakdown?.serviceTarget) || Number(emp?.saleTargetRate) || 0;
      const sRate = Number(record.commissionBreakdown?.serviceRate) || Number(emp?.saleCommissionRate) || 10;
      const sActual = edits.serviceActual !== undefined ? edits.serviceActual : (Number(record.commissionBreakdown?.serviceActual) || Number(emp?.totalSalesRate) || 0);
      const sEligible = sActual >= sTarget && sTarget > 0;
      const sComm = sEligible ? sActual * (sRate / 100) : 0;

      // Product Commission
      const pRate = Number(record.commissionBreakdown?.productRate) || Number(emp?.prodSaleCommission) || 5;
      const pSales = edits.productSales !== undefined ? edits.productSales : (Number(record.commissionBreakdown?.productSales) || Number(emp?.prodTotalSales) || 0);
      const pComm = pSales > 0 ? pSales * (pRate / 100) : 0;

      // Business Commission
      const bComm = Number(record.commissionBreakdown?.business) || 0;
      const totalComms = sComm + pComm + bComm;

      const totalGross = basic + totalAllw + tips + totalComms;
      const netSalary = Math.max(0, totalGross - deductions);

      const updatedRecord: PayrollRecord = {
        ...record,
        basicSalary: basic,
        allowances: totalAllw,
        tips,
        commissions: totalComms,
        totalMonthlySalary: totalGross,
        deductions,
        netSalary,
        status,
        commissionBreakdown: {
          ...record.commissionBreakdown,
          service: sComm,
          product: pComm,
          business: bComm,
          totalCommission: totalComms,
          serviceActual: sActual,
          serviceEligible: sEligible,
          productSales: pSales,
          productEligible: pSales > 0,
        },
      };

      await db.savePayrollRecord(updatedRecord);
      count++;
    }

    await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);
    setQuickRowEdits({});
    setQuickEditMode(false);
    showToast(`✅ Successfully saved and recalculated ${count} payroll sheet(s)!`);
    onRefresh();
  };

  // Filtered payroll records
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const matchMonth = selectedMonth ? p.month === selectedMonth : true;
      const matchYear = selectedYear ? p.year === selectedYear : true;
      const matchStatus = statusFilter ? p.status === statusFilter : true;
      return matchMonth && matchYear && matchStatus;
    });
  }, [payrolls, selectedMonth, selectedYear, statusFilter]);

  // Aggregate stats across all 10 components
  const stats = useMemo(() => {
    let totalBasic = 0;
    let totalAllowances = 0;
    let totalTips = 0;
    let totalServicesComm = 0;
    let totalProductComm = 0;
    let totalBusinessComm = 0;
    let totalCommissions = 0;
    let totalMonthlySalaryGross = 0;
    let totalDeductions = 0;
    let net = 0;
    let paid = 0;
    let outstanding = 0;
    let staffWithCommissions = 0;
    let staffWithTips = 0;

    filteredPayrolls.forEach((p) => {
      const emp = employees.find((e) => e.employeeId === p.employeeId);
      const basic = Number(p.basicSalary) || Number(emp?.basicSalary) || 0;
      const allw = Number(p.allowances) || 0;
      const tips = Number(p.tips) || Number(emp?.tips) || 0;
      const sComm = Number(p.commissionBreakdown?.service) || 0;
      const pComm = Number(p.commissionBreakdown?.product) || 0;
      const bComm = Number(p.commissionBreakdown?.business) || 0;
      const comm = Number(p.commissions) || (sComm + pComm + bComm);
      const gross = p.totalMonthlySalary || (basic + allw + tips + comm);
      const ded = Number(p.deductions) || 0;
      const remaining = Number(p.netSalary) - Number(p.paidAmount);

      totalBasic += basic;
      totalAllowances += allw;
      totalTips += tips;
      totalServicesComm += sComm;
      totalProductComm += pComm;
      totalBusinessComm += bComm;
      totalCommissions += comm;
      totalMonthlySalaryGross += gross;
      totalDeductions += ded;
      net += Number(p.netSalary) || 0;
      paid += Number(p.paidAmount) || 0;
      if (remaining > 0) outstanding += remaining;
      if (comm > 0) staffWithCommissions++;
      if (tips > 0) staffWithTips++;
    });

    return {
      totalCount: filteredPayrolls.length,
      totalBasic,
      totalAllowances,
      totalBaseSalary: totalBasic + totalAllowances,
      totalTips,
      totalServicesComm,
      totalProductComm,
      totalBusinessComm,
      totalCommissions,
      totalMonthlySalaryGross,
      totalDeductions,
      net,
      paid,
      outstanding,
      staffWithCommissions,
      staffWithTips,
    };
  }, [filteredPayrolls, employees]);

  // Checkbox toggle
  const toggleSelectAll = () => {
    if (filteredPayrolls.length > 0 && selectedIds.length === filteredPayrolls.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPayrolls.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Generate / Recalculate Monthly Payroll (10-Component Formula)
  const handleGeneratePayroll = () => {
    const activeEmps = employees.filter((e) => e.status !== 'Unemployed');
    if (activeEmps.length === 0) {
      showToast('No active employees found to generate payroll for.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Generate ${selectedMonth} ${selectedYear} Payroll`,
      message: `Generate and calculate monthly salary & wages for all ${activeEmps.length} active staff for ${selectedMonth} ${selectedYear}?\n\n• Computes all 10 components: Basic, Food, Transport, Car Op, Other, Limited Transport, Tips, Services Commission, Product Commission, and Business Commission.\n• Existing finalized records (Approved / Paid) are strictly preserved from silent overwrite.\n• Auto-calculates WPS & Cash salaries to Business Expenses.`,
      confirmText: 'Generate Payroll',
      isDestructive: false,
      action: async () => {
        let created = 0;
        let updated = 0;
        let preserved = 0;

        const monthIndex = MONTHS.indexOf(selectedMonth);
        const monthNum = String(monthIndex + 1).padStart(2, '0');
        const periodKey = `${selectedYear}-${monthNum}`;
        const monthlySummary = db.getMonthlyCommissions(periodKey);
        const aggMap = new Map(monthlySummary.employeeAggregates.map((a) => [a.employeeId, a]));

        for (const emp of activeEmps) {
          const payrollId = `PAY-${emp.employeeId}-${selectedYear}-${selectedMonth}`;
          const existing = payrolls.find((p) => p.id === payrollId);

          // Requirement 6: Once payroll is finalized, require explicit authorization; do NOT silently overwrite
          if (existing && (existing.status === 'Paid' || existing.status === 'Approved')) {
            preserved++;
            continue;
          }

          const basic = Number(emp.basicSalary) || 0;
          const food = Number(emp.foodAllowance) || 0;
          const transport = Number(emp.transportAllowance) || 0;
          const carOp = Number(emp.carOperationAllowance) || 0;
          const other = Number(emp.otherAllowance) || 0;
          const limitedTransport = Number(emp.limitedTransport) || 0;
          const totalAllowances = food + transport + carOp + other + limitedTransport;
          const tips = Number(emp.tips) || 0;

          const agg = aggMap.get(emp.employeeId);
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
                businessAchievement: agg.businessTargetAmount > 0 ? (agg.businessGrossSales / agg.businessTargetAmount) * 100 : 0,
                businessEligible: agg.businessEligible,
                businessSelectedByCompany: agg.businessSelectedByCompany,
                businessCommBase: emp.businessCommBase || settings.businessCommBase || 'all_gross',
              }
            : calculateEmployeeCommissions(emp, settings);

          // Requirement 5: Complete 10-Component Monthly Salary & Wages Formula
          const totalMonthlySalary = basic + totalAllowances + tips + comms.total;
          const deductions = Number(emp.deductionCurrent) || 0;
          // Net Payable = Total Monthly Salary & Wages - Deductions
          const netSalary = Math.max(0, totalMonthlySalary - deductions);

          const record: PayrollRecord = {
            id: payrollId,
            employeeId: emp.employeeId,
            month: selectedMonth,
            year: selectedYear,
            basicSalary: basic,
            foodAllowance: food,
            transportAllowance: transport,
            carOperationAllowance: carOp,
            otherAllowance: other,
            limitedTransport: limitedTransport,
            allowances: totalAllowances,
            tips,
            commissions: comms.total,
            totalMonthlySalary,
            deductions,
            netSalary,
            paidAmount: 0,
            status: 'Draft',
            paymentDate: '',
            notes: `Calculated automatically for ${selectedMonth} ${selectedYear} using 10-component formula with Daily Sales totals`,
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

          await db.savePayrollRecord(record);
          if (existing) {
            updated++;
          } else {
            created++;
          }
        }

        // Auto-calculate & sync to Business Expenses (Salaries & wages by WPS and CASH)
        const syncRes = await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);

        await db.logAudit(
          'PAYROLL_GENERATED',
          `Generated payroll for ${selectedMonth} ${selectedYear} (${created} new, ${updated} updated, ${preserved} finalized preserved). Auto-synced to Business Expenses: WPS QAR ${syncRes.wpsTotal}, Cash QAR ${syncRes.cashTotal}`
        );
        showToast(
          `✅ Generated ${selectedMonth} ${selectedYear} Payroll (${created} new, ${updated} updated, ${preserved} finalized protected). Synced to Business Expenses: WPS QAR ${formatCurrency(syncRes.wpsTotal)} & Cash QAR ${formatCurrency(syncRes.cashTotal)}.`
        );
        onRefresh();
      },
    });
  };

  // Batch: Mark as Paid
  const handleBatchMarkPaid = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one payroll record.');
      return;
    }
    setBatchPayModalOpen(true);
  };

  // Batch: Mark as Approved
  const handleBatchMarkApproved = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one payroll record.');
      return;
    }

    for (const id of selectedIds) {
      const p = payrolls.find((item) => item.id === id);
      if (p) {
        await db.savePayrollRecord({
          ...p,
          status: 'Approved',
        });
      }
    }

    await db.logAudit('PAYROLL_BATCH_APPROVED', `Approved ${selectedIds.length} payroll records`);
    const count = selectedIds.length;
    setSelectedIds([]);
    showToast(`Approved ${count} payroll record(s).`);
    onRefresh();
  };

  // Batch: Delete Selected
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one payroll record.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedIds.length} Payroll Records`,
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected payroll record(s)?\n\nThis will remove them from monthly payroll sheets and re-sync the Business Expenses auto-calculations. This action cannot be undone.`,
      confirmText: 'Delete Records',
      isDestructive: true,
      action: async () => {
        for (const id of selectedIds) {
          await db.deletePayrollRecord(id);
        }
        await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);
        await db.logAudit('PAYROLL_BATCH_DELETED', `Deleted ${selectedIds.length} payroll records`);
        const count = selectedIds.length;
        setSelectedIds([]);
        showToast(`Deleted ${count} payroll record(s) and re-calculated Business Expenses.`);
        onRefresh();
      },
    });
  };

  // Single Row Delete
  const handleDeleteSingle = (payroll: PayrollRecord) => {
    const emp = employees.find((e) => e.employeeId === payroll.employeeId);
    const empName = emp ? emp.employeeName : payroll.employeeId;

    setConfirmModal({
      isOpen: true,
      title: `Delete Payroll Record`,
      message: `Are you sure you want to permanently delete the payroll sheet for "${empName}" (${payroll.employeeId}) for ${payroll.month} ${payroll.year}?\n\nNet Amount: QAR ${formatCurrency(payroll.netSalary)}. This action cannot be undone.`,
      confirmText: 'Delete Record',
      isDestructive: true,
      action: async () => {
        await db.deletePayrollRecord(payroll.id);
        await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);
        setSelectedIds((prev) => prev.filter((id) => id !== payroll.id));
        showToast(`Deleted payroll sheet for ${empName} (${payroll.month} ${payroll.year}) and updated Business Expenses.`);
        onRefresh();
      },
    });
  };

  // Single Row: Toggle Paid / Unpaid
  const handleToggleSinglePaid = async (payroll: PayrollRecord) => {
    const isPaid = payroll.status === 'Paid';
    const updated: PayrollRecord = {
      ...payroll,
      status: isPaid ? 'Draft' : 'Paid',
      paidAmount: isPaid ? 0 : payroll.netSalary,
      paymentDate: isPaid ? '' : new Date().toISOString().slice(0, 10),
    };
    await db.savePayrollRecord(updated);
    showToast(`Updated ${payroll.employeeId} status to ${updated.status}.`);
    onRefresh();
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const recordsToExport = selectedIds.length > 0
        ? filteredPayrolls.filter((p) => selectedIds.includes(p.id))
        : filteredPayrolls;

      exportPayrollToExcel(recordsToExport, employees);
      showToast(`Exported ${recordsToExport.length} payroll records with all 10 salary components to Excel.`);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to export payroll to Excel.');
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Print Report
  const handlePrint = () => {
    printElement('monthly-payroll-table-section', `Monthly_Payroll_${selectedMonth}_${selectedYear}`);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('monthly-payroll-table-section', {
        filename: `Monthly_Payroll_${selectedMonth}_${selectedYear}.pdf`,
        orientation: 'l',
        format: 'a4',
        margin: 6,
      });
      showToast(`Exported ${selectedMonth} ${selectedYear} payroll sheet to PDF.`);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to export PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Monthly Payroll Processing &amp; Wages</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              10-Component Salary Formula: Basic + 5 Allowances + Tips + Services, Product &amp; Business Gross Commissions − Deductions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Manual Tips & Gratuity Editor Button */}
            <button
              type="button"
              onClick={() => setShowManualTipsModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Quickly add, edit, or batch-allocate staff tips manually for this month"
            >
              <Coins className="w-4 h-4 text-purple-600" />
              <span>💰 Manual Tips Editor</span>
            </button>

            {/* Monthly Targets & Commission Controls Button (Requirement 7) */}
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Configure monthly services targets, commission rates, business eligibility & tips"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>⚙️ Monthly Targets &amp; Commissions Controls</span>
            </button>

            {/* View Full Report Button (Requirement 6) */}
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              disabled={filteredPayrolls.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="View full monthly payroll transparency report"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Payroll Report</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredPayrolls.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Download Microsoft Excel payroll sheet with all 10 components"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {/* Save as PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredPayrolls.length === 0 || isExportingPdf}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Download PDF document of monthly payroll"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Download className="w-4 h-4 text-rose-600" />}
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Save as PDF'}</span>
            </button>

            {/* Print Summary */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredPayrolls.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Print payroll table"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Generate Payroll */}
            <button
              type="button"
              onClick={handleGeneratePayroll}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>⚡ Generate {selectedMonth} {selectedYear} Payroll</span>
            </button>
          </div>
        </div>

        {/* Filters and controls row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-24 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="pt-5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                const monthIndex = MONTHS.indexOf(selectedMonth);
                const monthNum = String(monthIndex + 1).padStart(2, '0');
                const periodKey = `${selectedYear}-${monthNum}`;
                await db.recalculateMonthlyTotals(periodKey);
                onRefresh();
                showToast(`Recalculated monthly totals for ${selectedMonth} ${selectedYear} from Daily Sales.`);
              }}
              className="text-xs text-purple-700 hover:text-purple-900 underline font-semibold flex items-center gap-1 cursor-pointer bg-purple-50/60 px-2.5 py-1.5 rounded-lg border border-purple-200"
              title="Recalculate monthly commission totals from source daily sales"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync from Daily Sales</span>
            </button>
          </div>

          <div className="flex-1" />

          {/* Top batch action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-0">
            {/* Quick Inline Edit Toggle */}
            <button
              type="button"
              onClick={() => {
                if (quickEditMode && Object.keys(quickRowEdits).length > 0) {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Exit Quick Edit Mode',
                    message: `You have unsaved changes in ${Object.keys(quickRowEdits).length} row(s). Would you like to save them before exiting?`,
                    confirmText: 'Save & Exit',
                    action: async () => {
                      await handleSaveAllQuickEdits();
                      setQuickEditMode(false);
                    },
                  });
                } else {
                  setQuickEditMode(!quickEditMode);
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                quickEditMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Toggle inline editing for salaries, allowances, tips, and sales directly in table cells"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{quickEditMode ? 'Exit Quick Edit' : '✏️ Quick Edit Mode'}</span>
            </button>

            {quickEditMode && Object.keys(quickRowEdits).length > 0 && (
              <button
                type="button"
                onClick={handleSaveAllQuickEdits}
                className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs animate-pulse cursor-pointer"
                title="Save all modified salary, allowance, tip, and commission components"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All ({Object.keys(quickRowEdits).length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleBatchMarkPaid}
              disabled={selectedIds.length === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark as Paid ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleBatchMarkApproved}
              disabled={selectedIds.length === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={selectedIds.length === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats KPI Strip - 7 Cards with Live 10-Component Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Staff Records
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span className="font-semibold text-amber-700">{stats.staffWithCommissions}</span> comms ·{' '}
            <span className="font-semibold text-purple-700">{stats.staffWithTips}</span> tips
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Fixed Base Salaries
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums mt-0.5">
            QAR {formatCurrency(stats.totalBaseSalary)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Basic + 5 Allowances
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
            Employee Tips
          </div>
          <div className="text-lg font-bold text-purple-800 tabular-nums mt-0.5">
            QAR {formatCurrency(stats.totalTips)}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">
            Separate transparent item
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Combined Comm.
          </div>
          <div className="text-lg font-bold text-amber-700 tabular-nums mt-0.5">
            QAR {formatCurrency(stats.totalCommissions)}
          </div>
          <div className="text-[10px] text-amber-600 mt-1">
            Svc + Prod + Biz Gross
          </div>
        </div>

        <div className="bg-amber-50/40 p-3.5 rounded-xl border-2 border-amber-300 shadow-xs">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Monthly Salary &amp; Wages</span>
            <span className="text-[8.5px] bg-amber-200 text-amber-900 px-1 rounded font-black">GROSS</span>
          </div>
          <div className="text-lg font-black text-amber-950 tabular-nums mt-0.5">
            QAR {formatCurrency(stats.totalMonthlySalaryGross)}
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">
            10-Component Sum
          </div>
        </div>

        <div className="bg-emerald-50/40 p-3.5 rounded-xl border-2 border-emerald-400 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Total Most Paid (Net)</span>
            <span className="text-[8.5px] bg-emerald-200 text-emerald-900 px-1 rounded font-black">PAYABLE</span>
          </div>
          <div className="text-lg font-black text-emerald-950 tabular-nums mt-0.5">
            QAR {formatCurrency(stats.net)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">
            Salary + Comm. − Deductions
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Outstanding Due
          </div>
          <div className={`text-lg font-bold tabular-nums mt-0.5 ${stats.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            QAR {formatCurrency(stats.outstanding)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Paid: QAR {formatCurrency(stats.paid)}
          </div>
        </div>
      </div>

      {/* Quick Edit Banner when active */}
      {quickEditMode && (
        <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-200 rounded-lg text-amber-900">
              <Pencil className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-sm">✏️ Quick Edit Mode Active</span>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                Edit Basic Salary, Allowances, Tips, Deductions, and Status directly in table cells. Values auto-recalculate live. Click <strong className="text-emerald-800">"Save All Changes"</strong> when finished, or click the blue <strong className="text-blue-800">Edit (Pencil)</strong> on any row for full 10-component modal editing.
              </p>
            </div>
          </div>
          {Object.keys(quickRowEdits).length > 0 && (
            <button
              type="button"
              onClick={handleSaveAllQuickEdits}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save All ({Object.keys(quickRowEdits).length}) Changes</span>
            </button>
          )}
        </div>
      )}

      {/* Payroll Table */}
      <div id="monthly-payroll-table-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[1550px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredPayrolls.length > 0 &&
                      selectedIds.length === filteredPayrolls.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    title="Select / Deselect all"
                  />
                </th>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3 text-right">1. Basic</th>
                <th className="py-2.5 px-3 text-right">2-6. Allowances</th>
                <th className="py-2.5 px-3 text-right text-purple-700 bg-purple-50/50">
                  7. Tips
                </th>
                <th className="py-2.5 px-3 text-right text-blue-700">
                  8. Services Comm.
                </th>
                <th className="py-2.5 px-3 text-right text-teal-700">
                  9. Product Comm.
                </th>
                <th className="py-2.5 px-3 text-right text-indigo-700">
                  10. Biz Gross Comm.
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/70">
                  Combined Comm.
                </th>
                <th className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-100/70 border-x border-amber-200">
                  Monthly Salary (Gross)
                </th>
                <th className="py-2.5 px-3 text-right text-rose-600">Deductions</th>
                <th className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-100/70 border-x border-emerald-200">
                  Total Most Paid (Net)
                </th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Paid Amount</th>
                <th className="py-2.5 px-3 text-right">Remaining</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayrolls.map((p) => {
                const emp = employees.find((e) => e.employeeId === p.employeeId);
                const isSelected = selectedIds.includes(p.id);

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
                const totalComms = sComm + pComm + bComm;

                const sTarget = Number(p.commissionBreakdown?.serviceTarget) || Number(emp?.saleTargetRate) || 0;
                const sActual = Number(p.commissionBreakdown?.serviceActual) || Number(emp?.totalSalesRate) || 0;
                const sEligible = p.commissionBreakdown?.serviceEligible ?? (sActual > 0 && sActual >= sTarget);

                const pSales = Number(p.commissionBreakdown?.productSales) || Number(emp?.prodTotalSales) || 0;
                const bEligible = p.commissionBreakdown?.businessEligible ?? false;
                const bSelected = p.commissionBreakdown?.businessSelectedByCompany ?? emp?.businessCommissionEligible ?? false;

                // Live Quick Edit Overrides
                const quick = quickRowEdits[p.id];
                const curBasic = quick?.basicSalary !== undefined ? quick.basicSalary : basic;
                const curAllowances = quick?.allowances !== undefined ? quick.allowances : allowances;
                const curDeductions = quick?.deductions !== undefined ? quick.deductions : (Number(p.deductions) || 0);
                const curStatus = quick?.status || p.status;
                const curGross = curBasic + curAllowances + (inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips) + totalComms;
                const curNet = Math.max(0, curGross - curDeductions);
                const remaining = curNet - Number(p.paidAmount);
                const isQuickEdited = Boolean(quick && Object.keys(quick).length > 0);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isSelected ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(p.id)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        title={`Select ${p.employeeId}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                      {p.employeeId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {emp ? emp.employeeName : 'Unknown'}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {emp?.position || 'Staff'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {quickEditMode ? (
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-400">QAR</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={curBasic}
                            onChange={(e) =>
                              setQuickRowEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], basicSalary: parseFloat(e.target.value) || 0 },
                              }))
                            }
                            className="w-20 text-right px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 shadow-2xs"
                            title="Edit Basic Salary"
                          />
                        </div>
                      ) : (
                        <>QAR {formatCurrency(curBasic)}</>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {quickEditMode ? (
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-400">QAR</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={curAllowances}
                            onChange={(e) =>
                              setQuickRowEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], allowances: parseFloat(e.target.value) || 0 },
                              }))
                            }
                            className="w-20 text-right px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 shadow-2xs"
                            title="Edit Total Allowances"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-slate-800">
                            QAR {formatCurrency(curAllowances)}
                          </div>
                          <div className="text-[9.5px] text-slate-400 font-sans" title="Food, Transport, Car Op, Other, Limited Transport">
                            Food {formatCurrency(food)} · Tr {formatCurrency(transport)}
                          </div>
                        </>
                      )}
                    </td>
                    <td
                      className="py-2.5 px-3 text-right tabular-nums bg-purple-50/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] font-bold text-purple-700">QAR</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setInlineTips((prev) => ({ ...prev, [p.id]: isNaN(val) ? 0 : val }));
                          }}
                          onBlur={() =>
                            handleSaveInlineTips(
                              p,
                              inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveInlineTips(
                                p,
                                inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips
                              );
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-20 text-right px-1.5 py-1 text-xs font-bold font-mono text-purple-900 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-2xs"
                          title="Click to edit employee tips manually (Press Enter to save)"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips;
                            const nextVal = currentVal + 50;
                            setInlineTips((prev) => ({ ...prev, [p.id]: nextVal }));
                            handleSaveInlineTips(p, nextVal);
                          }}
                          className="text-[9px] px-1 py-0.2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-semibold transition-colors cursor-pointer"
                          title="Quick add +QAR 50 tips"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = inlineTips[p.id] !== undefined ? inlineTips[p.id] : tips;
                            const nextVal = currentVal + 100;
                            setInlineTips((prev) => ({ ...prev, [p.id]: nextVal }));
                            handleSaveInlineTips(p, nextVal);
                          }}
                          className="text-[9px] px-1 py-0.2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-semibold transition-colors cursor-pointer"
                          title="Quick add +QAR 100 tips"
                        >
                          +100
                        </button>
                        {tips > 0 && (
                          <span className="text-[9px] text-purple-600 font-medium ml-0.5">✓</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${sComm > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(sComm)}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-sans">
                        {sEligible ? 'Target Met ✓' : `Target QAR ${formatCurrency(sTarget)}`}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${pComm > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(pComm)}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-sans">
                        Sales: QAR {formatCurrency(pSales)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${bComm > 0 ? 'text-indigo-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(bComm)}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-sans">
                        {bSelected ? (bEligible ? 'Target Met ✓' : 'Below Target') : 'Not Selected'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums bg-amber-50/40">
                      <div className={`font-bold ${totalComms > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                        QAR {formatCurrency(totalComms)}
                      </div>
                      {totalComms > 0 && (
                        <div className="text-[9.5px] text-amber-700 font-medium">S+P+B Comm.</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums bg-amber-50/60 border-x border-amber-200">
                      <div className="font-black text-amber-950 flex items-center justify-end gap-1">
                        {isQuickEdited && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Live edited" />}
                        <span>QAR {formatCurrency(curGross)}</span>
                      </div>
                      <div className="text-[9.5px] text-amber-800 font-medium">
                        10 Components Gross
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-medium text-rose-600">
                      {quickEditMode ? (
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-rose-500 font-bold">−</span>
                          <input
                            type="number"
                            min="0"
                            step="25"
                            value={curDeductions}
                            onChange={(e) =>
                              setQuickRowEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], deductions: parseFloat(e.target.value) || 0 },
                              }))
                            }
                            className="w-16 text-right px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 shadow-2xs text-rose-700"
                            title="Edit Deductions"
                          />
                        </div>
                      ) : (
                        <>QAR {formatCurrency(curDeductions)}</>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-black text-emerald-950 bg-emerald-50/60 border-x border-emerald-200">
                      <div className="text-sm font-black flex items-center justify-end gap-1">
                        {isQuickEdited && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live edited" />}
                        <span>QAR {formatCurrency(curNet)}</span>
                      </div>
                      <div className="text-[9.5px] text-emerald-700 font-medium">
                        ✓ Net Disbursed
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-600">
                      QAR {formatCurrency(p.paidAmount)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        remaining > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      QAR {formatCurrency(remaining)}
                    </td>
                    <td className="py-2.5 px-3">
                      {quickEditMode ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <select
                            value={curStatus}
                            onChange={(e) =>
                              setQuickRowEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], status: e.target.value as PayrollRecord['status'] },
                              }))
                            }
                            className="text-[10px] font-bold py-1 px-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                            title="Change Status"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Approved">Approved</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'Approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : p.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditPayrollRecord(p)}
                          className="p-1.5 text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 rounded transition-colors cursor-pointer"
                          title="Edit 10-Component Remuneration, Targets, Tips & Deductions"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBreakdownRecord(p)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="View 10-Component Salary Breakdown & Formulas"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (p.status !== 'Paid') {
                              setPayTransferRecord(p);
                            } else {
                              handleToggleSinglePaid(p);
                            }
                          }}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                            p.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                          }`}
                          title={p.status === 'Paid' ? 'Click to revert to Unpaid/Draft' : 'Transfer to Pay: Review 10-component remuneration & pay net salary'}
                        >
                          {p.status === 'Paid' ? '✓ Paid' : 'Pay (Transfer)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEmployee(p.employeeId)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          title="View Employee Profile"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(p)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete payroll record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Complete Table Footer with Column Totals */}
            {filteredPayrolls.length > 0 && (
              <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 font-mono text-[11px]">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans text-slate-700 font-bold">
                    Total ({filteredPayrolls.length} Records)
                  </td>
                  <td className="py-3 px-3 text-right">
                    QAR {formatCurrency(stats.totalBasic)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    QAR {formatCurrency(stats.totalAllowances)}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-800 bg-purple-100/60 font-bold">
                    QAR {formatCurrency(stats.totalTips)}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-800">
                    QAR {formatCurrency(stats.totalServicesComm)}
                  </td>
                  <td className="py-3 px-3 text-right text-teal-800">
                    QAR {formatCurrency(stats.totalProductComm)}
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-800">
                    QAR {formatCurrency(stats.totalBusinessComm)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-900 font-bold bg-amber-100/50">
                    QAR {formatCurrency(stats.totalCommissions)}
                  </td>
                  <td className="py-3 px-3 text-right bg-amber-200/70 text-amber-950 font-black border-x border-amber-300">
                    QAR {formatCurrency(stats.totalMonthlySalaryGross)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600 font-bold">
                    QAR {formatCurrency(stats.totalDeductions)}
                  </td>
                  <td className="py-3 px-3 text-right bg-emerald-100/90 font-black text-emerald-950 border-x border-emerald-300 text-sm">
                    QAR {formatCurrency(stats.net)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700">
                    QAR {formatCurrency(stats.paid)}
                  </td>
                  <td className={`py-3 px-3 text-right font-black ${stats.outstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    QAR {formatCurrency(stats.outstanding)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>

          {filteredPayrolls.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">
                No payroll records found for {selectedMonth} {selectedYear}.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "⚡ Generate {selectedMonth} {selectedYear} Payroll" above to automatically calculate and transfer wages for all active staff.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Bottom Action Toolbar & Summary Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Selection:</span>
            <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-slate-100 text-slate-800">
              {selectedIds.length} / {filteredPayrolls.length} selected
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
          >
            {selectedIds.length === filteredPayrolls.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* All Bottom Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredPayrolls.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download payroll sheet as Microsoft Excel file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={filteredPayrolls.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print payroll table"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Table</span>
          </button>

          {/* Mark as Approved */}
          <button
            type="button"
            onClick={handleBatchMarkApproved}
            disabled={selectedIds.length === 0}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Approve selected payroll records"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve ({selectedIds.length})</span>
          </button>

          {/* Mark as Paid */}
          <button
            type="button"
            onClick={handleBatchMarkPaid}
            disabled={selectedIds.length === 0}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Mark selected payroll records as paid in full"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark as Paid ({selectedIds.length})</span>
          </button>

          {/* Delete Selected */}
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={selectedIds.length === 0}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Delete selected payroll records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTHLY COMMISSION, TARGETS & TIPS CONFIGURATION MODAL (Requirement 7) */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <MonthlyConfigModal
          month={selectedMonth}
          year={selectedYear}
          employees={employees}
          settings={settings}
          onClose={() => setShowConfigModal(false)}
          onSaved={() => {
            setShowConfigModal(false);
            onRefresh();
            showToast(`✅ Saved monthly commission settings, targets & tips and updated payroll!`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. ITEMIZED 10-COMPONENT SALARY BREAKDOWN MODAL (Requirement 5 & 6)       */}
      {/* ========================================================================= */}
      {breakdownRecord && (
        <SalaryBreakdownModal
          record={breakdownRecord}
          employee={employees.find((e) => e.employeeId === breakdownRecord.employeeId)}
          onClose={() => setBreakdownRecord(null)}
          onTogglePaid={() => {
            handleToggleSinglePaid(breakdownRecord);
            setBreakdownRecord(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2B. EDIT 10-COMPONENT REMUNERATION MODAL (All 10 Components Editable)     */}
      {/* ========================================================================= */}
      {editPayrollRecord && (
        <EditPayrollModal
          record={editPayrollRecord}
          employee={employees.find((e) => e.employeeId === editPayrollRecord.employeeId)}
          settings={settings}
          onClose={() => setEditPayrollRecord(null)}
          onSave={handleSaveEditRecord}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY PAYROLL TRANSPARENCY REPORT MODAL (Requirement 6 & 8)         */}
      {/* ========================================================================= */}
      {showReportModal && (
        <PayrollReportModal
          month={selectedMonth}
          year={selectedYear}
          payrolls={filteredPayrolls}
          employees={employees}
          stats={stats}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. MANUAL TIPS & GRATUITY MANAGEMENT MODAL                                */}
      {/* ========================================================================= */}
      {showManualTipsModal && (
        <ManualTipsModal
          month={selectedMonth}
          year={selectedYear}
          employees={employees}
          payrolls={filteredPayrolls}
          onClose={() => setShowManualTipsModal(false)}
          onSaved={() => {
            setShowManualTipsModal(false);
            onRefresh();
            showToast(`✅ Saved manual tips and recalculated monthly payroll & wages!`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. SINGLE TRANSFER TO PAY MODAL (All 10 Components Remuneration)          */}
      {/* ========================================================================= */}
      {payTransferRecord && (
        <SinglePayTransferModal
          record={payTransferRecord}
          employee={employees.find((e) => e.employeeId === payTransferRecord.employeeId)}
          onClose={() => setPayTransferRecord(null)}
          onPaid={async () => {
            const emp = employees.find((e) => e.employeeId === payTransferRecord.employeeId);
            await db.savePayrollRecord({
              ...payTransferRecord,
              status: 'Paid',
              paidAmount: payTransferRecord.netSalary,
              paymentDate: new Date().toISOString().slice(0, 10),
            });
            await db.syncPayrollToBusinessExpenses(payTransferRecord.month, payTransferRecord.year);
            await db.logAudit(
              'PAYROLL_PAID',
              `Transferred payment for ${emp?.employeeName || payTransferRecord.employeeId} - QAR ${payTransferRecord.netSalary}`
            );
            showToast(
              `✅ Successfully transferred payment of QAR ${formatCurrency(payTransferRecord.netSalary)} to ${emp?.employeeName || payTransferRecord.employeeId}!`
            );
            setPayTransferRecord(null);
            onRefresh();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. BATCH TRANSFER TO PAY MODAL (All 10 Components Remuneration)           */}
      {/* ========================================================================= */}
      {batchPayModalOpen && (
        <BatchPayTransferModal
          selectedRecords={filteredPayrolls.filter((p) => selectedIds.includes(p.id))}
          employees={employees}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setBatchPayModalOpen(false)}
          onPaid={async () => {
            const recordsToPay = filteredPayrolls.filter((p) => selectedIds.includes(p.id));
            let totalDisbursed = 0;
            for (const p of recordsToPay) {
              await db.savePayrollRecord({
                ...p,
                status: 'Paid',
                paidAmount: p.netSalary,
                paymentDate: new Date().toISOString().slice(0, 10),
              });
              totalDisbursed += Number(p.netSalary) || 0;
            }
            await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);
            await db.logAudit(
              'PAYROLL_BATCH_PAID',
              `Batch paid ${recordsToPay.length} records totaling QAR ${totalDisbursed}`
            );
            showToast(
              `✅ Successfully transferred payments for ${recordsToPay.length} staff totaling QAR ${formatCurrency(totalDisbursed)}!`
            );
            setBatchPayModalOpen(false);
            setSelectedIds([]);
            onRefresh();
          }}
        />
      )}

      {/* In-App Confirmation Modal (Replaces blocked window.confirm) */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText || 'Confirm'}
          cancelText="Cancel"
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// MODAL 1: Monthly Commission, Targets & Tips Configuration Modal
// ============================================================================
interface MonthlyConfigModalProps {
  month: string;
  year: string;
  employees: Employee[];
  settings: SystemSettings;
  onClose: () => void;
  onSaved: () => void;
}

const MonthlyConfigModal: React.FC<MonthlyConfigModalProps> = ({
  month,
  year,
  employees,
  settings,
  onClose,
  onSaved,
}) => {
  const activeEmps = employees.filter((e) => e.status !== 'Unemployed');

  // Load monthly sales summary for live figures
  const monthIndex = MONTHS.indexOf(month);
  const monthNum = String(monthIndex + 1).padStart(2, '0');
  const periodKey = `${year}-${monthNum}`;
  const monthlySummary = db.getMonthlyCommissions(periodKey);
  const aggMap = new Map(monthlySummary.employeeAggregates.map((a) => [a.employeeId, a]));

  // Local state for all editable targets, rates, business eligibility, and tips
  const [businessTargetAmount, setBusinessTargetAmount] = useState<number>(
    settings.businessTarget || 200000
  );
  const [businessCommRate, setBusinessCommRate] = useState<number>(
    settings.businessCommRate || 5
  );

  const [rowState, setRowState] = useState<
    Record<
      string,
      {
        serviceTarget: number;
        serviceRate: number;
        productRate: number;
        productTarget: number;
        businessEligible: boolean;
        tips: number;
      }
    >
  >(() => {
    const init: Record<
      string,
      {
        serviceTarget: number;
        serviceRate: number;
        productRate: number;
        productTarget: number;
        businessEligible: boolean;
        tips: number;
      }
    > = {};

    activeEmps.forEach((emp) => {
      init[emp.employeeId] = {
        serviceTarget: Number(emp.saleTargetRate) || 0,
        serviceRate: emp.saleCommissionRate !== undefined ? Number(emp.saleCommissionRate) : (settings.salesCommRate ?? 10),
        productRate: emp.prodSaleCommission !== undefined ? Number(emp.prodSaleCommission) : (settings.productCommRate ?? 5),
        productTarget: Number(emp.prodSaleTarget) || 0,
        businessEligible: Boolean(emp.businessCommissionEligible),
        tips: Number(emp.tips) || 0,
      };
    });

    return init;
  });

  const handleFieldChange = (
    empId: string,
    field: 'serviceTarget' | 'serviceRate' | 'productRate' | 'productTarget' | 'businessEligible' | 'tips',
    val: number | boolean
  ) => {
    setRowState((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: val,
      },
    }));
  };

  const handleSaveAndTransfer = async () => {
    // 1. Save all updated targets, rates, eligibility, and tips to employees
    for (const emp of activeEmps) {
      const cfg = rowState[emp.employeeId];
      if (!cfg) continue;

      const updatedEmp: Employee = {
        ...emp,
        saleTargetRate: cfg.serviceTarget,
        saleCommissionRate: cfg.serviceRate,
        prodSaleCommission: cfg.productRate,
        prodSaleTarget: cfg.productTarget,
        businessCommissionEligible: cfg.businessEligible,
        businessTargetAmount: businessTargetAmount,
        businessTargetRate: businessCommRate,
        tips: cfg.tips,
      };

      await db.saveEmployee(updatedEmp);
    }

    // 2. Also update global settings if changed
    if (
      businessTargetAmount !== settings.businessTarget ||
      businessCommRate !== settings.businessCommRate
    ) {
      await db.saveSettings({
        ...settings,
        businessTarget: businessTargetAmount,
        businessCommRate: businessCommRate,
      });
    }

    // 3. Recalculate monthly totals from Daily Sales with the new targets/rates
    await db.recalculateMonthlyTotals(periodKey);

    // 4. Update monthly payroll records for this month
    const refreshedSummary = db.getMonthlyCommissions(periodKey);
    const refreshedAggMap = new Map(refreshedSummary.employeeAggregates.map((a) => [a.employeeId, a]));

    for (const emp of activeEmps) {
      const payrollId = `PAY-${emp.employeeId}-${year}-${month}`;
      const existing = db.getPayrolls().find((p: PayrollRecord) => p.id === payrollId);

      // Protect finalized records from silent alteration
      if (existing && (existing.status === 'Approved' || existing.status === 'Paid')) {
        continue;
      }

      const cfg = rowState[emp.employeeId];
      const agg = refreshedAggMap.get(emp.employeeId);

      const basic = Number(emp.basicSalary) || 0;
      const allowances =
        (Number(emp.foodAllowance) || 0) +
        (Number(emp.transportAllowance) || 0) +
        (Number(emp.carOperationAllowance) || 0) +
        (Number(emp.otherAllowance) || 0) +
        (Number(emp.limitedTransport) || 0);

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
            businessAchievement: agg.businessTargetAmount > 0 ? (agg.businessGrossSales / agg.businessTargetAmount) * 100 : 0,
            businessEligible: agg.businessEligible,
            businessSelectedByCompany: agg.businessSelectedByCompany,
            businessCommBase: emp.businessCommBase || settings.businessCommBase || 'all_gross',
          }
        : calculateEmployeeCommissions(emp, settings);

      const tips = cfg ? cfg.tips : (Number(emp.tips) || 0);
      const deductions = Number(emp.deductionCurrent) || 0;

      // 10-Component Formula
      const totalMonthlySalary = basic + allowances + tips + comms.total;
      const netSalary = Math.max(0, totalMonthlySalary - deductions);

      const newRecord: PayrollRecord = {
        id: payrollId,
        employeeId: emp.employeeId,
        month,
        year,
        basicSalary: basic,
        foodAllowance: Number(emp.foodAllowance) || 0,
        transportAllowance: Number(emp.transportAllowance) || 0,
        carOperationAllowance: Number(emp.carOperationAllowance) || 0,
        otherAllowance: Number(emp.otherAllowance) || 0,
        limitedTransport: Number(emp.limitedTransport) || 0,
        allowances,
        tips,
        commissions: comms.total,
        totalMonthlySalary,
        deductions,
        netSalary,
        paidAmount: existing ? existing.paidAmount : 0,
        status: existing ? existing.status : 'Draft',
        paymentDate: existing ? existing.paymentDate : '',
        notes: `Transferred from Monthly Targets & Commissions Controls on ${new Date().toISOString().slice(0, 10)}`,
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
          businessSelectedByCompany: cfg ? cfg.businessEligible : false,
          businessCommBase: comms.businessCommBase,
        },
      };

      await db.savePayrollRecord(newRecord);
    }

    // Auto-sync to Business Expenses
    await db.syncPayrollToBusinessExpenses(month, year);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <Settings className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Monthly Targets, Commissions &amp; Tips Controls — {month} {year}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configure employee sales targets, commission rates, business gross eligibility checkboxes, and employee tips. Auto-calculates net dues in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Business Gross Target Setting */}
        <div className="bg-purple-50/70 p-4 border-b border-purple-200/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-700" />
            <div>
              <div className="text-xs font-bold text-purple-950">
                Company Monthly Business Gross Target
              </div>
              <div className="text-[11px] text-purple-800">
                Recorded Month Gross: <strong>QAR {formatCurrency(monthlySummary.totalBusinessGross)}</strong> · Only checked employees receive this commission if met.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-purple-900 uppercase">
                Business Target (QAR)
              </label>
              <input
                type="number"
                step="1000"
                value={businessTargetAmount}
                onChange={(e) => setBusinessTargetAmount(parseFloat(e.target.value) || 0)}
                className="w-32 text-xs p-1.5 bg-white border border-purple-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-purple-900 uppercase">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={businessCommRate}
                onChange={(e) => setBusinessCommRate(parseFloat(e.target.value) || 0)}
                className="w-20 text-xs p-1.5 bg-white border border-purple-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Editable Table */}
        <div className="overflow-auto flex-1 p-4 custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 text-[10.5px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3 text-right">Service Target (QAR)</th>
                <th className="py-2.5 px-3 text-right">Service Rate (%)</th>
                <th className="py-2.5 px-3 text-right text-blue-700">Service Comm Due</th>
                <th className="py-2.5 px-3 text-right">Product Rate (%)</th>
                <th className="py-2.5 px-3 text-right text-teal-700">Product Comm Due</th>
                <th className="py-2.5 px-3 text-center text-indigo-700">Eligible for Biz Comm?</th>
                <th className="py-2.5 px-3 text-right text-indigo-700">Biz Comm Due</th>
                <th className="py-2.5 px-3 text-right text-purple-700">Tips (QAR)</th>
                <th className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-50">
                  Total Monthly Salary (Gross)
                </th>
                <th className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-50">
                  Net Payable
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeEmps.map((emp) => {
                const cfg = rowState[emp.employeeId] || {
                  serviceTarget: 0,
                  serviceRate: 10,
                  productRate: 5,
                  productTarget: 0,
                  businessEligible: false,
                  tips: 0,
                };

                const agg = aggMap.get(emp.employeeId);
                const actualServicesSales = agg ? agg.actualEligibleSales : (Number(emp.totalSalesRate) || 0);
                const actualProductSales = agg ? agg.eligibleProductSales : (Number(emp.prodTotalSales) || 0);
                const bizGross = monthlySummary.totalBusinessGross;

                // Live Stream 1: Service Commission (Formula: Sales >= Target ? Sales * Rate : 0)
                const sEligible = actualServicesSales > 0 && actualServicesSales >= cfg.serviceTarget;
                const liveServiceComm = sEligible ? actualServicesSales * (cfg.serviceRate / 100) : 0;

                // Live Stream 2: Product Commission (Formula: Product Sales * Rate)
                const liveProductComm = actualProductSales > 0 ? actualProductSales * (cfg.productRate / 100) : 0;

                // Live Stream 3: Business Gross Commission (Formula: If Selected & Gross >= Target ? Gross * Rate : 0)
                const bEligible = cfg.businessEligible && bizGross >= businessTargetAmount && businessTargetAmount > 0;
                const liveBusinessComm = bEligible ? bizGross * (businessCommRate / 100) : 0;

                const liveTotalComms = liveServiceComm + liveProductComm + liveBusinessComm;
                const basic = Number(emp.basicSalary) || 0;
                const allowances =
                  (Number(emp.foodAllowance) || 0) +
                  (Number(emp.transportAllowance) || 0) +
                  (Number(emp.carOperationAllowance) || 0) +
                  (Number(emp.otherAllowance) || 0) +
                  (Number(emp.limitedTransport) || 0);
                const tips = cfg.tips;
                const deductions = Number(emp.deductionCurrent) || 0;

                // 10-Component Formula
                const liveGross = basic + allowances + tips + liveTotalComms;
                const liveNet = Math.max(0, liveGross - deductions);

                return (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{emp.employeeName}</div>
                      <div className="text-[10.5px] font-mono text-slate-400">
                        {emp.employeeId} · {emp.position}
                      </div>
                    </td>

                    {/* 1. Services Sales Target */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="100"
                        value={cfg.serviceTarget}
                        onChange={(e) =>
                          handleFieldChange(emp.employeeId, 'serviceTarget', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 text-xs p-1.5 text-right bg-white border border-slate-200 rounded font-mono font-bold"
                        title="Monthly Service Sales Target"
                      />
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Sales: QAR {formatCurrency(actualServicesSales)}
                      </div>
                    </td>

                    {/* 2. Services Comm Rate */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={cfg.serviceRate}
                        onChange={(e) =>
                          handleFieldChange(emp.employeeId, 'serviceRate', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 text-xs p-1.5 text-right bg-white border border-slate-200 rounded font-mono"
                      />
                      <span className="text-[10px] text-slate-400 ml-1">%</span>
                    </td>

                    {/* 3. Net Services Comm Due */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${liveServiceComm > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(liveServiceComm)}
                      </div>
                      <span className="text-[9.5px]">
                        {sEligible ? (
                          <span className="text-emerald-600 font-semibold">Target Met ✓</span>
                        ) : (
                          <span className="text-slate-400">Below Target</span>
                        )}
                      </span>
                    </td>

                    {/* 4. Product Comm Rate */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={cfg.productRate}
                        onChange={(e) =>
                          handleFieldChange(emp.employeeId, 'productRate', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 text-xs p-1.5 text-right bg-white border border-slate-200 rounded font-mono"
                      />
                      <span className="text-[10px] text-slate-400 ml-1">%</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Sales: QAR {formatCurrency(actualProductSales)}
                      </div>
                    </td>

                    {/* 5. Net Product Comm Due */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${liveProductComm > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(liveProductComm)}
                      </div>
                    </td>

                    {/* 6. Company Selection for Business Gross Commission (Checkbox) */}
                    <td className="py-2.5 px-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cfg.businessEligible}
                          onChange={(e) =>
                            handleFieldChange(emp.employeeId, 'businessEligible', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                        />
                        <span className="text-[10.5px] font-bold text-purple-900">
                          {cfg.businessEligible ? 'Selected ✓' : 'Excluded'}
                        </span>
                      </label>
                    </td>

                    {/* 7. Net Business Gross Comm Due */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <div className={`font-bold ${liveBusinessComm > 0 ? 'text-indigo-700' : 'text-slate-400'}`}>
                        QAR {formatCurrency(liveBusinessComm)}
                      </div>
                      <span className="text-[9.5px]">
                        {!cfg.businessEligible ? (
                          <span className="text-slate-400">Not Selected</span>
                        ) : bEligible ? (
                          <span className="text-emerald-600 font-semibold">Earned ✓</span>
                        ) : (
                          <span className="text-rose-500 font-semibold">Target Deficit</span>
                        )}
                      </span>
                    </td>

                    {/* 8. Employee Tips */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="10"
                        value={cfg.tips}
                        onChange={(e) =>
                          handleFieldChange(emp.employeeId, 'tips', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-xs p-1.5 text-right bg-white border border-purple-200 rounded font-mono font-bold text-purple-800"
                        title="Monthly Gratuity / Tips"
                      />
                    </td>

                    {/* 9. Total Monthly Salary (Gross) */}
                    <td className="py-2.5 px-3 text-right tabular-nums bg-amber-50/60 font-black text-amber-950">
                      QAR {formatCurrency(liveGross)}
                      <div className="text-[9.5px] text-slate-400 font-normal">
                        Fixed QAR {formatCurrency(basic + allowances)} + Tips QAR {formatCurrency(tips)} + Comm QAR {formatCurrency(liveTotalComms)}
                      </div>
                    </td>

                    {/* 10. Net Payable */}
                    <td className="py-2.5 px-3 text-right tabular-nums bg-emerald-50/60 font-black text-emerald-950">
                      QAR {formatCurrency(liveNet)}
                      <div className="text-[9.5px] text-slate-400 font-normal">
                        − QAR {formatCurrency(deductions)} ded.
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Clicking <strong>Save &amp; Transfer to Payroll</strong> saves targets, eligibility, and tips into the database and transfers all 10-component wages to the Monthly Payroll table.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndTransfer}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Transfer to Monthly Payroll</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 2: 10-Component Itemized Salary Breakdown Modal
// ============================================================================
interface SalaryBreakdownModalProps {
  record: PayrollRecord;
  employee?: Employee;
  onClose: () => void;
  onTogglePaid: () => void;
}

const SalaryBreakdownModal: React.FC<SalaryBreakdownModalProps> = ({
  record,
  employee,
  onClose,
  onTogglePaid,
}) => {
  const basic = Number(record.basicSalary) || Number(employee?.basicSalary) || 0;
  const food = Number(record.foodAllowance) || Number(employee?.foodAllowance) || 0;
  const transport = Number(record.transportAllowance) || Number(employee?.transportAllowance) || 0;
  const carOp = Number(record.carOperationAllowance) || Number(employee?.carOperationAllowance) || 0;
  const other = Number(record.otherAllowance) || Number(employee?.otherAllowance) || 0;
  const limitedTrans = Number(record.limitedTransport) || Number(employee?.limitedTransport) || 0;
  const allowances = food + transport + carOp + other + limitedTrans;

  const tips = Number(record.tips) || Number(employee?.tips) || 0;
  const sComm = Number(record.commissionBreakdown?.service) || 0;
  const pComm = Number(record.commissionBreakdown?.product) || 0;
  const bComm = Number(record.commissionBreakdown?.business) || 0;
  const totalCommissions = sComm + pComm + bComm;
  const totalGross = record.totalMonthlySalary || (basic + allowances + tips + totalCommissions);
  const deductions = Number(record.deductions) || 0;
  const netPayable = Number(record.netSalary) || 0;

  const sTarget = Number(record.commissionBreakdown?.serviceTarget) || Number(employee?.saleTargetRate) || 0;
  const sActual = Number(record.commissionBreakdown?.serviceActual) || Number(employee?.totalSalesRate) || 0;
  const sRate = Number(record.commissionBreakdown?.serviceRate) || Number(employee?.saleCommissionRate) || 10;
  const sEligible = record.commissionBreakdown?.serviceEligible ?? (sActual >= sTarget && sActual > 0);

  const pSales = Number(record.commissionBreakdown?.productSales) || Number(employee?.prodTotalSales) || 0;
  const pRate = Number(record.commissionBreakdown?.productRate) || Number(employee?.prodSaleCommission) || 5;

  const bTarget = Number(record.commissionBreakdown?.businessTarget) || Number(employee?.businessTargetAmount) || 200000;
  const bGross = Number(record.commissionBreakdown?.businessGross) || Number(employee?.businessGross) || 0;
  const bRate = Number(record.commissionBreakdown?.businessRate) || Number(employee?.businessTargetRate) || 5;
  const bSelected = record.commissionBreakdown?.businessSelectedByCompany ?? employee?.businessCommissionEligible ?? false;
  const bEligible = record.commissionBreakdown?.businessEligible ?? (bSelected && bGross >= bTarget);

  const handlePrintOrPdfPayslip = () => {
    const cleanName = (employee?.employeeName || record.employeeId).replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    window.printDocument(`payslip-paper-${record.id}`, `Payslip_${cleanName}_${record.month}_${record.year}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div id={`payslip-paper-${record.id}`} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto space-y-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Calculator className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold tracking-tight">
                10-Component Salary &amp; Wages Breakdown
              </h3>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-3">
              <span>Staff: <strong>{employee?.employeeName || record.employeeId}</strong></span>
              <span>·</span>
              <span>Month: <strong>{record.month} {record.year}</strong></span>
              <span>·</span>
              <span>Status: <strong className="text-emerald-400">{record.status}</strong></span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Component Table */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="text-xs text-slate-500">
            Official monthly remuneration formula itemizing all company targets, rates, earned commissions, gratuities, and allowances.
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Salary Component</th>
                  <th className="py-2.5 px-3">Calculation Formula / Details</th>
                  <th className="py-2.5 px-3 text-right">Amount (QAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-3 text-slate-400">1</td>
                  <td className="py-2 px-3 font-bold text-slate-900 font-sans">Basic Salary</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Fixed contractual basic remuneration</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    QAR {formatCurrency(basic)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">2</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 font-sans">Food Allowance</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Contractual monthly food allowance</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    QAR {formatCurrency(food)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">3</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 font-sans">Transportation Allowance</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Standard transportation support</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    QAR {formatCurrency(transport)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">4</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 font-sans">Car Operation Allowance</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Vehicle running / fuel allowance</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    QAR {formatCurrency(carOp)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">5</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 font-sans">Other Allowances</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Mobile, special duties or miscellaneous</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    QAR {formatCurrency(other)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">6</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 font-sans">Limited Transport Allowance</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Restricted zone transportation</td>
                  <td className="py-2 px-3 text-right text-slate-800">
                    QAR {formatCurrency(limitedTrans)}
                  </td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className="py-2 px-3 text-purple-500 font-bold">7</td>
                  <td className="py-2 px-3 font-bold text-purple-900 font-sans">Employee Tips (Gratuity)</td>
                  <td className="py-2 px-3 text-purple-700 font-sans">
                    Recorded separately for transparency &amp; full disbursement
                  </td>
                  <td className="py-2 px-3 text-right font-black text-purple-900">
                    QAR {formatCurrency(tips)}
                  </td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className="py-2 px-3 text-blue-500 font-bold">8</td>
                  <td className="py-2 px-3 font-bold text-blue-900 font-sans">Net Services Commission Due</td>
                  <td className="py-2 px-3 text-blue-800 font-sans">
                    {sEligible ? (
                      <span>
                        Target QAR {formatCurrency(sTarget)} Met! Actual QAR {formatCurrency(sActual)} × {sRate}%
                      </span>
                    ) : (
                      <span className="text-rose-600">
                        Sales QAR {formatCurrency(sActual)} below Target of QAR {formatCurrency(sTarget)} = QAR 0
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-blue-950">
                    QAR {formatCurrency(sComm)}
                  </td>
                </tr>
                <tr className="bg-teal-50/40">
                  <td className="py-2 px-3 text-teal-500 font-bold">9</td>
                  <td className="py-2 px-3 font-bold text-teal-900 font-sans">Net Product Commission Due</td>
                  <td className="py-2 px-3 text-teal-800 font-sans">
                    Product Sales QAR {formatCurrency(pSales)} × {pRate}% (independent of service target)
                  </td>
                  <td className="py-2 px-3 text-right font-black text-teal-950">
                    QAR {formatCurrency(pComm)}
                  </td>
                </tr>
                <tr className="bg-indigo-50/40">
                  <td className="py-2 px-3 text-indigo-500 font-bold">10</td>
                  <td className="py-2 px-3 font-bold text-indigo-900 font-sans">Net Business Gross Commission Due</td>
                  <td className="py-2 px-3 text-indigo-800 font-sans">
                    {!bSelected ? (
                      <span className="text-slate-500">Employee not selected by company for this commission = QAR 0</span>
                    ) : bEligible ? (
                      <span>Target QAR {formatCurrency(bTarget)} Met! Gross QAR {formatCurrency(bGross)} × {bRate}%</span>
                    ) : (
                      <span className="text-rose-600">Company Gross below Target of QAR {formatCurrency(bTarget)} = QAR 0</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-indigo-950">
                    QAR {formatCurrency(bComm)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-300 font-mono text-xs">
                <tr className="bg-amber-100/70 font-black text-amber-950">
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans text-sm">
                    Total Monthly Salary &amp; Wages (Gross 10-Component Sum)
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    QAR {formatCurrency(totalGross)}
                  </td>
                </tr>
                <tr className="bg-rose-50 font-bold text-rose-700">
                  <td colSpan={3} className="py-2 px-3 font-sans">
                    Less: Monthly Current Deductions
                  </td>
                  <td className="py-2 px-3 text-right">
                    − QAR {formatCurrency(deductions)}
                  </td>
                </tr>
                <tr className="bg-emerald-100 font-black text-emerald-950 text-base">
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans">
                    Total Most Paid (Net Payable to Staff)
                  </td>
                  <td className="py-3 px-3 text-right">
                    QAR {formatCurrency(netPayable)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrPdfPayslip}
              className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Save Payslip as PDF"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrintOrPdfPayslip}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Pay Slip (A4)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Official Letter (A4)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200 rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onTogglePaid}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                record.status === 'Paid'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {record.status === 'Paid' ? 'Mark as Unpaid (Draft)' : 'Mark as Paid in Full'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 3: Monthly Payroll & Wages Comprehensive Report Modal (Requirement 6)
// ============================================================================
interface PayrollReportModalProps {
  month: string;
  year: string;
  payrolls: PayrollRecord[];
  employees: Employee[];
  stats: ReturnType<typeof useMemo<{
    totalCount: number;
    totalBasic: number;
    totalAllowances: number;
    totalBaseSalary: number;
    totalTips: number;
    totalServicesComm: number;
    totalProductComm: number;
    totalBusinessComm: number;
    totalCommissions: number;
    totalMonthlySalaryGross: number;
    totalDeductions: number;
    net: number;
    paid: number;
    outstanding: number;
    staffWithCommissions: number;
    staffWithTips: number;
  }>>;
  onClose: () => void;
}

const PayrollReportModal: React.FC<PayrollReportModalProps> = ({
  month,
  year,
  payrolls,
  employees,
  stats,
  onClose,
}) => {
  const handlePrintOrPdf = () => {
    window.printDocument('printable-batch-payroll', `Payroll_Report_${month}_${year}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden my-auto">
        {/* Printable Area */}
        <div id="printable-batch-payroll" className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200">
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                Cosmos Beauty Salon — Doha, Qatar
              </div>
              <div className="text-sm font-bold text-slate-600 mt-0.5">
                Official Monthly Payroll &amp; Staff Wages Transparency Report
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Period: {month} {year} · Generated: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Active Staff</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.totalCount}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Fixed Base Salaries</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">QAR {formatCurrency(stats.totalBaseSalary)}</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-purple-700">Total Employee Tips</span>
              <div className="text-lg font-bold text-purple-900 mt-0.5">QAR {formatCurrency(stats.totalTips)}</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-700">Combined Commissions</span>
              <div className="text-lg font-bold text-amber-900 mt-0.5">QAR {formatCurrency(stats.totalCommissions)}</div>
            </div>
            <div className="p-3 bg-amber-100/60 border border-amber-300 rounded-xl">
              <span className="text-[10px] uppercase font-black text-amber-900">Total Gross Wages</span>
              <div className="text-lg font-black text-amber-950 mt-0.5">QAR {formatCurrency(stats.totalMonthlySalaryGross)}</div>
            </div>
            <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl">
              <span className="text-[10px] uppercase font-black text-emerald-900">Net Wages Disbursed</span>
              <div className="text-lg font-black text-emerald-950 mt-0.5">QAR {formatCurrency(stats.net)}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">QAR {formatCurrency(stats.paid)}</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-rose-700">Outstanding Remaining</span>
              <div className="text-lg font-bold text-rose-700 mt-0.5">QAR {formatCurrency(stats.outstanding)}</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Emp ID</th>
                  <th className="py-2 px-3">Staff Name</th>
                  <th className="py-2 px-3 text-right">Basic</th>
                  <th className="py-2 px-3 text-right">Allowances</th>
                  <th className="py-2 px-3 text-right text-purple-800">Tips</th>
                  <th className="py-2 px-3 text-right text-blue-800">Svc Comm</th>
                  <th className="py-2 px-3 text-right text-teal-800">Prod Comm</th>
                  <th className="py-2 px-3 text-right text-indigo-800">Biz Comm</th>
                  <th className="py-2 px-3 text-right font-black text-amber-950 bg-amber-50">Gross Wages</th>
                  <th className="py-2 px-3 text-right text-rose-600">Deductions</th>
                  <th className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-50">Net Payable</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {payrolls.map((p) => {
                  const emp = employees.find((e) => e.employeeId === p.employeeId);
                  const basic = Number(p.basicSalary) || Number(emp?.basicSalary) || 0;
                  const allw = Number(p.allowances) || 0;
                  const tips = Number(p.tips) || Number(emp?.tips) || 0;
                  const sComm = Number(p.commissionBreakdown?.service) || 0;
                  const pComm = Number(p.commissionBreakdown?.product) || 0;
                  const bComm = Number(p.commissionBreakdown?.business) || 0;
                  const gross = p.totalMonthlySalary || (basic + allw + tips + sComm + pComm + bComm);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold">{p.employeeId}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                        {emp?.employeeName || 'Unknown'}
                      </td>
                      <td className="py-2 px-3 text-right">QAR {formatCurrency(basic)}</td>
                      <td className="py-2 px-3 text-right">QAR {formatCurrency(allw)}</td>
                      <td className="py-2 px-3 text-right text-purple-700 font-bold">QAR {formatCurrency(tips)}</td>
                      <td className="py-2 px-3 text-right text-blue-700">QAR {formatCurrency(sComm)}</td>
                      <td className="py-2 px-3 text-right text-teal-700">QAR {formatCurrency(pComm)}</td>
                      <td className="py-2 px-3 text-right text-indigo-700">QAR {formatCurrency(bComm)}</td>
                      <td className="py-2 px-3 text-right font-black text-amber-950 bg-amber-50">
                        QAR {formatCurrency(gross)}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-600">
                        QAR {formatCurrency(p.deductions)}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-50">
                        QAR {formatCurrency(p.netSalary)}
                      </td>
                      <td className="py-2 px-3 font-sans font-semibold text-[10px]">
                        {p.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-mono text-xs font-black border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 uppercase font-sans">
                    Totals ({payrolls.length} Staff)
                  </td>
                  <td className="py-2.5 px-3 text-right">QAR {formatCurrency(stats.totalBasic)}</td>
                  <td className="py-2.5 px-3 text-right">QAR {formatCurrency(stats.totalAllowances)}</td>
                  <td className="py-2.5 px-3 text-right text-purple-900">QAR {formatCurrency(stats.totalTips)}</td>
                  <td className="py-2.5 px-3 text-right text-blue-900">QAR {formatCurrency(stats.totalServicesComm)}</td>
                  <td className="py-2.5 px-3 text-right text-teal-900">QAR {formatCurrency(stats.totalProductComm)}</td>
                  <td className="py-2.5 px-3 text-right text-indigo-900">QAR {formatCurrency(stats.totalBusinessComm)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-950 bg-amber-200/60">
                    QAR {formatCurrency(stats.totalMonthlySalaryGross)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600">QAR {formatCurrency(stats.totalDeductions)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-950 bg-emerald-200/70">
                    QAR {formatCurrency(stats.net)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Official monthly payroll verification and auditing report.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrPdf}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Save Payroll Report as PDF"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrintOrPdf}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Official Report (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Letter (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4: Manual Employee Tips & Gratuity Management Modal
// ============================================================================
interface ManualTipsModalProps {
  month: string;
  year: string;
  employees: Employee[];
  payrolls: PayrollRecord[];
  onClose: () => void;
  onSaved: () => void;
}

const ManualTipsModal: React.FC<ManualTipsModalProps> = ({
  month,
  year,
  employees,
  payrolls,
  onClose,
  onSaved,
}) => {
  const activeEmps = employees.filter((e) => e.status !== 'Unemployed');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Initial tip values from existing payroll record or employee record
  const [tipsState, setTipsState] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    activeEmps.forEach((emp) => {
      const pRecord = payrolls.find((p) => p.employeeId === emp.employeeId);
      const tipVal = pRecord?.tips !== undefined ? Number(pRecord.tips) : (Number(emp.tips) || 0);
      init[emp.employeeId] = tipVal;
    });
    return init;
  });

  const [batchBonusVal, setBatchBonusVal] = useState<number>(50);
  const [batchFlatVal, setBatchFlatVal] = useState<number>(100);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered employees
  const filteredList = activeEmps.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.employeeId.toLowerCase().includes(q) ||
      e.employeeName.toLowerCase().includes(q) ||
      (e.position && e.position.toLowerCase().includes(q))
    );
  });

  // Totals
  const totalTips = Object.values(tipsState).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const staffWithTips = Object.values(tipsState).filter((v) => (Number(v) || 0) > 0).length;

  const handleTipChange = (empId: string, val: number) => {
    setTipsState((prev) => ({
      ...prev,
      [empId]: Math.max(0, isNaN(val) ? 0 : val),
    }));
  };

  const handleQuickAdd = (empId: string, delta: number) => {
    setTipsState((prev) => ({
      ...prev,
      [empId]: Math.max(0, (Number(prev[empId]) || 0) + delta),
    }));
  };

  const handleApplyBatchBonus = () => {
    if (batchBonusVal <= 0) return;
    setTipsState((prev) => {
      const next = { ...prev };
      activeEmps.forEach((emp) => {
        next[emp.employeeId] = (Number(next[emp.employeeId]) || 0) + batchBonusVal;
      });
      return next;
    });
  };

  const handleApplyBatchFlat = () => {
    if (batchFlatVal < 0) return;
    setTipsState((prev) => {
      const next = { ...prev };
      activeEmps.forEach((emp) => {
        next[emp.employeeId] = batchFlatVal;
      });
      return next;
    });
  };

  const handleClearAllTips = () => {
    setTipsState((prev) => {
      const next = { ...prev };
      activeEmps.forEach((emp) => {
        next[emp.employeeId] = 0;
      });
      return next;
    });
  };

  const handleSaveAllTips = async () => {
    setIsSaving(true);
    try {
      const allPayrolls = db.getPayrolls();

      for (const emp of activeEmps) {
        const tipVal = Number(tipsState[emp.employeeId]) || 0;

        // 1. Update employee record
        await db.saveEmployee({
          ...emp,
          tips: tipVal,
        });

        // 2. Find or update payroll record
        const payrollId = `PAY-${emp.employeeId}-${year}-${month}`;
        const existing = allPayrolls.find((p: PayrollRecord) => p.id === payrollId);

        const basic = Number(existing?.basicSalary) || Number(emp.basicSalary) || 0;
        const food = Number(existing?.foodAllowance) || Number(emp.foodAllowance) || 0;
        const transport = Number(existing?.transportAllowance) || Number(emp.transportAllowance) || 0;
        const carOp = Number(existing?.carOperationAllowance) || Number(emp.carOperationAllowance) || 0;
        const other = Number(existing?.otherAllowance) || Number(emp.otherAllowance) || 0;
        const limitedTrans = Number(existing?.limitedTransport) || Number(emp.limitedTransport) || 0;
        const allowances = food + transport + carOp + other + limitedTrans;

        const sComm = Number(existing?.commissionBreakdown?.service) || 0;
        const pComm = Number(existing?.commissionBreakdown?.product) || 0;
        const bComm = Number(existing?.commissionBreakdown?.business) || 0;
        const totalComms = sComm + pComm + bComm;

        const deductions = Number(existing?.deductions) || Number(emp.deductionCurrent) || 0;
        const gross = basic + allowances + tipVal + totalComms;
        const net = Math.max(0, gross - deductions);

        if (existing) {
          const updatedRecord: PayrollRecord = {
            ...existing,
            tips: tipVal,
            totalMonthlySalary: gross,
            netSalary: net,
          };
          await db.savePayrollRecord(updatedRecord);
        }
      }

      // Sync business expenses
      await db.syncPayrollToBusinessExpenses(month, year);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Coins className="w-5 h-5 text-purple-300" />
              </span>
              <h3 className="text-lg font-bold">
                Manual Employee Tips &amp; Gratuity Editor
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30">
                {month} {year}
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-1">
              Directly enter, adjust, or batch-allocate tips manually for all employees. Tips are transparently included in the 10-Component Monthly Salary &amp; Wages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI & Batch Controls */}
        <div className="bg-purple-50/60 border-b border-purple-100 p-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Tips Assigned
              </span>
              <div className="text-xl font-black text-purple-900 font-mono mt-0.5">
                QAR {formatCurrency(totalTips)}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">
                {staffWithTips} of {activeEmps.length} active staff receiving tips
              </span>
            </div>

            {/* Batch +Bonus */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Add Tip Bonus to All Staff
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-500 font-mono">+QAR</span>
                <input
                  type="number"
                  min="5"
                  step="10"
                  value={batchBonusVal}
                  onChange={(e) => setBatchBonusVal(Number(e.target.value) || 0)}
                  className="w-20 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyBatchBonus}
                  className="px-2.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition-colors"
                >
                  + Add to All
                </button>
              </div>
            </div>

            {/* Set Flat to All & Clear */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Set Flat Amount or Clear
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={batchFlatVal}
                  onChange={(e) => setBatchFlatVal(Number(e.target.value) || 0)}
                  className="w-20 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={handleApplyBatchFlat}
                  className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Set Flat
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTips}
                  className="px-2 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer ml-auto"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between pt-1">
            <input
              type="text"
              placeholder="Search staff by name, ID or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg w-full max-w-sm"
            />
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {filteredList.length} of {activeEmps.length} active employees
            </span>
          </div>
        </div>

        {/* Employees Tips Table */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3 text-right">Fixed Package (Base)</th>
                <th className="py-2.5 px-3 text-right text-amber-700">Commissions</th>
                <th className="py-2.5 px-3 text-right text-purple-900 bg-purple-50/80 font-bold min-w-[220px]">
                  Manual Tips (QAR)
                </th>
                <th className="py-2.5 px-3 text-right text-amber-950 bg-amber-100/60 font-black">
                  Resulting Gross Wages
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((emp) => {
                const pRecord = payrolls.find((p) => p.employeeId === emp.employeeId);
                const basic = Number(pRecord?.basicSalary) || Number(emp.basicSalary) || 0;
                const food = Number(pRecord?.foodAllowance) || Number(emp.foodAllowance) || 0;
                const transport = Number(pRecord?.transportAllowance) || Number(emp.transportAllowance) || 0;
                const carOp = Number(pRecord?.carOperationAllowance) || Number(emp.carOperationAllowance) || 0;
                const other = Number(pRecord?.otherAllowance) || Number(emp.otherAllowance) || 0;
                const limitedTrans = Number(pRecord?.limitedTransport) || Number(emp.limitedTransport) || 0;
                const allowances = food + transport + carOp + other + limitedTrans;
                const baseSalary = basic + allowances;

                const sComm = Number(pRecord?.commissionBreakdown?.service) || 0;
                const pComm = Number(pRecord?.commissionBreakdown?.product) || 0;
                const bComm = Number(pRecord?.commissionBreakdown?.business) || 0;
                const totalComms = sComm + pComm + bComm;

                const tipVal = Number(tipsState[emp.employeeId]) || 0;
                const expectedGross = baseSalary + tipVal + totalComms;

                return (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{emp.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{emp.employeeId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {emp.position || 'Staff'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      QAR {formatCurrency(baseSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                      QAR {formatCurrency(totalComms)}
                    </td>
                    <td className="py-2.5 px-3 bg-purple-50/30">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] font-bold text-purple-700">QAR</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={tipsState[emp.employeeId] !== undefined ? tipsState[emp.employeeId] : 0}
                          onChange={(e) => handleTipChange(emp.employeeId, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right px-2 py-1 text-xs font-bold font-mono text-purple-900 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(emp.employeeId, 50)}
                          className="text-[10px] px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold cursor-pointer"
                          title="Add QAR 50"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(emp.employeeId, 100)}
                          className="text-[10px] px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold cursor-pointer"
                          title="Add QAR 100"
                        >
                          +100
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-amber-950 bg-amber-50/50">
                      QAR {formatCurrency(expectedGross)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Clicking Save will update employee tip profiles, payroll line items, and recalculate gross wages.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAllTips}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
              <span>{isSaving ? 'Saving Tips...' : 'Save All Tips & Update Payroll'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4B: Comprehensive 10-Component Remuneration Edit Modal
// Allows full manual and formula editing of Basic, 5 Allowances, Tips,
// Service / Product / Business Targets & Commissions, Deductions, and Status.
// ============================================================================
interface EditPayrollModalProps {
  record: PayrollRecord;
  employee?: Employee;
  settings: SystemSettings;
  onClose: () => void;
  onSave: (updated: PayrollRecord, syncToMaster: boolean) => Promise<void> | void;
}

const EditPayrollModal: React.FC<EditPayrollModalProps> = ({
  record,
  employee,
  settings,
  onClose,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [syncToMaster, setSyncToMaster] = useState(true);

  // Component 1-6: Base Remuneration & 5 Allowances
  const [basicSalary, setBasicSalary] = useState<number>(
    Number(record.basicSalary) || Number(employee?.basicSalary) || 0
  );
  const [foodAllowance, setFoodAllowance] = useState<number>(
    record.foodAllowance !== undefined ? Number(record.foodAllowance) : (Number(employee?.foodAllowance) || 0)
  );
  const [transportAllowance, setTransportAllowance] = useState<number>(
    record.transportAllowance !== undefined ? Number(record.transportAllowance) : (Number(employee?.transportAllowance) || 0)
  );
  const [carOperationAllowance, setCarOperationAllowance] = useState<number>(
    record.carOperationAllowance !== undefined ? Number(record.carOperationAllowance) : (Number(employee?.carOperationAllowance) || 0)
  );
  const [otherAllowance, setOtherAllowance] = useState<number>(
    record.otherAllowance !== undefined ? Number(record.otherAllowance) : (Number(employee?.otherAllowance) || 0)
  );
  const [limitedTransport, setLimitedTransport] = useState<number>(
    record.limitedTransport !== undefined ? Number(record.limitedTransport) : (Number(employee?.limitedTransport) || 0)
  );

  // Component 7: Employee Tips
  const [tips, setTips] = useState<number>(
    record.tips !== undefined ? Number(record.tips) : (Number(employee?.tips) || 0)
  );

  // Component 8: Service Sales Commission
  const [serviceTarget, setServiceTarget] = useState<number>(
    Number(record.commissionBreakdown?.serviceTarget) || Number(employee?.saleTargetRate) || 0
  );
  const [serviceRate, setServiceRate] = useState<number>(
    Number(record.commissionBreakdown?.serviceRate) || Number(employee?.saleCommissionRate) || (settings.salesCommRate ?? 10)
  );
  const [serviceActual, setServiceActual] = useState<number>(
    Number(record.commissionBreakdown?.serviceActual) || Number(employee?.totalSalesRate) || 0
  );

  // Component 9: Product Sales Commission
  const [productRate, setProductRate] = useState<number>(
    Number(record.commissionBreakdown?.productRate) || Number(employee?.prodSaleCommission) || (settings.productCommRate ?? 5)
  );
  const [productSales, setProductSales] = useState<number>(
    Number(record.commissionBreakdown?.productSales) || Number(employee?.prodTotalSales) || 0
  );

  // Component 10: Business Gross Sales Commission
  const [businessTarget, setBusinessTarget] = useState<number>(
    Number(record.commissionBreakdown?.businessTarget) || Number(employee?.businessTargetAmount) || settings.businessTarget || 200000
  );
  const [businessGross, setBusinessGross] = useState<number>(
    Number(record.commissionBreakdown?.businessGross) || Number(employee?.businessGross) || 0
  );
  const [businessRate, setBusinessRate] = useState<number>(
    Number(record.commissionBreakdown?.businessRate) || Number(employee?.businessTargetRate) || (settings.businessCommRate ?? 5)
  );
  const [businessSelected, setBusinessSelected] = useState<boolean>(
    record.commissionBreakdown?.businessSelectedByCompany ?? employee?.businessCommissionEligible ?? false
  );
  const [businessOverrideAmt, setBusinessOverrideAmt] = useState<number>(
    Number(record.commissionBreakdown?.business) || 0
  );
  const [useManualBusinessComm, setUseManualBusinessComm] = useState<boolean>(false);

  // Deductions & Status
  const [deductions, setDeductions] = useState<number>(Number(record.deductions) || 0);
  const [status, setStatus] = useState<PayrollRecord['status']>(record.status);
  const [paidAmount, setPaidAmount] = useState<number>(Number(record.paidAmount) || 0);

  // Live Calculations
  const totalAllowances =
    foodAllowance + transportAllowance + carOperationAllowance + otherAllowance + limitedTransport;
  const baseSalaryTotal = basicSalary + totalAllowances;

  // Formula 1: Services Commission
  const isServiceEligible = serviceActual >= serviceTarget && serviceTarget > 0;
  const netServiceCommDue = isServiceEligible ? serviceActual * (serviceRate / 100) : 0;

  // Formula 2: Product Commission
  const isProductEligible = productSales > 0;
  const netProductCommDue = isProductEligible ? productSales * (productRate / 100) : 0;

  // Formula 3: Business Commission
  const isBusinessTargetMet = businessGross >= businessTarget && businessTarget > 0;
  const isBusinessEligible = businessSelected && isBusinessTargetMet;
  const autoBusinessCommDue = isBusinessEligible ? businessGross * (businessRate / 100) * 0.2 : 0;
  const netBusinessCommDue = useManualBusinessComm
    ? businessOverrideAmt
    : isBusinessEligible
    ? businessOverrideAmt > 0
      ? businessOverrideAmt
      : autoBusinessCommDue
    : 0;

  const totalCommissionsDue = netServiceCommDue + netProductCommDue + netBusinessCommDue;
  const totalGrossRemuneration = baseSalaryTotal + tips + totalCommissionsDue;
  const netRemunerationDue = Math.max(0, totalGrossRemuneration - deductions);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedRecord: PayrollRecord = {
        ...record,
        basicSalary,
        foodAllowance,
        transportAllowance,
        carOperationAllowance,
        otherAllowance,
        limitedTransport,
        allowances: totalAllowances,
        tips,
        commissions: totalCommissionsDue,
        totalMonthlySalary: totalGrossRemuneration,
        deductions,
        netSalary: netRemunerationDue,
        status,
        paidAmount: status === 'Paid' ? (paidAmount > 0 ? paidAmount : netRemunerationDue) : paidAmount,
        commissionBreakdown: {
          ...record.commissionBreakdown,
          service: netServiceCommDue,
          product: netProductCommDue,
          business: netBusinessCommDue,
          totalCommission: totalCommissionsDue,
          serviceTarget,
          serviceRate,
          serviceActual,
          serviceAchievement: serviceTarget > 0 ? (serviceActual / serviceTarget) * 100 : serviceActual > 0 ? 100 : 0,
          serviceEligible: isServiceEligible,
          productSales,
          productRate,
          productEligible: isProductEligible,
          businessTarget,
          businessGross,
          businessRate,
          businessSelectedByCompany: businessSelected,
          businessEligible: isBusinessEligible,
        },
      };

      await onSave(updatedRecord, syncToMaster);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Pencil className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Edit Monthly Remuneration Sheet — {employee?.employeeName || record.employeeId}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-400/20 text-blue-300 font-mono">
                {record.month} {record.year}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Staff ID: <strong>{record.employeeId}</strong> · Role: <strong>{employee?.position || 'Staff'}</strong> · Direct adjustment of all 10 remuneration components with live formula recalculation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">1-6. Base Salary</span>
            <strong className="text-slate-900 font-mono text-sm block mt-0.5">QAR {formatCurrency(baseSalaryTotal)}</strong>
            <span className="text-[9.5px] text-slate-400">Basic + 5 Allowances</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">7. Tips &amp; Gratuity</span>
            <strong className="text-purple-900 font-mono text-sm block mt-0.5">QAR {formatCurrency(tips)}</strong>
            <span className="text-[9.5px] text-purple-600">Manual Tips</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">8-10. Commissions</span>
            <strong className="text-amber-950 font-mono text-sm block mt-0.5">QAR {formatCurrency(totalCommissionsDue)}</strong>
            <span className="text-[9.5px] text-amber-700">Services + Prod + Biz</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border-2 border-emerald-400 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Net Remuneration</span>
            <strong className="text-emerald-950 font-mono text-base font-black block mt-0.5">QAR {formatCurrency(netRemunerationDue)}</strong>
            <span className="text-[9.5px] text-emerald-700">Gross QAR {formatCurrency(totalGrossRemuneration)} − Ded. QAR {formatCurrency(deductions)}</span>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
          {/* SECTION 1: FIXED BASIC REMUNERATION & 5 ALLOWANCES */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                  1-6
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  Contractual Basic Remuneration &amp; 5 Allowances
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                Subtotal: QAR {formatCurrency(baseSalaryTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  1. Basic Salary (QAR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  2. Food Allowance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  3. Transportation Allowance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  4. Car Operation Allowance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={carOperationAllowance}
                  onChange={(e) => setCarOperationAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  5. Other Allowance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={otherAllowance}
                  onChange={(e) => setOtherAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  6. Limited Transport Allowance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={limitedTransport}
                  onChange={(e) => setLimitedTransport(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: EMPLOYEE TIPS & GRATUITY (COMPONENT 7) */}
          <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5 border-purple-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-200 text-purple-900 text-xs font-black flex items-center justify-center">
                  7
                </span>
                <div>
                  <h4 className="font-bold text-purple-950 text-sm">
                    Employee Tips &amp; Gratuity
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    Earned salon gratuities paid in full with monthly payroll.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                QAR {formatCurrency(tips)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-48">
                <label className="text-[11px] font-bold text-purple-900 block mb-1">
                  Tips Amount (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={tips}
                  onChange={(e) => setTips(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2 bg-white border border-purple-300 rounded-lg font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 self-end pb-0.5">
                <button
                  type="button"
                  onClick={() => setTips((prev) => prev + 50)}
                  className="px-3 py-2 text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors cursor-pointer"
                >
                  +50 QAR
                </button>
                <button
                  type="button"
                  onClick={() => setTips((prev) => prev + 100)}
                  className="px-3 py-2 text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors cursor-pointer"
                >
                  +100 QAR
                </button>
                <button
                  type="button"
                  onClick={() => setTips(0)}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Tips
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMISSIONS (COMPONENTS 8, 9, 10) */}
          <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-200 text-amber-950 text-xs font-black flex items-center justify-center">
                  8-10
                </span>
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    Monthly Sales Commission Targets &amp; Remuneration
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Services, Products, and Business Gross Targets configured by the company.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md">
                Commissions Due: QAR {formatCurrency(totalCommissionsDue)}
              </span>
            </div>

            {/* 8. SERVICES COMMISSION */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  8. Services Sales Commission (Target Rule)
                </span>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  isServiceEligible
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {isServiceEligible ? 'Target Met ✓ (Commission Active)' : 'Below Target (QAR 0 Due)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Target (QAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={serviceTarget}
                    onChange={(e) => setServiceTarget(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Recorded Sales (QAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={serviceActual}
                    onChange={(e) => setServiceActual(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div className="bg-blue-50 p-2 rounded-lg flex flex-col justify-center">
                  <span className="text-[9.5px] uppercase font-bold text-blue-700">Net Svc Comm Due</span>
                  <span className="font-mono font-black text-blue-950 text-sm">
                    QAR {formatCurrency(netServiceCommDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 9. PRODUCT COMMISSION */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  9. Product Sales Commission
                </span>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  isProductEligible
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {isProductEligible ? 'Sales Recorded ✓' : 'No Sales (QAR 0 Due)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Product Comm Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={productRate}
                    onChange={(e) => setProductRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Employee Product Sales (QAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={productSales}
                    onChange={(e) => setProductSales(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div className="bg-teal-50 p-2 rounded-lg flex flex-col justify-center">
                  <span className="text-[9.5px] uppercase font-bold text-teal-700">Net Prod Comm Due</span>
                  <span className="font-mono font-black text-teal-950 text-sm">
                    QAR {formatCurrency(netProductCommDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 10. BUSINESS GROSS COMMISSION */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  10. Business Gross Sales Commission
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={businessSelected}
                    onChange={(e) => setBusinessSelected(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">
                    Selected by Company for Biz Comm
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Company Target (QAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={businessTarget}
                    onChange={(e) => setBusinessTarget(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Month Gross Sales (QAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={businessGross}
                    onChange={(e) => setBusinessGross(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-slate-500 block mb-0.5">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={businessRate}
                    onChange={(e) => setBusinessRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900"
                  />
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg flex flex-col justify-center">
                  <span className="text-[9.5px] uppercase font-bold text-indigo-700">Net Biz Comm Due</span>
                  <span className="font-mono font-black text-indigo-950 text-sm">
                    QAR {formatCurrency(netBusinessCommDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: DEDUCTIONS & STATUS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm border-b pb-2.5 border-slate-100">
              Deductions, Status &amp; Final Remuneration Disbursement
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-rose-700 block mb-1">
                  Monthly Deductions (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={deductions}
                  onChange={(e) => setDeductions(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2 bg-rose-50/50 border border-rose-300 rounded-lg font-mono font-bold text-rose-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payroll Processing Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PayrollRecord['status'])}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                >
                  <option value="Draft">Draft (Pending Review)</option>
                  <option value="Approved">Approved (Ready to Transfer)</option>
                  <option value="Paid">Paid (Transferred &amp; Disbursed)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {status === 'Paid' && (
                <div>
                  <label className="text-[11px] font-bold text-emerald-700 block mb-1">
                    Amount Paid (QAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={paidAmount > 0 ? paidAmount : netRemunerationDue}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-950"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: SYNC TO MASTER PROFILE */}
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-3">
            <input
              type="checkbox"
              id="syncMasterProfile"
              checked={syncToMaster}
              onChange={(e) => setSyncToMaster(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <label htmlFor="syncMasterProfile" className="cursor-pointer font-medium">
              Also save updated Basic Salary, 5 Allowances, Tips, and Commission Targets to <strong>{employee?.employeeName || record.employeeId}&apos;s Master Employee Profile</strong> for all future monthly payroll calculations.
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : `Save & Recalculate Remuneration (Net: QAR ${formatCurrency(netRemunerationDue)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 5: Single Employee Transfer to Pay (10-Component Remuneration)
// ============================================================================
interface SinglePayTransferModalProps {
  record: PayrollRecord;
  employee?: Employee;
  onClose: () => void;
  onPaid: () => Promise<void> | void;
}

const SinglePayTransferModal: React.FC<SinglePayTransferModalProps> = ({
  record,
  employee,
  onClose,
  onPaid,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const basic = Number(record.basicSalary) || Number(employee?.basicSalary) || 0;
  const food = Number(record.foodAllowance) || Number(employee?.foodAllowance) || 0;
  const transport = Number(record.transportAllowance) || Number(employee?.transportAllowance) || 0;
  const carOp = Number(record.carOperationAllowance) || Number(employee?.carOperationAllowance) || 0;
  const other = Number(record.otherAllowance) || Number(employee?.otherAllowance) || 0;
  const limitedTrans = Number(record.limitedTransport) || Number(employee?.limitedTransport) || 0;
  const allowances = food + transport + carOp + other + limitedTrans;

  const tips = Number(record.tips) || Number(employee?.tips) || 0;
  const sComm = Number(record.commissionBreakdown?.service) || 0;
  const pComm = Number(record.commissionBreakdown?.product) || 0;
  const bComm = Number(record.commissionBreakdown?.business) || 0;
  const totalCommissions = sComm + pComm + bComm;
  const totalGross = record.totalMonthlySalary || (basic + allowances + tips + totalCommissions);
  const deductions = Number(record.deductions) || 0;
  const netPayable = Number(record.netSalary) || 0;

  const sTarget = Number(record.commissionBreakdown?.serviceTarget) || Number(employee?.saleTargetRate) || 0;
  const sActual = Number(record.commissionBreakdown?.serviceActual) || Number(employee?.totalSalesRate) || 0;
  const sRate = Number(record.commissionBreakdown?.serviceRate) || Number(employee?.saleCommissionRate) || 10;
  const sEligible = record.commissionBreakdown?.serviceEligible ?? (sActual >= sTarget && sActual > 0);

  const pSales = Number(record.commissionBreakdown?.productSales) || Number(employee?.prodTotalSales) || 0;
  const pRate = Number(record.commissionBreakdown?.productRate) || Number(employee?.prodSaleCommission) || 5;

  const bTarget = Number(record.commissionBreakdown?.businessTarget) || Number(employee?.businessTargetAmount) || 200000;
  const bGross = Number(record.commissionBreakdown?.businessGross) || Number(employee?.businessGross) || 0;
  const bRate = Number(record.commissionBreakdown?.businessRate) || Number(employee?.businessTargetRate) || 5;
  const bSelected = record.commissionBreakdown?.businessSelectedByCompany ?? employee?.businessCommissionEligible ?? false;
  const bEligible = record.commissionBreakdown?.businessEligible ?? (bSelected && bGross >= bTarget);

  const isBankWps = Boolean(
    employee?.iban &&
    employee?.payerBankShort &&
    employee?.payerBankShort.toUpperCase() !== 'CASH' &&
    employee?.payerBankShort.toUpperCase() !== 'NONE'
  );

  const handleConfirmPay = async () => {
    setIsProcessing(true);
    try {
      await onPaid();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Transfer to Pay — 10-Component Remuneration Sheet
              </h3>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-3">
              <span>Employee: <strong>{employee?.employeeName || record.employeeId}</strong></span>
              <span>·</span>
              <span>Month: <strong>{record.month} {record.year}</strong></span>
              <span>·</span>
              <span>Payment Mode: <strong className="text-emerald-300">{isBankWps ? 'Qatar Bank WPS' : 'Cash Salary'}</strong></span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banking Banner */}
        <div className="bg-emerald-50/70 border-b border-emerald-200 p-4 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-emerald-950">
              Payer Bank: {employee?.payerBank || 'COSMOS Commercial Bank'} ({employee?.payerBankShort || 'WPS'})
            </div>
            <div className="text-[11px] font-mono text-emerald-800">
              Payee IBAN: {employee?.iban ? maskIBAN(employee.iban) : 'No IBAN (Cash Remuneration)'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Net Pay to Disburse</span>
            <span className="text-xl font-black text-emerald-950 font-mono">QAR {formatCurrency(netPayable)}</span>
          </div>
        </div>

        {/* 10-Component Remuneration Table */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-slate-700">
            Remuneration Formula: Basic + 5 Allowances + Tips + 3 Commissions − Deductions = Net Pay
          </div>

          <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[9.5px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 w-8">#</th>
                <th className="py-2 px-3">Remuneration Component</th>
                <th className="py-2 px-3">Formula / Accounting Source</th>
                <th className="py-2 px-3 text-right">Amount (QAR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
              <tr>
                <td className="py-2 px-3 text-slate-400">1</td>
                <td className="py-2 px-3 font-bold text-slate-900 font-sans">Basic Salary</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Contract fixed basic wage</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">QAR {formatCurrency(basic)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-400">2</td>
                <td className="py-2 px-3 text-slate-800 font-sans">Food Allowance</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Monthly food stipend</td>
                <td className="py-2 px-3 text-right text-slate-800">QAR {formatCurrency(food)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-400">3</td>
                <td className="py-2 px-3 text-slate-800 font-sans">Transportation Allowance</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Standard transport support</td>
                <td className="py-2 px-3 text-right text-slate-800">QAR {formatCurrency(transport)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-400">4</td>
                <td className="py-2 px-3 text-slate-800 font-sans">Car Operation Allowance</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Vehicle operation / fuel</td>
                <td className="py-2 px-3 text-right text-slate-800">QAR {formatCurrency(carOp)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-400">5</td>
                <td className="py-2 px-3 text-slate-800 font-sans">Other Allowance</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Special duties / mobile stipend</td>
                <td className="py-2 px-3 text-right text-slate-800">QAR {formatCurrency(other)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-400">6</td>
                <td className="py-2 px-3 text-slate-800 font-sans">Limited Transport Allowance</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Restricted zone transportation</td>
                <td className="py-2 px-3 text-right text-slate-800">QAR {formatCurrency(limitedTrans)}</td>
              </tr>
              <tr className="bg-purple-50/50">
                <td className="py-2 px-3 text-purple-600 font-bold">7</td>
                <td className="py-2 px-3 font-bold text-purple-900 font-sans">Employee Tips (Gratuity)</td>
                <td className="py-2 px-3 text-purple-700 font-sans">Customer gratuities and staff tips</td>
                <td className="py-2 px-3 text-right font-black text-purple-900">QAR {formatCurrency(tips)}</td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="py-2 px-3 text-blue-600 font-bold">8</td>
                <td className="py-2 px-3 font-bold text-blue-900 font-sans">Net Services Comm. Due</td>
                <td className="py-2 px-3 text-blue-700 font-sans">
                  {sEligible ? `Target QAR ${formatCurrency(sTarget)} Met! Sales QAR ${formatCurrency(sActual)} × ${sRate}%` : `Sales QAR ${formatCurrency(sActual)} below Target of QAR ${formatCurrency(sTarget)} = QAR 0`}
                </td>
                <td className="py-2 px-3 text-right font-black text-blue-950">QAR {formatCurrency(sComm)}</td>
              </tr>
              <tr className="bg-teal-50/40">
                <td className="py-2 px-3 text-teal-600 font-bold">9</td>
                <td className="py-2 px-3 font-bold text-teal-900 font-sans">Net Product Comm. Due</td>
                <td className="py-2 px-3 text-teal-700 font-sans">
                  Retail Sales QAR {formatCurrency(pSales)} × {pRate}% (independent)
                </td>
                <td className="py-2 px-3 text-right font-black text-teal-950">QAR {formatCurrency(pComm)}</td>
              </tr>
              <tr className="bg-indigo-50/40">
                <td className="py-2 px-3 text-indigo-600 font-bold">10</td>
                <td className="py-2 px-3 font-bold text-indigo-900 font-sans">Net Business Gross Comm. Due</td>
                <td className="py-2 px-3 text-indigo-700 font-sans">
                  {!bSelected ? 'Employee not selected by company = QAR 0' : bEligible ? `Target QAR ${formatCurrency(bTarget)} Met! Gross QAR ${formatCurrency(bGross)} × ${bRate}%` : 'Target deficit = QAR 0'}
                </td>
                <td className="py-2 px-3 text-right font-black text-indigo-950">QAR {formatCurrency(bComm)}</td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-slate-300 font-mono text-xs">
              <tr className="bg-amber-100/70 font-black text-amber-950">
                <td colSpan={3} className="py-2.5 px-3 uppercase font-sans text-xs">
                  Total Monthly Salaries &amp; Wages (Gross 10-Component Sum)
                </td>
                <td className="py-2.5 px-3 text-right text-xs">
                  QAR {formatCurrency(totalGross)}
                </td>
              </tr>
              <tr className="bg-rose-50 font-bold text-rose-700">
                <td colSpan={3} className="py-2 px-3 font-sans">
                  Less: Monthly Deductions
                </td>
                <td className="py-2 px-3 text-right">
                  − QAR {formatCurrency(deductions)}
                </td>
              </tr>
              <tr className="bg-emerald-100 font-black text-emerald-950 text-sm">
                <td colSpan={3} className="py-2.5 px-3 uppercase font-sans">
                  Total Most Paid (Net Remuneration Due)
                </td>
                <td className="py-2.5 px-3 text-right text-sm">
                  QAR {formatCurrency(netPayable)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmPay}
            disabled={isProcessing}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Payment...' : `Confirm & Transfer Payment (QAR ${formatCurrency(netPayable)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 6: Batch Transfer to Pay (All 10 Components Remuneration)
// ============================================================================
interface BatchPayTransferModalProps {
  selectedRecords: PayrollRecord[];
  employees: Employee[];
  month: string;
  year: string;
  onClose: () => void;
  onPaid: () => Promise<void> | void;
}

const BatchPayTransferModal: React.FC<BatchPayTransferModalProps> = ({
  selectedRecords,
  employees,
  month,
  year,
  onClose,
  onPaid,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const totalGross = selectedRecords.reduce((sum, r) => sum + (Number(r.totalMonthlySalary) || 0), 0);
  const totalDeductions = selectedRecords.reduce((sum, r) => sum + (Number(r.deductions) || 0), 0);
  const totalNet = selectedRecords.reduce((sum, r) => sum + (Number(r.netSalary) || 0), 0);
  const totalTips = selectedRecords.reduce((sum, r) => sum + (Number(r.tips) || 0), 0);
  const totalComms = selectedRecords.reduce((sum, r) => sum + (Number(r.commissions) || 0), 0);

  const handleConfirmBatchPay = async () => {
    setIsProcessing(true);
    try {
      await onPaid();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCheck className="w-5 h-5 text-emerald-400" />
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Batch Transfer to Pay — {selectedRecords.length} Staff Remuneration Sheets
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 font-mono">
                {month} {year}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Verify all 10 remuneration components (Basic + 5 Allowances + Tips + 3 Commissions) before disbursing payment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Records</span>
            <strong className="text-slate-900 font-mono text-base">{selectedRecords.length} Staff</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">Tips &amp; Gratuity</span>
            <strong className="text-purple-900 font-mono text-base">QAR {formatCurrency(totalTips)}</strong>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Gross Wages (10 Components)</span>
            <strong className="text-amber-950 font-mono text-base">QAR {formatCurrency(totalGross)}</strong>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Net Pay to Disburse</span>
            <strong className="text-emerald-950 font-mono text-lg font-black">QAR {formatCurrency(totalNet)}</strong>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 text-[9.5px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3 text-right">1. Basic</th>
                <th className="py-2.5 px-3 text-right">2-6. Allowances</th>
                <th className="py-2.5 px-3 text-right text-purple-800 bg-purple-50">7. Tips</th>
                <th className="py-2.5 px-3 text-right text-blue-800">8. Svc Comm</th>
                <th className="py-2.5 px-3 text-right text-teal-800">9. Prod Comm</th>
                <th className="py-2.5 px-3 text-right text-indigo-800">10. Biz Comm</th>
                <th className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-100">Gross Wages</th>
                <th className="py-2.5 px-3 text-right text-rose-600">Ded.</th>
                <th className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-100">Total Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
              {selectedRecords.map((r) => {
                const emp = employees.find((e) => e.employeeId === r.employeeId);
                const sComm = Number(r.commissionBreakdown?.service) || 0;
                const pComm = Number(r.commissionBreakdown?.product) || 0;
                const bComm = Number(r.commissionBreakdown?.business) || 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-slate-900">{emp?.employeeName || r.employeeId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.employeeId} · {emp?.position}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">QAR {formatCurrency(r.basicSalary)}</td>
                    <td className="py-2.5 px-3 text-right">QAR {formatCurrency(r.allowances)}</td>
                    <td className="py-2.5 px-3 text-right text-purple-800 bg-purple-50/40 font-bold">QAR {formatCurrency(r.tips || 0)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-800 font-bold">QAR {formatCurrency(sComm)}</td>
                    <td className="py-2.5 px-3 text-right text-teal-800 font-bold">QAR {formatCurrency(pComm)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-800 font-bold">QAR {formatCurrency(bComm)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-100/60">QAR {formatCurrency(r.totalMonthlySalary)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">QAR {formatCurrency(r.deductions)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-100/80">QAR {formatCurrency(r.netSalary)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 font-mono text-[11px] sticky bottom-0">
              <tr>
                <td className="py-2.5 px-3 uppercase font-sans">Total ({selectedRecords.length} Staff)</td>
                <td colSpan={6}></td>
                <td className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-200/60">QAR {formatCurrency(totalGross)}</td>
                <td className="py-2.5 px-3 text-right text-rose-700">− QAR {formatCurrency(totalDeductions)}</td>
                <td className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-200/80">QAR {formatCurrency(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmBatchPay}
            disabled={isProcessing}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Batch Payment...' : `Confirm & Transfer Payment for ${selectedRecords.length} Staff (QAR ${formatCurrency(totalNet)})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


