import React, { useState, useMemo } from 'react';
import { Search, Eye, UserMinus, Plus, Users, Trash2, Printer, Download, Loader2 } from 'lucide-react';
import { Employee } from '../types';
import { formatCurrency, calculateDaysRemaining, db } from '../services/db';
import { ConfirmModal } from './ConfirmModal';
import { triggerPrintWithTarget } from '../services/printHelper';
import { exportElementToPdf } from '../services/pdfService';

interface ActiveEmployeesViewProps {
  employees: Employee[];
  onOpenEmployee: (empId: string) => void;
  onNavigateAdd: () => void;
  onToggleStatus: (empId: string) => void;
  onRefresh?: () => void;
}

export const ActiveEmployeesView: React.FC<ActiveEmployeesViewProps> = ({
  employees,
  onOpenEmployee,
  onNavigateAdd,
  onToggleStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const activeEmployees = useMemo(() => {
    return employees.filter((emp) => emp.status !== 'Unemployed');
  }, [employees]);

  const filtered = useMemo(() => {
    if (!searchTerm) return activeEmployees;
    const term = searchTerm.toLowerCase();
    return activeEmployees.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(term) ||
        e.employeeId.toLowerCase().includes(term) ||
        e.position.toLowerCase().includes(term) ||
        e.residencyQid.toLowerCase().includes(term) ||
        e.passportNumber.toLowerCase().includes(term) ||
        e.nationality.toLowerCase().includes(term) ||
        e.payerBank.toLowerCase().includes(term)
    );
  }, [activeEmployees, searchTerm]);

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
      await exportElementToPdf('printable-active-employees', {
        filename: `COSMOS_Active_Employees_Directory_${dateStr}.pdf`,
        orientation: 'p',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintOrPdf = () => {
    window.printDocument(
      'printable-active-employees',
      `COSMOS_Active_Employees_Directory_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Active Employees Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Managing {activeEmployees.length} active staff members across COSMOS Beauty Salon facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search active staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePdf}
            disabled={isDownloadingPdf}
            className="px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="Save Active Employees Directory as PDF (Direct Download)"
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
            className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            title="Print Official Letter (A4)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Letter (A4)</span>
          </button>

          <button
            onClick={onNavigateAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Nationality</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3">Joining Date</th>
                <th className="py-2.5 px-3">End Contract</th>
                <th className="py-2.5 px-3">Duty</th>
                <th className="py-2.5 px-3">Passport Expiry</th>
                <th className="py-2.5 px-3">QID Expiry</th>
                <th className="py-2.5 px-3 text-right">Basic Salary</th>
                <th className="py-2.5 px-3 text-right">Total Package</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right sticky right-0 bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp, idx) => {
                const pDays = calculateDaysRemaining(emp.passportExpiry);
                const qDays = calculateDaysRemaining(emp.residencyExpiry);

                return (
                  <tr
                    key={emp.employeeId}
                    onClick={() => onOpenEmployee(emp.employeeId)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500">{emp.no || idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900">{emp.employeeId}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.employeeName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.company}</td>
                    <td className="py-2.5 px-3 text-slate-800">{emp.position}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.nationality}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{emp.mobile || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{emp.joiningDate}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{emp.endContract}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {emp.duty}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          pDays < 90
                            ? 'bg-rose-100 text-rose-800'
                            : pDays < 180
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {emp.passportExpiry || 'N/A'} (Day {pDays})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          qDays < 90
                            ? 'bg-rose-100 text-rose-800'
                            : qDays < 180
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {emp.residencyExpiry || 'N/A'} (Day {qDays})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      QAR {formatCurrency(emp.basicSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 bg-slate-50/60">
                      QAR {formatCurrency(emp.totalSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-rose-600">
                      QAR {formatCurrency(emp.outstanding)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenEmployee(emp.employeeId)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onToggleStatus(emp.employeeId)}
                          className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors flex items-center gap-1"
                          title="Move to Former / Unemployed"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Former</span>
                        </button>
                        <button
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <p>No active employees found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Printable Active Employees Directory for @media print */}
      <div id="printable-active-employees" className="hidden font-sans text-slate-950 bg-white p-8">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            COSMOS BEAUTY SALON
          </h1>
          <p style={{ fontSize: '10pt', color: '#444', marginTop: '4px' }}>
            Luxury Salon &amp; Spa • Doha, State of Qatar • Human Resources Department
          </p>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase', textDecoration: 'underline' }}>
            OFFICIAL ACTIVE EMPLOYEES DIRECTORY &amp; ROSTER
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '9.5pt', color: '#333' }}>
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Total Active Staff:</strong> {activeEmployees.length} Employees</div>
            <div><strong>Status:</strong> Active / Full-Time Employment</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>No</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Full Name</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Position</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Nationality</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>QID No</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Mobile</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>Joining Date</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Basic Salary (QAR)</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp, index) => (
              <tr key={emp.employeeId} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', fontFamily: 'monospace', fontWeight: 'bold' }}>{emp.employeeId}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', fontWeight: '600' }}>{emp.employeeName}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.position}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.nationality}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', fontFamily: 'monospace' }}>{emp.residencyQid}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.mobile}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px' }}>{emp.joiningDate}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {formatCurrency(emp.basicSalary)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td colSpan={8} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>
                Total Active Monthly Basic Payroll:
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                QAR {formatCurrency(activeEmployees.reduce((sum, e) => sum + (Number(e.basicSalary) || 0), 0))}
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
              HR &amp; Operations Manager
            </div>
            <div style={{ fontSize: '9pt', color: '#555' }}>Authorized Official Signature</div>
            <div style={{ fontSize: '8.5pt', color: '#777', marginTop: '2px' }}>State of Qatar</div>
          </div>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {employeeToDelete && (
        <ConfirmModal
          isOpen={Boolean(employeeToDelete)}
          title={`Delete ${employeeToDelete.employeeName}?`}
          message={`Are you sure you want to permanently delete employee "${employeeToDelete.employeeName}" (${employeeToDelete.employeeId})?\n\nThis will remove their profile, attachments, and associated records from the salon system. This action cannot be undone.`}
          confirmLabel="Yes, Delete Employee"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setEmployeeToDelete(null)}
        />
      )}
    </div>
  );
};
