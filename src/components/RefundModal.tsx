import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DailySaleRecord, Employee, SaleRefundRecord } from '../types';
import { db, formatCurrency, formatDate } from '../services/db';

interface RefundModalProps {
  sale: DailySaleRecord | null;
  employees: Employee[];
  onClose: () => void;
  onRefundProcessed: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  sale,
  employees,
  onClose,
  onRefundProcessed,
}) => {
  if (!sale) return null;

  const maxRefundable = Math.max(0, Number(sale.netSales) || 0);

  const [refundAmount, setRefundAmount] = useState<number>(maxRefundable);
  const [reason, setReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'POS Card' | 'Fawran' | 'Credit'>('Cash');
  const [affectedEmployeeId, setAffectedEmployeeId] = useState<string>(
    sale.services[0]?.employeeId || sale.products[0]?.employeeId || ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amt = Number(refundAmount) || 0;
    if (amt <= 0) {
      setErrorMsg('Refund amount must be greater than zero.');
      return;
    }

    if (amt > maxRefundable) {
      setErrorMsg(`Refund amount cannot exceed net refundable balance of QAR ${formatCurrency(maxRefundable)}.`);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please specify the reason for the refund.');
      return;
    }

    const refundRecord: SaleRefundRecord = {
      refundId: `REF-${sale.srNo}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      amount: amt,
      reason: reason.trim(),
      refundMethod,
      affectedEmployeeId: affectedEmployeeId || undefined,
      processedBy: 'Salon Manager',
    };

    try {
      await db.processSaleRefund(sale.saleId, refundRecord);
      onRefundProcessed();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to process refund.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Process Refund – {sale.srCode}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer: {sale.customerName} ({sale.mobileNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sale Financial Context */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Original Revenue:</span>
              <span className="font-bold text-slate-900">QAR {formatCurrency(sale.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Refunded:</span>
              <span className="text-rose-600">QAR {formatCurrency(sale.refunds)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
              <span>Max Refundable:</span>
              <span className="text-emerald-700">QAR {formatCurrency(maxRefundable)}</span>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Refund Amount (QAR) *
            </label>
            <input
              type="number"
              min="1"
              max={maxRefundable}
              step="any"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full text-xs p-2 text-right bg-white border border-slate-300 rounded-lg font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Refund Method *
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as any)}
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
            >
              <option value="Cash">Cash Return</option>
              <option value="POS Card">Card Reversal</option>
              <option value="Fawran">Fawran Instant Transfer</option>
              <option value="Credit">Salon Store Credit</option>
            </select>
          </div>

          {/* Affected Employee */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Deduct from Employee Commission Base
            </label>
            <select
              value={affectedEmployeeId}
              onChange={(e) => setAffectedEmployeeId(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
            >
              <option value="">No specific employee deduction (Salon absorb)</option>
              {employees
                .filter((e) => e.status !== 'Unemployed')
                .map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName} ({emp.position})
                  </option>
                ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Selecting an employee will deduct this amount from their Section 5 eligible sales.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Reason for Refund *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Customer requested rescheduling / service cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Refund</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
