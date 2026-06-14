import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, AlertTriangle, Package, DollarSign, Filter, PlusCircle, RefreshCw, Activity, Plus, X as CloseIcon, ChevronDown, Download, FileText, FileSpreadsheet, FileOutput, Upload, FileDown, Phone, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import DualLayerChart from './components/DualLayerChart';
import DetailTable from './components/DetailTable';
import DataInputModal from './components/DataInputModal';
import RiskBanner from './components/RiskBanner';
import SupplierInsights from './components/SupplierInsights';
import { procurementData as initialProc, consumptionData as initialCons } from './data/mockData';
import { processDashboardData } from './utils/calculationUtils';
import DateRangeAggregator from './components/DateRangeAggregator';
import { exportToExcel, exportToWord, exportToTxt, exportTemplate, exportScheduleTemplate } from './utils/exportUtils';
import { importFromExcel } from './utils/importUtils';
import SchedulePanel from './components/SchedulePanel';
import ReplenishModal from './components/ReplenishModal';

const addIds = (list) => list.map((item, idx) => ({ ...item, id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}` }));

// 向下相容：將舊的全域資料遷移到「主工地」
if (localStorage.getItem('dashboard_procurement') && !localStorage.getItem('dashboard_procurement_主工地')) {
  localStorage.setItem('dashboard_procurement_主工地', localStorage.getItem('dashboard_procurement'));
  localStorage.setItem('dashboard_consumption_主工地', localStorage.getItem('dashboard_consumption') || '[]');
  localStorage.setItem('dashboard_materials_主工地', localStorage.getItem('dashboard_materials') || '[]');
  
  localStorage.removeItem('dashboard_procurement');
  localStorage.removeItem('dashboard_consumption');
  localStorage.removeItem('dashboard_materials');
}

// 自動清除舊的範例資料（2024 年模擬數據），保留材料類型清單
if (!localStorage.getItem('dashboard_mock_cleared_v1')) {
  const sites = JSON.parse(localStorage.getItem('dashboard_sites') || '["主工地"]');
  sites.forEach(site => {
    const procKey = `dashboard_procurement_${site}`;
    const consKey = `dashboard_consumption_${site}`;
    const proc = JSON.parse(localStorage.getItem(procKey) || '[]');
    const cons = JSON.parse(localStorage.getItem(consKey) || '[]');
    // 若資料全部都是 2024 年的範例資料，則自動清除
    const hasMockProc = proc.length > 0 && proc.every(p => p.date && p.date.startsWith('2024-05'));
    const hasMockCons = cons.length > 0 && cons.every(c => c.date && c.date.startsWith('2024-05'));
    if (hasMockProc) localStorage.setItem(procKey, '[]');
    if (hasMockCons) localStorage.setItem(consKey, '[]');
  });
  localStorage.setItem('dashboard_mock_cleared_v1', '1');
}

function App() {
  const initialSites = (() => {
    const saved = localStorage.getItem('dashboard_sites');
    return saved ? JSON.parse(saved) : ['主工地'];
  })();

  const [sites, setSites] = useState(initialSites);
  const [selectedSite, setSelectedSite] = useState(initialSites[0]);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  const [selectedMaterial, setSelectedMaterial] = useState('鋼筋');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replenishModalData, setReplenishModalData] = useState(null);
  const [activeView, setActiveView] = useState('material');
  
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem(`dashboard_materials_${initialSites[0]}`);
    const initial = [
      { name: '鋼筋', unit: '噸' },
      { name: '水泥', unit: '包' }
    ];
    if (!saved) return initial;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map(m => ({ name: m, unit: 'Unit' }));
      }
      return parsed;
    } catch (e) {
      return initial;
    }
  });

  const [procurements, setProcurements] = useState(() => {
    const saved = localStorage.getItem(`dashboard_procurement_${initialSites[0]}`);
    return saved ? JSON.parse(saved) : (initialSites[0] === '主工地' ? addIds(initialProc) : []);
  });

  const [consumptions, setConsumptions] = useState(() => {
    const saved = localStorage.getItem(`dashboard_consumption_${initialSites[0]}`);
    return saved ? JSON.parse(saved) : (initialSites[0] === '主工地' ? addIds(initialCons) : []);
  });

  useEffect(() => {
    localStorage.setItem(`dashboard_procurement_${selectedSite}`, JSON.stringify(procurements));
    localStorage.setItem(`dashboard_consumption_${selectedSite}`, JSON.stringify(consumptions));
    localStorage.setItem(`dashboard_materials_${selectedSite}`, JSON.stringify(materials));
  }, [procurements, consumptions, materials, selectedSite]);

  const currentMaterialData = useMemo(() => {
    return materials.find(m => m.name === selectedMaterial) || materials[0];
  }, [materials, selectedMaterial]);

  const filteredProc = useMemo(() => 
    procurements.filter(p => (p.type || '').trim() === selectedMaterial.trim()), 
  [selectedMaterial, procurements]);

  const filteredCons = useMemo(() => 
    consumptions.filter(c => (c.type || '').trim() === selectedMaterial.trim()), 
  [selectedMaterial, consumptions]);

  const { timeline, kpis, supplierStats } = useMemo(() => 
    processDashboardData(filteredProc, filteredCons, currentMaterialData.leadTime || 3), 
  [filteredProc, filteredCons, currentMaterialData.leadTime]);

  const dateDetails = useMemo(() => {
    if (!selectedDate) return [];
    return filteredProc.filter(p => p.date === selectedDate);
  }, [selectedDate, filteredProc]);

  const dateConsumption = useMemo(() => {
    if (!selectedDate) return [];
    return filteredCons.filter(c => c.date === selectedDate);
  }, [selectedDate, filteredCons]);

  const handleSaveData = (type, newData) => {
    const itemsToSave = Array.isArray(newData) 
      ? newData.map((item, idx) => ({ ...item, id: `manual-${Date.now()}-${idx}` }))
      : [{ ...newData, id: `manual-${Date.now()}` }];

    if (type === 'procurement') {
      setProcurements([...procurements, ...itemsToSave]);
    } else {
      setConsumptions([...consumptions, ...itemsToSave]);
    }
  };

  const handleDeleteData = (type, id) => {
    if (window.confirm('確定要刪除這筆日誌紀錄嗎？')) {
      if (type === 'procurement') {
        setProcurements(procurements.filter(p => p.id !== id));
      } else {
        setConsumptions(consumptions.filter(c => c.id !== id));
      }
    }
  };

  const handleAddMaterial = () => {
    const name = prompt('請輸入新材料名稱:');
    if (name && name.trim()) {
      const trimmedName = name.trim();
      if (!materials.find(m => m.name === trimmedName)) {
        const unit = prompt(`請輸入「${trimmedName}」的單位 (例如: 噸, m³, 包):`, 'Unit');
        const newMaterial = { name: trimmedName, unit: unit || 'Unit' };
        setMaterials([...materials, newMaterial]);
        setSelectedMaterial(trimmedName);
        setSelectedDate(null);
      } else {
        alert('該材料已存在！');
      }
    }
  };

  const handleUpdateUnit = (newName) => {
    const material = materials.find(m => m.name === newName);
    const newUnit = prompt(`請輸入「${newName}」的新單位:`, material.unit);
    if (newUnit !== null && newUnit.trim() !== '') {
      setMaterials(materials.map(m => 
        m.name === newName ? { ...m, unit: newUnit.trim() } : m
      ));
    }
  };

  const handleUpdateCapacity = (newName) => {
    const material = materials.find(m => m.name === newName);
    const newCapacity = prompt(`請輸入「${newName}」的新倉庫大小:`, material.capacity || 10000);
    if (newCapacity !== null && !isNaN(Number(newCapacity)) && newCapacity.trim() !== '') {
      setMaterials(materials.map(m => 
        m.name === newName ? { ...m, capacity: Number(newCapacity) } : m
      ));
    }
  };

  const handleUpdateLeadTime = (newName) => {
    const material = materials.find(m => m.name === newName);
    const newLeadTime = prompt(`請輸入「${newName}」的預計叫料天數 (預設: 3):`, material.leadTime || 3);
    if (newLeadTime !== null && !isNaN(Number(newLeadTime)) && newLeadTime.trim() !== '') {
      setMaterials(materials.map(m => 
        m.name === newName ? { ...m, leadTime: Number(newLeadTime) } : m
      ));
    }
  };

  const handleUpdateSupplier = (newName) => {
    const material = materials.find(m => m.name === newName);
    const defaultSuppName = prompt(`請輸入「${newName}」的預設廠商名稱:`, '');
    if (defaultSuppName !== null && defaultSuppName.trim() !== '') {
      const defaultSuppContact = prompt(`請輸入「${defaultSuppName}」的聯絡方式:`, '');
      const defaultSuppCost = prompt(`請輸入「${defaultSuppName}」的單位成本 (數字):`, '');
      
      const newSupplier = {
        id: `supp-${Date.now()}`,
        name: defaultSuppName.trim(),
        contact: defaultSuppContact?.trim() || '',
        cost: Number(defaultSuppCost) || 0
      };

      setMaterials(materials.map(m => {
        if (m.name === newName) {
          let suppliers = m.defaultSuppliers || [];
          if (m.defaultSupplier && suppliers.length === 0) {
             suppliers = [{ id: 'supp-old', ...m.defaultSupplier, cost: 0 }];
          }
          return { ...m, defaultSuppliers: [...suppliers, newSupplier], defaultSupplier: undefined };
        }
        return m;
      }));
    }
  };

  const handleEditSupplier = (materialName, supplierId) => {
    const material = materials.find(m => m.name === materialName);
    const suppliers = material.defaultSuppliers || [];
    const supplierToEdit = suppliers.find(s => s.id === supplierId);
    if (!supplierToEdit) return;

    const newName = prompt(`編輯廠商名稱:`, supplierToEdit.name);
    if (newName !== null && newName.trim() !== '') {
      const newContact = prompt(`編輯「${newName}」的聯絡方式:`, supplierToEdit.contact);
      const newCost = prompt(`編輯「${newName}」的單位成本 (數字):`, supplierToEdit.cost);
      
      setMaterials(materials.map(m => {
        if (m.name === materialName) {
          const updatedSuppliers = (m.defaultSuppliers || []).map(s => 
            s.id === supplierId 
              ? { ...s, name: newName.trim(), contact: newContact?.trim() || '', cost: Number(newCost) || 0 }
              : s
          );
          return { ...m, defaultSuppliers: updatedSuppliers };
        }
        return m;
      }));
    }
  };

  const handleDeleteSupplier = (materialName, supplierId) => {
    if (window.confirm('確定要刪除這個預設廠商嗎？')) {
      setMaterials(materials.map(m => {
        if (m.name === materialName) {
          const suppliers = (m.defaultSuppliers || []).filter(s => s.id !== supplierId);
          return { ...m, defaultSuppliers: suppliers };
        }
        return m;
      }));
    }
  };

  const handleDeleteMaterial = (e, materialName) => {
    e.stopPropagation(); 
    
    if (materials.length <= 1) {
      alert('至少必須保留一個材料類型！');
      return;
    }

    if (window.confirm(`確定要刪除「${materialName}」嗎？這將會連同該材料的所有數據一併移除。`)) {
      const newMaterials = materials.filter(m => m.name !== materialName);
      setMaterials(newMaterials);
      setProcurements(procurements.filter(p => p.type !== materialName));
      setConsumptions(consumptions.filter(c => c.type !== materialName));
      
      if (selectedMaterial === materialName) {
        setSelectedMaterial(newMaterials[0].name);
        setSelectedDate(null);
      }
    }
  };

  const handleQuickReplenish = (supplier, currentInventory, capacity, materialName, orderDate, exactShortageConsQty) => {
    setReplenishModalData({
      supplier,
      currentInventory,
      capacity,
      materialName,
      orderDate,
      exactShortageConsQty
    });
  };

  const handleReplenishConfirm = (newProc) => {
    newProc.id = `auto-${Date.now()}`;
    setProcurements(prev => [...prev, newProc]);
    setSelectedDate(newProc.date);
    setReplenishModalData(null);
  };

  const handleSiteChange = (newSite) => {
    setSelectedSite(newSite);
    setIsSiteDropdownOpen(false);
    
    const savedMaterials = localStorage.getItem(`dashboard_materials_${newSite}`);
    const savedProc = localStorage.getItem(`dashboard_procurement_${newSite}`);
    const savedCons = localStorage.getItem(`dashboard_consumption_${newSite}`);

    const defaultMaterials = [ { name: '鋼筋', unit: '噸' }, { name: '水泥', unit: '包' } ];
    let parsedMaterials = defaultMaterials;
    
    if (savedMaterials) {
      try {
        const parsed = JSON.parse(savedMaterials);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedMaterials = typeof parsed[0] === 'string' ? parsed.map(m => ({ name: m, unit: 'Unit' })) : parsed;
        }
      } catch (e) {}
    }

    const newProc = savedProc ? JSON.parse(savedProc) : (newSite === '主工地' ? addIds(initialProc) : []);
    const newCons = savedCons ? JSON.parse(savedCons) : (newSite === '主工地' ? addIds(initialCons) : []);

    setMaterials(parsedMaterials);
    setProcurements(newProc);
    setConsumptions(newCons);
    setSelectedMaterial(parsedMaterials[0]?.name || '鋼筋');
    setSelectedDate(null);
  };

  const handleAddSite = () => {
    const name = prompt('請輸入新工地名稱:');
    if (name && name.trim()) {
      const trimmedName = name.trim();
      if (!sites.includes(trimmedName)) {
        const newSites = [...sites, trimmedName];
        setSites(newSites);
        localStorage.setItem('dashboard_sites', JSON.stringify(newSites));
        handleSiteChange(trimmedName);
      } else {
        alert('該工地已存在！');
      }
    }
  };

  const handleDeleteSite = (siteName) => {
    if (sites.length <= 1) {
      alert('至少必須保留一個工地！');
      return;
    }
    if (window.confirm(`確定要刪除工地「${siteName}」嗎？這將會清除該工地的所有數據。`)) {
      const newSites = sites.filter(s => s !== siteName);
      setSites(newSites);
      localStorage.setItem('dashboard_sites', JSON.stringify(newSites));
      
      localStorage.removeItem(`dashboard_materials_${siteName}`);
      localStorage.removeItem(`dashboard_procurement_${siteName}`);
      localStorage.removeItem(`dashboard_consumption_${siteName}`);
      
      handleSiteChange(newSites[0]);
    }
  };

  const handleResetData = () => {
    if (window.confirm('確定要重置所有數據嗎？')) {
      localStorage.clear();
      const defaultSites = ['主工地'];
      setSites(defaultSites);
      localStorage.setItem('dashboard_sites', JSON.stringify(defaultSites));
      setSelectedSite('主工地');
      
      setMaterials([
        { name: '鋼筋', unit: '噸' },
        { name: '水泥', unit: '包' }
      ]);
      setProcurements(addIds(initialProc));
      setConsumptions(addIds(initialCons));
      setSelectedMaterial('鋼筋');
      setSelectedDate(null);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { procurements: newProc, consumptions: newCons } = await importFromExcel(file);
      
      if (newProc.length === 0 && newCons.length === 0) {
        alert('檔案中找不到有效的「採購紀錄」或「進度紀錄」資料！');
        return;
      }

      const isOverwrite = window.confirm('匯入資料解析成功。是否要覆蓋現有資料？\n\n- 選擇「確定」將清除當前工地的現有紀錄並填入新資料\n- 選擇「取消」將新資料附加到現有紀錄中');
      
      if (isOverwrite) {
        setProcurements(newProc);
        setConsumptions(newCons);
      } else {
        setProcurements([...procurements, ...newProc]);
        setConsumptions([...consumptions, ...newCons]);
      }

      const allNewTypes = [...new Set([...newProc.map(p => p.type), ...newCons.map(c => c.type)])];
      const existingTypes = materials.map(m => m.name);
      const typesToAdd = allNewTypes.filter(t => !existingTypes.includes(t));
      
      if (typesToAdd.length > 0) {
        const newMaterials = [...materials, ...typesToAdd.map(t => ({ name: t, unit: 'Unit' }))];
        setMaterials(newMaterials);
      }
      
      alert('資料匯入成功！');
    } catch (error) {
      console.error("Import error:", error);
      alert('檔案匯入失敗，請確認檔案格式是否正確。');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const capacityVal = currentMaterialData.capacity || 10000;
  const inventoryVal = kpis.currentInventory || 0;
  const capacityUsagePct = (inventoryVal / capacityVal) * 100;
  const isCapacityWarning = capacityUsagePct >= 85;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30 pb-20" onClick={() => { setIsSiteDropdownOpen(false); setIsExportDropdownOpen(false); setIsTemplateDropdownOpen(false); }}>
      <RiskBanner 
        isVisible={kpis.isAtRisk} 
        materialName={selectedMaterial}
        defaultSuppliers={currentMaterialData.defaultSuppliers || (currentMaterialData.defaultSupplier ? [{ id: 'supp-old', ...currentMaterialData.defaultSupplier, cost: 0 }] : [])}
        onQuickReplenish={(supplier) => handleQuickReplenish(supplier, kpis.currentInventory || 0, currentMaterialData.capacity || 10000, selectedMaterial, kpis.recommendedOrderDate, kpis.exactShortageConsQty)}
        leadTime={currentMaterialData.leadTime || 3}
      />
      
      <div className="max-w-[1600px] mx-auto p-6 md:p-10">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-50">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <TrendingUp className="text-emerald-500 w-8 h-8" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                工程物料動態管理
              </span>

              <div className="relative ml-4 flex items-center bg-white/80 rounded-xl border border-slate-200/80 shadow-inner" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 rounded-l-xl transition-colors"
                  onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                >
                  <span className="text-emerald-400 font-bold text-lg">{selectedSite}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-1 border-l border-slate-300/50 px-2 h-full">
                  <button onClick={handleAddSite} className="p-1 hover:text-emerald-400 hover:bg-slate-100 rounded transition-colors text-slate-500" title="新增工地"><Plus className="w-4 h-4" /></button>
                  {sites.length > 1 && (
                    <button onClick={() => handleDeleteSite(selectedSite)} className="p-1 hover:text-red-400 hover:bg-slate-100 rounded transition-colors text-slate-500" title="刪除當前工地"><CloseIcon className="w-4 h-4" /></button>
                  )}
                </div>

                {isSiteDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {sites.map(site => (
                      <div 
                        key={site} 
                        className={`px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium ${selectedSite === site ? 'text-emerald-400 bg-slate-100/50' : 'text-slate-700'}`}
                        onClick={() => handleSiteChange(site)}
                      >
                        {site}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
              <span className={`w-2 h-2 rounded-full ${kpis.isAtRisk ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
              System Status: {kpis.isAtRisk ? 'Risk Detected' : 'Stable'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/50 p-2 rounded-2xl border border-slate-200/50 backdrop-blur-md">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
              <div className="flex gap-1">
                {materials.map(m => (
                  <div key={m.name} className="group relative">
                    <button
                      onClick={() => {
                        setSelectedMaterial(m.name);
                        setSelectedDate(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-300 uppercase flex items-center gap-2 ${
                        selectedMaterial === m.name 
                          ? 'bg-emerald-500 text-white shadow-lg' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {m.name}
                      <span 
                        onClick={(e) => handleDeleteMaterial(e, m.name)}
                        className={`hover:bg-black/20 rounded p-0.5 transition-all ${selectedMaterial === m.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <CloseIcon className="w-3 h-3" />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleAddMaterial}
                className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-slate-100 rounded-lg transition-all border-l border-slate-200 ml-1"
                title="新增材料類型"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".xlsx" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                  title="匯入 Excel 報表"
                >
                  <Upload className="w-4 h-4" /> 匯入報表
                </button>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)} 
                    className="bg-slate-100/50 hover:bg-slate-200/50 text-slate-700 border border-slate-300/50 px-3 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                    title="下載 Excel 匯入範例"
                  >
                    <FileDown className="w-4 h-4" /> 下載範例 <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isTemplateDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <button 
                        onClick={() => { exportTemplate(); setIsTemplateDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium text-slate-700 flex items-center gap-2 text-sm"
                      >
                        <Package className="w-4 h-4 text-emerald-400" /> 物料管理範例
                      </button>
                      <button 
                        onClick={() => { exportScheduleTemplate(); setIsTemplateDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium text-slate-700 flex items-center gap-2 text-sm"
                      >
                        <Clock className="w-4 h-4 text-indigo-400" /> 工程排程範例
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
              >
                <Download className="w-4 h-4" /> 匯出報表
              </button>
              
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-200 bg-slate-50 uppercase tracking-wider">
                    選擇匯出格式
                  </div>
                  <button 
                    onClick={() => { exportToExcel(selectedSite, procurements, consumptions); setIsExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium text-slate-700 flex items-center gap-3"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 匯出為 Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => { exportToWord(selectedSite, procurements, consumptions); setIsExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium text-slate-700 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-blue-400" /> 匯出為 Word (.docx)
                  </button>
                  <button 
                    onClick={() => { exportToTxt(selectedSite, procurements, consumptions); setIsExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors font-medium text-slate-700 flex items-center gap-3"
                  >
                    <FileOutput className="w-4 h-4 text-slate-400" /> 匯出為純文字 (.txt)
                  </button>
                </div>
              )}
            </div>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg">
              <PlusCircle className="w-4 h-4" /> 新增日誌
            </button>
            <button onClick={handleResetData} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 頁面切換 Tab */}
        <div className="flex items-center gap-2 mb-10 bg-white/50 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md w-fit shadow-lg">
          <button
            onClick={() => setActiveView('material')}
            className={`px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all duration-300 ${
              activeView === 'material'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" /> 物料管理
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all duration-300 ${
              activeView === 'schedule'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> 排程分析
          </button>
        </div>


        {activeView === 'schedule' ? (
          <SchedulePanel
            selectedSite={selectedSite}
            materials={materials}
            setMaterials={setMaterials}
            consumptions={consumptions}
            setConsumptions={setConsumptions}
          />
        ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="動態庫存" 
            value={`${kpis.currentInventory.toLocaleString()} ${currentMaterialData.unit}`} 
            icon={<Package className="text-blue-400" />} 
            trend="Live Stock" 
            color="blue" 
            onValueClick={() => handleUpdateUnit(selectedMaterial)}
            isEditable={true}
          />
          <StatCard title="實際單位成本" value={`$${kpis.avgUnitCost.toLocaleString(undefined, {maximumFractionDigits: 1})}`} icon={<TrendingUp className="text-emerald-400" />} trend="Avg. Cost" color="emerald" />
          <StatCard title="累計採購支出" value={`$${(kpis.totalSpent / 1000).toFixed(1)}k`} icon={<DollarSign className="text-purple-400" />} trend="Total Spent" color="purple" />
          <StatCard title="斷料預警 (SPI)" value={kpis.isAtRisk ? "高風險" : "安全"} icon={<AlertTriangle className={kpis.isAtRisk ? "text-red-500 animate-bounce" : "text-emerald-400"} />} trend={kpis.isAtRisk ? 'Low Stock' : 'On Track'} color={kpis.isAtRisk ? "red" : "emerald"} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {selectedMaterial} 趨勢透視
                </h2>
                <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div> 累計支出</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> 採購量</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div> 消耗量</div>
                </div>
              </div>
              <DualLayerChart key={selectedMaterial} data={timeline} onDateSelect={(date) => setSelectedDate(date)} selectedDate={selectedDate} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SupplierInsights 
                stats={supplierStats} 
                materialType={selectedMaterial} 
                allProcurements={filteredProc}
                unit={currentMaterialData.unit}
              />
              <div className="p-8 rounded-3xl border bg-white/40 backdrop-blur-md border-slate-200/50 flex flex-col justify-center relative overflow-hidden group hover:border-blue-400/50 transition-all duration-500 shadow-2xl">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2 uppercase tracking-tight text-slate-900">
                  <Package className="w-5 h-5 text-blue-400" />
                  倉庫容量 ({selectedMaterial})
                </h4>
                <div className="flex-1 flex items-center justify-center -my-4">
                  <ReactECharts 
                    option={{
                      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                      color: [isCapacityWarning ? '#ef4444' : '#3b82f6', '#e2e8f0'],
                      series: [{
                        type: 'pie',
                        radius: ['60%', '80%'],
                        avoidLabelOverlap: false,
                        itemStyle: { borderRadius: 10, borderColor: '#0f172a', borderWidth: 2 },
                        label: { show: false, position: 'center' },
                        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold', color: '#0f172a', formatter: '{d}%' } },
                        labelLine: { show: false },
                        data: [
                          { value: kpis.currentInventory || 0, name: '目前庫存' },
                          { value: Math.max((currentMaterialData.capacity || 10000) - (kpis.currentInventory || 0), 0), name: '剩餘空間' }
                        ]
                      }]
                    }} 
                    style={{ height: '220px', width: '100%' }} 
                  />
                </div>
                <div className="flex justify-between items-end mt-2 mb-4 px-2">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">總容量</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">
                      {(currentMaterialData.capacity || 10000).toLocaleString()} <span className="text-sm text-slate-500">{currentMaterialData.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs uppercase font-bold tracking-widest mb-1 ${isCapacityWarning ? 'text-red-400' : 'text-blue-400'}`}>已使用</div>
                    <div className={`text-2xl font-black tracking-tighter ${isCapacityWarning ? 'text-red-400' : 'text-blue-400'}`}>
                      {capacityUsagePct.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {isCapacityWarning && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-sm font-bold animate-pulse">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>注意：倉庫容量已達 {capacityUsagePct.toFixed(1)}%，空間即將滿載！請評估後續進場。</span>
                  </div>
                )}
                <button 
                  onClick={() => handleUpdateCapacity(selectedMaterial)}
                  className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> 設定倉庫大小
                </button>
              </div>

              <div className="p-8 rounded-3xl border bg-white/40 backdrop-blur-md border-slate-200/50 flex flex-col relative overflow-hidden group hover:border-emerald-400/50 transition-all duration-500 shadow-2xl">
                <h4 className="font-black text-lg mb-6 flex items-center gap-2 uppercase tracking-tight text-slate-900">
                  <Phone className="w-5 h-5 text-emerald-500" />
                  預設進料廠商清單 ({selectedMaterial})
                </h4>
                <div className="flex-1 flex flex-col gap-3 mb-6 overflow-y-auto max-h-[250px] pr-2">
                  {(() => {
                    const suppliers = currentMaterialData.defaultSuppliers || (currentMaterialData.defaultSupplier ? [{ id: 'supp-old', ...currentMaterialData.defaultSupplier, cost: 0 }] : []);
                    if (suppliers.length === 0) {
                      return (
                        <div className="text-center text-slate-400 font-bold italic py-8">
                          尚無設定預設廠商
                        </div>
                      );
                    }
                    return suppliers.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => handleEditSupplier(selectedMaterial, s.id)}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center group/item hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all"
                        title="點擊編輯廠商"
                      >
                        <div>
                          <div className="font-black text-slate-800 text-sm">{s.name}</div>
                          <div className="text-xs text-slate-500 font-medium">{s.contact}</div>
                          <div className="text-xs font-bold text-emerald-600 mt-1">成本: ${s.cost.toLocaleString()} / {currentMaterialData.unit}</div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(selectedMaterial, s.id); }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                          title="刪除廠商"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
                <button 
                  onClick={() => handleUpdateSupplier(selectedMaterial)}
                  className="w-full mt-auto py-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-600 border border-emerald-500/30 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> 新增預設廠商
                </button>
              </div>

              <div className="p-8 rounded-3xl border bg-white/40 backdrop-blur-md border-slate-200/50 flex flex-col justify-center relative overflow-hidden group hover:border-orange-400/50 transition-all duration-500 shadow-2xl">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2 uppercase tracking-tight text-slate-900">
                  <Clock className="w-5 h-5 text-orange-500" />
                  預警叫料參數 ({selectedMaterial})
                </h4>
                <div className="flex-1 flex flex-col items-center justify-center -my-4">
                  <div className="text-[100px] font-black text-slate-800 leading-none tracking-tighter">
                    {currentMaterialData.leadTime || 3}
                  </div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                    預計前置天數 (Days)
                  </div>
                </div>
                <div className="mt-8 mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-2 text-orange-600 text-sm font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>當可用庫存低於未來 {currentMaterialData.leadTime || 3} 天的總預估消耗量時，系統將觸發斷料預警。</span>
                </div>
                <button 
                  onClick={() => handleUpdateLeadTime(selectedMaterial)}
                  className="w-full py-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-600 border border-orange-500/30 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> 設定叫料天數
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3 uppercase tracking-tighter">
              <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
              明細
            </h2>
            <DateRangeAggregator 
              procurements={filteredProc} 
              consumptions={filteredCons} 
              unit={currentMaterialData.unit} 
              materialName={selectedMaterial}
            />
            <DetailTable 
              date={selectedDate} 
              procurementDetails={dateDetails} 
              consumptionDetails={dateConsumption} 
              onDelete={handleDeleteData} 
              unit={currentMaterialData.unit}
            />
          </div>
        </div>
        </>
        )}
      </div>

      <DataInputModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveData} 
        materialType={selectedMaterial} 
        unit={currentMaterialData.unit}
      />

      <ReplenishModal
        isOpen={!!replenishModalData}
        onClose={() => setReplenishModalData(null)}
        onConfirm={handleReplenishConfirm}
        data={replenishModalData}
      />
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, onValueClick, isEditable }) {
  const colorMap = { 
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400', 
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', 
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400', 
    red: 'border-red-500/20 bg-red-500/5 text-red-500' 
  };
  
  return (
    <div 
      onClick={isEditable ? onValueClick : undefined}
      className={`p-7 rounded-3xl border ${colorMap[color].split(' ')[0]} bg-white/40 backdrop-blur-md hover:translate-y-[-6px] transition-all duration-500 shadow-2xl group ${isEditable ? 'cursor-pointer hover:border-blue-400/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${colorMap[color].split(' ')[1]} group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[2]}`}>{trend}</span>
      </div>
      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
        {title}
        {isEditable && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">點擊修改單位</span>}
      </h3>
      <p className="text-4xl font-black mt-2 tracking-tighter text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">{value}</p>
    </div>
  );
}


export default App;
