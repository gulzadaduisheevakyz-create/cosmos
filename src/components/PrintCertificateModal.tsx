import React, { useState } from 'react';
import { Printer, X, Download, Loader2 } from 'lucide-react';
import { Certificate, SystemSettings } from '../types';
import { formatCurrency, formatDate } from '../services/db';
import { exportElementToPdf } from '../services/pdfService';

interface PrintCertificateModalProps {
  certificate: Certificate | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  certificate,
  settings,
  onClose,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  if (!certificate) return null;

  const c = certificate;

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const cleanName = (c.certTypeName || 'Official_Letter').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeRef = (c.reference || 'REF').replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportElementToPdf('printable-certificate', {
        filename: `${cleanName}_${safeRef}.pdf`,
        orientation: 'p',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /**
   * Standardized print / save PDF handler using window.printDocument.
   * Ensures the print window only captures the specific container with the ID 'printable-certificate'
   * by adding temporary 'print-active' class and correctly triggering the browser's native print dialog without preambles.
   */
  const handlePrintCertificate = () => {
    const cleanName = (c.certTypeName || 'Official_Letter').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeRef = (c.reference || 'REF').replace(/[^a-zA-Z0-9_-]/g, '_');
    window.printDocument('printable-certificate', `${cleanName}_${safeRef}`);
  };
  const s = c.salaryData;
  const gender = c.employeeName.toUpperCase().includes('MR.') ? 'Mr.' : 'Ms.';
  const displayName = c.employeeName.replace(/^(MR\.|MS\.|MRS\.)\s*/i, '');
  const positionName = c.customPositionName || c.employeePosition || 'Staff';
  const effectiveLastWorkingDate = formatDate(c.lastWorkingDate || c.correspondingDate);

  const salaryRows: { label: string; amount: number }[] = [];
  let totalCalc = 0;

  if (c.includeBasic && Number(s.basicSalary) > 0) {
    salaryRows.push({ label: 'Basic Salary', amount: Number(s.basicSalary) });
    totalCalc += Number(s.basicSalary);
  }
  if (c.includeFood && Number(s.foodAllowance) > 0) {
    salaryRows.push({ label: 'Food Allowance', amount: Number(s.foodAllowance) });
    totalCalc += Number(s.foodAllowance);
  }
  if (c.includeTransport && Number(s.transportAllowance) > 0) {
    salaryRows.push({ label: 'Transportation Allowance', amount: Number(s.transportAllowance) });
    totalCalc += Number(s.transportAllowance);
  }
  if (c.includeCar && Number(s.carOperationAllowance) > 0) {
    salaryRows.push({ label: 'Car Operation Allowance', amount: Number(s.carOperationAllowance) });
    totalCalc += Number(s.carOperationAllowance);
  }
  if (c.includeOther && Number(s.otherAllowance) > 0) {
    salaryRows.push({ label: 'Other Allowances', amount: Number(s.otherAllowance) });
    totalCalc += Number(s.otherAllowance);
  }

  const documentTitle =
    c.certType === 'salary'
      ? 'SALARY CERTIFICATE'
      : c.certType === 'employment'
      ? 'CERTIFICATE OF EMPLOYMENT / WORK'
      : c.certType === 'termination'
      ? 'TERMINATION LETTER'
      : c.certType === 'vacating'
      ? 'ACCOMMODATION VACATING LETTER'
      : 'ACKNOWLEDGMENT OF RECEIPT OF ALL FINANCIAL ENTITLEMENTS';

  const vacatingDateFormatted = c.vacatingDate ? formatDate(c.vacatingDate) : '____ / ____ / ______';
  const vacatingReasonSelected = c.vacatingReason || 'Termination';
  const employmentEndDateFormatted = formatDate(c.employmentEndDate || c.correspondingDate);
  const entitlementReasonSelected = c.entitlementReason || 'Termination';

  return (
    <>
      {/* On-screen Preview Dialog */}
      <div className="fixed inset-0 bg-slate-950/80 z-60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Official Print Preview · Ref: {c.reference}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                c.certType === 'termination'
                  ? 'bg-rose-500/20 text-rose-300'
                  : c.certType === 'vacating'
                  ? 'bg-amber-500/20 text-amber-300'
                  : c.certType === 'entitlements'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {c.certTypeName}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavePdf}
                disabled={isDownloadingPdf}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Direct PDF file download"
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
                onClick={handlePrintCertificate}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Print Official Letter (A4)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Letter (A4)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Letter Body Preview */}
          <div id="certificate-print-area" className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar bg-white font-serif text-slate-950 leading-relaxed text-xs">
            {/* Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-950 mb-6 font-sans">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-950">
                {settings.companyName || 'COSMOS BEAUTY SALON'}
              </h1>
              <p className="text-[11px] text-slate-600 mt-1">
                {settings.companyAddress} · Tel: {settings.companyPhone} · {settings.companyEmail}
              </p>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-950 mt-3">
                Human Resources Department
              </h2>
            </div>

            {/* Meta */}
            <div className="flex justify-between items-center text-xs mb-6 font-sans">
              <div>
                <strong>Date:</strong> {formatDate(c.correspondingDate)}
              </div>
              <div>
                <strong>Reference:</strong> <span className="font-mono">{c.reference}</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center font-bold text-sm uppercase underline tracking-wider my-6 font-sans">
              {documentTitle}
            </div>

            {/* Content for Entitlements vs Vacating vs Termination vs Salary vs Employment */}
            {c.certType === 'entitlements' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                {/* HR Header */}
                <div className="flex justify-between items-start text-xs border-b-2 border-slate-900 pb-3 font-sans">
                  <div className="font-bold text-slate-900 text-sm">
                    Human resources (HR)
                  </div>
                  <div className="text-right space-y-0.5 text-slate-800 text-[11px]">
                    <div><strong>Corresponding to:</strong> {formatDate(c.correspondingDate)}</div>
                    <div><strong>Reference:</strong> <span className="font-mono">{c.reference}</span></div>
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
                  <div><strong>To:</strong> {c.employeeName}</div>
                  <div><strong>Employee ID:</strong> {c.employeeId}</div>
                  <div><strong>QID Number:</strong> {c.employeeQid || 'N/A'}</div>
                  <div><strong>Position:</strong> {positionName}</div>
                </div>

                {/* Statement of Employment End */}
                <p>
                  I, hereby acknowledge and confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} ended on <strong>{employmentEndDateFormatted}</strong> due
                </p>

                {/* Checkboxes */}
                <div className="pl-4 space-y-1.5 font-medium text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReasonSelected === 'Resignation' ? '☑' : '☐'}</span>
                    <span className={entitlementReasonSelected === 'Resignation' ? 'font-bold' : ''}>Resignation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReasonSelected === 'Termination' ? '☑' : '☐'}</span>
                    <span className={entitlementReasonSelected === 'Termination' ? 'font-bold' : ''}>Termination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{entitlementReasonSelected === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                    <span className={entitlementReasonSelected === 'Transfer to Another Company' ? 'font-bold' : ''}>Transfer to Another Company</span>
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
                      <strong>Date:</strong> {formatDate(c.correspondingDate)}
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
                    <div className="font-bold text-slate-900">({c.signatoryName || 'Authorized Manager'})</div>
                    <div className="text-[10px] text-slate-500">{c.signatoryTitle}</div>
                  </div>

                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Employee Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({c.employeeName})</div>
                    <div className="text-[10px] text-slate-500">Employee</div>
                  </div>
                </div>
              </div>
            ) : c.certType === 'vacating' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                {/* HR Header */}
                <div className="flex justify-between items-start text-xs border-b-2 border-slate-900 pb-3 font-sans">
                  <div className="font-bold text-slate-900 text-sm">
                    Human resources (HR)
                  </div>
                  <div className="text-right space-y-0.5 text-slate-800 text-[11px]">
                    <div><strong>Corresponding to:</strong> {formatDate(c.correspondingDate)}</div>
                    <div><strong>Reference:</strong> <span className="font-mono">{c.reference}</span></div>
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
                    <strong>Accommodation Vacating Date:</strong> {vacatingDateFormatted}
                  </div>
                </div>

