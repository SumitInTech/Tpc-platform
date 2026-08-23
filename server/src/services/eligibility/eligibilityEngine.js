const AppError = require('../../utils/AppError');

const OPERATORS = {
  EQUAL: (a, b) => a == b,
  NOT_EQUAL: (a, b) => a != b,
  GREATER_THAN: (a, b) => Number(a) > Number(b),
  GREATER_THAN_OR_EQUAL: (a, b) => Number(a) >= Number(b),
  LESS_THAN: (a, b) => Number(a) < Number(b),
  LESS_THAN_OR_EQUAL: (a, b) => Number(a) <= Number(b),
  IN: (a, b) => Array.isArray(b) && b.map(String).includes(String(a)),
  NOT_IN: (a, b) => Array.isArray(b) && !b.map(String).includes(String(a)),
};

const FIELD_LABELS = {
  cgpa: 'CGPA',
  branch: 'Branch',
  activeBacklogs: 'Active Backlogs',
  backlogs: 'Total Backlogs',
  graduationYear: 'Graduation Year',
  gender: 'Gender',
  department: 'Department',
};

function formatRequired(operator, value) {
  const map = {
    EQUAL: '=', NOT_EQUAL: '!=', GREATER_THAN: '>', GREATER_THAN_OR_EQUAL: '>=',
    LESS_THAN: '<', LESS_THAN_OR_EQUAL: '<=', IN: 'IN', NOT_IN: 'NOT IN'
  };
  const opStr = map[operator] || operator;
  const valStr = Array.isArray(value) ? `[${value.join(', ')}]` : value;
  return `${opStr} ${valStr}`;
}

function generateReason(rule, actual, passed) {
  const fieldName = FIELD_LABELS[rule.field] || rule.field;
  if (passed) {
    return `${fieldName} (${actual}) meets requirement (${formatRequired(rule.operator, rule.value)})`;
  } else {
    return `${fieldName} (${actual}) does not meet requirement (${formatRequired(rule.operator, rule.value)})`;
  }
}

function evaluateRule(studentData, rule) {
  const actual = studentData[rule.field];
  const passed = OPERATORS[rule.operator](actual, rule.value);
  return {
    field: rule.field,
    operator: rule.operator,
    required: rule.value,
    actual,
    passed,
    reason: generateReason(rule, actual, passed)
  };
}

async function evaluateStudent(studentDoc, driveDoc) {
  if (!driveDoc.eligibilityRules || !driveDoc.eligibilityRules.rules || driveDoc.eligibilityRules.rules.length === 0) {
    return {
      eligible: true, ruleGroup: 'ALL', results: [], failedRules: [], passedRules: [], summary: 'No eligibility rules set.'
    };
  }

  const { ruleGroup, rules } = driveDoc.eligibilityRules;
  const results = rules.map(rule => evaluateRule(studentDoc, rule));
  const failedRules = results.filter(r => !r.passed);
  const passedRules = results.filter(r => r.passed);

  let eligible = false;
  if (ruleGroup === 'ALL') {
    eligible = failedRules.length === 0;
  } else if (ruleGroup === 'ANY') {
    eligible = passedRules.length > 0;
  }

  let summary = '';
  if (eligible) {
    summary = ruleGroup === 'ALL' ? `All ${rules.length} rules passed.` : `Passed ${passedRules.length} out of ${rules.length} rules.`;
  } else {
    summary = ruleGroup === 'ALL' ? `Failed ${failedRules.length} out of ${rules.length} rules.` : `Failed all ${rules.length} rules.`;
  }

  return { eligible, ruleGroup, results, failedRules, passedRules, summary };
}

module.exports = { evaluateStudent, evaluateRule };
