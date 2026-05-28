import * as XLSX from 'xlsx';

const generateId = (prefix, idx) => `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;

const formatDate = (val) => {
  if (!val) return '';
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    } catch (e) {
      return String(val);
    }
  }
  const strVal = String(val).trim();
  if (strVal.includes('/')) {
    const parts = strVal.split('/');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return strVal;
};

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let procurements = [];
        let consumptions = [];

        // Parse Procurement Sheet
        const procSheetName = workbook.SheetNames.find(name => name.includes("採購紀錄"));
        if (procSheetName) {
          const procSheet = workbook.Sheets[procSheetName];
          const procJson = XLSX.utils.sheet_to_json(procSheet);
          procurements = procJson.map((row, idx) => ({
            id: generateId('proc-import', idx),
            date: formatDate(row['日期']),
            type: row['物料類型'] || '',
            quantity: Number(row['採購數量']) || 0,
            totalAmount: Number(row['總額']) || 0,
            supplier: row['供應商'] || ''
          })).filter(p => p.date && p.type); // Basic validation
        }

        // Parse Consumption Sheet
        const consSheetName = workbook.SheetNames.find(name => name.includes("進度紀錄"));
        if (consSheetName) {
          const consSheet = workbook.Sheets[consSheetName];
          const consJson = XLSX.utils.sheet_to_json(consSheet);
          consumptions = consJson.map((row, idx) => ({
            id: generateId('cons-import', idx),
            date: formatDate(row['日期']),
            type: row['物料類型'] || '',
            stage: row['工程工序'] || '',
            theoreticalQuantity: Number(row['理論應耗量']) || 0,
            manpower: row['人力'] ? String(row['人力']) : ''
          })).filter(c => c.date && c.type); // Basic validation
        }

        resolve({ procurements, consumptions });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
