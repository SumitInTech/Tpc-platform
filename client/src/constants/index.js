export const ROLES = {
  ADMIN: 'ADMIN',
  TPC_OFFICER: 'TPC_OFFICER',
  STUDENT: 'STUDENT',
};

export const DRIVE_STATUS = ['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED', 'CANCELLED'];

export const APPLICATION_STATUS = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'];

export const APPLICATION_FLOW = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

export const OFFER_STATUS = ['OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];

export const PLACEMENT_STATUS = ['PLACED', 'JOINING_PENDING', 'JOINED', 'WITHDRAWN'];

export const STUDENT_PLACEMENT_STATUS = ['UNPLACED', 'PLACED', 'NOT_INTERESTED'];

export const STUDENT_CAREER_OUTCOME = ['PLACED', 'HIGHER_STUDIES', 'ENTREPRENEUR', 'PHD', 'SEEKING', 'NOT_INTERESTED'];

export const OPERATORS = [
  { value: 'EQUAL', label: '= (equals)' },
  { value: 'NOT_EQUAL', label: '≠ (not equals)' },
  { value: 'GREATER_THAN', label: '> (greater than)' },
  { value: 'GREATER_THAN_OR_EQUAL', label: '≥ (at least)' },
  { value: 'LESS_THAN', label: '< (less than)' },
  { value: 'LESS_THAN_OR_EQUAL', label: '≤ (at most)' },
  { value: 'IN', label: 'IN (one of list)' },
  { value: 'NOT_IN', label: 'NOT IN (none of list)' },
];

export const RULE_FIELDS = [
  { value: 'cgpa', label: 'CGPA', type: 'number', placeholder: 'e.g. 7.5' },
  { value: 'branch', label: 'Branch', type: 'list', placeholder: 'CSE, IT' },
  { value: 'activeBacklogs', label: 'Active Backlogs', type: 'number', placeholder: 'e.g. 0' },
  { value: 'backlogs', label: 'Total Backlogs', type: 'number', placeholder: 'e.g. 0' },
  { value: 'graduationYear', label: 'Graduation Year', type: 'number', placeholder: 'e.g. 2027' },
  { value: 'department', label: 'Department', type: 'list', placeholder: 'Computer Science' },
];

export const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'];

export const POLICY_TYPES = [
  { value: 'MAX_ACCEPTED_OFFERS', label: 'Maximum Accepted Offers', configKey: 'maximum', configLabel: 'Maximum accepted offers allowed' },
  { value: 'MAX_TOTAL_OFFERS', label: 'Maximum Total Offers', configKey: 'maximum', configLabel: 'Maximum total offers allowed' },
  { value: 'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION', label: 'Minimum Package For Additional Application', configKey: 'minimumPackage', configLabel: 'Minimum package (LPA) required' },
  { value: 'PLACED_STUDENT_RESTRICTION', label: 'Placed Student Restriction', configKey: null },
  { value: 'BRANCH_SPECIFIC_RESTRICTION', label: 'Branch Specific Restriction', configKey: 'branches', configLabel: 'Restricted branches (comma separated)' },
];

export const JOB_TYPES = ['FULL_TIME', 'INTERN', 'CONTRACT'];

export const STATUS_BADGE_TONE = {
  // drives
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CLOSED: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'danger',
  // applications
  APPLIED: 'info',
  SHORTLISTED: 'primary',
  INTERVIEW: 'warning',
  SELECTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
  // offers
  OFFERED: 'info',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  // placements / students
  UNPLACED: 'neutral',
  PLACED: 'success',
  NOT_INTERESTED: 'neutral',
  JOINING_PENDING: 'warning',
  JOINED: 'success',
  // policies
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

// Valid application status transitions (mirrors server-side machine)
export const TRANSITIONS = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};
