// backend/utils/response.js
const success = (res, data, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const error = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { success, error };