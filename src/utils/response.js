// src/utils/response.js
const success = (res, data, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const error = (res, message = '操作失败', statusCode = 400, code = 'ERROR') => {
  res.status(statusCode).json({
    success: false,
    message,
    code
  });
};

const paginated = (res, data, pagination, message = '查询成功') => {
  res.json({
    success: true,
    message,
    data,
    pagination
  });
};

module.exports = { success, error, paginated };
