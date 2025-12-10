// utils/validator.js - 数据验证工具

/**
 * 验证必填字段
 * @param {Object} data - 要验证的数据对象
 * @param {Array} requiredFields - 必填字段数组
 * @returns {Object} { isValid, missingFields }
 */
const validateRequired = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `缺少必填字段: ${missingFields.join(', ')}` 
      : null
  };
};

/**
 * 验证邮箱格式
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国）
 * @param {string} phone 
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证数字范围
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
const isInRange = (value, min, max) => {
  return value >= min && value <= max;
};

/**
 * 验证字符串长度
 * @param {string} str 
 * @param {number} minLength 
 * @param {number} maxLength 
 * @returns {boolean}
 */
const isValidLength = (str, minLength = 0, maxLength = Infinity) => {
  if (!str) return minLength === 0;
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * 验证密码强度
 * @param {string} password 
 * @returns {Object} { isValid, message }
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少6位' };
  }
  
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' };
  }
  
  return { isValid: true, message: null };
};

/**
 * 清理和验证分页参数
 * @param {*} page 
 * @param {*} pageSize 
 * @returns {Object} { page, pageSize }
 */
const sanitizePagination = (page, pageSize) => {
  page = parseInt(page) || 1;
  pageSize = parseInt(pageSize) || 20;
  
  // 限制范围
  page = Math.max(1, page);
  pageSize = Math.min(Math.max(1, pageSize), 100); // 最大100条
  
  return { page, pageSize };
};

/**
 * 验证 ID 是否有效
 * @param {*} id 
 * @returns {boolean}
 */
const isValidId = (id) => {
  const numId = parseInt(id);
  return !isNaN(numId) && numId > 0;
};

module.exports = {
  validateRequired,
  isValidEmail,
  isValidPhone,
  isInRange,
  isValidLength,
  validatePassword,
  sanitizePagination,
  isValidId
};