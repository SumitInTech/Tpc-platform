import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadExcel({ sheetName = 'Sheet1', headers, rows, fileName }) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  ws['!cols'] = headers.map((h) => ({
    wch: Math.max(10, h.length + 3, ...rows.slice(0, 50).map((r) => String(r[h] ?? '').length + 2)),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function downloadPDF({ title, headers, rows, fileName, landscape = true, columnStyles }) {
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Exported ${new Date().toLocaleDateString()} · ${(rows || []).length} record(s)`, 40, 56);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 70,
    head: [headers],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ''))),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 247, 252] },
    ...(columnStyles ? { columnStyles } : {}),
  });

  doc.save(`${fileName}.pdf`);
}
