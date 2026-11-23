import React, { useState, useMemo } from 'react';
import { UserCheck, Eye, Search, AlertCircle, Trash2, Printer, Download, Archive, Loader2 } from 'lucide-react';
import { Employee } from '../types';
import { formatCurrency, db } from '../services/db';
import { ConfirmModal } from './ConfirmModal';
import { triggerPrintWithTarget } from '../services/printHelper';
import { exportElementToPdf } from '../services/pdfService';

interface UnemployedViewProps {
  employees: Employee[];
  onOpenEmployee: (empId: string) => void;
  onReactivate: (empId: string) => void;
  onRefresh?: () => void;
}

export const UnemployedView: React.FC<UnemployedViewProps> = ({
  employees,
  onOpenEmployee,
  onReactivate,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const formerEmployees = useMemo(() => {
    return employees.filter((emp) => emp.status === 'Unemployed');
  }, [employees]);

  const filtered = useMemo(() => {
    if (!searchTerm) return formerEmployees;
    const term = searchTerm.toLowerCase();
    return formerEmployees.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(term) ||
        e.employeeId.toLowerCase().includes(term) ||
        e.position.toLowerCase().includes(term) ||
        (e.reasonForLeaving && e.reasonForLeaving.toLowerCase().includes(term))
    );
  }, [formerEmployees, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    await db.deleteEmployee(employeeToDelete.employeeId);
    setEmployeeToDelete(null);
    if (onRefresh) onRefresh();
  };

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      await exportElementToPdf('printable-former-employees', {
        filename: `COSMOS_Former_Employees_Archive_${dateStr}.pdf`,
        orientation: 'p',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintOrPdf = () => {
    window.printDocument(
      'printable-former-employees',
      `COSMOS_Former_Employees_Archive_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-600" />
            <span>Unemployed &amp; Former Employees Archive</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived records, exit reasons, and outstanding liabilities for former staff members ({formerEmployees.length} archived).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search former staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isDownloadingPdf}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="Save former staff archive as PDF (Direct Download)"
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
            onClick={handlePrintOrPdf}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="Print Official Letter (A4)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Letter (A4)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Last Working Date</th>
                <th className="py-2.5 px-3">Reason for Leaving</th>
                <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => (
                <tr
                  key={emp.employeeId}
                  onClick={() => onOpenEmployee(emp.employeeId)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-bold font-mono text-slate-900">{emp.employeeId}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{emp.employeeName}</td>
                  <td className="py-3 px-3 text-slate-600">{emp.company}</td>
                  <td className="py-3 px-3 text-slate-700">{emp.position}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {emp.lastWorkingDate || 'Not specified'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                      {emp.reasonForLeaving || 'Resigned'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono tabular-nums text-rose-600">
                    QAR {formatCurrency(emp.outstanding)}
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenEmployee(emp.employeeId)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => onReactivate(emp.employeeId)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-1"
                        title="Reactivate employee and return to active directory"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reactivate</span>
                      </button>
                      <button
                        onClick={() => setEmployeeToDelete(emp)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Permanently Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No former / unemployed staff in archive.</p>
              <p className="text-xs text-slate-400 mt-1">
                When employees resign or finish contract, use "Move to Former" from the employee profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {employeeToDelete && (
        <ConfirmModal
          isOpen={Boolean(employeeToDelete)}
          title={`Delete ${employeeToDelete.employeeName}?`}
          message={`Are you sure you want to permanently delete archive record for "${employeeToDelete.employeeName}" (${employeeToDelete.employeeId})?\n\nThis will remove their profile and associated payroll history. This action cannot be undone.`}
          confirmLabel="Yes, Delete Permanently"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setEmployeeToDelete(null)}
        />
      )}

      {/* Dedicated Printable Former Employees Archive for @media print */}
      <div id="printable-former-employees" className="hidden font-sans text-slate-950 bg-white p-8">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            COSMOS BEAUTY SALON
          </h1>
          <p style={{ fontSize: '10pt', color: '#444', marginTop: '4px' }}>
            Luxury Salon &amp; Spa • Doha, State of Qatar • Human Resources Department
          </p>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase', textDecoration: 'underline' }}>
            OFFICIAL UNEMPLOYED &amp; FORMER STAFF ARCHIVE REPORT
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9.5pt', color: '#333' }}>
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Total Former Staff:</strong> {formerEmployees.length} Records</div>
            <div><strong>Classification:</strong> Former / Archived Employees</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>No</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Employee ID</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Full Name</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Company</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Position</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Last Working Date</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Reason for Leaving</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Outstanding Balance</th>
            </tr>
          </thead>
          <tbody>
            {formerEmployees.map((emp, index) => (
              <tr key={emp.employeeId} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', fontFamily: 'monospace', fontWeight: 'bold' }}>{emp.employeeId}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', fontWeight: '600' }}>{emp.employeeName}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.company}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.position}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.lastWorkingDate || 'Not specified'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.reasonForLeaving || 'End of service'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                  QAR {formatCurrency(emp.outstanding || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td colSpan={7} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>
                Total Outstanding Former Staff Liabilities:
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                QAR {formatCurrency(formerEmployees.reduce((sum, e) => sum + (Number(e.outstanding) || 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Dual Signatures & Stamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'center', width: '180px' }}>
            <div style={{ width: '100px', height: '100px', border: '2px dashed #888', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '9pt', color: '#777' }}>
              Company Stamp
            </div>
            <div style={{ fontSize: '9.5pt', fontWeight: 'bold', marginTop: '6px' }}>COSMOS BEAUTY SALON</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold', fontSize: '10pt' }}>
              HR &amp; Legal Affairs
            </div>
            <div style={{ fontSize: '9pt', color: '#555' }}>Authorized Official Signature</div>
            <div style={{ fontSize: '8.5pt', color: '#777', marginTop: '2px' }}>State of Qatar</div>
          </div>
        </div>
      </div>
    </div>
  );
};
