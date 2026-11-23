import React, { useState } from 'react';
import { Plane, Calendar, FileSpreadsheet, Plus, CheckCircle, Clock, Edit3, Save, Check } from 'lucide-react';
import { Employee, LeaveRecord, FlightTicketRecord } from '../types';
import { db, formatDate, formatCurrency } from '../services/db';
import { exportLeaveAndTicketsToExcel } from '../services/excel';

interface LeaveManagementViewProps {
  employees: Employee[];
  leaves: LeaveRecord[];
  tickets: FlightTicketRecord[];
  onRefresh: () => void;
  onOpenEmployee: (empId: string) => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  employees,
  leaves,
  tickets,
  onRefresh,
  onOpenEmployee,
}) => {
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('');

  // Per-employee entitlement editing state
  const [editingEntitlements, setEditingEntitlements] = useState<Record<string, number>>({});
  const [entitlementToast, setEntitlementToast] = useState<string | null>(null);

  // Modal for detailed entitlement & ticket editing
  const [showEntitlementModal, setShowEntitlementModal] = useState(false);
  const [modalEmp, setModalEmp] = useState<Employee | null>(null);
  const [modalEntitlementDays, setModalEntitlementDays] = useState<number>(21);
  const [modalCreditDays, setModalCreditDays] = useState<number>(21);
  const [modalTicketCycle, setModalTicketCycle] = useState<number>(2);
  const [modalNextTicketDate, setModalNextTicketDate] = useState<string>('');
  const [modalTicketStatus, setModalTicketStatus] = useState<string>('Not Eligible');
  const [modalTicketDest, setModalTicketDest] = useState<string>('');

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Leave Form
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidStatus, setPaidStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [leaveRemarks, setLeaveRemarks] = useState('');

  // Ticket Form
  const [ticketEmpId, setTicketEmpId] = useState('');
  const [ticketPeriod, setTicketPeriod] = useState('2024-2026');
  const [eligibleDate, setEligibleDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookedDate, setBookedDate] = useState('');
  const [destination, setDestination] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [ticketStatus, setTicketStatus] = useState<FlightTicketRecord['status']>('Eligible');

  const activeEmployees = employees.filter((e) => e.status !== 'Unemployed');
  const displayedEmployees = selectedEmpFilter
    ? activeEmployees.filter((e) => e.employeeId === selectedEmpFilter)
    : activeEmployees;

  // Handle open leave request modal
  const handleOpenLeaveModal = (empId?: string) => {
    setLeaveEmpId(empId || activeEmployees[0]?.employeeId || '');
    setLeaveType('Annual Leave');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setPaidStatus('Paid');
    setLeaveRemarks('');
    setShowLeaveModal(true);
  };

  // Submit Leave Request
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId) return;

    const emp = employees.find((item) => item.employeeId === leaveEmpId);
    if (!emp) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      alert('End date must be on or after start date.');
      return;
    }

    const newRecord: LeaveRecord = {
      leaveId: `LEAVE-${emp.employeeId}-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      startDate,
      endDate,
      days,
      leaveType,
      paidStatus,
      status: 'Pending',
      period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      remarks: leaveRemarks,
      requestedDate: new Date().toISOString(),
    };

    await db.saveLeaveRecord(newRecord);
    setShowLeaveModal(false);
    onRefresh();
    alert(`✅ Leave request for ${days} days submitted for ${emp.employeeName}!`);
  };

  // Handle open ticket modal
  const handleOpenTicketModal = (empId?: string) => {
    const emp = employees.find((e) => e.employeeId === empId) || activeEmployees[0];
    setTicketEmpId(emp?.employeeId || '');
    setTicketPeriod('2024-2026');
    setEligibleDate(emp?.nextTicketDate || new Date().toISOString().slice(0, 10));
    setBookedDate('');
    setDestination(emp?.ticketDestination || '');
    setCost(0);
    setTicketStatus('Eligible');
    setShowTicketModal(true);
  };

  // Submit Flight Ticket
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmpId) return;

    const emp = employees.find((item) => item.employeeId === ticketEmpId);
    if (!emp) return;

    const record: FlightTicketRecord = {
      ticketId: `TICKET-${emp.employeeId}-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      period: ticketPeriod,
      eligibleDate,
      bookedDate,
      destination,
      cost,
      status: ticketStatus,
      createdAt: new Date().toISOString(),
    };

    await db.saveTicketRecord(record);
    setShowTicketModal(false);
    onRefresh();
    alert(`✅ Flight ticket recorded for ${emp.employeeName}!`);
  };

  // Quick inline update for an individual employee's annual leave entitlement
  const handleSaveSingleEmployeeEntitlement = async (empId: string, days: number) => {
    const emp = employees.find((e) => e.employeeId === empId);
    if (!emp) return;
    const cleanDays = Math.max(0, days);
    const updated: Employee = {
      ...emp,
      leaveEntitlement: cleanDays,
      totalCreditLeave: cleanDays,
    };
    await db.saveEmployee(updated);
    setEditingEntitlements((prev) => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    onRefresh();
    setEntitlementToast(`✅ Annual Leave Entitlement updated to ${cleanDays} days for ${emp.employeeName}!`);
    setTimeout(() => setEntitlementToast(null), 4000);
  };

  // Open modal to edit full entitlement & flight ticket settings for an employee
  const handleOpenEntitlementModal = (emp: Employee) => {
    setModalEmp(emp);
    setModalEntitlementDays(Number(emp.leaveEntitlement) || 21);
    setModalCreditDays(Number(emp.totalCreditLeave) || Number(emp.leaveEntitlement) || 21);
    setModalTicketCycle(emp.ticketCycle || 2);
    setModalNextTicketDate(emp.nextTicketDate || '');
    setModalTicketStatus(emp.ticketStatus || 'Not Eligible');
    setModalTicketDest(emp.ticketDestination || '');
    setShowEntitlementModal(true);
  };

  // Save from entitlement modal
  const handleSaveEntitlementModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmp) return;
    const updated: Employee = {
      ...modalEmp,
      leaveEntitlement: Number(modalEntitlementDays) || 21,
      totalCreditLeave: Number(modalCreditDays) || Number(modalEntitlementDays) || 21,
      ticketCycle: Number(modalTicketCycle) || 2,
      nextTicketDate: modalNextTicketDate,
      ticketStatus: modalTicketStatus,
      ticketDestination: modalTicketDest,
    };
    await db.saveEmployee(updated);
    setShowEntitlementModal(false);
    onRefresh();
    setEntitlementToast(`✅ Updated Annual Leave & Ticket settings for ${modalEmp.employeeName}!`);
    setTimeout(() => setEntitlementToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <span>Annual Leave &amp; Flight Ticket Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual leave balance (Qatar Labor Law 30-day divisor), daily wage encashment, and biennial home flight allowances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedEmpFilter}
            onChange={(e) => setSelectedEmpFilter(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg max-w-[200px]"
          >
            <option value="">All Employees</option>
            {activeEmployees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.employeeName}
              </option>
            ))}
          </select>

          <button
            onClick={() => exportLeaveAndTicketsToExcel(employees, leaves, tickets)}
            className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => handleOpenLeaveModal()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Leave</span>
          </button>

          <button
            onClick={() => handleOpenTicketModal()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Record Flight Ticket</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {entitlementToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{entitlementToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setEntitlementToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Table by Employee */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Employee Leave Balance &amp; Flight Ticket Accrual
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Edit <strong>Annual Leave Entitlement (Days)</strong> directly in any employee's row or click <strong>Entitlement</strong> to configure their complete leave policy.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Daily Encashment Rate = Basic Salary ÷ 30 Days
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[1300px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Joining Date</th>
                <th className="py-2.5 px-3 text-right min-w-[140px] text-blue-900 bg-blue-50/60 font-bold">
                  Annual Leave Entitlement (Days)
                </th>
                <th className="py-2.5 px-3 text-right">Taken</th>
                <th className="py-2.5 px-3 text-right">Pending</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-100/60">
                  Remaining
                </th>
                <th className="py-2.5 px-3 text-right">Daily Rate</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Leave Value</th>
                <th className="py-2.5 px-3">Next Ticket Date</th>
                <th className="py-2.5 px-3">Ticket Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedEmployees.map((emp) => {
                const empLeaves = leaves.filter((l) => l.employeeId === emp.employeeId);
                const currentEntitlement =
                  editingEntitlements[emp.employeeId] !== undefined
                    ? editingEntitlements[emp.employeeId]
                    : Number(emp.leaveEntitlement) || 21;
                const taken = empLeaves
                  .filter((l) => l.status === 'Approved')
                  .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
                const pending = empLeaves
                  .filter((l) => l.status === 'Pending')
                  .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
                const remaining = currentEntitlement - taken - pending;

                const basic = Number(emp.basicSalary) || 0;
                const dailyRate = basic / 30;
                const leavePaymentValue = remaining * dailyRate;
                const isModified =
                  editingEntitlements[emp.employeeId] !== undefined &&
                  editingEntitlements[emp.employeeId] !== emp.leaveEntitlement;

                return (
                  <tr
                    key={emp.employeeId}
                    onClick={() => onOpenEmployee(emp.employeeId)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                      {emp.employeeId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.employeeName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatDate(emp.joiningDate)}</td>
                    
                    {/* Editable Entitlement Cell */}
                    <td className="py-2 px-3 text-right bg-blue-50/20" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={currentEntitlement}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditingEntitlements((prev) => ({ ...prev, [emp.employeeId]: val }));
                          }}
                          onBlur={async () => {
                            if (isModified) {
                              await handleSaveSingleEmployeeEntitlement(emp.employeeId, currentEntitlement);
                            }
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (isModified) {
                                await handleSaveSingleEmployeeEntitlement(emp.employeeId, currentEntitlement);
                              }
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className={`w-16 text-xs p-1 text-right border rounded font-mono font-bold tabular-nums transition-all ${
                            isModified
                              ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/20'
                              : 'bg-white border-slate-300 text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                          title={`Click to edit Annual Leave Entitlement (Days) for ${emp.employeeName}`}
                        />
                        <span className="text-[11px] text-slate-500 font-mono">d</span>
                        {isModified && (
                          <button
                            type="button"
                            onClick={() => handleSaveSingleEmployeeEntitlement(emp.employeeId, currentEntitlement)}
                            className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                            title="Save new entitlement"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-medium">
                      {taken} d
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-600 font-medium">
                      {pending} d
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 bg-slate-100/60">
                      {remaining} d
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                      QAR {formatCurrency(dailyRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-600">
                      QAR {formatCurrency(leavePaymentValue)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {emp.nextTicketDate ? formatDate(emp.nextTicketDate) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          emp.ticketStatus === 'Eligible'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.ticketStatus === 'Booked'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : emp.ticketStatus === 'Used'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {emp.ticketStatus || 'Not Eligible'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEntitlementModal(emp)}
                          className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors flex items-center gap-1"
                          title="Configure Annual Leave Entitlement (Days) & Flight Policy for this employee"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Entitlement</span>
                        </button>
                        <button
                          onClick={() => handleOpenLeaveModal(emp.employeeId)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        >
                          + Leave
                        </button>
                        <button
                          onClick={() => handleOpenTicketModal(emp.employeeId)}
                          className="px-2 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded transition-colors"
                        >
                          + Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Request Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Submit Annual / Sick Leave Request</span>
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Employee *
                </label>
                <select
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {activeEmployees.map((e) => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.employeeName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Leave Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="Annual Leave">Annual Leave (Official)</option>
                  <option value="Sick Leave">Sick Leave (Medical Certificate)</option>
                  <option value="Emergency Leave">Emergency / Compassionate Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Remuneration Status *
                </label>
                <select
                  value={paidStatus}
                  onChange={(e) => setPaidStatus(e.target.value as 'Paid' | 'Unpaid')}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="Paid">Paid Leave (Encashable)</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Travel home to Kyrgyzstan for family visit"
                  value={leaveRemarks}
                  onChange={(e) => setLeaveRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Employee Leave Entitlement & Flight Policy */}
      {showEntitlementModal && modalEmp && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-400" />
                  <span>Configure Individual Leave Entitlement</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {modalEmp.employeeName} ({modalEmp.employeeId}) · {modalEmp.position}
                </p>
              </div>
              <button
                onClick={() => setShowEntitlementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntitlementModal} className="p-5 space-y-4">
              <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200 text-xs text-purple-900 space-y-1">
                <span className="font-bold block">Individual Employee Policy</span>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Annual leave entitlement days are stored per employee. You can configure custom agreements (e.g. 21, 28, or 30 days) separate from other salon staff.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Annual Leave Entitlement (Days) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={modalEntitlementDays}
                    onChange={(e) => setModalEntitlementDays(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700 tabular-nums focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard Qatar Labor: 21–30 days</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Credit Leave Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={modalCreditDays}
                    onChange={(e) => setModalCreditDays(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Accumulated credit balance</span>
                </div>
              </div>

              {/* Dynamic Calculation Preview */}
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-800">QAR {formatCurrency(modalEmp.basicSalary)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Daily Rate (÷30)</span>
                  <span className="font-mono font-bold text-slate-800">
                    QAR {formatCurrency((Number(modalEmp.basicSalary) || 0) / 30)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Remaining Days</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {(() => {
                      const taken = leaves
                        .filter((l) => l.employeeId === modalEmp.employeeId && l.status === 'Approved')
                        .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
                      const pending = leaves
                        .filter((l) => l.employeeId === modalEmp.employeeId && l.status === 'Pending')
                        .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
                      return modalEntitlementDays - taken - pending;
                    })()} d
                  </span>
                </div>
              </div>

              {/* Flight Ticket Section */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Flight Ticket Policy Settings
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ticket Cycle (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={modalTicketCycle}
                      onChange={(e) => setModalTicketCycle(parseInt(e.target.value) || 2)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Next Eligible Date
                    </label>
                    <input
                      type="date"
                      value={modalNextTicketDate}
                      onChange={(e) => setModalNextTicketDate(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ticket Status
                    </label>
                    <select
                      value={modalTicketStatus}
                      onChange={(e) => setModalTicketStatus(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="Not Eligible">Not Eligible</option>
                      <option value="Eligible">Eligible</option>
                      <option value="Pending">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Booked">Booked</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Home Airport / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bishkek (FRU)"
                      value={modalTicketDest}
                      onChange={(e) => setModalTicketDest(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEntitlementModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entitlement Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
