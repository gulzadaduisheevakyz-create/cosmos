import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Receipt,
  Layers,
  Building,
} from 'lucide-react';
import { Employee, PettyCashExpense, FixedExpense } from '../types';
import { db } from '../services/db';
import {
  exportEmployeesToExcel,
  parseEmployeesFromExcel,
  exportPettyExpensesToExcel,
  downloadPettyExpenseTemplate,
  parsePettyExpensesFromExcel,
  exportFixedExpensesToExcel,
  downloadFixedExpenseTemplate,
  parseFixedExpensesFromExcel,
} from '../services/excel';

interface ExcelImportExportViewProps {
  employees: Employee[];
  pettyCash?: PettyCashExpense[];
  fixedExpenses?: FixedExpense[];
  onRefresh: () => void;
}

export const ExcelImportExportView: React.FC<ExcelImportExportViewProps> = ({
  employees,
  pettyCash = [],
  fixedExpenses = [],
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'fixed' | 'petty'>('employees');

  // Employee import status
  const [empImportStatus, setEmpImportStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  // Fixed expenses import status
  const [fixedImportStatus, setFixedImportStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  // Petty import status
  const [pettyImportStatus, setPettyImportStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExportEmployees = () => {
    try {
      exportEmployeesToExcel(employees);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleExportFixed = () => {
    try {
      const expenses = fixedExpenses.length > 0 ? fixedExpenses : db.getFixedExpenses();
      exportFixedExpensesToExcel(expenses);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleExportPetty = () => {
    try {
      const expenses = pettyCash.length > 0 ? pettyCash : db.getPettyCashExpenses();
      exportPettyExpensesToExcel(expenses);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleFixedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFixedImportStatus({
      type: 'loading',
      message: `Reading and parsing Monthly Fixed Expenses from "${file.name}"...`,
    });

    try {
      const result = await parseFixedExpensesFromExcel(file);
      if (result.expenses.length === 0) {
        throw new Error('No valid Fixed Expense rows with positive amount were found in the file.');
      }

      const saveResult = await db.saveBulkFixedExpenses(result.expenses);

      setFixedImportStatus({
        type: 'success',
        message: `Successfully imported Monthly Fixed Expenses! Added ${saveResult.importedCount} new record(s) and updated ${saveResult.updatedCount} existing record(s). Total Value: QAR ${result.expenses
          .reduce((sum, p) => sum + p.amount, 0)
          .toLocaleString()}.`,
      });
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setFixedImportStatus({
        type: 'error',
        message: `Failed to import Fixed Expenses: ${(err as Error).message || 'Invalid sheet format'}`,
      });
    }

    e.target.value = '';
  };

  const handleEmployeeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEmpImportStatus({ type: 'loading', message: `Reading and parsing "${file.name}"...` });

    try {
      const result = await parseEmployeesFromExcel(file);
      let imported = 0;
      let updated = 0;

      for (const emp of result.employees) {
        const existing = db.getEmployee(emp.employeeId);
        if (existing) {
          await db.saveEmployee({ ...existing, ...emp });
          updated++;
        } else {
          await db.saveEmployee(emp);
          imported++;
        }
      }

      await db.logAudit(
        'EXCEL_IMPORTED',
        `Imported ${imported} new, updated ${updated} employees from Excel file ${file.name}`
      );

      setEmpImportStatus({
        type: 'success',
        message: `Successfully processed Excel file! Added ${imported} new employee(s) and updated ${updated} existing record(s).`,
      });
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setEmpImportStatus({
        type: 'error',
        message: `Failed to import Excel file: ${(err as Error).message || 'Invalid sheet format'}`,
      });
    }

    e.target.value = '';
  };

  const handlePettyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPettyImportStatus({
      type: 'loading',
      message: `Reading and parsing VOICE Invoices from "${file.name}"...`,
    });

    try {
      const result = await parsePettyExpensesFromExcel(file);
      if (result.expenses.length === 0) {
        throw new Error('No valid VOICE voucher rows with positive amount were found in the file.');
      }

      const saveResult = await db.saveBulkPettyExpenses(result.expenses);

      setPettyImportStatus({
        type: 'success',
        message: `Successfully imported VOICE Invoices! Added ${saveResult.importedCount} new voucher(s) and updated ${saveResult.updatedCount} existing record(s). Total: QAR ${result.expenses
          .reduce((sum, p) => sum + p.amount, 0)
          .toLocaleString()}.`,
      });
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setPettyImportStatus({
        type: 'error',
        message: `Failed to import VOICE Invoices: ${(err as Error).message || 'Invalid sheet format'}`,
      });
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Excel Import &amp; Export Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize employee master data, Monthly Fixed Expenses (WPS Wages, Leases, Utilities), and Monthly Petty Daily Expanse (VOICE Invoices) with Microsoft Excel.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employees Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fixed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fixed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Fixed Expenses</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('petty')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'petty'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>VOICE Invoices</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: EMPLOYEES IMPORT / EXPORT                           */}
      {/* ============================================================== */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Export Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Master Employee Records to Excel</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download all employee profiles formatted with the exact salon columns: No, Employer ID, Company, Duty, Accommodation, Contract No, Employee ID, Joining Date, End Contract (+2 years), Passport Expiry, QID Expiry, Qatar Payer Bank, IBAN, Basic Salary, Allowances, Sales Commissions, and Status.
            </p>

            <div className="pt-2">
              <button
                onClick={handleExportEmployees}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download All ({employees.length}) Employees (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Import / Update Employees from Excel Sheet</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an Excel file (.xlsx or .xls) to batch register or update employees. The system matches existing records by <strong>Employee ID</strong>, automatically calculating remaining passport and residency days, total salary packages, and contract dates.
            </p>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleEmployeeUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Click to Select or Drop Employee Excel File Here
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) spreadsheets
              </span>
            </label>

            {/* Status Message */}
            {empImportStatus.type && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  empImportStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : empImportStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {empImportStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : empImportStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                )}
                <span>{empImportStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: MONTHLY FIXED EXPENSES (WPS, LEASES & UTILITIES)    */}
      {/* ============================================================== */}
      {activeTab === 'fixed' && (
        <div className="space-y-6">
          {/* Template & Export Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Monthly Fixed Expenses (WPS Wages, Leases &amp; Utilities) Export &amp; Template</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage fixed monthly contractual expenses: WPS basic salaries, cash salary envelopes, shop lease rent (Porto Arabia), staff flat lease accommodations, Qatar Cool district cooling, Ooredoo fiber internet, Fresha SaaS platform subscriptions, and VIP loyalty cards.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={downloadFixedExpenseTemplate}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportFixed}
                className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Export All ({fixedExpenses.length}) Fixed Expenses (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Monthly Fixed Expenses (Excel / CSV)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an Excel file (.xlsx, .xls) or CSV containing fixed monthly obligations. The system automatically maps:
            </p>

            {/* Column badges */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              {[
                'DATE',
                'REF No / VOICE No',
                'CATEGORY',
                'COMPANY',
                'DESCRIPTION',
                'PAID / UNPAID',
                'Payment Method (Name)',
                'DETAILS COMMENT',
                'CARD / CASH',
                'AMOUNT',
                'Month',
                'Year',
              ].map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold"
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFixedUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Click to Select or Drop Fixed Expenses Excel / CSV File Here
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets
              </span>
            </label>

            {/* Status Message */}
            {fixedImportStatus.type && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  fixedImportStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : fixedImportStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {fixedImportStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : fixedImportStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                )}
                <span>{fixedImportStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: MONTHLY PETTY DAILY EXPANSE (VOICE INVOICES)         */}
      {/* ============================================================== */}
      {activeTab === 'petty' && (
        <div className="space-y-6">
          {/* Template & Export Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Monthly Petty Daily Expanse (VOICE Invoices) Export &amp; Template</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage daily salon petty cash disbursements, supply purchases, store amenities, and vendor receipts. Export existing registered vouchers or download the standardized Excel template with verified column definitions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={downloadPettyExpenseTemplate}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportPetty}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export All ({pettyCash.length}) VOICE Invoices (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import Monthly Petty Daily Expanse (VOICE Invoices)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an Excel file (.xlsx, .xls) or CSV containing daily petty expenses and VOICE invoices. The system automatically reads:
            </p>

            {/* Column badges */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              {[
                'VOICE DATE',
                'VOICE REF No / VOICE No',
                'VOICE COMPANY',
                'VOICE DESCRIPTION',
                'VOICE PAID / UNPAID',
                'VOICE Payment Method (Name)',
                'VOICE DETAILS COMMENT',
                'VOICE CARD / CASH',
                'VOICE AMOUNT',
                'Month',
                'Year',
              ].map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handlePettyUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Click to Select or Drop VOICE Invoices Excel / CSV File Here
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets
              </span>
            </label>

            {/* Status Message */}
            {pettyImportStatus.type && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  pettyImportStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : pettyImportStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {pettyImportStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : pettyImportStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                )}
                <span>{pettyImportStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

