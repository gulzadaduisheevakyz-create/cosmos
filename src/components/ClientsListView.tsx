import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Users,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Customer, CustomerBooking, DailySaleRecord } from '../types';
import { formatCurrency, formatDate, db } from '../services/db';
import { exportCustomersToExcel } from '../services/excel';
import { ClientDetailModal } from './ClientDetailModal';
import { ConfirmModal } from './ConfirmModal';

interface ClientsListViewProps {
  customers: Customer[];
  bookings: CustomerBooking[];
  sales: DailySaleRecord[];
  onRefresh: () => void;
  onOpenBookingModal?: (client?: Customer) => void;
}

export const ClientsListView: React.FC<ClientsListViewProps> = ({
  customers,
  bookings,
  sales,
  onRefresh,
  onOpenBookingModal,
}) => {
  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent-visit' | 'sales-high' | 'visits-high' | 'name' | 'newest'>('recent-visit');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; client: Customer } | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  // Modals
  const [selectedClientForModal, setSelectedClientForModal] = useState<Customer | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGender, setFormGender] = useState<'Female' | 'Male' | 'Other' | undefined>('Female');
  const [formBirthday, setFormBirthday] = useState('');
  const [formSegment, setFormSegment] = useState<'VIP' | 'Regular' | 'New' | 'At Risk'>('Regular');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute 4 Real KPI Summary Metrics
  const kpiStats = useMemo(() => {
    const totalClients = customers.length;

    // Active: visited or had appointment within the last 90 days, or total visits > 0
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysStr = ninetyDaysAgo.toISOString().slice(0, 10);

    const activeClients = customers.filter((c) => {
      if (c.lastVisitDate && c.lastVisitDate >= ninetyDaysStr) return true;
      if (c.totalVisits && c.totalVisits > 0) return true;
      return false;
    }).length;

    // New Clients: registered this month or marked as 'New'
    const currentMonthPrefix = todayStr.slice(0, 7);
    const newClients = customers.filter((c) => {
      if (c.segment === 'New') return true;
      if (c.createdAt && c.createdAt.startsWith(currentMonthPrefix)) return true;
      return false;
    }).length;

    // Upcoming Appointments: distinct clients with bookings from today onwards
    const upcomingClientIds = new Set<string>();
    bookings.forEach((b) => {
      if (
        b.date >= todayStr &&
        (b.status === 'Booked' || b.status === 'Confirmed' || b.status === 'In-Service')
      ) {
        if (b.customerId) upcomingClientIds.add(b.customerId);
        if (b.customerMobile) {
          const match = customers.find(
            (c) => c.mobile.replace(/[^0-9]/g, '').slice(-8) === b.customerMobile.replace(/[^0-9]/g, '').slice(-8)
          );
          if (match) upcomingClientIds.add(match.id);
        }
      }
    });

    return {
      totalClients,
      activeClients,
      newClients,
      upcomingAppointments: upcomingClientIds.size,
    };
  }, [customers, bookings, todayStr]);

  // Upcoming appointment map by customer ID or mobile
  const upcomingAppointmentMap = useMemo(() => {
    const map = new Map<string, CustomerBooking>();
    // Sort bookings by date ascending
    const sorted = [...bookings]
      .filter((b) => b.date >= todayStr && (b.status === 'Booked' || b.status === 'Confirmed'))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    sorted.forEach((b) => {
      if (b.customerId && !map.has(b.customerId)) {
        map.set(b.customerId, b);
      }
      if (b.customerMobile) {
        const norm = b.customerMobile.replace(/[^0-9]/g, '').slice(-8);
        if (norm && !map.has(norm)) {
          map.set(norm, b);
        }
      }
    });
    return map;
  }, [bookings, todayStr]);

  // Filtered and Sorted Clients
  const filteredClients = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanPhone = q.replace(/[^0-9]/g, '');
          const matchName = c.name.toLowerCase().includes(q);
          const matchPhone = cleanPhone ? c.mobile.replace(/[^0-9]/g, '').includes(cleanPhone) : c.mobile.includes(q);
          const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
          const matchId = c.id.toLowerCase().includes(q);

          if (!matchName && !matchPhone && !matchEmail && !matchId) return false;
        }

        // Segment filter
        if (selectedSegment !== 'all') {
          if (selectedSegment === 'VIP' && !c.isVip && c.segment !== 'VIP') return false;
          if (selectedSegment === 'Regular' && c.segment !== 'Regular' && c.segment !== undefined) return false;
          if (selectedSegment === 'New' && c.segment !== 'New') return false;
          if (selectedSegment === 'At Risk' && c.segment !== 'At Risk') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent-visit') {
          const dateA = a.lastVisitDate || a.createdAt || '';
          const dateB = b.lastVisitDate || b.createdAt || '';
          return dateB.localeCompare(dateA);
        }
        if (sortBy === 'sales-high') {
          return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
        }
        if (sortBy === 'visits-high') {
          return (Number(b.totalVisits) || 0) - (Number(a.totalVisits) || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [customers, searchQuery, selectedSegment, sortBy]);

  // Real-time duplicate phone detector for Add/Edit Form
  const duplicatePhoneClient = useMemo(() => {
    if (!formMobile.trim() || formMobile.trim().length < 6) return null;
    const cleanFormPhone = formMobile.replace(/[^0-9]/g, '').slice(-8);
    if (!cleanFormPhone) return null;

    return customers.find((c) => {
      if (editingClient && c.id === editingClient.id) return false;
      const cleanExisting = c.mobile.replace(/[^0-9]/g, '').slice(-8);
      return cleanExisting === cleanFormPhone;
    });
  }, [formMobile, customers, editingClient]);

  // Handlers for Add / Edit Modal
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormMobile('+974 ');
    setFormEmail('');
    setFormGender('Female');
    setFormBirthday('');
    setFormSegment('Regular');
    setFormNotes('');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (client: Customer) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormMobile(client.mobile);
    setFormEmail(client.email || '');
    setFormGender(client.gender || 'Female');
    setFormBirthday(client.birthday || '');
    setFormSegment((client.segment as any) || (client.isVip ? 'VIP' : 'Regular'));
    setFormNotes(client.notes || '');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Client name is required.');
      return;
    }

    const cleanMobile = formMobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 8) {
      setFormError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }

    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setFormError('Please enter a valid email address or leave blank.');
      return;
    }

    const payload: Customer = {
      id: editingClient?.id || `CUST-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim() || undefined,
      gender: formGender,
      birthday: formBirthday || undefined,
      segment: formSegment,
      isVip: formSegment === 'VIP',
      totalVisits: editingClient?.totalVisits || 0,
      totalSpent: editingClient?.totalSpent || 0,
      outstandingBalance: editingClient?.outstandingBalance || 0,
      walletBalance: editingClient?.walletBalance || 0,
      notes: formNotes.trim() || undefined,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
      lastVisitDate: editingClient?.lastVisitDate,
    };

    try {
      await db.saveCustomer(payload);
      setIsAddEditModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    }
  };

  const handleDeleteClient = (client: Customer) => {
    setDeleteConfirm({
      isOpen: true,
      client,
    });
  };

  const handleConfirmDeleteClient = async () => {
    if (!deleteConfirm) return;
    try {
      await db.deleteCustomer(deleteConfirm.client.id);
      onRefresh();
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExport = () => {
    try {
      const recordsToExport =
        selectedClientIds.length > 0
          ? filteredClients.filter((c) => selectedClientIds.includes(c.id))
          : filteredClients;

      exportCustomersToExcel(recordsToExport);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map((c) => c.id));
    }
  };

  const handleToggleClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSegment('all');
    setSortBy('recent-visit');
  };

  return (
    <div className="space-y-6">
      {/* 1. Standardized Management Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Clients Directory & Profiles
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                {customers.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage verified salon clientele, contact channels, appointment records, and lifetime spend history.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Export clients to Microsoft Excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* 2. Customer Summary Metric Cards (4 Real Computed Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Clients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {kpiStats.totalClients}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Profiles in active directory
            </span>
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {kpiStats.activeClients}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Recent visits & appointments
            </span>
          </div>
        </div>

        {/* Card 3: New Clients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
              {kpiStats.newClients}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Registered this current month
            </span>
          </div>
        </div>

        {/* Card 4: Upcoming Appointments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Bookings
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
              {kpiStats.upcomingAppointments}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Scheduled salon sessions
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search, Segment Filters & Sorting Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, mobile (+974), email, or ID..."
            className="w-full text-xs pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Segment Tabs / Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSegment('all')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedSegment === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Clients
            </button>
            <button
              type="button"
              onClick={() => setSelectedSegment('VIP')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedSegment === 'VIP'
                  ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VIP
            </button>
            <button
              type="button"
              onClick={() => setSelectedSegment('Regular')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedSegment === 'Regular'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => setSelectedSegment('New')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedSegment === 'New'
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer shadow-2xs"
            >
              <option value="recent-visit">Recent Visit (Newest First)</option>
              <option value="sales-high">Lifetime Spend (Highest First)</option>
              <option value="visits-high">Total Visits (Highest First)</option>
              <option value="name">Client Name (A–Z)</option>
              <option value="newest">Registration Date (Newest)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedSegment !== 'all' || sortBy !== 'recent-visit') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Professional Responsive Client Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {selectedClientIds.length > 0 && (
          <div className="px-5 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <span className="font-medium">
              {selectedClientIds.length} of {filteredClients.length} clients selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="px-2.5 py-1 bg-white text-indigo-700 font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors"
              >
                Export Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedClientIds([])}
                className="text-xs text-indigo-700 hover:underline ml-2"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredClients.length > 0 &&
                      selectedClientIds.length === filteredClients.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Client Profile</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4 text-center">Visits</th>
                <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Visit & Upcoming</th>
                <th className="py-3.5 px-4 text-center">Segment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No Matching Clients Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? `No clients matched "${searchQuery}". Check the spelling or reset search filters.`
                          : 'No clients registered yet in the database.'}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                          >
                            Clear Search
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                        >
                          Add New Client
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClientIds.includes(client.id);
                  const cleanPhone = client.mobile.replace(/[^0-9]/g, '').slice(-8);
                  const upcomingBooking =
                    upcomingAppointmentMap.get(client.id) ||
                    (cleanPhone ? upcomingAppointmentMap.get(cleanPhone) : undefined);

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientForModal(client)}
                      className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => handleToggleClient(client.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Client Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 text-indigo-800 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate flex items-center gap-1.5">
                              <span>{client.name}</span>
                              {client.isVip && (
                                <span className="text-[10px] text-purple-700 font-semibold tracking-wide">
                                  ★ VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {client.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <a
                            href={`tel:${client.mobile.replace(/\s+/g, '')}`}
                            className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.mobile}</span>
                          </a>
                          {client.email ? (
                            <a
                              href={`mailto:${client.email}`}
                              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-600 transition-colors truncate max-w-[200px]"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No email on file</span>
                          )}
                        </div>
                      </td>

                      {/* Total Visits */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block font-mono font-bold text-slate-800 text-xs px-2.5 py-1 bg-slate-100 rounded-lg tabular-nums">
                          {client.totalVisits || 0}
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                          QAR {formatCurrency(client.totalSpent || 0)}
                        </div>
                        {client.outstandingBalance && client.outstandingBalance > 0 ? (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Due: QAR {formatCurrency(client.outstandingBalance)}
                          </div>
                        ) : null}
                      </td>

                      {/* Last Visit & Upcoming */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-700 flex items-center gap-1">
                            <span className="text-slate-400">Last:</span>
                            <span className="font-medium">
                              {client.lastVisitDate ? formatDate(client.lastVisitDate) : 'Never visited'}
                            </span>
                          </div>
                          {upcomingBooking ? (
                            <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-500" />
                              <span>
                                {formatDate(upcomingBooking.date)} at {upcomingBooking.startTime}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">No upcoming booking</div>
                          )}
                        </div>
                      </td>

                      {/* Segment Tag */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            client.segment === 'VIP' || client.isVip
                              ? 'bg-purple-100 text-purple-800'
                              : client.segment === 'New'
                              ? 'bg-blue-100 text-blue-800'
                              : client.segment === 'At Risk'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {client.segment || (client.isVip ? 'VIP' : 'Regular')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedClientForModal(client)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Full Profile & History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {onOpenBookingModal && (
                            <button
                              type="button"
                              onClick={() => onOpenBookingModal(client)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Book Salon Appointment"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(client)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Client Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredClients.length}</strong> of{' '}
            <strong className="text-slate-800">{customers.length}</strong> registered salon clients
          </span>
          <span className="text-[11px] text-slate-400">
            Click on any client row to inspect complete visit ledger, sales receipts, and notes.
          </span>
        </div>
      </div>

      {/* 5. Add / Edit Client Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingClient ? `Edit Client: ${editingClient.name}` : 'Register New Salon Client'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {editingClient ? `Client ID: ${editingClient.id}` : 'Create a new customer profile'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Duplicate Phone Notice */}
              {duplicatePhoneClient && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Existing Client Phone Number Match</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Phone number matches <strong>{duplicatePhoneClient.name}</strong> ({duplicatePhoneClient.id}).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddEditModalOpen(false);
                        setSelectedClientForModal(duplicatePhoneClient);
                      }}
                      className="mt-1 text-[11px] font-bold text-indigo-700 hover:underline"
                    >
                      Open Existing Profile →
                    </button>
                  </div>
                </div>
              )}

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sheikha Al-Thani"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Mobile and Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="+974 7045 0040"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format: +974 XXXXXXXX</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Gender and Birthday Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formGender || 'Female'}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Segment
                  </label>
                  <select
                    value={formSegment}
                    onChange={(e) => setFormSegment(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Notes & Preferences <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Hair formula, lash curl preference, beverage choice, allergies..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all"
                >
                  {editingClient ? 'Save Changes' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Client Detail Modal / Profile Drawer */}
      {selectedClientForModal && (
        <ClientDetailModal
          isOpen={Boolean(selectedClientForModal)}
          onClose={() => setSelectedClientForModal(null)}
          client={selectedClientForModal}
          bookings={bookings}
          sales={sales}
          onRebookAppointment={(client) => {
            setSelectedClientForModal(null);
            if (onOpenBookingModal) {
              onOpenBookingModal(client);
            }
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* Confirm Delete Client Modal */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Client Record"
          message={`Are you sure you want to delete client record for "${deleteConfirm.client.name}"?\n\nThis will remove the customer profile from the directory.`}
          confirmText="Delete Client"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDeleteClient}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
