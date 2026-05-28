/**
 * 計算工程物料動態管理所需的核心指標與時間序列數據
 */
export const processDashboardData = (procurements, consumptions) => {
  const allDates = Array.from(new Set([
    ...procurements.map(p => p.date),
    ...consumptions.map(c => c.date)
  ])).sort();

  let cumulativeProcured = 0;
  let cumulativeConsumed = 0;
  let cumulativeCost = 0;
  
  const timeline = allDates.map((date, index) => {
    const dailyProc = procurements.filter(p => p.date === date);
    const dailyCons = consumptions.filter(c => c.date === date);

    const procQty = dailyProc.reduce((sum, p) => sum + p.quantity, 0);
    const procAmt = dailyProc.reduce((sum, p) => sum + (p.totalAmount || p.totalPrice || 0), 0);
    const consQty = dailyCons.reduce((sum, c) => sum + c.theoreticalQuantity, 0);

    cumulativeProcured += procQty;
    cumulativeConsumed += consQty;
    cumulativeCost += procAmt;

    const inventory = cumulativeProcured - cumulativeConsumed;
    const unitCost = cumulativeProcured > 0 ? cumulativeCost / cumulativeProcured : 0;

    let futureThreeDaysCons = 0;
    for (let i = 1; i <= 3; i++) {
      if (index + i < allDates.length) {
        const nextDate = allDates[index + i];
        const nextCons = consumptions
          .filter(c => c.date === nextDate)
          .reduce((sum, c) => sum + c.theoreticalQuantity, 0);
        futureThreeDaysCons += nextCons;
      }
    }

    const isAtRisk = inventory < 0 || (futureThreeDaysCons > 0 && inventory < futureThreeDaysCons);

    return {
      date,
      procQty,
      consQty,
      cumulativeCost,
      inventory,
      unitCost,
      isAtRisk
    };
  });

  // 供應商分析 (保留)
  const supplierMap = {};
  procurements.forEach(p => {
    if (!supplierMap[p.supplier]) {
      supplierMap[p.supplier] = { name: p.supplier, totalQty: 0, totalAmt: 0 };
    }
    supplierMap[p.supplier].totalQty += p.quantity;
    supplierMap[p.supplier].totalAmt += (p.totalAmount || p.totalPrice || 0);
  });

  const supplierStats = Object.values(supplierMap).map(s => ({
    ...s,
    avgPrice: s.totalAmt / s.totalQty
  })).sort((a, b) => a.avgPrice - b.avgPrice);

  const latest = timeline[timeline.length - 1] || { inventory: 0, unitCost: 0, cumulativeCost: 0, isAtRisk: false };

  return {
    timeline,
    supplierStats,
    kpis: {
      currentInventory: latest.inventory,
      avgUnitCost: latest.unitCost,
      totalSpent: latest.cumulativeCost,
      isAtRisk: latest.isAtRisk,
      spi: cumulativeConsumed > 0 ? cumulativeProcured / cumulativeConsumed : 0,
    }
  };
};
