import React, { useState } from 'react';
import { X, Package, TrendingUp, CheckCircle2, ShoppingCart } from 'lucide-react';

const ReplenishModal = ({ isOpen, onClose, onConfirm, data }) => {
  const [selectedStrategy, setSelectedStrategy] = useState('safe_stock');

  if (!isOpen || !data) return null;

  const { supplier, currentInventory, capacity, materialName, orderDate, exactShortageConsQty } = data;

  // Option 1: 補足 15% 安全庫存
  const targetInventory = capacity * 0.15;
  let safeStockQty = targetInventory - currentInventory;
  if (safeStockQty <= 0) safeStockQty = capacity * 0.15;
  safeStockQty = Math.ceil(safeStockQty);
  const safeStockCost = safeStockQty * supplier.cost;

  // Option 2: 依理論消耗 +5% 損耗
  const exactConsQty = Math.ceil(exactShortageConsQty * 1.05);
  const exactConsCost = exactConsQty * supplier.cost;

  const handleConfirm = () => {
    if (selectedStrategy === 'safe_stock') {
      onConfirm({
        date: orderDate || new Date().toISOString().split('T')[0],
        type: materialName,
        quantity: safeStockQty,
        supplier: supplier.name,
        unitPrice: supplier.cost,
        totalAmount: safeStockCost
      });
    } else {
      onConfirm({
        date: orderDate || new Date().toISOString().split('T')[0],
        type: materialName,
        quantity: exactConsQty,
        supplier: supplier.name,
        unitPrice: supplier.cost,
        totalAmount: exactConsCost
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-emerald-500 w-6 h-6" />
            自動叫料策略選擇
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-white rounded-full p-1 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-sm text-slate-500 font-bold mb-1">預計叫料資訊</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">材料:</span>
                <span className="font-black text-slate-700">{materialName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">建議叫料日:</span>
                <span className="font-black text-emerald-600">{orderDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">供應商:</span>
                <span className="font-black text-slate-700">{supplier.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">單價:</span>
                <span className="font-black text-slate-700">${supplier.cost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-black text-slate-800 uppercase tracking-widest">請選擇補貨策略</div>
            
            {/* Option 1 */}
            <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedStrategy === 'safe_stock' 
                ? 'border-emerald-500 bg-emerald-50/30 shadow-md' 
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedStrategy === 'safe_stock' ? 'border-emerald-500' : 'border-slate-300'
                  }`}>
                    {selectedStrategy === 'safe_stock' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={selectedStrategy === 'safe_stock'} 
                    onChange={() => setSelectedStrategy('safe_stock')} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-500" />
                      補足倉庫 15% (安全庫存)
                    </div>
                    <div className="text-xl font-black text-emerald-600">
                      {safeStockQty.toLocaleString()} <span className="text-sm text-slate-500 font-bold">單位</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-3">
                    系統自動計算當前庫存與 15% 倉庫容量的差額，確保維持基本安全庫存量。
                  </p>
                  <div className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    預估花費: <span className="text-emerald-600">${safeStockCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </label>

            {/* Option 2 */}
            <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedStrategy === 'exact_cons' 
                ? 'border-blue-500 bg-blue-50/30 shadow-md' 
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedStrategy === 'exact_cons' ? 'border-blue-500' : 'border-slate-300'
                  }`}>
                    {selectedStrategy === 'exact_cons' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={selectedStrategy === 'exact_cons'} 
                    onChange={() => setSelectedStrategy('exact_cons')} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      單項消耗 +5% 損耗 (精準叫料)
                    </div>
                    <div className="text-xl font-black text-blue-600">
                      {exactConsQty.toLocaleString()} <span className="text-sm text-slate-500 font-bold">單位</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-3">
                    針對觸發預警的單筆理論消耗量（{exactShortageConsQty.toLocaleString()} 單位），加上 5% 的工程損耗進行叫料，降低資金積壓。
                  </p>
                  <div className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    預估花費: <span className="text-blue-600">${exactConsCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleConfirm}
            className={`px-8 py-3 rounded-xl font-black text-white flex items-center gap-2 transition-all shadow-lg ${
              selectedStrategy === 'safe_stock' 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            確認建立採購單
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplenishModal;
