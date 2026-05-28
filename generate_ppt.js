import pptxgen from "pptxgenjs";

let pptx = new pptxgen();

// Cover
let slideCover = pptx.addSlide();
slideCover.addText("工程物料動態管理儀表板\n(Engineering Material Control Dashboard)", { x: 1, y: 2, w: 8, h: 2, fontSize: 36, bold: true, align: "center", color: "363636" });
slideCover.addText("專案介紹與功能報告", { x: 1, y: 4, w: 8, h: 1, fontSize: 24, align: "center", color: "666666" });

// Table of Contents
let slideTOC = pptx.addSlide();
slideTOC.addText("目錄", { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "363636" });
slideTOC.addText([
    { text: "1. 目的\n" },
    { text: "2. 使用場景\n" },
    { text: "3. 功能介紹\n" },
    { text: "4. 結論\n" }
], { x: 1, y: 1.5, w: 8, h: 3, fontSize: 20, color: "363636", bullet: true });

// Purpose
let slidePurpose = pptx.addSlide();
slidePurpose.addText("目的", { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "363636" });
slidePurpose.addText("本系統旨在提供工程現場主管與物料管理人員一個直觀、實時的「工程物料動態管理儀表板」。\n\n透過視覺化的數據呈現、自動化的預警機制以及多工地支援，協助團隊有效掌控材料(如鋼筋、水泥等)的進場與消耗狀況，降低斷料風險，並精準控制專案成本。", { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 20, color: "363636" });

// Use Cases
let slideCases = pptx.addSlide();
slideCases.addText("使用場景", { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "363636" });
slideCases.addText([
    { text: "多工地管理: 專案經理可隨時切換不同工地(如主工地、副工地)，獨立查看各自的物料狀態。\n" },
    { text: "現場盤點與日誌登錄: 現場工程師每日透過系統輸入採購量與消耗量，保持庫存資料實時更新。\n" },
    { text: "高階匯報: 匯出 Excel、Word 或 Txt 報表，供月度會議或跨部門溝通使用。\n" },
    { text: "庫存異常應對: 當系統出現「斷料預警 (SPI 高風險)」時，採購部門能立即反應並追加訂單。" }
], { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18, color: "363636", bullet: true });

// Feature Introduction
let slideFeatures = pptx.addSlide();
slideFeatures.addText("功能介紹", { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "363636" });
slideFeatures.addText([
    { text: "視覺化數據看板: 即時顯示動態庫存、實際單位成本、累計採購支出。\n" },
    { text: "智慧預警診斷 (SPI): 自動偵測庫存是否低於未來預計消耗量，提供紅綠燈狀態提示。\n" },
    { text: "多工地資料隔離: 支援新增、切換與刪除工地，資料獨立儲存不混淆。\n" },
    { text: "一鍵匯入與匯出: 支援 Excel 歷史報表匯入(可選擇覆蓋或附加)，並可匯出為多種格式。\n" },
    { text: "動態材料與單位管理: 自由新增材料類型，並支援動態點擊修改庫存單位。" }
], { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18, color: "363636", bullet: true });

// Conclusion
let slideConclusion = pptx.addSlide();
slideConclusion.addText("結論", { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: "363636" });
slideConclusion.addText("工程物料動態管理儀表板成功將繁瑣的現場物料管控數位化與自動化。\n\n它不僅提升了數據的透明度與準確性，更為營建工程專案帶來了更高的管理效率與成本控制能力，是現代化工程管理不可或缺的輔助工具。", { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 20, color: "363636" });

pptx.writeFile({ fileName: "Engineering_Material_Dashboard_Presentation.pptx" });
