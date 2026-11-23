import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserPlus,
  DollarSign,
  Clock,
  Car,
  ShoppingBag,
  Sparkles,
  Scissors,
  Eye,
} from 'lucide-react';
import {
  Employee,
  DailySaleRecord,
  Customer,
  ServiceCatalogueItem,
  SaleServiceLine,
  SaleProductLine,
  ServiceCategory,
} from '../types';
import { db, formatCurrency } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface RegisterSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employees: Employee[];
  customers: Customer[];
  catalogue: ServiceCatalogueItem[];
  editSale?: DailySaleRecord | null;
}

const CATEGORIES: ServiceCategory[] = [
  'Hairdresser',
  'Eyelash Art',
  'Eyebrows Art',
  'Nail Art',
  'Spa',
  'Spray Tan',
];

export const RegisterSaleModal: React.FC<RegisterSaleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employees,
  customers,
  catalogue,
  editSale,
}) => {
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'Unemployed'),
    [employees]
  );

  // Strictly filter only employees authorized to provide salon services (excludes Manager, HR, Receptionist, Accountant, Cleaner)
  const serviceEmployees = useMemo(
    () =>
      activeEmployees.filter((e) => {
        const isNonServiceRole = ['Manager', 'HR', 'Receptionist', 'Accountant', 'Cleaner', 'Cleaner Staff'].includes(
          e.employeeRole || e.position
        );
        if (isNonServiceRole && !e.canProvideServices) return false;
        return e.canProvideServices !== false;
      }),
    [activeEmployees]
  );


  // Form State
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerVisits, setCustomerVisits] = useState(0);

  // Services Lines
  const [services, setServices] = useState<SaleServiceLine[]>([]);
  // Products Lines
  const [products, setProducts] = useState<SaleProductLine[]>([]);
  // Uber charge
  const [uberCharge, setUberCharge] = useState<number>(0);

  // Payments
  const [posCard, setPosCard] = useState<number>(0);
  const [cash, setCash] = useState<number>(0);
  const [fawran, setFawran] = useState<number>(0);
  const [fawranRecipientName, setFawranRecipientName] = useState('');
  const [tips, setTips] = useState<number>(0);
  const [unpaid, setUnpaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteSale = async () => {
    if (!editSale) return;
    try {
      await db.deleteDailySale(editSale.saleId);
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to delete sale record.');
    }
  };

  // Validation / errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill or reset when modal opens or editSale changes
  useEffect(() => {
    if (!isOpen) return;

    if (editSale) {
      setSaleDate(editSale.date || new Date().toISOString().slice(0, 10));
      setMobileNumber(editSale.mobileNumber || '');
      setCustomerName(editSale.customerName || '');
      setCustomerId(editSale.customerId || '');
      setIsExistingCustomer(true);
      setServices([...editSale.services]);
      setProducts([...editSale.products]);
      setUberCharge(editSale.uberCharge || 0);
      setPosCard(editSale.posCard || 0);
      setCash(editSale.cash || 0);
      setFawran(editSale.fawran || 0);
      setFawranRecipientName(editSale.fawranRecipientName || '');
      setTips(editSale.tips || 0);
      setUnpaid(editSale.unpaid || 0);
      setNotes(editSale.notes || '');
    } else {
      // New Sale Defaults
      setSaleDate(new Date().toISOString().slice(0, 10));
      setMobileNumber('');
      setCustomerName('');
      setCustomerId('');
      setIsExistingCustomer(false);
      setCustomerVisits(0);
      setUberCharge(0);
      setPosCard(0);
      setCash(0);
      setFawran(0);
      setFawranRecipientName('');
      setTips(0);
      setUnpaid(0);
      setNotes('');

      // Seed one default empty service line
      const defaultEmp = activeEmployees[0];
      const defaultService = catalogue[0];
      setServices([
        {
          id: `line-${Date.now()}-1`,
          serviceId: defaultService?.id || '',
          serviceName: defaultService?.name || 'Haircut & Styling',
          category: defaultService?.category || 'Hairdresser',
          price: defaultService?.price || 250,
          quantity: 1,
          discount: 0,
          lineTotal: defaultService?.price || 250,
          employeeId: defaultEmp?.employeeId || '',
          employeeName: defaultEmp?.employeeName || '',
          startTime: '10:00',
          endTime: '11:00',
        },
      ]);
      setProducts([]);
    }
    setErrorMsg(null);
  }, [isOpen, editSale, activeEmployees, catalogue]);

  // Handle Mobile Number Change and Auto Customer Lookup
  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    if (!val || val.trim().length < 4) {
      setIsExistingCustomer(false);
      return;
    }

    const found = db.findCustomerByMobile(val);
    if (found) {
      setCustomerName(found.name);
      setCustomerId(found.id);
      setIsExistingCustomer(true);
      setCustomerVisits(found.totalVisits || 0);
    } else {
      setIsExistingCustomer(false);
      setCustomerVisits(0);
      // Keep customerId ready for new customer creation
      if (!editSale) {
        setCustomerId(`CUST-${Date.now().toString().slice(-4)}`);
      }
    }
  };

  // Financial calculations
  const totalServiceAmount = useMemo(() => {
    return services.reduce((sum, s) => sum + (Number(s.lineTotal) || 0), 0);
  }, [services]);

  const totalProductAmount = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.lineTotal) || 0), 0);
  }, [products]);

  // Gross Sales (Services + Products) - eligible business gross
  const grossSales = totalServiceAmount + totalProductAmount;

  // Total Billable Revenue (Gross Sales + Uber)
  const totalRevenue = grossSales + (Number(uberCharge) || 0);

  // Total Payment entered
  const totalPaymentsCollected = (Number(posCard) || 0) + (Number(cash) || 0) + (Number(fawran) || 0);
  const totalSettled = totalPaymentsCollected + (Number(unpaid) || 0);
  const paymentDiff = totalRevenue - totalSettled;
  const isPaymentReconciled = Math.abs(paymentDiff) < 0.01;

  // Auto-adjust Un-Paid when payments change if user hasn't explicitly set unpaid
  const handleQuickPayAll = (mode: 'pos' | 'cash' | 'fawran') => {
    if (mode === 'pos') {
      setPosCard(totalRevenue);
      setCash(0);
      setFawran(0);
      setUnpaid(0);
    } else if (mode === 'cash') {
      setCash(totalRevenue);
      setPosCard(0);
      setFawran(0);
      setUnpaid(0);
    } else if (mode === 'fawran') {
      setFawran(totalRevenue);
      setPosCard(0);
      setCash(0);
      setUnpaid(0);
      if (!fawranRecipientName) {
        setFawranRecipientName('COSMOS BEAUTY SALON / QIB');
      }
    }
  };

  // Service line handlers
  const handleAddService = () => {
    const defaultEmp = activeEmployees[0];
    const defaultCat = CATEGORIES[0];
    const defaultSrv = catalogue.find((s) => s.category === defaultCat) || catalogue[0];

    const newLine: SaleServiceLine = {
      id: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceId: defaultSrv?.id || '',
      serviceName: defaultSrv?.name || 'Salon Service',
      category: defaultCat,
      price: defaultSrv?.price || 150,
      quantity: 1,
      discount: 0,
      lineTotal: defaultSrv?.price || 150,
      employeeId: defaultEmp?.employeeId || '',
      employeeName: defaultEmp?.employeeName || '',
      startTime: '10:00',
      endTime: '11:00',
    };
    setServices((prev) => [...prev, newLine]);
  };

  const handleUpdateService = (index: number, updates: Partial<SaleServiceLine>) => {
    setServices((prev) => {
      const next = [...prev];
      const cur = { ...next[index], ...updates };

      // If price, quantity, or discount changed, recompute lineTotal
      const price = Number(cur.price) || 0;
      const qty = Number(cur.quantity) || 1;
      const discount = Number(cur.discount) || 0;
      cur.lineTotal = Math.max(0, price * qty - discount);

      // If category changed and service wasn't manually set, pick first service in that category
      if (updates.category && !updates.serviceName) {
        const matchingSrv = catalogue.find((s) => s.category === updates.category);
        if (matchingSrv) {
          cur.serviceId = matchingSrv.id;
          cur.serviceName = matchingSrv.name;
          cur.price = matchingSrv.price;
          cur.lineTotal = Math.max(0, matchingSrv.price * qty - discount);
        }
      }

      // If employeeId changed, update employeeName
      if (updates.employeeId) {
        const emp = activeEmployees.find((e) => e.employeeId === updates.employeeId);
        if (emp) cur.employeeName = emp.employeeName;
      }

      // If sharedWithEmployeeId changed, update sharedWithEmployeeName
      if (updates.sharedWithEmployeeId) {
        const sEmp = activeEmployees.find((e) => e.employeeId === updates.sharedWithEmployeeId);
        if (sEmp) cur.sharedWithEmployeeName = sEmp.employeeName;
      }

      next[index] = cur;
      return next;
    });
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  // Product line handlers
  const handleAddProduct = () => {
    const defaultEmp = activeEmployees[0];
    const newLine: SaleProductLine = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productName: 'Retail Product',
      quantity: 1,
      unitPrice: 100,
      discount: 0,
      lineTotal: 100,
      employeeId: defaultEmp?.employeeId || '',
      employeeName: defaultEmp?.employeeName || '',
    };
    setProducts((prev) => [...prev, newLine]);
  };

  const handleUpdateProduct = (index: number, updates: Partial<SaleProductLine>) => {
    setProducts((prev) => {
      const next = [...prev];
      const cur = { ...next[index], ...updates };

      const price = Number(cur.unitPrice) || 0;
      const qty = Number(cur.quantity) || 1;
      const discount = Number(cur.discount) || 0;
      cur.lineTotal = Math.max(0, price * qty - discount);

      if (updates.employeeId) {
        const emp = activeEmployees.find((e) => e.employeeId === updates.employeeId);
        if (emp) cur.employeeName = emp.employeeName;
      }

      next[index] = cur;
      return next;
    });
  };

  const handleRemoveProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit / Save Sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please enter or select a customer name.');
      return;
    }

    if (!mobileNumber.trim()) {
      setErrorMsg('Please enter customer mobile number.');
      return;
    }

    if (services.length === 0 && products.length === 0) {
      setErrorMsg('Please add at least one salon service or retail product.');
      return;
    }

    // Validate employees assigned
    for (let i = 0; i < services.length; i++) {
      if (!services[i].employeeId) {
        setErrorMsg(`Please select an employee for service #${i + 1} (${services[i].serviceName}).`);
        return;
      }
      if (services[i].sharedAmount && services[i].sharedAmount! > services[i].lineTotal) {
        setErrorMsg(`Shared allocation for service #${i + 1} cannot exceed line total of QAR ${services[i].lineTotal}.`);
        return;
      }
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].employeeId) {
        setErrorMsg(`Please select an assigned salesperson for product #${i + 1}.`);
        return;
      }
    }

    // Validate Fawran recipient
    if (fawran > 0 && !fawranRecipientName.trim()) {
      setErrorMsg('Please enter the Fawran Recipient Name for this instant payment.');
      return;
    }

    // Determine sequential Sr#
    let srNo = editSale?.srNo;
    let srCode = editSale?.srCode;
    if (!srNo || !srCode) {
      const seq = db.getNextSaleSrNo();
      srNo = seq.srNo;
      srCode = seq.srCode;
    }

    const finalPaid = (Number(posCard) || 0) + (Number(cash) || 0) + (Number(fawran) || 0);
    const finalUnpaid = Math.max(0, Number(unpaid) || 0);
    const finalRefunds = editSale?.refunds || 0;
    const finalNet = Math.max(0, totalRevenue - finalRefunds);

    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Refunded' = 'Paid';
    if (finalRefunds >= totalRevenue && totalRevenue > 0) {
      paymentStatus = 'Refunded';
    } else if (finalPaid >= finalNet) {
      paymentStatus = 'Paid';
    } else if (finalPaid > 0) {
      paymentStatus = 'Partial';
    } else {
      paymentStatus = 'Unpaid';
    }

    const saleRecord: DailySaleRecord = {
      srNo,
      srCode,
      saleId: editSale?.saleId || `SALE-${srNo}-${Date.now().toString().slice(-4)}`,
      date: saleDate,
      customerId: customerId || `CUST-${Date.now().toString().slice(-4)}`,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      services,
      products,
      uberCharge: Number(uberCharge) || 0,
      totalServiceAmount,
      totalProductAmount,
      grossSales,
      totalRevenue,
      posCard: Number(posCard) || 0,
      cash: Number(cash) || 0,
      fawran: Number(fawran) || 0,
      fawranRecipientName: fawranRecipientName.trim(),
      tips: Number(tips) || 0,
      unpaid: finalUnpaid,
      refunds: finalRefunds,
      refundRecords: editSale?.refundRecords || [],
      netSales: finalNet,
      totalPaid: finalPaid,
      paymentStatus,
      notes: notes.trim(),
      createdAt: editSale?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.saveDailySale(saleRecord);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save daily sale.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{editSale ? `Edit Sales Record: ${editSale.srCode}` : 'Register Daily Salon Sale'}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                  {editSale ? editSale.srCode : 'Auto Sr#'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Register customer visit, salon services with assigned staff, products, and split payments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer & Visit Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>1. Customer &amp; Visit Details</span>
              </span>
              <span className="text-[11px] text-slate-500">Auto-checks existing customer by mobile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Mobile Number Lookup */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Customer Mobile *</span>
                  {isExistingCustomer ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <UserCheck className="w-3 h-3" /> Existing VIP ({customerVisits} visits)
                    </span>
                  ) : mobileNumber.length >= 6 ? (
                    <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
                      <UserPlus className="w-3 h-3" /> New Customer (Will auto-save)
                    </span>
                  ) : null}
                </label>
                <input
                  type="text"
                  placeholder="+974 5512 8899"
                  value={mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Multi-Service Entry (Assigned Staff & Times) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <span>2. Salon Services Rendered</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Each service line is attributed directly to the employee who performed it for their 10% Service Target Commission.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No services added. Click "Add Service" above.
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((srv, idx) => {
                  const categoryServices = catalogue.filter(
                    (item) => item.category === srv.category && item.isActive
                  );

                  return (
                    <div
                      key={srv.id}
                      className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                          Service Line #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove service line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* Category */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Category
                          </label>
                          <select
                            value={srv.category}
                            onChange={(e) =>
                              handleUpdateService(idx, { category: e.target.value as ServiceCategory })
                            }
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-md font-medium"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Service Item */}
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Service Name
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={srv.serviceId || ''}
                              onChange={(e) => {
                                const selected = catalogue.find((c) => c.id === e.target.value);
                                if (selected) {
                                  handleUpdateService(idx, {
                                    serviceId: selected.id,
                                    serviceName: selected.name,
                                    price: selected.price,
                                  });
                                }
                              }}
                              className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-md font-medium"
                            >
                              <option value="">Custom Service...</option>
                              {categoryServices.map((catItem) => (
                                <option key={catItem.id} value={catItem.id}>
                                  {catItem.name} (QAR {catItem.price})
                                </option>
                              ))}
                            </select>
                          </div>
                          {!srv.serviceId && (
                            <input
                              type="text"
                              placeholder="Type custom service name"
                              value={srv.serviceName}
                              onChange={(e) => handleUpdateService(idx, { serviceName: e.target.value })}
                              className="w-full text-xs p-1 mt-1 bg-white border border-slate-300 rounded font-medium"
                            />
                          )}
                        </div>

                        {/* Assigned Employee */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-purple-900 uppercase mb-0.5">
                            Performing Staff ({srv.category}) *
                          </label>
                          <select
                            value={srv.employeeId}
                            onChange={(e) => handleUpdateService(idx, { employeeId: e.target.value })}
                            required
                            className="w-full text-xs p-1.5 bg-purple-50/50 border border-purple-300 rounded-md font-semibold text-purple-900"
                          >
                            <option value="">Select Specialist...</option>
                            {(() => {
                              const categorySpecialists = serviceEmployees.filter(
                                (emp) =>
                                  emp.assignedCategory === srv.category ||
                                  emp.employeeRole === srv.category ||
                                  (emp.serviceCategories && emp.serviceCategories.includes(srv.category))
                              );
                              const otherSpecialists = serviceEmployees.filter(
                                (emp) => !categorySpecialists.includes(emp)
                              );

                              return (
                                <>
                                  {categorySpecialists.length > 0 && (
                                    <optgroup label={`✨ Assigned ${srv.category} Specialists`}>
                                      {categorySpecialists.map((emp) => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                          {emp.employeeName} ({emp.assignedCategory || emp.employeeRole})
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {otherSpecialists.length > 0 && (
                                    <optgroup label="Other Service Staff">
                                      {otherSpecialists.map((emp) => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                          {emp.employeeName} ({emp.assignedCategory || emp.employeeRole || 'Service Staff'})
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </>
                              );
                            })()}
                          </select>
                        </div>

                        {/* Times */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Start-End
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={srv.startTime || '10:00'}
                              onChange={(e) => handleUpdateService(idx, { startTime: e.target.value })}
                              className="w-full text-[11px] p-1 bg-white border border-slate-300 rounded font-mono"
                            />
                            <input
                              type="time"
                              value={srv.endTime || '11:00'}
                              onChange={(e) => handleUpdateService(idx, { endTime: e.target.value })}
                              className="w-full text-[11px] p-1 bg-white border border-slate-300 rounded font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Line pricing & shared allocation */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-bold uppercase">Price:</span>
                            <input
                              type="number"
                              min="0"
                              value={srv.price}
                              onChange={(e) =>
                                handleUpdateService(idx, { price: parseFloat(e.target.value) || 0 })
                              }
                              className="w-20 text-xs p-1 text-right bg-white border border-slate-300 rounded font-mono font-bold"
                            />
                            <span className="text-[10px] text-slate-400">QAR</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-bold uppercase">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={srv.quantity}
                              onChange={(e) =>
                                handleUpdateService(idx, { quantity: parseInt(e.target.value) || 1 })
                              }
                              className="w-14 text-xs p-1 text-center bg-white border border-slate-300 rounded font-mono"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-bold uppercase">Discount:</span>
                            <input
                              type="number"
                              min="0"
                              value={srv.discount}
                              onChange={(e) =>
                                handleUpdateService(idx, { discount: parseFloat(e.target.value) || 0 })
                              }
                              className="w-18 text-xs p-1 text-right bg-white border border-slate-300 rounded font-mono"
                            />
                            <span className="text-[10px] text-slate-400">QAR</span>
                          </div>

                          {/* Shared service allocation option */}
                          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                            <span className="text-[10px] text-slate-500 font-semibold">Share:</span>
                            <select
                              value={srv.sharedWithEmployeeId || ''}
                              onChange={(e) =>
                                handleUpdateService(idx, {
                                  sharedWithEmployeeId: e.target.value || undefined,
                                  sharedAmount: e.target.value ? (srv.sharedAmount || srv.lineTotal / 2) : 0,
                                })
                              }
                              className="text-[11px] p-1 bg-white border border-slate-300 rounded"
                            >
                              <option value="">No Shared Staff</option>
                              {serviceEmployees
                                .filter((e) => e.employeeId !== srv.employeeId)
                                .map((emp) => (
                                  <option key={emp.employeeId} value={emp.employeeId}>
                                    Share with {emp.employeeName}
                                  </option>
                                ))}
                            </select>
                            {srv.sharedWithEmployeeId && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={srv.lineTotal}
                                  placeholder="Amt"
                                  value={srv.sharedAmount || ''}
                                  onChange={(e) =>
                                    handleUpdateService(idx, {
                                      sharedAmount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-16 text-xs p-1 text-right bg-amber-50 border border-amber-300 rounded font-mono font-bold"
                                />
                                <span className="text-[10px] text-slate-400">QAR</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase mr-1">Line Total:</span>
                          <span className="font-bold font-mono text-purple-900 text-sm">
                            QAR {formatCurrency(srv.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Retail Product Sales & Uber Home Service */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Retail Product Sales */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>3. Retail Product Sales</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Separate 5% Product Sales Commission attributed to assigned salesperson.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No products sold in this transaction. Click "Add Product" if customer purchased retail items.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {products.map((prd, pIdx) => (
                    <div
                      key={prd.id}
                      className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Product name (e.g. Olaplex No. 3)"
                            value={prd.productName}
                            onChange={(e) =>
                              handleUpdateProduct(pIdx, { productName: e.target.value })
                            }
                            required
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded font-medium"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <select
                            value={prd.employeeId}
                            onChange={(e) =>
                              handleUpdateProduct(pIdx, { employeeId: e.target.value })
                            }
                            required
                            className="w-full text-xs p-1.5 bg-emerald-50/40 border border-emerald-300 rounded text-emerald-900 font-medium"
                          >
                            <option value="">Salesperson...</option>
                            {activeEmployees.map((emp) => (
                              <option key={emp.employeeId} value={emp.employeeId}>
                                {emp.employeeName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={prd.quantity}
                            onChange={(e) =>
                              handleUpdateProduct(pIdx, { quantity: parseInt(e.target.value) || 1 })
                            }
                            className="w-12 text-xs p-1 text-center bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Price:</span>
                          <input
                            type="number"
                            min="0"
                            value={prd.unitPrice}
                            onChange={(e) =>
                              handleUpdateProduct(pIdx, { unitPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-16 text-xs p-1 text-right bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end shrink-0">
                        <span className="font-mono font-bold text-emerald-800">
                          QAR {formatCurrency(prd.lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uber for Home Service */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>Uber for Home Service</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Home service transportation charge. Tracked separately; excluded from service commission base.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Transportation Fee (QAR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={uberCharge}
                    onChange={(e) => setUberCharge(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 text-right bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500 font-bold">QAR</span>
                </div>
              </div>

              {/* Subtotals Preview */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Services:</span>
                  <span>QAR {formatCurrency(totalServiceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span>QAR {formatCurrency(totalProductAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Gross Sales:</span>
                  <span>QAR {formatCurrency(grossSales)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Payment Split & Reconciliation */}
          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>4. Payment &amp; Reconciliation Information</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Split amounts across POS Card, Cash, and Fawran. Tips and Un-Paid balances are tracked separately.
                </p>
              </div>

              {/* Quick Fill Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-slate-400 mr-1 uppercase">Pay in full:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPayAll('pos')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPayAll('cash')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPayAll('fawran')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-medium"
                >
                  Fawran
                </button>
              </div>
            </div>

            {/* Reconciliation Banner */}
            <div
              className={`p-3 rounded-lg flex items-center justify-between gap-3 text-xs font-semibold ${
                isPaymentReconciled
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950/70 text-amber-300 border border-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {isPaymentReconciled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>
                  {isPaymentReconciled
                    ? 'Payment Fully Reconciled: Entered payments & unpaid balance match total billable revenue.'
                    : `Reconciliation Warning: Payments + Unpaid (QAR ${formatCurrency(
                        totalSettled
                      )}) differ from Total Revenue (QAR ${formatCurrency(totalRevenue)}) by QAR ${formatCurrency(
                        Math.abs(paymentDiff)
                      )}.`}
                </span>
              </div>
              <div className="font-mono text-sm shrink-0">
                Due: <span className="text-white font-bold">QAR {formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* POS Card */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                  POS Card (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={posCard}
                  onChange={(e) => setPosCard(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 text-right bg-slate-800 border border-slate-700 rounded-lg font-mono font-bold text-white focus:border-amber-400"
                />
              </div>

              {/* Cash */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                  Cash (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cash}
                  onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 text-right bg-slate-800 border border-slate-700 rounded-lg font-mono font-bold text-white focus:border-amber-400"
                />
              </div>

              {/* Fawran */}
              <div>
                <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">
                  Fawran Instant (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fawran}
                  onChange={(e) => setFawran(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 text-right bg-slate-800 border border-amber-500/50 rounded-lg font-mono font-bold text-amber-300 focus:border-amber-400"
                />
              </div>

              {/* Tips */}
              <div>
                <label className="block text-[10px] font-bold text-cyan-300 uppercase mb-1">
                  Tips / Gratuity (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tips}
                  onChange={(e) => setTips(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 text-right bg-slate-800 border border-cyan-500/40 rounded-lg font-mono font-bold text-cyan-300 focus:border-cyan-400"
                  title="Recorded separately, does not increase commission eligible sales"
                />
              </div>

              {/* Un-Paid */}
              <div>
                <label className="block text-[10px] font-bold text-rose-300 uppercase mb-1">
                  Un-Paid Balance (QAR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={unpaid}
                  onChange={(e) => setUnpaid(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 text-right bg-slate-800 border border-rose-500/40 rounded-lg font-mono font-bold text-rose-300 focus:border-rose-400"
                />
              </div>

              {/* Total Revenue */}
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue</span>
                <span className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  QAR {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>

            {/* Fawran Recipient Name */}
            {fawran > 0 && (
              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-1">
                <label className="block text-[11px] font-bold text-amber-300 uppercase">
                  Fawran Recipient Name / Account *
                </label>
                <input
                  type="text"
                  placeholder="e.g. COSMOS BEAUTY SALON / QIB or Recipient Phone"
                  value={fawranRecipientName}
                  onChange={(e) => setFawranRecipientName(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-slate-900 border border-amber-400/40 rounded-lg text-white font-medium focus:border-amber-400"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                Transaction Notes
              </label>
              <textarea
                rows={2}
                placeholder="Optional customer feedback, home service address, or special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-sans focus:border-amber-400"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            {editSale ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete this transaction permanently"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Sale</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editSale ? 'Update Sales Record' : 'Register Service / Save Sale'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* In-app Confirmation Modal for Deleting Sale */}
        {showDeleteConfirm && editSale && (
          <ConfirmModal
            isOpen={showDeleteConfirm}
            title={`Delete Sales Record ${editSale.srCode}`}
            message={`Are you sure you want to permanently delete sales transaction "${editSale.srCode}" for customer "${editSale.customerName}"?\n\nThis will remove the transaction record and automatically recalculate employee commissions and revenue.`}
            confirmText="Delete Record"
            cancelText="Cancel"
            isDestructive={true}
            onConfirm={handleDeleteSale}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};
