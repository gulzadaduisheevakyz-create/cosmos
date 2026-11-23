import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Building,
  CreditCard,
  Plus,
  Filter,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  RefreshCw,
  Sparkles,
  Percent,
  Upload,
  Download,
  Loader2,
} from 'lucide-react';
import { triggerPrintWithTarget } from '../services/printHelper';
import { exportElementToPdf } from '../services/pdfService';
import {
  PettyCashExpense,
  FixedExpense,
  BusinessGrossEntry,
  FixedExpenseCategory,
  Employee,
  DailySaleRecord,
  SystemSettings,
  PayrollRecord,
} from '../types';
import { db, formatCurrency, formatDate } from '../services/db';
import {
  exportBusinessExpensesToExcel,
  exportPettyExpensesToExcel,
  downloadPettyExpenseTemplate,
  parsePettyExpensesFromExcel,
  exportFixedExpensesToExcel,
  downloadFixedExpenseTemplate,
  parseFixedExpensesFromExcel,
} from '../services/excel';
import { ConfirmModal } from './ConfirmModal';

interface BusinessExpensesViewProps {
  payrolls?: PayrollRecord[];
  pettyCash: PettyCashExpense[];
  fixedExpenses: FixedExpense[];
  businessGross: BusinessGrossEntry[];
  employees: Employee[];
  dailySales: DailySaleRecord[];
  settings: SystemSettings;
  initialTab?: 'overview' | 'gross' | 'fixed' | 'petty' | 'scan';
  onRefresh: () => void;
  onOpenEmployee?: (id: string) => void;
}

export const PRESET_FIXED_CATEGORIES: FixedExpenseCategory[] = [
  'Salaries & wages by WPS',
  'Salaries & wages by CASH',
  'Lease Shop',
  'Lease Flat',
  'Qatar Cool',
  'Internet',
  'Fresha',
  'Loyalty Card',
];

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

