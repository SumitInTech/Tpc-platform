const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId, action, entityType, entityId, oldValue, newValue, metadata, ipAddress }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      metadata,
      ipAddress
    });
  } catch (error) {
    console.error('Audit Logging failed:', error);
  }
};

module.exports = { logAudit };
