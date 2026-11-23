import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Plus, Trash2, Calendar, DollarSign, Building2, User, Plane, ShieldCheck, Scissors, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { Employee, FutureDeduction, BankInfo, EmployeeRole, SalonServiceCategory } from '../types';
import { db, calculateDaysRemaining } from '../services/db';

interface AddEmployeeViewProps {
  banks: BankInfo[];
  onBack: () => void;
  onSaved: () => void;
}

export const AddEmployeeView: React.FC<AddEmployeeViewProps> = ({ banks, onBack, onSaved }) => {
  const [nextNo, setNextNo] = useState<number>(1);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [contractNo, setContractNo] = useState<string>('');

  // Employment
  const [employerId, setEmployerId] = useState('17-2681-92');
  const [company, setCompany] = useState('COSMOS');
  const [duty, setDuty] = useState('Duty');
  const [accommodation, setAccommodation] = useState('Live In');
  const [contractType, setContractType] = useState('Contract');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [endContract, setEndContract] = useState('');
  const [mph, setMph] = useState('NO');
  const [expireMph, setExpireMph] = useState('');
  const [position, setPosition] = useState('');
  const [weeklyOffDay, setWeeklyOffDay] = useState('Monday');

  // Role & Service Eligibility
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('Hairdresser');
  const [canProvideServices, setCanProvideServices] = useState<boolean>(true);
  const [availableForBooking, setAvailableForBooking] = useState<boolean>(true);
  const [serviceCategories, setServiceCategories] = useState<string[]>(['Hair']);
  const [shiftStart, setShiftStart] = useState<string>('10:00');
  const [shiftEnd, setShiftEnd] = useState<string>('20:00');

  // Personal
  const [employeeName, setEmployeeName] = useState('');
  const [nationality, setNationality] = useState('KYRGYZSTAN');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [passportDays, setPassportDays] = useState('');
  const [residencyQid, setResidencyQid] = useState('');
  const [residencyExpiry, setResidencyExpiry] = useState('');
  const [residencyDays, setResidencyDays] = useState('');

  // Banking
  const [payerBank, setPayerBank] = useState('Doha Bank');
  const [payerBankShort, setPayerBankShort] = useState('DB');
  const [customBankName, setCustomBankName] = useState('');
  const [iban, setIban] = useState('');

  // Salary
  const [basicSalary, setBasicSalary] = useState<number>(3000);
  const [foodAllowance, setFoodAllowance] = useState<number>(1000);
  const [transportAllowance, setTransportAllowance] = useState<number>(1000);
  const [carOperationAllowance, setCarOperationAllowance] = useState<number>(0);
  const [otherAllowance, setOtherAllowance] = useState<number>(0);
  const [limitedTransport, setLimitedTransport] = useState<number>(200);

  // Sales
  const [saleCommissionRate, setSaleCommissionRate] = useState<number>(10);
  const [saleTargetRate, setSaleTargetRate] = useState<number>(0);
  const [totalSalesRate, setTotalSalesRate] = useState<number>(0);
  const [targetSales, setTargetSales] = useState<number>(0);
  const [prodSaleCommission, setProdSaleCommission] = useState<number>(5);
  const [prodSaleTarget, setProdSaleTarget] = useState<number>(0);
  const [prodTotalSales, setProdTotalSales] = useState<number>(0);
  const [businessTargetRate, setBusinessTargetRate] = useState<number>(5);
  const [businessTargetAmount, setBusinessTargetAmount] = useState<number>(200000);
  const [businessGross, setBusinessGross] = useState<number>(0);
  const [businessCommBase, setBusinessCommBase] = useState<'all_gross' | 'above_target'>('all_gross');
  const [businessBonus, setBusinessBonus] = useState<number>(0);

  // Deductions
  const [deductionCurrent, setDeductionCurrent] = useState<number>(0);
  const [tips, setTips] = useState<number>(0);
  const [outstanding, setOutstanding] = useState<number>(0);
  const [futureDeductions, setFutureDeductions] = useState<FutureDeduction[]>([]);

  // Leave & Tickets
  const [leaveEntitlement, setLeaveEntitlement] = useState<number>(21);
  const [totalCreditLeave, setTotalCreditLeave] = useState<number>(21);
  const [lastLeaveDate, setLastLeaveDate] = useState('');
  const [annualLeaveDays, setAnnualLeaveDays] = useState<number>(0);
  const [annualLeaveStatus, setAnnualLeaveStatus] = useState('Paid');
  const [annualLeavePaidAmt, setAnnualLeavePaidAmt] = useState<number>(0);
  const [annualLeaveRemaining, setAnnualLeaveRemaining] = useState<number>(21);
  const [annualLeaveFees, setAnnualLeaveFees] = useState<number>(0);

  const [ticketCycle, setTicketCycle] = useState<number>(2);
  const [nextTicketDate, setNextTicketDate] = useState('');
  const [ticketStatus, setTicketStatus] = useState('Not Eligible');
  const [ticketDestination, setTicketDestination] = useState('');

  // Confirmation
  const [confirmText, setConfirmText] = useState('I further acknowledge and confirm that I have received Salary');
  const [signature, setSignature] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // Initialize auto IDs
  useEffect(() => {
    const num = db.getNextNo();
    setNextNo(num);
    setEmployeeId(`CBSE${20244 + num}`);
    setContractNo(`CBS-${Date.now().toString().slice(-8)}`);

    // Auto set end contract 2 years from today
    const join = new Date();
    join.setFullYear(join.getFullYear() + 2);
    setEndContract(join.toISOString().slice(0, 10));
    setNextTicketDate(join.toISOString().slice(0, 10));
  }, []);

  // Update End Contract & Next Ticket on Joining Date Change
  const handleJoiningDateChange = (date: string) => {
    setJoiningDate(date);
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 2);
        const twoYears = d.toISOString().slice(0, 10);
        setEndContract(twoYears);
        setNextTicketDate(twoYears);
      }
    }
  };

  // Passport Expiry Countdown
  const handlePassportExpiryChange = (date: string) => {
    setPassportExpiry(date);
    if (date) {
      const days = calculateDaysRemaining(date);
      setPassportDays(`Day ${days}`);
    } else {
      setPassportDays('');
    }
  };

  // Residency Expiry Countdown
  const handleResidencyExpiryChange = (date: string) => {
    setResidencyExpiry(date);
    if (date) {
      const days = calculateDaysRemaining(date);
      setResidencyDays(`Day ${days}`);
    } else {
      setResidencyDays('');
    }
  };

  // Bank Selection
  const handleBankChange = (shortName: string) => {
    setPayerBankShort(shortName);
    if (shortName === 'OTHER') {
      setPayerBank(customBankName || 'Other');
    } else {
      const b = banks.find((item) => item.short === shortName);
      if (b) {
        setPayerBank(b.name);
      }
    }
  };

  // Total Salary
  const totalSalary =
    basicSalary +
    foodAllowance +
    transportAllowance +
    carOperationAllowance +
    otherAllowance +
    limitedTransport;

  // Add Future Deduction
  const handleAddFutureDeduction = () => {
    setFutureDeductions((prev) => [
      ...prev,
      {
        id: `fd-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: 0,
        reason: '',
        status: 'Scheduled',
      },
    ]);
  };

  const handleRemoveFutureDeduction = (id: string) => {
    setFutureDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateFutureDeduction = (id: string, field: keyof FutureDeduction, value: string | number) => {
    setFutureDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName.trim()) {
      alert('Please enter employee name.');
      return;
    }

    const bankName = payerBankShort === 'OTHER' ? customBankName || 'Other' : payerBank;
    const futureDeductionSum = futureDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const newEmp: Employee = {
      no: nextNo,
      employerId,
      company,
      duty,
      accommodation,
      contractNo,
      employeeId,
      contractType,
      joiningDate,
      endContract,
      mph,
      expireMph,
      position,
      employeeName: employeeName.trim().toUpperCase(),
      nationality,
      mobile,
      whatsapp,
      email,
      passportNumber,
      passportExpiry,
      passportDays,
      residencyQid,
      residencyExpiry,
      residencyDays,
      payerBank: bankName,
      payerBankShort,
      iban,
      basicSalary,
      foodAllowance,
      transportAllowance,
      carOperationAllowance,
      otherAllowance,
      limitedTransport,
      totalSalary,
      saleCommissionRate,
      saleTargetRate,
      totalSalesRate,
      targetSales,
      prodSaleCommission,
      prodSaleTarget,
      prodTotalSales,
      businessTargetRate,
      businessGross,
      businessTargetAmount,
      businessCommBase,
      businessBonus,
      deductionCurrent,
      deductionFuture: futureDeductionSum,
      futureDeductions,
      tips,
      outstanding,
      leaveEntitlement,
      annualLeavePaid: 'QAR 0',
      salariesWages: totalSalary,
      totalCreditLeave,
      lastLeaveDate,
      annualLeaveDays,
      annualLeaveStatus,
      annualLeavePaidAmt,
      annualLeaveRemaining,
      annualLeaveFees,
      ticketCycle,
      nextTicketDate,
      ticketStatus,
      ticketDestination,
      confirm: confirmText,
      signature,
      date: formDate,
      status: 'Active',
      weeklyOffDay,
      employeeRole,
      assignedCategory: canProvideServices ? (employeeRole as SalonServiceCategory) : undefined,
      canProvideServices,
      availableForBooking: canProvideServices ? availableForBooking : false,
      serviceCategories: canProvideServices ? [employeeRole] : [],

      workingHours: {
        start: shiftStart,
        end: shiftEnd,
      },
      workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    };

    await db.saveEmployee(newEmp);
    alert(`✅ Employee "${newEmp.employeeName}" (${newEmp.employeeId}) registered successfully!`);
    onSaved();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Register New Salon Staff Member
          </h2>
          <p className="text-xs text-slate-500">
            Fill in official Qatar employment contract details, bank information, allowances, and documents.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Employee</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Employment Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">1. Employment &amp; Contract Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Record No (Auto)
              </label>
              <input
                type="text"
                value={nextNo}
                readOnly
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Employee ID (Auto)
              </label>
              <input
                type="text"
                value={employeeId}
                readOnly
                className="w-full text-xs p-2.5 bg-blue-50 border border-blue-200 text-blue-800 font-bold font-mono rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Employer ID *
              </label>
              <input
                type="text"
                value={employerId}
                onChange={(e) => setEmployerId(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contract No. (Auto)
              </label>
              <input
                type="text"
                value={contractNo}
                readOnly
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company *</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="COSMOS">COSMOS</option>
                <option value="F&G">F&amp;G</option>
                <option value="Ali Bin Ali">Ali Bin Ali</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duty *</label>
              <select
                value={duty}
                onChange={(e) => setDuty(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Duty">Duty</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Day Off">Day Off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Assigned Weekly Day Off *
              </label>
              <select
                value={weeklyOffDay}
                onChange={(e) => setWeeklyOffDay(e.target.value)}
                className="w-full text-xs p-2.5 bg-purple-50 border border-purple-200 text-purple-900 font-bold rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Accommodation *
              </label>
              <select
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Live In">Live In (Provided)</option>
                <option value="Live Out">Live Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contract Type *
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Contract">Contract</option>
                <option value="Permit">Permit</option>
                <option value="Nll">Nll</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => handleJoiningDateChange(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                End Contract (Auto +2 Years)
              </label>
              <input
                type="date"
                value={endContract}
                onChange={(e) => setEndContract(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                MPH Certificate *
              </label>
              <select
                value={mph}
                onChange={(e) => setMph(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="YES">YES</option>
                <option value="APPLY">APPLY</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expire MPH</label>
              <input
                type="date"
                value={expireMph}
                onChange={(e) => setExpireMph(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Salon Position / Job Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Eyelash Technician, Hair Stylist, Salon Manager"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 1B: Salon Role & Service Booking Eligibility */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                1B. Salon Role, Service Eligibility &amp; Customer Booking
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Booking Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Role / Booking Category *
              </label>
              <select
                value={employeeRole}
                onChange={(e) => {
                  const role = e.target.value as EmployeeRole;
                  setEmployeeRole(role);
                  const isNonService = ['Manager', 'HR', 'Receptionist', 'Accountant', 'Cleaner', 'Cleaner Staff'].includes(role);
                  if (isNonService) {
                    setCanProvideServices(false);
                    setAvailableForBooking(false);
                    setServiceCategories([]);
                  } else {
                    setCanProvideServices(true);
                    setAvailableForBooking(true);
                    setServiceCategories([role]);
                  }
                }}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <optgroup label="Salon Service Specialists (1-Category Rule)">
                  <option value="Hairdresser">Hairdresser (Hair Services)</option>
                  <option value="Eyelash Art">Eyelash Art (Eyelash Services)</option>
                  <option value="Eyebrows Art">Eyebrows Art (Eyebrows Services)</option>
                  <option value="Nail Art">Nail Art (Nail Services)</option>
                  <option value="Spa">Spa (Spa &amp; Hammam Services)</option>
                  <option value="Spray Tan">Spray Tan (Spray Tan Services)</option>
                </optgroup>
                <optgroup label="Non-Service Staff (Not doing any categories/services)">
                  <option value="Manager">Manager (Operations &amp; Supervision)</option>
                  <option value="HR">HR (Personnel, Visas &amp; Leaves)</option>
                  <option value="Receptionist">Receptionist (Desk &amp; Front Desk POS)</option>
                  <option value="Accountant">Accountant (Audits, Payroll &amp; Banking)</option>
                  <option value="Cleaner">Cleaner (Facility &amp; Sterilization)</option>
                </optgroup>
              </select>

              {['Manager', 'HR', 'Receptionist', 'Accountant', 'Cleaner', 'Cleaner Staff'].includes(employeeRole) ? (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Non-service staff do not perform salon categories or customer service treatments. HR, attendance, Qatar WPS, and monthly payroll records remain fully managed.
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Determines which service categories this employee can perform and accept bookings for.
                </p>
              )}
            </div>

            {/* Toggles */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Can Provide Salon Services</div>
                  <div className="text-[11px] text-slate-500">Authorized to perform salon services</div>
                </div>
                <input
                  type="checkbox"
                  checked={canProvideServices}
                  onChange={(e) => {
                    setCanProvideServices(e.target.checked);
                    if (!e.target.checked) setAvailableForBooking(false);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              <div className="h-px bg-slate-200"></div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Available for Customer Booking</div>
                  <div className="text-[11px] text-slate-500">Allow customers to book appointments online</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canProvideServices}
                  checked={availableForBooking}
                  onChange={(e) => setAvailableForBooking(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Shift Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Daily Shift Start Time
              </label>
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Daily Shift End Time
              </label>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">2. Personal &amp; Identity Documentation</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Employee's Full Name (as per Passport) *
              </label>
              <input
                type="text"
                placeholder="e.g. ATYRGUL AIAZOVA"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nationality *</label>
              <input
                type="text"
                placeholder="e.g. KYRGYZSTAN, PHILIPPINES, TUNISIA"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone</label>
              <input
                type="text"
                placeholder="+974 XXXX XXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
              <input
                type="text"
                placeholder="+974 XXXX XXXX"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail Address</label>
              <input
                type="email"
                placeholder="employee@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Passport Number</label>
              <input
                type="text"
                placeholder="e.g. AC3002861"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Passport Expiry Date</label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => handlePassportExpiryChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Passport Days Remaining
              </label>
              <input
                type="text"
                value={passportDays}
                readOnly
                placeholder="Calculated automatically"
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Residency QID (11 Digits)
              </label>
              <input
                type="text"
                placeholder="e.g. 29741700048"
                value={residencyQid}
                onChange={(e) => setResidencyQid(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tracking-wider font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Residency QID Expiry</label>
              <input
                type="date"
                value={residencyExpiry}
                onChange={(e) => handleResidencyExpiryChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Residency Days Remaining
              </label>
              <input
                type="text"
                value={residencyDays}
                readOnly
                placeholder="Calculated automatically"
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">3. Qatar Banking &amp; IBAN Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payer Bank *</label>
              <select
                value={payerBankShort}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {banks.map((b) => (
                  <option key={b.short} value={b.short}>
                    {b.name} ({b.short})
                  </option>
                ))}
              </select>
            </div>

            {payerBankShort === 'OTHER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custom Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full bank name"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            <div className={payerBankShort === 'OTHER' ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payee Bank IBAN (QA...)
              </label>
              <input
                type="text"
                placeholder="QA60BRWA00000000020000129"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tracking-wider font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Salary & Allowances */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">4. Monthly Salary &amp; Allowances (QAR)</h3>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Package: <span className="text-emerald-600 font-bold font-mono">QAR {totalSalary.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Basic Salary</label>
              <input
                type="number"
                step="0.01"
                value={basicSalary}
                onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Food Allowance</label>
              <input
                type="number"
                step="0.01"
                value={foodAllowance}
                onChange={(e) => setFoodAllowance(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transportation Allowance
              </label>
              <input
                type="number"
                step="0.01"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Car Operation Allowance
              </label>
              <input
                type="number"
                step="0.01"
                value={carOperationAllowance}
                onChange={(e) => setCarOperationAllowance(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Other Allowance</label>
              <input
                type="number"
                step="0.01"
                value={otherAllowance}
                onChange={(e) => setOtherAllowance(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Limited Transportation
              </label>
              <input
                type="number"
                step="0.01"
                value={limitedTransport}
                onChange={(e) => setLimitedTransport(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Total Monthly Package (Auto Calculated)
              </label>
              <input
                type="text"
                value={`QAR ${totalSalary.toLocaleString()}`}
                readOnly
                className="w-full text-xs p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono rounded-lg tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Sales Commission & Targets */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                5. Salon Service, Retail &amp; Business Target Commissions
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              3 Distinct Calculations · Zero Duplicate Counting · Live Audit
            </div>
          </div>

          {/* Stream 1: Service Sales Commission */}
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Employee Sales Commission — Services (Default: 10%)
                </h4>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                (totalSalesRate > 0 && totalSalesRate >= saleTargetRate)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {(totalSalesRate > 0 && totalSalesRate >= saleTargetRate)
                  ? 'Eligible (Target Met)'
                  : 'Not Eligible (Commission = QAR 0)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={saleCommissionRate}
                  onChange={(e) => setSaleCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sales Target Amount (QAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleTargetRate}
                  onChange={(e) => setSaleTargetRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Actual Eligible Sales (QAR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalSalesRate}
                  onChange={(e) => setTotalSalesRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-blue-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Sales Benchmark (QAR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetSales}
                  onChange={(e) => setTargetSales(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Stream 1 Summary & Formula */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sales Target</span>
                <span className="font-mono font-bold text-slate-800">QAR {saleTargetRate.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actual Sales</span>
                <span className="font-mono font-bold text-slate-800">QAR {totalSalesRate.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Achievement %</span>
                <span className="font-mono font-bold text-slate-800">
                  {saleTargetRate > 0 ? ((totalSalesRate / saleTargetRate) * 100).toFixed(1) : (totalSalesRate > 0 ? '100.0' : '0.0')}%
                </span>
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="text-blue-700 block text-[10px] uppercase font-bold">Service Commission</span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  QAR {((totalSalesRate > 0 && totalSalesRate >= saleTargetRate) ? totalSalesRate * (saleCommissionRate / 100) : 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Formula: Commission Eligibility = Actual Eligible Sales ≥ Sales Target. If eligible: Actual × {saleCommissionRate}%; Otherwise: QAR 0. Commission is not paid when target is not reached.
            </p>
          </div>

          {/* Stream 2: Products Sales Commission */}
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Products Sales Commission — Retail (Default: 5%)
                </h4>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                prodTotalSales > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {prodTotalSales > 0 ? 'Eligible (Sales > 0)' : 'No Eligible Product Sales'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Product Comm. Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={prodSaleCommission}
                  onChange={(e) => setProdSaleCommission(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Eligible Products Sales (QAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodTotalSales}
                  onChange={(e) => setProdTotalSales(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Optional Product Sales Target (QAR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodSaleTarget}
                  onChange={(e) => setProdSaleTarget(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Stream 2 Summary & Formula */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Product Sales Total</span>
                <span className="font-mono font-bold text-slate-800">QAR {prodTotalSales.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Commission Rate</span>
                <span className="font-mono font-bold text-slate-800">{prodSaleCommission}%</span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Product Commission</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  QAR {(prodTotalSales > 0 ? prodTotalSales * (prodSaleCommission / 100) : 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Formula: Products Commission = Eligible Products Sales × {prodSaleCommission}%. Tracked separately from service sales to prevent duplicate transaction counting.
            </p>
          </div>

          {/* Stream 3: Business Target Commission */}
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Business Target Commission — Gross Sales (Default: QAR 200,000 @ 5%)
                </h4>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                (businessGross >= businessTargetAmount && businessTargetAmount > 0)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {(businessGross >= businessTargetAmount && businessTargetAmount > 0)
                  ? 'Target Met (≥ QAR ' + businessTargetAmount.toLocaleString() + ')'
                  : 'Below Target (Commission = QAR 0)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Business Target Amount (QAR) *
                </label>
                <input
                  type="number"
                  step="1000"
                  value={businessTargetAmount}
                  onChange={(e) => setBusinessTargetAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Business Gross Sales (QAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={businessGross}
                  onChange={(e) => setBusinessGross(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold text-purple-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Business Comm. Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={businessTargetRate}
                  onChange={(e) => setBusinessTargetRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Calculation Base Mode *
                </label>
                <select
                  value={businessCommBase}
                  onChange={(e) => setBusinessCommBase(e.target.value as 'all_gross' | 'above_target')}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="all_gross">All Eligible Gross Sales</option>
                  <option value="above_target">Only Amount Above Target</option>
                </select>
              </div>
            </div>

            {/* Stream 3 Summary & Formula */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Target</span>
                <span className="font-mono font-bold text-slate-800">QAR {businessTargetAmount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Gross</span>
                <span className="font-mono font-bold text-slate-800">QAR {businessGross.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Achievement %</span>
                <span className="font-mono font-bold text-slate-800">
                  {businessTargetAmount > 0 ? ((businessGross / businessTargetAmount) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg">
                <span className="text-purple-700 block text-[10px] uppercase font-bold">Business Commission</span>
                <span className="font-mono font-bold text-purple-800 text-sm">
                  {(() => {
                    const isElig = businessGross >= businessTargetAmount && businessTargetAmount > 0;
                    if (!isElig) return 'QAR 0';
                    const base = businessCommBase === 'above_target' ? Math.max(0, businessGross - businessTargetAmount) : businessGross;
                    return `QAR ${(base * (businessTargetRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                  })()}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Formula: If Business Gross Sales ≥ Business Target: Commission = {businessCommBase === 'above_target' ? '(Business Gross - Target)' : 'Business Gross'} × {businessTargetRate}%; Otherwise: QAR 0.
            </p>
          </div>

          {/* Grand Total Summary Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Combined Commission Payable
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {(() => {
                  const sElig = totalSalesRate > 0 && totalSalesRate >= saleTargetRate;
                  const sComm = sElig ? totalSalesRate * (saleCommissionRate / 100) : 0;
                  const pComm = prodTotalSales > 0 ? prodTotalSales * (prodSaleCommission / 100) : 0;
                  const bElig = businessGross >= businessTargetAmount && businessTargetAmount > 0;
                  const bBase = businessCommBase === 'above_target' ? Math.max(0, businessGross - businessTargetAmount) : businessGross;
                  const bComm = bElig ? bBase * (businessTargetRate / 100) : 0;
                  return `QAR ${(sComm + pComm + bComm).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                })()}
              </div>
            </div>
            <div className="text-xs text-slate-300 font-mono sm:text-right">
              <span>Service (10%) + Products (5%) + Business (5%)</span>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                Three separate streams · No transactions counted twice
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Deductions & Scheduled Payments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">6. Deductions, Tips &amp; Scheduled Debt</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Current Month Deduction (QAR)
              </label>
              <input
                type="number"
                step="0.01"
                value={deductionCurrent}
                onChange={(e) => setDeductionCurrent(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-rose-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Tips (QAR)</label>
              <input
                type="number"
                step="0.01"
                value={tips}
                onChange={(e) => setTips(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-emerald-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Outstanding Balance (QAR)
              </label>
              <input
                type="number"
                step="0.01"
                value={outstanding}
                onChange={(e) => setOutstanding(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-rose-600 font-semibold"
              />
            </div>
          </div>

          {/* Future deductions list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Scheduled Future Month Deductions
              </label>
              <button
                type="button"
                onClick={handleAddFutureDeduction}
                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Scheduled Deduction</span>
              </button>
            </div>

            {futureDeductions.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                No future scheduled deductions. Future deductions will only apply in their designated payroll month.
              </p>
            ) : (
              <div className="space-y-2">
                {futureDeductions.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                  >
                    <input
                      type="date"
                      value={d.date}
                      onChange={(e) => handleUpdateFutureDeduction(d.id, 'date', e.target.value)}
                      className="text-xs p-1.5 bg-white border border-slate-200 rounded font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Reason for deduction (e.g. advance, visa fee)"
                      value={d.reason}
                      onChange={(e) => handleUpdateFutureDeduction(d.id, 'reason', e.target.value)}
                      className="text-xs p-1.5 bg-white border border-slate-200 rounded flex-1"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount (QAR)"
                      value={d.amount}
                      onChange={(e) =>
                        handleUpdateFutureDeduction(d.id, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="text-xs p-1.5 bg-white border border-slate-200 rounded w-28 font-mono tabular-nums text-rose-600 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFutureDeduction(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 7: Annual Leave & Flight Tickets */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plane className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">
              7. Annual Leave &amp; Flight Ticket Entitlement
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Annual Entitlement (Days)
              </label>
              <input
                type="number"
                value={leaveEntitlement}
                onChange={(e) => setLeaveEntitlement(parseInt(e.target.value) || 21)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Credit Leave Days
              </label>
              <input
                type="number"
                value={totalCreditLeave}
                onChange={(e) => setTotalCreditLeave(parseInt(e.target.value) || 21)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Flight Ticket Cycle (Years)
              </label>
              <input
                type="number"
                value={ticketCycle}
                onChange={(e) => setTicketCycle(parseInt(e.target.value) || 2)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Next Flight Ticket Date
              </label>
              <input
                type="date"
                value={nextTicketDate}
                onChange={(e) => setNextTicketDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ticket Status</label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              >
                <option value="Not Eligible">Not Eligible</option>
                <option value="Eligible">Eligible</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Booked">Booked</option>
                <option value="Used">Used</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Home Airport / Destination
              </label>
              <input
                type="text"
                placeholder="e.g. Manas International Airport (Bishkek, Kyrgyzstan)"
                value={ticketDestination}
                onChange={(e) => setTicketDestination(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 8: Confirmation & Signatures */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">8. Contract Confirmation &amp; Signature</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Acknowledgment Text
              </label>
              <textarea
                rows={2}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Signature / Digital Sign-off
              </label>
              <input
                type="text"
                placeholder="Employee signature name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-serif italic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sign Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Complete &amp; Register Employee</span>
          </button>
        </div>
      </form>
    </div>
  );
};
