exports.sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.sendError = (res, message = 'Error', code = 'ERROR', statusCode = 400, errors = []) => {
  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors
  });
};

exports.sendPaginated = (res, items, pagination, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data: items,
    pagination
  });
};
