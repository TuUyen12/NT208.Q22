// ============================================================
// BẢNG DỊCH THUẬT TỬ VI: TIẾNG TRUNG → TIẾNG VIỆT
// Dùng cho dữ liệu từ thư viện iztro
// ============================================================

export const PALACE_NAMES = {
  命宫: "Mệnh", 兄弟: "Huynh Đệ", 夫妻: "Phu Thê", 子女: "Tử Tức",
  财帛: "Tài Bạch", 疾厄: "Tật Ách", 迁移: "Thiên Di", 交友: "Giao Hữu",
  仆役: "Nô Bộc", 官禄: "Quan Lộc", 田宅: "Điền Trạch", 福德: "Phúc Đức",
  父母: "Phụ Mẫu",
};

export const MAJOR_STARS = {
  紫微: "Tử Vi", 天机: "Thiên Cơ", 太阳: "Thái Dương", 武曲: "Vũ Khúc",
  天同: "Thiên Đồng", 廉贞: "Liêm Trinh", 天府: "Thiên Phủ", 太阴: "Thái Âm",
  贪狼: "Tham Lang", 巨门: "Cự Môn", 天相: "Thiên Tướng", 天梁: "Thiên Lương",
  七杀: "Thất Sát", 破军: "Phá Quân",
};

export const MINOR_STARS = {
  // Lục cát tinh
  文昌: "Văn Xương", 文曲: "Văn Khúc", 左辅: "Tả Phụ", 右弼: "Hữu Bật",
  天魁: "Thiên Khôi", 天钺: "Thiên Việt",
  // Lộc & Mã
  禄存: "Lộc Tồn", 天马: "Thiên Mã",
  // Tứ sát tinh
  擎羊: "Kình Dương", 陀罗: "Đà La", 火星: "Hỏa Tinh", 铃星: "Linh Tinh",
  地空: "Địa Không", 地劫: "Địa Kiếp",
  // Tứ hóa
  化禄: "Hóa Lộc", 化权: "Hóa Quyền", 化科: "Hóa Khoa", 化忌: "Hóa Kỵ",
  // Đào hoa & tình duyên
  天喜: "Thiên Hỷ", 红鸾: "Hồng Loan", 天姚: "Thiên Diêu", 咸池: "Hàm Trì",
  // Hung tinh
  天刑: "Thiên Hình", 天巫: "Thiên Vu", 阴煞: "Âm Sát", 天虚: "Thiên Hư",
  天哭: "Thiên Khốc", 孤辰: "Cô Thần", 寡宿: "Quả Tú", 破碎: "Phá Toái",
  大耗: "Đại Hao", 小耗: "Tiểu Hao", 蜚廉: "Phi Liêm", 飞廉: "Phi Liêm",
  劫煞: "Kiếp Sát", 灾煞: "Tai Sát", 天煞: "Thiên Sát", 指背: "Chỉ Bối",
  // Phúc & Quý tinh
  三台: "Tam Thai", 八座: "Bát Tọa", 恩光: "Ân Quang", 天贵: "Thiên Quý",
  龙池: "Long Trì", 凤阁: "Phụng Các", 台辅: "Đài Phụ", 封诰: "Phong Cáo",
  天官: "Thiên Quan", 天福: "Thiên Phúc",
  // Giải tinh
  解神: "Giải Thần", 天月: "Thiên Nguyệt", 月德: "Nguyệt Đức", 年解: "Niên Giải",
  // Tuế tinh
  岁建: "Tuế Kiến", 晦气: "Hối Khí", 丧门: "Tang Môn", 贯索: "Quán Sách",
  官符: "Quan Phù", 龙德: "Long Đức", 白虎: "Bạch Hổ", 天德: "Thiên Đức",
  吊客: "Điếu Khách", 病符: "Bệnh Phù", 岁破: "Tuế Phá",
  // Bác sĩ thập nhị thần
  博士: "Bác Sĩ", 力士: "Lực Sĩ", 青龙: "Thanh Long", 将军: "Tướng Quân",
  奏书: "Tấu Thư", 喜神: "Hỷ Thần", 伏兵: "Phục Binh", 官府: "Quan Phủ",
  // Lưu niên sao
  流禄: "Lưu Lộc", 流马: "Lưu Mã", 流昌: "Lưu Xương", 流曲: "Lưu Khúc",
  流魁: "Lưu Khôi", 流钺: "Lưu Việt", 流羊: "Lưu Dương", 流陀: "Lưu Đà",
  流火: "Lưu Hỏa", 流铃: "Lưu Linh", 流忌: "Lưu Kỵ",
};

