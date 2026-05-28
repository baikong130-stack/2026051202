import React from 'react';
import { AlertTriangle, ChevronRight, Phone, Star } from 'lucide-react';

const RiskBanner = ({ isVisible, materialName, defaultSuppliers, onQuickReplenish }) => {
  if (!isVisible) return null;

  const bestSupplier = defaultSuppliers?.length > 0 
    ? defaultSuppliers.reduce((min, s) => s.cost < min.cost ? s : min, defaultSuppliers[0])
    : null;

  return (
    <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-2 rounded-full animate-pulse">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">斷料預警：當前庫存不足以支撐未來三天的工程計畫</p>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-semibold">Critical Inventory Risk Detected</p>
        </div>
      </div>

      {bestSupplier && (
        <div className="flex items-center gap-3 bg-red-600/50 px-4 py-2 rounded-lg border border-red-400/30">
          <div className="text-right">
            <div className="text-xs opacity-90 font-medium flex items-center justify-end gap-1">
              <Star className="w-3 h-3 text-yellow-300" fill="currentColor" />
              推薦聯絡 ({materialName}): {bestSupplier.name}
            </div>
            <div className="text-xs font-bold">{bestSupplier.contact}</div>
          </div>
          <button 
            className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm flex items-center gap-1 text-xs font-bold"
            title={`一鍵補貨 (成本 $${bestSupplier.cost})`}
            onClick={() => onQuickReplenish && onQuickReplenish(bestSupplier)}
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskBanner;
