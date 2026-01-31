import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IssueReceiveForm from './components/IssueReceiveForm';
import InventoryTable from './components/InventoryTable';
import Reports from './components/Reports';
import Login from './components/Login';
import { InventoryItem, Transaction, TransactionType } from './types';
import { fetchInventory, fetchTransactions, getStoredConfig, saveConfig } from './services/sheetService';
import { Save, Database, CheckCircle, Loader2 } from 'lucide-react';

interface UserSession {
  username: string;
  role: string;
  loginTime: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('satyam_mall_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as UserSession;
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('satyam_mall_user');
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    const invData = await fetchInventory();
    const transData = await fetchTransactions();
    setInventory(invData);
    setTransactions(transData);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      setSheetUrl(getStoredConfig());
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (_username: string) => {
    const storedUser = localStorage.getItem('satyam_mall_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('satyam_mall_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSheetConfigSave = () => {
    saveConfig(sheetUrl);
    alert('Configuration Saved! Reloading data...');
    loadData();
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-brand-500 animate-spin" />
            <p className="text-slate-500">Loading data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} transactions={transactions} />;
      case 'issue':
        return <IssueReceiveForm type={TransactionType.ISSUE} inventory={inventory} onSuccess={loadData} />;
      case 'receive':
        return <IssueReceiveForm type={TransactionType.RECEIVE} inventory={inventory} onSuccess={loadData} />;
      case 'inventory':
        return <InventoryTable inventory={inventory} onRefresh={loadData} />;
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Database size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Google Sheet Connection</h2>
                    <p className="text-brand-100 text-sm mt-1">Connect your inventory database</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Web App URL</label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="input-field"
                  />
                </div>

                <button
                  onClick={handleSheetConfigSave}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg"
                >
                  <Save size={20} />
                  Save & Connect
                </button>

                {sheetUrl && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Connected to Google Sheet</span>
                  </div>
                )}
              </div>

              <div className="px-8 pb-8">
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <h4 className="font-bold text-amber-700 text-sm mb-3 uppercase tracking-wider">Setup Instructions</h4>
                  <ol className="space-y-2 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                      <span>Create a Google Sheet with tabs: <b className="text-slate-800">Inventory</b> & <b className="text-slate-800">Transactions</b></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                      <span>Go to Extensions - Apps Script</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                      <span>Paste the code from <code className="bg-slate-100 px-2 py-0.5 rounded text-brand-600">GOOGLE_APPS_SCRIPT.js</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                      <span>Run <b className="text-slate-800">setupSheets</b> function first</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                      <span>Deploy as Web App (Access: Anyone)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">6</span>
                      <span>Paste URL above and connect</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {renderContent()}
      </main>
      <footer className="bg-white py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        &copy; {new Date().getFullYear()} Satyam Mall Facility Management System. <span className="text-brand-500 font-medium">Since 1989</span>
      </footer>
    </div>
  );
};

export default App;