export const EARTHLY_BRANCHES = {
  子: "Tý", 丑: "Sửu", 寅: "Dần", 卯: "Mão", 辰: "Thìn", 巳: "Tỵ",
  午: "Ngọ", 未: "Mùi", 申: "Thân", 酉: "Dậu", 戌: "Tuất", 亥: "Hợi",
};

export const HEAVENLY_STEMS = {
  甲: "Giáp", 乙: "Ất", 丙: "Bính", 丁: "Đinh", 戊: "Mậu",
  己: "Kỷ", 庚: "Canh", 辛: "Tân", 壬: "Nhâm", 癸: "Quý",
};

// ===== TRẠNG THÁI SAO - Viết tắt kiểu Horos =====
// M = Miếu | V = Vượng | Đ = Đắc | B = Bình | H = Hãm
export const BRIGHTNESS_ABBR = {
  庙: "M", 旺: "V", 得地: "Đ", 利益: "Đ", 平和: "B",
  不得地: "B", 落陷: "H", 陷: "H", 闲: "B",
  // Đã dịch sang tiếng Việt
  Miếu: "M", Vượng: "V", "Đắc Địa": "Đ", "Lợi Ích": "Đ",
  "Bình Hòa": "B", Bình: "B", "Không Đắc": "B", Hãm: "H",
};

export const BRIGHTNESS_COLOR = {
  M: "#f97316",  // Miếu — cam
  V: "#22c55e",  // Vượng — xanh lá
  Đ: "#60a5fa",  // Đắc — xanh dương
  B: "#94a3b8",  // Bình — xám
  H: "#6b7280",  // Hãm — xám tối
};

// ===== NGŨ HÀNH CỤC =====
export const FIVE_ELEMENTS = {
  水二局: "Thủy Nhị Cục", 木三局: "Mộc Tam Cục", 金四局: "Kim Tứ Cục",
  土五局: "Thổ Ngũ Cục", 火六局: "Hỏa Lục Cục",
  "水二": "Thủy Nhị Cục", "木三": "Mộc Tam Cục", "金四": "Kim Tứ Cục",
  "土五": "Thổ Ngũ Cục", "火六": "Hỏa Lục Cục",
};

// ===== NẠP ÂM (Mệnh) =====
export const NAYIN = {
  海中金: "Hải Trung Kim", 炉中火: "Lư Trung Hỏa", 大林木: "Đại Lâm Mộc",
  路旁土: "Lộ Bàng Thổ", 剑锋金: "Kiếm Phong Kim", 山头火: "Sơn Đầu Hỏa",
  涧下水: "Giản Hạ Thủy", 城头土: "Thành Đầu Thổ", 白蜡金: "Bạch Lạp Kim",
  杨柳木: "Dương Liễu Mộc", 泉中水: "Tuyền Trung Thủy", 屋上土: "Ốc Thượng Thổ",
  霹雳火: "Tích Lịch Hỏa", 松柏木: "Tùng Bách Mộc", 长流水: "Trường Lưu Thủy",
  沙中金: "Sa Trung Kim", 山下火: "Sơn Hạ Hỏa", 平地木: "Bình Địa Mộc",
  壁上土: "Bích Thượng Thổ", 金箔金: "Kim Bạc Kim", 覆灯火: "Phúc Đăng Hỏa",
  天河水: "Thiên Hà Thủy", 大驿土: "Đại Trạch Thổ", 钗钏金: "Thoa Xuyến Kim",
  桑柘木: "Tang Thá Mộc", 大溪水: "Đại Khê Thủy", 沙中土: "Sa Trung Thổ",
  天上火: "Thiên Thượng Hỏa", 石榴木: "Thạch Lựu Mộc", 大海水: "Đại Hải Thủy",
};

