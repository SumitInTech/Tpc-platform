import { downloadExcel, downloadPDF } from './tableExport';

const HEADERS = ['Student ID', 'Name', 'Email', 'Branch', 'Batch', 'Grad Year', 'CGPA', 'Active Backlogs', 'Total Backlogs', 'Placement Status'];

const toRows = (students) =>
  (students || []).map((s) => ({
    'Student ID': s.studentId || '',
    Name: s.name || '',
    Email: s.email || '',
    Branch: s.department ? `${s.branch} (${s.department})` : s.branch || '',
    Batch: s.batch || '',
    'Grad Year': s.graduationYear ?? '',
    CGPA: s.cgpa != null ? Number(s.cgpa).toFixed(2) : '',
    'Active Backlogs': s.activeBacklogs ?? 0,
    'Total Backlogs': s.backlogs ?? 0,
    'Placement Status': (s.placementStatus || '').replace('_', ' '),
  }));

export function exportStudentsToExcel(students, fileName = 'students') {
  downloadExcel({ sheetName: 'Students', headers: HEADERS, rows: toRows(students), fileName });
}

export function exportStudentsToPDF(students, fileName = 'students') {
  downloadPDF({
    title: 'Student Directory',
    headers: HEADERS,
    rows: toRows(students),
    fileName,
    columnStyles: {
      2: { cellWidth: 130 },
      3: { cellWidth: 80 },
    },
  });
}