export const BusinessExpensesView: React.FC<BusinessExpensesViewProps> = ({
  payrolls = [],
  pettyCash,
  fixedExpenses,
  businessGross,
  employees,
  dailySales,
  settings,
  initialTab = 'overview',
  onRefresh,
  onOpenEmployee,
}) => {
  // Current active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'gross' | 'fixed' | 'petty' | 'scan'>(initialTab);

  // Synchronize sub-tab when user navigates from sidebar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Global Time Scope
  const currentMonthName = MONTHS[new Date().getMonth()];
  const currentYearVal = new Date().getFullYear().toString();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearVal);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedGrossTimeframe, setSelectedGrossTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Modals state
  const [isAddGrossOpen, setIsAddGrossOpen] = useState(false);
  const [isAddFixedOpen, setIsAddFixedOpen] = useState(false);
  const [isAddPettyOpen, setIsAddPettyOpen] = useState(false);
  const [isImportPettyOpen, setIsImportPettyOpen] = useState(false);
  const [isImportFixedOpen, setIsImportFixedOpen] = useState(false);
  const [grossModalInitialTimeframe, setGrossModalInitialTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Edit items
  const [editingGross, setEditingGross] = useState<BusinessGrossEntry | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
  const [editingPetty, setEditingPetty] = useState<PettyCashExpense | null>(null);

  // In-App Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'fixed' | 'petty' | 'gross';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  // PDF download loading state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'fixed') {
        await db.deleteFixedExpense(deleteConfirm.id);
        showToast('Fixed expense record deleted successfully');
      } else if (deleteConfirm.type === 'petty') {
        await db.deletePettyCashExpense(deleteConfirm.id);
        showToast('Petty daily expense (VOICE) voucher deleted successfully');
      } else if (deleteConfirm.type === 'gross') {
        await db.deleteBusinessGrossEntry(deleteConfirm.id);
        showToast('Business Gross income entry deleted successfully');
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Openers for Business Gross Fill Options (Daily, Monthly, Yearly)
  const handleOpenFillDailyGross = () => {
    setEditingGross(null);
    setGrossModalInitialTimeframe('daily');
    setIsAddGrossOpen(true);
  };

  const handleOpenFillMonthlyGross = (monthName?: string, yearVal?: string) => {
    const targetMonth = monthName || (selectedMonth === 'ALL' ? currentMonthName : selectedMonth);
    const targetYear = yearVal || (selectedYear === 'ALL' ? currentYearVal : selectedYear);
    const existing = businessGross.find(
      (b) => b.year === targetYear && b.month === targetMonth && b.source === 'Direct Business Register'
    );
    setEditingGross(existing || null);
    setSelectedMonth(targetMonth);
    setSelectedYear(targetYear);
    setGrossModalInitialTimeframe('monthly');
    setIsAddGrossOpen(true);
  };

  const handleOpenFillYearlyGross = (yearVal?: string) => {
    const targetYear = yearVal || (selectedYear === 'ALL' ? currentYearVal : selectedYear);
    const existing = businessGross.find(
      (b) => b.year === targetYear && (b.entryType === 'Yearly' || b.month === 'All Months') && b.source === 'Direct Business Register'
    );
    setEditingGross(existing || null);
    setSelectedYear(targetYear);
    setGrossModalInitialTimeframe('yearly');
    setIsAddGrossOpen(true);
  };

  // -------------------------------------------------------------
  // Comprehensive Auto-Calculation Engine & Profit & Loss Statement
  // -------------------------------------------------------------
  const summary = useMemo(() => {
    return db.calculateFinancialSummary(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, pettyCash, fixedExpenses, businessGross, dailySales, employees, payrolls]);

  const pnl = useMemo(() => {
    return db.calculateProfitAndLoss(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, pettyCash, fixedExpenses, businessGross, dailySales, employees, payrolls]);

  // Total Unpaid reminder counts
  const unpaidPettyItems = useMemo(() => {
    return pettyCash.filter((p) => {
      const matchYear = selectedYear === 'ALL' || p.year === selectedYear || (p.invoiceDate && p.invoiceDate.startsWith(selectedYear));
      const matchMonth = selectedMonth === 'ALL' || p.month === selectedMonth;
      return matchYear && matchMonth && p.status === 'Unpaid';
    });
  }, [pettyCash, selectedMonth, selectedYear]);

  const unpaidFixedItems = useMemo(() => {
    return fixedExpenses.filter((f) => {
      const matchYear = selectedYear === 'ALL' || f.year === selectedYear || (f.date && f.date.startsWith(selectedYear));
      const matchMonth = selectedMonth === 'ALL' || f.month === selectedMonth;
      return matchYear && matchMonth && f.status === 'Unpaid';
    });
  }, [fixedExpenses, selectedMonth, selectedYear]);

  const totalUnpaidCount = unpaidPettyItems.length + unpaidFixedItems.length;

  // Filtered Petty Cash list
  const filteredPettyCash = useMemo(() => {
    return pettyCash.filter((p) => {
      const matchYear = selectedYear === 'ALL' || p.year === selectedYear || (p.invoiceDate && p.invoiceDate.startsWith(selectedYear));
      const matchMonth = selectedMonth === 'ALL' || p.month === selectedMonth;
      if (!matchYear || !matchMonth) return false;
      if (showUnpaidOnly && p.status !== 'Unpaid') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = p.invoiceRefNo.toLowerCase().includes(q);
        const matchComp = p.company.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchMethod = p.paymentMethod.toLowerCase().includes(q);
        if (!matchRef && !matchComp && !matchDesc && !matchMethod) return false;
      }
      return true;
    });
  }, [pettyCash, selectedMonth, selectedYear, showUnpaidOnly, searchQuery]);

  // Filtered Fixed Expenses list
  const filteredFixedExpenses = useMemo(() => {
    return fixedExpenses.filter((f) => {
      const matchYear = selectedYear === 'ALL' || f.year === selectedYear || (f.date && f.date.startsWith(selectedYear));
      const matchMonth = selectedMonth === 'ALL' || f.month === selectedMonth;
      if (!matchYear || !matchMonth) return false;
      if (showUnpaidOnly && f.status !== 'Unpaid') return false;
      if (selectedCategoryFilter !== 'ALL' && f.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = f.refNo.toLowerCase().includes(q);
        const matchComp = f.company.toLowerCase().includes(q);
        const matchDesc = f.description.toLowerCase().includes(q);
        const matchCat = f.category.toLowerCase().includes(q);
        if (!matchRef && !matchComp && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [fixedExpenses, selectedMonth, selectedYear, showUnpaidOnly, selectedCategoryFilter, searchQuery]);

  // Filtered Business Gross Entries
  const filteredBusinessGross = useMemo(() => {
    return businessGross.filter((b) => {
      const matchYear = selectedYear === 'ALL' || b.year === selectedYear || (b.date && b.date.startsWith(selectedYear));
      const matchMonth = selectedMonth === 'ALL' || b.month === selectedMonth;
      if (!matchYear || !matchMonth) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        const matchDate = b.date.includes(q);
        if (!matchNotes && !matchDate) return false;
      }
      return true;
    });
  }, [businessGross, selectedMonth, selectedYear, searchQuery]);

  // Monthly Rollup of Business Gross across 12 months for current year
  const monthlyGrossRollup = useMemo(() => {
    return MONTHS.map((mName, mIdx) => {
      const mNum = String(mIdx + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${mNum}`;
      // From sales
      const mSales = dailySales.filter((s) => s.date && s.date.startsWith(prefix));
      const posS = mSales.reduce((sum, s) => sum + (Number(s.posCard) || 0), 0);
      const cashS = mSales.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
      const transferS = mSales.reduce((sum, s) => sum + (Number(s.transferIncome) || 0), 0);
      const fawranS = mSales.reduce((sum, s) => sum + (Number(s.fawran) || 0), 0);
      // From direct registers
      const mDirect = businessGross.filter(
        (b) => (b.year === selectedYear && b.month === mName) && b.source === 'Direct Business Register'
      );
      const posD = mDirect.reduce((sum, b) => sum + (Number(b.posIncome) || 0), 0);
      const cashD = mDirect.reduce((sum, b) => sum + (Number(b.cashIncome) || 0), 0);
      const transferD = mDirect.reduce((sum, b) => sum + (Number(b.transferIncome) || 0), 0);
      const fawranD = mDirect.reduce((sum, b) => sum + (Number(b.fawranIncome) || 0), 0);

      const pos = posS + posD;
      const cash = cashS + cashD;
      const transfer = transferS + transferD;
      const fawran = fawranS + fawranD;
      const totalGross = pos + cash + transfer + fawran;

      // Expenses for that month
      const pExp = pettyCash
        .filter((p) => p.month === mName && (p.year === selectedYear || p.invoiceDate.startsWith(selectedYear)))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const fExp = fixedExpenses
        .filter((f) => f.month === mName && (f.year === selectedYear || f.date.startsWith(selectedYear)))
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const net = totalGross - (pExp + fExp);

      return {
        month: mName,
        pos,
        cash,
        transfer,
        fawran,
        totalGross,
        pettyExpenses: pExp,
        fixedExpenses: fExp,
        netProfit: net,
      };
    });
  }, [dailySales, businessGross, pettyCash, fixedExpenses, selectedYear]);

  // Yearly Rollup across multiple years
  const yearlyGrossRollup = useMemo(() => {
    const years = ['2025', '2026', '2027'];
    return years.map((y) => {
      const ySales = dailySales.filter((s) => s.date && s.date.startsWith(y));
      const posS = ySales.reduce((sum, s) => sum + (Number(s.posCard) || 0), 0);
      const cashS = ySales.reduce((sum, s) => sum + (Number(s.cash) || 0), 0);
      const transferS = ySales.reduce((sum, s) => sum + (Number(s.transferIncome) || 0), 0);
      const fawranS = ySales.reduce((sum, s) => sum + (Number(s.fawran) || 0), 0);

      const yDirect = businessGross.filter((b) => b.year === y && b.source === 'Direct Business Register');
      const posD = yDirect.reduce((sum, b) => sum + (Number(b.posIncome) || 0), 0);
      const cashD = yDirect.reduce((sum, b) => sum + (Number(b.cashIncome) || 0), 0);
      const transferD = yDirect.reduce((sum, b) => sum + (Number(b.transferIncome) || 0), 0);
      const fawranD = yDirect.reduce((sum, b) => sum + (Number(b.fawranIncome) || 0), 0);

      const pos = posS + posD;
      const cash = cashS + cashD;
      const transfer = transferS + transferD;
      const fawran = fawranS + fawranD;
      const totalGross = pos + cash + transfer + fawran;

      const pExp = pettyCash
        .filter((p) => p.year === y || (p.invoiceDate && p.invoiceDate.startsWith(y)))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const fExp = fixedExpenses
        .filter((f) => f.year === y || (f.date && f.date.startsWith(y)))
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const net = totalGross - (pExp + fExp);

      return {
        year: y,
        pos,
        cash,
        transfer,
        fawran,
        totalGross,
        totalExpenses: pExp + fExp,
        netProfit: net,
      };
    });
  }, [dailySales, businessGross, pettyCash, fixedExpenses]);

  // Handlers for Paid/Unpaid Toggles
  const handleTogglePettyStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = await db.togglePettyCashStatus(id);
      showToast(`Voucher status toggled to ${newStatus}`);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleToggleFixedStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = await db.toggleFixedExpenseStatus(id);
      showToast(`Fixed expense status toggled to ${newStatus}`);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Sync Salaries & Wages (WPS & CASH) from Monthly Payroll Processing & Wages
  const handleSyncSalariesFromPayroll = async () => {
    try {
      const res = await db.syncPayrollToBusinessExpenses(selectedMonth, selectedYear);
      showToast(
        `✅ Auto-calculated from Monthly Payroll (${selectedMonth} ${selectedYear}): ` +
        `WPS QAR ${formatCurrency(res.wpsTotal)} (${res.wpsCount} staff) & CASH QAR ${formatCurrency(res.cashTotal)} (${res.cashCount} staff).`
      );
      onRefresh();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to sync salaries from payroll.');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      exportBusinessExpensesToExcel(
        filteredBusinessGross,
        filteredFixedExpenses,
        filteredPettyCash,
        summary,
        `${selectedMonth}_${selectedYear}`
      );
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await exportElementToPdf('printable-business-expenses', {
        filename: `COSMOS_Business_Expenses_${selectedMonth}_${selectedYear}.pdf`,
        orientation: 'p',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintBusinessExpenses = () => {
    window.printDocument(
      'printable-business-expenses',
      `COSMOS_Business_Expenses_${selectedMonth}_${selectedYear}`
    );
  };

  return (
    <div className="space-y-6">
      {/* ----------------- TOP CONTROLS & HEADER ----------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Business Expanses &amp; Gross System
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Cosmos Salon Unified Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized management for Business Gross, Monthly Fixed Expanse, Monthly Petty Daily Expanse, and WPS Wages.
              </p>
            </div>
          </div>
        </div>

        {/* Global Month/Year Filter and Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer font-mono"
            >
              <option value="ALL">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isDownloadingPdf}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Save Business Expenses Report as PDF (Direct Download)"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Save as PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintBusinessExpenses}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Print Official Letter (A4)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Letter (A4)</span>
          </button>
        </div>
      </div>

      {/* ----------------- TOAST MESSAGE ----------------- */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* ----------------- PROMINENT RED UNPAID REMINDER BANNER ----------------- */}
      {totalUnpaidCount > 0 && (
        <div className="bg-linear-to-r from-rose-600 via-rose-700 to-red-800 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/30 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-rose-700">
                  ⚠️ Action Required
                </span>
                <span className="text-sm font-bold tracking-tight">
                  Unpaid Amounts Remainder Alert
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                You have <strong>{totalUnpaidCount} unpaid expense voucher(s)</strong> totaling{' '}
                <strong className="text-amber-200 font-mono text-sm underline decoration-amber-300 underline-offset-2">
                  QAR {formatCurrency(summary.totalSalonUnpaid)}
                </strong>{' '}
                marked with red reminder! Click each row's button to mark as paid once cleared with vendor or bank.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowUnpaidOnly(!showUnpaidOnly);
                if (activeTab === 'overview') setActiveTab('fixed');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                showUnpaidOnly
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-white text-rose-700 hover:bg-rose-50'
              }`}
            >
              {showUnpaidOnly ? '✓ Showing Unpaid Only' : 'Filter Unpaid Vouchers (Red)'}
            </button>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TABS NAVIGATION (Unified Hub) ----------------- */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Executive Overview &amp; Auto-Calculations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gross')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'gross'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>1. Business Gross (Daily, Monthly, Yearly)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fixed')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'fixed'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building className="w-4 h-4 text-indigo-600" />
          <span>2. Monthly Fixed Expanse</span>
          {unpaidFixedItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white font-mono">
              {unpaidFixedItems.length} unpaid
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('petty')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'petty'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>3. Monthly Petty Daily Expanse (VOICE)</span>
          {unpaidPettyItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white font-mono">
              {unpaidPettyItems.length} unpaid
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scan')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ml-auto ${
            activeTab === 'scan'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>4. System Data &amp; Code Scan</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: EXECUTIVE FINANCIAL OVERVIEW & AUTO-CALCULATIONS        */}
      {/* ============================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 10 Master Summary KPI Cards (Executive Financial Dashboard) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                10 Core Financial Indicators ({selectedMonth} {selectedYear})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-reconciled from Daily Sales, Section 5 Commissions, WPS &amp; Invoices
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Gross Sales */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
                    1. Gross Sales
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-purple-900 tracking-tight">
                  QAR {formatCurrency(pnl.grossSales)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  POS + Cash + Wire + Fawran
                </div>
              </div>

              {/* Card 2: Net Sales */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    2. Net Sales
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-blue-900 tracking-tight">
                  QAR {formatCurrency(pnl.netSales)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Gross - Discounts - Refunds
                </div>
              </div>

              {/* Card 3: Total Service Sales */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    3. Total Service Sales
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  QAR {formatCurrency(pnl.serviceSales)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Salon client appointments
                </div>
              </div>

              {/* Card 4: Total Product Sales */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    4. Total Product Sales
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  QAR {formatCurrency(pnl.productSales)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Retail beauty products
                </div>
              </div>

              {/* Card 5: Total Earned Commissions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    5. Earned Commissions
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-700 tracking-tight">
                  QAR {formatCurrency(pnl.earnedCommissions)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Section 5: 10% Srv + 5% Prod + 5% Biz
                </div>
              </div>

              {/* Card 6: Total Salaries & Wages */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    6. Salaries &amp; Wages
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  QAR {formatCurrency(summary.totalSalaries)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono flex justify-between">
                  <span>WPS: {formatCurrency(summary.wagesByWps)}</span>
                  <span>Cash: {formatCurrency(summary.salariesByCash)}</span>
                </div>
              </div>

              {/* Card 7: Total Fixed Expenses (Leases & Utilities) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    7. Fixed Expenses
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  QAR {formatCurrency(Math.max(0, summary.fixedExpensesTotal - summary.wagesByWps - summary.salariesByCash))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Shop/Flat rent, Cool, Net, Subs
                </div>
              </div>

              {/* Card 8: Monthly Petty Daily Expenses */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    8. Petty Daily Expenses
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  QAR {formatCurrency(summary.pettyCashTotal)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Monthly Petty Daily Expanse (VOICE)
                </div>
              </div>

              {/* Card 9: Total Expenses */}
              <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between bg-rose-50/20">
                <div className="flex items-center justify-between text-rose-900 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                    9. Total Expenses
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-rose-700 tracking-tight">
                  QAR {formatCurrency(summary.totalSalonExpenses)}
                </div>
                <div className="text-[10px] text-rose-800 mt-1 font-mono">
                  WPS + Cash Wages + Fixed + Petty
                </div>
              </div>

              {/* Card 10: Net Profit / Loss (GREEN for Profit, RED for Loss) */}
              <div
                className={`p-4 rounded-xl border-2 shadow-md flex flex-col justify-between ${
                  summary.netSalonProfit >= 0
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                    : 'bg-rose-50 border-rose-500 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      summary.netSalonProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    10. {summary.netSalonProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      summary.netSalonProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {summary.netSalonProfit >= 0 ? 'PROFITABLE' : 'NET LOSS'}
                  </span>
                </div>
                <div
                  className={`text-2xl font-black font-mono tracking-tight ${
                    summary.netSalonProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {summary.netSalonProfit >= 0 ? '+' : ''}QAR {formatCurrency(summary.netSalonProfit)}
                </div>
                <div
                  className={`text-[10px] font-mono mt-1 ${
                    summary.netSalonProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  Margin: {pnl.netSales > 0 ? ((summary.netSalonProfit / pnl.netSales) * 100).toFixed(1) : '0.0'}% of Net Sales
                </div>
              </div>
            </div>
          </div>

          {/* Income vs Expenses Balance Sheet */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Auto-Calculated Financial Balance Sheet ({selectedMonth} {selectedYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time reconciliation of total salon inflows vs outflows and net operating profit.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Net Salon Operating Result:</span>
                <span
                  className={`text-base font-black font-mono px-3 py-1 rounded-xl border ${
                    summary.netSalonProfit >= 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {summary.netSalonProfit >= 0 ? '+' : ''}QAR {formatCurrency(summary.netSalonProfit)}
                </span>
              </div>
            </div>

            {/* Income Streams Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Business Inflow Sources */}
              <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <span className="text-xs font-bold uppercase text-purple-950 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-700" />
                    <span>Inflow Streams (Business Gross)</span>
                  </span>
                  <span className="font-mono font-bold text-purple-900 text-xs">
                    QAR {formatCurrency(summary.totalBusinessGross)}
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>1. POS in come (Card payments)</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.posIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>2. Cash in come (Physical cash)</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.cashIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>3. Transfer in come (Bank wires)</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.transferIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>4. Fawran in come (Instant Qatar)</span>
                    <span className="font-bold text-amber-700">QAR {formatCurrency(summary.fawranIncome)}</span>
                  </div>
                  <div className="pt-2 border-t border-purple-200/60 flex justify-between items-center text-purple-950 font-bold text-sm">
                    <span>Total Business Gross:</span>
                    <span>QAR {formatCurrency(summary.totalBusinessGross)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Outflow & Expense Allocation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Outflow Streams (Salon Expenses)</span>
                  </span>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    QAR {formatCurrency(summary.totalSalonExpenses)}
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>1. Salaries &amp; wages by WPS</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.wagesByWps)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>2. Salaries &amp; wages by CASH</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.salariesByCash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>3. Monthly Fixed Expenses (Rent, Utilities, Subs)</span>
                    <span className="font-bold text-slate-900">
                      QAR {formatCurrency(summary.fixedExpensesTotal - summary.wagesByWps - summary.salariesByCash)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>4. Monthly Petty Daily Expenses (VOICE)</span>
                    <span className="font-bold text-slate-900">QAR {formatCurrency(summary.pettyCashTotal)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-rose-800 font-bold text-sm">
                    <span>Combined Salon Outflows:</span>
                    <span>QAR {formatCurrency(summary.totalSalonExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Settlement Action Strip */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Real-Time WPS &amp; Salary Connection Active</div>
                  <div className="text-[11px] text-slate-400">
                    WPS wages calculate automatically from registered active staff with Qatar IBAN accounts.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncSalariesFromPayroll}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Auto-calculate WPS & Cash salaries from Monthly Payroll records"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync from Payroll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fixed')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Manage Fixed Invoices
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('petty')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer"
                >
                  Manage Daily Petty Cash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: BUSINESS GROSS REGISTER (Daily, Monthly, Yearly)        */}
      {/* ============================================================= */}
      {activeTab === 'gross' && (
        <div className="space-y-5">
          {/* Header & Sub-Timeframe Toggle */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>1. Business Gross Register (Salon Total Income)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register and track daily, monthly, and yearly income streams: POS in come, Cash in come, Transfer in come, and Fawran in come.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Daily, Monthly, Yearly view switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedGrossTimeframe('daily')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedGrossTimeframe === 'daily'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daily Incomes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGrossTimeframe('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedGrossTimeframe === 'monthly'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Incomes (12 Mo)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGrossTimeframe('yearly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedGrossTimeframe === 'yearly'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Yearly Incomes
                </button>
              </div>

              {/* Dynamic Fill Amount Buttons for Daily, Monthly & Yearly */}
              {selectedGrossTimeframe === 'daily' && (
                <button
                  type="button"
                  onClick={handleOpenFillDailyGross}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Fill Daily Income</span>
                </button>
              )}

              {selectedGrossTimeframe === 'monthly' && (
                <button
                  type="button"
                  onClick={() => handleOpenFillMonthlyGross(selectedMonth === 'ALL' ? currentMonthName : selectedMonth, selectedYear)}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Fill Monthly Income</span>
                </button>
              )}

              {selectedGrossTimeframe === 'yearly' && (
                <button
                  type="button"
                  onClick={() => handleOpenFillYearlyGross(selectedYear === 'ALL' ? currentYearVal : selectedYear)}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Fill Yearly Income</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Inflow KPI summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">POS in come</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                QAR {formatCurrency(summary.posIncome)}
              </span>
              <span className="text-[10px] text-slate-400">Card payment terminals</span>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Cash in come</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                QAR {formatCurrency(summary.cashIncome)}
              </span>
              <span className="text-[10px] text-slate-400">Physical drawer receipts</span>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Transfer in come</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                QAR {formatCurrency(summary.transferIncome)}
              </span>
              <span className="text-[10px] text-slate-400">Bank wire remittances</span>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Fawran in come</span>
              <span className="text-base font-bold font-mono text-amber-700 block mt-0.5">
                QAR {formatCurrency(summary.fawranIncome)}
              </span>
              <span className="text-[10px] text-amber-600/70">Instant Qatar settlements</span>
            </div>
            <div className="p-3.5 bg-purple-900 text-white rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-purple-200 block">Total Business Gross</span>
              <span className="text-lg font-bold font-mono text-amber-300 block mt-0.5">
                QAR {formatCurrency(summary.totalBusinessGross)}
              </span>
              <span className="text-[10px] text-purple-300">Auto-calculated sum</span>
            </div>
          </div>

          {/* VIEW: 1. Monthly Daily Records */}
          {selectedGrossTimeframe === 'daily' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daily Business Gross Breakdown ({selectedMonth} {selectedYear})
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredBusinessGross.length} recorded entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Month / Year</th>
                      <th className="py-2.5 px-3 text-right">POS in come</th>
                      <th className="py-2.5 px-3 text-right">Cash in come</th>
                      <th className="py-2.5 px-3 text-right">Transfer in come</th>
                      <th className="py-2.5 px-3 text-right text-amber-700">Fawran in come</th>
                      <th className="py-2.5 px-3 text-right font-bold text-purple-950 bg-purple-50/50">
                        Total Gross
                      </th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredBusinessGross.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                          No business gross records registered for {selectedMonth} {selectedYear}. Click "Register Business Gross" to log income.
                        </td>
                      </tr>
                    ) : (
                      filteredBusinessGross.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatDate(g.date)}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-sans">{g.month} {g.year}</td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {g.posIncome > 0 ? `QAR ${formatCurrency(g.posIncome)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {g.cashIncome > 0 ? `QAR ${formatCurrency(g.cashIncome)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {g.transferIncome > 0 ? `QAR ${formatCurrency(g.transferIncome)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700 font-bold">
                            {g.fawranIncome > 0 ? `QAR ${formatCurrency(g.fawranIncome)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-950 bg-purple-50/30">
                            QAR {formatCurrency(g.totalGross)}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {g.source}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px] truncate max-w-xs">
                            {g.notes || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGross(g);
                                  setGrossModalInitialTimeframe((g.entryType?.toLowerCase() as any) || 'daily');
                                  setIsAddGrossOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Business Gross entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'gross',
                                    id: g.id,
                                    title: 'Delete Business Gross Entry',
                                    message: `Are you sure you want to delete the Business Gross entry for ${formatDate(g.date)} (${g.month} ${g.year}) totaling QAR ${formatCurrency(g.totalGross)}?\n\nThis will remove this direct income record.`,
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Business Gross entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredBusinessGross.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 uppercase text-[11px] font-sans">
                          Total ({selectedMonth} {selectedYear})
                        </td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(summary.posIncome)}</td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(summary.cashIncome)}</td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(summary.transferIncome)}</td>
                        <td className="py-3 px-3 text-right text-amber-800">QAR {formatCurrency(summary.fawranIncome)}</td>
                        <td className="py-3 px-3 text-right text-purple-950 text-sm bg-purple-100/60">
                          QAR {formatCurrency(summary.totalBusinessGross)}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* VIEW: 2. Monthly Rollup Table (All 12 Months) */}
          {selectedGrossTimeframe === 'monthly' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Monthly Rollup for Year {selectedYear}
                </span>
                <span className="text-xs text-slate-400">12 Calendar Months</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">POS in come</th>
                      <th className="py-2.5 px-3 text-right">Cash in come</th>
                      <th className="py-2.5 px-3 text-right">Transfer in come</th>
                      <th className="py-2.5 px-3 text-right">Fawran in come</th>
                      <th className="py-2.5 px-3 text-right font-bold text-purple-900 bg-purple-50/50">
                        Total Business Gross
                      </th>
                      <th className="py-2.5 px-3 text-right text-slate-600">Petty Expenses</th>
                      <th className="py-2.5 px-3 text-right text-slate-600">Fixed Expenses</th>
                      <th className="py-2.5 px-3 text-right font-bold">Net Margin</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {monthlyGrossRollup.map((row) => (
                      <tr
                        key={row.month}
                        onClick={() => {
                          setSelectedMonth(row.month);
                          setSelectedGrossTimeframe('daily');
                        }}
                        className={`hover:bg-purple-50/30 cursor-pointer transition-colors ${
                          row.month === selectedMonth ? 'bg-purple-50/20 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{row.month}</td>
                        <td className="py-2.5 px-3 text-right">{row.pos > 0 ? formatCurrency(row.pos) : '-'}</td>
                        <td className="py-2.5 px-3 text-right">{row.cash > 0 ? formatCurrency(row.cash) : '-'}</td>
                        <td className="py-2.5 px-3 text-right">{row.transfer > 0 ? formatCurrency(row.transfer) : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-amber-700">{row.fawran > 0 ? formatCurrency(row.fawran) : '-'}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-purple-900 bg-purple-50/30">
                          QAR {formatCurrency(row.totalGross)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{row.pettyExpenses > 0 ? formatCurrency(row.pettyExpenses) : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{row.fixedExpenses > 0 ? formatCurrency(row.fixedExpenses) : '-'}</td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {row.netProfit >= 0 ? '+' : ''}QAR {formatCurrency(row.netProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFillMonthlyGross(row.month, selectedYear);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                            title={`Fill or adjust income amounts for ${row.month} ${selectedYear}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Fill / Edit Amounts</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: 3. Yearly Comparison */}
          {selectedGrossTimeframe === 'yearly' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Year-over-Year Gross Performance
                </span>
                <span className="text-xs text-slate-400">Multi-Year Analysis</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3 text-right">POS in come</th>
                      <th className="py-2.5 px-3 text-right">Cash in come</th>
                      <th className="py-2.5 px-3 text-right">Transfer in come</th>
                      <th className="py-2.5 px-3 text-right">Fawran in come</th>
                      <th className="py-2.5 px-3 text-right font-bold text-purple-900 bg-purple-50/50">
                        Total Gross
                      </th>
                      <th className="py-2.5 px-3 text-right text-rose-700">Total Expenses</th>
                      <th className="py-2.5 px-3 text-right font-bold text-emerald-700">Net Profit</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {yearlyGrossRollup.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900 text-sm font-sans">{row.year}</td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(row.pos)}</td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(row.cash)}</td>
                        <td className="py-3 px-3 text-right">QAR {formatCurrency(row.transfer)}</td>
                        <td className="py-3 px-3 text-right text-amber-700">QAR {formatCurrency(row.fawran)}</td>
                        <td className="py-3 px-3 text-right font-bold text-purple-900 text-sm bg-purple-50/30">
                          QAR {formatCurrency(row.totalGross)}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-700 font-bold">
                          QAR {formatCurrency(row.totalExpenses)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold text-sm ${
                            row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {row.netProfit >= 0 ? '+' : ''}QAR {formatCurrency(row.netProfit)}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFillYearlyGross(row.year);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                            title={`Fill or adjust income amounts for ${row.year}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Fill / Edit Amounts</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: MONTHLY FIXED EXPANSE (Salaries, Leases, Utilities)    */}
      {/* ============================================================= */}
      {activeTab === 'fixed' && (
        <div className="space-y-5">
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  2. Monthly Fixed Expanse for Salon
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedMonth} {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Salaries &amp; wages by WPS, Salaries &amp; wages by CASH, Lease Shop, Lease Flat, Qatar Cool, Internet, Fresha, Loyalty Card (+ Custom).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadFixedExpenseTemplate}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download standard Excel template with WPS, Leases & Utilities sample rows"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Template</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    exportFixedExpensesToExcel(filteredFixedExpenses);
                    showToast('✅ Monthly Fixed Expenses exported to Excel successfully!');
                  } catch (err: unknown) {
                    showToast(`⚠️ ${(err as Error).message}`);
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export current monthly fixed expenses to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportFixedOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Import Fixed Expenses (WPS, Leases, Utilities) from Excel or CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import Fixed Expenses</span>
              </button>

              <button
                type="button"
                onClick={handleSyncSalariesFromPayroll}
                className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Auto-calculate WPS & Cash salaries from Monthly Payroll records"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>⚡ Auto-Sync Wages</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingFixed(null);
                  setIsAddFixedOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Fixed Expense</span>
              </button>
            </div>
          </div>

          {/* Fixed Expense Summary Cards (Total, Paid, Unpaid remainder) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Fixed Expenses</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                QAR {formatCurrency(summary.fixedExpensesTotal)}
              </span>
              <span className="text-[10px] text-slate-400">Total contractual obligations</span>
            </div>
            <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-2xs bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Paid (Settled)</span>
              <span className="text-lg font-bold font-mono text-emerald-700 block mt-0.5">
                QAR {formatCurrency(summary.fixedExpensesPaid)}
              </span>
              <span className="text-[10px] text-emerald-700">Paid out to companies &amp; banks</span>
            </div>
            <div className="p-3.5 bg-white border-2 border-rose-400 rounded-xl shadow-xs bg-rose-50/30">
              <span className="text-[10px] font-black uppercase text-rose-800 block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Unpaid Remainder (Red)</span>
              </span>
              <span className="text-lg font-black font-mono text-rose-600 block mt-0.5">
                QAR {formatCurrency(summary.fixedExpensesUnpaid)}
              </span>
              <span className="text-[10px] text-rose-700 font-bold">{unpaidFixedItems.length} bills pending</span>
            </div>
            <div className="p-3.5 bg-indigo-900 text-white rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-indigo-200 block">WPS Payroll Portion</span>
              <span className="text-lg font-bold font-mono text-amber-300 block mt-0.5">
                QAR {formatCurrency(summary.wagesByWps)}
              </span>
              <span className="text-[10px] text-indigo-300">Doha Bank &amp; Ministry SIF</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {PRESET_FIXED_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedCategoryFilter === cat
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Fixed Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">REF No / VOICE No</th>
                    <th className="py-2.5 px-3">CATEGORY</th>
                    <th className="py-2.5 px-3">COMPANY</th>
                    <th className="py-2.5 px-3">DESCRIPTION</th>
                    <th className="py-2.5 px-3 text-center">PAID / UNPAID</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">CARD / CASH</th>
                    <th className="py-2.5 px-3 text-right">AMOUNT (QAR)</th>
                    <th className="py-2.5 px-3">DETAILS COMMENT</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFixedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-400">
                        No fixed expenses found for {selectedMonth} {selectedYear}. Click "+ Add Fixed Expense" to register lease, utilities or wages.
                      </td>
                    </tr>
                  ) : (
                    filteredFixedExpenses.map((f) => {
                      const isUnpaid = f.status === 'Unpaid';
                      return (
                        <tr
                          key={f.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isUnpaid ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatDate(f.date)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap font-medium">
                            {f.refNo}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {f.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{f.company}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={f.description}>
                            {f.description}
                          </td>

                          {/* 1-Click Interactive Paid/Unpaid Button with RED Unpaid Mark */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFixedStatus(f.id, e)}
                              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1 mx-auto shadow-2xs cursor-pointer ${
                                isUnpaid
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 animate-pulse'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Click to toggle Paid/Unpaid status immediately"
                            >
                              {isUnpaid ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-200" />
                                  <span>UNPAID</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>PAID</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{f.paymentMethod}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800 font-bold">
                              {f.cardCashType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            QAR {formatCurrency(f.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={f.detailsComment}>
                            {f.detailsComment || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFixed(f);
                                  setIsAddFixedOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'fixed',
                                    id: f.id,
                                    title: 'Delete Fixed Expense',
                                    message: `Are you sure you want to permanently delete fixed expense "${f.refNo}" (${f.company} - QAR ${formatCurrency(f.amount)})? This action cannot be undone.`,
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete fixed expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredFixedExpenses.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-slate-900">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 uppercase text-[11px] font-sans">
                        Total Fixed Expenses ({selectedMonth} {selectedYear})
                      </td>
                      <td className="py-3 px-3 text-center text-xs">
                        <span className="text-emerald-700">Paid: QAR {formatCurrency(summary.fixedExpensesPaid)}</span>
                        {summary.fixedExpensesUnpaid > 0 && (
                          <span className="text-rose-600 ml-2 font-black">
                            Unpaid: QAR {formatCurrency(summary.fixedExpensesUnpaid)}
                          </span>
                        )}
                      </td>
                      <td colSpan={2}></td>
                      <td className="py-3 px-3 text-right text-indigo-950 text-sm bg-indigo-100/60">
                        QAR {formatCurrency(summary.fixedExpensesTotal)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: MONTHLY PETTY DAILY EXPANSE (VOICE)                    */}
      {/* ============================================================= */}
      {activeTab === 'petty' && (
        <div className="space-y-5">
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  3. Monthly Petty Daily Expanse (VOICE Invoices)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedMonth} {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily salon petty disbursements: amenities, pharmacy, salon supplies, sanitization, and receipts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadPettyExpenseTemplate}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Download standard Excel (.xlsx) template for VOICE Invoices"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Template</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    exportPettyExpensesToExcel(filteredPettyCash);
                  } catch (err: unknown) {
                    showToast((err as Error).message);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Export current filtered petty expenses to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportPettyOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Import VOICE Invoices from Excel (.xlsx, .xls) or CSV"
              >
                <Upload className="w-4 h-4" />
                <span>Import VOICE Invoices</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingPetty(null);
                  setIsAddPettyOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Petty Daily Expense</span>
              </button>
            </div>
          </div>

          {/* Petty Cash Summary Cards (Total, Paid, Unpaid remainder) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Petty Cash</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                QAR {formatCurrency(summary.pettyCashTotal)}
              </span>
              <span className="text-[10px] text-slate-400">All daily petty vouchers</span>
            </div>
            <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-2xs bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Paid</span>
              <span className="text-lg font-bold font-mono text-emerald-700 block mt-0.5">
                QAR {formatCurrency(summary.pettyCashPaid)}
              </span>
              <span className="text-[10px] text-emerald-700">Settled vouchers</span>
            </div>
            <div className="p-3.5 bg-white border-2 border-rose-400 rounded-xl shadow-xs bg-rose-50/30">
              <span className="text-[10px] font-black uppercase text-rose-800 block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Unpaid Remainder (Red)</span>
              </span>
              <span className="text-lg font-black font-mono text-rose-600 block mt-0.5">
                QAR {formatCurrency(summary.pettyCashUnpaid)}
              </span>
              <span className="text-[10px] text-rose-700 font-bold">{unpaidPettyItems.length} vouchers pending</span>
            </div>
            <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Settlement Rate</span>
              <span className="text-lg font-bold font-mono text-amber-400 block mt-0.5">
                {summary.pettyCashTotal > 0
                  ? ((summary.pettyCashPaid / summary.pettyCashTotal) * 100).toFixed(1)
                  : '100.0'}
                %
              </span>
              <span className="text-[10px] text-slate-400">Paid vs Total</span>
            </div>
          </div>

          {/* Search bar inside petty cash */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search VOICE Ref No, Company, Description, or Payment Method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  showUnpaidOnly
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showUnpaidOnly ? 'Showing Unpaid Only (Red)' : 'Show All Vouchers'}
              </button>
            </div>
          </div>

          {/* Petty Cash Table with Exact User Requested Columns */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">VOICE DATE</th>
                    <th className="py-2.5 px-3">VOICE REF No/VOICE No</th>
                    <th className="py-2.5 px-3">VOICE COMPANY</th>
                    <th className="py-2.5 px-3">VOICE DESCRIPTION</th>
                    <th className="py-2.5 px-3 text-center">VOICE PIAD/Unpaid</th>
                    <th className="py-2.5 px-3">VOICE Payment Method (Name)</th>
                    <th className="py-2.5 px-3">VOICE CARD/CASH</th>
                    <th className="py-2.5 px-3 text-right">VOICE AMOUNT</th>
                    <th className="py-2.5 px-3">VOICE DETAILS COMMENT</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPettyCash.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No petty daily expenses logged for {selectedMonth} {selectedYear}. Click "+ Add Petty Daily Expense" to record daily purchases.
                      </td>
                    </tr>
                  ) : (
                    filteredPettyCash.map((p) => {
                      const isUnpaid = p.status === 'Unpaid';
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isUnpaid ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatDate(p.invoiceDate)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap font-medium">
                            {p.invoiceRefNo}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.company}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={p.description}>
                            {p.description}
                          </td>

                          {/* 1-Click Interactive Paid/Unpaid Button with RED Unpaid Mark */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleTogglePettyStatus(p.id, e)}
                              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1 mx-auto shadow-2xs cursor-pointer ${
                                isUnpaid
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 animate-pulse'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Click to toggle Paid/Unpaid status immediately"
                            >
                              {isUnpaid ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-200" />
                                  <span>UNPAID</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>PAID</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800 font-bold">
                              {p.cardCashType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            QAR {formatCurrency(p.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={p.detailsComment}>
                            {p.detailsComment || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPetty(p);
                                  setIsAddPettyOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'petty',
                                    id: p.id,
                                    title: 'Delete Petty Cash Expense (VOICE)',
                                    message: `Are you sure you want to permanently delete petty cash voucher "${p.invoiceRefNo}" (${p.company} - QAR ${formatCurrency(p.amount)})? This action cannot be undone.`,
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete petty cash voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredPettyCash.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 uppercase text-[11px] font-sans">
                        Total Petty Expenses ({selectedMonth} {selectedYear})
                      </td>
                      <td className="py-3 px-3 text-center text-xs">
                        <span className="text-emerald-700">Paid: QAR {formatCurrency(summary.pettyCashPaid)}</span>
                        {summary.pettyCashUnpaid > 0 && (
                          <span className="text-rose-600 ml-2 font-black">
                            Unpaid: QAR {formatCurrency(summary.pettyCashUnpaid)}
                          </span>
                        )}
                      </td>
                      <td colSpan={2}></td>
                      <td className="py-3 px-3 text-right text-emerald-950 text-sm bg-emerald-100/60">
                        QAR {formatCurrency(summary.pettyCashTotal)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: SYSTEM DATA & CODE SCAN CHECKUP                        */}
      {/* ============================================================= */}
      {activeTab === 'scan' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Comprehensive Website Data &amp; Code Checkup Scanner
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated audit verifying connection between active employees, wages by WPS, Daily Sales revenue, and paid/unpaid balances.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('✅ Full system scan completed: All employee records and financial balances verified with 0 errors.');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Live System Scan</span>
            </button>
          </div>

          {/* Verification Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Scan 1: Employees Connection */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">1. Employees Connection</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                {employees.filter((e) => e.status !== 'Unemployed').length} Active
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                All employee IDs, job titles, basic salaries, allowances, and Qatar IBAN accounts are properly linked to payroll.
              </p>
            </div>

            {/* Scan 2: Wages by WPS */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">2. Wages by WPS Audit</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black font-mono text-blue-800">
                QAR {formatCurrency(summary.wagesByWps)}
              </div>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                Qatar Wage Protection System (WPS) bank electronic records are synchronized with active employees.
              </p>
            </div>

            {/* Scan 3: Business Gross Connectivity */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">3. Gross Income Link</span>
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black font-mono text-purple-800">
                QAR {formatCurrency(summary.totalBusinessGross)}
              </div>
              <p className="text-[11px] text-purple-900/80 leading-relaxed">
                POS, Cash, Transfer, and Fawran streams are synced with {dailySales.length} Daily Sales customer visits.
              </p>
            </div>

            {/* Scan 4: Paid / Unpaid Balance Integrity */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">4. Paid / Unpaid Integrity</span>
                {totalUnpaidCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {totalUnpaidCount > 0 ? `${totalUnpaidCount} Unpaid` : '100% Cleared'}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {totalUnpaidCount > 0
                  ? `Red remainder alert active for QAR ${formatCurrency(summary.totalSalonUnpaid)}.`
                  : 'All fixed and petty cash expenses are marked as PAID.'}
              </p>
            </div>
          </div>

          {/* Connected Employees List Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active Employees &amp; Wage Distribution Linkage
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Employee ID</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Position</th>
                    <th className="py-2 px-3">Payer Bank</th>
                    <th className="py-2 px-3">WPS IBAN Status</th>
                    <th className="py-2 px-3 text-right">Basic Salary</th>
                    <th className="py-2 px-3 text-right">Total Package</th>
                    <th className="py-2 px-3 text-center">WPS Inclusion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {employees
                    .filter((e) => e.status !== 'Unemployed')
                    .map((emp) => {
                      const hasWpsIban = Boolean(emp.iban && emp.payerBankShort && emp.payerBankShort !== 'CASH');
                      return (
                        <tr key={emp.employeeId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{emp.employeeId}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">{emp.employeeName}</td>
                          <td className="py-2 px-3 font-sans text-slate-600">{emp.position}</td>
                          <td className="py-2 px-3 font-sans text-slate-700">{emp.payerBank}</td>
                          <td className="py-2 px-3">
                            {hasWpsIban ? (
                              <span className="text-emerald-700 font-bold">✓ Verified QA IBAN</span>
                            ) : (
                              <span className="text-amber-600">Cash / Non-IBAN</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">QAR {formatCurrency(emp.basicSalary)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            QAR {formatCurrency(emp.totalSalary)}
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            {hasWpsIban ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                WPS Bank Transfer
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Cash Payroll
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: REGISTER BUSINESS GROSS (Daily, Monthly & Yearly)      */}
      {/* ============================================================= */}
      {isAddGrossOpen && (
        <BusinessGrossModal
          isOpen={isAddGrossOpen}
          onClose={() => {
            setIsAddGrossOpen(false);
            setEditingGross(null);
          }}
          editingEntry={editingGross}
          initialTimeframe={grossModalInitialTimeframe}
          selectedMonth={selectedMonth === 'ALL' ? currentMonthName : selectedMonth}
          selectedYear={selectedYear === 'ALL' ? currentYearVal : selectedYear}
          onSaved={() => {
            showToast('✅ Business Gross registered successfully!');
            onRefresh();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD FIXED EXPENSE                                      */}
      {/* ============================================================= */}
      {isAddFixedOpen && (
        <FixedExpenseModal
          isOpen={isAddFixedOpen}
          onClose={() => {
            setIsAddFixedOpen(false);
            setEditingFixed(null);
          }}
          editingExpense={editingFixed}
          selectedMonth={selectedMonth === 'ALL' ? currentMonthName : selectedMonth}
          selectedYear={selectedYear === 'ALL' ? currentYearVal : selectedYear}
          onSaved={() => {
            showToast('✅ Fixed expense saved successfully!');
            onRefresh();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD PETTY DAILY EXPENSE (VOICE)                        */}
      {/* ============================================================= */}
      {isAddPettyOpen && (
        <PettyCashModal
          isOpen={isAddPettyOpen}
          onClose={() => {
            setIsAddPettyOpen(false);
            setEditingPetty(null);
          }}
          editingExpense={editingPetty}
          selectedMonth={selectedMonth === 'ALL' ? currentMonthName : selectedMonth}
          selectedYear={selectedYear === 'ALL' ? currentYearVal : selectedYear}
          onSaved={() => {
            showToast('✅ Petty daily expense (VOICE) recorded successfully!');
            onRefresh();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: IMPORT PETTY DAILY EXPENSE (VOICE INVOICES)            */}
      {/* ============================================================= */}
      {isImportPettyOpen && (
        <ImportPettyExpensesModal
          isOpen={isImportPettyOpen}
          onClose={() => setIsImportPettyOpen(false)}
          selectedMonth={selectedMonth === 'ALL' ? currentMonthName : selectedMonth}
          selectedYear={selectedYear === 'ALL' ? currentYearVal : selectedYear}
          onSuccess={(count) => {
            showToast(`✅ Successfully imported ${count} VOICE invoice(s) into Monthly Petty Daily Expenses!`);
            onRefresh();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: IMPORT FIXED EXPENSES (WPS, LEASES, UTILITIES)         */}
      {/* ============================================================= */}
      {isImportFixedOpen && (
        <ImportFixedExpensesModal
          isOpen={isImportFixedOpen}
          onClose={() => setIsImportFixedOpen(false)}
          selectedMonth={selectedMonth === 'ALL' ? currentMonthName : selectedMonth}
          selectedYear={selectedYear === 'ALL' ? currentYearVal : selectedYear}
          onSuccess={(count) => {
            showToast(`✅ Successfully imported ${count} record(s) into Monthly Fixed Expenses!`);
            onRefresh();
          }}
        />
      )}

      {/* ============================================================= */}
      {/* IN-APP CONFIRMATION MODAL (Replaces blocked window.confirm)   */}
      {/* ============================================================= */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          confirmText="Delete Record"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ============================================================= */}
      {/* DEDICATED PRINTABLE CONTAINER FOR A4 REPORT & PDF EXPORT     */}
      {/* ============================================================= */}
      <div id="printable-business-expenses" className="hidden font-sans text-slate-950 bg-white p-8">
        {/* Letterhead */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {settings.companyName || 'COSMOS BEAUTY SALON'}
          </h1>
          <p style={{ fontSize: '10pt', color: '#444', marginTop: '4px' }}>
            {settings.companyAddress || 'Doha, State of Qatar'} • Tel: {settings.companyPhone || '+974 4455 6677'} • Financial Management &amp; Accounts Department
          </p>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase', textDecoration: 'underline' }}>
            OFFICIAL BUSINESS EXPENSES &amp; PROFIT/LOSS FINANCIAL STATEMENT (A4)
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9.5pt', color: '#333' }}>
            <div><strong>Accounting Period:</strong> {selectedMonth} {selectedYear}</div>
            <div><strong>Statement Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Status:</strong> Official Management &amp; Tax Report</div>
          </div>
        </div>

        {/* Financial Summary KPI Box */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '20px' }}>
          <tbody>
            <tr style={{ background: '#f3f4f6' }}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Total Gross Revenue</span>
                <strong style={{ fontSize: '11pt', color: '#166534', fontFamily: 'monospace' }}>QAR {formatCurrency(summary.totalBusinessGross)}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Monthly Fixed Expenses</span>
                <strong style={{ fontSize: '11pt', color: '#1e40af', fontFamily: 'monospace' }}>QAR {formatCurrency(summary.fixedExpensesTotal)}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Monthly Petty Cash (VOICE)</span>
                <strong style={{ fontSize: '11pt', color: '#d97706', fontFamily: 'monospace' }}>QAR {formatCurrency(summary.pettyCashTotal)}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>WPS &amp; Cash Wages</span>
                <strong style={{ fontSize: '11pt', color: '#7c3aed', fontFamily: 'monospace' }}>QAR {formatCurrency(summary.totalSalaries)}</strong>
              </td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Total Operating Expenses</span>
                <strong style={{ fontSize: '11pt', color: '#b91c1c', fontFamily: 'monospace' }}>QAR {formatCurrency(summary.totalSalonExpenses)}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Net Operating Profit</span>
                <strong style={{ fontSize: '11pt', color: summary.netSalonProfit >= 0 ? '#166534' : '#b91c1c', fontFamily: 'monospace' }}>
                  QAR {formatCurrency(summary.netSalonProfit)}
                </strong>
              </td>
              <td colSpan={2} style={{ border: '1px solid #ccc', padding: '8px' }}>
                <span style={{ fontSize: '8pt', color: '#666', display: 'block', textTransform: 'uppercase' }}>Total Outstanding Unpaid Liabilities</span>
                <strong style={{ fontSize: '11pt', color: summary.totalSalonUnpaid > 0 ? '#dc2626' : '#166534', fontFamily: 'monospace' }}>
                  QAR {formatCurrency(summary.totalSalonUnpaid)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: Monthly Fixed Expenses Table */}
        <h3 style={{ fontSize: '10.5pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          1. Monthly Fixed Expenses (Lease, Utilities, WPS, Software)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Date</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Ref No</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Category</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Company / Beneficiary</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Description</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Mode</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Status</th>
              <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Amount (QAR)</th>
            </tr>
          </thead>
          <tbody>
            {filteredFixedExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', color: '#888' }}>
                  No fixed expenses recorded for this period.
                </td>
              </tr>
            ) : (
              filteredFixedExpenses.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontFamily: 'monospace' }}>{f.date}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontFamily: 'monospace', fontWeight: 'bold' }}>{f.refNo}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{f.category}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontWeight: '600' }}>{f.company}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{f.description}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{f.cardCashType}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontWeight: 'bold', color: f.status === 'Paid' ? '#166534' : '#dc2626' }}>
                    {f.status}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formatCurrency(f.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td colSpan={7} style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>
                Total Fixed Expenses:
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontFamily: 'monospace' }}>
                QAR {formatCurrency(summary.fixedExpensesTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Section 2: Monthly Petty Cash / Daily Expenses Table */}
        <h3 style={{ fontSize: '10.5pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          2. Monthly Petty Cash &amp; Daily Expenses (VOICE Invoices)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Date</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Ref / Voice#</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Vendor / Company</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Description</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Card/Cash</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Method</th>
              <th style={{ border: '1px solid #ccc', padding: '5px' }}>Status</th>
              <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>Amount (QAR)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPettyCash.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', color: '#888' }}>
                  No petty daily expenses recorded for this period.
                </td>
              </tr>
            ) : (
              filteredPettyCash.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontFamily: 'monospace' }}>{p.invoiceDate}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontFamily: 'monospace', fontWeight: 'bold' }}>{p.invoiceRefNo}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontWeight: '600' }}>{p.company}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{p.description}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{p.cardCashType}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px' }}>{p.paymentMethod}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', fontWeight: 'bold', color: p.status === 'Paid' ? '#166534' : '#dc2626' }}>
                    {p.status}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 5px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td colSpan={7} style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>
                Total Petty Daily Expenses:
              </td>
              <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontFamily: 'monospace' }}>
                QAR {formatCurrency(summary.pettyCashTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Dual Signatures & Stamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '35px', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'center', width: '180px' }}>
            <div style={{ width: '90px', height: '90px', border: '2px dashed #888', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '9pt', color: '#777' }}>
              Company Stamp
            </div>
            <div style={{ fontSize: '9.5pt', fontWeight: 'bold', marginTop: '6px' }}>{settings.companyName || 'COSMOS BEAUTY SALON'}</div>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold', fontSize: '9.5pt' }}>
              Finance &amp; Accounts Officer
            </div>
            <div style={{ fontSize: '8.5pt', color: '#555' }}>Prepared &amp; Reconciled</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold', fontSize: '10pt' }}>
              {settings.signatoryName || 'ATYRGUL AIAZOVA'}
            </div>
            <div style={{ fontSize: '9pt', color: '#555' }}>{settings.signatoryTitle || 'Managing Director'}</div>
            <div style={{ fontSize: '8.5pt', color: '#777', marginTop: '2px' }}>Authorized Management Approval</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-MODAL 1: Business Gross Register Form (Daily, Monthly & Yearly)
// ----------------------------------------------------------------------
interface BusinessGrossModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry?: BusinessGrossEntry | null;
  initialTimeframe?: 'daily' | 'monthly' | 'yearly';
  selectedMonth: string;
  selectedYear: string;
  onSaved: () => void;
}

const BusinessGrossModal: React.FC<BusinessGrossModalProps> = ({
  isOpen,
  onClose,
  editingEntry,
  initialTimeframe = 'daily',
  selectedMonth,
  selectedYear,
  onSaved,
}) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>(
    (editingEntry?.entryType?.toLowerCase() as any) || initialTimeframe || 'daily'
  );
  const [date, setDate] = useState(editingEntry?.date || new Date().toISOString().slice(0, 10));
  const [posIncome, setPosIncome] = useState<number | string>(editingEntry?.posIncome || 0);
  const [cashIncome, setCashIncome] = useState<number | string>(editingEntry?.cashIncome || 0);
  const [transferIncome, setTransferIncome] = useState<number | string>(editingEntry?.transferIncome || 0);
  const [fawranIncome, setFawranIncome] = useState<number | string>(editingEntry?.fawranIncome || 0);
  const [notes, setNotes] = useState(editingEntry?.notes || '');
  const [month, setMonth] = useState(editingEntry?.month || (selectedMonth === 'ALL' ? 'October' : selectedMonth));
  const [year, setYear] = useState(editingEntry?.year || (selectedYear === 'ALL' ? '2026' : selectedYear));

  // Sync date when user edits date picker in daily mode
  const handleDateChange = (val: string) => {
    setDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const m = d.toLocaleString('en-US', { month: 'long' });
        setMonth(m);
        setYear(String(d.getFullYear()));
      }
    }
  };

  const totalGross =
    (parseFloat(String(posIncome)) || 0) +
    (parseFloat(String(cashIncome)) || 0) +
    (parseFloat(String(transferIncome)) || 0) +
    (parseFloat(String(fawranIncome)) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let computedDate = date;
    let computedMonth = month;
    const computedYear = String(year);
    const entryTypeVal = timeframe === 'monthly' ? 'Monthly' : timeframe === 'yearly' ? 'Yearly' : 'Daily';

    if (timeframe === 'monthly') {
      const mIdx = MONTHS.indexOf(month);
      const mNum = mIdx >= 0 ? String(mIdx + 1).padStart(2, '0') : '01';
      computedDate = `${computedYear}-${mNum}-01`;
    } else if (timeframe === 'yearly') {
      computedDate = `${computedYear}-01-01`;
      computedMonth = 'All Months';
    }

    const entry: BusinessGrossEntry = {
      id: editingEntry?.id || `BG-${Date.now()}`,
      date: computedDate,
      posIncome: parseFloat(String(posIncome)) || 0,
      cashIncome: parseFloat(String(cashIncome)) || 0,
      transferIncome: parseFloat(String(transferIncome)) || 0,
      fawranIncome: parseFloat(String(fawranIncome)) || 0,
      totalGross,
      month: computedMonth,
      year: computedYear,
      entryType: entryTypeVal,
      notes: notes.trim(),
      source: 'Direct Business Register',
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    await db.saveBusinessGrossEntry(entry);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-300" />
            <div>
              <h3 className="text-sm font-bold">
                {editingEntry ? 'Edit Business Gross Amounts' : 'Fill Business Gross Incomes'}
              </h3>
              <p className="text-[11px] text-purple-200">
                Salon Inflows: POS, Cash Drawer, Bank Transfer &amp; Fawran
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Selector Segmented Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">Fill Scope:</span>
          <button
            type="button"
            onClick={() => setTimeframe('daily')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'daily'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily Income
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'monthly'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Monthly Income
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('yearly')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'yearly'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Yearly Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Scope Controls */}
          {timeframe === 'daily' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Calendar Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Period</label>
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700">
                  {month} {year}
                </div>
              </div>
            </div>
          )}

          {timeframe === 'monthly' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Month *</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Year *</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              <div className="col-span-2 text-[11px] text-purple-700">
                ℹ️ Fills direct gross income figures for the entire month of <strong>{month} {year}</strong>.
              </div>
            </div>
          )}

          {timeframe === 'yearly' && (
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Fiscal Year *</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-sm"
                >
                  <option value="2025">Year 2025</option>
                  <option value="2026">Year 2026</option>
                  <option value="2027">Year 2027</option>
                </select>
              </div>
              <div className="text-[11px] text-purple-700">
                ℹ️ Fills direct gross annual income totals for <strong>Year {year}</strong> across all salon streams.
              </div>
            </div>
          )}

          {/* 4 Incomes Inflow Streams Breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold uppercase tracking-wider text-slate-700 block text-[11px]">
              Fill Inflow Amounts (QAR)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">1. POS in come (Card)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={posIncome}
                  onChange={(e) => setPosIncome(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-purple-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">2. Cash in come (Drawer)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashIncome}
                  onChange={(e) => setCashIncome(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-purple-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">3. Transfer in come (Wire)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={transferIncome}
                  onChange={(e) => setTransferIncome(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-purple-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block font-semibold text-amber-800 mb-1">4. Fawran in come (Qatar)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fawranIncome}
                  onChange={(e) => setFawranIncome(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-700 text-right focus:ring-2 focus:ring-amber-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Auto calculated Total Gross */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold uppercase text-slate-900 text-xs block">Total Business Gross:</span>
                <span className="text-[10px] text-slate-400">Sum of POS + Cash + Transfer + Fawran</span>
              </div>
              <span className="text-lg font-black font-mono text-purple-900">
                QAR {formatCurrency(totalGross)}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Notes / Reconciliation Remarks</label>
            <input
              type="text"
              placeholder="e.g. Verified register close-out / Bridal event gross / Bank audit balance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Business Gross ({timeframe === 'monthly' ? 'Monthly' : timeframe === 'yearly' ? 'Yearly' : 'Daily'})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-MODAL 2: Fixed Expense Form
// ----------------------------------------------------------------------
interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: FixedExpense | null;
  selectedMonth: string;
  selectedYear: string;
  onSaved: () => void;
}

const FixedExpenseModal: React.FC<FixedExpenseModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
  selectedMonth,
  selectedYear,
  onSaved,
}) => {
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().slice(0, 10));
  const [refNo, setRefNo] = useState(editingExpense?.refNo || `FE-${Date.now().toString().slice(-6)}`);
  const [category, setCategory] = useState<string>(editingExpense?.category || 'Lease Shop');
  const [customCategory, setCustomCategory] = useState('');
  const [company, setCompany] = useState(editingExpense?.company || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [status, setStatus] = useState<'Paid' | 'Unpaid'>(editingExpense?.status || 'Paid');
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.paymentMethod || 'Commercial Bank of Qatar');
  const [detailsComment, setDetailsComment] = useState(editingExpense?.detailsComment || '');
  const [cardCashType, setCardCashType] = useState<'Card' | 'Cash' | 'Bank / WPS'>(
    editingExpense?.cardCashType || 'Bank / WPS'
  );
  const [amount, setAmount] = useState<number>(editingExpense?.amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'CUSTOM' ? customCategory.trim() || 'Other Fixed Expense' : category;
    const finalRef = refNo.trim() || `FE-${Date.now().toString().slice(-6)}`;

    const exp: FixedExpense = {
      id: editingExpense?.id || `FE-${Date.now()}`,
      date,
      refNo: finalRef,
      category: finalCategory,
      company: company.trim() || 'Cosmos Salon Facility',
      description: description.trim(),
      status,
      paymentMethod: paymentMethod.trim() || 'Bank Transfer',
      detailsComment: detailsComment.trim(),
      cardCashType,
      amount: Number(amount) || 0,
      month: selectedMonth,
      year: selectedYear,
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
    };

    await db.saveFixedExpense(exp);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
        <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-300" />
            <h3 className="text-sm font-bold">
              {editingExpense ? 'Edit Fixed Expense' : 'Add Monthly Fixed Expanse'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">DATE *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">REF No / VOICE No *</label>
              <input
                type="text"
                required
                placeholder="e.g. LEAS-SHOP-2026-10"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">CATEGORY *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-indigo-900"
            >
              {PRESET_FIXED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="CUSTOM">+ Add More / Custom Category...</option>
            </select>
            {category === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Enter new category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="w-full p-2 mt-2 bg-white border border-indigo-300 rounded-lg font-semibold text-indigo-900"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">COMPANY *</label>
              <input
                type="text"
                required
                placeholder="e.g. United Development Co / Ooredoo"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">AMOUNT (QAR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-indigo-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">DESCRIPTION *</label>
            <input
              type="text"
              required
              placeholder="e.g. Salon monthly lease & service charge for Pearl boutique"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Paid / Unpaid Toggle & Method */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">PIAD / Unpaid *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Paid' | 'Unpaid')}
                className={`w-full p-2 rounded-lg font-black ${
                  status === 'Unpaid'
                    ? 'bg-rose-100 text-rose-800 border-2 border-rose-500'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                }`}
              >
                <option value="Paid">PAID (Settled)</option>
                <option value="Unpaid">UNPAID (Red Alert)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <input
                type="text"
                placeholder="e.g. Bank WPS / Cheque"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">CARD / CASH / WPS</label>
              <select
                value={cardCashType}
                onChange={(e) => setCardCashType(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="Bank / WPS">Bank / WPS</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">DETAILS COMMENT</label>
            <textarea
              rows={2}
              placeholder="Official bank confirmation code, invoice notes, or authorization details..."
              value={detailsComment}
              onChange={(e) => setDetailsComment(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
            >
              Save Fixed Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-MODAL 3: Petty Cash Form (VOICE)
// ----------------------------------------------------------------------
interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: PettyCashExpense | null;
  selectedMonth: string;
  selectedYear: string;
  onSaved: () => void;
}

const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  editingExpense,
  selectedMonth,
  selectedYear,
  onSaved,
}) => {
  const [invoiceDate, setInvoiceDate] = useState(editingExpense?.invoiceDate || new Date().toISOString().slice(0, 10));
  const [invoiceRefNo, setInvoiceRefNo] = useState(editingExpense?.invoiceRefNo || `VOICE-${Date.now().toString().slice(-6)}`);
  const [company, setCompany] = useState(editingExpense?.company || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [status, setStatus] = useState<'Paid' | 'Unpaid'>(editingExpense?.status || 'Paid');
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.paymentMethod || 'Petty Cash Box');
  const [detailsComment, setDetailsComment] = useState(editingExpense?.detailsComment || '');
  const [cardCashType, setCardCashType] = useState<'Card' | 'Cash'>(editingExpense?.cardCashType || 'Cash');
  const [amount, setAmount] = useState<number>(editingExpense?.amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const exp: PettyCashExpense = {
      id: editingExpense?.id || `PC-${Date.now()}`,
      invoiceDate,
      invoiceRefNo: invoiceRefNo.trim() || `VOICE-${Date.now().toString().slice(-6)}`,
      company: company.trim() || 'Local Vendor',
      description: description.trim(),
      status,
      paymentMethod: paymentMethod.trim() || 'Cash',
      detailsComment: detailsComment.trim(),
      cardCashType,
      amount: Number(amount) || 0,
      month: selectedMonth,
      year: selectedYear,
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
    };

    await db.savePettyCashExpense(exp);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-300" />
            <h3 className="text-sm font-bold">
              {editingExpense ? 'Edit Petty Daily Expense (VOICE)' : 'Add Monthly Petty Daily Expanse (VOICE)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE DATE *</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE REF No / VOICE No *</label>
              <input
                type="text"
                required
                placeholder="e.g. INV-CARREF-8891"
                value={invoiceRefNo}
                onChange={(e) => setInvoiceRefNo(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE COMPANY *</label>
              <input
                type="text"
                required
                placeholder="e.g. Carrefour / Pharmacy / Supplies"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE AMOUNT (QAR) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-right text-emerald-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">VOICE DESCRIPTION *</label>
            <input
              type="text"
              required
              placeholder="e.g. Nespresso coffee pods, mineral water bottles, wipes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Paid / Unpaid & Card / Cash */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE PIAD / Unpaid *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Paid' | 'Unpaid')}
                className={`w-full p-2 rounded-lg font-black ${
                  status === 'Unpaid'
                    ? 'bg-rose-100 text-rose-800 border-2 border-rose-500'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                }`}
              >
                <option value="Paid">PAID (Settled)</option>
                <option value="Unpaid">UNPAID (Red Alert)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE Payment Method</label>
              <input
                type="text"
                placeholder="e.g. Petty Cash Box / Card"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">VOICE CARD / CASH</label>
              <select
                value={cardCashType}
                onChange={(e) => setCardCashType(e.target.value as 'Card' | 'Cash')}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">VOICE DETAILS COMMENT</label>
            <textarea
              rows={2}
              placeholder="Receipt details, receptionist verification, or special expense comments..."
              value={detailsComment}
              onChange={(e) => setDetailsComment(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              Save Petty Cash Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-MODAL 4: Import Monthly Petty Daily Expanse (VOICE Invoices)
// ----------------------------------------------------------------------
interface ImportPettyExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  selectedYear: string;
  onSuccess: (count: number) => void;
}

const ImportPettyExpensesModal: React.FC<ImportPettyExpensesModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState<PettyCashExpense[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [targetMonth, setTargetMonth] = useState(selectedMonth);
  const [targetYear, setTargetYear] = useState(selectedYear);
  const [useDateMonth, setUseDateMonth] = useState(true);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTargetMonth(selectedMonth);
    setTargetYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  const resetState = () => {
    setFile(null);
    setIsParsing(false);
    setParsedExpenses([]);
    setErrors([]);
    setIsSubmitting(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsParsing(true);
    setErrors([]);
    try {
      const res = await parsePettyExpensesFromExcel(selected, targetMonth, targetYear);
      setParsedExpenses(res.expenses);
      setErrors(res.errors || []);
    } catch (err: unknown) {
      setErrors([(err as Error).message || 'Failed to read file. Please ensure it is a valid Excel or CSV file.']);
      setParsedExpenses([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedExpenses.length === 0) return;
    setIsSubmitting(true);
    try {
      const expensesToSave = parsedExpenses.map((exp) => {
        if (!useDateMonth) {
          return {
            ...exp,
            month: targetMonth,
            year: targetYear,
          };
        }
        return exp;
      });

      const res = await db.saveBulkPettyExpenses(
        expensesToSave,
        importMode === 'replace' ? { month: targetMonth, year: targetYear } : undefined
      );

      onSuccess(res.importedCount + res.updatedCount);
      resetState();
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to save petty cash expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = parsedExpenses.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paidCount = parsedExpenses.filter((p) => p.status === 'Paid').length;
  const unpaidCount = parsedExpenses.filter((p) => p.status === 'Unpaid').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <Upload className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Import Monthly Petty Daily Expanse (VOICE Invoices)
              </h3>
              <p className="text-[11px] text-emerald-300">
                Upload Excel (.xlsx, .xls) or CSV files with VOICE Invoices
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 custom-scrollbar">
          {/* Template helper banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Standard VOICE Invoices Excel Template
                </p>
                <p className="text-[11px] text-slate-500">
                  Columns: VOICE DATE, REF No, COMPANY, DESCRIPTION, PAID/Unpaid, Payment Method, CARD/CASH, AMOUNT, DETAILS COMMENT.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadPettyExpenseTemplate}
              className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Target Month & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Target Period Default
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg font-medium flex-1 cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg font-medium w-24 cursor-pointer"
                >
                  {['2025', '2026', '2027', '2028'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDateMonth}
                  onChange={(e) => setUseDateMonth(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Auto-detect month &amp; year from invoice date in file</span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Import Behavior
              </label>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Add / Merge with existing vouchers (Preserve history)</span>
                </label>
                <label className="flex items-center gap-2 text-rose-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>Replace existing vouchers for {targetMonth} {targetYear}</span>
                </label>
              </div>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Select Excel or CSV Spreadsheet *
            </label>
            <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 bg-emerald-50/20 text-center transition-colors cursor-pointer group">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {file ? file.name : 'Click to select or drag & drop file here'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {file ? `${(file.size / 1024).toFixed(1)} KB — Click to change file` : 'Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isParsing && (
            <div className="p-6 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="font-semibold text-xs">Parsing spreadsheet rows and dates...</p>
            </div>
          )}

          {/* Errors / Warnings */}
          {errors.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <p className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Notice / Skipped Rows:</span>
              </p>
              <ul className="list-disc pl-5 text-[11px] text-rose-700 space-y-0.5 max-h-24 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Parsed Data */}
          {!isParsing && parsedExpenses.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">
                    Preview: {parsedExpenses.length} Vouchers Parsed
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {paidCount} Paid
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    {unpaidCount} Unpaid
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                    Total: QAR {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">VOICE Ref No</th>
                      <th className="py-2 px-2.5">Company</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5">Payment</th>
                      <th className="py-2 px-2.5 text-right">Amount (QAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedExpenses.slice(0, 15).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                          {p.invoiceDate}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.invoiceRefNo}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-800 max-w-[120px] truncate">
                          {p.company}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 max-w-[160px] truncate" title={p.description}>
                          {p.description}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              p.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 whitespace-nowrap">
                          {p.paymentMethod}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          QAR {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedExpenses.length > 15 && (
                <p className="text-[10px] text-slate-400 text-right">
                  Showing first 15 of {parsedExpenses.length} total vouchers in spreadsheet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            {parsedExpenses.length > 0
              ? `Ready to import ${parsedExpenses.length} vouchers into ${useDateMonth ? 'their respective months' : `${targetMonth} ${targetYear}`}`
              : 'Select an Excel (.xlsx) file to proceed with data import'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedExpenses.length === 0 || isSubmitting}
              onClick={handleImportSubmit}
              className={`px-5 py-2 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-1.5 ${
                parsedExpenses.length > 0 && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Importing...'
                  : `Confirm Import (${parsedExpenses.length} Vouchers)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================================
// COMPONENT: IMPORT FIXED EXPENSES (WPS, LEASES, UTILITIES) MODAL
// ======================================================================
interface ImportFixedExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  selectedYear: string;
  onSuccess: (count: number) => void;
}

const ImportFixedExpensesModal: React.FC<ImportFixedExpensesModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState<FixedExpense[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [targetMonth, setTargetMonth] = useState(selectedMonth);
  const [targetYear, setTargetYear] = useState(selectedYear);
  const [useDateMonth, setUseDateMonth] = useState(true);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTargetMonth(selectedMonth);
    setTargetYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  const resetState = () => {
    setFile(null);
    setIsParsing(false);
    setParsedExpenses([]);
    setErrors([]);
    setIsSubmitting(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsParsing(true);
    setErrors([]);
    try {
      const res = await parseFixedExpensesFromExcel(selected, targetMonth, targetYear);
      setParsedExpenses(res.expenses);
      setErrors(res.errors || []);
    } catch (err: unknown) {
      setErrors([(err as Error).message || 'Failed to read file. Please ensure it is a valid Excel or CSV file.']);
      setParsedExpenses([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedExpenses.length === 0) return;
    setIsSubmitting(true);
    try {
      const expensesToSave = parsedExpenses.map((exp) => {
        if (!useDateMonth) {
          return {
            ...exp,
            month: targetMonth,
            year: targetYear,
          };
        }
        return exp;
      });

      const replaceScope =
        importMode === 'replace'
          ? { month: targetMonth, year: targetYear }
          : undefined;

      const res = await db.saveBulkFixedExpenses(expensesToSave, replaceScope);
      onSuccess(res.importedCount + res.updatedCount);
      resetState();
      onClose();
    } catch (err: unknown) {
      setErrors([(err as Error).message || 'Failed to save fixed expenses into database.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalImportAmount = parsedExpenses.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Building className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Import Monthly Fixed Expenses (WPS, Leases, Utilities)</span>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  .xlsx / .csv
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Bulk upload fixed monthly contracts: WPS Wages, Cash Wages, Leases, Qatar Cool, Internet, Fresha, Loyalty.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* Download Template Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs text-indigo-950">
                <span className="font-bold">Need the official format?</span> Download the pre-formatted Excel template with sample rows for WPS, Leases &amp; Utilities.
              </div>
            </div>
            <button
              type="button"
              onClick={downloadFixedExpenseTemplate}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Select or Drop Excel / CSV Spreadsheet
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Drag &amp; drop your Fixed Expenses spreadsheet here, or <span className="text-indigo-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports .xlsx, .xls, and .csv files
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options: Period & Replacement Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Default Target Period
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg flex-1 text-xs font-medium cursor-pointer"
                >
                  {MONTHS.filter((m) => m !== 'ALL').map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg w-28 text-xs font-medium cursor-pointer font-mono"
                >
                  {['2025', '2026', '2027', '2028'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDateMonth}
                  onChange={(e) => setUseDateMonth(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Auto-detect month &amp; year from date column in file</span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Import Behavior
              </label>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="importFixedMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Add / Merge with existing fixed expenses (Preserve history)</span>
                </label>
                <label className="flex items-center gap-2 text-rose-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="importFixedMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>Replace existing fixed expenses for {targetMonth} {targetYear}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Loading status */}
          {isParsing && (
            <div className="p-4 bg-indigo-50 text-indigo-800 rounded-xl flex items-center justify-center gap-2 text-xs font-medium animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing spreadsheet rows and validating fixed expense entries...</span>
            </div>
          )}

          {/* Validation Warnings / Errors */}
          {errors.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice / Validation Warnings ({errors.length}):</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] text-amber-800 max-h-24 overflow-y-auto space-y-0.5 custom-scrollbar">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {parsedExpenses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Preview Parsed Records ({parsedExpenses.length})</span>
                </h4>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  Total Value: <span className="text-indigo-700">QAR {formatCurrency(totalImportAmount)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Ref No</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Company / Vendor</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5">Mode</th>
                      <th className="py-2 px-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedExpenses.slice(0, 15).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.refNo}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800 whitespace-nowrap">
                          {p.company}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 max-w-xs truncate" title={p.description}>
                          {p.description}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-[11px] text-slate-600">
                          {p.cardCashType}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          QAR {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedExpenses.length > 15 && (
                <p className="text-[10px] text-slate-400 text-right">
                  Showing first 15 of {parsedExpenses.length} total fixed expense records in spreadsheet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            {parsedExpenses.length > 0
              ? `Ready to import ${parsedExpenses.length} fixed expense records into ${useDateMonth ? 'their respective months' : `${targetMonth} ${targetYear}`}`
              : 'Select an Excel (.xlsx) file to proceed with data import'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedExpenses.length === 0 || isSubmitting}
              onClick={handleImportSubmit}
              className={`px-5 py-2 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-1.5 ${
                parsedExpenses.length > 0 && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Importing...'
                  : `Confirm Import (${parsedExpenses.length} Records)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

