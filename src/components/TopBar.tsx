import React from 'react';
import {
  Menu,
  Plus,
  RefreshCw,
  CheckCircle2,
  Globe,
  LogOut,
  KeyRound,
  Shield,
  User,
} from 'lucide-react';
import { ViewType } from './Sidebar';
import { UserAccount } from '../types';

interface TopBarProps {
  activeView: ViewType;
  currentUser: UserAccount | null;
  onOpenMobile: () => void;
  onNavigate: (view: ViewType) => void;
  onLoadSample: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  currentUser,
  onOpenMobile,
  onNavigate,
  onLoadSample,
  onLogout,
  onChangePassword,
}) => {
  const getBreadcrumbTitle = (view: ViewType): string => {
    switch (view) {
      case 'landing':
        return 'Cosmos Beauty Salon Public Landing Page';
      case 'dashboard':
        return 'Main Payroll & Staff Dashboard';
      case 'floorplan':
        return 'Salon Architectural Floorplan & Station Map';
      case 'clients-list':
        return 'Clients Directory & Profiles';
      case 'daily-sales':
        return 'Daily Sales & Customer Visit Reports';
      case 'business-expenses':
        return 'Business Expanses: Overview & Auto-Calculations';
      case 'business-gross':
        return 'Business Gross: Daily, Monthly & Yearly Incomes';
      case 'fixed-expenses':
        return 'Monthly Fixed Expanse: WPS Wages, Leases & Utilities';
      case 'petty-cash':
        return 'Monthly Petty Daily Expanse (VOICE Invoices)';
      case 'employee-settings':
        return 'Employee Role & Category Settings (1-Category Rule)';
      case 'add-employee':
        return 'Add New Salon Employee';
      case 'active-employees':
        return 'Active Employees Directory';
      case 'unemployed':
        return 'Unemployed & Former Staff Archive';
      case 'monthly-payroll':
        return 'Monthly Payroll Processing & Batch Approval';
      case 'attendance':
        return 'Attendance & Extra-Time Schedule';
      case 'leave-management':
        return 'Annual Leave & Flight Ticket Management';
      case 'certificate-generator':
        return 'Official Salary & Employment Certificate Generator';
      case 'certificate-archive':
        return 'Certificate Archive & Print Records';
      case 'import-export':
        return 'Excel Import & Export Center';
      case 'backup-restore':
        return 'Database Backup & JSON Restore';
      case 'audit-log':
        return 'System Security & Audit Activity Log';
      case 'user-management':
        return 'User Accounts & Security Access Control';
      case 'email-settings':
        return 'Email Notifications & SMTP Gateway Configuration';
      case 'settings':
        return 'Company & System Settings';
      default:
        return 'Cosmos HR & Payroll';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getBreadcrumbTitle(activeView)}</span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            COSMOS BEAUTY SALON · Doha, Qatar
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Public Website Preview Link */}
        <button
          onClick={() => onNavigate('landing')}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200/60 shrink-0"
          title="Switch to public customer website preview"
        >
          <Globe className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden md:inline">Public Website</span>
        </button>

        {/* Load Sample Data Button */}
        <button
          onClick={onLoadSample}
          className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors items-center gap-1.5 shrink-0"
          title="Reload initial salon employee records"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">Load Sample</span>
        </button>

        {/* Add Employee CTA */}
        {activeView !== 'add-employee' && (
          <button
            onClick={() => onNavigate('add-employee')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Employee</span>
          </button>
        )}

        {/* User Badge & Actions */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.username}
              </p>
              <p className="text-[10px] text-purple-700 font-semibold">{currentUser.role}</p>
            </div>

            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-200">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>

            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
