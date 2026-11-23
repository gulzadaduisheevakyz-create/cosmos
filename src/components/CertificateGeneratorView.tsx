import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Archive,
  Eye,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  FileWarning,
  Home,
  Banknote,
} from 'lucide-react';
import { Employee, Certificate, SystemSettings } from '../types';
import { db, formatCurrency, formatDate } from '../services/db';

interface CertificateGeneratorViewProps {
  employees: Employee[];
  settings: SystemSettings;
  onRefresh: () => void;
  onNavigateArchive: () => void;
  onTriggerPrint: (cert: Certificate) => void;
}

export const CertificateGeneratorView: React.FC<CertificateGeneratorViewProps> = ({
  employees,
  settings,
  onRefresh,
  onNavigateArchive,
  onTriggerPrint,
}) => {
  const activeEmployees = employees.filter((e) => e.status !== 'Unemployed');
  const allEmployeesList = activeEmployees.length > 0 ? activeEmployees : employees;

  const [certType, setCertType] = useState<'salary' | 'employment' | 'termination' | 'vacating' | 'entitlements'>('salary');
  const [selectedEmpId, setSelectedEmpId] = useState(allEmployeesList[0]?.employeeId || '');
  const [correspondingDate, setCorrespondingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [recipient, setRecipient] = useState('Qatar Islamic Bank');
  const [customRecipient, setCustomRecipient] = useState('');

  // Termination-specific state
  const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().slice(0, 10));
  const [customPositionName, setCustomPositionName] = useState('');
  const [updateEmployeeStatus, setUpdateEmployeeStatus] = useState(false);
  const [newEmployeeStatus, setNewEmployeeStatus] = useState<'Notice Period' | 'Unemployed'>('Notice Period');

  // Accommodation Vacating-specific state
  const [vacatingDate, setVacatingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [vacatingReason, setVacatingReason] = useState<'Resignation' | 'Termination' | 'Transfer to Another Company'>('Termination');
  const [updateAccommodationStatus, setUpdateAccommodationStatus] = useState(false);

  // Financial Entitlements-specific state
  const [employmentEndDate, setEmploymentEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [entitlementReason, setEntitlementReason] = useState<'Resignation' | 'Termination' | 'Transfer to Another Company'>('Termination');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Salary inclusions
  const [includeBasic, setIncludeBasic] = useState(true);
  const [includeFood, setIncludeFood] = useState(true);
  const [includeTransport, setIncludeTransport] = useState(true);
  const [includeCar, setIncludeCar] = useState(true);
  const [includeOther, setIncludeOther] = useState(true);

  // Signatory
  const [signatoryName, setSignatoryName] = useState(settings.signatoryName || 'ATYRGUL AIAZOVA');
  const [signatoryTitle, setSignatoryTitle] = useState(settings.signatoryTitle || 'Authorized Manager');

  // Selected Employee
  const currentEmp = employees.find((e) => e.employeeId === selectedEmpId) || allEmployeesList[0];

  // Auto-sync position name when employee changes
  useEffect(() => {
    if (currentEmp?.position) {
      setCustomPositionName(currentEmp.position);
    }
  }, [currentEmp?.employeeId, currentEmp?.position]);

  // Generate Reference Number
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const counter = settings.certCounter || 1;
    const prefix = certType === 'termination' ? 'Termination' : 'Certificates';
    setReference(`${prefix}/${year}/${month}/${String(counter).padStart(4, '0')}`);
  }, [settings.certCounter, certType]);

  const actualRecipient =
    certType === 'termination' || certType === 'vacating' || certType === 'entitlements'
      ? currentEmp?.employeeName || 'Employee'
      : recipient === 'custom'
      ? customRecipient || 'To Whom It May Concern'
      : recipient;

  // Build Salary Table Items
  const salaryItems: { label: string; amount: number }[] = [];
  let totalCertificateSalary = 0;

  if (currentEmp) {
    if (includeBasic && Number(currentEmp.basicSalary) > 0) {
      salaryItems.push({ label: 'Basic Salary', amount: Number(currentEmp.basicSalary) });
      totalCertificateSalary += Number(currentEmp.basicSalary);
    }
    if (includeFood && Number(currentEmp.foodAllowance) > 0) {
      salaryItems.push({ label: 'Food Allowance', amount: Number(currentEmp.foodAllowance) });
      totalCertificateSalary += Number(currentEmp.foodAllowance);
    }
    if (includeTransport && Number(currentEmp.transportAllowance) > 0) {
      salaryItems.push({ label: 'Transportation Allowance', amount: Number(currentEmp.transportAllowance) });
      totalCertificateSalary += Number(currentEmp.transportAllowance);
    }
    if (includeCar && Number(currentEmp.carOperationAllowance) > 0) {
      salaryItems.push({ label: 'Car Operation Allowance', amount: Number(currentEmp.carOperationAllowance) });
      totalCertificateSalary += Number(currentEmp.carOperationAllowance);
    }
    if (includeOther && Number(currentEmp.otherAllowance) > 0) {
      salaryItems.push({ label: 'Other Allowance', amount: Number(currentEmp.otherAllowance) });
      totalCertificateSalary += Number(currentEmp.otherAllowance);
    }
  }

  const effectivePositionName = customPositionName.trim() || currentEmp?.position || 'Staff';

  const handleSaveAndPrint = async () => {
    if (!currentEmp) {
      setToastMessage('Please select an employee before generating the document.');
      return;
    }

    const certTypeName =
      certType === 'salary'
        ? 'Salary Certificate'
        : certType === 'employment'
        ? 'Certificate of Employment'
        : certType === 'termination'
        ? 'Termination Letter'
        : certType === 'vacating'
        ? 'Accommodation Vacating Letter'
        : 'Acknowledgment of Receipt of All Financial Entitlements';

    const cert: Certificate = {
      certId: `CERT-${Date.now()}`,
      certType,
      certTypeName,
      employeeId: currentEmp.employeeId,
      employeeName: currentEmp.employeeName,
      employeePosition: effectivePositionName,
      employeeQid: currentEmp.residencyQid,
      employeeNationality: currentEmp.nationality,
      employeeJoiningDate: currentEmp.joiningDate,
      recipient: actualRecipient,
      correspondingDate,
      reference,
      signatoryName,
      signatoryTitle,
      salaryData: {
        basicSalary: currentEmp.basicSalary,
        foodAllowance: currentEmp.foodAllowance,
        transportAllowance: currentEmp.transportAllowance,
        carOperationAllowance: currentEmp.carOperationAllowance,
        otherAllowance: currentEmp.otherAllowance,
        totalSalary: currentEmp.totalSalary,
      },
      includeBasic,
      includeFood,
      includeTransport,
      includeCar,
      includeOther,
      lastWorkingDate: certType === 'termination' ? lastWorkingDate : undefined,
      customPositionName: certType === 'termination' ? effectivePositionName : undefined,
      vacatingDate: certType === 'vacating' ? vacatingDate : undefined,
      vacatingReason: certType === 'vacating' ? vacatingReason : undefined,
      employmentEndDate: certType === 'entitlements' ? employmentEndDate : undefined,
      entitlementReason: certType === 'entitlements' ? entitlementReason : undefined,
      createdAt: new Date().toISOString(),
    };

    // If updating employee profile on termination
    if (certType === 'termination' && updateEmployeeStatus) {
      await db.saveEmployee({
        ...currentEmp,
        status: newEmployeeStatus,
        lastWorkingDate: lastWorkingDate,
        reasonForLeaving: `Termination letter issued due to service quality customer complaints (${effectivePositionName} services)`,
      });
      await db.logAudit(
        'EMPLOYEE_TERMINATION_LOGGED',
        `Issued official Termination Letter for ${currentEmp.employeeName} (${currentEmp.employeeId}). Status set to ${newEmployeeStatus}, Last working date: ${lastWorkingDate}`
      );
    }

    // If updating accommodation status on vacating letter
    if (certType === 'vacating' && updateAccommodationStatus) {
      await db.saveEmployee({
        ...currentEmp,
        accommodation: 'Vacated (Self Accommodation)',
      });
      await db.logAudit(
        'EMPLOYEE_ACCOMMODATION_VACATING_LOGGED',
        `Issued Accommodation Vacating Confirmation for ${currentEmp.employeeName} (${currentEmp.employeeId}). Vacating date: ${vacatingDate}, Reason: ${vacatingReason}`
      );
    }

    await db.saveCertificate(cert);
    onRefresh();
    onTriggerPrint(cert);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Official Salary, Employment, Termination, Vacating &amp; Entitlements Generator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create verified Qatar salary certificates, employment confirmations, termination notices, accommodation vacating confirmations, and final financial entitlements receipts with official letterhead and dual signatures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateArchive}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-slate-600" />
            <span>View Archive</span>
          </button>
          <button
            onClick={handleSaveAndPrint}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer ${
              certType === 'termination'
                ? 'bg-rose-600 hover:bg-rose-700'
                : certType === 'vacating'
                ? 'bg-amber-600 hover:bg-amber-700'
                : certType === 'entitlements'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {certType === 'termination'
                ? 'Save & Print Termination Letter'
                : certType === 'vacating'
                ? 'Save & Print Vacating Letter'
                : certType === 'entitlements'
                ? 'Save & Print Entitlements Receipt'
                : 'Save & Print Certificate'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Form Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Document Configuration</span>
              <span className="font-mono text-[10px] text-blue-600">Ref: {reference}</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Document Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCertType('salary')}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    certType === 'salary'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertType('employment')}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    certType === 'employment'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Employment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertType('termination')}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    certType === 'termination'
                      ? 'bg-rose-50 border-rose-600 text-rose-700 font-bold shadow-2xs ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50/50 hover:text-rose-700'
                  }`}
                >
                  <FileWarning className="w-3.5 h-3.5 text-rose-600" />
                  <span>Termination</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertType('vacating')}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    certType === 'vacating'
                      ? 'bg-amber-50 border-amber-600 text-amber-800 font-bold shadow-2xs ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/50 hover:text-amber-800'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>Vacating</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertType('entitlements')}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-1 ${
                    certType === 'entitlements'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-2xs ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-800'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Entitlements</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee *
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium cursor-pointer"
              >
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.employeeName} ({e.employeeId}) - {e.position} {e.status === 'Unemployed' ? '[Former]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Letter Date *
                </label>
                <input
                  type="date"
                  value={correspondingDate}
                  onChange={(e) => setCorrespondingDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference No. (Auto)
                </label>
                <input
                  type="text"
                  value={reference}
                  readOnly
                  className="w-full text-xs p-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-600 font-bold"
                />
              </div>
            </div>

            {/* Recipient for Salary & Employment Certificates */}
            {certType !== 'termination' && certType !== 'vacating' && certType !== 'entitlements' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient (To:) *
                </label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  <option value="Qatar Islamic Bank">Qatar Islamic Bank (QIB)</option>
                  <option value="Commercial Bank of Qatar">Commercial Bank of Qatar (CBQ)</option>
                  <option value="Qatar National Bank">Qatar National Bank (QNB)</option>
                  <option value="Doha Bank">Doha Bank (DB)</option>
                  <option value="Masraf Al Rayan">Masraf Al Rayan (MAR)</option>
                  <option value="National Bank of Kuwait">National Bank of Kuwait (NBK)</option>
                  <option value="To Whom It May Concern">To Whom It May Concern</option>
                  <option value="custom">✏️ Other / Custom Recipient...</option>
                </select>

                {recipient === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom recipient organization or bank..."
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg mt-2"
                  />
                )}
              </div>
            )}

            {/* TERMINATION LETTER SPECIFIC CONTROLS */}
            {certType === 'termination' && (
              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs pb-1 border-b border-rose-200">
                  <FileWarning className="w-4 h-4 text-rose-600" />
                  <span>Termination Notice Details</span>
                </div>

                {/* Recipient summary banner */}
                <div className="text-xs text-rose-950 bg-white p-2.5 rounded-lg border border-rose-200/80 space-y-0.5">
                  <div><strong>To:</strong> {currentEmp?.employeeName || 'Staff Member'}</div>
                  <div><strong>From:</strong> {settings.companyName || 'Cosmos Beauty Salon'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">QID: {currentEmp?.residencyQid || 'N/A'} · ID: {currentEmp?.employeeId}</div>
                </div>

                {/* Last Working Day */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1 flex items-center justify-between">
                    <span>Last Working Day (Date) *</span>
                    <span className="text-[10px] text-rose-700 font-normal">Close of business date</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={lastWorkingDate}
                      onChange={(e) => setLastWorkingDate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg font-mono font-bold text-rose-950 focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setLastWorkingDate(d.toISOString().slice(0, 10));
                      }}
                      className="px-2.5 py-2 text-[10px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg whitespace-nowrap cursor-pointer"
                      title="Set to 30 days notice"
                    >
                      +30 Days
                    </button>
                  </div>
                </div>

                {/* Position Name for Complaints Paragraph */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">
                    Position Name (for customer complaints statement) *
                  </label>
                  <input
                    type="text"
                    value={customPositionName}
                    onChange={(e) => setCustomPositionName(e.target.value)}
                    placeholder={currentEmp?.position || 'e.g. Hairdresser, Nail Art, Spa'}
                    className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-rose-400"
                  />
                  <p className="text-[10.5px] text-rose-800 mt-1">
                    Populates: <em>&quot;repeated customer complaints regarding the quality of your <strong>({effectivePositionName})</strong> services&quot;</em>
                  </p>
                </div>

                {/* Employee Profile Status Update Option */}
                <div className="pt-2 border-t border-rose-200 space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-rose-950">
                    <input
                      type="checkbox"
                      checked={updateEmployeeStatus}
                      onChange={(e) => setUpdateEmployeeStatus(e.target.checked)}
                      className="rounded text-rose-600 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold">Also update Employee Profile record</span>
                      <p className="text-[10.5px] text-rose-700">
                        Automatically sets last working date and changes status in employee master registry upon saving.
                      </p>
                    </div>
                  </label>

                  {updateEmployeeStatus && (
                    <div className="pl-6 pt-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Set Employee Status to:
                      </label>
                      <select
                        value={newEmployeeStatus}
                        onChange={(e) => setNewEmployeeStatus(e.target.value as 'Notice Period' | 'Unemployed')}
                        className="text-xs p-1.5 bg-white border border-rose-300 rounded-md font-bold text-slate-900 w-full"
                      >
                        <option value="Notice Period">Notice Period (Serving until last day)</option>
                        <option value="Unemployed">Unemployed / Former Employee</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACCOMMODATION VACATING LETTER SPECIFIC CONTROLS */}
            {certType === 'vacating' && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs pb-1 border-b border-amber-200">
                  <Home className="w-4 h-4 text-amber-600" />
                  <span>Accommodation Vacating Details</span>
                </div>

                {/* Recipient summary banner */}
                <div className="text-xs text-amber-950 bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-0.5">
                  <div><strong>To:</strong> {currentEmp?.employeeName || 'Staff Member'}</div>
                  <div><strong>Position:</strong> {effectivePositionName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {currentEmp?.employeeId} · QID: {currentEmp?.residencyQid || 'N/A'}
                  </div>
                </div>

                {/* Employment Ended Due To */}
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1.5">
                    Employment Ended Due To *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Resignation', 'Termination', 'Transfer to Another Company'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVacatingReason(r)}
                        className={`py-2 px-1 text-[10.5px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          vacatingReason === r
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs font-bold'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {r === 'Transfer to Another Company' ? 'Transfer' : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accommodation Vacating Date */}
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center justify-between">
                    <span>Accommodation Vacating Date *</span>
                    <span className="text-[10px] text-amber-700 font-normal">Max 7 days from last working day</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={vacatingDate}
                      onChange={(e) => setVacatingDate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-950 focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setVacatingDate(d.toISOString().slice(0, 10));
                      }}
                      className="px-2.5 py-2 text-[10px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-lg whitespace-nowrap cursor-pointer"
                      title="Set to 7 days from today"
                    >
                      +7 Days
                    </button>
                  </div>
                </div>

                {/* Optional Update Accommodation in Employee Master Record */}
                <div className="pt-2 border-t border-amber-200">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-amber-950">
                    <input
                      type="checkbox"
                      checked={updateAccommodationStatus}
                      onChange={(e) => setUpdateAccommodationStatus(e.target.checked)}
                      className="rounded text-amber-600 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-bold">Update Accommodation in Employee Profile</span>
                      <p className="text-[10.5px] text-amber-800">
                        Mark accommodation field as &quot;Vacated (Self Accommodation)&quot; in employee records upon saving.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* FINANCIAL ENTITLEMENTS RECEIPT SPECIFIC CONTROLS */}
            {certType === 'entitlements' && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs pb-1 border-b border-emerald-200">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Financial Entitlements Receipt Details</span>
                </div>

                {/* Recipient summary banner */}
                <div className="text-xs text-emerald-950 bg-white p-2.5 rounded-lg border border-emerald-200/80 space-y-0.5">
                  <div><strong>To:</strong> {currentEmp?.employeeName || 'Staff Member'}</div>
                  <div><strong>Position:</strong> {effectivePositionName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {currentEmp?.employeeId} · QID: {currentEmp?.residencyQid || 'N/A'}
                  </div>
                </div>

                {/* Employment End Date */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center justify-between">
                    <span>Employment End Date *</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Date employment ended</span>
                  </label>
                  <input
                    type="date"
                    value={employmentEndDate}
                    onChange={(e) => setEmploymentEndDate(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* Employment Ended Due To */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                    Employment Ended Due To *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Resignation', 'Termination', 'Transfer to Another Company'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEntitlementReason(r)}
                        className={`py-2 px-1 text-[10.5px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          entitlementReason === r
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
                            : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                        }`}
                      >
                        {r === 'Transfer to Another Company' ? 'Transfer' : r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-emerald-900 bg-white p-2.5 rounded-lg border border-emerald-200/80 leading-relaxed">
                  <strong>Clearance Scope:</strong> Confirms full settlement of salary &amp; wages, overtime, commissions, leave balance, end-of-service gratuity, and releases Cosmos Beauty Salon from all further obligations.
                </div>
              </div>
            )}

            {/* Salary components toggles (only if salary cert) */}
            {certType === 'salary' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Included Salary Package Allowances
                </label>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBasic}
                      onChange={(e) => setIncludeBasic(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Basic Salary ({formatCurrency(currentEmp?.basicSalary)} QAR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFood}
                      onChange={(e) => setIncludeFood(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Food Allowance ({formatCurrency(currentEmp?.foodAllowance)} QAR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTransport}
                      onChange={(e) => setIncludeTransport(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Transportation Allowance ({formatCurrency(currentEmp?.transportAllowance)} QAR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCar}
                      onChange={(e) => setIncludeCar(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Car Operation Allowance ({formatCurrency(currentEmp?.carOperationAllowance)} QAR)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOther}
                      onChange={(e) => setIncludeOther(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Other Allowances ({formatCurrency(currentEmp?.otherAllowance)} QAR)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Authorized Signatory */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Manager Signatory Name
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Signatory Title
                </label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Official Letter Preview */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Official Document Letterhead Preview</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">A4 Portrait Format</span>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-xl border border-slate-200 shadow-md font-serif text-slate-900 leading-relaxed min-h-[640px] relative">
            {/* Salon Official Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
              <h2 className="text-xl font-bold tracking-wider text-slate-900 uppercase">
                {settings.companyName || 'COSMOS BEAUTY SALON'}
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                {settings.companyAddress} · Tel: {settings.companyPhone} · {settings.companyEmail}
              </p>
              <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase mt-3 font-sans">
                Human Resources Department
              </h1>
            </div>

            {/* Letter Meta */}
            <div className="flex justify-between items-center text-xs text-slate-800 mb-6 font-sans">
              <div>
                <strong>Date:</strong> {formatDate(correspondingDate)}
              </div>
              <div>
                <strong>Reference:</strong> <span className="font-mono">{reference}</span>
              </div>
            </div>

            {/* Subject */}
            <div className="text-center font-bold text-base uppercase underline tracking-wide my-6 font-sans">
              {certType === 'salary'
                ? 'SALARY CERTIFICATE'
                : certType === 'employment'
                ? 'CERTIFICATE OF EMPLOYMENT / WORK'
                : certType === 'termination'
                ? 'TERMINATION LETTER'
                : certType === 'vacating'
                ? 'ACCOMMODATION VACATING LETTER'
                : 'ACKNOWLEDGMENT OF RECEIPT OF ALL FINANCIAL ENTITLEMENTS'}
            </div>

            {/* Letter Body: Depending on Type */}
            {certType === 'entitlements' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                {/* HR Header */}
                <div className="flex justify-between items-start text-xs border-b-2 border-slate-900 pb-3 font-sans">
                  <div className="font-bold text-slate-900 text-sm">
                    Human resources (HR)
                  </div>
                  <div className="text-right space-y-0.5 text-slate-800 text-[11px]">
                    <div><strong>Corresponding to:</strong> {formatDate(correspondingDate)}</div>
                    <div><strong>Reference:</strong> <span className="font-mono">{reference}</span></div>
                  </div>
                </div>

                {/* Subject */}
                <div className="text-center pt-1 pb-1">
                  <div className="text-xs font-bold text-slate-900 text-sm uppercase underline tracking-wide">
                    Subject: Acknowledgment of Receipt of All Financial Entitlements
                  </div>
                </div>

                {/* Employee Info Bar */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-slate-900">
                  <div><strong>To:</strong> {currentEmp?.employeeName || '(Employee Name)'}</div>
                  <div><strong>Employee ID:</strong> {currentEmp?.employeeId || '(Employee ID)'}</div>
                  <div><strong>QID Number:</strong> {currentEmp?.residencyQid || '(Employee QID)'}</div>
                  <div><strong>Position:</strong> {effectivePositionName || 'Job'}</div>
                </div>

                {/* Statement of Employment End */}
                <p>
                  I, hereby acknowledge and confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} ended on <strong>{formatDate(employmentEndDate)}</strong> due
                </p>

                {/* Checkboxes */}
                <div className="pl-4 space-y-1.5 font-medium text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReason === 'Resignation' ? '☑' : '☐'}</span>
                    <span className={entitlementReason === 'Resignation' ? 'font-bold' : ''}>Resignation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReason === 'Termination' ? '☑' : '☐'}</span>
                    <span className={entitlementReason === 'Termination' ? 'font-bold' : ''}>Termination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReason === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                    <span className={entitlementReason === 'Transfer to Another Company' ? 'font-bold' : ''}>Transfer to Another Company</span>
                  </div>
                </div>

                {/* Entitlements List */}
                <div className="space-y-1.5">
                  <p>
                    I further acknowledge and confirm that I have received all my financial entitlements from {settings.companyName || 'Cosmos Beauty Salon'}, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-slate-800">
                    <li>Salary and wages up to my last working day.</li>
                    <li>Overtime payments (if applicable).</li>
                    <li>Commissions and incentives (if applicable).</li>
                    <li>Leave salary and leave balance payments (if applicable).</li>
                    <li>End-of-service benefits (if applicable).</li>
                    <li>Any other financial dues payable by the Company.</li>
                  </ul>
                </div>

                {/* Settlement Confirmation Paragraphs */}
                <p>
                  I confirm that all amounts due to me have been paid in full and that I have no further financial claims, demands, complaints, or disputes against {settings.companyName || 'Cosmos Beauty Salon'}, its owners, management, or representatives arising from my employment.
                </p>

                <p>
                  By signing this receipt, I acknowledge that all amounts due to me have been paid in full and that I release {settings.companyName || 'Cosmos Beauty Salon'} from any further financial obligations related to my employment.
                </p>

                <ul className="list-disc pl-6 text-slate-800">
                  <li>
                    That all my salaries and financial dues have been paid in full during my period of employment, and I have no further financial claims or rights.
                  </li>
                </ul>

                <div className="w-full border-b border-slate-300 my-4" />

                {/* Company & Stamp */}
                <div className="flex justify-between items-center text-xs font-sans">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{settings.companyName || 'Cosmos Beauty Salon'}</div>
                    <div className="text-slate-600 mt-1">
                      <strong>Date:</strong> {formatDate(correspondingDate)}
                    </div>
                  </div>
                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 text-center p-1">
                    <span>Company Stamp</span>
                  </div>
                </div>

                {/* Dual Signature Block */}
                <div className="pt-6 grid grid-cols-2 gap-8 items-end text-xs font-sans border-t border-slate-200 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Authorized Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({signatoryName || 'Authorized Manager'})</div>
                    <div className="text-[10px] text-slate-500">{signatoryTitle}</div>
                  </div>

                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Employee Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({currentEmp?.employeeName || 'Employee Name'})</div>
                    <div className="text-[10px] text-slate-500">Employee</div>
                  </div>
                </div>
              </div>
            ) : certType === 'vacating' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                {/* HR Header */}
                <div className="flex justify-between items-start text-xs border-b-2 border-slate-900 pb-3 font-sans">
                  <div className="font-bold text-slate-900 text-sm">
                    Human resources (HR)
                  </div>
                  <div className="text-right space-y-0.5 text-slate-800 text-[11px]">
                    <div><strong>Corresponding to:</strong> {formatDate(correspondingDate)}</div>
                    <div><strong>Reference:</strong> <span className="font-mono">{reference}</span></div>
                  </div>
                </div>

                {/* Title & Subject */}
                <div className="text-center pt-1 pb-1">
                  <h3 className="font-bold text-base uppercase tracking-wider text-slate-900 underline">
                    ACCOMMODATION VACATING LETTER
                  </h3>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    <strong>Subject:</strong> Accommodation Vacating Confirmation
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    <strong>Accommodation Vacating Date:</strong> {formatDate(vacatingDate) || '____ / ____ / ______'}
                  </div>
                </div>

                {/* Employee Info Bar */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-slate-900">
                  <div><strong>To:</strong> {currentEmp?.employeeName || '(Employee Name)'}</div>
                  <div><strong>Employee ID:</strong> {currentEmp?.employeeId || '(Employee ID)'}</div>
                  <div><strong>QID Number:</strong> {currentEmp?.residencyQid || '(Employee QID)'}</div>
                  <div><strong>Position:</strong> {effectivePositionName || 'Job'}</div>
                </div>

                {/* Confirmation of Employment End */}
                <p>
                  I, the undersigned employee, hereby confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} has ended due to:
                </p>

                {/* Checkboxes */}
                <div className="pl-4 space-y-1.5 font-medium text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReason === 'Resignation' ? '☑' : '☐'}</span>
                    <span className={vacatingReason === 'Resignation' ? 'font-bold' : ''}>Resignation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReason === 'Termination' ? '☑' : '☐'}</span>
                    <span className={vacatingReason === 'Termination' ? 'font-bold' : ''}>Termination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReason === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                    <span className={vacatingReason === 'Transfer to Another Company' ? 'font-bold' : ''}>Transfer to Another Company</span>
                  </div>
                </div>

                {/* 7 Days Policy Notice */}
                <p>
                  I acknowledge and agree that I am required to vacate and hand over the company-provided accommodation no later than seven (7) days from my last working day, unless otherwise approved in writing by the Company.
                </p>

                {/* 5 Specific Confirmations */}
                <div className="space-y-1.5">
                  <p className="font-bold">I confirm that:</p>
                  <ol className="list-decimal pl-6 space-y-1 text-slate-800">
                    <li>I have removed all my personal belongings from the accommodation.</li>
                    <li>I have returned all accommodation keys, access cards, and company property (if applicable).</li>
                    <li>I have left the accommodation in good condition, subject to normal wear and tear.</li>
                    <li>I understand that after vacating the accommodation, the Company shall have no responsibility for my housing, transportation, personal belongings, or living expenses.</li>
                    <li>I release {settings.companyName || 'Cosmos Beauty Salon'} from any liability relating to accommodation after the date of vacating.</li>
                  </ol>
                </div>

                <div className="w-full border-b border-slate-300 my-4" />

                {/* Company & Stamp */}
                <div className="flex justify-between items-center text-xs font-sans">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{settings.companyName || 'Cosmos Beauty Salon'}</div>
                    <div className="text-slate-600 mt-1">
                      <strong>Date:</strong> {formatDate(correspondingDate)}
                    </div>
                  </div>
                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 text-center p-1">
                    <span>Company Stamp</span>
                  </div>
                </div>

                {/* Dual Signature Block */}
                <div className="pt-6 grid grid-cols-2 gap-8 items-end text-xs font-sans border-t border-slate-200 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Authorized Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({signatoryName || 'Authorized Manager'})</div>
                    <div className="text-[10px] text-slate-500">{signatoryTitle}</div>
                  </div>

                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Employee Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({currentEmp?.employeeName || 'Employee Name'})</div>
                    <div className="text-[10px] text-slate-500">Employee</div>
                  </div>
                </div>
              </div>
            ) : certType === 'termination' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                <div className="space-y-1 font-semibold text-slate-900 text-xs border-b border-slate-200 pb-3">
                  <div><strong>Date:</strong> {formatDate(correspondingDate)}</div>
                  <div><strong>To:</strong> {currentEmp?.employeeName || '(employee name)'}</div>
                  <div><strong>From:</strong> {settings.companyName || 'Cosmos Beauty Salon'}</div>
                </div>

                <p className="font-bold text-sm text-slate-900 pt-1">
                  Dear {currentEmp?.employeeName || 'employee name'} ,
                </p>

                <p>
                  This letter is to formally inform you of the management’s decision to terminate your employment with {settings.companyName || 'Cosmos Beauty Salon'}. Your last working day will be <strong>{formatDate(lastWorkingDate)}</strong>, and your employment will end at the close of business on that date.
                </p>

                <p>
                  This decision has been made due to the repeated customer complaints regarding the quality of your <strong>{effectivePositionName}</strong> services. The number of complaints received has exceeded the acceptable limit set by management.
                </p>

                <p>
                  At {settings.companyName || 'Cosmos Beauty Salon'}, we place great importance on maintaining high standards of quality, professionalism, and customer satisfaction. Unfortunately, the repeated complaints regarding your <strong>{effectivePositionName}</strong> services have negatively affected the standard of service we are committed to providing.
                </p>

                <p>
                  After reviewing the situation, management has decided to terminate your employment in accordance with the applicable employment terms and procedures.
                </p>

                <p>
                  You are required to continue fulfilling your duties professionally until <strong>{formatDate(lastWorkingDate)}</strong>, complete the necessary handover, and return any property or equipment belonging to {settings.companyName || 'Cosmos Beauty Salon'}.
                </p>

                <p>
                  Your final dues will be calculated and settled in accordance with the applicable employment terms and Qatar Labour Law.
                </p>

                <p className="font-medium pt-1">
                  We wish you success in your future endeavors.
                </p>

                <div className="font-bold text-slate-900 pt-2">
                  {settings.companyName || 'Cosmos Beauty Salon'}
                </div>

                {/* Dual Signature Block for Termination Letter */}
                <div className="pt-6 grid grid-cols-2 gap-8 items-end text-xs font-sans border-t border-slate-200 mt-6">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      Management Authority
                    </div>
                    <div className="text-slate-900 font-medium">
                      <strong>Manager Signature:</strong>
                    </div>
                    <div className="w-full border-b border-slate-900 my-4" />
                    <div className="font-bold text-slate-900">{signatoryName}</div>
                    <div className="text-[11px] text-slate-600">{signatoryTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{settings.companyName || 'Cosmos Beauty Salon'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      Employee Acknowledgement
                    </div>
                    <div className="text-slate-900 font-medium">
                      <strong>Employee Name:</strong> {currentEmp?.employeeName || '(Employee name)'}
                    </div>
                    <div className="text-slate-900 font-medium mt-1">
                      <strong>Employee Signature:</strong>
                    </div>
                    <div className="w-full border-b border-slate-900 my-4" />
                    <div className="text-[10px] text-slate-500 italic">Signature &amp; Date Received</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Addressed To */}
                <div className="font-bold text-sm mb-4 font-sans text-slate-900">
                  To: {actualRecipient}
                </div>

                {/* Letter Body for Salary and Employment */}
                <div className="text-xs text-justify space-y-3.5 leading-relaxed text-slate-800">
                  {certType === 'salary' ? (
                    <>
                      <p>
                        This is to certify that Ms./Mr.{' '}
                        <strong>{currentEmp?.employeeName || 'Staff Member'}</strong>, holder of QID
                        No. <strong>{currentEmp?.residencyQid || 'N/A'}</strong>, Nationality:{' '}
                        <strong>{currentEmp?.nationality || 'N/A'}</strong>, Employee ID:{' '}
                        <strong>{currentEmp?.employeeId || 'N/A'}</strong>, has been employed with{' '}
                        <strong>{settings.companyName || 'COSMOS BEAUTY SALON'}</strong> since{' '}
                        <strong>{formatDate(currentEmp?.joiningDate) || 'N/A'}</strong> in the capacity
                        of <strong>{currentEmp?.position || 'N/A'}</strong>.
                      </p>
                      <p>
                        We further certify that her/his monthly remuneration and breakdown of basic
                        allowances is structured as follows:
                      </p>

                      {/* Salary Table */}
                      <table className="w-full text-xs border border-slate-900 border-collapse my-4 font-sans">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-900 text-slate-900">
                            <th className="p-2 text-left font-bold border-r border-slate-900">
                              Remuneration Component
                            </th>
                            <th className="p-2 text-right font-bold w-40">Monthly Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {salaryItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2 border-r border-slate-900">{item.label}</td>
                              <td className="p-2 text-right font-mono tabular-nums">
                                QAR {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-slate-50 border-t-2 border-slate-900 text-slate-900">
                            <td className="p-2 border-r border-slate-900">Total Monthly Salary</td>
                            <td className="p-2 text-right font-mono tabular-nums text-slate-900">
                              QAR {formatCurrency(totalCertificateSalary)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p>
                        This certificate is issued upon the request of the employee for submission to
                        the bank without any financial liability or commitment on our part.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This is to certify that Ms./Mr.{' '}
                        <strong>{currentEmp?.employeeName || 'Staff Member'}</strong>, holder of QID
                        No. <strong>{currentEmp?.residencyQid || 'N/A'}</strong>, Nationality:{' '}
                        <strong>{currentEmp?.nationality || 'N/A'}</strong>, Employee ID:{' '}
                        <strong>{currentEmp?.employeeId || 'N/A'}</strong>, has been working with{' '}
                        <strong>{settings.companyName || 'COSMOS BEAUTY SALON'}</strong> since{' '}
                        <strong>{formatDate(currentEmp?.joiningDate) || 'N/A'}</strong> in the position of{' '}
                        <strong>{currentEmp?.position || 'N/A'}</strong>.
                      </p>
                      <p>
                        During her/his tenure with us, she/he has maintained high professional standards
                        and dedication towards salon operations and client care.
                      </p>
                      <p>
                        This certificate is issued upon her/his request for whatever lawful and official
                        purpose it may serve.
                      </p>
                    </>
                  )}

                  <p className="pt-2 text-[11px] text-slate-600 font-sans italic">
                    Valid for {settings.certValidity || 1} month(s) from the date of issuance.
                  </p>
                </div>

                {/* Official Stamp & Signatory Block */}
                <div className="mt-14 pt-6 flex justify-between items-end text-xs font-sans">
                  <div className="text-center w-40">
                    <div className="w-24 h-24 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                      Official Seal &amp; Stamp
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                      {settings.companyName || 'COSMOS BEAUTY SALON'}
                    </div>
                  </div>

                  <div className="text-center w-52">
                    <div className="border-t border-slate-900 pt-2 font-bold text-slate-900 text-xs">
                      {signatoryName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">{signatoryTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Authorized HR Signatory</div>
                  </div>
                </div>
              </>
            )}

            {/* Footer Barcode / Ref */}
            <div className="mt-8 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-right flex justify-between items-center">
              <span>Authentic Document Verification</span>
              <span>Ref: {reference} · System Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
