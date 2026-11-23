import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  Scissors,
  ShoppingBag,
  Car,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  DailySaleRecord,
  Employee,
  Customer,
  ServiceCatalogueItem,
  SystemSettings,
  CommissionSyncStatus,
} from '../types';
import { db, formatCurrency, formatDate } from '../services/db';
import { exportDailySalesToExcel } from '../services/excel';
import { RegisterSaleModal } from './RegisterSaleModal';
import { ReceiptModal } from './ReceiptModal';
import { PrintDailyReportModal } from './PrintDailyReportModal';
import { RefundModal } from './RefundModal';
import { CustomerDirectoryModal } from './CustomerDirectoryModal';
import { ServiceCatalogueModal } from './ServiceCatalogueModal';
import { MonthlyCommissionTransferModal } from './MonthlyCommissionTransferModal';
import { ConfirmModal } from './ConfirmModal';

interface DailySalesReportViewProps {
  sales: DailySaleRecord[];
  employees: Employee[];
  customers: Customer[];
  catalogue: ServiceCatalogueItem[];
  settings: SystemSettings;
  onRefresh: () => void;
  onOpenEmployee?: (empId: string) => void;
}

export const DailySalesReportView: React.FC<DailySalesReportViewProps> = ({
  sales,
  employees,
  customers,
  catalogue,
  settings,
  onRefresh,
  onOpenEmployee,
}) => {
  // Filters State
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');

  // Row expansion
  const [expandedSaleIds, setExpandedSaleIds] = useState<string[]>([]);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DailySaleRecord | null>(null);
  const [receiptSale, setReceiptSale] = useState<DailySaleRecord | null>(null);
  const [refundSale, setRefundSale] = useState<DailySaleRecord | null>(null);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isCustomerDirectoryOpen, setIsCustomerDirectoryOpen] = useState(false);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [showCommissionBanner, setShowCommissionBanner] = useState(true);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [syncMonthYear, setSyncMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isRecalculatingSync, setIsRecalculatingSync] = useState(false);
  const [syncStatusOverride, setSyncStatusOverride] = useState<CommissionSyncStatus | null>(null);

  // Delete Confirmation & Bulk Selection State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    saleId?: string;
    srCode?: string;
    customerName?: string;
    isBulk?: boolean;
  } | null>(null);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const monthlySummary = useMemo(() => {
    return db.getMonthlyCommissions(syncMonthYear);
  }, [sales, syncMonthYear, employees]);

  const syncStatus = syncStatusOverride || monthlySummary.syncStatus;

  const handleRecalculateMonthly = async () => {
    setIsRecalculatingSync(true);
    setSyncStatusOverride('Calculating Monthly Totals');
    try {
      await new Promise((res) => setTimeout(res, 300));
      const updated = await db.recalculateMonthlyTotals(syncMonthYear);
      setSyncStatusOverride(updated.syncStatus === 'Needs Attention' ? 'Needs Attention' : 'Synced');
      onRefresh();
    } catch {
      setSyncStatusOverride('Needs Attention');
    } finally {
      setIsRecalculatingSync(false);
    }
  };

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'Unemployed'),
    [employees]
  );

  // Compute date boundaries
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Date Filter
      if (datePreset === 'today') {
        if (sale.date !== todayStr) return false;
      } else if (datePreset === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (sale.date !== yStr) return false;
      } else if (datePreset === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenStr = sevenDaysAgo.toISOString().slice(0, 10);
        if (sale.date < sevenStr || sale.date > todayStr) return false;
      } else if (datePreset === 'month') {
        const currentMonthPrefix = todayStr.slice(0, 7);
        if (!sale.date.startsWith(currentMonthPrefix)) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate && sale.date < customStartDate) return false;
        if (customEndDate && sale.date > customEndDate) return false;
      }

      // 2. Employee Filter
      if (selectedEmployee) {
        const hasService = sale.services.some(
          (s) => s.employeeId === selectedEmployee || s.sharedWithEmployeeId === selectedEmployee
        );
        const hasProduct = sale.products.some((p) => p.employeeId === selectedEmployee);
        if (!hasService && !hasProduct) return false;
      }

      // 3. Search (Customer Name, Mobile, Sr#)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sale.customerName.toLowerCase().includes(q);
        const matchMobile = sale.mobileNumber.includes(q);
        const matchSr = sale.srCode.toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchSr) return false;
      }

      // 4. Category Filter
      if (selectedCategory) {
        const hasCategory = sale.services.some((s) => s.category === selectedCategory);
        if (!hasCategory) return false;
      }

      // 5. Payment Mode Filter
      if (selectedPaymentMode) {
        if (selectedPaymentMode === 'POS Card' && (!sale.posCard || sale.posCard <= 0)) return false;
        if (selectedPaymentMode === 'Cash' && (!sale.cash || sale.cash <= 0)) return false;
        if (selectedPaymentMode === 'Fawran' && (!sale.fawran || sale.fawran <= 0)) return false;
        if (selectedPaymentMode === 'Unpaid' && (!sale.unpaid || sale.unpaid <= 0)) return false;
        if (selectedPaymentMode === 'Refunded' && (!sale.refunds || sale.refunds <= 0)) return false;
      }

      return true;
    });
  }, [
    sales,
    datePreset,
    customStartDate,
    customEndDate,
    selectedEmployee,
    searchQuery,
    selectedCategory,
    selectedPaymentMode,
    todayStr,
  ]);

  // Aggregate 10 KPI summary metrics
  const summary = useMemo(() => {
    let serviceSales = 0;
    let productSales = 0;
    let businessGross = 0;
    let posCard = 0;
    let cash = 0;
    let fawran = 0;
    let tips = 0;
    let unpaid = 0;
    let refunds = 0;
    let netSales = 0;

    filteredSales.forEach((s) => {
      serviceSales += Number(s.totalServiceAmount) || 0;
      productSales += Number(s.totalProductAmount) || 0;
      businessGross += Number(s.grossSales) || 0;
      posCard += Number(s.posCard) || 0;
      cash += Number(s.cash) || 0;
      fawran += Number(s.fawran) || 0;
      tips += Number(s.tips) || 0;
      unpaid += Number(s.unpaid) || 0;
      refunds += Number(s.refunds) || 0;
      netSales += Number(s.netSales) || 0;
    });

    return {
      serviceSales,
      productSales,
      businessGross,
      posCard,
      cash,
      fawran,
      tips,
      unpaid,
      refunds,
      netSales,
    };
  }, [filteredSales]);

  // Expand / collapse row
  const toggleExpand = (saleId: string) => {
    setExpandedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  // Actions
  const handleOpenAdd = () => {
    setEditingSale(null);
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (sale: DailySaleRecord) => {
    setEditingSale(sale);
    setIsRegisterOpen(true);
  };

  const handleToggleSelectAll = () => {
    if (filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(filteredSales.map((s) => s.saleId));
    }
  };

  const handleToggleSelectSale = (saleId: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  const handleDelete = (saleId: string, srCode: string, customerName?: string) => {
    setDeleteConfirm({
      isOpen: true,
      saleId,
      srCode,
      customerName,
      isBulk: false,
    });
  };

  const handleBulkDelete = () => {
    if (selectedSaleIds.length === 0) return;
    setDeleteConfirm({
      isOpen: true,
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.isBulk) {
        const count = selectedSaleIds.length;
        for (const id of selectedSaleIds) {
          await db.deleteDailySale(id);
        }
        setSelectedSaleIds([]);
        showToast(`Successfully deleted ${count} customer visit transaction(s).`);
      } else if (deleteConfirm.saleId) {
        await db.deleteDailySale(deleteConfirm.saleId);
        setSelectedSaleIds((prev) => prev.filter((id) => id !== deleteConfirm.saleId));
        showToast(`Sales transaction "${deleteConfirm.srCode}" deleted successfully.`);
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete record.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExportExcel = () => {
    try {
      exportDailySalesToExcel(filteredSales, employees);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to export sales to Excel.');
    }
  };

  const filterPeriodLabel = useMemo(() => {
    if (datePreset === 'today') return `Today (${todayStr})`;
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'week') return 'Last 7 Days';
    if (datePreset === 'month') return `This Month (${todayStr.slice(0, 7)})`;
    if (datePreset === 'custom') return `${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
    return 'All Dates Recorded';
  }, [datePreset, todayStr, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <span>Daily Sales Report</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Register daily customer visits, multi-staff services, product sales, split payments, tips, and live commission sync.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Monthly Commission Transfer */}
          <button
            type="button"
            onClick={() => setIsCommissionModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Review Section 5 monthly commission accumulation & transfer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Monthly Commissions</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                syncStatus === 'Synced'
                  ? 'bg-blue-100 text-blue-700'
                  : syncStatus === 'Needs Attention'
                  ? 'bg-rose-100 text-rose-700'
                  : syncStatus === 'Calculating Monthly Totals'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {syncStatus}
            </span>
          </button>

          {/* Service Catalogue Manager */}
          <button
            type="button"
            onClick={() => setIsCatalogueOpen(true)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Manage 6 default service categories"
          >
            <Scissors className="w-3.5 h-3.5 text-purple-600" />
            <span>Service Catalogue</span>
          </button>

          {/* Customer Directory */}
          <button
            type="button"
            onClick={() => setIsCustomerDirectoryOpen(true)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="View registered customer database"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Customers ({customers.length})</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Print Daily Report */}
          <button
            type="button"
            onClick={() => setIsPrintReportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Report</span>
          </button>

          {/* Register New Sale (Primary Action) */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Service / Save Sale</span>
          </button>
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

      {/* 10 Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* 1. Total Service Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">
            Total Service Sales
          </span>
          <span className="text-lg font-bold font-mono text-purple-700 mt-1 block">
            QAR {formatCurrency(summary.serviceSales)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Staff target basis</span>
        </div>

        {/* 2. Total Product Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">
            Total Product Sales
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 mt-1 block">
            QAR {formatCurrency(summary.productSales)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">5% Retail commission</span>
        </div>

        {/* 3. Business Gross Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-2xs bg-slate-50/50">
          <span className="text-[11px] font-bold text-slate-800 uppercase block tracking-wider">
            Business Gross Sales
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
            QAR {formatCurrency(summary.businessGross)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Services + Products</span>
        </div>

        {/* 4. POS Card Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">
            Total POS Card
          </span>
          <span className="text-lg font-bold font-mono text-slate-800 mt-1 block">
            QAR {formatCurrency(summary.posCard)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Terminal collections</span>
        </div>

        {/* 5. Cash Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">
            Total Cash
          </span>
          <span className="text-lg font-bold font-mono text-slate-800 mt-1 block">
            QAR {formatCurrency(summary.cash)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Physical drawer cash</span>
        </div>

        {/* 6. Fawran Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase block tracking-wider">
            Total Fawran
          </span>
          <span className="text-lg font-bold font-mono text-amber-600 mt-1 block">
            QAR {formatCurrency(summary.fawran)}
          </span>
          <span className="text-[10px] text-amber-700/70 mt-0.5 block">Qatar instant transfer</span>
        </div>

        {/* 7. Total Tips */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-cyan-700 uppercase block tracking-wider">
            Total Tips
          </span>
          <span className="text-lg font-bold font-mono text-cyan-600 mt-1 block">
            QAR {formatCurrency(summary.tips)}
          </span>
          <span className="text-[10px] text-cyan-700/70 mt-0.5 block">Isolated from sales</span>
        </div>

        {/* 8. Total Un-Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase block tracking-wider">
            Total Un-Paid
          </span>
          <span className="text-lg font-bold font-mono text-rose-600 mt-1 block">
            QAR {formatCurrency(summary.unpaid)}
          </span>
          <span className="text-[10px] text-rose-700/70 mt-0.5 block">Outstanding balance</span>
        </div>

        {/* 9. Total Refunds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">
            Total Refunds
          </span>
          <span className="text-lg font-bold font-mono text-rose-600 mt-1 block">
            -QAR {formatCurrency(summary.refunds)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Approved deductions</span>
        </div>

        {/* 10. Net Sales */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-300 uppercase block tracking-wider">
            Net Sales
          </span>
          <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
            QAR {formatCurrency(summary.netSales)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Revenue - Refunds</span>
        </div>
      </div>

      {/* Section 5 Commission Automatic Synchronization Banner & Monthly Transfer Controls */}
      {showCommissionBanner && (
        <div className="bg-linear-to-r from-purple-50 via-indigo-50/60 to-blue-50 border border-purple-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                    Monthly Commission Transfer &amp; Section 5 Sync
                  </h3>

                  {/* Live Status Badge */}
                  {syncStatus === 'Live – Saved' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live – Saved
                    </span>
                  )}
                  {syncStatus === 'Calculating Monthly Totals' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      Calculating Monthly Totals
                    </span>
                  )}
                  {syncStatus === 'Synced' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Synced
                    </span>
                  )}
                  {syncStatus === 'Needs Attention' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Needs Attention
                    </span>
                  )}
                </div>

                <p className="text-xs text-purple-900/80 mt-1 max-w-3xl">
                  Daily sales are automatically combined into the single monthly total for each employee in Section 5 (<strong>Actual Eligible Sales</strong> for 10% target and <strong>Eligible Product Sales</strong> for 5% retail). No individual transaction clutter is transferred.
                </p>
              </div>
            </div>

            {/* Monthly Controls: Month Selector & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap lg:justify-end">
              <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600">Month:</span>
                <input
                  type="month"
                  value={syncMonthYear}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSyncMonthYear(e.target.value);
                      setSyncStatusOverride(null);
                    }
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Recalculate Monthly Totals Button */}
              <button
                type="button"
                disabled={isRecalculatingSync}
                onClick={handleRecalculateMonthly}
                className="px-3.5 py-1.5 text-xs font-bold text-purple-900 bg-white hover:bg-purple-100 border border-purple-300 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-98"
                title="Recalculate monthly totals from saved source transactions without duplicates"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-700 ${isRecalculatingSync ? 'animate-spin' : ''}`} />
                <span>{isRecalculatingSync ? 'Recalculating...' : 'Recalculate Monthly Totals'}</span>
              </button>

              {/* Review Monthly Transfer Button */}
              <button
                type="button"
                onClick={() => setIsCommissionModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Review Monthly Transfer ({monthlySummary.employeeAggregates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommissionBanner(false)}
                className="text-xs text-purple-700 hover:text-purple-900 px-1.5 py-1"
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Aggregated Monthly Sales Summary Row */}
          <div className="pt-2 border-t border-purple-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200/70">
              <span className="text-[10px] font-bold uppercase text-purple-900 block">
                Eligible Services ({monthlySummary.monthName})
              </span>
              <span className="text-sm font-bold font-mono text-purple-900 block mt-0.5">
                QAR {formatCurrency(monthlySummary.totalServiceSales)}
              </span>
              <span className="text-[10px] text-slate-500">10% Target Base · Excludes Tips/Uber</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200/70">
              <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                Eligible Products ({monthlySummary.monthName})
              </span>
              <span className="text-sm font-bold font-mono text-emerald-800 block mt-0.5">
                QAR {formatCurrency(monthlySummary.totalProductSales)}
              </span>
              <span className="text-[10px] text-slate-500">5% Retail Commission Base</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200/70">
              <span className="text-[10px] font-bold uppercase text-blue-900 block">
                Salon Business Gross ({monthlySummary.monthName})
              </span>
              <span className="text-sm font-bold font-mono text-blue-900 block mt-0.5">
                QAR {formatCurrency(monthlySummary.totalBusinessGross)}
              </span>
              <span className="text-[10px] text-slate-500">All employees combined once</span>
            </div>

            <div className="bg-purple-900 text-white p-2.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-purple-200 block">
                Total Monthly Commissions
              </span>
              <span className="text-sm font-bold font-mono text-amber-300 block mt-0.5">
                QAR {formatCurrency(monthlySummary.totalCommissionsDue)}
              </span>
              <span className="text-[10px] text-purple-300">Ready for Payroll Module</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {(['all', 'today', 'yesterday', 'week', 'month', 'custom'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                  datePreset === preset
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset === 'all'
                  ? 'All Dates'
                  : preset === 'today'
                  ? 'Today'
                  : preset === 'yesterday'
                  ? 'Yesterday'
                  : preset === 'week'
                  ? 'This Week'
                  : preset === 'month'
                  ? 'This Month'
                  : 'Custom Range'}
              </button>
            ))}
          </div>

          {/* Active record counter */}
          <span className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-900">{filteredSales.length}</strong> of{' '}
            {sales.length} transactions
          </span>
        </div>

        {/* Custom date range pickers */}
        {datePreset === 'custom' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">From Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
            />
            <span className="font-bold text-slate-700">To Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
            />
          </div>
        )}

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Customer, Mobile, or Sr#..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Employee Filter */}
          <div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">All Performing Staff</option>
              {activeEmployees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName}
                </option>
              ))}
            </select>
          </div>

          {/* Service Catalogue Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">All Service Categories</option>
              <option value="Hairdresser">Hairdresser</option>
              <option value="Eyelash Art">Eyelash Art</option>
              <option value="Eyebrows Art">Eyebrows Art</option>
              <option value="Nail Art">Nail Art</option>
              <option value="Spa">Spa</option>
              <option value="Spray Tan">Spray Tan</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">All Payment Modes</option>
              <option value="POS Card">POS Card Paid</option>
              <option value="Cash">Cash Paid</option>
              <option value="Fawran">Fawran Paid</option>
              <option value="Unpaid">Has Un-Paid Balance</option>
              <option value="Refunded">Has Refunds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Selection Actions Bar */}
      {selectedSaleIds.length > 0 && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-mono font-bold text-xs flex items-center justify-center">
              {selectedSaleIds.length}
            </span>
            <span className="text-xs font-bold text-purple-900">
              transaction(s) selected
            </span>
            <span className="text-xs text-purple-600/75">
              (Choose an action for selected customer visits)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSaleIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedSaleIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Daily Sales Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-2 w-14 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filteredSales.length > 0 && selectedSaleIds.length === filteredSales.length}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      title="Select / Deselect all records"
                    />
                  </div>
                </th>
                <th className="py-3 px-3">Sr#</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Services</th>
                <th className="py-3 px-3">Employee(s)</th>
                <th className="py-3 px-3 text-right">Products</th>
                <th className="py-3 px-3 text-right">Uber</th>
                <th className="py-3 px-3 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">POS Card</th>
                <th className="py-3 px-3 text-right">Cash</th>
                <th className="py-3 px-3 text-right">Fawran</th>
                <th className="py-3 px-3 text-right">Tips</th>
                <th className="py-3 px-3 text-right">Un-Paid</th>
                <th className="py-3 px-3 text-right">Refunds</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DollarSign className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-semibold">No sales records found matching current criteria.</span>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="mt-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                      >
                        + Register First Sale
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isExpanded = expandedSaleIds.includes(sale.saleId);

                  // Extract employee names
                  const staffNames = Array.from(
                    new Set([
                      ...sale.services.map((s) => s.employeeName.split(' ')[0]),
                      ...sale.products.map((p) => p.employeeName.split(' ')[0]),
                    ])
                  ).join(', ');

                  return (
                    <React.Fragment key={sale.saleId}>
                      <tr
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isExpanded ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Selection Checkbox & Expand Toggle */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={selectedSaleIds.includes(sale.saleId)}
                              onChange={(e) => handleToggleSelectSale(sale.saleId, e)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              title={`Select ${sale.srCode}`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleExpand(sale.saleId)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse line details' : 'Expand line details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Sr# */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {sale.srCode}
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {sale.date}
                        </td>

                        {/* Customer */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {sale.customerName}
                        </td>

                        {/* Mobile */}
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {sale.mobileNumber}
                        </td>

                        {/* Services List summary */}
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={sale.services.map(s => s.serviceName).join(', ')}>
                          {sale.services.length > 0 ? (
                            <span className="font-medium text-slate-800">
                              {sale.services.map((s) => s.serviceName).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>

                        {/* Staff */}
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap font-medium">
                          {staffNames || '-'}
                        </td>

                        {/* Product Sales */}
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          {sale.totalProductAmount > 0 ? (
                            `QAR ${formatCurrency(sale.totalProductAmount)}`
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Uber */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {sale.uberCharge > 0 ? `QAR ${formatCurrency(sale.uberCharge)}` : '-'}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                          QAR {formatCurrency(sale.totalRevenue)}
                        </td>

                        {/* POS Card */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {sale.posCard > 0 ? formatCurrency(sale.posCard) : '-'}
                        </td>

                        {/* Cash */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {sale.cash > 0 ? formatCurrency(sale.cash) : '-'}
                        </td>

                        {/* Fawran */}
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                          {sale.fawran > 0 ? (
                            <span title={`Recipient: ${sale.fawranRecipientName || 'N/A'}`}>
                              {formatCurrency(sale.fawran)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Tips */}
                        <td className="py-2.5 px-3 text-right font-mono text-cyan-700 font-semibold">
                          {sale.tips > 0 ? formatCurrency(sale.tips) : '-'}
                        </td>

                        {/* Unpaid */}
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                          {sale.unpaid > 0 ? formatCurrency(sale.unpaid) : '-'}
                        </td>

                        {/* Refunds */}
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {sale.refunds > 0 ? `-${formatCurrency(sale.refunds)}` : '-'}
                        </td>

                        {/* Payment Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sale.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sale.paymentStatus === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : sale.paymentStatus === 'Refunded'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Receipt */}
                            <button
                              type="button"
                              onClick={() => setReceiptSale(sale)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Print Customer Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sale)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Sale"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Refund */}
                            <button
                              type="button"
                              onClick={() => setRefundSale(sale)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(sale.saleId, sale.srCode, sale.customerName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Delete Sales Record ${sale.srCode}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={18} className="p-4 pl-12 space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Services Line Detail */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                  <Scissors className="w-3.5 h-3.5" />
                                  <span>Service Breakdown &amp; Employee Attributions</span>
                                </span>
                                <div className="space-y-1.5 text-xs">
                                  {sale.services.map((srv, idx) => (
                                    <div
                                      key={srv.id || idx}
                                      className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-900">{srv.serviceName}</span>{' '}
                                        <span className="text-slate-400">({srv.category})</span>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Performing Staff:{' '}
                                          <strong className="text-purple-900">{srv.employeeName}</strong>
                                          {srv.startTime && srv.endTime && ` • ${srv.startTime} - ${srv.endTime}`}
                                          {srv.discount > 0 && ` • Disc: -QAR ${formatCurrency(srv.discount)}`}
                                        </div>
                                        {srv.sharedWithEmployeeName && (
                                          <div className="text-[10px] text-amber-700 italic">
                                            Shared with: {srv.sharedWithEmployeeName} (QAR {formatCurrency(srv.sharedAmount)})
                                          </div>
                                        )}
                                      </div>
                                      <span className="font-mono font-bold text-purple-900">
                                        QAR {formatCurrency(srv.lineTotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Products & Payments Detail */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Products &amp; Payment Reconciliation</span>
                                </span>
                                <div className="space-y-1 text-xs font-mono">
                                  {sale.products.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No retail products in this visit.</p>
                                  ) : (
                                    sale.products.map((p, idx) => (
                                      <div key={p.id || idx} className="flex justify-between text-[11px] text-slate-700">
                                        <span>
                                          {p.productName} (x{p.quantity}) • Salesperson:{' '}
                                          <strong className="text-emerald-800">{p.employeeName}</strong>
                                        </span>
                                        <span className="font-bold">QAR {formatCurrency(p.lineTotal)}</span>
                                      </div>
                                    ))
                                  )}

                                  <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-700">
                                    <span>POS Card / Cash / Fawran:</span>
                                    <span>
                                      QAR {formatCurrency(sale.posCard)} / {formatCurrency(sale.cash)} / {formatCurrency(sale.fawran)}
                                    </span>
                                  </div>
                                  {sale.fawranRecipientName && (
                                    <div className="text-[10px] text-amber-700 font-sans">
                                      Fawran Recipient: {sale.fawranRecipientName}
                                    </div>
                                  )}
                                  {sale.notes && (
                                    <div className="pt-1 text-[11px] text-slate-600 font-sans italic">
                                      Notes: "{sale.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RegisterSaleModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSaved={onRefresh}
        employees={employees}
        customers={customers}
        catalogue={catalogue}
        editSale={editingSale}
      />

      <ReceiptModal
        sale={receiptSale}
        settings={settings}
        onClose={() => setReceiptSale(null)}
      />

      <PrintDailyReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        sales={filteredSales}
        employees={employees}
        settings={settings}
        filterLabel={filterPeriodLabel}
      />

      <RefundModal
        sale={refundSale}
        employees={employees}
        onClose={() => setRefundSale(null)}
        onRefundProcessed={onRefresh}
      />

      <CustomerDirectoryModal
        isOpen={isCustomerDirectoryOpen}
        onClose={() => setIsCustomerDirectoryOpen(false)}
        customers={customers}
        onRefresh={onRefresh}
      />

      <ServiceCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        catalogue={catalogue}
        onRefresh={onRefresh}
      />

      <MonthlyCommissionTransferModal
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
        employees={employees}
        settings={settings}
        onOpenEmployee={onOpenEmployee}
        onRefreshParent={onRefresh}
      />

      {/* Confirm Delete Modal (Replaces blocked window.confirm) */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={
            deleteConfirm.isBulk
              ? `Delete ${selectedSaleIds.length} Sales Records`
              : `Delete Sales Record ${deleteConfirm.srCode}`
          }
          message={
            deleteConfirm.isBulk
              ? `Are you sure you want to permanently delete ${selectedSaleIds.length} selected transaction(s)?\n\nThis will remove the visits and automatically recalculate employee commissions and revenue.`
              : `Are you sure you want to delete sales record "${deleteConfirm.srCode}" (${deleteConfirm.customerName || 'Customer'})?\n\nThis will remove the transaction and automatically recalculate employee commissions.`
          }
          confirmText="Delete Record"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
