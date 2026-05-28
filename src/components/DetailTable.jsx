import React from 'react';
import { ShoppingCart, Truck, Calendar, Activity, Trash2 } from 'lucide-react';

const DetailTable = ({ date, procurementDetails, consumptionDetails, onDelete, unit }) => {
  if (!date) return (
    <div className="bg-white/30 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
      <p className="text-slate-500 text-sm">點擊圖表中的節點以查看當日詳情</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 採購明細區塊 */}
      <div className="bg-white/50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
            <ShoppingCart className="w-4 h-4" />
            採購日誌 - {date}
          </h3>
        </div>
        
        {procurementDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200/50">
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">物料/商</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">數量</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">總額</th>
                  <th className="px-4 py-3 text-[10px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {procurementDetails.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-100/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{item.type}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {item.supplier}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.quantity} {unit}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono font-bold">${(item.totalAmount || item.totalPrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => onDelete('procurement', item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="刪除紀錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs italic">本日無採購紀錄</div>
        )}
      </div>

      {/* 理論消耗區塊 */}
      <div className="bg-white/50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-red-500/10 p-4 border-b border-red-500/20 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-red-400 text-sm">
            <Activity className="w-4 h-4" />
            理論消耗 - {date}
          </h3>
        </div>
        
        {consumptionDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200/50">
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">工序 (Stage)</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">消耗量</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">所需人力</th>
                  <th className="px-4 py-3 text-[10px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {consumptionDetails.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-100/30 transition-colors group">
                    <td className="px-4 py-3 text-slate-800 font-medium">{item.stage}</td>
                    <td className="px-4 py-3 text-red-400 font-mono font-bold">{item.theoreticalQuantity} {unit}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{item.manpower ? `${item.manpower} 人` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => onDelete('consumption', item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="刪除紀錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs italic">本日無預計消耗</div>
        )}
      </div>
    </div>
  );
};

export default DetailTable;
