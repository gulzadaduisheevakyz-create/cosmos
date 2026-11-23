import React, { useState } from 'react';
import { X, Search, UserCheck, Plus, Phone, Calendar, DollarSign, Trash2, Edit2 } from 'lucide-react';
import { Customer } from '../types';
import { db, formatCurrency, formatDate } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface CustomerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onRefresh: () => void;
}

export const CustomerDirectoryModal: React.FC<CustomerDirectoryModalProps> = ({
  isOpen,
  onClose,
  customers,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setMobile('');
    setEmail('');
    setNotes('');
    setShowAddForm(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email || '');
    setNotes(c.notes || '');
    setShowAddForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      alert('Name and Mobile number are required.');
      return;
    }

    const payload: Customer = {
      id: editingCustomer?.id || `CUST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      totalVisits: editingCustomer?.totalVisits || 0,
      totalSpent: editingCustomer?.totalSpent || 0,
      outstandingBalance: editingCustomer?.outstandingBalance || 0,
      notes: notes.trim(),
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      lastVisitDate: editingCustomer?.lastVisitDate,
    };

    await db.saveCustomer(payload);
    setShowAddForm(false);
    onRefresh();
  };

  const handleDelete = (id: string, custName: string) => {
    setDeleteConfirm({
      isOpen: true,
      id,
      name: custName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await db.deleteCustomer(deleteConfirm.id);
      onRefresh();
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Salon Customer Directory</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
                  {customers.length} registered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customers auto-saved during daily sales registration; mobile duplicate prevention enabled.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSave} className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="text-xs font-bold text-blue-900">
                  {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+974 5512 8899"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@domain.qa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Customer Notes &amp; Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP client, preferred stylists, allergic to certain lash glues..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by customer name, mobile (+974), or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Customer Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3 text-center">Visits</th>
                  <th className="py-2.5 px-3 text-right">Total Spent</th>
                  <th className="py-2.5 px-3 text-right">Outstanding</th>
                  <th className="py-2.5 px-3">Last Visit</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No customers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-900">{cust.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{cust.mobile}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px]">
                          {cust.totalVisits || 0}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        QAR {formatCurrency(cust.totalSpent)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {cust.outstandingBalance > 0 ? (
                          <span className="text-rose-600">QAR {formatCurrency(cust.outstandingBalance)}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                        {cust.lastVisitDate ? formatDate(cust.lastVisitDate) : '-'}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-500 max-w-[180px] truncate">
                        {cust.notes || '-'}
                      </td>
                      <td className="py-2 px-3 text-right space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cust.id, cust.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Customer Profile"
          message={`Are you sure you want to delete customer "${deleteConfirm.name}" from the directory?\n\nThis will remove the customer profile.`}
          confirmText="Delete Customer"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
