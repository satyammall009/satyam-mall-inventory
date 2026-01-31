import React from 'react';
import { InventoryItem, Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Package, ArrowUpRight, TrendingUp, Boxes, Coffee } from 'lucide-react';

interface Props {
  inventory: InventoryItem[];
  transactions: Transaction[];
}

const Dashboard: React.FC<Props> = ({ inventory, transactions }) => {
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.quantity <= i.minLevel).length;
  const recentIssues = transactions.filter(t => t.type === TransactionType.ISSUE).slice(0, 5);
  const hkItems = inventory.filter(i => i.category === 'Housekeeping').length;
  const pantryItems = inventory.filter(i => i.category === 'Pantry').length;

  const categoryData = Object.values(inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { name: item.category, value: 0 };
    acc[item.category].value += 1;
    return acc;
  }, {} as Record<string, {name: string, value: number}>));

  const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f97316'];

  const stats = [
    { label: 'Total Items', value: totalItems, icon: Package, color: 'brand', bg: 'bg-brand-50', text: 'text-brand-600', iconBg: 'bg-brand-100' },
    { label: 'Low Stock', value: lowStockItems, icon: AlertTriangle, color: 'red', bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
    { label: 'Housekeeping', value: hkItems, icon: Boxes, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    { label: 'Pantry', value: pantryItems, icon: Coffee, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                  <h3 className={`text-3xl font-bold mt-1 ${stat.text}`}>{stat.value}</h3>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <Icon className={stat.text} size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-brand-500" />
            <h3 className="text-lg font-semibold text-slate-800">Inventory Composition</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowUpRight size={20} className="text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-800">Recent Stock Issued</h3>
          </div>
          <div className="space-y-3">
            {recentIssues.length > 0 ? (
              recentIssues.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <ArrowUpRight size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{t.itemName}</p>
                      <p className="text-xs text-slate-500">{t.location} • {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="badge badge-orange">-{t.quantity}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Low Stock Alert</h3>
              <p className="text-slate-500 text-sm">{lowStockItems} items need to be restocked</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {inventory.filter(i => i.quantity <= i.minLevel).slice(0, 6).map((item, idx) => (
              <div key={idx} className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-600">Stock: {item.quantity} {item.unit}</span>
                  <span className="text-xs text-red-600 font-medium">Min: {item.minLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
