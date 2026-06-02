import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Play, RotateCcw, AlertTriangle, CheckCircle2, Clock, ChevronDown, Download, Package, Sparkles } from 'lucide-react';
import { calculateCPM } from '../utils/cpmUtils';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getActivityLabel = (index) => {
  if (index < 26) return LETTERS[index];
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return LETTERS[first] + LETTERS[second];
};

const SchedulePanel = ({ selectedSite, materials = [], setMaterials }) => {
  // 從 localStorage 讀取排程資料
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(`dashboard_schedule_${selectedSite}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [
      { id: 'A', name: '', duration: '', predecessors: [], materials: '', materialQty: '' },
    ];
  });

  const [results, setResults] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const tableEndRef = useRef(null);

  // 當工地改變時重新載入資料
  useEffect(() => {
    const saved = localStorage.getItem(`dashboard_schedule_${selectedSite}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivities(parsed);
        // 自動計算已儲存的有效資料
        const valid = parsed.filter(a => a.name && a.duration > 0);
        if (valid.length > 0) {
          setResults(calculateCPM(valid));
          setHasCalculated(true);
        } else {
          setResults(null);
          setHasCalculated(false);
        }
      } catch (e) {
        setActivities([{ id: 'A', name: '', duration: '', predecessors: [], materials: '', materialQty: '' }]);
        setResults(null);
        setHasCalculated(false);
      }
    } else {
      setActivities([{ id: 'A', name: '', duration: '', predecessors: [], materials: '', materialQty: '' }]);
      setResults(null);
      setHasCalculated(false);
    }
  }, [selectedSite]);

  // 儲存到 localStorage
  useEffect(() => {
    localStorage.setItem(`dashboard_schedule_${selectedSite}`, JSON.stringify(activities));
  }, [activities, selectedSite]);

  // 新增作業列
  const addActivity = () => {
    const newId = getActivityLabel(activities.length);
    setActivities([...activities, { id: newId, name: '', duration: '', predecessors: [], materials: '', materialQty: '' }]);
    // 滾動到底部
    setTimeout(() => tableEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 自動將新材料同步到物料管理清單
  const autoAddMaterial = useCallback((materialName) => {
    if (!materialName || !materialName.trim() || !setMaterials) return;
    const trimmed = materialName.trim();
    const exists = materials.some(m => m.name === trimmed);
    if (!exists) {
      setMaterials(prev => [...prev, { name: trimmed, unit: 'Unit' }]);
    }
  }, [materials, setMaterials]);

  // 追蹤哪些材料是從排程自動新增的（用於顯示提示）
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const handleMaterialBlur = useCallback((materialName) => {
    if (!materialName || !materialName.trim() || !setMaterials) return;
    const trimmed = materialName.trim();
    const exists = materials.some(m => m.name === trimmed);
    if (!exists) {
      setMaterials(prev => [...prev, { name: trimmed, unit: 'Unit' }]);
      setRecentlyAdded(prev => {
        const updated = [...prev, trimmed];
        // 3 秒後移除提示
        setTimeout(() => {
          setRecentlyAdded(p => p.filter(n => n !== trimmed));
        }, 3000);
        return updated;
      });
    }
  }, [materials, setMaterials]);

  // 刪除作業列
  const removeActivity = (index) => {
    if (activities.length <= 1) return;
    const removedId = activities[index].id;
    const newActivities = activities
      .filter((_, i) => i !== index)
      .map((act, i) => ({
        ...act,
        id: getActivityLabel(i),
        predecessors: act.predecessors
          .filter(p => p !== removedId)
          .map(p => {
            const oldIndex = activities.findIndex(a => a.id === p);
            if (oldIndex > index) return getActivityLabel(oldIndex - 1);
            return p;
          }),
      }));
    setActivities(newActivities);
    setResults(null);
    setHasCalculated(false);
  };

  // 更新作業欄位
  const updateActivity = (index, field, value) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  // 切換前置作業
  const togglePredecessor = (actIndex, predId) => {
    const act = activities[actIndex];
    const newPreds = act.predecessors.includes(predId)
      ? act.predecessors.filter(p => p !== predId)
      : [...act.predecessors, predId];
    updateActivity(actIndex, 'predecessors', newPreds);
  };

  // 執行計算
  const handleCalculate = () => {
    const validActivities = activities.filter(a => a.name.trim() && Number(a.duration) > 0);
    if (validActivities.length === 0) {
      alert('請至少填寫一筆有效的作業資料（名稱和工期）！');
      return;
    }

    const parsed = validActivities.map(a => ({
      ...a,
      duration: Number(a.duration),
    }));

    const result = calculateCPM(parsed);
    setResults(result);
    setHasCalculated(true);
  };

  // 重置
  const handleReset = () => {
    if (window.confirm('確定要清除所有排程資料嗎？')) {
      setActivities([{ id: 'A', name: '', duration: '', predecessors: [], materials: '', materialQty: '' }]);
      setResults(null);
      setHasCalculated(false);
    }
  };

  // 匯出排程為文字
  const handleExportSchedule = () => {
    if (!results) return;
    let text = `工程排程分析報告 - ${selectedSite}\n`;
    text += `${'='.repeat(80)}\n`;
    text += `專案總工期: ${results.projectDuration} 天\n`;
    text += `要徑作業: ${results.criticalActivities.join(' → ')}\n\n`;
    text += `${'─'.repeat(80)}\n`;
    text += `作業\t名稱\t\t所需材料\t數量\t工期\t前置\tES\tEF\tLS\tLF\t總浮時\t自由浮時\t要徑\n`;
    text += `${'─'.repeat(80)}\n`;
    results.results.forEach(r => {
      text += `${r.id}\t${r.name}\t\t${r.materials || '-'}\t\t${r.materialQty || '-'}\t${r.duration}\t${r.predecessors.join(',') || '-'}\t${r.es}\t${r.ef}\t${r.ls}\t${r.lf}\t${r.totalFloat}\t${r.freeFloat}\t\t${r.isCritical ? '★' : ''}\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `排程分析_${selectedSite}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 取得可選的前置作業清單 (排除自己和之後的作業)
  const getAvailablePredecessors = (currentIndex) => {
    return activities.slice(0, currentIndex).map(a => ({ id: a.id, name: a.name }));
  };

  // 從排程清單中彙整所有不重複的材料
  const scheduleMaterials = useMemo(() => {
    const map = {};
    activities.forEach(a => {
      if (a.materials && a.materials.trim()) {
        const key = a.materials.trim();
        if (!map[key]) map[key] = 0;
        if (a.materialQty) map[key] += Number(a.materialQty) || 0;
      }
    });
    return Object.entries(map).map(([name, totalQty]) => ({ name, totalQty }));
  }, [activities]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
              <Clock className="text-indigo-500 w-6 h-6" />
            </div>
            工程排程分析 (CPM)
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            批次新增作業，自動計算要徑法 (Critical Path Method) 分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          {results && (
            <button
              onClick={handleExportSchedule}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/50 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> 匯出分析
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-300/50 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> 重置
          </button>
        </div>
      </div>

      {/* 作業輸入區 */}
      <div className="bg-slate-50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-300/50 overflow-hidden">
        <div className="p-6 border-b border-slate-300/50 bg-gradient-to-r from-indigo-100 to-purple-100">
          <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            工程作業清單
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">輸入作業名稱、工期及前置作業，一次新增多筆作業</p>
        </div>

        <div className="p-6">
          {/* 表頭 */}
          <div className="grid grid-cols-[50px_1.2fr_1fr_80px_80px_1fr_40px] gap-4 mb-3 px-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">編號</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">作業名稱</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">所需材料</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">數量</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">工期(天)</div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">前置作業</div>
            <div></div>
          </div>

          {/* 作業列表 */}
          <div className="space-y-2">
            {activities.map((act, index) => (
              <ActivityRow
                key={`${act.id}-${index}`}
                activity={act}
                index={index}
                availablePredecessors={getAvailablePredecessors(index)}
                onUpdate={updateActivity}
                onTogglePred={togglePredecessor}
                onRemove={removeActivity}
                canRemove={activities.length > 1}
                onMaterialBlur={handleMaterialBlur}
              />
            ))}
            <div ref={tableEndRef} />
          </div>

          {/* 新增列按鈕 */}
          <button
            onClick={addActivity}
            className="mt-4 w-full py-3 text-sm font-bold text-slate-600 border-2 border-slate-300 rounded-xl border-dashed hover:bg-indigo-100 hover:text-indigo-600 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> 新增作業 ({getActivityLabel(activities.length)})
          </button>
        </div>

        {/* 排程材料彙整 & 同步提示 */}
        {scheduleMaterials.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-black text-indigo-900 uppercase tracking-tight">本排程所需材料</span>
                <span className="ml-auto text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  已自動同步至物料管理
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {scheduleMaterials.map(({ name, totalQty }) => {
                  const isNew = recentlyAdded.includes(name);
                  const existsInMgmt = materials.some(m => m.name === name);
                  return (
                    <div
                      key={name}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-500 ${
                        isNew
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800 animate-pulse'
                          : existsInMgmt
                          ? 'bg-white border-indigo-200 text-indigo-700'
                          : 'bg-amber-50 border-amber-300 text-amber-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isNew ? 'bg-emerald-500' : existsInMgmt ? 'bg-indigo-400' : 'bg-amber-400'
                      }`} />
                      {name}
                      {totalQty > 0 && (
                        <span className="opacity-70">× {totalQty.toLocaleString()}</span>
                      )}
                      {isNew && (
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 計算按鈕 */}
        <div className="p-6 border-t border-slate-300/50 bg-gradient-to-r from-slate-100 to-slate-50">
          <button
            onClick={handleCalculate}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:translate-y-[-2px] active:translate-y-0"
          >
            <Play className="w-5 h-5" /> 計算排程分析
          </button>
        </div>
      </div>

      {/* 分析結果區 */}
      {hasCalculated && results && (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 摘要 */}
          <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-emerald-50/50 to-cyan-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  排程分析結果
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  共 {results.results.length} 項作業 · 要徑作業 {results.criticalActivities.length} 項
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-lg">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">專案總工期</div>
                  <div className="text-3xl font-black text-indigo-600 tracking-tighter">
                    {results.projectDuration} <span className="text-base text-slate-400">天</span>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white rounded-2xl border border-red-200 shadow-lg">
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">要徑</div>
                  <div className="text-lg font-black text-red-600 tracking-tight">
                    {results.criticalActivities.join(' → ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 結果表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100/80">
                  <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">編號</th>
                  <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">作業名稱</th>
                  <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">所需材料</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">數量</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">工期</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">前置作業</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-indigo-600 uppercase tracking-wider bg-indigo-50/50">ES</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-indigo-600 uppercase tracking-wider bg-indigo-50/50">EF</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-purple-600 uppercase tracking-wider bg-purple-50/50">LS</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-purple-600 uppercase tracking-wider bg-purple-50/50">LF</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-amber-600 uppercase tracking-wider bg-amber-50/50">總浮時</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-amber-600 uppercase tracking-wider bg-amber-50/50">自由浮時</th>
                  <th className="px-4 py-4 text-center text-xs font-black text-red-600 uppercase tracking-wider">要徑</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.results.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      r.isCritical
                        ? 'bg-red-50/60 hover:bg-red-50 border-l-4 border-l-red-500'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
                        r.isCritical
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {r.id}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 font-bold ${r.isCritical ? 'text-red-700' : 'text-slate-800'}`}>
                      {r.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs font-medium">
                      {r.materials || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600 font-mono text-xs font-bold">
                      {r.materialQty || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                      {r.duration}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.predecessors.length > 0 ? (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {r.predecessors.map(p => (
                            <span key={p} className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-600">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">{r.es}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-600 bg-indigo-50/30">{r.ef}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-purple-600 bg-purple-50/30">{r.ls}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-purple-600 bg-purple-50/30">{r.lf}</td>
                    <td className={`px-4 py-3.5 text-center font-mono font-bold bg-amber-50/30 ${r.totalFloat === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {r.totalFloat}
                    </td>
                    <td className={`px-4 py-3.5 text-center font-mono font-bold bg-amber-50/30 ${r.freeFloat === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {r.freeFloat}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.isCritical ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-black shadow-md shadow-red-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> 要徑
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 圖例說明 */}
          <div className="p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-500"></div>
                <span>ES/EF: 最早開始/完成時間</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span>LS/LF: 最晚開始/完成時間</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>浮時: 可延遲天數</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>要徑: 總浮時=0 的作業 (不可延遲)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 單一作業輸入列
 */
const ActivityRow = ({ activity, index, availablePredecessors, onUpdate, onTogglePred, onRemove, canRemove, onMaterialBlur }) => {
  const [isPredOpen, setIsPredOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 點擊外部關閉下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPredOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-[50px_1.2fr_1fr_80px_80px_1fr_40px] gap-4 items-center bg-slate-100 p-3 rounded-xl border border-slate-300 hover:border-indigo-400 hover:shadow-md transition-all group">
      {/* 編號 */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-200 text-indigo-700 text-sm font-black shadow-inner">
          {activity.id}
        </span>
      </div>

      {/* 作業名稱 */}
      <input
        type="text"
        placeholder="例如: 基礎開挖"
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:bg-indigo-50/10 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none shadow-sm"
        value={activity.name}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
      />

      {/* 所需材料 */}
      <input
        type="text"
        placeholder="例如: 鋼筋"
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:bg-indigo-50/10 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none shadow-sm"
        value={activity.materials || ''}
        onChange={(e) => onUpdate(index, 'materials', e.target.value)}
        onBlur={(e) => onMaterialBlur && onMaterialBlur(e.target.value)}
      />

      {/* 數量 */}
      <input
        type="number"
        min="0"
        placeholder="數量"
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-mono font-bold text-center placeholder:text-slate-400 placeholder:font-normal focus:bg-indigo-50/10 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none shadow-sm"
        value={activity.materialQty || ''}
        onChange={(e) => onUpdate(index, 'materialQty', e.target.value)}
      />

      {/* 工期 */}
      <input
        type="number"
        min="0"
        placeholder="天"
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-mono font-bold text-center placeholder:text-slate-400 placeholder:font-normal focus:bg-indigo-50/10 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none shadow-sm"
        value={activity.duration}
        onChange={(e) => onUpdate(index, 'duration', e.target.value)}
      />

      {/* 前置作業 */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => availablePredecessors.length > 0 && setIsPredOpen(!isPredOpen)}
          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between transition-all outline-none shadow-sm ${
            availablePredecessors.length === 0
              ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
              : 'border-slate-300 hover:border-indigo-500 cursor-pointer'
          } ${isPredOpen ? 'bg-indigo-50/10 ring-4 ring-indigo-500/30 border-indigo-500' : ''}`}
        >
          <div className="flex items-center gap-1 flex-wrap overflow-hidden">
            {activity.predecessors.length > 0 ? (
              activity.predecessors.map(p => (
                <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700">
                  {p}
                </span>
              ))
            ) : (
              <span className="text-slate-400 font-medium">
                {availablePredecessors.length === 0 ? '無' : '選擇前置作業...'}
              </span>
            )}
          </div>
          {availablePredecessors.length > 0 && (
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isPredOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* 前置作業下拉選單 */}
        {isPredOpen && availablePredecessors.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1 max-h-48 overflow-y-auto">
              {availablePredecessors.map(pred => {
                const isSelected = activity.predecessors.includes(pred.id);
                return (
                  <button
                    key={pred.id}
                    type="button"
                    onClick={() => onTogglePred(index, pred.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-200 text-xs font-black text-slate-600">
                      {pred.id}
                    </span>
                    <span className="truncate">{pred.name || '(未命名)'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 刪除按鈕 */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className={`p-2 rounded-lg transition-all flex items-center justify-center ${
          canRemove
            ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
            : 'opacity-0 cursor-not-allowed'
        }`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SchedulePanel;
