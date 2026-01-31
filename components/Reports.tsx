import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Download, FileText, Filter, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  transactions: Transaction[];
}

const Reports: React.FC<Props> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'All' || t.type === filterType;
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        matchesDate = matchesDate && new Date(t.date) < nextDay;
      }
      return matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, startDate, endDate]);

  const downloadCSV = () => {
    const headers = ["Date", "Type", "Item Name", "Quantity", "Unit", "Location", "Person", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        `"${t.itemName}"`,
        t.quantity,
        t.unit || '',
        t.location,
        `"${t.personName}"`,
        t.notes ? `"${t.notes}"` : ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Satyam Mall - Inventory Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Filter: ${filterType}`, 14, 28);
    autoTable(doc, {
      head: [["Date", "Type", "Item", "Qty", "Location", "Person"]],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.itemName,
        `${t.quantity} ${t.unit || ''}`,
        t.location,
        t.personName
      ]),
      startY: 33,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-primary-600" />
            Transaction Reports
          </h2>
          <div className="flex gap-2">
            <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
              <FileText size={14} /> CSV
            </button>
            <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <select className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary-500 focus:outline-none" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All</option>
                <option value={TransactionType.ISSUE}>Issue</option>
                <option value={TransactionType.RECEIVE}>Receive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input type="date" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary-500 focus:outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input type="date" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary-500 focus:outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilterType('All'); setStartDate(''); setEndDate(''); }} className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Reset</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Item</th>
              <th className="px-4 py-3 text-left font-semibold">Qty</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Person</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${t.type === TransactionType.RECEIVE ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.type === TransactionType.RECEIVE ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.itemName}</td>
                <td className="px-4 py-3"><span className="font-semibold">{t.quantity}</span> <span className="text-gray-400 text-xs">{t.unit}</span></td>
                <td className="px-4 py-3 text-gray-600">{t.location}</td>
                <td className="px-4 py-3 text-gray-600">{t.personName}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 text-right">
        <span className="text-xs text-gray-500">{filteredTransactions.length} records</span>
      </div>
    </div>
  );
};

export default Reports;
