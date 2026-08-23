const PlacementPolicy = require('../../models/PlacementPolicy');

const POLICY_EVALUATORS = {
  MAX_ACCEPTED_OFFERS: (student, policy) => {
    const max = policy.configuration.maximum;
    const current = student.acceptedOffersCount || 0;
    const allowed = current < max;
    return {
      allowed, policy: policy.name, policyType: policy.type,
      reason: allowed ? `Student has ${current} accepted offer(s). Limit is ${max}.` : `Student already has ${current} accepted offer(s), maximum permitted is ${max}.`,
      currentValue: current, allowedValue: max,
    };
  },
  MAX_TOTAL_OFFERS: (student, policy) => {
    const max = policy.configuration.maximum;
    const current = student.acceptedOffersCount || 0; 
    const allowed = current < max;
    return {
      allowed, policy: policy.name, policyType: policy.type,
      reason: allowed ? `Under total offer limit.` : `Exceeded maximum total offers limit.`,
      currentValue: current, allowedValue: max,
    };
  },
  PLACED_STUDENT_RESTRICTION: (student, policy) => {
    const isPlaced = student.placementStatus === 'PLACED';
    const allowed = !isPlaced;
    return {
      allowed, policy: policy.name, policyType: policy.type,
      reason: allowed ? 'Student is not yet placed.' : 'Student already has a placement record. Further applications/offers are restricted.',
      currentValue: student.placementStatus, allowedValue: 'UNPLACED'
    };
  },
  MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION: (student, policy, context) => {
    const minPackage = policy.configuration.minimumPackage;
    const newPackage = context?.drivePackage || 0;
    const allowed = newPackage >= minPackage;
    return {
      allowed, policy: policy.name, policyType: policy.type,
      reason: allowed ? `Package ${newPackage} meets minimum ${minPackage}.` : `Drive package ${newPackage} LPA does not meet minimum package requirement of ${minPackage} LPA for additional application.`,
      currentValue: newPackage, allowedValue: minPackage
    };
  },
  BRANCH_SPECIFIC_RESTRICTION: (student, policy, context) => {
    const restrictedBranches = policy.configuration.branches || [];
    const allowed = !restrictedBranches.includes(student.branch);
    return {
      allowed, policy: policy.name, policyType: policy.type,
      reason: allowed ? 'Branch not restricted.' : `Students from ${student.branch} branch have a specific restriction for this action.`,
      currentValue: student.branch, allowedValue: 'unrestricted'
    };
  }
};

async function evaluateStudentAction(studentDoc, action, context = {}) {
  const now = new Date();
  const policies = await PlacementPolicy.find({
    isActive: true,
    $or: [{ effectiveFrom: { $lte: now }, effectiveTo: { $gte: now } }, { effectiveFrom: { $lte: now }, effectiveTo: null }, { effectiveFrom: null, effectiveTo: null }]
  });

  const decisions = [];
  const blockedBy = [];
  let allowed = true;

  for (const policy of policies) {
    if (POLICY_EVALUATORS[policy.type]) {
      const result = POLICY_EVALUATORS[policy.type](studentDoc, policy, context);
      decisions.push(result);
      if (!result.allowed) {
        allowed = false;
        blockedBy.push(policy.name);
      }
    }
  }

  const summary = allowed ? 'All policy checks passed' : `Blocked by: ${blockedBy.join(', ')}`;
  return { allowed, decisions, blockedBy, summary };
}

async function evaluateSinglePolicy(studentDoc, policyId, action, context = {}) {
  const policy = await PlacementPolicy.findById(policyId);
  if (!policy || !policy.isActive) return { allowed: true, summary: 'Policy inactive or not found' };
  
  if (POLICY_EVALUATORS[policy.type]) {
    const result = POLICY_EVALUATORS[policy.type](studentDoc, policy, context);
    return { allowed: result.allowed, decisions: [result], blockedBy: result.allowed ? [] : [policy.name], summary: result.reason };
  }
  return { allowed: true };
}

module.exports = { evaluateStudentAction, evaluateSinglePolicy };
