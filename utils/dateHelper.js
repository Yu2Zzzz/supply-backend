// utils/dateHelper.js - 日期处理工具

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date 
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 * @param {Date|string} date 
 * @returns {string}
 */
const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${datePart} ${hours}:${minutes}:${seconds}`;
};

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 
 * @param {Date|string} date2 
 * @returns {number}
 */
const daysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 获取今天的日期（零点）
 * @returns {Date}
 */
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * 检查日期是否有效
 * @param {*} date 
 * @returns {boolean}
 */
const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * 添加天数
 * @param {Date|string} date 
 * @param {number} days 
 * @returns {Date}
 */
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * 获取日期范围（用于查询）
 * @param {string} type - 'today', 'week', 'month', 'year'
 * @returns {Object} { startDate, endDate }
 */
const getDateRange = (type = 'month') => {
  const today = getToday();
  let startDate, endDate;
  
  switch (type) {
    case 'today':
      startDate = today;
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    default:
      startDate = today;
      endDate = today;
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

module.exports = {
  formatDate,
  formatDateTime,
  daysDiff,
  getToday,
  isValidDate,
  addDays,
  getDateRange
};