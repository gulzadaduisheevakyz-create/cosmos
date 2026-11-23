import React, { useState, useMemo } from 'react';
import { History, Search, ShieldCheck } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.timestamp.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Security &amp; Operational Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log recording staff updates, payroll approvals, certificate printings, and system events.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-48">Timestamp</th>
                <th className="py-2.5 px-4 w-52">Action Type</th>
                <th className="py-2.5 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleString('en-GB')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {item.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed">{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No audit logs found matching criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
