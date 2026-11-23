import React, { useState } from 'react';
import {
  Mail,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Inbox,
  Phone,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { EmailSettings, ContactMessage } from '../types';
import { db } from '../services/db';

interface EmailConfigViewProps {
  onRefresh: () => void;
}

export const EmailConfigView: React.FC<EmailConfigViewProps> = ({ onRefresh }) => {
  const currentSettings = db.getEmailSettings();
  const contactMessages = db.getContactMessages();

  const [settings, setSettings] = useState<EmailSettings>({ ...currentSettings });
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveEmailSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefresh();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await db.testEmailConnection(settings);
      setTestResult(res);
      onRefresh();
    } catch {
      setTestResult({
        success: false,
        message: 'Diagnostic test failed to execute.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'New' | 'Read' | 'Replied') => {
    await db.updateContactMessageStatus(id, status);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Email Notifications & SMTP Server Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Configure system outbound email services for password resets, recovery notifications, and customer inquiries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
              settings.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {settings.isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SMTP Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>In-App Dispatch Only</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Designated Accounts Overview */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-md space-y-1">
          <p className="text-[11px] text-purple-200 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Main Designated Account Recovery Email</span>
          </p>
          <p className="text-lg font-bold font-mono text-purple-100 select-all">
            cosmosbeautyqatar@gmail.com
          </p>
          <p className="text-[11px] text-purple-200/80 pt-1">
            Designated inbox for administrator username recovery, security override codes, and system critical notifications.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-900 to-pink-950 text-white shadow-md space-y-1">
          <p className="text-[11px] text-rose-200 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-rose-300" />
            <span>Public Website Contact Recipient</span>
          </p>
          <p className="text-lg font-bold font-mono text-rose-100 select-all">
            csmsbeauty@gmail.com
          </p>
          <p className="text-[11px] text-rose-200/80 pt-1">
            Displayed on public landing page and receives incoming inquiries and appointment consultation requests.
          </p>
        </div>
      </div>

      {/* SMTP Configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Outbound SMTP Gateway Settings</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            TLS/STARTTLS or SSL on standard ports
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Email configuration saved successfully!</span>
          </div>
        )}

        {testResult && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">
                {testResult.success ? 'SMTP Verification Passed' : 'SMTP Notice / Warning'}
              </p>
              <p className="text-slate-600">{testResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700">SMTP Host / Server</label>
              <input
                type="text"
                placeholder="e.g. smtp.gmail.com or mail.cosmosbeautysalon.qa"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">SMTP Port</label>
              <input
                type="number"
                placeholder="587"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Encryption Method</label>
              <select
                value={settings.encryption}
                onChange={(e) => setSettings({ ...settings, encryption: e.target.value as 'TLS' | 'SSL' | 'None' })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 text-xs"
              >
                <option value="TLS">TLS / STARTTLS (Port 587)</option>
                <option value="SSL">SSL (Port 465)</option>
                <option value="None">None (Port 25)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Sender Email Address</label>
              <input
                type="email"
                placeholder="noreply@cosmosbeautysalon.qa"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Sender Display Name</label>
              <input
                type="text"
                placeholder="Cosmos Beauty Salon"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 text-xs"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">SMTP Username</label>
              <input
                type="text"
                placeholder="e.g. notifications@cosmosbeautysalon.qa"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">SMTP Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter SMTP password or App Password"
                  value={settings.smtpPass}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                  className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Server...' : 'Test Connection / Verify SMTP'}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              Save Email Settings
            </button>
          </div>
        </form>
      </div>

      {/* Website Contact Inquiries Inbox */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Customer Landing Page Inquiries ({contactMessages.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Submissions via public website contact form
          </span>
        </div>

        {contactMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-600">No contact inquiries received yet</p>
            <p>Customer submissions from the landing page will appear here immediately.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contactMessages.map((msg) => (
              <div key={msg.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        msg.status === 'New'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : msg.status === 'Replied'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {msg.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(msg.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(msg.id, 'Read')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={() => handleStatusChange(msg.id, 'Replied')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-medium"
                    >
                      Mark Replied
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                  <a
                    href={`mailto:${msg.email}`}
                    className="flex items-center gap-1 text-rose-600 hover:underline font-mono"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{msg.email}</span>
                  </a>
                  <a
                    href={`tel:${msg.mobile}`}
                    className="flex items-center gap-1 text-slate-700 hover:underline font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{msg.mobile}</span>
                  </a>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-800 leading-relaxed">
                  {msg.message}
                </div>

                {msg.deliveryNote && (
                  <p className="text-[10px] text-slate-400 italic">
                    Status Note: {msg.deliveryNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
