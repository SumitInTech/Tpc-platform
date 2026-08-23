import { downloadExcel, downloadPDF } from './tableExport';
import { formatLPA, formatDate, formatDateTime, labelize, operatorSymbol } from './formatters';

/* ---------------- Applications ---------------- */

const APP_HEADERS = ['Student ID', 'Student Name', 'Branch', 'CGPA', 'Drive', 'Company', 'Eligibility', 'Status', 'Applied At'];

const appRows = (apps) =>
  (apps || []).map((a) => ({
    'Student ID': a.studentId?.studentId || '',
    'Student Name': a.studentId?.name || '',
    Branch: a.studentId?.branch || '',
    CGPA: a.studentId?.cgpa != null ? Number(a.studentId.cgpa).toFixed(2) : '',
    Drive: a.driveId?.title || '',
    Company: a.driveId?.companyId?.name || a.driveId?.companyName || '',
    Eligibility: a.eligibilitySnapshot?.eligible ? 'Verified Eligible' : 'Not Verified',
    Status: labelize(a.status),
    'Applied At': formatDateTime(a.appliedAt),
  }));

export const exportApplicationsToExcel = (apps, fileName = 'applications') =>
  downloadExcel({ sheetName: 'Applications', headers: APP_HEADERS, rows: appRows(apps), fileName });

export const exportApplicationsToPDF = (apps, fileName = 'applications') =>
  downloadPDF({ title: 'Applications Report', headers: APP_HEADERS, rows: appRows(apps), fileName });

/* ---------------- Offers ---------------- */

const OFFER_HEADERS = ['Student ID', 'Student Name', 'Company', 'Role', 'Drive', 'Package', 'Offer Date', 'Status', 'Policy Check'];

const offerRows = (offers) =>
  (offers || []).map((o) => {
    const snap = o.policyDecisionSnapshot;
    return {
      'Student ID': o.studentId?.studentId || '',
      'Student Name': o.studentId?.name || '',
      Company: o.companyId?.name || '',
      Role: o.role || '',
      Drive: o.driveId?.title || '',
      Package: o.package != null ? formatLPA(o.package, o.currency).replace(/[\u2013\u2014?]/g, '') : '',
      'Offer Date': formatDate(o.offerDate),
      Status: labelize(o.status),
      'Policy Check': snap ? (snap.allowed ? 'Passed' : 'Flagged') : '—',
    };
  });

export const exportOffersToExcel = (offers, fileName = 'offers') =>
  downloadExcel({ sheetName: 'Offers', headers: OFFER_HEADERS, rows: offerRows(offers), fileName });

export const exportOffersToPDF = (offers, fileName = 'offers') =>
  downloadPDF({
    title: 'Offers Report',
    headers: OFFER_HEADERS,
    rows: offerRows(offers),
    columnStyles: { 5: { cellWidth: 70 }, 7: { cellWidth: 60 }, 8: { cellWidth: 65 } },
  });

/* ---------------- Placements ---------------- */

const PLACE_HEADERS = ['Student ID', 'Student Name', 'Branch', 'Company', 'Package', 'Placement Date', 'Academic Year', 'Status'];

const placementRows = (records) =>
  (records || []).map((r) => ({
    'Student ID': r.studentId?.studentId || '',
    'Student Name': r.studentId?.name || '',
    Branch: r.branch || '',
    Company: r.companyId?.name || '',
    Package: r.package != null ? formatLPA(r.package, r.currency).replace(/[\u2013\u2014?]/g, '') : '',
    'Placement Date': formatDate(r.placementDate),
    'Academic Year': r.academicYear ?? '',
    Status: labelize(r.status),
  }));

export const exportPlacementsToExcel = (records, fileName = 'placement-records') =>
  downloadExcel({ sheetName: 'Placements', headers: PLACE_HEADERS, rows: placementRows(records), fileName });

export const exportPlacementsToPDF = (records, fileName = 'placement-records') =>
  downloadPDF({ title: 'Placement Records', headers: PLACE_HEADERS, rows: placementRows(records), fileName });

/* ---------------- Companies ---------------- */

const COMPANY_HEADERS = ['Company Name', 'Industry', 'Location', 'Contact Person', 'Contact Email', 'Contact Phone', 'Website', 'Status'];

const companyRows = (companies) =>
  (companies || []).map((c) => ({
    'Company Name': c.name || '',
    Industry: c.industry || '',
    Location: c.location || '',
    'Contact Person': c.contactPerson || '',
    'Contact Email': c.contactEmail || '',
    'Contact Phone': c.contactPhone || '',
    Website: c.website || '',
    Status: c.isActive === false ? 'Inactive' : 'Active',
  }));

export const exportCompaniesToExcel = (companies, fileName = 'companies') =>
  downloadExcel({ sheetName: 'Companies', headers: COMPANY_HEADERS, rows: companyRows(companies), fileName });

export const exportCompaniesToPDF = (companies, fileName = 'companies') =>
  downloadPDF({
    title: 'Recruiting Partners',
    headers: COMPANY_HEADERS,
    rows: companyRows(companies),
    columnStyles: { 3: { cellWidth: 90 }, 6: { cellWidth: 110 } },
  });

/* ---------------- Drives ---------------- */

const DRIVE_HEADERS = ['Drive', 'Company', 'Job Role', 'Job Type', 'Package', 'Location', 'Application Deadline', 'Eligible Branches', 'Grad Years', 'Rules', 'Status'];

const driveRows = (drives) =>
  (drives || []).map((d) => {
    const rules = d.eligibilityRules?.rules || [];
    return {
      Drive: d.title || '',
      Company: d.companyId?.name || '',
      'Job Role': d.jobRole || '',
      'Job Type': labelize(d.jobType),
      Package: d.package != null ? formatLPA(d.package, d.currency).replace(/[\u2013\u2014?]/g, '') : '',
      Location: d.location || 'On campus',
      'Application Deadline': formatDate(d.applicationDeadline),
      'Eligible Branches': (d.eligibleBranches || []).length ? d.eligibleBranches.join(', ') : 'All branches',
      'Grad Years': (d.graduationYears || []).join(', ') || 'Any',
      Rules: rules.length
        ? rules.map((r) => `${r.field} ${operatorSymbol(r.operator)} ${Array.isArray(r.value) ? `[${r.value.join(',')}]` : r.value}`).join(d.eligibilityRules.ruleGroup === 'ANY' ? ' OR ' : ' AND ')
        : 'None',
      Status: labelize(d.status),
    };
  });

export const exportDrivesToExcel = (drives, fileName = 'drives') =>
  downloadExcel({ sheetName: 'Drives', headers: DRIVE_HEADERS, rows: driveRows(drives), fileName });

export const exportDrivesToPDF = (drives, fileName = 'drives') =>
  downloadPDF({
    title: 'Placement Drives',
    headers: DRIVE_HEADERS,
    rows: driveRows(drives),
    columnStyles: { 7: { cellWidth: 70 }, 9: { cellWidth: 130 }, 10: { cellWidth: 60 } },
  });
