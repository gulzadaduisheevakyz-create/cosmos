import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  DollarSign,
  AlertTriangle,
  Calendar,
  Clock,
  History,
  Paperclip,
  Save,
  Trash2,
  Upload,
  Eye,
  Plus,
  UserCheck,
  UserX,
  Plane,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Scissors,
  CreditCard,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { Employee, PayrollRecord, AttendanceRecord, LeaveRecord, FlightTicketRecord, ExtraTimeTransaction, FutureDeduction, BankInfo, SystemSettings, EmployeeRole, BookingAvailabilityResult } from '../types';
import {
  db,
  formatCurrency,
  formatDate,
  formatTime12,
  minutesToTimeStr,
  calculateDaysRemaining,
  calculateEmployeeCommissions,
  getDayOfWeek,
} from '../services/db';

interface EmployeeDetailModalProps {
  employeeId: string | null;
  banks: BankInfo[];
  settings: SystemSettings;
  payrolls: PayrollRecord[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  tickets: FlightTicketRecord[];
  extraTime: ExtraTimeTransaction[];
  onClose: () => void;
  onRefresh: () => void;
}

type TabType =
  | 'profile'
  | 'schedule-booking'
  | 'commissions'
  | 'deductions'
  | 'leave'
  | 'attendance'
  | 'payroll'
  | 'documents';

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employeeId,
  banks,
  settings,
  payrolls,
  attendance,
  leaves,
  tickets,
  extraTime,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [emp, setEmp] = useState<Employee | null>(null);

  // Delete modal state (in-app modal, replaces window.confirm)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<'passportData' | 'qidData' | 'employerDocData' | null>(null);

