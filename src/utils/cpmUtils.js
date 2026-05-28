/**
 * CPM (Critical Path Method) 要徑法計算工具
 * 
 * 計算工程排程中的：
 * - ES (Earliest Start) 最早開始時間
 * - EF (Earliest Finish) 最早完成時間
 * - LS (Latest Start) 最晚開始時間
 * - LF (Latest Finish) 最晚完成時間
 * - Total Float 總浮時
 * - Free Float 自由浮時
 * - Critical Path 要徑分析
 */

/**
 * 執行 CPM 計算
 * @param {Array} activities - 作業陣列
 *   每個作業格式: { id: string, name: string, duration: number, predecessors: string[] }
 * @returns {Object} { results: Array, projectDuration: number, criticalPaths: string[][] }
 */
export const calculateCPM = (activities) => {
  if (!activities || activities.length === 0) {
    return { results: [], projectDuration: 0, criticalPaths: [] };
  }

  // 建立作業對照表 (id -> activity)
  const activityMap = new Map();
  activities.forEach(act => {
    activityMap.set(act.id, {
      ...act,
      duration: Number(act.duration) || 0,
      predecessors: act.predecessors || [],
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
    });
  });

  // 建立後續作業對照表 (id -> successors[])
  const successorMap = new Map();
  activities.forEach(act => {
    if (!successorMap.has(act.id)) {
      successorMap.set(act.id, []);
    }
    (act.predecessors || []).forEach(predId => {
      if (!successorMap.has(predId)) {
        successorMap.set(predId, []);
      }
      successorMap.get(predId).push(act.id);
    });
  });

  // === Forward Pass (前推法): 計算 ES, EF ===
  // 使用拓撲排序確保依序計算
  const sorted = topologicalSort(activities);
  
  sorted.forEach(id => {
    const act = activityMap.get(id);
    if (!act) return;

    if (act.predecessors.length === 0) {
      // 無前置作業，從 0 開始
      act.es = 0;
    } else {
      // ES = max(所有前置作業的 EF)
      act.es = Math.max(
        ...act.predecessors
          .filter(predId => activityMap.has(predId))
          .map(predId => activityMap.get(predId).ef)
      );
    }
    act.ef = act.es + act.duration;
  });

  // 專案總工期 = 所有作業中最大的 EF
  const projectDuration = Math.max(...Array.from(activityMap.values()).map(a => a.ef));

  // === Backward Pass (後推法): 計算 LS, LF ===
  const reverseSorted = [...sorted].reverse();

  reverseSorted.forEach(id => {
    const act = activityMap.get(id);
    if (!act) return;

    const successors = successorMap.get(id) || [];
    const validSuccessors = successors.filter(sId => activityMap.has(sId));

    if (validSuccessors.length === 0) {
      // 無後續作業，LF = 專案總工期
      act.lf = projectDuration;
    } else {
      // LF = min(所有後續作業的 LS)
      act.lf = Math.min(
        ...validSuccessors.map(sId => activityMap.get(sId).ls)
      );
    }
    act.ls = act.lf - act.duration;
  });

  // === 計算浮時 ===
  activityMap.forEach(act => {
    // 總浮時 = LS - ES
    act.totalFloat = act.ls - act.es;

    // 自由浮時 = min(後續作業的 ES) - EF
    const successors = (successorMap.get(act.id) || []).filter(sId => activityMap.has(sId));
    if (successors.length === 0) {
      act.freeFloat = projectDuration - act.ef;
    } else {
      act.freeFloat = Math.min(
        ...successors.map(sId => activityMap.get(sId).es)
      ) - act.ef;
    }

    // 要徑判斷：總浮時 = 0
    act.isCritical = act.totalFloat === 0;
  });

  // 整理結果
  const results = sorted.map(id => {
    const act = activityMap.get(id);
    return {
      id: act.id,
      name: act.name,
      duration: act.duration,
      predecessors: act.predecessors,
      materials: act.materials,
      materialQty: act.materialQty,
      es: act.es,
      ef: act.ef,
      ls: act.ls,
      lf: act.lf,
      totalFloat: act.totalFloat,
      freeFloat: act.freeFloat,
      isCritical: act.isCritical,
    };
  });

  // 找出要徑路線
  const criticalActivities = results.filter(r => r.isCritical).map(r => r.id);

  return {
    results,
    projectDuration,
    criticalActivities,
  };
};

/**
 * 拓撲排序 - 確保前置作業優先計算
 * @param {Array} activities - 作業陣列
 * @returns {Array} 排序後的作業 ID 陣列
 */
const topologicalSort = (activities) => {
  const idSet = new Set(activities.map(a => a.id));
  const inDegree = new Map();
  const adjList = new Map();

  activities.forEach(act => {
    inDegree.set(act.id, 0);
    adjList.set(act.id, []);
  });

  activities.forEach(act => {
    (act.predecessors || []).forEach(predId => {
      if (idSet.has(predId)) {
        adjList.get(predId).push(act.id);
        inDegree.set(act.id, (inDegree.get(act.id) || 0) + 1);
      }
    });
  });

  // BFS
  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    (adjList.get(current) || []).forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  // 若有環路則加入未排序的作業
  if (sorted.length < activities.length) {
    activities.forEach(act => {
      if (!sorted.includes(act.id)) {
        sorted.push(act.id);
      }
    });
  }

  return sorted;
};
