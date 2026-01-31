import React, { useState } from 'react';
import { InventoryItem, Category } from '../types';
import { Search, Filter, AlertTriangle, X, ArrowUpDown, ArrowUp, ArrowDown, Download, Package, Activity, Edit2, Check, Loader2 } from 'lucide-react';
import { updateInventoryQuantity } from '../services/sheetService';

interface Props {
  inventory: InventoryItem[];
  onRefresh: () => void;
}

const InventoryTable: React.FC<Props> = ({ inventory, onRefresh }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editQty, setEditQty] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredData = inventory.filter(item => {
    const matchesCategory = filter === 'All' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.id.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === 'asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'desc') return b.name.localeCompare(a.name);
    return 0;
  });

  const clearFilters = () => {
    setSearch('');
    setFilter('All');
    setSortOrder(null);
  };

  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const handleExport = () => {
    const headers = ["ID", "Item Name", "Category", "Quantity", "Unit", "Min Level", "Status"];
    const csvContent = [
      headers.join(","),
      ...sortedData.map(item => {
        const status = item.quantity <= item.minLevel ? "Low Stock" : "In Stock";
        const safeName = `"${item.name.replace(/"/g, '""')}"`;
        return [item.id, safeName, item.category, item.quantity, item.unit, item.minLevel, status].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `satyam_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditQty(item.quantity.toString());
  };

  const handleSaveQuantity = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    const success = await updateInventoryQuantity(selectedItem.name, Number(editQty));
    setIsSaving(false);

    if (success) {
      setSelectedItem(prev => prev ? { ...prev, quantity: Number(editQty) } : null);
      setIsEditing(false);
      onRefresh();
    } else {
      alert("Failed to update quantity.");
    }
  };

  const hasActiveFilters = search !== '' || filter !== 'All';

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                <Package className="text-brand-500" size={20} />
              </div>
              Current Inventory
              <span className="text-sm font-normal text-slate-400">({sortedData.length} items)</span>
            </h2>

            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="pl-11 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 text-sm w-full md:w-64 focus:border-brand-500 focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-3 text-slate-400" size={18} />
                <select
                  className="pl-11 pr-8 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 text-sm appearance-none cursor-pointer focus:border-brand-500 focus:outline-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export
              </button>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  onClick={toggleSort}
                >
                  <div className="flex items-center gap-2">
                    Item Name
                    {sortOrder === 'asc' && <ArrowUp size={14} className="text-brand-500" />}
                    {sortOrder === 'desc' && <ArrowDown size={14} className="text-brand-500" />}
                    {!sortOrder && <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-500" />}
                  </div>
                </th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.length > 0 ? (
                sortedData.map((item) => {
                  const isLow = item.quantity <= item.minLevel;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`transition-all cursor-pointer ${isLow ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">#{item.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                          item.category === Category.HOUSEKEEPING
                            ? 'bg-blue-50 text-blue-600'
                            : item.category === Category.PANTRY
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{item.quantity}</span>
                        <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
                            <AlertTriangle size={14} className="animate-pulse" />
                            Low (Min: {item.minLevel})
                          </span>
                        ) : (
                          <span className="badge badge-green">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Package className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500">No items found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div
            className="card w-full max-w-md overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                <span className="text-xs font-mono text-brand-100">#{selectedItem.id}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Stock Card */}
              <div className={`p-5 rounded-xl ${selectedItem.quantity <= selectedItem.minLevel ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <p className="text-sm text-slate-500 font-medium mb-2">Current Stock</p>
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-24 p-2 border-2 border-slate-200 rounded-lg text-slate-800 font-bold text-xl focus:border-brand-500 focus:outline-none"
                          autoFocus
                        />
                        <span className="text-slate-500">{selectedItem.unit}</span>
                        <button
                          onClick={handleSaveQuantity}
                          disabled={isSaving}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        </button>
                        <button
                          onClick={() => { setIsEditing(false); setEditQty(selectedItem.quantity.toString()); }}
                          className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-slate-800">{selectedItem.quantity}</span>
                        <span className="text-slate-500">{selectedItem.unit}</span>
                        <button
                          onClick={() => { setIsEditing(true); setEditQty(selectedItem.quantity.toString()); }}
                          className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 rounded-xl ${selectedItem.quantity <= selectedItem.minLevel ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                    {selectedItem.quantity <= selectedItem.minLevel ? <AlertTriangle size={28} /> : <Package size={28} />}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-2">Category</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                    selectedItem.category === Category.HOUSEKEEPING
                      ? 'bg-blue-100 text-blue-600'
                      : selectedItem.category === Category.PANTRY
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {selectedItem.category}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-2">Min Level</p>
                  <p className="font-semibold text-slate-700">{selectedItem.minLevel} {selectedItem.unit}</p>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                {selectedItem.quantity <= selectedItem.minLevel ? (
                  <p className="text-red-500 text-sm font-medium flex items-center justify-center gap-2">
                    <AlertTriangle size={16} />
                    Stock below minimum. Please reorder.
                  </p>
                ) : (
                  <p className="text-green-600 text-sm font-medium flex items-center justify-center gap-2">
                    <Activity size={16} />
                    Stock levels are healthy
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryTable;
