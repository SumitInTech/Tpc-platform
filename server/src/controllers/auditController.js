const AuditLog = require('../models/AuditLog');
const { sendPaginated, sendSuccess } = require('../utils/responseHelper');

exports.getAuditStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fortnightAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [total, today, thisWeek, daily, byAction, byEntityType] = await Promise.all([
      AuditLog.countDocuments({}),
      AuditLog.countDocuments({ timestamp: { $gte: startOfToday } }),
      AuditLog.countDocuments({ timestamp: { $gte: weekAgo } }),
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: fortnightAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$entityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const actors = await AuditLog.distinct('userId', { userId: { $exists: true, $ne: null } });
    const sensitive = await AuditLog.countDocuments({ action: { $in: ['WITHDRAW_OFFER', 'REVOKE_OFFER', 'DECLINE_OFFER'] } });

    sendSuccess(res, {
      total,
      today,
      thisWeek,
      uniqueActors: actors.length,
      sensitive,
      daily,
      byAction,
      byEntityType,
    });
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, entityType, userId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('userId', 'name email role');
    
    const total = await AuditLog.countDocuments(query);
    sendPaginated(res, logs, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};
