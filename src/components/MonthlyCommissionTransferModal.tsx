import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  UserCheck,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Scissors,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Employee,
  MonthlyCommissionSummary,
  CommissionSyncStatus,
  SystemSettings,
} from '../types';
import { db, formatCurrency } from '../services/db';

interface MonthlyCommissionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  settings: SystemSettings;
  onOpenEmployee?: (empId: string) => void;
  onRefreshParent: () => void;
}

export const MonthlyCommissionTransferModal: React.FC<MonthlyCommissionTransferModalProps> = ({
  isOpen,
  onClose,
  employees,
  settings,
  onOpenEmployee,
  onRefreshParent,
}) => {
  // Current month default: "2026-10"
  const today = new Date();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthYear);
  const [summary, setSummary] = useState<MonthlyCommissionSummary | null>(null);
  const [syncStatus, setSyncStatus] = useState<CommissionSyncStatus>('Live – Saved');
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Generate selectable months for current and past 12 months
  const monthOptions = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ key, label });
    }
    return list;
  }, []);

  const loadSummary = (monthKey: string) => {
    const s = db.getMonthlyCommissions(monthKey);
    setSummary(s);
    setSyncStatus(s.syncStatus);
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary(selectedMonthYear);
    }
  }, [isOpen, selectedMonthYear]);

  if (!isOpen) return null;

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setSyncStatus('Calculating Monthly Totals');

    try {
      // Simulate brief background calculation step so staff sees the live state
      await new Promise((resolve) => setTimeout(resolve, 350));
      const updated = await db.recalculateMonthlyTotals(selectedMonthYear);
      setSummary(updated);
      setSyncStatus(updated.syncStatus === 'Needs Attention' ? 'Needs Attention' : 'Synced');
      onRefreshParent();
    } catch (err) {
      console.error(err);
      setSyncStatus('Needs Attention');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Filtered employee aggregates
  const filteredAggregates = summary?.employeeAggregates.filter((a) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      a.employeeName.toLowerCase().includes(q) ||
      a.employeeId.toLowerCase().includes(q) ||
      a.position.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Monthly Commission Transfer &amp; Synchronization
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Module 5 Live Connect
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Accumulates daily sales into one single monthly total per employee for Section 5 commissions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Month Picker & Live Sync Status */}
        <div className="px-6 py-3.5 bg-linear-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month & Year Selection */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Selected Month:</label>
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-2xs focus:ring-2 focus:ring-purple-500"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} ({opt.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Sync Status Indicator Badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Sync Status:</span>
              {syncStatus === 'Live – Saved' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live – Saved
                </span>
              )}

              {syncStatus === 'Calculating Monthly Totals' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  Calculating Monthly Totals
                </span>
              )}

              {syncStatus === 'Synced' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Synced
                </span>
              )}

              {syncStatus === 'Needs Attention' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Needs Attention
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Recalculate Monthly Totals */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRecalculating}
              onClick={handleRecalculate}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                isRecalculating
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:scale-98'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Monthly Totals'}</span>
            </button>
          </div>
        </div>

        {/* Validation issues warning banner if present */}
        {summary?.validationIssues && summary.validationIssues.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 space-y-1">
              <span className="font-bold">Validation Items Detected in {summary.monthName}:</span>
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                {summary.validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Stream 1: Actual Eligible Service Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                  1. Eligible Services
                </span>
                <Scissors className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-lg font-bold font-mono text-purple-800">
                QAR {formatCurrency(summary?.totalServiceSales || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                10% Target Stream · Tips &amp; Uber excluded
              </div>
            </div>

            {/* Stream 2: Eligible Retail Product Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  2. Eligible Products
                </span>
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-800">
                QAR {formatCurrency(summary?.totalProductSales || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                5% Retail commission attributed to seller
              </div>
            </div>

            {/* Stream 3: Business Gross Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  3. Business Gross
                </span>
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-lg font-bold font-mono text-blue-800">
                QAR {formatCurrency(summary?.totalBusinessGross || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                All staff combined · Counted once
              </div>
            </div>

            {/* Total Monthly Commissions Due */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Total Comm. Due
                </span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-400">
                QAR {formatCurrency(summary?.totalCommissionsDue || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Accumulated for {summary?.monthName}
              </div>
            </div>
          </div>

          {/* Transfer Rule Educational Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Monthly Accumulation &amp; Transfer Rule:</span>
              <p className="mt-0.5 text-[11px] text-blue-800/90 leading-relaxed">
                Daily sales from all customers are aggregated in the background by calendar month. Each employee receives exactly <strong>one combined monthly total</strong> in Section 5 (<strong>Actual Eligible Sales</strong> for 10% Target and <strong>Eligible Product Sales</strong> for 5% commission). Individual customer receipts are not cluttered or duplicated in commission lines.
              </p>
            </div>
          </div>

          {/* Filter & Employee Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>Employee Monthly Commission Breakdown ({filteredAggregates.length})</span>
              </h3>

              <div className="w-64">
                <input
                  type="text"
                  placeholder="Filter employee name or ID..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Service Target</th>
                      <th className="py-2.5 px-3 text-purple-900">Actual Eligible Sales</th>
                      <th className="py-2.5 px-3">10% Target Status</th>
                      <th className="py-2.5 px-3 text-emerald-900">Product Sales</th>
                      <th className="py-2.5 px-3">5% Product Comm.</th>
                      <th className="py-2.5 px-3 text-right">Total Comm. Due</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAggregates.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No employee records found for this period.
                        </td>
                      </tr>
                    ) : (
                      filteredAggregates.map((agg) => (
                        <tr key={agg.employeeId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{agg.employeeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {agg.employeeId} · {agg.position}
                            </div>
                          </td>

                          {/* Service Target */}
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            QAR {formatCurrency(agg.serviceSalesTarget)}
                          </td>

                          {/* Actual Eligible Sales */}
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                            QAR {formatCurrency(agg.actualEligibleSales)}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {agg.serviceTransactionCount} service lines
                            </span>
                          </td>

                          {/* 10% Target Status */}
                          <td className="py-2.5 px-3">
                            {agg.serviceEligible ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Target Reached (QAR {formatCurrency(agg.serviceCommissionDue)})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Below Target ({agg.serviceAchievementRate.toFixed(0)}%)
                              </span>
                            )}
                          </td>

                          {/* Eligible Product Sales */}
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                            QAR {formatCurrency(agg.eligibleProductSales)}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {agg.productTransactionCount} retail items
                            </span>
                          </td>

                          {/* 5% Product Comm */}
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                            QAR {formatCurrency(agg.productCommissionDue)}
                          </td>

                          {/* Total Commission Due */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              QAR {formatCurrency(agg.totalCommissionDue)}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3 text-center">
                            {onOpenEmployee && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenEmployee(agg.employeeId);
                                }}
                                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center justify-center gap-1 mx-auto"
                              >
                                <span>Section 5</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Last recalculated: {summary?.lastCalculatedAt ? new Date(summary.lastCalculatedAt).toLocaleTimeString() : 'N/A'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
