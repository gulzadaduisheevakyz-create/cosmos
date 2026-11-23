import React, { useState } from 'react';
import { X, Search, Plus, Scissors, Trash2, Edit2, CheckCircle2, Sparkles } from 'lucide-react';
import { ServiceCatalogueItem, ServiceCategory } from '../types';
import { db, formatCurrency } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

interface ServiceCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogue: ServiceCatalogueItem[];
  onRefresh: () => void;
}

const CATEGORIES: ServiceCategory[] = [
  'Hairdresser',
  'Eyelash Art',
  'Eyebrows Art',
  'Nail Art',
  'Spa',
  'Spray Tan',
];

export const ServiceCatalogueModal: React.FC<ServiceCatalogueModalProps> = ({
  isOpen,
  onClose,
  catalogue,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogueItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Hairdresser');
  const [price, setPrice] = useState<number>(200);
  const [duration, setDuration] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(true);

  if (!isOpen) return null;

  const filteredCatalogue = catalogue.filter((item) => {
    const matchCategory = selectedCategory === 'All' ? true : item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory((selectedCategory !== 'All' ? selectedCategory : 'Hairdresser') as ServiceCategory);
    setPrice(200);
    setDuration(60);
    setIsActive(true);
    setShowAddForm(true);
  };

  const handleOpenEdit = (item: ServiceCatalogueItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category as ServiceCategory);
    setPrice(item.price);
    setDuration(item.durationMinutes || 60);
    setIsActive(item.isActive);
    setShowAddForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Service name is required.');
      return;
    }

    const payload: ServiceCatalogueItem = {
      id: editingItem?.id || `SRV-${category.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      category,
      price: Number(price) || 0,
      durationMinutes: Number(duration) || 60,
      isActive,
    };

    await db.saveServiceCatalogueItem(payload);
    setShowAddForm(false);
    onRefresh();
  };

  const handleDelete = (id: string, srvName: string) => {
    setDeleteConfirm({
      isOpen: true,
      id,
      name: srvName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await db.deleteServiceCatalogueItem(deleteConfirm.id);
      onRefresh();
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (item: ServiceCatalogueItem) => {
    await db.saveServiceCatalogueItem({ ...item, isActive: !item.isActive });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Salon Service Catalogue</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                  {catalogue.length} services
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage services, standard prices in QAR, and durations across default categories.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
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
            <form onSubmit={handleSave} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <span className="text-xs font-bold text-purple-900">
                  {editingItem ? `Edit Service: ${editingItem.name}` : 'Create New Salon Service'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Russian Volume 3D-5D"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Price (QAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 text-right bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">
                    Active in Daily Sales Form
                  </label>
                </div>
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
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          )}

          {/* Category Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-purple-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Catalogue Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Service Name</th>
                  <th className="py-2.5 px-3 text-right">Standard Price</th>
                  <th className="py-2.5 px-3 text-center">Duration</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCatalogue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No services found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredCatalogue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-purple-900">{item.category}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        QAR {formatCurrency(item.price)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {item.durationMinutes || 60} min
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-500 hover:text-purple-600 transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Service"
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
          title="Delete Service from Catalogue"
          message={`Are you sure you want to remove "${deleteConfirm.name}" from the salon service catalogue?`}
          confirmText="Delete Service"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
