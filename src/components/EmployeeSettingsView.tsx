import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Settings,
  ShieldCheck,
  Scissors,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  X,
  Edit2,
  Eye,
  Check,
  Building,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Clock,
  Calendar,
  DollarSign,
  Tag,
  Percent,
} from 'lucide-react';
import {
  Employee,
  ServiceCatalogueItem,
  SalonServiceCategory,
  NonServiceRole,
  ServiceCategory,
} from '../types';
import { db, formatCurrency } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface EmployeeSettingsViewProps {
  employees: Employee[];
  catalogue: ServiceCatalogueItem[];
  onRefresh: () => void;
  onOpenEmployee?: (id: string) => void;
  onNavigateAddEmployee?: () => void;
}

export const DEFAULT_SALON_CATEGORIES: { id: SalonServiceCategory; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'Hairdresser', label: 'Hairdresser', icon: '💇‍♀️', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'Eyelash Art', label: 'Eyelash Art', icon: '👁️', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'Eyebrows Art', label: 'Eyebrows Art', icon: '🖋️', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { id: 'Nail Art', label: 'Nail Art', icon: '💅', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
  { id: 'Spa', label: 'Spa & Hammam', icon: '🧖‍♀️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'Spray Tan', label: 'Spray Tan', icon: '☀️', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
];

export const DEFAULT_NON_SERVICE_ROLES: { id: NonServiceRole; label: string; icon: string; description: string }[] = [
  { id: 'Manager', label: 'Manager', icon: '👑', description: 'Salon operations, approvals, managerial signatory & supervision' },
  { id: 'HR', label: 'HR', icon: '📋', description: 'Personnel records, visa compliance, contracts & leave tracking' },
  { id: 'Receptionist', label: 'Receptionist', icon: '📞', description: 'Customer check-in, appointments scheduling & POS checkout desk' },
  { id: 'Accountant', label: 'Accountant', icon: '🧮', description: 'Bookkeeping, monthly payroll, bank WPS transfers & daily audits' },
  { id: 'Cleaner', label: 'Cleaner', icon: '🧹', description: 'Salon sanitation, sterilization, towel care & facility maintenance' },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EmployeeSettingsView: React.FC<EmployeeSettingsViewProps> = ({
  employees,
  catalogue,
  onRefresh,
  onOpenEmployee,
  onNavigateAddEmployee,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Custom Roles & Categories
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomType, setNewCustomType] = useState<'role' | 'category'>('role');
  const [newCustomName, setNewCustomName] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Employee | null>(null);

  // Edit Modal Form State (13 Fields)
  const [formData, setFormData] = useState<{
    employeeName: string;
    staffOrMilitaryNumber: string;
    employeeRole: string;
    serviceCategory: string;
    assignedServices: string[];
    canProvideServices: boolean;
    availableForBooking: boolean;
    workingDays: string[];
    workingHoursStart: string;
    workingHoursEnd: string;
    weeklyOffDay: string;
    leaveStatus: string;
    salaryType: 'Monthly' | 'Hourly' | 'Daily' | 'Contract';
    basicSalary: number;
    totalSalary: number;
    commissionEligible: boolean;
    saleCommissionRate: number;
    prodSaleCommission: number;
    status: 'Active' | 'On Leave' | 'Probation' | 'Notice Period' | 'Unemployed';
  }>({
    employeeName: '',
    staffOrMilitaryNumber: '',
    employeeRole: 'Hairdresser',
    serviceCategory: 'Hairdresser',
    assignedServices: [],
    canProvideServices: true,
    availableForBooking: true,
    workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    workingHoursStart: '09:00',
    workingHoursEnd: '21:00',
    weeklyOffDay: 'Friday',
    leaveStatus: 'Active Duty',
    salaryType: 'Monthly',
    basicSalary: 4000,
    totalSalary: 6000,
    commissionEligible: true,
    saleCommissionRate: 10,
    prodSaleCommission: 5,
    status: 'Active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setCustomRoles(db.getCustomJobRoles());
    setCustomCategories(db.getCustomServiceCategories());
  }, []);

  // Filter Active Employees
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.status !== 'Unemployed');
  }, [employees]);

  // Combined roles & categories
  const allServiceCategories = useMemo(() => {
    const defaultIds = DEFAULT_SALON_CATEGORIES.map((c) => c.id);
    return [...defaultIds, ...customCategories.filter((c) => !defaultIds.includes(c as any))];
  }, [customCategories]);

  const allNonServiceRoles = useMemo(() => {
    const defaultIds = DEFAULT_NON_SERVICE_ROLES.map((r) => r.id);
    return [...defaultIds, ...customRoles.filter((r) => !defaultIds.includes(r as any))];
  }, [customRoles]);

  // Metrics
  const roleMetrics = useMemo(() => {
    const nonServiceNames = ['HR', 'Accountant', 'Cleaner Staff', 'Cleaner', 'Manager', 'Receptionist', ...customRoles];
    const serviceStaff = activeEmployees.filter(
      (e) => e.canProvideServices !== false && !nonServiceNames.includes(e.employeeRole || e.position)
    );
    const nonServiceStaff = activeEmployees.filter(
      (e) => e.canProvideServices === false || nonServiceNames.includes(e.employeeRole || e.position)
    );

    const categoryCounts: Record<string, number> = {};
    allServiceCategories.forEach((cat) => {
      categoryCounts[cat] = 0;
    });

    serviceStaff.forEach((emp) => {
      const cat = emp.assignedCategory || (emp.serviceCategories && emp.serviceCategories[0]) || emp.employeeRole;
      if (cat && categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      }
    });

    return {
      total: activeEmployees.length,
      serviceCount: serviceStaff.length,
      nonServiceCount: nonServiceStaff.length,
      categoryCounts,
    };
  }, [activeEmployees, customRoles, allServiceCategories]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const nonServiceNames = ['HR', 'Accountant', 'Cleaner Staff', 'Cleaner', 'Manager', 'Receptionist', ...customRoles];

    return activeEmployees.filter((emp) => {
      const isNonService =
        emp.canProvideServices === false ||
        nonServiceNames.includes(emp.employeeRole || emp.position);

      if (selectedFilter === 'NON_SERVICE') {
        if (!isNonService) return false;
      } else if (selectedFilter !== 'ALL') {
        if (isNonService) return false;
        const assigned =
          emp.assignedCategory ||
          (emp.serviceCategories && emp.serviceCategories[0]) ||
          emp.employeeRole;
        if (assigned !== selectedFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.employeeName.toLowerCase().includes(q);
        const matchId = emp.employeeId.toLowerCase().includes(q);
        const matchNumber = (emp.staffOrMilitaryNumber || '').toLowerCase().includes(q);
        const matchRole = (emp.employeeRole || emp.position).toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole && !matchNumber) return false;
      }

      return true;
    });
  }, [activeEmployees, selectedFilter, searchQuery, customRoles]);

  // Open Edit Modal for an Employee
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const nonServiceNames = ['HR', 'Accountant', 'Cleaner Staff', 'Cleaner', 'Manager', 'Receptionist', ...customRoles];
    const isNonService =
      emp.canProvideServices === false ||
      nonServiceNames.includes(emp.employeeRole || emp.position);

    const cat = emp.assignedCategory || (emp.serviceCategories && emp.serviceCategories[0]) || emp.employeeRole || 'Hairdresser';

    setFormData({
      employeeName: emp.employeeName,
      staffOrMilitaryNumber: emp.staffOrMilitaryNumber || '',
      employeeRole: emp.employeeRole || emp.position || (isNonService ? 'Manager' : 'Hairdresser'),
      serviceCategory: isNonService ? '' : cat,
      assignedServices: emp.assignedServices || [],
      canProvideServices: emp.canProvideServices !== undefined ? emp.canProvideServices : !isNonService,
      availableForBooking: emp.availableForBooking !== undefined ? emp.availableForBooking : !isNonService,
      workingDays: emp.workingDays && emp.workingDays.length > 0 ? emp.workingDays : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      workingHoursStart: emp.workingHours?.start || '09:00',
      workingHoursEnd: emp.workingHours?.end || '21:00',
      weeklyOffDay: emp.weeklyOffDay || 'Friday',
      leaveStatus: emp.leaveStatus || (emp.duty === 'Vacation' ? 'On Vacation' : 'Active Duty'),
      salaryType: (emp.salaryType as any) || 'Monthly',
      basicSalary: Number(emp.basicSalary) || 0,
      totalSalary: Number(emp.totalSalary) || Number(emp.salariesWages) || 0,
      commissionEligible: emp.commissionEligible !== undefined ? emp.commissionEligible : !isNonService,
      saleCommissionRate: emp.saleCommissionRate !== undefined ? emp.saleCommissionRate : (isNonService ? 0 : 10),
      prodSaleCommission: emp.prodSaleCommission !== undefined ? emp.prodSaleCommission : (isNonService ? 0 : 5),
      status: (emp.status as any) || 'Active',
    });
  };

  // Toggle Working Day
  const handleToggleWorkingDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      const nextDays = exists ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day];
      return { ...prev, workingDays: nextDays };
    });
  };

  // Toggle Assigned Service
  const handleToggleAssignedService = (serviceName: string) => {
    setFormData((prev) => {
      const exists = prev.assignedServices.includes(serviceName);
      const next = exists
        ? prev.assignedServices.filter((s) => s !== serviceName)
        : [...prev.assignedServices, serviceName];
      return { ...prev, assignedServices: next };
    });
  };

  // Save Role / Category Settings
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsSubmitting(true);
    try {
      const isServiceStaff = formData.canProvideServices;

      const updatedEmp: Employee = {
        ...editingEmployee,
        employeeName: formData.employeeName,
        staffOrMilitaryNumber: formData.staffOrMilitaryNumber,
        employeeRole: formData.employeeRole,
        canProvideServices: formData.canProvideServices,
        availableForBooking: formData.availableForBooking,
        workingDays: formData.workingDays,
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        },
        weeklyOffDay: formData.weeklyOffDay,
        leaveStatus: formData.leaveStatus as any,
        duty: formData.leaveStatus === 'On Vacation' ? 'Vacation' : 'Duty',
        salaryType: formData.salaryType,
        basicSalary: formData.basicSalary,
        totalSalary: formData.totalSalary,
        commissionEligible: formData.commissionEligible,
        saleCommissionRate: isServiceStaff ? formData.saleCommissionRate : 0,
        prodSaleCommission: isServiceStaff ? formData.prodSaleCommission : 0,
        status: formData.status as any,
      };

      if (isServiceStaff) {
        // Enforce strict 1 designated service category
        const targetCat = formData.serviceCategory || formData.employeeRole;
        updatedEmp.assignedCategory = targetCat as any;
        updatedEmp.serviceCategories = [targetCat as any];
        updatedEmp.assignedServices = formData.assignedServices;
      } else {
        // Administrative non-service staff
        updatedEmp.assignedCategory = undefined;
        updatedEmp.serviceCategories = [];
        updatedEmp.assignedServices = [];
        updatedEmp.availableForBooking = false;
        updatedEmp.saleCommissionRate = 0;
        updatedEmp.prodSaleCommission = 0;
      }

      await db.saveEmployee(updatedEmp);
      await db.logAudit(
        'EMPLOYEE_SETTINGS_UPDATED',
        `Updated settings for ${updatedEmp.employeeName} (${updatedEmp.employeeId}): Role=${updatedEmp.employeeRole}, CanProvideServices=${updatedEmp.canProvideServices}, Booking=${updatedEmp.availableForBooking}`
      );

      setSuccessToast(`Settings successfully saved for ${updatedEmp.employeeName}`);
      setTimeout(() => setSuccessToast(null), 3500);

      setEditingEmployee(null);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Custom Role or Category
  const handleSaveCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;

    if (newCustomType === 'role') {
      await db.addCustomJobRole(newCustomName.trim());
      setCustomRoles(db.getCustomJobRoles());
      setSuccessToast(`Added custom job role: ${newCustomName.trim()}`);
    } else {
      await db.addCustomServiceCategory(newCustomName.trim());
      setCustomCategories(db.getCustomServiceCategories());
      setSuccessToast(`Added custom service category: ${newCustomName.trim()}`);
    }

    setTimeout(() => setSuccessToast(null), 3500);
    setNewCustomName('');
    setShowAddCustomModal(false);
  };

  // Execute Employee Deletion
  const handleDeleteEmployee = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await db.deleteEmployee(deleteConfirmTarget.employeeId);
      setSuccessToast(`Employee ${deleteConfirmTarget.employeeName} (${deleteConfirmTarget.employeeId}) deleted successfully`);
      setTimeout(() => setSuccessToast(null), 3500);
      setDeleteConfirmTarget(null);
      if (editingEmployee?.employeeId === deleteConfirmTarget.employeeId) {
        setEditingEmployee(null);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- TOP BANNER & ENFORCEMENT NOTICE ----------------- */}
      <div className="bg-[#121216] border border-[#2b2b34] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Cosmos Role Policy</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                1 Employee &bull; 1 Designated Service Category &bull; Strict Role Governance
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Employee Settings &bull; Job Role, Booking &amp; Permissions</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Configure job roles, authorized service categories, customer booking restrictions, working schedules, leave status, and commission rates. Service specialists perform only in their designated category; administrative staff (Manager, HR, Receptionist, Accountant, Cleaner) cannot be booked by customers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="px-3 py-2 text-xs font-semibold bg-[#1e1e28] hover:bg-[#282836] border border-[#373748] text-purple-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Add Job Role / Category</span>
            </button>

            {onNavigateAddEmployee && (
              <button
                type="button"
                onClick={onNavigateAddEmployee}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* ----------------- METRIC CARDS / QUICK FILTER TABS ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
              : 'bg-[#121216] border-[#252530] text-slate-400 hover:bg-[#181820]'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Staff</div>
          <div className="text-xl font-extrabold text-white mt-1">{roleMetrics.total}</div>
          <div className="text-[10px] text-purple-400 mt-0.5">Total Active</div>
        </button>

        {DEFAULT_SALON_CATEGORIES.map((cat) => {
          const isSelected = selectedFilter === cat.id;
          const count = roleMetrics.categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedFilter(cat.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                  : 'bg-[#121216] border-[#252530] text-slate-400 hover:bg-[#181820]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>{cat.icon}</span>
                <span className="text-[10px] text-slate-500 font-mono">1-to-1</span>
              </div>
              <div className="text-xl font-extrabold text-white">{count}</div>
              <div className="text-[10px] font-semibold truncate text-slate-300 mt-0.5">{cat.label}</div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelectedFilter('NON_SERVICE')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'NON_SERVICE'
              ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
              : 'bg-[#121216] border-[#252530] text-slate-400 hover:bg-[#181820]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span>🏛️</span>
            <span className="text-[10px] text-blue-400 font-mono">Admin</span>
          </div>
          <div className="text-xl font-extrabold text-white">{roleMetrics.nonServiceCount}</div>
          <div className="text-[10px] font-semibold truncate text-slate-300 mt-0.5">Non-Service</div>
        </button>
      </div>

      {/* ----------------- SEARCH & CONTROLS ----------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121216] border border-[#252530] rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees by name, ID, staff number, or job role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#181822] border border-[#2d2d3c] rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredEmployees.length}</strong> of {activeEmployees.length}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-purple-400 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ----------------- EMPLOYEES ROLES & CATEGORIES TABLE ----------------- */}
      <div className="bg-[#121216] border border-[#252530] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#171720] border-b border-[#252530] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee &bull; Staff ID</th>
                <th className="py-3 px-4">Job Role</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4 text-center">Can Provide Services</th>
                <th className="py-3 px-4 text-center">Customer Booking</th>
                <th className="py-3 px-4">Working Days &amp; Shift</th>
                <th className="py-3 px-4 text-center">Off Day</th>
                <th className="py-3 px-4 text-center">Leave Status</th>
                <th className="py-3 px-4 text-right">Basic / Total Salary</th>
                <th className="py-3 px-4 text-center">Commissions</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e28]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <p className="text-xs font-semibold">No employees found matching the filter</p>
                    <p className="text-[11px] text-slate-600 mt-1">Try resetting the filter or search query</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const nonServiceNames = ['HR', 'Accountant', 'Cleaner Staff', 'Cleaner', 'Manager', 'Receptionist', ...customRoles];
                  const isNonService =
                    emp.canProvideServices === false ||
                    nonServiceNames.includes(emp.employeeRole || emp.position);

                  const assignedCat =
                    emp.assignedCategory ||
                    (emp.serviceCategories && emp.serviceCategories[0]) ||
                    emp.employeeRole;

                  return (
                    <tr key={emp.employeeId} className="hover:bg-[#16161f] transition-colors group">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{emp.employeeName}</span>
                        </div>
                        <div className="text-[10px] text-purple-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{emp.employeeId}</span>
                          {emp.staffOrMilitaryNumber && (
                            <span className="text-slate-400">&bull; Staff/Mil: {emp.staffOrMilitaryNumber}</span>
                          )}
                        </div>
                      </td>

                      {/* Job Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isNonService
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>{emp.employeeRole || emp.position}</span>
                        </span>
                      </td>

                      {/* Service Category */}
                      <td className="py-3.5 px-4">
                        {isNonService ? (
                          <span className="text-slate-500 italic text-[11px]">
                            Non-Service &bull; Administrative
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#1f1f2a] border border-[#343446] text-purple-300 font-bold text-xs">
                              {assignedCat}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Can Provide Services */}
                      <td className="py-3.5 px-4 text-center">
                        {emp.canProvideServices !== false && !isNonService ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>YES</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/60 text-slate-400 border border-slate-700/40">
                            <X className="w-3 h-3 text-slate-500" />
                            <span>NO</span>
                          </span>
                        )}
                      </td>

                      {/* Customer Booking */}
                      <td className="py-3.5 px-4 text-center">
                        {emp.availableForBooking !== false && emp.canProvideServices !== false && !isNonService ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                            <UserCheck className="w-3 h-3 text-cyan-400" />
                            <span>AVAILABLE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                            <UserX className="w-3 h-3 text-red-400" />
                            <span>BLOCKED</span>
                          </span>
                        )}
                      </td>

                      {/* Working Days & Shift */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-300 font-medium">
                          {emp.workingDays && emp.workingDays.length > 0
                            ? `${emp.workingDays.length} days/week`
                            : '6 days/week'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          <span>
                            {emp.workingHours?.start || '09:00'} - {emp.workingHours?.end || '21:00'}
                          </span>
                        </div>
                      </td>

                      {/* Off Day */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#1c1c24] text-slate-300 font-mono text-[11px]">
                          {emp.weeklyOffDay || 'Friday'}
                        </span>
                      </td>

                      {/* Leave Status */}
                      <td className="py-3.5 px-4 text-center">
                        {emp.duty === 'Vacation' || String(emp.leaveStatus || '').toLowerCase().includes('vacation') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                            Vacation
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            Active Duty
                          </span>
                        )}
                      </td>

                      {/* Salary */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-white text-xs">
                          QAR {formatCurrency(emp.totalSalary || emp.salariesWages || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Basic: QAR {formatCurrency(emp.basicSalary || 0)}
                        </div>
                      </td>

                      {/* Commission Rates */}
                      <td className="py-3.5 px-4 text-center">
                        {isNonService ? (
                          <span className="text-slate-500 font-mono text-[11px]">-</span>
                        ) : (
                          <div className="font-mono text-xs">
                            <span className="font-bold text-emerald-400">
                              {emp.saleCommissionRate || 10}%
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1">
                              (prod {emp.prodSaleCommission || 5}%)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            emp.status === 'Active'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Configure Full Employee Settings"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Configure</span>
                          </button>

                          {onOpenEmployee && (
                            <button
                              type="button"
                              onClick={() => onOpenEmployee(emp.employeeId)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202028] transition-colors cursor-pointer"
                              title="View Full Employee Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget(emp)}
                            className="p-1.5 text-red-400 hover:text-red-200 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- CONFIGURE 13-FIELD EMPLOYEE SETTINGS MODAL ----------------- */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141419] border border-[#2b2b36] rounded-2xl w-full max-w-3xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#252530] flex items-center justify-between bg-[#191922] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Employee Settings &amp; Permissions</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {editingEmployee.employeeName} &bull; ID: {editingEmployee.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveRole} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Field 1 & 2: Name & Staff/Military Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    1. Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#181822] border border-[#2e2e3c] rounded-xl text-white font-semibold focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    2. Military or Staff Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MIL-QA-9921 or STF-104"
                    value={formData.staffOrMilitaryNumber}
                    onChange={(e) => setFormData({ ...formData, staffOrMilitaryNumber: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#181822] border border-[#2e2e3c] rounded-xl text-white font-mono focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Field 3 & 4: Job Role & Service Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#181822] p-4 rounded-xl border border-[#2b2b38]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>3. Employee Job Role *</span>
                  </label>
                  <select
                    value={formData.employeeRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const isNonService = DEFAULT_NON_SERVICE_ROLES.some((r) => r.id === newRole) || customRoles.includes(newRole);
                      setFormData({
                        ...formData,
                        employeeRole: newRole,
                        canProvideServices: !isNonService,
                        availableForBooking: !isNonService,
                        serviceCategory: isNonService ? '' : (formData.serviceCategory || newRole),
                      });
                    }}
                    className="w-full text-xs p-2.5 bg-[#121216] border border-[#2e2e3c] rounded-xl text-white font-bold"
                  >
                    <optgroup label="Default Service Roles">
                      {DEFAULT_SALON_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Default Non-Service Roles">
                      {DEFAULT_NON_SERVICE_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </optgroup>
                    {customRoles.length > 0 && (
                      <optgroup label="Custom Roles">
                        {customRoles.map((cr) => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>4. Service Category (Strict 1 Category)</span>
                  </label>
                  <select
                    disabled={!formData.canProvideServices}
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#121216] border border-[#2e2e3c] rounded-xl text-white font-bold disabled:opacity-40"
                  >
                    <option value="">-- No Category (Non-Service) --</option>
                    {allServiceCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 6 & 7: Can Provide Services & Available for Customer Booking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181822] border border-[#292936] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-purple-400" />
                      <span>6. Can Provide Services</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Service specialists: Yes &bull; Admin/HR: No
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !formData.canProvideServices;
                      setFormData({
                        ...formData,
                        canProvideServices: next,
                        availableForBooking: next ? formData.availableForBooking : false,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.canProvideServices
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#252530] text-slate-400'
                    }`}
                  >
                    {formData.canProvideServices ? 'YES' : 'NO'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#181822] border border-[#292936] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>7. Available for Customer Booking</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Customer calendar visibility &amp; time slots
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!formData.canProvideServices}
                    onClick={() => setFormData({ ...formData, availableForBooking: !formData.availableForBooking })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 ${
                      formData.availableForBooking
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-[#252530] text-slate-400'
                    }`}
                  >
                    {formData.availableForBooking ? 'YES' : 'NO'}
                  </button>
                </div>
              </div>

              {/* Field 5: Assigned Services within Category */}
              {formData.canProvideServices && formData.serviceCategory && (
                <div className="p-4 rounded-xl bg-[#181822] border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      5. Assigned Services in &quot;{formData.serviceCategory}&quot;
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {catalogue.filter((s) => s.category === formData.serviceCategory).length} available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                    {catalogue
                      .filter((s) => s.category === formData.serviceCategory)
                      .map((srv) => {
                        const isAssigned =
                          formData.assignedServices.length === 0 ||
                          formData.assignedServices.includes(srv.name);

                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => handleToggleAssignedService(srv.name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                              isAssigned
                                ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                                : 'bg-[#121216] border-[#2b2b38] text-slate-400 opacity-60'
                            }`}
                          >
                            {isAssigned ? '✓ ' : '+ '}
                            {srv.name} (QAR {formatCurrency(srv.price)})
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Field 8 & 9: Working Days, Hours, and Off Days */}
              <div className="p-4 rounded-xl bg-[#181822] border border-[#2b2b38] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>8 &amp; 9. Working Days, Shift Hours &amp; Weekly Off Day</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const isWorking = formData.workingDays.includes(day);
                    const isOff = formData.weeklyOffDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleWorkingDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isOff
                            ? 'bg-red-950/40 border-red-500/50 text-red-300'
                            : isWorking
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-[#121216] border-[#2b2b38] text-slate-400'
                        }`}
                      >
                        {day} {isOff ? '(Off)' : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Shift Start</label>
                    <input
                      type="time"
                      value={formData.workingHoursStart}
                      onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Shift End</label>
                    <input
                      type="time"
                      value={formData.workingHoursEnd}
                      onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Weekly Off Day</label>
                    <select
                      value={formData.weeklyOffDay}
                      onChange={(e) => setFormData({ ...formData, weeklyOffDay: e.target.value })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-white font-semibold"
                    >
                      {WEEK_DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Field 10, 11, 12, 13: Leave Status, Salary, Commissions, Employment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 10. Vacation / Leave Status */}
                <div className="p-3.5 rounded-xl bg-[#181822] border border-[#2b2b38]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    10. Vacation / Leave Status *
                  </label>
                  <select
                    value={formData.leaveStatus}
                    onChange={(e) => setFormData({ ...formData, leaveStatus: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#121216] border border-[#2e2e3c] rounded-xl text-white font-bold"
                  >
                    <option value="Active Duty">Active Duty (Available)</option>
                    <option value="On Vacation">On Vacation (Booking Blocked)</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>

                {/* 13. Employment Status */}
                <div className="p-3.5 rounded-xl bg-[#181822] border border-[#2b2b38]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    13. Employment Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-[#121216] border border-[#2e2e3c] rounded-xl text-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Notice Period">Notice Period</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              {/* 11. Salary Type & Amount */}
              <div className="p-4 rounded-xl bg-[#181822] border border-[#2b2b38] space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>11. Salary Type &amp; Salary Amount (QAR)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Salary Type</label>
                    <select
                      value={formData.salaryType}
                      onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as any })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-white font-semibold"
                    >
                      <option value="Monthly">Monthly Fixed</option>
                      <option value="Hourly">Hourly Rate</option>
                      <option value="Daily">Daily Rate</option>
                      <option value="Contract">Contractual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Basic Salary (QAR)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-emerald-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Total Salary (QAR)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.totalSalary}
                      onChange={(e) => setFormData({ ...formData, totalSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 12. Commission Eligibility & Rates */}
              <div className="p-4 rounded-xl bg-[#181822] border border-[#2b2b38] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-purple-400" />
                    <span>12. Commission Eligibility &amp; Target Rates</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, commissionEligible: !formData.commissionEligible })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.commissionEligible
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#252530] text-slate-400'
                    }`}
                  >
                    {formData.commissionEligible ? 'COMMISSION ELIGIBLE' : 'NO COMMISSION'}
                  </button>
                </div>

                {formData.commissionEligible && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Service Commission (10% Target Rule)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.saleCommissionRate}
                        onChange={(e) => setFormData({ ...formData, saleCommissionRate: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-emerald-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Retail Product Commission (5% Standard)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.prodSaleCommission}
                        onChange={(e) => setFormData({ ...formData, prodSaleCommission: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2 bg-[#121216] border border-[#2e2e3c] rounded-lg text-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions with Delete Employee Button */}
              <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(editingEmployee)}
                  className="px-3.5 py-2 text-xs font-bold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Employee</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#22222a] hover:bg-[#2b2b35] rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Settings &amp; Permissions'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADD CUSTOM JOB ROLE OR CATEGORY MODAL ----------------- */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#2b2b36] rounded-2xl w-full max-w-md text-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#252530] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Add Custom Job Role or Service Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCustomType('role')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      newCustomType === 'role'
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-[#181822] border-[#2b2b36] text-slate-400'
                    }`}
                  >
                    Custom Job Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustomType('category')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      newCustomType === 'category'
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-[#181822] border-[#2b2b36] text-slate-400'
                    }`}
                  >
                    Custom Service Category
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {newCustomType === 'role' ? 'Job Role Title *' : 'Service Category Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newCustomType === 'role' ? 'e.g. Master Colorist, Social Media Specialist' : 'e.g. Bridal Suite, Teeth Whitening'}
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#181822] border border-[#2e2e3c] rounded-xl text-white font-semibold focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#22222a] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl"
                >
                  Save &amp; Enable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- CONFIRM DELETE MODAL ----------------- */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmTarget)}
        title="Delete Employee Record"
        message={
          deleteConfirmTarget
            ? `Are you sure you want to permanently delete employee "${deleteConfirmTarget.employeeName}" (${deleteConfirmTarget.employeeId})? This action cannot be undone.`
            : ''
        }
        confirmText="Yes, Delete Employee"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteEmployee}
        onCancel={() => setDeleteConfirmTarget(null)}
      />
    </div>
  );
};
