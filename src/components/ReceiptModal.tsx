import React, { useState } from 'react';
import { X, Printer, Sparkles, Phone, Mail, MapPin, Download, Loader2 } from 'lucide-react';
import { DailySaleRecord, SystemSettings } from '../types';
import { formatCurrency, formatDate } from '../services/db';
import { exportElementToPdf } from '../services/pdfService';

interface ReceiptModalProps {
  sale: DailySaleRecord | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  if (!sale) return null;

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await exportElementToPdf('printable-receipt', {
        filename: `COSMOS_Receipt_${sale.srCode}.pdf`,
        isReceipt: true,
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintReceipt = () => {
    window.printDocument('printable-receipt', `COSMOS_Receipt_${sale.srCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Receipt Preview – {sale.srCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isDownloadingPdf}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Save Receipt as PDF (Direct Download)"
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
              onClick={handlePrintReceipt}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
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

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-6 sm:p-8 font-sans text-slate-900 bg-white print:p-0 print:m-0 print:overflow-visible">
          {/* Header */}
          <div className="text-center pb-5 border-b border-slate-200 space-y-1.5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 text-amber-400 mb-1 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {settings.companyName || 'COSMOS BEAUTY SALON'}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
              Luxury Salon &amp; Spa • Doha, Qatar
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {settings.companyAddress || 'Doha, Qatar'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {settings.companyPhone || '+974 4455 6677'}
              </span>
            </div>
          </div>

          {/* Receipt Meta & Customer */}
          <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Receipt No</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{sale.srCode}</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                Date: {formatDate(sale.date)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer</span>
              <span className="font-bold text-slate-900 block">{sale.customerName}</span>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                {sale.mobileNumber}
              </span>
            </div>
          </div>

          {/* Services Section */}
          <div className="py-4 border-b border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Services Provided
            </span>
            {sale.services.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No services billed.</p>
            ) : (
              <div className="space-y-2">
                {sale.services.map((srv, idx) => (
                  <div key={srv.id || idx} className="text-xs flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{srv.serviceName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <span>Staff: {srv.employeeName}</span>
                        {srv.startTime && srv.endTime && (
                          <span>• {srv.startTime} - {srv.endTime}</span>
                        )}
                        {srv.quantity > 1 && <span>• x{srv.quantity}</span>}
                        {srv.discount > 0 && (
                          <span className="text-rose-600 font-semibold">• Disc: -QAR {formatCurrency(srv.discount)}</span>
                        )}
                      </div>
                      {srv.sharedWithEmployeeName && (
                        <div className="text-[10px] text-amber-700 italic">
                          (Shared with {srv.sharedWithEmployeeName}: QAR {formatCurrency(srv.sharedAmount)})
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900 shrink-0">
                      QAR {formatCurrency(srv.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Section */}
          {sale.products.length > 0 && (
            <div className="py-4 border-b border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Retail Products
              </span>
              <div className="space-y-2">
                {sale.products.map((prd, pIdx) => (
                  <div key={prd.id || pIdx} className="text-xs flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{prd.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Salesperson: {prd.employeeName} • x{prd.quantity} @ QAR {formatCurrency(prd.unitPrice)}
                        {prd.discount > 0 && (
                          <span className="text-rose-600 font-semibold"> • Disc: -QAR {formatCurrency(prd.discount)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900 shrink-0">
                      QAR {formatCurrency(prd.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transportation Charge */}
          {sale.uberCharge > 0 && (
            <div className="py-3 border-b border-slate-200 flex justify-between text-xs font-mono">
              <span className="font-medium text-slate-700">Uber for Home Service:</span>
              <span className="font-bold text-slate-900">QAR {formatCurrency(sale.uberCharge)}</span>
            </div>
          )}

          {/* Totals & Breakdown */}
          <div className="py-4 border-b border-slate-200 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Service Subtotal:</span>
              <span>QAR {formatCurrency(sale.totalServiceAmount)}</span>
            </div>
            {sale.totalProductAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Product Subtotal:</span>
                <span>QAR {formatCurrency(sale.totalProductAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
              <span>Total Revenue:</span>
              <span>QAR {formatCurrency(sale.totalRevenue)}</span>
            </div>
            {sale.refunds > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Refunded Amount:</span>
                <span>-QAR {formatCurrency(sale.refunds)}</span>
              </div>
            )}
            {sale.refunds > 0 && (
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Net Sales:</span>
                <span>QAR {formatCurrency(sale.netSales)}</span>
              </div>
            )}
          </div>

          {/* Payment Method Details */}
          <div className="py-4 border-b border-slate-200 space-y-1.5 text-xs font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
              Payment Breakdown
            </span>
            {sale.posCard > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>POS Card:</span>
                <span>QAR {formatCurrency(sale.posCard)}</span>
              </div>
            )}
            {sale.cash > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Cash:</span>
                <span>QAR {formatCurrency(sale.cash)}</span>
              </div>
            )}
            {sale.fawran > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Fawran Instant ({sale.fawranRecipientName || 'Direct'}):</span>
                <span>QAR {formatCurrency(sale.fawran)}</span>
              </div>
            )}
            {sale.tips > 0 && (
              <div className="flex justify-between text-cyan-700 font-semibold">
                <span>Tips (Gratuity):</span>
                <span>QAR {formatCurrency(sale.tips)}</span>
              </div>
            )}
            {sale.unpaid > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Un-Paid Outstanding:</span>
                <span>QAR {formatCurrency(sale.unpaid)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total Paid:</span>
              <span>QAR {formatCurrency(sale.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Payment Status:</span>
              <span
                className={`font-semibold ${
                  sale.paymentStatus === 'Paid'
                    ? 'text-emerald-600'
                    : sale.paymentStatus === 'Partial'
                    ? 'text-amber-600'
                    : sale.paymentStatus === 'Refunded'
                    ? 'text-rose-600'
                    : 'text-slate-600'
                }`}
              >
                {sale.paymentStatus}
              </span>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="py-3 border-b border-slate-200 text-xs text-slate-600 italic">
              <span className="font-semibold text-slate-700 not-italic">Notes: </span>
              {sale.notes}
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">
              Thank you for visiting Cosmos Beauty Salon!
            </p>
            <p className="text-[10px] text-slate-400">
              We appreciate your business • For appointments &amp; inquiries: {settings.companyPhone || '+974 4455 6677'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
