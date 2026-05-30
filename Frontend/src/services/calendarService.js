import { api } from "../config/api";

export const calendarService = {
  lunarToSolar: (lunarYear, lunarMonth, lunarDay, isLeapMonth = false) =>
    api.post("/api/v1/calendar/lunar-to-solar", {
      lunar_year: lunarYear,
      lunar_month: lunarMonth,
      lunar_day: lunarDay,
      is_leap_month: isLeapMonth,
      timezone_offset: 7.0,
    }),

  solarToLunar: (dobSolar) =>
    api.post("/api/v1/calendar/solar-to-lunar", {
      dob_solar: dobSolar,
      timezone_offset: 7.0,
    }),
};