                {/* Employee Info Bar */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-slate-900">
                  <div><strong>To:</strong> {c.employeeName}</div>
                  <div><strong>Employee ID:</strong> {c.employeeId}</div>
                  <div><strong>QID Number:</strong> {c.employeeQid || 'N/A'}</div>
                  <div><strong>Position:</strong> {positionName}</div>
                </div>

                {/* Statement */}
                <p>
                  I, the undersigned employee, hereby confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} has ended due to:
                </p>

                {/* Checkboxes */}
                <div className="pl-4 space-y-1.5 font-medium text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReasonSelected === 'Resignation' ? '☑' : '☐'}</span>
                    <span className={vacatingReasonSelected === 'Resignation' ? 'font-bold' : ''}>Resignation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReasonSelected === 'Termination' ? '☑' : '☐'}</span>
                    <span className={vacatingReasonSelected === 'Termination' ? 'font-bold' : ''}>Termination</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm inline-block w-4">{vacatingReasonSelected === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                    <span className={vacatingReasonSelected === 'Transfer to Another Company' ? 'font-bold' : ''}>Transfer to Another Company</span>
                  </div>
                </div>

                {/* 7 Days Rule Notice */}
                <p>
                  I acknowledge and agree that I am required to vacate and hand over the company-provided accommodation no later than seven (7) days from my last working day, unless otherwise approved in writing by the Company.
                </p>

                {/* 5 Points */}
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
                      <strong>Date:</strong> {formatDate(c.correspondingDate)}
                    </div>
                  </div>
                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 text-center p-1">
                    <span>Company Stamp</span>
                  </div>
                </div>

                {/* Dual Signature */}
                <div className="pt-6 grid grid-cols-2 gap-8 items-end text-xs font-sans border-t border-slate-200 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Authorized Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({c.signatoryName || 'Authorized Manager'})</div>
                    <div className="text-[10px] text-slate-500">{c.signatoryTitle}</div>
                  </div>

                  <div className="text-center">
                    <div className="font-bold text-slate-900 mb-8">Employee Signature</div>
                    <div className="w-full border-b border-slate-900 mb-1" />
                    <div className="font-bold text-slate-900">({c.employeeName})</div>
                    <div className="text-[10px] text-slate-500">Employee</div>
                  </div>
                </div>
              </div>
            ) : c.certType === 'termination' ? (
              <div className="text-xs text-justify space-y-4 leading-relaxed text-slate-900 font-sans">
                <div className="space-y-1 font-semibold text-slate-900 text-xs border-b border-slate-200 pb-3">
                  <div><strong>Date:</strong> {formatDate(c.correspondingDate)}</div>
                  <div><strong>To:</strong> {c.employeeName}</div>
                  <div><strong>From:</strong> {settings.companyName || 'Cosmos Beauty Salon'}</div>
                </div>

                <p className="font-bold text-sm text-slate-900 pt-1">
                  Dear {c.employeeName} ,
                </p>

                <p>
                  This letter is to formally inform you of the management’s decision to terminate your employment with {settings.companyName || 'Cosmos Beauty Salon'}. Your last working day will be <strong>{effectiveLastWorkingDate}</strong>, and your employment will end at the close of business on that date.
                </p>

                <p>
                  This decision has been made due to the repeated customer complaints regarding the quality of your <strong>{positionName}</strong> services. The number of complaints received has exceeded the acceptable limit set by management.
                </p>

                <p>
                  At {settings.companyName || 'Cosmos Beauty Salon'}, we place great importance on maintaining high standards of quality, professionalism, and customer satisfaction. Unfortunately, the repeated complaints regarding your <strong>{positionName}</strong> services have negatively affected the standard of service we are committed to providing.
                </p>

                <p>
                  After reviewing the situation, management has decided to terminate your employment in accordance with the applicable employment terms and procedures.
                </p>

                <p>
                  You are required to continue fulfilling your duties professionally until <strong>{effectiveLastWorkingDate}</strong>, complete the necessary handover, and return any property or equipment belonging to {settings.companyName || 'Cosmos Beauty Salon'}.
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
                <div className="mt-10 pt-6 grid grid-cols-2 gap-8 items-end text-xs font-sans border-t border-slate-200">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      Management Authority
                    </div>
                    <div className="text-slate-900 font-medium">
                      <strong>Manager Signature:</strong>
                    </div>
                    <div className="w-full border-b border-slate-900 my-4" />
                    <div className="font-bold text-slate-900">{c.signatoryName}</div>
                    <div className="text-[11px] text-slate-600">{c.signatoryTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{settings.companyName || 'Cosmos Beauty Salon'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      Employee Acknowledgement
                    </div>
                    <div className="text-slate-900 font-medium">
                      <strong>Employee Name:</strong> {c.employeeName}
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
                <div className="font-bold text-xs mb-4 font-sans text-slate-950">
                  To: {c.recipient}
                </div>

                {/* Prose */}
                <div className="text-xs text-justify space-y-3.5 leading-relaxed text-slate-900">
                  {c.certType === 'salary' ? (
                    <>
                      <p>
                        This is to certify that {gender} <strong>{displayName}</strong>, Nationality:{' '}
                        <strong>{c.employeeNationality || 'N/A'}</strong>, holder of QID No.{' '}
                        <strong>{c.employeeQid || 'N/A'}</strong>, Employee ID:{' '}
                        <strong>{c.employeeId || 'N/A'}</strong>, has been employed with{' '}
                        <strong>{settings.companyName || 'COSMOS BEAUTY SALON'}</strong> since{' '}
                        <strong>{formatDate(c.employeeJoiningDate) || 'N/A'}</strong> in the position of{' '}
                        <strong>{c.employeePosition || 'N/A'}</strong>.
                      </p>
                      <p>
                        We further certify that {gender.toLowerCase()}&apos;s monthly remuneration package is
                        structured as follows:
                      </p>

                      {/* Table */}
                      <table className="w-full text-xs border border-slate-950 border-collapse my-4 font-sans">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-950 text-slate-950">
                            <th className="p-2 text-left font-bold border-r border-slate-950">
                              Description
                            </th>
                            <th className="p-2 text-right font-bold w-44">Monthly Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {salaryRows.map((row, idx) => (
                            <tr key={idx}>
                              <td className="p-2 border-r border-slate-950">{row.label}</td>
                              <td className="p-2 text-right font-mono tabular-nums">
                                QAR {formatCurrency(row.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-slate-50 border-t-2 border-slate-950">
                            <td className="p-2 border-r border-slate-950">Total Monthly Salary</td>
                            <td className="p-2 text-right font-mono tabular-nums">
                              QAR {formatCurrency(totalCalc)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p>
                        This certificate is issued upon {gender.toLowerCase()}&apos;s request for submission to
                        the bank without any financial obligation or commitment on our part.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This is to certify that {gender} <strong>{displayName}</strong>, holder of QID
                        No. <strong>{c.employeeQid || 'N/A'}</strong>, Nationality:{' '}
                        <strong>{c.employeeNationality || 'N/A'}</strong>, Employee ID:{' '}
                        <strong>{c.employeeId || 'N/A'}</strong>, has been employed with{' '}
                        <strong>{settings.companyName || 'COSMOS BEAUTY SALON'}</strong> since{' '}
                        <strong>{formatDate(c.employeeJoiningDate) || 'N/A'}</strong> and is actively
                        serving in the position of <strong>{c.employeePosition || 'N/A'}</strong>.
                      </p>
                      <p>
                        During {gender.toLowerCase()}&apos;s employment, {gender.toLowerCase()} has conducted
                        her/his duties with integrity and professionalism.
                      </p>
                      <p>
                        This certificate has been issued upon {gender.toLowerCase()}&apos;s request for
                        whatever legal and official purpose it may serve.
                      </p>
                    </>
                  )}

                  <p className="pt-2 text-[11px] text-slate-600 font-sans italic">
                    This certificate is valid for {settings.certValidity || 1} month(s) from the date of
                    issuance.
                  </p>
                </div>

                {/* Stamp & Signatory */}
                <div className="mt-14 pt-6 flex justify-between items-end text-xs font-sans">
                  <div className="text-center w-40">
                    <div className="w-24 h-24 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                      Company Stamp
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                      {settings.companyName || 'COSMOS BEAUTY SALON'}
                    </div>
                  </div>

                  <div className="text-center w-52">
                    <div className="border-t border-slate-950 pt-2 font-bold text-slate-950 text-xs">
                      {c.signatoryName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">{c.signatoryTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Authorized HR Signatory</div>
                  </div>
                </div>
              </>
            )}

            {/* Footer Barcode / Ref */}
            <div className="mt-8 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-right flex justify-between items-center font-sans">
              <span>Authentic Verification Seal</span>
              <span>Ref: {c.reference} · Issued {new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Printable Container for @media print */}
      <div id="printable-certificate" className="hidden print:block font-serif text-slate-950 bg-white">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '22px' }}>
          <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {settings.companyName || 'COSMOS BEAUTY SALON'}
          </div>
          <div style={{ fontSize: '10pt', color: '#333', marginTop: '3px' }}>
            {settings.companyAddress} | Tel: {settings.companyPhone} | {settings.companyEmail}
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '10px', textTransform: 'uppercase' }}>
            Human Resources (HR)
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
          <div><strong>Date:</strong> {formatDate(c.correspondingDate)}</div>
          <div><strong>Reference:</strong> {c.reference}</div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', margin: '22px 0', textTransform: 'uppercase' }}>
          {documentTitle}
        </div>

        {c.certType === 'entitlements' ? (
          <div style={{ textAlign: 'justify', lineHeight: '1.65', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Human resources (HR)</div>
              <div style={{ textAlign: 'right', fontSize: '10.5pt' }}>
                <div><strong>Corresponding to:</strong> {formatDate(c.correspondingDate)}</div>
                <div><strong>Reference:</strong> {c.reference}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12.5pt', textDecoration: 'underline', textTransform: 'uppercase' }}>
                Subject: Acknowledgment of Receipt of All Financial Entitlements
              </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '8px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: '10.5pt', background: '#fcfcfc' }}>
              <div><strong>To:</strong> {c.employeeName}</div>
              <div><strong>Employee ID:</strong> {c.employeeId}</div>
              <div><strong>QID Number:</strong> {c.employeeQid || 'N/A'}</div>
              <div><strong>Position:</strong> {positionName}</div>
            </div>

            <p style={{ marginBottom: '10px' }}>
              I, hereby acknowledge and confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} ended on <strong>{employmentEndDateFormatted}</strong> due
            </p>

            <div style={{ paddingLeft: '20px', marginBottom: '14px', fontSize: '11pt' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{entitlementReasonSelected === 'Resignation' ? '☑' : '☐'}</span>
                <strong>Resignation</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{entitlementReasonSelected === 'Termination' ? '☑' : '☐'}</span>
                <strong>Termination</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{entitlementReasonSelected === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                <strong>Transfer to Another Company</strong>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <p style={{ marginBottom: '6px' }}>
                I further acknowledge and confirm that I have received all my financial entitlements from {settings.companyName || 'Cosmos Beauty Salon'}, including but not limited to:
              </p>
              <ul style={{ paddingLeft: '24px', margin: 0, lineHeight: '1.6' }}>
                <li style={{ marginBottom: '3px' }}>Salary and wages up to my last working day.</li>
                <li style={{ marginBottom: '3px' }}>Overtime payments (if applicable).</li>
                <li style={{ marginBottom: '3px' }}>Commissions and incentives (if applicable).</li>
                <li style={{ marginBottom: '3px' }}>Leave salary and leave balance payments (if applicable).</li>
                <li style={{ marginBottom: '3px' }}>End-of-service benefits (if applicable).</li>
                <li style={{ marginBottom: '3px' }}>Any other financial dues payable by the Company.</li>
              </ul>
            </div>

            <p style={{ marginBottom: '12px' }}>
              I confirm that all amounts due to me have been paid in full and that I have no further financial claims, demands, complaints, or disputes against {settings.companyName || 'Cosmos Beauty Salon'}, its owners, management, or representatives arising from my employment.
            </p>

            <p style={{ marginBottom: '12px' }}>
              By signing this receipt, I acknowledge that all amounts due to me have been paid in full and that I release {settings.companyName || 'Cosmos Beauty Salon'} from any further financial obligations related to my employment.
            </p>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0' }}>
              <li>
                That all my salaries and financial dues have been paid in full during my period of employment, and I have no further financial claims or rights.
              </li>
            </ul>

            <div style={{ borderBottom: '1px solid #000', margin: '18px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{settings.companyName || 'Cosmos Beauty Salon'}</div>
                <div style={{ fontSize: '10pt', color: '#333', marginTop: '2px' }}>
                  <strong>Date:</strong> {formatDate(c.correspondingDate)}
                </div>
              </div>
              <div style={{ width: '90px', height: '90px', border: '2px dashed #666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', color: '#555' }}>
                Company Stamp
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', textAlign: 'center' }}>
              <div style={{ width: '45%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '35px' }}>Authorized Signature</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
                  ({c.signatoryName || 'Authorized Manager'})
                </div>
                <div style={{ fontSize: '9.5pt', color: '#444' }}>{c.signatoryTitle}</div>
              </div>

              <div style={{ width: '45%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '35px' }}>Employee Signature</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
                  ({c.employeeName})
                </div>
                <div style={{ fontSize: '9.5pt', color: '#444' }}>Employee</div>
              </div>
            </div>
          </div>
        ) : c.certType === 'vacating' ? (
          <div style={{ textAlign: 'justify', lineHeight: '1.65', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Human resources (HR)</div>
              <div style={{ textAlign: 'right', fontSize: '10.5pt' }}>
                <div><strong>Corresponding to:</strong> {formatDate(c.correspondingDate)}</div>
                <div><strong>Reference:</strong> {c.reference}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', textTransform: 'uppercase' }}>
                ACCOMMODATION VACATING LETTER
              </div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '4px' }}>
                Subject: Accommodation Vacating Confirmation
              </div>
              <div style={{ fontSize: '10.5pt', fontWeight: 'bold', marginTop: '4px' }}>
                Accommodation Vacating Date: {vacatingDateFormatted}
              </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '8px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: '10.5pt', background: '#fcfcfc' }}>
              <div><strong>To:</strong> {c.employeeName}</div>
              <div><strong>Employee ID:</strong> {c.employeeId}</div>
              <div><strong>QID Number:</strong> {c.employeeQid || 'N/A'}</div>
              <div><strong>Position:</strong> {positionName}</div>
            </div>

            <p style={{ marginBottom: '10px' }}>
              I, the undersigned employee, hereby confirm that my employment with {settings.companyName || 'Cosmos Beauty Salon'} has ended due to:
            </p>

            <div style={{ paddingLeft: '20px', marginBottom: '14px', fontSize: '11pt' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{vacatingReasonSelected === 'Resignation' ? '☑' : '☐'}</span>
                <strong>Resignation</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{vacatingReasonSelected === 'Termination' ? '☑' : '☐'}</span>
                <strong>Termination</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12pt', marginRight: '8px' }}>{vacatingReasonSelected === 'Transfer to Another Company' ? '☑' : '☐'}</span>
                <strong>Transfer to Another Company</strong>
              </div>
            </div>

            <p style={{ marginBottom: '12px' }}>
              I acknowledge and agree that I am required to vacate and hand over the company-provided accommodation no later than seven (7) days from my last working day, unless otherwise approved in writing by the Company.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>I confirm that:</p>
              <ol style={{ paddingLeft: '24px', margin: 0, lineHeight: '1.6' }}>
                <li style={{ marginBottom: '4px' }}>I have removed all my personal belongings from the accommodation.</li>
                <li style={{ marginBottom: '4px' }}>I have returned all accommodation keys, access cards, and company property (if applicable).</li>
                <li style={{ marginBottom: '4px' }}>I have left the accommodation in good condition, subject to normal wear and tear.</li>
                <li style={{ marginBottom: '4px' }}>I understand that after vacating the accommodation, the Company shall have no responsibility for my housing, transportation, personal belongings, or living expenses.</li>
                <li style={{ marginBottom: '4px' }}>I release {settings.companyName || 'Cosmos Beauty Salon'} from any liability relating to accommodation after the date of vacating.</li>
              </ol>
            </div>

            <div style={{ borderBottom: '1px solid #000', margin: '18px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{settings.companyName || 'Cosmos Beauty Salon'}</div>
                <div style={{ fontSize: '10pt', color: '#333', marginTop: '2px' }}>
                  <strong>Date:</strong> {formatDate(c.correspondingDate)}
                </div>
              </div>
              <div style={{ width: '90px', height: '90px', border: '2px dashed #666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', color: '#555' }}>
                Company Stamp
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', textAlign: 'center' }}>
              <div style={{ width: '45%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '35px' }}>Authorized Signature</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
                  ({c.signatoryName || 'Authorized Manager'})
                </div>
                <div style={{ fontSize: '9.5pt', color: '#444' }}>{c.signatoryTitle}</div>
              </div>

              <div style={{ width: '45%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '35px' }}>Employee Signature</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
                  ({c.employeeName})
                </div>
                <div style={{ fontSize: '9.5pt', color: '#444' }}>Employee</div>
              </div>
            </div>
          </div>
        ) : c.certType === 'termination' ? (
          <div style={{ textAlign: 'justify', lineHeight: '1.7', fontSize: '11.5pt' }}>
            <div style={{ marginBottom: '16px', fontSize: '11pt', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <div><strong>Date:</strong> {formatDate(c.correspondingDate)}</div>
              <div><strong>To:</strong> {c.employeeName}</div>
              <div><strong>From:</strong> {settings.companyName || 'Cosmos Beauty Salon'}</div>
            </div>

            <p style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '14px' }}>
              Dear {c.employeeName} ,
            </p>

            <p style={{ marginBottom: '14px' }}>
              This letter is to formally inform you of the management’s decision to terminate your employment with {settings.companyName || 'Cosmos Beauty Salon'}. Your last working day will be <strong>{effectiveLastWorkingDate}</strong>, and your employment will end at the close of business on that date.
            </p>

            <p style={{ marginBottom: '14px' }}>
              This decision has been made due to the repeated customer complaints regarding the quality of your <strong>{positionName}</strong> services. The number of complaints received has exceeded the acceptable limit set by management.
            </p>

            <p style={{ marginBottom: '14px' }}>
              At {settings.companyName || 'Cosmos Beauty Salon'}, we place great importance on maintaining high standards of quality, professionalism, and customer satisfaction. Unfortunately, the repeated complaints regarding your <strong>{positionName}</strong> services have negatively affected the standard of service we are committed to providing.
            </p>

            <p style={{ marginBottom: '14px' }}>
              After reviewing the situation, management has decided to terminate your employment in accordance with the applicable employment terms and procedures.
            </p>

            <p style={{ marginBottom: '14px' }}>
              You are required to continue fulfilling your duties professionally until <strong>{effectiveLastWorkingDate}</strong>, complete the necessary handover, and return any property or equipment belonging to {settings.companyName || 'Cosmos Beauty Salon'}.
            </p>

            <p style={{ marginBottom: '14px' }}>
              Your final dues will be calculated and settled in accordance with the applicable employment terms and Qatar Labour Law.
            </p>

            <p style={{ marginBottom: '14px' }}>
              We wish you success in your future endeavors.
            </p>

            <div style={{ fontWeight: 'bold', marginBottom: '30px' }}>
              {settings.companyName || 'Cosmos Beauty Salon'}
            </div>

            {/* Termination Signature Block */}
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '45%' }}>
                <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px' }}>
                  Management
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>
                  Manager Signature:
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold', fontSize: '11pt' }}>
                  {c.signatoryName}
                </div>
                <div style={{ fontSize: '10pt', color: '#444' }}>{c.signatoryTitle}</div>
                <div style={{ fontSize: '9pt', color: '#666' }}>{settings.companyName || 'Cosmos Beauty Salon'}</div>
              </div>

              <div style={{ width: '45%' }}>
                <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px' }}>
                  Employee
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                  Employee Name: {c.employeeName}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>
                  Employee Signature:
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '9pt', color: '#666' }}>
                  Signature &amp; Date Received
                </div>
              </div>
            </div>

            {/* Official Stamp */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <div style={{ width: '100px', height: '100px', border: '2px dashed #888', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '9pt', color: '#777' }}>
                Company Stamp
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'justify', lineHeight: '1.7', fontSize: '11.5pt' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '12pt' }}>
              To: {c.recipient}
            </div>

            {c.certType === 'salary' ? (
              <>
                <p style={{ marginBottom: '12px' }}>
                  This is to certify that {gender} <strong>{displayName}</strong>, Nationality: <strong>{c.employeeNationality || 'N/A'}</strong>, holder of QID No. <strong>{c.employeeQid || 'N/A'}</strong>, Employee ID: <strong>{c.employeeId || 'N/A'}</strong>, has been employed with {settings.companyName || 'COSMOS BEAUTY SALON'} since <strong>{formatDate(c.employeeJoiningDate) || 'N/A'}</strong> in the position of <strong>{c.employeePosition || 'N/A'}</strong>.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  We further certify that {gender.toLowerCase()}&apos;s current monthly salary package is structured as follows:
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0', fontSize: '11pt' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'left' }}>Description</th>
                      <th style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRows.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '8px 12px' }}>{r.label}</td>
                        <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                          QAR {formatCurrency(r.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f9fafb' }}>
                      <td style={{ border: '1px solid #000', padding: '8px 12px' }}>Total Monthly Salary</td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                        QAR {formatCurrency(totalCalc)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ marginBottom: '12px' }}>
                  This certificate has been issued upon {gender.toLowerCase()}&apos;s request for submission to the bank and for whatever legal purpose it may serve.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '12px' }}>
                  This is to certify that {gender} <strong>{displayName}</strong>, holder of QID No. <strong>{c.employeeQid || 'N/A'}</strong>, Nationality: <strong>{c.employeeNationality || 'N/A'}</strong>, Employee ID: <strong>{c.employeeId || 'N/A'}</strong>, has been employed with {settings.companyName || 'COSMOS BEAUTY SALON'} since <strong>{formatDate(c.employeeJoiningDate) || 'N/A'}</strong> and is currently working with us in the position of <strong>{c.employeePosition || 'N/A'}</strong>.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  During {gender.toLowerCase()}&apos;s employment, {gender.toLowerCase()} has performed her/his duties professionally and remains in good standing with the company.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  This certificate has been issued upon {gender.toLowerCase()}&apos;s request for whatever legal purpose it may serve.
                </p>
              </>
            )}

            <p style={{ marginTop: '16px', fontSize: '10.5pt', color: '#444' }}>
              This certificate shall be valid for {settings.certValidity || 1} month(s) from the date of issuance.
            </p>
            <p style={{ marginTop: '8px' }}>Accept our sincere regards.</p>

            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ width: '110px', height: '110px', border: '2px dashed #888', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '10pt', color: '#777' }}>
                  Company Stamp
                </div>
                <div style={{ fontSize: '10pt', marginTop: '6px', fontWeight: 'bold' }}>
                  {settings.companyName || 'COSMOS BEAUTY SALON'}
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontWeight: 'bold', fontSize: '11pt' }}>
                  {c.signatoryName}
                </div>
                <div style={{ fontSize: '10pt', color: '#333' }}>{c.signatoryTitle}</div>
                <div style={{ fontSize: '9pt', color: '#666', marginTop: '2px' }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#666', textAlign: 'right', marginTop: '40px' }}>
          Ref: {c.reference} | Generated: {new Date(c.createdAt).toLocaleString()}
        </div>
      </div>
    </>
  );
};
