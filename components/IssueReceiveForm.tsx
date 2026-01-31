import React, { useState, useEffect, useRef } from 'react';
import { TransactionType, InventoryItem, FloorLocation } from '../types';
import { submitTransaction, uploadFileToDrive } from '../services/sheetService';
import { CheckCircle, AlertCircle, Loader2, ArrowUpRight, ArrowDownLeft, Package, Upload, X, FileImage } from 'lucide-react';

interface Props {
  type: TransactionType;
  inventory: InventoryItem[];
  onSuccess: () => void;
}

const IssueReceiveForm: React.FC<Props> = ({ type, inventory, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: '',
    location: '',
    personName: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.itemName) {
      const item = inventory.find(i => i.name === formData.itemName);
      if (item) {
        setFormData(prev => ({ ...prev, unit: item.unit }));
      }
    }
  }, [formData.itemName, inventory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const selectedItem = inventory.find(i => i.name === formData.itemName);
    if (type === TransactionType.ISSUE) {
       if (!selectedItem) {
         setMessage({ type: 'error', text: 'Please select a valid item.' });
         setLoading(false);
         return;
       }
       if (selectedItem.quantity < Number(formData.quantity)) {
         setMessage({ type: 'error', text: `Insufficient stock! Only ${selectedItem.quantity} ${selectedItem.unit} available.` });
         setLoading(false);
         return;
       }
    }

    // Upload file first if receiving and file selected
    let uploadedFileUrl = '';
    if (type === TransactionType.RECEIVE && selectedFile) {
      setUploadingFile(true);
      try {
        const fileResult = await uploadFileToDrive(selectedFile, formData.itemName);
        if (fileResult.success && fileResult.fileUrl) {
          uploadedFileUrl = fileResult.fileUrl;
        }
      } catch (error) {
        console.error('File upload error:', error);
      }
      setUploadingFile(false);
    }

    const success = await submitTransaction({
      type,
      itemName: formData.itemName,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      location: formData.location,
      personName: formData.personName,
      notes: uploadedFileUrl ? `${formData.notes} [File: ${uploadedFileUrl}]` : formData.notes
    });

    if (success) {
      setMessage({ type: 'success', text: 'Transaction recorded successfully!' });
      setFormData({ itemName: '', quantity: '', unit: '', location: '', personName: '', notes: '' });
      removeFile();
      onSuccess();
    } else {
      setMessage({ type: 'error', text: 'Failed to record transaction. Check connection.' });
    }
    setLoading(false);
  };

  const isIssue = type === TransactionType.ISSUE;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-6 ${isIssue ? 'bg-gradient-to-r from-orange-500 to-coral-500' : 'bg-gradient-to-r from-green-500 to-mint-500'}`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              {isIssue ? <ArrowUpRight size={28} className="text-white" /> : <ArrowDownLeft size={28} className="text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isIssue ? 'Issue Item (Stock Out)' : 'Receive Item (Stock In)'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {isIssue ? 'Distribute items to Satyam Mall floors' : 'Add new stock to the inventory'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
            {isIssue ? (
              <select
                required
                className="input-field appearance-none cursor-pointer"
                value={formData.itemName}
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              >
                <option value="">Select Item</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.name} (Available: {item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <Package className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="text"
                  required
                  list="item-suggestions"
                  placeholder="Enter Item Name"
                  className="input-field pl-12"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                />
                <datalist id="item-suggestions">
                  {inventory.map(item => <option key={item.id} value={item.name} />)}
                </datalist>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                placeholder="0.00"
                className="input-field"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
              <input
                type="text"
                required
                placeholder="e.g. pcs, kg"
                className={`input-field ${isIssue ? 'bg-slate-50' : ''}`}
                value={formData.unit}
                readOnly={isIssue}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {isIssue ? 'Destination' : 'Storage Location'}
              </label>
              <select
                required
                className="input-field appearance-none cursor-pointer"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              >
                <option value="">Select</option>
                {Object.values(FloorLocation).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                {!isIssue && <option value="Vendor">Vendor</option>}
              </select>
            </div>
          </div>

          {/* Person */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {isIssue ? 'Receiver Name (Staff)' : 'Supplier / Deliverer Name'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul (HK Supervisor)"
              className="input-field"
              value={formData.personName}
              onChange={(e) => setFormData({...formData, personName: e.target.value})}
            />
          </div>

          {/* File Upload - Only for RECEIVE */}
          {!isIssue && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Upload Invoice/Photo (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="file-upload flex flex-col items-center justify-center py-8 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
                    <Upload size={24} className="text-brand-500" />
                  </div>
                  <p className="text-slate-600 font-medium">Click to upload file</p>
                  <p className="text-slate-400 text-sm mt-1">Invoice, receipt or photo</p>
                </div>
              ) : (
                <div className="file-upload has-file p-4">
                  <div className="flex items-center gap-4">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center">
                        <FileImage size={24} className="text-green-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Any additional notes..."
              className="input-field"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingFile}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all
              ${isIssue
                ? 'btn-warning'
                : 'btn-success'}
              disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2
            `}
          >
            {(loading || uploadingFile) && <Loader2 className="animate-spin" size={22} />}
            {uploadingFile ? 'Uploading File...' : (loading ? 'Processing...' : (isIssue ? 'CONFIRM ISSUE' : 'CONFIRM RECEIPT'))}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssueReceiveForm;
