import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface BackupRestoreViewProps {
  onRefresh: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onRefresh }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [pendingRestoreText, setPendingRestoreText] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    try {
      const json = db.getFullBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cosmos_HR_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setStatus({
        type: 'error',
        message: 'Failed to generate backup: ' + (err as Error).message,
      });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPendingRestoreText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!pendingRestoreText) return;
    try {
      const ok = await db.restoreFromJSON(pendingRestoreText);
      if (ok) {
        setStatus({
          type: 'success',
          message: 'Database restored successfully! All staff, payroll, certificates, and logs are now updated.',
        });
        onRefresh();
      } else {
        setStatus({
          type: 'error',
          message: 'Invalid JSON backup format. Please verify the file.',
        });
      }
    } catch (err: unknown) {
      setStatus({
        type: 'error',
        message: 'Error parsing backup: ' + (err as Error).message,
      });
    } finally {
      setPendingRestoreText(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Database Backup &amp; Disaster Recovery</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Download a complete, offline JSON snapshot of your entire salon system or restore an earlier state.
        </p>
      </div>

      {/* Backup Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Download Complete Database Backup (.json)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The backup contains all registered employees, complete monthly payroll history, attendance clock-ins, leave and flight ticket balances, archived certificates, custom Qatar banks, and full audit security logs.
        </p>
        <div className="pt-2">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Restore Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Upload className="w-4 h-4 text-amber-600" />
          <span>Restore Database from Backup</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Upload a previously downloaded JSON backup file to restore records. Please note that restoring replaces existing local records.
        </p>

        <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
          <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          <Upload className="w-6 h-6 text-amber-600 mb-2" />
          <span className="text-xs font-bold text-slate-800">
            Click to Select Cosmos Backup JSON File
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">Accepts .json backup files</span>
        </label>

        {status.type && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal */}
      {pendingRestoreText && (
        <ConfirmModal
          isOpen={!!pendingRestoreText}
          title="Restore Database from Backup"
          message={'⚠️ WARNING: Restoring from a backup will overwrite existing local records with the contents of this backup file.\n\nAre you sure you want to proceed?'}
          confirmText="Overwrite & Restore"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={executeRestore}
          onCancel={() => setPendingRestoreText(null)}
        />
      )}
    </div>
  );
};
