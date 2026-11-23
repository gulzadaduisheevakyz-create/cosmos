import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  UserPlus,
  Users,
  UserX,
  CreditCard,
  Clock,
  CalendarDays,
  FileText,
  Archive,
  FileSpreadsheet,
  Database,
  History,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  UserCog,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Building,
  Receipt,
  Layers,
  Shield,
  Mail,
  Globe,
  LogOut,
  KeyRound,
  Map,
} from 'lucide-react';
import { UserAccount } from '../types';

export type ViewType =
  | 'landing'
  | 'dashboard'
  | 'floorplan'
  | 'clients-list'
  | 'daily-sales'
  | 'business-expenses'
  | 'business-gross'
  | 'fixed-expenses'
  | 'petty-cash'
  | 'active-employees'
  | 'add-employee'
  | 'employee-settings'
  | 'unemployed'
  | 'monthly-payroll'
  | 'attendance'
  | 'leave-management'
  | 'certificate-generator'
  | 'certificate-archive'
  | 'import-export'
  | 'backup-restore'
  | 'audit-log'
  | 'user-management'
  | 'email-settings'
  | 'settings';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  activeCount: number;
  unemployedCount: number;
  unpaidExpensesCount?: number;
  customersCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  activeCount,
  unemployedCount,
  unpaidExpensesCount = 0,
  customersCount,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout,
  onChangePassword,
}) => {
  const isEmployeeSectionActive =
    activeView === 'active-employees' ||
    activeView === 'add-employee' ||
    activeView === 'employee-settings' ||
    activeView === 'unemployed';

  const isExpensesSectionActive =
    activeView === 'business-expenses' ||
    activeView === 'business-gross' ||
    activeView === 'fixed-expenses' ||
    activeView === 'petty-cash';

  const [isEmployeesOpen, setIsEmployeesOpen] = useState(true);
  const [isExpensesOpen, setIsExpensesOpen] = useState(true);

  // Keep open whenever an employee view is active
  useEffect(() => {
    if (isEmployeeSectionActive) {
      setIsEmployeesOpen(true);
    }
  }, [isEmployeeSectionActive]);

  useEffect(() => {
    if (isExpensesSectionActive) {
      setIsExpensesOpen(true);
    }
  }, [isExpensesSectionActive]);

  const businessExpenseSubItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'business-gross',
      label: 'Business Gross',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      badge: 'Income',
      badgeColor: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
    },
    {
      id: 'fixed-expenses',
      label: 'Monthly Fixed Expanse',
      icon: <Building className="w-3.5 h-3.5" />,
      badge: 'WPS/Sal',
      badgeColor: 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/40',
    },
    {
      id: 'petty-cash',
      label: 'Monthly Petty Daily Expanse',
      icon: <Receipt className="w-3.5 h-3.5" />,
      badge: 'VOICE',
      badgeColor: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
    },
  ];

  const employeeSubItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'active-employees',
      label: 'Active Employees',
      icon: <Users className="w-3.5 h-3.5" />,
      badge: activeCount,
    },
    {
      id: 'add-employee',
      label: 'Add Employee',
      icon: <UserPlus className="w-3.5 h-3.5" />,
    },
    {
      id: 'employee-settings',
      label: 'Employee Settings',
      icon: <UserCog className="w-3.5 h-3.5" />,
      badge: '1-Cat Rule',
      badgeColor: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
    },
    {
      id: 'unemployed',
      label: 'Unemployed / Former',
      icon: <UserX className="w-3.5 h-3.5" />,
      badge: unemployedCount > 0 ? unemployedCount : undefined,
      badgeColor: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
    },
  ];

  const mainNavItemsTop: { id: ViewType; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'floorplan', label: 'Salon Floorplan', icon: <Map className="w-4 h-4" /> },
    { id: 'clients-list', label: 'Clients List', icon: <Users className="w-4 h-4" />, badge: customersCount !== undefined ? customersCount : undefined },
    { id: 'daily-sales', label: 'Daily Sales Report', icon: <ReceiptText className="w-4 h-4" /> },
  ];

  const mainNavItemsBottom: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'monthly-payroll', label: 'Monthly Payroll', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance Schedule', icon: <Clock className="w-4 h-4" /> },
    { id: 'leave-management', label: 'Leave & Tickets', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'certificate-generator', label: 'Certificate Generator', icon: <FileText className="w-4 h-4" /> },
    { id: 'certificate-archive', label: 'Certificate Archive', icon: <Archive className="w-4 h-4" /> },
    { id: 'import-export', label: 'Excel Import / Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'backup-restore', label: 'Backup & Restore', icon: <Database className="w-4 h-4" /> },
    { id: 'audit-log', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
    {
      id: 'user-management',
      label: 'User Accounts & Roles',
      icon: <Shield className="w-4 h-4" />,
      badge: 'Admin',
      badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/60',
      adminOnly: true,
    },
    {
      id: 'email-settings',
      label: 'Email & SMTP Config',
      icon: <Mail className="w-4 h-4" />,
      badge: 'Alerts',
      badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/60',
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];


  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-950/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                COSMOS HR
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Salon Payroll & Staff Pro</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
          {/* Public Website Preview Link */}
          <button
            onClick={() => {
              onSelectView('landing');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-2 border ${
              activeView === 'landing'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                : 'bg-slate-800/80 text-rose-300 hover:text-white hover:bg-rose-950/50 border-rose-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Globe className="w-4 h-4 text-rose-400" />
              <span>Public Salon Website</span>
            </div>
            <span className="text-[10px] bg-rose-950/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/50">
              Live
            </span>
          </button>

          {/* Top section links */}
          {mainNavItemsTop.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Single Parent Link: named "(Business Expanses)" */}
          <div className="pt-1.5 pb-1">
            <div
              className={`rounded-xl border transition-all ${
                isExpensesSectionActive
                  ? 'bg-slate-800/80 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                  : 'border-transparent hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isExpensesOpen) {
                      setIsExpensesOpen(true);
                    }
                    onSelectView('business-expenses');
                    onCloseMobile();
                  }}
                  className="flex items-center gap-3 truncate flex-1 text-left cursor-pointer"
                >
                  <span
                    className={`p-1 rounded-md ${
                      isExpensesSectionActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-800 text-purple-400'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <div className="truncate">
                    <span
                      className={`text-xs font-bold block ${
                        isExpensesSectionActive ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      Business Expanses
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5 font-normal">
                      Gross, Fixed &amp; Petty Daily
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  {unpaidExpensesCount > 0 ? (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono font-black bg-rose-600 text-white animate-pulse shadow-xs"
                      title={`${unpaidExpensesCount} unpaid vouchers reminder`}
                    >
                      {unpaidExpensesCount} unpaid
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      Paid
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpensesOpen((prev) => !prev);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title={isExpensesOpen ? 'Collapse Business Expanses' : 'Expand Business Expanses'}
                  >
                    {isExpensesOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Sub-menu for Business Expanses */}
              {isExpensesOpen && (
                <div className="px-2 pb-2 pt-0.5 space-y-0.5 border-t border-slate-700/40 mt-1">
                  {/* Master View */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView('business-expenses');
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between pl-3 pr-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeView === 'business-expenses'
                        ? 'bg-purple-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={activeView === 'business-expenses' ? 'text-white' : 'text-slate-400'}>
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate text-[11px]">Financial Overview</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-800 text-purple-300">
                      Auto-Calc
                    </span>
                  </button>

                  {/* 3 Sub-Views */}
                  {businessExpenseSubItems.map((sub) => {
                    const isSubActive = activeView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onSelectView(sub.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between pl-3 pr-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-purple-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={isSubActive ? 'text-white' : 'text-slate-400'}>
                            {sub.icon}
                          </span>
                          <span className="truncate text-[11px]">{sub.label}</span>
                        </div>
                        {sub.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                              isSubActive
                                ? 'bg-white/20 text-white'
                                : sub.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Single Parent Link: "Employees" */}
          <div className="pt-1 pb-1">
            <div
              className={`rounded-xl border transition-all ${
                isEmployeeSectionActive
                  ? 'bg-slate-800/60 border-slate-700/80 shadow-xs'
                  : 'border-transparent hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isEmployeesOpen) {
                      setIsEmployeesOpen(true);
                    }
                    if (!isEmployeeSectionActive) {
                      onSelectView('active-employees');
                      onCloseMobile();
                    }
                  }}
                  className="flex items-center gap-3 truncate flex-1 text-left"
                >
                  <span
                    className={`p-1 rounded-md ${
                      isEmployeeSectionActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </span>
                  <div className="truncate">
                    <span
                      className={`text-xs font-bold block ${
                        isEmployeeSectionActive ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      Employees
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5 font-normal">
                      Directory, Roles &amp; Rules
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
                    {activeCount}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEmployeesOpen((prev) => !prev);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                    title={isEmployeesOpen ? 'Collapse Employees' : 'Expand Employees'}
                  >
                    {isEmployeesOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Sub-menu */}
              {isEmployeesOpen && (
                <div className="px-2 pb-2 pt-0.5 space-y-0.5 border-t border-slate-700/40 mt-1">
                  {employeeSubItems.map((sub) => {
                    const isSubActive = activeView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onSelectView(sub.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between pl-3 pr-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={
                              isSubActive
                                ? 'text-white'
                                : sub.id === 'employee-settings'
                                ? 'text-purple-400'
                                : 'text-slate-400'
                            }
                          >
                            {sub.icon}
                          </span>
                          <span className="truncate text-[11px]">{sub.label}</span>
                        </div>
                        {sub.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                              isSubActive
                                ? 'bg-white/20 text-white'
                                : sub.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom section links */}
          {mainNavItemsBottom
            .filter((item) => !item.adminOnly || currentUser?.role === 'Super Administrator')
            .map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* User Session & Footer */}
        {currentUser && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-purple-400 font-medium truncate">
                  {currentUser.role}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {onChangePassword && (
                  <button
                    onClick={onChangePassword}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Change Password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-2.5 border-t border-slate-800/60 text-[10px] text-slate-400 bg-slate-950/40 flex items-center justify-between">
          <span>Doha, Qatar</span>
          <span className="font-mono text-emerald-400">QAR (ريال)</span>
        </div>
      </aside>
    </>
  );
};

