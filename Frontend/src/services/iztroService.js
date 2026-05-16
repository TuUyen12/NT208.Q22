import { astro } from "iztro";
import solarLunar from 'solarlunar';

import {
  translatePalace,
  translateStar,
  translateStemBranch,
  translateElementClass,            
  translateYinYang,        
} from "../utils/translateData";

/* =========================================================
   Generate chart data from user form
========================================================= */
function convertHourToBranch(hour) {
  if (hour >= 23 || hour < 1) return 0;
  if (hour < 3) return 1;
  if (hour < 5) return 2;
  if (hour < 7) return 3;
  if (hour < 9) return 4;
  if (hour < 11) return 5;
  if (hour < 13) return 6;
  if (hour < 15) return 7;
  if (hour < 17) return 8;
  if (hour < 19) return 9;
  if (hour < 21) return 10;
  return 11;
}

export async function generateChartData(formData) {
  try {
    const { birthDate, birthHour, gender, targetYear } = formData;

    /* =========================================
       Convert date
    ========================================= */
    const date = new Date(`${birthDate}T${birthHour}`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();

    /* =========================================
       Generate chart from iztro
    ========================================= */
    const solarDate = `${year}-${month}-${day}`;
    const branchHour = convertHourToBranch(hour);

    const chart = astro.bySolar(
      solarDate,
      branchHour,
      gender === "male" ? "男" : "女",
      false,
      "zh-CN"
    );
    // ===== CHỈNH SỬA CHÍNH: tính âm lịch bằng solarlunar =====
    const lunarInfo = solarLunar.solar2lunar(year, month, day);
    const lunarDateFormatted = `${lunarInfo.lYear}-${lunarInfo.lMonth.toString().padStart(2, '0')}-${lunarInfo.lDay.toString().padStart(2, '0')}`;
    const palaces = Object.values(chart.palaces);

    /* =========================================
       Convert to UI structure
    ========================================= */
    const palaceData = palaces.map((p) => ({
      StemBranch: translateStemBranch(p.heavenlyStem + p.earthlyBranch),
      PalaceName: translatePalace(p.name),
      Age: p.ageRange || "",
      majorStarsFull: p.majorStars || [],
      minorStarsFull: p.minorStars || [],
      adjectiveStarsFull: p.adjectiveStars || [],
      MainStars: p.majorStars?.map((s) => translateStar(s.name)) || [],
      LeftStars: p.minorStars?.slice(0, 4).map((s) => translateStar(s.name)) || [],
      RightStars: p.minorStars?.slice(4, 8).map((s) => translateStar(s.name)) || [],
    }));

    /* =========================================
       Center info
    ========================================= */
    const centerInfo = {
      destiny: gender === "male" ? "Nam" : "Nữ",
      solarDate: birthDate,
      lunarDate: lunarDateFormatted,  
      birthHour: birthHour,
      yinYang: translateYinYang(chart.yinYang || ""),
      element: translateElementClass(chart.fiveElementsClass || ""),
      cuc: chart.phase || "",
      viewYear: targetYear,
    };

    return { palaceData, centerInfo };
  } catch (error) {
    console.error("GENERATE ERROR:", error);
    throw error;
  }
}