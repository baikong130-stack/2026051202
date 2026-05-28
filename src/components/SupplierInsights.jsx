import React, { useState } from 'react';
import { Award, Layers, ExternalLink, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

const SupplierInsights = ({ stats, materialType, allProcurements, unit }) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // 取得選定供應商的歷史採購紀錄，並按日期降序排列
  const supplierHistory = selectedSupplier 
    ? allProcurements
        .filter(p => p.supplier === selectedSupplier)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="bg-white/50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col min-h-[450px]">
      <div className="bg-blue-500/10 p-5 border-b border-blue-500/20 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-black text-blue-400 uppercase tracking-tighter text-sm">
          <Award className="w-4 h-4" />
          供應商表現排行 ({materialType})
        </h3>
        <span className="text-[10px] font-black bg-blue-500/20 px-2.5 py-1 rounded-full text-blue-400 uppercase tracking-widest">
          Market Insight
        </span>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide">
        {stats.map((s, idx) => {
          const isSelected = selectedSupplier === s.name;
          
          return (
            <div key={idx} className="space-y-2">
              <div 
                onClick={() => setSelectedSupplier(isSelected ? null : s.name)}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border group ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' 
                    : 'bg-slate-100/30 border-slate-300/30 hover:bg-slate-100/50 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner transition-transform group-hover:scale-110 ${
                    idx === 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-200/30 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                      {s.name}
                      {idx === 0 && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Best Price</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-tight mt-0.5">
                      <Layers className="w-3 h-3" /> 累計供貨: <span className="text-slate-700">{s.totalQty.toLocaleString()} {unit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">${s.avgPrice.toFixed(1)}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg. Price</div>
                  </div>
                  {isSelected ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* 詳情清單 */}
              {isSelected && (
                <div className="mx-2 bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300 shadow-inner">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="bg-white/80 text-slate-500 border-b border-slate-200">
                        <th className="px-4 py-2 font-black uppercase tracking-widest">日期</th>
                        <th className="px-4 py-2 font-black uppercase tracking-widest">數量</th>
                        <th className="px-4 py-2 font-black uppercase tracking-widest text-right">單價</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {supplierHistory.map((item, hIdx) => (
                        <tr key={hIdx} className="hover:bg-blue-500/5 transition-colors group">
                          <td className="px-4 py-2.5 text-slate-400 font-medium">{item.date}</td>
                          <td className="px-4 py-2.5 text-slate-800 font-bold">{item.quantity} {unit}</td>
                          <td className="px-4 py-2.5 text-right font-black text-blue-400">
                            ${(item.totalAmount / item.quantity).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="text-center py-10">
            <ShoppingBag className="w-10 h-10 text-slate-800 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium italic">暫無供應商數據</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-100/20 border-t border-slate-200 mt-auto">
        <button className="w-full text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all">
          查看完整採購合約
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SupplierInsights;
