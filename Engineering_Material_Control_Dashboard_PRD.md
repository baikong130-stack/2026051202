# 工程物料動態管理戰情室 (Engineering Material Control Dashboard) - PRD

## 1. 專案背景與目標 (Project Background & Objectives)
在工程專案管理中，物料管理是核心挑戰之一。本專案開發一個基於 React + Vite 的網頁應用，專注於「實際採購 (Actual Procurement)」與「理論消耗 (Theoretical Consumption)」的動態對比。透過仿照股市交易的視覺化邏輯（買量 vs 賣量），讓管理人員能即時識別成本異常、斷料風險與資金效率。

### 核心價值
- **數據真實性**：排除複雜的人力單價變數，以實際採購金額對比設計理論用量。
- **直觀決策**：利用圖表互動即時抓出單價波動或現場損耗異常。
- **輕量化實作**：針對工程實務需求，提供簡潔的數據模型與高性能的視覺化呈現。

---

## 2. 功能需求 (Functional Requirements)

### 2.1 數據模型定義
- **採購數據 (Procurement Data)**：
  - 日期、物料類型、採購數量、**實際採購總額**、供應商資訊。
- **進度數據 (Theoretical Consumption)**：
  - 工程工序、預定執行日期、**理論應耗量**（依據設計圖說）。

### 2.2 核心運算邏輯
- **累積庫存水位** = $\sum \text{採購量} - \sum \text{理論消耗量}$。
- **實際單位成本** = $\frac{\text{累積採購總額}}{\text{累積採購量}}$。
- **斷料預警**：當累積庫存低於未來三天的預計消耗量時，系統觸發警示。

---

## 3. 介面與視覺化設計 (UI & Visualization)

### 3.1 雙層互動圖表
- **上層：累計成本曲線 (Cumulative Cost Area Chart)**
  - 顯示隨著時間推移的累積實際支出。
  - **互動**：點擊折點可顯示該日期的採購明細。
- **下層：進銷存對照直方圖 (Volume Histogram)**
  - **綠柱 (Buy)**：實際進場量。
  - **紅柱 (Sell)**：理論應耗量。
  - **連動**：滑鼠懸停 (Hover) 時，上下兩層圖表同步顯示十字準星。

### 3.2 異常分析看板
- **SPI (進度績效)** 與 **CPI (成本績效)** 之簡化版指標：
  - 數量偏差：$\frac{\text{累積採購量}}{\text{理論耗量}}$ 的比例分析。
  - 資金壓力：當前採購支出佔預計總支出的百分比。

---

## 4. 技術架構 (Technical Stack)
- **Frontend Framework**: React 18 (Hooks, Context API)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Visualization Library**: ECharts 或 Recharts
- **Data Handling**: JSON / CSV 模擬 API 響應

---

## 5. 開發路徑 (Development Roadmap)
1. **MVP 階段**：建立基礎數據錄入組件與單一物料的買賣量直方圖。
2. **互動增強**：實作上下圖表連動與時間軸縮放 (DataZoom)。
3. **診斷模組**：加入自動化預警機制（如：庫存不足變色）。

---

## 6. 指導老師演示亮點
- 展示如何透過點擊圖表中的「成本跳躍點」，定位到特定日期的異常高價採購。
- 演示工程進度推移時，庫存線如何動態變化，體現「精實管理」思想。
