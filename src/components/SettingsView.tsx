import React, { useState } from 'react';
import { Settings, Save, Plus, Trash2, Building2, DollarSign, Calendar, Clock, FileText, CheckCircle2, Sun, Moon } from 'lucide-react';
import { SystemSettings, BankInfo } from '../types';
import { db } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  settings: SystemSettings;
  banks: BankInfo[];
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, banks, onRefresh }) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [newBankName, setNewBankName] = useState('');
  const [newBankShort, setNewBankShort] = useState('');
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  const handleAddBank = async () => {
    if (!newBankName.trim() || !newBankShort.trim()) {
      alert('Please enter both bank name and short code (e.g. QIB).');
      return;
    }
    await db.addBank({
      name: newBankName.trim(),
      short: newBankShort.trim().toUpperCase(),
    });
    setNewBankName('');
    setNewBankShort('');
    onRefresh();
  };

  const handleRemoveBank = (shortName: string) => {
    setBankToDelete(shortName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Salon HR &amp; System Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure legal entity headers, commission thresholds, shift schedules, and authorized manager signatories.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All system configurations and Qatar salon policies updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Salon Business &amp; Letterhead Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address / Location</label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telephone / Hotline</label>
              <input
                type="text"
                value={formData.companyPhone}
                onChange={(e) => handleChange('companyPhone', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">HR Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleChange('companyEmail', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">5. Salon Service, Retail &amp; Business Target Commissions</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Configurable at any time · Applied as defaults to new records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-blue-900 block">
                1. Service Sales Commission
              </span>
              <label className="block text-[11px] font-semibold text-slate-600">
                Default Service Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.salesCommRate}
                onChange={(e) => handleChange('salesCommRate', parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500">
                Rule: Eligible when employee actual sales ≥ target. If below target, commission is 0.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-emerald-900 block">
                2. Products Sales Commission
              </span>
              <label className="block text-[11px] font-semibold text-slate-600">
                Default Product Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.productCommRate}
                onChange={(e) => handleChange('productCommRate', parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500">
                Rule: Tracked separately. Calculated at {formData.productCommRate}% if product sales &gt; 0.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-purple-900 block">
                3. Business Gross Commission Rate
              </span>
              <label className="block text-[11px] font-semibold text-slate-600">
                Default Business Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.businessCommRate}
                onChange={(e) => handleChange('businessCommRate', parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500">
                Default 5%. Applied when total business gross reaches target benchmark.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Business Sales Target (QAR) *
              </label>
              <input
                type="number"
                step="1000"
                value={formData.businessTarget}
                onChange={(e) => handleChange('businessTarget', parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Default benchmark is QAR 200,000. If business gross is below target, business commission is zero.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Commission Calculation Base Mode *
              </label>
              <select
                value={formData.businessCommBase || 'all_gross'}
                onChange={(e) => handleChange('businessCommBase', e.target.value as 'all_gross' | 'above_target')}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-medium"
              >
                <option value="all_gross">All Eligible Gross Sales (Business Gross × Rate)</option>
                <option value="above_target">Only Amount Above Target ((Business Gross − Target) × Rate)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Configures whether the business commission calculates on the full gross or the incremental portion above target.
              </p>
            </div>
          </div>
        </div>

        {/* Leave & Ticket Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">Leave &amp; Flight Ticket Accrual Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Annual Leave Entitlement (Days)
              </label>
              <input
                type="number"
                value={formData.leaveEntitlement}
                onChange={(e) => handleChange('leaveEntitlement', parseInt(e.target.value) || 21)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Daily Rate Divisor (Default 30)
              </label>
              <input
                type="number"
                value={formData.leaveDivisor}
                onChange={(e) => handleChange('leaveDivisor', parseInt(e.target.value) || 30)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Flight Ticket Cycle (Years)
              </label>
              <input
                type="number"
                value={formData.ticketCycle}
                onChange={(e) => handleChange('ticketCycle', parseInt(e.target.value) || 2)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Attendance Shifts: Single Shift from Morning to Night */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Standard Salon Shift: Morning to Night (Single Shift)</h3>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Full Day Salon Model (09:00 AM → 09:00 PM)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning Time In */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-1.5 pb-2 border-b border-amber-200/60">
                <Sun className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Morning Opening (Time In Default)
                </h4>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Standard Morning Time In
                </label>
                <input
                  type="time"
                  value={formData.attOpening || '09:00'}
                  onChange={(e) => {
                    handleChange('attOpening', e.target.value);
                    handleChange('attMorningStart', e.target.value);
                  }}
                  className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Night Time Out */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
              <div className="flex items-center gap-1.5 pb-2 border-b border-indigo-200/60">
                <Moon className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Night Closing (Time Out Default)
                </h4>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                  Standard Night Time Out
                </label>
                <input
                  type="time"
                  value={formData.attClosing || '21:00'}
                  onChange={(e) => {
                    handleChange('attClosing', e.target.value);
                    handleChange('attNightEnd', e.target.value);
                  }}
                  className="w-full text-xs p-2.5 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Grace Period & Breaks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Afternoon Break Start</label>
              <input
                type="time"
                value={formData.attBreakStart || '13:00'}
                onChange={(e) => handleChange('attBreakStart', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Afternoon Break End</label>
              <input
                type="time"
                value={formData.attBreakEnd || '14:00'}
                onChange={(e) => handleChange('attBreakEnd', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Late Arrival Threshold (Mins)</label>
              <input
                type="number"
                value={formData.attLateThreshold || 15}
                onChange={(e) => handleChange('attLateThreshold', parseInt(e.target.value) || 15)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Certificate Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Certificate Signatory &amp; Validation</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Default Signatory Name
              </label>
              <input
                type="text"
                value={formData.signatoryName}
                onChange={(e) => handleChange('signatoryName', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Signatory Title</label>
              <input
                type="text"
                value={formData.signatoryTitle}
                onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Certificate Validity (Months)
              </label>
              <input
                type="number"
                value={formData.certValidity}
                onChange={(e) => handleChange('certValidity', parseInt(e.target.value) || 1)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Qatar Banks Management */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Qatar Banks &amp; Financial Institutions</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Bank full name (e.g. Al Khaliji Bank)"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Short Code (e.g. KHALIJI)"
              value={newBankShort}
              onChange={(e) => setNewBankShort(e.target.value.toUpperCase())}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg w-32 font-mono uppercase"
            />
            <button
              type="button"
              onClick={handleAddBank}
              className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Bank</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {banks.map((b) => (
              <div
                key={b.short}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{b.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Code: {b.short}</div>
                </div>
                {b.short !== 'OTHER' && !['QIB', 'CBQ', 'QNB', 'DB', 'MAR', 'BBK', 'ABQ', 'IBQ', 'QDB', 'HSBC', 'SCB', 'CITI', 'BARWA', 'QFB'].includes(b.short) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBank(b.short)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Remove custom bank"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>
      </form>

      {/* Custom Bank Deletion Modal */}
      {bankToDelete && (
        <ConfirmModal
          isOpen={!!bankToDelete}
          title="Remove Custom Bank"
          message={`Are you sure you want to remove custom bank "${bankToDelete}" from your salon system bank options?`}
          confirmText="Remove Bank"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={async () => {
            await db.removeBank(bankToDelete);
            setBankToDelete(null);
            onRefresh();
          }}
          onCancel={() => setBankToDelete(null)}
        />
      )}
    </div>
  );
};
