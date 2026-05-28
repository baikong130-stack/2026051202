import React, { useMemo, useState, useEffect } from 'react';
import { Calculator, Calendar, Info, RotateCcw } from 'lucide-react';

const DateRangeAggregator = ({ procurements, consumptions, unit, materialName }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 取得兩個數據集中所有不重複的日期
  const allDates = useMemo(() => {
    const dates = Array.from(new Set([
      ...procurements.map(p => p.date),
      ...consumptions.map(c => c.date)
    ])).sort();
    return dates;
  }, [procurements, consumptions]);

  // 當材料切換時，如果目前的日期不在新列表中，則重置日期
  useEffect(() => {
    if (startDate && !allDates.includes(startDate)) setStartDate('');
    if (endDate && !allDates.includes(endDate)) setEndDate('');
  }, [allDates, startDate, endDate]);

  const stats = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    // 確保開始日期早於或等於結束日期
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    
    const totalProcured = procurements
      .filter(p => p.date >= start && p.date <= end)
      .reduce((sum, p) => sum + p.quantity, 0);
      
    const totalConsumed = consumptions
      .filter(c => c.date >= start && c.date <= end)
      .reduce((sum, c) => sum + c.theoreticalQuantity, 0);
      
    return { totalProcured, totalConsumed, start, end };
  }, [startDate, endDate, procurements, consumptions]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white/50 border border-slate-200 rounded-3xl p-6 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-500 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>
          區間加總計算器
        </h3>
        {(startDate || endDate) && (
          <button 
            onClick={handleReset}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> 重置
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">開始日期</label>
          <div className="relative group">
            <select 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all group-hover:border-slate-300 shadow-inner"
            >
              <option value="">選擇日期</option>
              {allDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">結束日期</label>
          <div className="relative group">
            <select 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer transition-all group-hover:border-slate-300 shadow-inner"
            >
              <option value="">選擇日期</option>
              {allDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {stats ? (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 py-2 px-3 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-4">
             <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
             <p className="text-[10px] font-medium text-blue-300 leading-tight">
               正在核算 {stats.start} 至 {stats.end} 的 {materialName} 數據
             </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 group hover:border-emerald-500/30 transition-all shadow-inner">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">區間總採購量</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{stats.totalProcured.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{unit}</span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 group hover:border-red-500/30 transition-all shadow-inner">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">區間總理論消耗</span>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-400">{stats.totalConsumed.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{unit}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/20">
          <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
            請選擇日期區間<br/>以核算物料總量
          </p>
        </div>
      )}
    </div>
  );
};

export default DateRangeAggregator;
