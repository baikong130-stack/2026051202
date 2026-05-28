// 模擬數據：多物料採購與消耗數據
export const procurementData = [
  // 鋼筋
  { date: '2024-05-01', type: '鋼筋', quantity: 50, totalAmount: 150000, supplier: '甲供應商' },
  { date: '2024-05-03', type: '鋼筋', quantity: 30, totalAmount: 96000, supplier: '乙供應商' },
  { date: '2024-05-05', type: '鋼筋', quantity: 100, totalAmount: 290000, supplier: '甲供應商' },
  { date: '2024-05-08', type: '鋼筋', quantity: 40, totalAmount: 128000, supplier: '丙供應商' },
  { date: '2024-05-10', type: '鋼筋', quantity: 60, totalAmount: 186000, supplier: '乙供應商' },
  { date: '2024-05-12', type: '鋼筋', quantity: 80, totalAmount: 240000, supplier: '甲供應商' },
  // 水泥
  { date: '2024-05-01', type: '水泥', quantity: 200, totalAmount: 40000, supplier: '丁供應商' },
  { date: '2024-05-04', type: '水泥', quantity: 150, totalAmount: 31500, supplier: '戊供應商' },
  { date: '2024-05-07', type: '水泥', quantity: 300, totalAmount: 60000, supplier: '丁供應商' },
  { date: '2024-05-11', type: '水泥', quantity: 100, totalAmount: 22000, supplier: '戊供應商' },
];

export const consumptionData = [
  // 鋼筋
  { date: '2024-05-01', type: '鋼筋', stage: '基礎工程', theoreticalQuantity: 10 },
  { date: '2024-05-02', type: '鋼筋', stage: '基礎工程', theoreticalQuantity: 15 },
  { date: '2024-05-03', type: '鋼筋', stage: '基礎工程', theoreticalQuantity: 15 },
  { date: '2024-05-04', type: '鋼筋', stage: '基礎工程', theoreticalQuantity: 20 },
  { date: '2024-05-05', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 25 },
  { date: '2024-05-06', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 30 },
  { date: '2024-05-07', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 30 },
  { date: '2024-05-08', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 35 },
  { date: '2024-05-09', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 40 },
  { date: '2024-05-10', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 40 },
  { date: '2024-05-11', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 45 },
  { date: '2024-05-12', type: '鋼筋', stage: '結構工程', theoreticalQuantity: 50 },
  // 水泥
  { date: '2024-05-01', type: '水泥', stage: '基礎工程', theoreticalQuantity: 50 },
  { date: '2024-05-02', type: '水泥', stage: '基礎工程', theoreticalQuantity: 50 },
  { date: '2024-05-03', type: '水泥', stage: '基礎工程', theoreticalQuantity: 40 },
  { date: '2024-05-04', type: '水泥', stage: '基礎工程', theoreticalQuantity: 60 },
  { date: '2024-05-05', type: '水泥', stage: '基礎工程', theoreticalQuantity: 60 },
  { date: '2024-05-06', type: '水泥', stage: '基礎工程', theoreticalQuantity: 80 },
];

export const dispatchSuggestionsData = {
  '鋼筋': {
    shortageRisk: true,
    impactedTasks: [
      { name: "A區2F柱牆綁紮", workers: 15, delayRisk: "高", status: "即將因斷料停工" },
      { name: "地下室筏基施作", workers: 20, delayRisk: "中", status: "庫存僅剩 1 天用量" }
    ],
    alternativeTasks: [
      { name: "B區1F模板組立", workersNeeded: 12, status: "物料充足，可提前施作", type: "推薦轉移" },
      { name: "C區鷹架搭設", workersNeeded: 15, status: "無前置物料限制", type: "推薦轉移" }
    ],
    procurement: { supplier: "甲供應商", time: "明日上午 10:00", cost: "$1,500 (加急)", minAmount: 300 },
    transfer: { site: "B 工地 (南港)", distance: "15.2 公里", time: "約 45 分鐘", amount: 500 },
    alternativeMaterial: { name: "進口高拉力鋼筋 (替代品)", inStock: 1200, costVariance: "+5%" }
  },
  '水泥': {
    shortageRisk: false,
    impactedTasks: [],
    alternativeTasks: [],
    procurement: { supplier: "丁供應商", time: "標準交期 3 天", cost: "無", minAmount: 100 },
    transfer: { site: "C 工地 (內湖)", distance: "8 公里", time: "約 25 分鐘", amount: 200 },
    alternativeMaterial: { name: "品牌 B 散裝水泥", inStock: 500, costVariance: "+2%" }
  }
};
