import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Download, FileText, Filter, Calendar, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  transactions: Transaction[];
}

const Reports: React.FC<Props> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'All' || t.type === filterType;

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
      }
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        matchesDate = matchesDate && new Date(t.date) < nextDay;
      }

      return matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, startDate, endDate]);

  const downloadExcel = () => {
    const headers = ["Date", "Type", "Item Name", "Quantity", "Unit", "Location", "Person", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => {
        const safeName = `"${t.itemName.replace(/"/g, '""')}"`;
        const safePerson = `"${t.personName.replace(/"/g, '""')}"`;
        const safeNotes = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : "";
        return [
          new Date(t.date).toLocaleDateString(),
          t.type,
          safeName,
          t.quantity,
          t.unit || '',
          t.location,
          safePerson,
          safeNotes
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `satyam_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Satyam Mall - Inventory Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = `Generated on: ${new Date().toLocaleDateString()} | Filter: ${filterType}`;
    doc.text(dateStr, 14, 30);

    const tableColumn = ["Date", "Type", "Item", "Qty", "Loc", "Person"];
    const tableRows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.itemName,
      `${t.quantity} ${t.unit || ''}`,
      t.location,
      t.personName
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 233] }
    });

    doc.save(`satyam_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <FileText className="text-brand-500" size={20} />
                </div>
                Transaction Reports
              </h2>
              <p className="text-sm text-slate-500 mt-1 ml-13">View and download history of Issues and Receipts</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
              >
                <FileText size={18} />
                Excel
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Transaction Type</label>
              <div className="relative">
                <Filter className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <select
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 text-sm appearance-none cursor-pointer focus:border-brand-500 focus:outline-none bg-white"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value={TransactionType.ISSUE}>Issue (Out)</option>
                  <option value={TransactionType.RECEIVE}>Receive (In)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type="date"
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 text-sm focus:border-brand-500 focus:outline-none bg-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type="date"
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 text-sm focus:border-brand-500 focus:outline-none bg-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setFilterType('All'); setStartDate(''); setEndDate(''); }}
                className="w-full py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Person</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                        t.type === TransactionType.RECEIVE
                          ? 'bg-green-50 text-green-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {t.type === TransactionType.RECEIVE ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{t.itemName}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{t.quantity}</span>
                      <span className="text-slate-400 text-xs ml-1">{t.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.location}</td>
                    <td className="px-6 py-4 text-slate-600">{t.personName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
          <span className="text-xs text-slate-500">
            Showing {filteredTransactions.length} records
          </span>
        </div>
      </div>
    </div>
  );
};

export default Reports;
