import React, { useState, useMemo } from 'react';
import { Archive, Search, Printer, Trash2, FileSpreadsheet, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Certificate } from '../types';
import { db, formatDate } from '../services/db';
import { exportCertificatesToExcel } from '../services/excel';
import { ConfirmModal } from './ConfirmModal';

interface CertificateArchiveViewProps {
  certificates: Certificate[];
  onRefresh: () => void;
  onReprint: (cert: Certificate) => void;
}

export const CertificateArchiveView: React.FC<CertificateArchiveViewProps> = ({
  certificates,
  onRefresh,
  onReprint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);

  // Stats
  const stats = useMemo(() => {
    let salary = 0;
    let employment = 0;
    let termination = 0;
    let vacating = 0;
    let entitlements = 0;
    let thisMonth = 0;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    certificates.forEach((c) => {
      if (c.certType === 'salary') salary++;
      else if (c.certType === 'employment') employment++;
      else if (c.certType === 'termination') termination++;
      else if (c.certType === 'vacating') vacating++;
      else if (c.certType === 'entitlements') entitlements++;
      const d = new Date(c.createdAt);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        thisMonth++;
      }
    });

    return {
      total: certificates.length,
      salary,
      employment,
      termination,
      vacating,
      entitlements,
      thisMonth,
    };
  }, [certificates]);

  // Filtered
  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const matchType = typeFilter ? c.certType === typeFilter : true;
      if (!searchTerm) return matchType;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        c.employeeName.toLowerCase().includes(term) ||
        c.employeeId.toLowerCase().includes(term) ||
        c.reference.toLowerCase().includes(term) ||
        c.recipient.toLowerCase().includes(term) ||
        c.employeeQid.toLowerCase().includes(term);
      return matchType && matchSearch;
    });
  }, [certificates, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-600" />
            <span>Official Certificate Archive &amp; Print Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history of generated salary certificates, bank letters, employment confirmations, termination notices, accommodation vacating forms, and financial entitlements receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, employee, QID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="">All Types</option>
            <option value="salary">Salary Certificates</option>
            <option value="employment">Employment Certificates</option>
            <option value="termination">Termination Letters</option>
            <option value="vacating">Accommodation Vacating Letters</option>
            <option value="entitlements">Entitlements Receipts</option>
          </select>

          <button
            onClick={() => exportCertificatesToExcel(certificates)}
            className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Issued
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">{stats.total}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Salary Certs
          </div>
          <div className="text-lg font-bold text-blue-600 tabular-nums">{stats.salary}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Employment
          </div>
          <div className="text-lg font-bold text-emerald-600 tabular-nums">{stats.employment}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Termination
          </div>
          <div className="text-lg font-bold text-rose-600 tabular-nums">{stats.termination}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Vacating
          </div>
          <div className="text-lg font-bold text-amber-600 tabular-nums">{stats.vacating}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Entitlements
          </div>
          <div className="text-lg font-bold text-teal-600 tabular-nums">{stats.entitlements}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            This Month
          </div>
          <div className="text-lg font-bold text-indigo-600 tabular-nums">{stats.thisMonth}</div>
        </div>
      </div>

      {/* Certificate List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map((cert) => (
            <div
              key={cert.certId}
              className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    cert.certType === 'salary'
                      ? 'bg-blue-50 text-blue-600'
                      : cert.certType === 'termination'
                      ? 'bg-rose-50 text-rose-600'
                      : cert.certType === 'vacating'
                      ? 'bg-amber-50 text-amber-600'
                      : cert.certType === 'entitlements'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cert.certType === 'salary'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : cert.certType === 'termination'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : cert.certType === 'vacating'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : cert.certType === 'entitlements'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {cert.certTypeName}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {cert.reference}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mt-1">
                    {cert.employeeName}{' '}
                    <span className="font-normal text-xs text-slate-500 font-mono">
                      ({cert.employeeId} · QID: {cert.employeeQid})
                    </span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>
                      <strong>To:</strong> {cert.recipient}
                    </span>
                    <span>·</span>
                    <span>
                      <strong>Date:</strong> {formatDate(cert.correspondingDate)}
                    </span>
                    <span>·</span>
                    <span>
                      <strong>Signatory:</strong> {cert.signatoryName}
                    </span>
                    {cert.certType === 'vacating' && cert.vacatingDate && (
                      <>
                        <span>·</span>
                        <span className="text-amber-800 font-medium">
                          <strong>Vacating Date:</strong> {formatDate(cert.vacatingDate)}
                        </span>
                        {cert.vacatingReason && (
                          <>
                            <span>·</span>
                            <span className="text-amber-800 font-medium">
                              <strong>Reason:</strong> {cert.vacatingReason}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {cert.certType === 'entitlements' && (
                      <>
                        {cert.employmentEndDate && (
                          <>
                            <span>·</span>
                            <span className="text-teal-800 font-medium">
                              <strong>Ended On:</strong> {formatDate(cert.employmentEndDate)}
                            </span>
                          </>
                        )}
                        {cert.entitlementReason && (
                          <>
                            <span>·</span>
                            <span className="text-teal-800 font-medium">
                              <strong>Reason:</strong> {cert.entitlementReason}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onReprint(cert)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reprint</span>
                </button>

                <button
                  onClick={() => setCertToDelete(cert)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete certificate from archive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No certificates found in archive.</p>
              <p className="text-xs text-slate-400 mt-1">
                Generate new official salary or work certificates from the Certificate Generator tab.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      {certToDelete && (
        <ConfirmModal
          isOpen={!!certToDelete}
          title="Delete Certificate"
          message={`Are you sure you want to permanently delete archived certificate ${certToDelete.reference} for ${certToDelete.employeeName}? This action cannot be undone.`}
          confirmText="Delete Certificate"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={async () => {
            await db.deleteCertificate(certToDelete.certId);
            setCertToDelete(null);
            onRefresh();
          }}
          onCancel={() => setCertToDelete(null)}
        />
      )}
    </div>
  );
};
