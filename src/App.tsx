import React, { useState, useEffect, useCallback } from 'react';
import {
  Employee,
  PayrollRecord,
  AttendanceRecord,
  LeaveRecord,
  FlightTicketRecord,
  ExtraTimeTransaction,
  Certificate,
  SystemSettings,
  BankInfo,
  AuditLogItem,
  DailySaleRecord,
  Customer,
  ServiceCatalogueItem,
  CustomerBooking,
  PettyCashExpense,
  FixedExpense,
  BusinessGrossEntry,
  UserAccount,
  PublicSalonInfo,
  EmailSettings,
} from './types';
import {
  db,
  DEFAULT_SETTINGS,
  DEFAULT_QATAR_BANKS,
  DEFAULT_PUBLIC_SALON_INFO,
  DEFAULT_EMAIL_SETTINGS,
} from './services/db';
import { exportEmployeesToExcel } from './services/excel';

// Components
import { Sidebar, ViewType } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { FloorplanView } from './components/FloorplanView';
import { ClientsListView } from './components/ClientsListView';
import { DailySalesReportView } from './components/DailySalesReportView';
import { BusinessExpensesView } from './components/BusinessExpensesView';
import { AddEmployeeView } from './components/AddEmployeeView';
import { ActiveEmployeesView } from './components/ActiveEmployeesView';
import { UnemployedView } from './components/UnemployedView';
import { MonthlyPayrollView } from './components/MonthlyPayrollView';
import { AttendanceView } from './components/AttendanceView';
import { LeaveManagementView } from './components/LeaveManagementView';
import { CertificateGeneratorView } from './components/CertificateGeneratorView';
import { CertificateArchiveView } from './components/CertificateArchiveView';
import { ExcelImportExportView } from './components/ExcelImportExportView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { PrintCertificateModal } from './components/PrintCertificateModal';
import { EmployeeSettingsView } from './components/EmployeeSettingsView';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { UserManagementView } from './components/UserManagementView';
import { EmailConfigView } from './components/EmailConfigView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  // Navigation & User Session State
  const [activeView, setActiveView] = useState<ViewType>('landing');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [appConfirm, setAppConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    action: () => void | Promise<void>;
  } | null>(null);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [tickets, setTickets] = useState<FlightTicketRecord[]>([]);
  const [extraTime, setExtraTime] = useState<ExtraTimeTransaction[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [banks, setBanks] = useState<BankInfo[]>(DEFAULT_QATAR_BANKS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [dailySales, setDailySales] = useState<DailySaleRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalogue, setCatalogue] = useState<ServiceCatalogueItem[]>([]);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashExpense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [businessGross, setBusinessGross] = useState<BusinessGrossEntry[]>([]);
  const [publicSalonInfo, setPublicSalonInfo] = useState<PublicSalonInfo>(DEFAULT_PUBLIC_SALON_INFO);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);

  // Modals
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [activePrintCert, setActivePrintCert] = useState<Certificate | null>(null);

  // Refresh all state from DB
  const refreshAllData = useCallback(() => {
    setEmployees(db.getEmployees());
    setPayrolls(db.getPayrolls());
    setAttendance(db.getAttendance());
    setLeaves(db.getLeaves());
    setTickets(db.getTickets());
    setExtraTime(db.getExtraTimeTransactions());
    setCertificates(db.getCertificates());
    setSettings(db.getSettings());
    setBanks(db.getBanks());
    setAuditLogs(db.getAuditLogs());
    setDailySales(db.getDailySales());
    setCustomers(db.getCustomers());
    setCatalogue(db.getServiceCatalogue());
    setBookings(db.getBookings());
    setPettyCash(db.getPettyCashExpenses());
    setFixedExpenses(db.getFixedExpenses());
    setBusinessGross(db.getBusinessGrossEntries());
    setPublicSalonInfo(db.getPublicSalonInfo());
    setEmailSettings(db.getEmailSettings());
    setCurrentUser(db.getCurrentUser());
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const initApp = async () => {
      await db.init();
      refreshAllData();
      const sessionUser = db.getCurrentUser();
      if (sessionUser) {
        setCurrentUser(sessionUser);
      }
    };
    initApp();
  }, [refreshAllData]);

  // Counts for sidebar badges
  const activeCount = employees.filter((e) => e.status !== 'Unemployed').length;
  const unemployedCount = employees.filter((e) => e.status === 'Unemployed').length;
  const unpaidExpensesCount =
    pettyCash.filter((p) => p.status === 'Unpaid').length +
    fixedExpenses.filter((f) => f.status === 'Unpaid').length;

  // Handlers
  const handleLoadSample = () => {
    setAppConfirm({
      isOpen: true,
      title: 'Load Official Sample Data',
      message: 'Load and reset official Cosmos Beauty Salon sample employees, services, and payroll records?',
      confirmText: 'Load Sample Data',
      isDestructive: false,
      action: async () => {
        await db.loadSampleData();
        refreshAllData();
      },
    });
  };

  const handleExportAllExcel = () => {
    try {
      exportEmployeesToExcel(employees);
    } catch (err: unknown) {
      console.error((err as Error).message);
    }
  };

  const handleToggleStatus = (empId: string) => {
    setSelectedEmpId(empId);
  };

  const handleReactivate = (empId: string) => {
    const emp = employees.find((e) => e.employeeId === empId);
    if (!emp) return;

    setAppConfirm({
      isOpen: true,
      title: 'Reactivate Employee',
      message: `Reactivate ${emp.employeeName} (${emp.employeeId}) back to Active Employees registry?`,
      confirmText: 'Reactivate',
      isDestructive: false,
      action: async () => {
        await db.saveEmployee({
          ...emp,
          status: 'Active',
          rejoiningDate: new Date().toISOString().slice(0, 10),
          lastWorkingDate: undefined,
          reasonForLeaving: undefined,
        });
        refreshAllData();
      },
    });
  };

  const handleTriggerPrint = (cert: Certificate) => {
    setActivePrintCert(cert);
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setIsStaffLoginOpen(false);
    setActiveView('landing');
  };

  // Permission Checks (RBAC)
  const canViewFinancials = db.checkPermission(currentUser?.role, 'view_financials');
  const canManagePayroll = db.checkPermission(currentUser?.role, 'manage_payroll');
  const canManageUsers = db.checkPermission(currentUser?.role, 'manage_users');

  // ------------------------------------------------------------------
  // 1. Staff Login Screen (When unauthenticated visitor clicks Staff Portal)
  // ------------------------------------------------------------------
  if (!currentUser && isStaffLoginOpen) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsStaffLoginOpen(false);
          setActiveView('dashboard');
        }}
        onReturnToLanding={() => {
          setIsStaffLoginOpen(false);
          setActiveView('landing');
        }}
      />
    );
  }

  // ------------------------------------------------------------------
  // 2. Public Landing Page (Default for visitors or preview for staff)
  // ------------------------------------------------------------------
  if (activeView === 'landing' || (!currentUser && !isStaffLoginOpen)) {
    return (
      <div>
        {/* If staff is logged in and previewing public landing page, show return bar */}
        {currentUser && (
          <div className="bg-slate-950 text-slate-300 px-4 py-2 border-b border-slate-800 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Previewing Public Website as</span>
              <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.role})
            </span>
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Staff Dashboard</span>
            </button>
          </div>
        )}

        <LandingPage
          salonInfo={publicSalonInfo}
          services={catalogue}
          currentUser={currentUser}
          onOpenStaffPortal={() => {
            if (currentUser) {
              setActiveView('dashboard');
            } else {
              setIsStaffLoginOpen(true);
            }
          }}
          onOpenBookingModal={() => {
            if (currentUser) {
              setActiveView('daily-sales');
            } else {
              // Scroll to contact form for customer appointment inquiries
              const contactEl = document.getElementById('contact');
              if (contactEl) {
                contactEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          onRefreshInfo={refreshAllData}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 3. Authenticated Staff Management Portal
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeCount={activeCount}
        unemployedCount={unemployedCount}
        unpaidExpensesCount={unpaidExpensesCount}
        customersCount={customers.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
        <TopBar
          activeView={activeView}
          currentUser={currentUser}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onNavigate={(v) => setActiveView(v)}
          onLoadSample={handleLoadSample}
          onLogout={handleLogout}
          onChangePassword={() => setIsChangePasswordOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              employees={employees}
              payrolls={payrolls}
              fixedExpenses={fixedExpenses}
              settings={settings}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
              onNavigateAdd={() => setActiveView('add-employee')}
              onNavigateDailySales={() => setActiveView('daily-sales')}
              onNavigateBusinessExpenses={() => setActiveView('business-expenses')}
              onNavigateMonthlyPayroll={() => setActiveView('monthly-payroll')}
              onLoadSample={handleLoadSample}
              onExportExcel={handleExportAllExcel}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'floorplan' && (
            <FloorplanView
              employees={employees}
              settings={settings}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'clients-list' && (
            <ClientsListView
              customers={customers}
              bookings={bookings}
              sales={dailySales}
              onRefresh={refreshAllData}
              onOpenBookingModal={() => setActiveView('daily-sales')}
            />
          )}

          {activeView === 'daily-sales' && (
            <DailySalesReportView
              sales={dailySales}
              employees={employees}
              customers={customers}
              catalogue={catalogue}
              settings={settings}
              onRefresh={refreshAllData}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
            />
          )}

          {(activeView === 'business-expenses' ||
            activeView === 'business-gross' ||
            activeView === 'fixed-expenses' ||
            activeView === 'petty-cash') &&
            (canViewFinancials ? (
              <BusinessExpensesView
                payrolls={payrolls}
                pettyCash={pettyCash}
                fixedExpenses={fixedExpenses}
                businessGross={businessGross}
                employees={employees}
                dailySales={dailySales}
                settings={settings}
                initialTab={
                  activeView === 'business-gross'
                    ? 'gross'
                    : activeView === 'fixed-expenses'
                    ? 'fixed'
                    : activeView === 'petty-cash'
                    ? 'petty'
                    : 'overview'
                }
                onRefresh={refreshAllData}
                onOpenEmployee={(id) => setSelectedEmpId(id)}
              />
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-500">
                  Your current staff role ({currentUser?.role}) is restricted from viewing confidential business expenses and Profit & Loss calculations.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            ))}

          {activeView === 'add-employee' && (
            <AddEmployeeView
              banks={banks}
              onBack={() => setActiveView('dashboard')}
              onSaved={() => {
                refreshAllData();
                setActiveView('dashboard');
              }}
            />
          )}

          {activeView === 'active-employees' && (
            <ActiveEmployeesView
              employees={employees}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
              onNavigateAdd={() => setActiveView('add-employee')}
              onToggleStatus={handleToggleStatus}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'employee-settings' && (
            <EmployeeSettingsView
              employees={employees}
              catalogue={catalogue}
              onRefresh={refreshAllData}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
              onNavigateAddEmployee={() => setActiveView('add-employee')}
            />
          )}

          {activeView === 'unemployed' && (
            <UnemployedView
              employees={employees}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
              onReactivate={handleReactivate}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'monthly-payroll' &&
            (canManagePayroll ? (
              <MonthlyPayrollView
                employees={employees}
                payrolls={payrolls}
                settings={settings}
                onRefresh={refreshAllData}
                onOpenEmployee={(id) => setSelectedEmpId(id)}
              />
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-500">
                  Your current staff role ({currentUser?.role}) does not have permission to view or process confidential Qatar WPS monthly payroll records.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            ))}

          {activeView === 'attendance' && (
            <AttendanceView
              employees={employees}
              attendance={attendance}
              settings={settings}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'leave-management' && (
            <LeaveManagementView
              employees={employees}
              leaves={leaves}
              tickets={tickets}
              onRefresh={refreshAllData}
              onOpenEmployee={(id) => setSelectedEmpId(id)}
            />
          )}

          {activeView === 'certificate-generator' && (
            <CertificateGeneratorView
              employees={employees}
              settings={settings}
              onRefresh={refreshAllData}
              onNavigateArchive={() => setActiveView('certificate-archive')}
              onTriggerPrint={handleTriggerPrint}
            />
          )}

          {activeView === 'certificate-archive' && (
            <CertificateArchiveView
              certificates={certificates}
              onRefresh={refreshAllData}
              onReprint={handleTriggerPrint}
            />
          )}

          {activeView === 'import-export' && (
            <ExcelImportExportView
              employees={employees}
              fixedExpenses={fixedExpenses}
              pettyCash={pettyCash}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'backup-restore' && (
            <BackupRestoreView onRefresh={refreshAllData} />
          )}

          {activeView === 'audit-log' && <AuditLogView logs={auditLogs} />}

          {activeView === 'user-management' &&
            (canManageUsers ? (
              <UserManagementView
                currentUser={currentUser}
                employees={employees}
                auditLogs={auditLogs}
                onRefresh={refreshAllData}
              />
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-500">
                  User Account Administration is restricted exclusively to the Super Administrator.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            ))}

          {activeView === 'email-settings' && (
            <EmailConfigView onRefresh={refreshAllData} />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              banks={banks}
              onRefresh={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmpId && (
        <EmployeeDetailModal
          employeeId={selectedEmpId}
          banks={banks}
          settings={settings}
          payrolls={payrolls}
          attendance={attendance}
          leaves={leaves}
          tickets={tickets}
          extraTime={extraTime}
          onClose={() => setSelectedEmpId(null)}
          onRefresh={refreshAllData}
        />
      )}

      {/* Print Certificate Modal */}
      {activePrintCert && (
        <PrintCertificateModal
          certificate={activePrintCert}
          settings={settings}
          onClose={() => setActivePrintCert(null)}
        />
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={() => {
            refreshAllData();
          }}
        />
      )}

      {/* App Confirmation Modal */}
      {appConfirm && (
        <ConfirmModal
          isOpen={appConfirm.isOpen}
          title={appConfirm.title}
          message={appConfirm.message}
          confirmText={appConfirm.confirmText || 'Confirm'}
          cancelText="Cancel"
          isDestructive={appConfirm.isDestructive}
          onConfirm={appConfirm.action}
          onCancel={() => setAppConfirm(null)}
        />
      )}
    </div>
  );
}