// ============================================================
// HÀM TIỆN ÍCH
// ============================================================
const ALL_STARS = { ...MAJOR_STARS, ...MINOR_STARS };

export const translatePalace = (name) => {
  if (!name) return name;
  const stripped = name.replace(/^(Cung\s*)/i, "").trim();
  return PALACE_NAMES[stripped] || stripped;
};

export const translateStar = (name) => {
  if (!name) return name;
  const hoaKeys = ["化禄", "化权", "化科", "化忌"];
  for (const hoa of hoaKeys) {
    if (name.endsWith(hoa)) {
      const starVi = ALL_STARS[name.slice(0, -hoa.length)] || name.slice(0, -hoa.length);
      const hoaVi = MINOR_STARS[hoa] || hoa;
      return `${starVi} ${hoaVi}`;
    }
  }
  return ALL_STARS[name] || name;
};

export const translateBranch = (b) => (b ? EARTHLY_BRANCHES[b] || b : b);
export const translateStem = (s) => (s ? HEAVENLY_STEMS[s] || s : s);
export const translateSoulStar = (n) => (n ? MAJOR_STARS[n] || MINOR_STARS[n] || n : n);
export const translateFiveElements = (fe) => (fe ? FIVE_ELEMENTS[fe] || fe : fe);
export const translateNayin = (n) => (n ? NAYIN[n] || n : n);

export const getBrightnessAbbr = (b) => (b ? BRIGHTNESS_ABBR[b] || "" : "");
export const getBrightnessColor = (b) => {
  const abbr = getBrightnessAbbr(b);
  return BRIGHTNESS_COLOR[abbr] || "#94a3b8";
};

export const translatePalaceData = (palace) => {
  if (!palace) return palace;
  return {
    ...palace,
    name: translatePalace(palace.name),
    heavenlyStem: translateStem(palace.heavenlyStem),
    earthlyBranch: translateBranch(palace.earthlyBranch),
    majorStars: (palace.majorStars || []).map((s) => ({
      ...s,
      name: translateStar(s.name),
      brightnessAbbr: getBrightnessAbbr(s.brightness),
      brightnessColor: getBrightnessColor(s.brightness),
    })),
    minorStars: (palace.minorStars || []).map((s) => ({
      ...s,
      name: translateStar(s.name),
      brightnessAbbr: getBrightnessAbbr(s.brightness),
      brightnessColor: getBrightnessColor(s.brightness),
    })),
    adjectiveStar: (palace.adjectiveStar || []).map((s) => ({
      ...s,
      name: translateStar(s.name),
    })),
    decadal: palace.decadal
      ? {
          ...palace.decadal,
          heavenlyStem: translateStem(palace.decadal.heavenlyStem),
          earthlyBranch: translateBranch(palace.decadal.earthlyBranch),
        }
      : null,
  };
};

export const translateAstrolabe = (astrolabe) => {
  if (!astrolabe) return astrolabe;
  return {
    ...astrolabe,
    palaces: (astrolabe.palaces || []).map(translatePalaceData),
    soul: translateSoulStar(astrolabe.soul),
    body: translateSoulStar(astrolabe.body),
    fiveElementsClass: translateFiveElements(astrolabe.fiveElementsClass),
    earthlyBranchOfSoulPalace: translateBranch(astrolabe.earthlyBranchOfSoulPalace),
    earthlyBranchOfBodyPalace: translateBranch(astrolabe.earthlyBranchOfBodyPalace),
  };
};

export default {
  PALACE_NAMES, MAJOR_STARS, MINOR_STARS, EARTHLY_BRANCHES, HEAVENLY_STEMS,
  BRIGHTNESS_ABBR, BRIGHTNESS_COLOR, FIVE_ELEMENTS, NAYIN,
  translatePalace, translateStar, translateBranch, translateStem,
  translateSoulStar, translateFiveElements, translateNayin,
  getBrightnessAbbr, getBrightnessColor,
  translatePalaceData, translateAstrolabe,
};