  // Status toggle modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reasonForLeaving, setReasonForLeaving] = useState('Resigned');
  const [rejoiningDate, setRejoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [rejoiningPosition, setRejoiningPosition] = useState('');

  // Add custom payroll modal
  const [showAddPayrollModal, setShowAddPayrollModal] = useState(false);
  const [newPayMonth, setNewPayMonth] = useState('October');
  const [newPayYear, setNewPayYear] = useState('2026');

  // Availability Simulator state
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [testTime, setTestTime] = useState('10:00');
  const [testDuration, setTestDuration] = useState(60);

  // Load employee data
  useEffect(() => {
    if (employeeId) {
      const found = db.getEmployee(employeeId);
      if (found) {
        setEmp({ ...found });
      }
    }
  }, [employeeId]);

  if (!employeeId || !emp) return null;

  // Derived calculations
  const pDays = calculateDaysRemaining(emp.passportExpiry);
  const qDays = calculateDaysRemaining(emp.residencyExpiry);
  const commissions = calculateEmployeeCommissions(emp, settings);

  const empPayrolls = payrolls
    .filter((p) => p.employeeId === emp.employeeId)
    .sort((a, b) => b.year.localeCompare(a.year) || b.month.localeCompare(a.month));

  const empAttendance = attendance
    .filter((a) => a.employeeId === emp.employeeId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const empLeaves = leaves
    .filter((l) => l.employeeId === emp.employeeId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const empTickets = tickets
    .filter((t) => t.employeeId === emp.employeeId)
    .sort((a, b) => (b.eligibleDate || '').localeCompare(a.eligibleDate || ''));

  const empExtra = extraTime
    .filter((et) => et.employeeId === emp.employeeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Extra time metrics
  let extraBalance = 0;
  let grossExtra = 0;
  let usedExtra = 0;
  empExtra.forEach((et) => {
    if (et.type === 'Earned') {
      grossExtra += et.minutes;
      extraBalance += et.minutes;
    } else if (et.type === 'Used') {
      usedExtra += et.minutes;
      extraBalance -= et.minutes;
    }
  });

  // Leave metrics
  const entitlement = Number(emp.leaveEntitlement) || 21;
  const takenLeaves = empLeaves
    .filter((l) => l.status === 'Approved')
    .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  const pendingLeaves = empLeaves
    .filter((l) => l.status === 'Pending')
    .reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  const remainingLeaves = entitlement - takenLeaves - pendingLeaves;
  const dailyRate = (Number(emp.basicSalary) || 0) / (settings.leaveDivisor || 30);

  // Field change handler
  const handleFieldChange = (field: keyof Employee, value: unknown) => {
    setEmp((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (
        [
          'basicSalary',
          'foodAllowance',
          'transportAllowance',
          'carOperationAllowance',
          'otherAllowance',
          'limitedTransport',
        ].includes(field)
      ) {
        updated.totalSalary =
          (Number(updated.basicSalary) || 0) +
          (Number(updated.foodAllowance) || 0) +
          (Number(updated.transportAllowance) || 0) +
          (Number(updated.carOperationAllowance) || 0) +
          (Number(updated.otherAllowance) || 0) +
          (Number(updated.limitedTransport) || 0);
      }
      return updated;
    });
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp) return;
    await db.saveEmployee(emp);
    alert('✅ Employee profile changes saved successfully!');
    onRefresh();
  };

  // Toggle employment status (Active <-> Former)
  const handleConfirmStatusToggle = async () => {
    if (!emp) return;

    if (emp.status === 'Unemployed') {
      // Reactivate
      const updated: Employee = {
        ...emp,
        status: 'Active',
        rejoiningDate,
        position: rejoiningPosition.trim() ? rejoiningPosition.trim() : emp.position,
        lastWorkingDate: undefined,
        reasonForLeaving: undefined,
      };
      await db.saveEmployee(updated);
      setEmp(updated);
      alert(`✅ ${emp.employeeName} has been reactivated to Active Employees!`);
    } else {
      // Move to Unemployed
      const updated: Employee = {
        ...emp,
        status: 'Unemployed',
        lastWorkingDate,
        reasonForLeaving,
      };
      await db.saveEmployee(updated);
      setEmp(updated);
      alert(`✅ ${emp.employeeName} moved to Unemployed / Former archive.`);
    }

    setShowStatusModal(false);
    onRefresh();
  };

  // Delete employee permanently - in-app modal (replaces window.confirm)
  const handleDeleteEmployee = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!emp) return;
    await db.deleteEmployee(emp.employeeId);
    setIsDeleteModalOpen(false);
    onClose();
    onRefresh();
  };

  // Photo & Document Uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result as string;
      const updated: Employee = { ...emp, photoData: data, imageData: data };
      setEmp(updated);
      await db.saveEmployee(updated);
      onRefresh();
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (
    docType: 'passportData' | 'qidData' | 'employerDocData',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      alert('File is too large. Please select a file smaller than 12MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result as string;
      const attachment = {
        name: file.name,
        data,
        date: new Date().toISOString(),
      };
      const updated: Employee = { ...emp, [docType]: attachment };
      setEmp(updated);
      await db.saveEmployee(updated);
      onRefresh();
      alert(`✅ Uploaded ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteDocument = (docType: 'passportData' | 'qidData' | 'employerDocData') => {
    setDocToDelete(docType);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete || !emp) return;
    const updated: Employee = { ...emp, [docToDelete]: null };
    setEmp(updated);
    await db.saveEmployee(updated);
    setDocToDelete(null);
    onRefresh();
  };

  // Add Monthly Payroll Record / Send to Batch Approval
  const handleAddMonthlyPayroll = async () => {
    if (!emp) return;
    const payrollId = `PAY-${emp.employeeId}-${newPayYear}-${newPayMonth}`;
    const basic = Number(emp.basicSalary) || 0;
    const allowances =
      (Number(emp.foodAllowance) || 0) +
      (Number(emp.transportAllowance) || 0) +
      (Number(emp.carOperationAllowance) || 0) +
      (Number(emp.otherAllowance) || 0) +
      (Number(emp.limitedTransport) || 0);

    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ].indexOf(newPayMonth);
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const periodKey = `${newPayYear}-${monthNum}`;
    const monthlySummary = db.getMonthlyCommissions(periodKey);
    const agg = monthlySummary.employeeAggregates.find((a) => a.employeeId === emp.employeeId);

    const comms = agg
      ? {
          total: agg.totalCommissionDue,
          service: agg.serviceCommissionDue,
          product: agg.productCommissionDue,
          business: agg.businessCommissionDue,
          serviceTarget: agg.serviceSalesTarget,
          serviceActual: agg.actualEligibleSales,
          serviceRate: agg.serviceCommissionRate,
          serviceAchievement: agg.serviceAchievementRate,
          serviceEligible: agg.serviceEligible,
          productSales: agg.eligibleProductSales,
          productRate: agg.productCommissionRate,
          productEligible: agg.eligibleProductSales > 0,
          businessTarget: agg.businessTargetAmount,
          businessGross: agg.businessGrossSales,
          businessRate: agg.businessCommissionRate,
          businessAchievement:
            agg.businessTargetAmount > 0 ? (agg.businessGrossSales / agg.businessTargetAmount) * 100 : 0,
          businessEligible: agg.businessEligible,
          businessCommBase: emp.businessCommBase || settings?.businessCommBase || 'all_gross',
        }
      : calculateEmployeeCommissions(emp, settings);

    const deductions = Number(emp.deductionCurrent) || 0;
    const netSalary = basic + allowances + comms.total - deductions;

    const record: PayrollRecord = {
      id: payrollId,
      employeeId: emp.employeeId,
      month: newPayMonth,
      year: newPayYear,
      basicSalary: basic,
      allowances,
      commissions: comms.total,
      deductions,
      netSalary,
      paidAmount: 0,
      status: 'Draft',
      paymentDate: '',
      notes: `Sent to Monthly Payroll Processing & Batch Approval for ${newPayMonth} ${newPayYear}`,
      commissionBreakdown: {
        service: comms.service,
        product: comms.product,
        business: comms.business,
      },
    };

    await db.savePayrollRecord(record);
    await db.logAudit(
      'PAYROLL_GENERATED',
      `Sent payroll record for ${emp.employeeName} (${newPayMonth} ${newPayYear}) to Monthly Payroll Processing & Batch Approval`
    );
    setShowAddPayrollModal(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {emp.photoData ? (
                <img
                  src={emp.photoData}
                  alt={emp.employeeName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-slate-300">
                  <User className="w-6 h-6" />
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  emp.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {emp.employeeName}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                  {emp.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {emp.position} · {emp.company} · QID: <span className="font-mono text-slate-300 font-semibold">{emp.residencyQid || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPayrollModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              title="Send to Monthly Payroll Processing & Batch Approval"
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-200" />
              <span>Send to Payroll</span>
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                emp.status === 'Unemployed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
              }`}
            >
              {emp.status === 'Unemployed' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reactivate</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Move to Former</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto shrink-0 custom-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Salary</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule-booking')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'schedule-booking'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Schedule &amp; Service Eligibility</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                emp.canProvideServices && emp.availableForBooking
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {emp.canProvideServices && emp.availableForBooking ? 'Bookable' : 'Non-Service / Off'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'commissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Commissions ({formatCurrency(commissions.total)} QAR)</span>
          </button>

          <button
            onClick={() => setActiveTab('deductions')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'deductions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deductions ({formatCurrency(emp.deductionCurrent)} QAR)</span>
          </button>

          <button
            onClick={() => setActiveTab('leave')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'leave'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave &amp; Tickets</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance &amp; Extra Time</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'payroll'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Payroll History ({empPayrolls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Documents &amp; Scans</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar bg-slate-50/40">
          {/* TAB 1: PROFILE & SALARY */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Image & Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative group shrink-0">
                  {emp.photoData ? (
                    <img
                      src={emp.photoData}
                      alt={emp.employeeName}
                      className="w-20 h-24 rounded-lg object-cover border border-slate-200 bg-slate-100 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-opacity">
                    Change
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Employee File
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{emp.employeeName}</h3>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Position: <strong>{emp.position}</strong></span>
                    <span>·</span>
                    <span>Company: <strong>{emp.company}</strong></span>
                    <span>·</span>
                    <span>Duty: <strong>{emp.duty}</strong></span>
                    <span>·</span>
                    <span>Package: <strong className="text-emerald-700 font-mono">QAR {formatCurrency(emp.totalSalary)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Employment &amp; Contract Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Company</label>
                    <select
                      value={emp.company}
                      onChange={(e) => handleFieldChange('company', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="COSMOS">COSMOS</option>
                      <option value="F&G">F&amp;G</option>
                      <option value="Ali Bin Ali">Ali Bin Ali</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Duty Status</label>
                    <select
                      value={emp.duty}
                      onChange={(e) => handleFieldChange('duty', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Duty">Duty</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Day Off">Day Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">Assigned Weekly Day Off</label>
                    <select
                      value={emp.weeklyOffDay || 'Friday'}
                      onChange={(e) => handleFieldChange('weeklyOffDay', e.target.value)}
                      className="w-full text-xs p-2 bg-purple-50 border border-purple-200 rounded-lg font-bold text-purple-900"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Accommodation</label>
                    <select
                      value={emp.accommodation}
                      onChange={(e) => handleFieldChange('accommodation', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Live In">Live In</option>
                      <option value="Live Out">Live Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Position</label>
                    <input
                      type="text"
                      value={emp.position}
                      onChange={(e) => handleFieldChange('position', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Contract No.</label>
                    <input
                      type="text"
                      value={emp.contractNo}
                      onChange={(e) => handleFieldChange('contractNo', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={emp.joiningDate}
                      onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Contract Date</label>
                    <input
                      type="date"
                      value={emp.endContract}
                      onChange={(e) => handleFieldChange('endContract', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">MPH Certificate</label>
                    <select
                      value={emp.mph}
                      onChange={(e) => handleFieldChange('mph', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="YES">YES</option>
                      <option value="APPLY">APPLY</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal & Residency */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Personal, Passport &amp; QID Documentation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={emp.nationality}
                      onChange={(e) => handleFieldChange('nationality', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mobile</label>
                    <input
                      type="text"
                      value={emp.mobile}
                      onChange={(e) => handleFieldChange('mobile', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={emp.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={emp.passportNumber}
                      onChange={(e) => handleFieldChange('passportNumber', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Passport Expiry</label>
                    <input
                      type="date"
                      value={emp.passportExpiry}
                      onChange={(e) => handleFieldChange('passportExpiry', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Passport Days Alert</label>
                    <div
                      className={`text-xs p-2 font-bold font-mono rounded-lg border ${
                        pDays < 90
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      Day {pDays} Remaining
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Residency QID</label>
                    <input
                      type="text"
                      value={emp.residencyQid}
                      onChange={(e) => handleFieldChange('residencyQid', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">QID Expiry Date</label>
                    <input
                      type="date"
                      value={emp.residencyExpiry}
                      onChange={(e) => handleFieldChange('residencyExpiry', e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">QID Days Alert</label>
                    <div
                      className={`text-xs p-2 font-bold font-mono rounded-lg border ${
                        qDays < 90
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      Day {qDays} Remaining
                    </div>
                  </div>
                </div>
              </div>

              {/* Qatar Banking */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Banking &amp; Remuneration IBAN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payer Bank</label>
                    <select
                      value={emp.payerBankShort}
                      onChange={(e) => {
                        const s = e.target.value;
                        const b = banks.find((item) => item.short === s);
                        handleFieldChange('payerBankShort', s);
                        if (b) handleFieldChange('payerBank', b.name);
                      }}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      {banks.map((b) => (
                        <option key={b.short} value={b.short}>
                          {b.name} ({b.short})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payee IBAN</label>
                    <input
                      type="text"
                      value={emp.iban}
                      onChange={(e) => handleFieldChange('iban', e.target.value.toUpperCase())}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-semibold tracking-wider"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Salary Package */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Salary &amp; Monthly Allowances
                  </h4>
                  <div className="text-xs font-bold text-emerald-600 font-mono">
                    Total: QAR {formatCurrency(emp.totalSalary)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Basic Salary</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.basicSalary}
                      onChange={(e) => handleFieldChange('basicSalary', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Food Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.foodAllowance}
                      onChange={(e) => handleFieldChange('foodAllowance', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Transportation</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.transportAllowance}
                      onChange={(e) => handleFieldChange('transportAllowance', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Car Operation</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.carOperationAllowance}
                      onChange={(e) =>
                        handleFieldChange('carOperationAllowance', parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Other Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.otherAllowance}
                      onChange={(e) => handleFieldChange('otherAllowance', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Limited Transport</label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.limitedTransport}
                      onChange={(e) =>
                        handleFieldChange('limitedTransport', parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      7. Monthly Tips (Manual Gratuity)
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={emp.tips}
                      onChange={(e) => handleFieldChange('tips', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-purple-50/60 border border-purple-300 rounded-lg font-mono font-bold text-purple-900"
                      title="Enter employee tips manually"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Commissions Configuration */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>5. Salon Service, Retail &amp; Business Target Commissions</span>
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Synced from Daily Sales
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const sum = await db.syncEmployeeCommissionsFromSales();
                        const refreshed = db.getEmployee(emp.employeeId);
                        if (refreshed) setEmp({ ...refreshed });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="Recalculate monthly totals from Daily Sales Report"
                    >
                      <RefreshCw className="w-3 h-3 text-purple-600" />
                      <span>Recalculate Live</span>
                    </button>
                    <span className="text-[11px] text-slate-600 font-mono font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      Due: QAR {formatCurrency(commissions.total)}
                    </span>
                  </div>
                </div>

                {/* Educational Sync Notice */}
                <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-purple-950/90 leading-relaxed">
                    <strong>Live Monthly Transfer Active:</strong> Actual Eligible Sales (10% Target) and Eligible Product Sales (5%) are automatically transferred as one combined monthly total from all saved Daily Sales. Tips and Uber charges are excluded from commission bases.
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      1. Service Comm. Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.saleCommissionRate}
                      onChange={(e) => handleFieldChange('saleCommissionRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Service Sales Target (QAR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.saleTargetRate}
                      onChange={(e) => handleFieldChange('saleTargetRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Actual Eligible Sales (QAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.totalSalesRate}
                      onChange={(e) => handleFieldChange('totalSalesRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Service Comm. Due (QAR)
                    </label>
                    <div className="w-full text-xs p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-mono font-bold">
                      QAR {formatCurrency(commissions.service)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      2. Product Comm. Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.prodSaleCommission}
                      onChange={(e) => handleFieldChange('prodSaleCommission', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Eligible Product Sales (QAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.prodTotalSales}
                      onChange={(e) => handleFieldChange('prodTotalSales', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product Comm. Due (QAR)
                    </label>
                    <div className="w-full text-xs p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-mono font-bold">
                      QAR {formatCurrency(commissions.product)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Optional Prod Target
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.prodSaleTarget}
                      onChange={(e) => handleFieldChange('prodSaleTarget', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      3. Business Target (QAR)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={emp.businessTargetAmount || commissions.businessTarget}
                      onChange={(e) => handleFieldChange('businessTargetAmount', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Business Gross Sales (QAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.businessGross}
                      onChange={(e) => handleFieldChange('businessGross', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Business Comm. Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.businessTargetRate}
                      onChange={(e) => handleFieldChange('businessTargetRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Commission Base Mode
                    </label>
                    <select
                      value={emp.businessCommBase || settings.businessCommBase || 'all_gross'}
                      onChange={(e) => handleFieldChange('businessCommBase', e.target.value as 'all_gross' | 'above_target')}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="all_gross">All Eligible Gross Sales</option>
                      <option value="above_target">Only Amount Above Target</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDeleteEmployee}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Employee Record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB: SCHEDULE & SERVICE BOOKING ELIGIBILITY */}
          {activeTab === 'schedule-booking' && (
            <div className="space-y-6">
              {/* Header card with Save button */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/70">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Employee Role &amp; Customer Booking Availability</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        emp.canProvideServices && emp.availableForBooking
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {emp.canProvideServices && emp.availableForBooking ? 'Bookable by Customers' : 'Not Bookable'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure service qualification, customer booking availability, shift hours, and weekly off-days.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await db.saveEmployee(emp);
                    alert(`✅ Schedule & Booking eligibility updated for ${emp.employeeName}!`);
                    onRefresh();
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Schedule Settings</span>
                </button>
              </div>

              {/* Role & Service Eligibility Controls */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <span>1. Employee Role &amp; Salon Service Authority</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Salon Role / Position Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={emp.employeeRole || (['HR', 'Accountant', 'Cleaner Staff', 'Manager'].includes(emp.position) ? emp.position : 'Service Employee')}
                      onChange={(e) => {
                        const newRole = e.target.value as EmployeeRole;
                        const isNonService = ['HR', 'Accountant', 'Cleaner Staff'].includes(newRole);
                        setEmp({
                          ...emp,
                          employeeRole: newRole,
                          canProvideServices: isNonService ? false : (emp.canProvideServices ?? true),
                          availableForBooking: isNonService ? false : (emp.availableForBooking ?? true),
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <optgroup label="Salon Service Artists (Customer Bookable)">
                        <option value="Hairdresser">Hairdresser (Hair Services)</option>
                        <option value="Eyelash Art">Eyelash Art (Eyelash Services)</option>
                        <option value="Eyebrows Art">Eyebrows Art (Eyebrows Services)</option>
                        <option value="Nail Art">Nail Art (Nail Services)</option>
                        <option value="Spa">Spa (Spa &amp; Massage Services)</option>
                        <option value="Spray Tan">Spray Tan (Spray Tan Services)</option>
                        <option value="Service Employee">General Service Employee (All Services)</option>
                      </optgroup>
                      <optgroup label="Administrative & Non-Service (Never Bookable by Default)">
                        <option value="HR">HR (Not booking / Doing any services)</option>
                        <option value="Accountant">Accountant (Not booking / Doing any services)</option>
                        <option value="Cleaner Staff">Cleaner Staff (Not booking / Doing any services)</option>
                        <option value="Manager">Manager (Supervisory / Non-booking by default)</option>
                      </optgroup>
                    </select>

                    {/* Role Notice */}
                    {['HR', 'Accountant', 'Cleaner Staff'].includes(emp.employeeRole || '') ? (
                      <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Non-Service Protection Active:</strong> {emp.employeeRole} staff are strictly excluded from customer booking calendars and daily sales service provider dropdowns. All HR records, attendance, payroll, and leave entitlements remain 100% active.
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Assigned role determines default service category matching when customers book appointments online or at reception.
                      </p>
                    )}
                  </div>

                  {/* Toggles Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                    {/* Can Provide Services Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Can Provide Salon Services</div>
                        <div className="text-[11px] text-slate-500">Allow this employee to be assigned to salon services</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emp.canProvideServices ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEmp({
                              ...emp,
                              canProvideServices: checked,
                              availableForBooking: checked ? emp.availableForBooking : false,
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* Available for Customer Booking Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Available for Customer Booking</div>
                        <div className="text-[11px] text-slate-500">Display this employee in customer booking lists</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!emp.canProvideServices}
                          checked={emp.availableForBooking ?? false}
                          onChange={(e) => {
                            setEmp({
                              ...emp,
                              availableForBooking: e.target.checked,
                            });
                          }}
                          className="sr-only peer disabled:opacity-50"
                        />
                        <div className={`w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                          emp.canProvideServices ? 'peer-checked:bg-emerald-600' : 'opacity-40 cursor-not-allowed'
                        }`}></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Qualified Service Categories */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Authorized Service Categories (Skills &amp; Treatments)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Hair', 'Nails', 'Eyelash', 'Eyebrow', 'Spa & Massage', 'Spray Tan', 'Skin Care', 'Makeup', 'Waxing'].map((cat) => {
                      const currentCats = emp.serviceCategories || [];
                      const isSelected = currentCats.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? currentCats.filter((c) => c !== cat)
                              : [...currentCats, cat];
                            setEmp({ ...emp, serviceCategories: updated });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                            isSelected
                              ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Customers booking services in these categories will see this specialist when booking appointments.
                  </p>
                </div>
              </div>

              {/* Working Hours & Shift Schedule */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>2. Working Hours &amp; Weekly Schedule</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shift Start Time
                    </label>
                    <input
                      type="time"
                      value={emp.workingHours?.start || '10:00'}
                      onChange={(e) => {
                        setEmp({
                          ...emp,
                          workingHours: {
                            start: e.target.value,
                            end: emp.workingHours?.end || '20:00',
                          },
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shift End Time
                    </label>
                    <input
                      type="time"
                      value={emp.workingHours?.end || '20:00'}
                      onChange={(e) => {
                        setEmp({
                          ...emp,
                          workingHours: {
                            start: emp.workingHours?.start || '10:00',
                            end: e.target.value,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weekly Scheduled Off-Day
                    </label>
                    <select
                      value={emp.weeklyOffDay || 'Friday'}
                      onChange={(e) => {
                        setEmp({ ...emp, weeklyOffDay: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                        <option key={d} value={d}>
                          {d} (Regular Day Off)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Working Days Pill Toggles */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Active Working Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const currentDays = emp.workingDays || [
                        'Saturday',
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                      ];
                      const isActive = currentDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const updated = isActive
                              ? currentDays.filter((d) => d !== day)
                              : [...currentDays, day];
                            setEmp({ ...emp, workingDays: updated });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                              : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real-time Booking Availability Simulator */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      3. Live Booking Availability Verification Engine
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Real-Time Rule Engine</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Test Booking Date
                    </label>
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Test Booking Time
                    </label>
                    <input
                      type="time"
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      step={5}
                      min={15}
                      max={240}
                      value={testDuration}
                      onChange={(e) => setTestDuration(Number(e.target.value) || 60)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Calculation Output */}
                {(() => {
                  const check = db.checkEmployeeBookingAvailability(emp.employeeId, testDate, testTime, testDuration);
                  const isAvailable = check.isAvailable;
                  return (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                      isAvailable
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isAvailable ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}>
                            {check.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {formatDate(testDate)} at {formatTime12(testTime)} ({testDuration} min)
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-300">
                          {check.reason}
                        </p>

                        {check.conflictingDetails && (
                          <div className="mt-2 p-2 rounded-lg bg-black/40 border border-amber-500/30 text-[11px] text-amber-200">
                            <strong>Details:</strong> {check.conflictingDetails}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Scheduled Appointments for this Employee */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Upcoming Customer Appointments ({db.getBookings().filter((b) => b.employeeId === emp.employeeId).length})</span>
                  </h4>
                </div>

                {db.getBookings().filter((b) => b.employeeId === emp.employeeId).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No bookings currently scheduled for {emp.employeeName}.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {db
                      .getBookings()
                      .filter((b) => b.employeeId === emp.employeeId)
                      .slice(0, 10)
                      .map((b) => (
                        <div key={b.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{b.serviceName}</div>
                            <div className="text-[11px] text-slate-500">
                              Client: <span className="font-medium text-slate-700">{b.customerName}</span> ({b.customerMobile}) &bull; {formatDate(b.date)} &bull; {formatTime12(b.startTime)} ({b.durationMinutes} min)
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{formatCurrency(b.servicePrice)}</span>
                            <div className="text-[10px] uppercase font-semibold text-purple-700">{b.status}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMMISSIONS */}
          {activeTab === 'commissions' && (
            <div className="space-y-5">
              {/* Header with Quick Save */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>5. Salon Service, Retail &amp; Business Target Commissions</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Three separate commission calculations for {emp.employeeName}. Edit rates, targets, or sales below and save.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await db.saveEmployee(emp);
                    alert(`  Commission settings saved for ${emp.employeeName}!`);
                    onRefresh();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Commission Settings</span>
                </button>
              </div>

              {/* Stream 1: Service Sales Commission */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Employee Sales Commission — Services (Default: 10%)
                      </h4>
                      <p className="text-[11px] text-slate-500">Service sales commission earned when eligible total sales reach or exceed target</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    commissions.serviceEligible
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {commissions.serviceEligible
                      ? 'Eligible (Sales Target Met)'
                      : 'Not Eligible (Commission = QAR 0)'}
                  </span>
                </div>

                {/* Editable Inputs for Stream 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Commission Rate (%) — Editable
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.saleCommissionRate}
                      onChange={(e) => handleFieldChange('saleCommissionRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sales Target Amount (QAR) — Editable *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.saleTargetRate}
                      onChange={(e) => handleFieldChange('saleTargetRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Actual Eligible Sales (QAR) — Editable *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.totalSalesRate}
                      onChange={(e) => handleFieldChange('totalSalesRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-blue-700"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Target Achievement: <strong>{commissions.serviceAchievement.toFixed(1)}%</strong></span>
                    <span>
                      {commissions.serviceEligible
                        ? `+QAR ${formatCurrency(commissions.serviceActual - commissions.serviceTarget)} above target`
                        : `-QAR ${formatCurrency(commissions.serviceTarget - commissions.serviceActual)} needed to reach target`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        commissions.serviceEligible ? 'bg-emerald-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(commissions.serviceAchievement, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stream 1 Metrics Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sales Target</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      QAR {formatCurrency(commissions.serviceTarget)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actual Eligible Sales</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      QAR {formatCurrency(commissions.serviceActual)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Commission Rate</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {commissions.serviceRate}%
                    </strong>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-blue-700 block text-[10px] uppercase font-bold">Service Commission</span>
                    <strong className="text-blue-800 font-mono text-base">
                      QAR {formatCurrency(commissions.service)}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Service Commission Formula:</div>
                  <div className="font-mono text-slate-800">
                    Commission Eligibility = Actual Eligible Sales (QAR {formatCurrency(commissions.serviceActual)}) ≥ Sales Target (QAR {formatCurrency(commissions.serviceTarget)})
                  </div>
                  <div>
                    {commissions.serviceEligible ? (
                      <span className="text-emerald-700 font-semibold font-mono">
                        Target Met! Commission = QAR {formatCurrency(commissions.serviceActual)} × {commissions.serviceRate}% = QAR {formatCurrency(commissions.service)}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold font-mono">
                        Target Not Met (Below QAR {formatCurrency(commissions.serviceTarget)}). Commission = QAR 0. Do not pay commission when the target is not reached.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stream 2: Products Sales Commission */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Products Sales Commission — Retail (Default: 5%)
                      </h4>
                      <p className="text-[11px] text-slate-500">Separate calculation for product sales. No minimum target required.</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    commissions.productEligible
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {commissions.productEligible ? 'Eligible (Product Sales > 0)' : 'No Eligible Product Sales'}
                  </span>
                </div>

                {/* Editable Inputs for Stream 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product Comm. Rate (%) — Editable
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.prodSaleCommission}
                      onChange={(e) => handleFieldChange('prodSaleCommission', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Eligible Products Sales (QAR) — Editable *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.prodTotalSales}
                      onChange={(e) => handleFieldChange('prodTotalSales', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Optional Products Target (QAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.prodSaleTarget}
                      onChange={(e) => handleFieldChange('prodSaleTarget', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Stream 2 Metrics Display */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Product Sales Total</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      QAR {formatCurrency(commissions.productSales)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Commission Rate</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {commissions.productRate}%
                    </strong>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-700 block text-[10px] uppercase font-bold">Product Commission</span>
                    <strong className="text-emerald-800 font-mono text-base">
                      QAR {formatCurrency(commissions.product)}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Product Commission Formula:</div>
                  <div className="font-mono text-slate-800">
                    Products Commission = Eligible Products Sales (QAR {formatCurrency(commissions.productSales)}) × {commissions.productRate}% = QAR {formatCurrency(commissions.product)}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Tracked separately from service sales. System prevents the same transaction from being counted more than once.
                  </div>
                </div>
              </div>

              {/* Stream 3: Business Target Commission */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Business Target Commission — Gross Sales (Default: QAR 200,000 @ 5%)
                      </h4>
                      <p className="text-[11px] text-slate-500">Business-level target and separate calculation with configurable commission base</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    commissions.businessEligible
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {commissions.businessEligible
                      ? 'Target Met (≥ QAR ' + formatCurrency(commissions.businessTarget) + ')'
                      : 'Below Target (Commission = QAR 0)'}
                  </span>
                </div>

                {/* Editable Inputs for Stream 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Business Target (QAR) — Editable *
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={emp.businessTargetAmount || commissions.businessTarget}
                      onChange={(e) => handleFieldChange('businessTargetAmount', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Business Gross Sales (QAR) — Editable *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={emp.businessGross}
                      onChange={(e) => handleFieldChange('businessGross', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Business Comm. Rate (%) — Editable
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={emp.businessTargetRate}
                      onChange={(e) => handleFieldChange('businessTargetRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Commission Base Mode *
                    </label>
                    <select
                      value={emp.businessCommBase || settings.businessCommBase || 'all_gross'}
                      onChange={(e) => handleFieldChange('businessCommBase', e.target.value as 'all_gross' | 'above_target')}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="all_gross">All Eligible Gross Sales</option>
                      <option value="above_target">Only Amount Above Target</option>
                    </select>
                  </div>
                </div>

                {/* Stream 3 Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Target Achievement: <strong>{commissions.businessAchievement.toFixed(1)}%</strong></span>
                    <span>
                      {commissions.businessEligible
                        ? `+QAR ${formatCurrency(commissions.businessGross - commissions.businessTarget)} above target`
                        : `-QAR ${formatCurrency(commissions.businessTarget - commissions.businessGross)} deficit`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        commissions.businessEligible ? 'bg-purple-600' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(commissions.businessAchievement, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stream 3 Metrics Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Target</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      QAR {formatCurrency(commissions.businessTarget)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Gross</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      QAR {formatCurrency(commissions.businessGross)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rate &amp; Base</span>
                    <strong className="text-slate-900 font-mono text-sm block">
                      {commissions.businessRate}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {commissions.businessCommBase === 'above_target' ? 'Incremental' : 'All Gross'}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-purple-700 block text-[10px] uppercase font-bold">Business Commission</span>
                    <strong className="text-purple-800 font-mono text-base">
                      QAR {formatCurrency(commissions.business)}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Business Target Commission Formula &amp; Eligibility:</div>
                  <div className="font-mono text-slate-800">
                    If Selected by Company AND Business Gross Sales (QAR {formatCurrency(commissions.businessGross)}) ≥ Business Target (QAR {formatCurrency(commissions.businessTarget)}):
                  </div>
                  <div>
                    {!emp.businessCommissionEligible ? (
                      <span className="text-amber-800 font-semibold font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        ⚠️ Employee NOT selected by Company for Business Gross Commission. Net Business Commission = QAR 0.
                      </span>
                    ) : commissions.businessEligible ? (
                      <span className="text-purple-700 font-semibold font-mono">
                        ✓ Selected &amp; Target Met! Commission = {commissions.businessCommBase === 'above_target'
                          ? `(QAR ${formatCurrency(commissions.businessGross)} - QAR ${formatCurrency(commissions.businessTarget)}) × ${commissions.businessRate}% = QAR ${formatCurrency(commissions.business)}`
                          : `QAR ${formatCurrency(commissions.businessGross)} × ${commissions.businessRate}% = QAR ${formatCurrency(commissions.business)}`}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold font-mono">
                        Selected, but Gross is below Target of QAR {formatCurrency(commissions.businessTarget)}. Net Business Commission = QAR 0.
                      </span>
                    )}
                  </div>
                </div>

                {/* Company Selection Toggle for Stream 3 */}
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950">
                      Company Eligibility for Business Gross Sales Commission
                    </div>
                    <div className="text-[11px] text-purple-800/80">
                      Only specifically selected employees receive this commission when monthly target is reached.
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(emp.businessCommissionEligible)}
                      onChange={(e) => handleFieldChange('businessCommissionEligible', e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-purple-900">
                      {emp.businessCommissionEligible ? 'Selected for Commission' : 'Not Selected (0 Comm)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Total Combined Commission Payable with Salary Banner (10-Component System) */}
              {(() => {
                const base = Number(emp.basicSalary) || 0;
                const food = Number(emp.foodAllowance) || 0;
                const trans = Number(emp.transportAllowance) || 0;
                const car = Number(emp.carOperationAllowance) || 0;
                const oth = Number(emp.otherAllowance) || 0;
                const lim = Number(emp.limitedTransport) || 0;
                const totalAllowances = food + trans + car + oth + lim;
                const fixedSalary = base + totalAllowances;
                const tips = Number(emp.tips) || 0;
                const commsTotal = commissions.total;
                const totalGrossSalary = fixedSalary + tips + commsTotal;
                const deductions = Number(emp.deductionCurrent) || 0;
                const netPayable = Math.max(0, totalGrossSalary - deductions);

                return (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          <span>Total Combined Commission Payable with Salary</span>
                        </span>
                        <div className="text-3xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                          QAR {formatCurrency(totalGrossSalary)}
                        </div>
                        <div className="text-xs text-slate-300 font-medium mt-1">
                          Total Monthly Salary &amp; Wages Gross (Basic + 5 Allowances + Tips + All Commissions)
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-700/60 sm:pl-5">
                        <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                          Total Most Paid (Net Payable)
                        </span>
                        <div className="text-2xl font-black font-mono text-white mt-1">
                          QAR {formatCurrency(netPayable)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          After QAR {formatCurrency(deductions)} Current Deductions
                        </div>
                      </div>
                    </div>

                    {/* Breakdown of Components */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fixed Base Salary</span>
                        <strong className="text-white font-mono text-sm">
                          QAR {formatCurrency(fixedSalary)}
                        </strong>
                        <div className="text-[10px] text-slate-300 mt-0.5">Basic + 5 Allowances</div>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee Tips</span>
                        <strong className="text-white font-mono text-sm">
                          QAR {formatCurrency(tips)}
                        </strong>
                        <div className="text-[10px] text-slate-300 mt-0.5">Separate line item</div>
                      </div>

                      <div className="bg-amber-500/20 p-2.5 rounded-lg border border-amber-400/30">
                        <span className="text-amber-300 block text-[10px] uppercase font-bold">Combined Commissions</span>
                        <strong className="text-amber-300 font-mono text-sm">
                          QAR {formatCurrency(commsTotal)}
                        </strong>
                        <div className="text-[10px] text-amber-200/80 mt-0.5">Svc + Prod + Biz Gross</div>
                      </div>

                      <div className="bg-emerald-500/20 p-2.5 rounded-lg border border-emerald-400/30 flex flex-col justify-between">
                        <div>
                          <span className="text-emerald-300 block text-[10px] uppercase font-bold">Salary + Comm. (Gross)</span>
                          <strong className="text-emerald-300 font-mono text-sm">
                            QAR {formatCurrency(totalGrossSalary)}
                          </strong>
                        </div>
                        <div className="text-[10px] text-emerald-200/80">Complete Gross Earnings</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                      <div className="text-xs text-slate-300 font-mono flex flex-wrap gap-x-3">
                        <span>Services Comm: <strong>QAR {formatCurrency(commissions.service)}</strong></span>
                        <span>·</span>
                        <span>Product Comm: <strong>QAR {formatCurrency(commissions.product)}</strong></span>
                        <span>·</span>
                        <span>Business Comm: <strong>QAR {formatCurrency(commissions.business)}</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await db.saveEmployee(emp);
                          alert(`✅ All commission settings, eligibility, and salary values saved for ${emp.employeeName}!`);
                          onRefresh();
                        }}
                        className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save All Commission &amp; Salary Changes</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: DEDUCTIONS */}
          {activeTab === 'deductions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Current Deduction
                  </div>
                  <div className="text-lg font-bold text-rose-600 font-mono tabular-nums">
                    QAR {formatCurrency(emp.deductionCurrent)}
                  </div>
                </div>
                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 shadow-xs">
                  <label className="block text-[11px] text-purple-900 font-bold uppercase mb-1">
                    Staff Tips (Editable)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-700">QAR</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={emp.tips}
                      onChange={(e) => handleFieldChange('tips', parseFloat(e.target.value) || 0)}
                      className="w-full text-base font-bold text-purple-900 font-mono p-1 bg-white border border-purple-300 rounded-lg"
                      title="Enter employee tips manually"
                    />
                  </div>
                  <div className="text-[10px] text-purple-700 mt-1 font-medium">Auto-adds to gross salary</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Outstanding Balance
                  </div>
                  <div className="text-lg font-bold text-rose-600 font-mono tabular-nums">
                    QAR {formatCurrency(emp.outstanding)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Future Deductions
                  </div>
                  <div className="text-lg font-bold text-slate-700 font-mono tabular-nums">
                    QAR {formatCurrency(emp.deductionFuture)}
                  </div>
                </div>
              </div>

              {/* Scheduled Future Deductions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Future Month Scheduled Deductions
                </h4>
                {emp.futureDeductions && emp.futureDeductions.length > 0 ? (
                  <div className="space-y-2">
                    {emp.futureDeductions.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">{formatDate(d.date)}</strong>
                          <span className="text-slate-500 ml-2">{d.reason || 'No description'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-600">
                            QAR {formatCurrency(d.amount)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {d.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No future deductions scheduled.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEAVE & TICKETS */}
          {activeTab === 'leave' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">
                      Leave Entitlement
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      Editable
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={emp.leaveEntitlement || 21}
                      onChange={(e) => handleFieldChange('leaveEntitlement', parseInt(e.target.value) || 0)}
                      className="w-18 text-base font-bold font-mono text-blue-700 bg-slate-50 border border-slate-300 rounded-lg p-1 text-center tabular-nums"
                      title={`Edit Annual Leave Entitlement (Days) for ${emp.employeeName}`}
                    />
                    <span className="text-xs font-semibold text-slate-500">Days</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await db.saveEmployee(emp);
                        alert(`  Annual Leave Entitlement updated to ${emp.leaveEntitlement} days for ${emp.employeeName}!`);
                        onRefresh();
                      }}
                      className="px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs ml-auto"
                      title="Save entitlement"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Taken Days
                  </div>
                  <div className="text-lg font-bold text-rose-600">{takenLeaves} Days</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Remaining Balance
                  </div>
                  <div className="text-lg font-bold text-emerald-600">{remainingLeaves} Days</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Daily Wage Rate (÷30)
                  </div>
                  <div className="text-lg font-bold text-blue-600 font-mono">
                    QAR {formatCurrency(dailyRate)}
                  </div>
                </div>
              </div>

              {/* Leave History Table */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Leave Request Records
                </h4>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Period</th>
                        <th className="p-2">Start</th>
                        <th className="p-2">End</th>
                        <th className="p-2 text-right">Days</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empLeaves.map((l) => (
                        <tr key={l.leaveId}>
                          <td className="p-2 font-mono text-slate-600">{l.period}</td>
                          <td className="p-2 font-mono text-slate-600">{formatDate(l.startDate)}</td>
                          <td className="p-2 font-mono text-slate-600">{formatDate(l.endDate)}</td>
                          <td className="p-2 text-right font-bold text-slate-800">{l.days} d</td>
                          <td className="p-2 text-slate-700">{l.leaveType}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {empLeaves.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No leaves recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Flight Ticket Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-600" />
                  <span>Home Flight Ticket Entitlement</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Cycle</span>
                    <strong>{emp.ticketCycle || 2} Years</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Next Eligible</span>
                    <strong className="font-mono">
                      {emp.nextTicketDate ? formatDate(emp.nextTicketDate) : '-'}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-bold text-emerald-700">{emp.ticketStatus}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[11px]">Destination</span>
                    <strong className="truncate block">{emp.ticketDestination || '-'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Net Extra-Time Balance
                  </div>
                  <div
                    className={`text-xl font-bold font-mono ${
                      extraBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {minutesToTimeStr(extraBalance)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Gross Extra Hours Earned
                  </div>
                  <div className="text-xl font-bold text-blue-600 font-mono">
                    {minutesToTimeStr(grossExtra)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Hours Used for Offsets
                  </div>
                  <div className="text-xl font-bold text-slate-700 font-mono">
                    {minutesToTimeStr(usedExtra)}
                  </div>
                </div>
              </div>

              {/* Recent Shifts Table */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Attendance Records
                </h4>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Day</th>
                        <th className="p-2 text-amber-800 bg-amber-50/50">Time In (Morning)</th>
                        <th className="p-2 text-indigo-800 bg-indigo-50/50">Time Out (Night)</th>
                        <th className="p-2 text-right">Work</th>
                        <th className="p-2 text-right text-slate-500">Scheduled</th>
                        <th className="p-2 text-right text-emerald-600">Extra</th>
                        <th className="p-2 text-right text-rose-600">Short</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empAttendance.slice(0, 20).map((a) => {
                        const extraMin = a.extraMinutes || 0;
                        const shortMin = a.shortMinutes !== undefined ? a.shortMinutes : (a.totalWorkMinutes < a.scheduledWorkMinutes ? a.scheduledWorkMinutes - a.totalWorkMinutes : 0);

                        return (
                          <tr key={a.attId}>
                            <td className="p-2 font-mono text-slate-600 font-medium">{formatDate(a.date)}</td>
                            <td className="p-2 text-slate-500">{getDayOfWeek(a.date)}</td>
                            <td className="p-2 font-mono text-slate-800 font-semibold bg-amber-50/20">
                              {a.timeIn || a.morningTimeIn ? formatTime12(a.timeIn || a.morningTimeIn) : '—'}
                            </td>
                            <td className="p-2 font-mono text-slate-800 font-semibold bg-indigo-50/20">
                              {a.timeOut || a.nightTimeOut ? formatTime12(a.timeOut || a.nightTimeOut) : '—'}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums font-semibold text-slate-800">
                              {minutesToTimeStr(a.totalWorkMinutes)}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums text-slate-500">
                              {minutesToTimeStr(a.scheduledWorkMinutes)}
                            </td>
                            <td
                              className={`p-2 text-right font-mono font-bold tabular-nums ${
                                extraMin > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {extraMin > 0 ? `+${minutesToTimeStr(extraMin)}` : '0m'}
                            </td>
                            <td
                              className={`p-2 text-right font-mono font-bold tabular-nums ${
                                shortMin > 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            >
                              {shortMin > 0 ? `-${minutesToTimeStr(shortMin)}` : '0m'}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {empAttendance.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No shift records logged yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PAYROLL HISTORY */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Monthly Wage Disbursements
                </h4>
                <button
                  onClick={() => setShowAddPayrollModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Generate Monthly Record</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Period</th>
                        <th className="p-2.5 text-right">Basic</th>
                        <th className="p-2.5 text-right">Allowances</th>
                        <th className="p-2.5 text-right">Commissions</th>
                        <th className="p-2.5 text-right text-rose-600">Deductions</th>
                        <th className="p-2.5 text-right font-bold text-slate-900 bg-slate-100/60">
                          Net Salary
                        </th>
                        <th className="p-2.5 text-right text-emerald-600">Paid</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empPayrolls.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-bold text-slate-900 font-mono">
                            {p.month} {p.year}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums">
                            QAR {formatCurrency(p.basicSalary)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums">
                            QAR {formatCurrency(p.allowances)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-amber-700 font-medium">
                            QAR {formatCurrency(p.commissions)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-rose-600 font-medium">
                            QAR {formatCurrency(p.deductions)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 bg-slate-50">
                            QAR {formatCurrency(p.netSalary)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                            QAR {formatCurrency(p.paidAmount)}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {empPayrolls.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No payroll records generated for this employee yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Official employee identification, passport, QID scans, and employer contracts are saved securely in browser storage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Employee Passport Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block mb-1">
                      🛂 Employee Passport
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {emp.passportData ? emp.passportData.name : 'No scan attached'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <label className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload('passportData', e)}
                        className="hidden"
                      />
                    </label>
                    {emp.passportData && (
                      <>
                        <a
                          href={emp.passportData.data}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument('passportData')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Employee QID Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block mb-1">
                      🪪 Qatar QID Residency Card
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {emp.qidData ? emp.qidData.name : 'No scan attached'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <label className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload('qidData', e)}
                        className="hidden"
                      />
                    </label>
                    {emp.qidData && (
                      <>
                        <a
                          href={emp.qidData.data}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument('qidData')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Employer Contract Document */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block mb-1">
                      📄 Labor Contract / Official Permit
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {emp.employerDocData ? emp.employerDocData.name : 'No file attached'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <label className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => handleDocumentUpload('employerDocData', e)}
                        className="hidden"
                      />
                    </label>
                    {emp.employerDocData && (
                      <>
                        <a
                          href={emp.employerDocData.data}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument('employerDocData')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Status Toggle (Move to Former or Reactivate) */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {emp.status === 'Unemployed'
                ? `Reactivate ${emp.employeeName}`
                : `Move ${emp.employeeName} to Former / Unemployed`}
            </h3>

            {emp.status === 'Unemployed' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  This will restore {emp.employeeName} to the active employee directory with active payroll processing.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rejoining Date
                  </label>
                  <input
                    type="date"
                    value={rejoiningDate}
                    onChange={(e) => setRejoiningDate(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Updated Position (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to maintain current position"
                    value={rejoiningPosition}
                    onChange={(e) => setRejoiningPosition(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  This moves the staff record to the Unemployed / Former archive. All past payrolls, certificates, and attendance data will be safely kept.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Last Working Date
                  </label>
                  <input
                    type="date"
                    value={lastWorkingDate}
                    onChange={(e) => setLastWorkingDate(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Reason for Leaving
                  </label>
                  <select
                    value={reasonForLeaving}
                    onChange={(e) => setReasonForLeaving(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Resigned">Resigned</option>
                    <option value="Contract Completed">Contract Completed (2 Years)</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Transferred Sponsorship">Transferred Sponsorship</option>
                    <option value="Medical Reasons">Medical / Personal Reasons</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send to Monthly Payroll Processing & Batch Approval */}
      {showAddPayrollModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Send to Monthly Payroll &amp; Batch Approval
                </h3>
                <p className="text-[11px] text-slate-500">
                  Employee: <span className="font-semibold text-slate-800">{emp.employeeName}</span> ({emp.employeeId})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Month</label>
                <select
                  value={newPayMonth}
                  onChange={(e) => setNewPayMonth(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  {[
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Year</label>
                <input
                  type="number"
                  value={newPayYear}
                  onChange={(e) => setNewPayYear(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
                />
              </div>
            </div>

            {/* Salary Calculation Preview */}
            {(() => {
              const basic = Number(emp.basicSalary) || 0;
              const allowances =
                (Number(emp.foodAllowance) || 0) +
                (Number(emp.transportAllowance) || 0) +
                (Number(emp.carOperationAllowance) || 0) +
                (Number(emp.otherAllowance) || 0) +
                (Number(emp.limitedTransport) || 0);

              const comms = calculateEmployeeCommissions(emp, settings);
              const deductions = Number(emp.deductionCurrent) || 0;
              const netSalary = basic + allowances + comms.total - deductions;

              return (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Salary:</span>
                    <span className="font-mono font-semibold text-slate-900">QAR {formatCurrency(basic)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Allowances:</span>
                    <span className="font-mono font-semibold text-slate-900">+ QAR {formatCurrency(allowances)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Commissions:</span>
                    <span className="font-mono font-bold text-amber-700">+ QAR {formatCurrency(comms.total)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Deductions:</span>
                    <span className="font-mono font-semibold text-rose-600">- QAR {formatCurrency(deductions)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-950 font-bold pt-1.5 border-t border-slate-200">
                    <span>Calculated Net:</span>
                    <span className="font-mono text-emerald-700">QAR {formatCurrency(netSalary)}</span>
                  </div>
                </div>
              );
            })()}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              This record will be registered directly into <strong>Monthly Payroll Processing &amp; Batch Approval</strong> for {newPayMonth} {newPayYear}.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddPayrollModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMonthlyPayroll}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Send to Monthly Payroll</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Deleting Employee */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${emp.employeeName}?`}
        message={`⚠️ PERMANENT DELETE WARNING: Are you sure you want to delete ${emp.employeeName} (${emp.employeeId})?\n\nThis will remove their profile, attachments, and all associated payroll history. This action cannot be undone.`}
        confirmLabel="Yes, Delete Employee"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* In-App Confirmation Modal for Deleting Document Attachment */}
      {docToDelete && (
        <ConfirmModal
          isOpen={!!docToDelete}
          title="Delete Document Attachment"
          message={`Are you sure you want to delete this ${
            docToDelete === 'passportData'
              ? 'Passport Copy'
              : docToDelete === 'qidData'
              ? 'QID Copy'
              : 'Employer Document'
          } attachment from ${emp.employeeName}'s profile?`}
          confirmLabel="Delete Document"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={confirmDeleteDocument}
          onCancel={() => setDocToDelete(null)}
        />
      )}
    </div>
  );
};
