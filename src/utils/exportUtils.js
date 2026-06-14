import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export const exportToExcel = (siteName, procurements, consumptions) => {
  const wb = XLSX.utils.book_new();

  // Procurement Sheet
  const procData = procurements.map(p => ({
    '日期': p.date,
    '物料類型': p.type,
    '採購數量': p.quantity,
    '總額': p.totalAmount,
    '供應商': p.supplier
  }));
  const procWs = XLSX.utils.json_to_sheet(procData);
  XLSX.utils.book_append_sheet(wb, procWs, "採購紀錄");

  // Consumption Sheet
  const consData = consumptions.map(c => ({
    '日期': c.date,
    '物料類型': c.type,
    '工程工序': c.stage,
    '理論應耗量': c.theoreticalQuantity,
    '人力': c.manpower || ''
  }));
  const consWs = XLSX.utils.json_to_sheet(consData);
  XLSX.utils.book_append_sheet(wb, consWs, "進度紀錄");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${siteName}_物料報表_${today}.xlsx`);
};

export const exportToTxt = (siteName, procurements, consumptions) => {
  let content = `[${siteName}] 工程物料動態報表\n\n`;
  const today = new Date().toISOString().split('T')[0];
  content += `匯出日期: ${today}\n`;
  content += `-------------------------------------------------\n\n`;

  content += `【採購紀錄】\n`;
  if (procurements.length === 0) content += `(無資料)\n`;
  procurements.forEach((p, i) => {
    content += `${i + 1}. 日期: ${p.date} | 物料: ${p.type} | 數量: ${p.quantity} | 總額: $${p.totalAmount} | 供應商: ${p.supplier}\n`;
  });
  content += `\n-------------------------------------------------\n\n`;

  content += `【進度(消耗)紀錄】\n`;
  if (consumptions.length === 0) content += `(無資料)\n`;
  consumptions.forEach((c, i) => {
    content += `${i + 1}. 日期: ${c.date} | 物料: ${c.type} | 工序: ${c.stage} | 應耗量: ${c.theoreticalQuantity} | 人力: ${c.manpower || 'N/A'}\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${siteName}_物料報表_${today}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createWordTable = (headers, rows) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [
      new TableRow({
        children: headers.map(header => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
          shading: { fill: "D9D9D9" }
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ text: String(cell) })]
        }))
      }))
    ]
  });
};

export const exportToWord = async (siteName, procurements, consumptions) => {
  const today = new Date().toISOString().split('T')[0];

  const procHeaders = ['日期', '物料類型', '採購數量', '總額', '供應商'];
  const procRows = procurements.map(p => [p.date, p.type, p.quantity, p.totalAmount, p.supplier]);

  const consHeaders = ['日期', '物料類型', '工程工序', '理論應耗量', '人力'];
  const consRows = consumptions.map(c => [c.date, c.type, c.stage, c.theoreticalQuantity, c.manpower || '']);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `[${siteName}] 工程物料動態報表`, bold: true, size: 32 })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `匯出日期: ${today}` })],
          spacing: { after: 400 }
        }),
        
        new Paragraph({
          children: [new TextRun({ text: "【採購紀錄】", bold: true, size: 24 })],
          spacing: { before: 200, after: 200 }
        }),
        procRows.length > 0 ? createWordTable(procHeaders, procRows) : new Paragraph({ text: "(無資料)" }),

        new Paragraph({
          children: [new TextRun({ text: "【進度(消耗)紀錄】", bold: true, size: 24 })],
          spacing: { before: 400, after: 200 }
        }),
        consRows.length > 0 ? createWordTable(consHeaders, consRows) : new Paragraph({ text: "(無資料)" }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${siteName}_物料報表_${today}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  const procData = [{
    '日期': '2026-05-19',
    '物料類型': '鋼筋',
    '採購數量': 100,
    '總額': 150000,
    '供應商': '中鋼'
  }];
  const procWs = XLSX.utils.json_to_sheet(procData);
  XLSX.utils.book_append_sheet(wb, procWs, "採購紀錄");

  const consData = [{
    '日期': '2026-05-19',
    '物料類型': '鋼筋',
    '工程工序': '1F柱牆',
    '理論應耗量': 50,
    '人力': '5'
  }];
  const consWs = XLSX.utils.json_to_sheet(consData);
  XLSX.utils.book_append_sheet(wb, consWs, "進度紀錄");

  XLSX.writeFile(wb, `匯入格式範例_物料報表.xlsx`);
};

export const exportScheduleTemplate = () => {
  const wb = XLSX.utils.book_new();

  const schedData = [
    {
      '編號': 'A',
      '作業名稱': '基礎開挖',
      '所需材料': '混凝土',
      '數量': 30,
      '人力(人)': 5,
      '工期(天)': 3,
      '前置作業(逗號分隔)': ''
    },
    {
      '編號': 'B',
      '作業名稱': '基礎配筋',
      '所需材料': '鋼筋',
      '數量': 5,
      '人力(人)': 8,
      '工期(天)': 4,
      '前置作業(逗號分隔)': 'A'
    },
    {
      '編號': 'C',
      '作業名稱': '基礎混凝土',
      '所需材料': '混凝土',
      '數量': 60,
      '人力(人)': 10,
      '工期(天)': 5,
      '前置作業(逗號分隔)': 'A,B'
    }
  ];

  const schedWs = XLSX.utils.json_to_sheet(schedData);

  // 設定欄寬
  schedWs['!cols'] = [
    { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, schedWs, "工程排程清單");
  XLSX.writeFile(wb, `匯入格式範例_工程排程分析.xlsx`);
};
