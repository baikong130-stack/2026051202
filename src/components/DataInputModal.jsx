import React, { useState } from 'react';
import { X, Plus, ShoppingCart, Activity, Save, Trash2 } from 'lucide-react';

const DataInputModal = ({ isOpen, onClose, onSave, materialType, unit }) => {
  const [activeTab, setActiveTab] = useState('procurement');
  
  const today = new Date().toISOString().split('T')[0];
  const defaultProcurement = { date: today, quantity: '', totalAmount: '', supplier: '' };
  const defaultConsumption = { date: today, stage: '', theoreticalQuantity: '', manpower: '' };

  const [procurementEntries, setProcurementEntries] = useState([{ ...defaultProcurement }]);
  const [consumptionEntries, setConsumptionEntries] = useState([{ ...defaultConsumption }]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeTab === 'procurement') {
      const dataToSave = procurementEntries.map(data => ({
        type: materialType,
        date: data.date,
        quantity: Number(data.quantity),
        totalAmount: Number(data.totalAmount),
        supplier: data.supplier
      }));
      onSave('procurement', dataToSave);
      setProcurementEntries([{ ...defaultProcurement }]);
    } else {
      const dataToSave = consumptionEntries.map(data => ({
        type: materialType,
        date: data.date,
        stage: data.stage,
        theoreticalQuantity: Number(data.theoreticalQuantity),
        manpower: data.manpower ? Number(data.manpower) : undefined
      }));
      onSave('consumption', dataToSave);
      setConsumptionEntries([{ ...defaultConsumption }]);
    }
    onClose();
  };

  const handleClose = () => {
    setProcurementEntries([{ ...defaultProcurement }]);
    setConsumptionEntries([{ ...defaultConsumption }]);
    onClose();
  };

  const updateEntry = (type, index, field, value) => {
    if (type === 'procurement') {
      const newEntries = [...procurementEntries];
      newEntries[index][field] = value;
      setProcurementEntries(newEntries);
    } else {
      const newEntries = [...consumptionEntries];
      newEntries[index][field] = value;
      setConsumptionEntries(newEntries);
    }
  };

  const addEntry = (type) => {
    if (type === 'procurement') {
      setProcurementEntries([...procurementEntries, { ...defaultProcurement }]);
    } else {
      setConsumptionEntries([...consumptionEntries, { ...defaultConsumption }]);
    }
  };

  const removeEntry = (type, index) => {
    if (type === 'procurement') {
      const newEntries = procurementEntries.filter((_, i) => i !== index);
      setProcurementEntries(newEntries);
    } else {
      const newEntries = consumptionEntries.filter((_, i) => i !== index);
      setConsumptionEntries(newEntries);
    }
  };

  const entries = activeTab === 'procurement' ? procurementEntries : consumptionEntries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-100/30 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="text-emerald-500" />
            新增紀錄 - {materialType}
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('procurement')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'procurement' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-100/20' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ShoppingCart className="w-4 h-4" /> 採購錄入
          </button>
          <button 
            onClick={() => setActiveTab('consumption')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'consumption' ? 'text-red-400 border-b-2 border-red-500 bg-slate-100/20' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Activity className="w-4 h-4" /> 進度錄入
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'procurement' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr_1fr_1.5fr_40px] gap-4 mb-2 px-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">日期</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">數量 ({unit})</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">總額 ($)</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">供應商資訊</div>
                  <div></div>
                </div>
                {procurementEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-[140px_1fr_1fr_1.5fr_40px] gap-4 items-center bg-slate-100/30 p-2 rounded-xl border border-slate-300/50">
                    <input type="date" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/50" value={entry.date} onChange={e => updateEntry('procurement', index, 'date', e.target.value)} />
                    <input type="number" required placeholder="例如: 50" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.quantity} onChange={e => updateEntry('procurement', index, 'quantity', e.target.value)} />
                    <input type="number" required placeholder="例如: 150000" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.totalAmount} onChange={e => updateEntry('procurement', index, 'totalAmount', e.target.value)} />
                    <input type="text" required placeholder="例如: 遠東鋼鐵" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.supplier} onChange={e => updateEntry('procurement', index, 'supplier', e.target.value)} />
                    <button type="button" onClick={() => removeEntry('procurement', index)} disabled={procurementEntries.length === 1} className={`p-2 rounded-lg transition-colors flex items-center justify-center ${procurementEntries.length === 1 ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-red-400 hover:bg-slate-100'}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1.5fr_1fr_1fr_40px] gap-4 mb-2 px-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">日期</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">工程工序 (Stage)</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">應耗量 ({unit})</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">需人力 (人)</div>
                  <div></div>
                </div>
                {consumptionEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-[140px_1.5fr_1fr_1fr_40px] gap-4 items-center bg-slate-100/30 p-2 rounded-xl border border-slate-300/50">
                    <input type="date" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/50" value={entry.date} onChange={e => updateEntry('consumption', index, 'date', e.target.value)} />
                    <input type="text" required placeholder="例如: 地下室底板灌漿" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.stage} onChange={e => updateEntry('consumption', index, 'stage', e.target.value)} />
                    <input type="number" required placeholder="例如: 40" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.theoreticalQuantity} onChange={e => updateEntry('consumption', index, 'theoreticalQuantity', e.target.value)} />
                    <input type="number" required placeholder="例如: 15" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800" value={entry.manpower} onChange={e => updateEntry('consumption', index, 'manpower', e.target.value)} />
                    <button type="button" onClick={() => removeEntry('consumption', index)} disabled={consumptionEntries.length === 1} className={`p-2 rounded-lg transition-colors flex items-center justify-center ${consumptionEntries.length === 1 ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-red-400 hover:bg-slate-100'}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              type="button" 
              onClick={() => addEntry(activeTab)} 
              className="mt-4 px-4 py-2 text-sm font-bold text-slate-400 border border-slate-300 rounded-lg border-dashed hover:bg-slate-100 hover:text-slate-800 hover:border-slate-500 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增一列
            </button>
          </div>

          <div className="p-6 border-t border-slate-200 bg-white flex-shrink-0">
            <button 
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white ${activeTab === 'procurement' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'}`}
            >
              <Save className="w-5 h-5" />
              批量儲存 ({entries.length} 筆)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataInputModal;
