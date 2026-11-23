import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Wallet,
  Sparkles,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Save,
  Scissors,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { Customer, CustomerBooking, DailySaleRecord } from '../types';
import { formatCurrency, formatDate, db } from '../services/db';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Customer | null;
  bookings: CustomerBooking[];
  sales: DailySaleRecord[];
  onRebookAppointment?: (client: Customer) => void;
  onRefresh: () => void;
}

type TabType = 'overview' | 'appointments' | 'sales' | 'notes';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  bookings,
  sales,
  onRebookAppointment,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notesText, setNotesText] = useState(client?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !client) return null;

  // Filter client's bookings
  const clientBookings = bookings.filter((b) => {
    if (b.customerId === client.id) return true;
    if (b.customerMobile && client.mobile) {
      const cleanB = b.customerMobile.replace(/[^0-9]/g, '').slice(-8);
      const cleanC = client.mobile.replace(/[^0-9]/g, '').slice(-8);
      if (cleanB && cleanB === cleanC) return true;
    }
    return false;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Filter client's sales transactions
  const clientSales = sales.filter((s) => {
    if (s.customerId === client.id) return true;
    if (s.mobileNumber && client.mobile) {
      const cleanS = s.mobileNumber.replace(/[^0-9]/g, '').slice(-8);
      const cleanC = client.mobile.replace(/[^0-9]/g, '').slice(-8);
      if (cleanS && cleanS === cleanC) return true;
    }
    return false;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.srNo || 0) - (a.srNo || 0));

  const totalSpent =
    client.totalSpent ||
    clientSales.reduce((sum, s) => sum + (Number(s.netSales) || 0), 0);
  const totalVisits = client.totalVisits || clientSales.length;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setSaveSuccess(false);
    try {
      const updated: Customer = {
        ...client,
        notes: notesText.trim() || undefined,
      };
      await db.saveCustomer(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-white/20">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{client.name}</h2>
                {client.isVip && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    VIP CLIENT
                  </span>
                )}
                {client.segment && !client.isVip && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {client.segment}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                <span>{client.id}</span>
                <span>·</span>
                <span>{client.mobile}</span>
                {client.email && (
                  <>
                    <span>·</span>
                    <span className="font-sans text-slate-300">{client.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRebookAppointment && (
              <button
                type="button"
                onClick={() => onRebookAppointment(client)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Book Appointment</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Summary Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          {/* Lifetime Spend */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Lifetime Spend
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
              QAR {formatCurrency(totalSpent)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total services & retail</span>
          </div>

          {/* Total Visits */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Visits
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-purple-700 mt-1 tabular-nums">
              {totalVisits}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Completed salon sessions</span>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Outstanding Due
            </span>
            <div
              className={`text-base sm:text-lg font-bold font-mono mt-1 tabular-nums ${
                client.outstandingBalance && client.outstandingBalance > 0
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}
            >
              QAR {formatCurrency(client.outstandingBalance || 0)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {client.outstandingBalance && client.outstandingBalance > 0
                ? 'Pending settlement'
                : 'Account settled'}
            </span>
          </div>

          {/* Wallet / Loyalty Balance */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Wallet Balance
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-indigo-700 mt-1 tabular-nums">
              QAR {formatCurrency(client.walletBalance || 0)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Prepaid salon balance</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Demographics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments ({clientBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales & Receipts ({clientSales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Client Notes & Formula</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 1: Overview & Demographics */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Contact & Personal Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Client Name:</span>
                      <span className="font-semibold text-slate-900">{client.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mobile Phone:</span>
                      <a
                        href={`tel:${client.mobile.replace(/\s+/g, '')}`}
                        className="font-mono font-medium text-indigo-600 hover:underline"
                      >
                        {client.mobile}
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="font-medium text-slate-800">{client.email || 'None on file'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Gender:</span>
                      <span className="font-medium text-slate-800">{client.gender || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Birthday:</span>
                      <span className="font-medium text-slate-800">
                        {client.birthday ? formatDate(client.birthday) : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Salon Membership & History
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Client ID:</span>
                      <span className="font-mono font-semibold text-slate-900">{client.id}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Client Segment:</span>
                      <span className="font-semibold text-purple-700">
                        {client.segment || (client.isVip ? 'VIP' : 'Regular')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Registration Date:</span>
                      <span className="font-medium text-slate-800">
                        {client.createdAt ? formatDate(client.createdAt.slice(0, 10)) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Last Salon Visit:</span>
                      <span className="font-medium text-slate-800">
                        {client.lastVisitDate ? formatDate(client.lastVisitDate) : 'Never visited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Total Invoices Recorded:</span>
                      <span className="font-mono font-semibold text-slate-800">{clientSales.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Notes View */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Current Client Notes & Preferences</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Edit Notes →
                  </button>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                  {client.notes || 'No special instructions or technical notes recorded for this client.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Appointment Ledger */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {clientBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Appointments Recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This client has no past or upcoming calendar bookings in the system.
                  </p>
                  {onRebookAppointment && (
                    <button
                      type="button"
                      onClick={() => onRebookAppointment(client)}
                      className="mt-3 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Appointment</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {clientBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {b.serviceName || 'Salon Service'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                            {b.serviceCategory}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              b.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'Confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span>
                            Date: <strong>{formatDate(b.date)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Time: <strong>{b.startTime} - {b.endTime}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Specialist: <strong>{b.employeeName}</strong>
                          </span>
                        </div>
                        {b.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-1">
                            Notes: {b.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          QAR {formatCurrency(b.servicePrice || 0)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{b.bookingCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sales Receipts & Transaction History */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              {clientSales.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Sales Records Found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This client has not settled any recorded sales invoices yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {clientSales.map((s) => (
                    <div
                      key={s.saleId}
                      className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-indigo-700 text-xs">
                            {s.srCode}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-800">
                            {formatDate(s.date)}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              s.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.paymentStatus === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : s.paymentStatus === 'Refunded'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.paymentStatus}
                          </span>
                        </div>

                        {/* Services itemized */}
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {s.services && s.services.length > 0 && (
                            <div>
                              Services:{' '}
                              {s.services
                                .map((line) => `${line.serviceName} (${line.employeeName})`)
                                .join(', ')}
                            </div>
                          )}
                          {s.products && s.products.length > 0 && (
                            <div className="text-slate-500">
                              Products:{' '}
                              {s.products
                                .map((p) => `${p.productName} (x${p.quantity})`)
                                .join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Payment Breakdown */}
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                          {s.posCard > 0 && <span>POS: QAR {formatCurrency(s.posCard)}</span>}
                          {s.cash > 0 && <span>Cash: QAR {formatCurrency(s.cash)}</span>}
                          {s.fawran > 0 && <span>Fawran: QAR {formatCurrency(s.fawran)}</span>}
                          {s.unpaid > 0 && (
                            <span className="text-rose-600 font-bold">
                              Unpaid: QAR {formatCurrency(s.unpaid)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          QAR {formatCurrency(s.netSales || 0)}
                        </div>
                        <span className="text-[10px] text-slate-400">Total Billed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Client Notes & Formula Editor */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Salon Client Notes & Technical Formula
                </h4>
                <p className="text-xs text-slate-500">
                  Record hair dye formulas, allergies, lash styling preferences, patch test confirmations, or personalized drink preferences.
                </p>
                <textarea
                  rows={6}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g. Wella Koleston 7/1 + 6% 20vol (1:1). Allergic to latex adhesive. Prefers green tea with honey."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white resize-y"
                />
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {saveSuccess && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Notes saved successfully!</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Client since{' '}
            <strong className="text-slate-800">
              {client.createdAt ? formatDate(client.createdAt.slice(0, 10)) : 'N/A'}
            </strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
