import React, { useState } from 'react';
import { X, Printer, Sparkles, Calendar, DollarSign, Users, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { DailySaleRecord, Employee, SystemSettings } from '../types';
import { formatCurrency, formatDate, calculateEmployeeCommissions } from '../services/db';
import { exportElementToPdf } from '../services/pdfService';

interface PrintDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: DailySaleRecord[];
  employees: Employee[];
  settings: SystemSettings;
  filterLabel: string;
}

export const PrintDailyReportModal: React.FC<PrintDailyReportModalProps> = ({
  isOpen,
  onClose,
  sales,
  employees,
  settings,
  filterLabel,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  if (!isOpen) return null;

  // Aggregate metrics
  let totalService = 0;
  let totalProduct = 0;
  let grossSales = 0;
  let totalUber = 0;
  let totalRevenue = 0;
  let totalPOS = 0;
  let totalCash = 0;
  let totalFawran = 0;
  let totalTips = 0;
  let totalUnpaid = 0;
  let totalRefunds = 0;
  let totalNet = 0;

  sales.forEach((s) => {
    totalService += Number(s.totalServiceAmount) || 0;
    totalProduct += Number(s.totalProductAmount) || 0;
    grossSales += Number(s.grossSales) || 0;
    totalUber += Number(s.uberCharge) || 0;
    totalRevenue += Number(s.totalRevenue) || 0;
    totalPOS += Number(s.posCard) || 0;
    totalCash += Number(s.cash) || 0;
    totalFawran += Number(s.fawran) || 0;
    totalTips += Number(s.tips) || 0;
    totalUnpaid += Number(s.unpaid) || 0;
    totalRefunds += Number(s.refunds) || 0;
    totalNet += Number(s.netSales) || 0;
  });

  // Employee-wise sales breakdown for this filtered selection
  const employeeSalesMap: Record<
    string,
    { name: string; position: string; target: number; serviceSales: number; productSales: number }
  > = {};

  employees
    .filter((e) => e.status !== 'Unemployed')
    .forEach((e) => {
      employeeSalesMap[e.employeeId] = {
        name: e.employeeName,
        position: e.position,
        target: Number(e.saleTargetRate) || 0,
        serviceSales: 0,
        productSales: 0,
      };
    });

  sales.forEach((s) => {
    s.services.forEach((srv) => {
      const lineAmt = Number(srv.lineTotal) || 0;
      const sharedAmt = Number(srv.sharedAmount) || 0;
      const sharedEmpId = srv.sharedWithEmployeeId;

      if (sharedEmpId && sharedAmt > 0 && employeeSalesMap[sharedEmpId]) {
        employeeSalesMap[sharedEmpId].serviceSales += sharedAmt;
        if (employeeSalesMap[srv.employeeId]) {
          employeeSalesMap[srv.employeeId].serviceSales += lineAmt - sharedAmt;
        }
      } else if (employeeSalesMap[srv.employeeId]) {
        employeeSalesMap[srv.employeeId].serviceSales += lineAmt;
      }
    });

    s.products.forEach((prd) => {
      if (employeeSalesMap[prd.employeeId]) {
        employeeSalesMap[prd.employeeId].productSales += Number(prd.lineTotal) || 0;
      }
    });
  });

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const cleanLabel = (filterLabel || 'Salon').replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
      await exportElementToPdf('printable-daily-sales-report', {
        filename: `COSMOS_Daily_Sales_Report_${cleanLabel}.pdf`,
        orientation: 'p',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintDailyReport = () => {
    const cleanLabel = (filterLabel || 'Salon').replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    window.printDocument('printable-daily-sales-report', `COSMOS_Daily_Sales_Report_${cleanLabel}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                Daily Sales &amp; Financial Report Preview
              </h2>
              <p className="text-xs text-slate-400">
                A4-optimized salon financial report with employee commissions &amp; payment reconciliation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Save Daily Sales Report as PDF (Direct Download)"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Save as PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintDailyReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Official Letter (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Letter (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div id="printable-daily-sales-report" className="flex-1 overflow-y-auto p-8 sm:p-10 font-sans text-slate-900 bg-white print:p-0 print:m-0 print:overflow-visible space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {settings.companyName || 'COSMOS BEAUTY SALON'}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Daily Sales, Retail &amp; Target Commissions Report • Doha, Qatar
              </p>
            </div>
            <div className="sm:text-right text-xs text-slate-600 space-y-0.5 font-mono">
              <div>Period: <span className="font-bold text-slate-900">{filterLabel}</span></div>
              <div>Generated: {new Date().toLocaleString()}</div>
              <div>Records: <span className="font-bold text-slate-900">{sales.length} transactions</span></div>
            </div>
          </div>

          {/* 10 Summary Cards Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Financial Summary (QAR)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Service Sales</span>
                <span className="text-sm font-bold font-mono text-purple-700">QAR {formatCurrency(totalService)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Product Sales</span>
                <span className="text-sm font-bold font-mono text-emerald-700">QAR {formatCurrency(totalProduct)}</span>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-700 uppercase block font-bold">Business Gross</span>
                <span className="text-sm font-bold font-mono text-slate-900">QAR {formatCurrency(grossSales)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">POS Card</span>
                <span className="text-sm font-bold font-mono text-slate-800">QAR {formatCurrency(totalPOS)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cash</span>
                <span className="text-sm font-bold font-mono text-slate-800">QAR {formatCurrency(totalCash)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fawran</span>
                <span className="text-sm font-bold font-mono text-amber-700">QAR {formatCurrency(totalFawran)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tips</span>
                <span className="text-sm font-bold font-mono text-cyan-700">QAR {formatCurrency(totalTips)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Un-Paid</span>
                <span className="text-sm font-bold font-mono text-rose-700">QAR {formatCurrency(totalUnpaid)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Refunds</span>
                <span className="text-sm font-bold font-mono text-rose-600">-QAR {formatCurrency(totalRefunds)}</span>
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Net Sales</span>
                <span className="text-sm font-bold font-mono text-amber-400">QAR {formatCurrency(totalNet)}</span>
              </div>
            </div>
          </div>

          {/* Section 5 Commissions Preview */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center justify-between">
              <span>Section 5: Employee Commissions Status for Filtered Period</span>
              <span className="text-[11px] text-slate-500 lowercase font-normal font-mono">
                10% Service Target Rule &amp; 5% Product Rule
              </span>
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Employee</th>
                    <th className="py-2 px-3 text-right">Sales Target</th>
                    <th className="py-2 px-3 text-right">Eligible Service Sales</th>
                    <th className="py-2 px-3 text-right">Achieve %</th>
                    <th className="py-2 px-3 text-center">Eligibility</th>
                    <th className="py-2 px-3 text-right">Service Comm (10%)</th>
                    <th className="py-2 px-3 text-right">Product Sales</th>
                    <th className="py-2 px-3 text-right">Product Comm (5%)</th>
                    <th className="py-2 px-3 text-right">Total Comm (QAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {Object.keys(employeeSalesMap).map((empId) => {
                    const item = employeeSalesMap[empId];
                    const target = item.target;
                    const isEligible = item.serviceSales > 0 && item.serviceSales >= target;
                    const serviceComm = isEligible ? item.serviceSales * 0.1 : 0;
                    const productComm = item.productSales * 0.05;
                    const achievePct = target > 0 ? (item.serviceSales / target) * 100 : item.serviceSales > 0 ? 100 : 0;

                    return (
                      <tr key={empId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                          {item.name}
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            {item.position}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          QAR {formatCurrency(target)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-purple-900">
                          QAR {formatCurrency(item.serviceSales)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={
                              achievePct >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-600'
                            }
                          >
                            {achievePct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {isEligible ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                              Eligible
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                              Below Target (QAR 0)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          QAR {formatCurrency(serviceComm)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-800">
                          QAR {formatCurrency(item.productSales)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          QAR {formatCurrency(productComm)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-950 bg-slate-50">
                          QAR {formatCurrency(serviceComm + productComm)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Transactions Table */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Itemized Daily Sales Records
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="py-2 px-2.5">Sr#</th>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Customer &amp; Mobile</th>
                    <th className="py-2 px-2.5">Services / Staff</th>
                    <th className="py-2 px-2.5 text-right">Products</th>
                    <th className="py-2 px-2.5 text-right">Gross QAR</th>
                    <th className="py-2 px-2.5 text-right">POS</th>
                    <th className="py-2 px-2.5 text-right">Cash</th>
                    <th className="py-2 px-2.5 text-right">Fawran</th>
                    <th className="py-2 px-2.5 text-right">Tips</th>
                    <th className="py-2 px-2.5 text-right">Unpaid</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {sales.map((sale) => (
                    <tr key={sale.saleId} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-900">{sale.srCode}</td>
                      <td className="py-1.5 px-2.5 text-slate-600">{sale.date}</td>
                      <td className="py-1.5 px-2.5 font-sans">
                        <span className="font-semibold text-slate-900 block">{sale.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{sale.mobileNumber}</span>
                      </td>
                      <td className="py-1.5 px-2.5 font-sans text-[10px] max-w-[200px]">
                        {sale.services.map((s) => `${s.serviceName} (${s.employeeName.split(' ')[0]})`).join(', ')}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-emerald-800">
                        {sale.totalProductAmount > 0 ? formatCurrency(sale.totalProductAmount) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(sale.grossSales)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-slate-600">
                        {sale.posCard > 0 ? formatCurrency(sale.posCard) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-slate-600">
                        {sale.cash > 0 ? formatCurrency(sale.cash) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-amber-700">
                        {sale.fawran > 0 ? formatCurrency(sale.fawran) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-cyan-700">
                        {sale.tips > 0 ? formatCurrency(sale.tips) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-rose-600">
                        {sale.unpaid > 0 ? formatCurrency(sale.unpaid) : '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            sale.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sale.paymentStatus === 'Partial'
                              ? 'bg-amber-50 text-amber-700'
                              : sale.paymentStatus === 'Refunded'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authorization Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Prepared By</span>
              <div className="mt-6 border-b border-slate-300 pb-1 font-semibold text-slate-800">
                Salon Duty Receptionist
              </div>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Verified By (Manager)</span>
              <div className="mt-6 border-b border-slate-300 pb-1 font-semibold text-slate-800">
                {settings.signatoryName || 'ATYRGUL AIAZOVA'}
              </div>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Management Authorization</span>
              <div className="mt-6 border-b border-slate-300 pb-1 font-semibold text-slate-800">
                Cosmos Beauty Salon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
