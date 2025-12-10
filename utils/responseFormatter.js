// utils/responseFormatter.js - 统一响应格式化

/**
 * 成功响应
 * @param {*} data - 返回的数据
 * @param {string} message - 成功消息
 * @returns {Object}
 */
const success = (data, message = '操作成功') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 错误响应
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP 状态码
 * @returns {Object}
 */
const error = (message = '操作失败', statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * 分页响应
 * @param {Array} list - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 消息
 * @returns {Object}
 */
const paginated = (list, pagination, message = '查询成功') => {
  return {
    success: true,
    message,
    data: {
      list,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.pageSize)
      }
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * 列表响应（无分页）
 * @param {Array} items - 数据列表
 * @param {string} message - 消息
 * @returns {Object}
 */
const list = (items, message = '查询成功') => {
  return {
    success: true,
    message,
    data: items,
    count: items.length,
    timestamp: new Date().toISOString()
  };
};

/**
 * 创建响应
 * @param {*} data - 创建的数据（通常是 ID）
 * @param {string} message - 成功消息
 * @returns {Object}
 */
const created = (data, message = '创建成功') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 更新响应
 * @param {*} data - 更新后的数据
 * @param {string} message - 成功消息
 * @returns {Object}
 */
const updated = (data, message = '更新成功') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 删除响应
 * @param {string} message - 成功消息
 * @returns {Object}
 */
const deleted = (message = '删除成功') => {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  success,
  error,
  paginated,
  list,
  created,
  updated,
  deleted
};