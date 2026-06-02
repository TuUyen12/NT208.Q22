// src/services/lunarConverter.js
import { Lunar, Solar } from 'lunar-javascript';

/**
 * Chuyển đổi ngày âm lịch sang dương lịch
 * @param {number} year - Năm âm lịch
 * @param {number} month - Tháng âm lịch (1-12)
 * @param {number} day - Ngày âm lịch
 * @param {boolean} isLeapMonth - Có phải tháng nhuận không
 * @returns {string|null} Chuỗi ngày dương YYYY-MM-DD, null nếu lỗi
 */
export function lunarToSolarLocal(year, month, day, isLeapMonth = false) {
  try {
    const lunar = Lunar.fromYmd(year, month, day, isLeapMonth);
    const solar = lunar.getSolar();
    const y = solar.getYear();
    const m = String(solar.getMonth()).padStart(2, '0');
    const d = String(solar.getDay()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (e) {
    console.error('Lỗi chuyển đổi âm -> dương:', e);
    return null;
  }
}

/**
 * Chuyển đổi ngày dương lịch sang âm lịch
 * @param {string} dateStr - Chuỗi YYYY-MM-DD
 * @returns {object|null} { year, month, day, isLeapMonth, lunarDateStr } hoặc null
 */
export function solarToLunarLocal(dateStr) {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const month = lunar.getMonth(); // tháng nhuận có thể là số âm, cần xử lý
    const isLeapMonth = month < 0;
    const absMonth = Math.abs(month);
    return {
      year: lunar.getYear(),
      month: absMonth,
      day: lunar.getDay(),
      isLeapMonth,
      lunarDateStr: `${lunar.getYear()}-${String(absMonth).padStart(2, '0')}-${String(lunar.getDay()).padStart(2, '0')}`,
    };
  } catch (e) {
    console.error('Lỗi chuyển đổi dương -> âm:', e);
    return null;
  }
}