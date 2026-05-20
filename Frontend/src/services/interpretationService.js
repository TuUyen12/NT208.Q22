import { translateStar } from '../utils/translateData';

// --- Helper: lấy tên sao đã dịch ---
function getStarName(star) {
  return translateStar(star.name);
}

// --- Danh sách các câu luận đặc biệt (ưu tiên cao nhất) ---
// Mỗi điều kiện: { condition: (palace, palaceName, major, minor, adj) => boolean, result: string }
const specialRules = [
  {
    // Cung Mệnh an tại Dần có sao Lộc Tồn
    condition: (palace, palaceName, major, minor) => {
      if (palaceName !== 'Mệnh') return false;
      // Kiểm tra cung an tại Dần: cần palace.earthlyBranch? Thực tế trong palaceData có StemBranch là "Giáp Dần" chẳng hạn.
      // Ta lấy từ palace.StemBranch đã translate: ví dụ "Giáp Dần". Cần kiểm tra chi là Dần.
      const stemBranch = palace.StemBranch || '';
      const chi = stemBranch.split(' ')[1]; // Lấy phần sau "Giáp Dần" -> "Dần"
      if (chi !== 'Dần') return false;
      const hasLuCun = minor.some(s => getStarName(s) === 'Lộc Tồn');
      return hasLuCun;
    },
    result: 'Là người giàu khó và khéo giữ gìn.'
  },
  {
    // Cung Tài Bạch có Lộc Tồn
    condition: (palace, palaceName, major, minor) => {
      if (palaceName !== 'Tài Bạch') return false;
      return minor.some(s => getStarName(s) === 'Lộc Tồn');
    },
    result: 'Lộc Tồn thủ cung Tài Bạch: tiền bạc vào chắc ra chậm, giỏi tiết kiệm, giàu bền vững.'
  },
  {
    // Cung Thiên Di có Thiên Mã
    condition: (palace, palaceName, major, minor, adj) => {
      if (palaceName !== 'Thiên Di') return false;
      return minor.some(s => getStarName(s) === 'Thiên Mã') || adj.some(s => getStarName(s) === 'Thiên Mã');
    },
    result: 'Cung Thiên Di có Thiên Mã: hay đi xa, xuất ngoại, thay đổi nơi ở, công việc di động.'
  },
  {
    // Cung Phu Thê có Hồng Loan, Thiên Hỷ
    condition: (palace, palaceName, major, minor, adj) => {
      if (palaceName !== 'Phu Thê') return false;
      const hasHongLoan = minor.some(s => getStarName(s) === 'Hồng Loan') || adj.some(s => getStarName(s) === 'Hồng Loan');
      const hasThienHy = minor.some(s => getStarName(s) === 'Thiên Hỷ') || adj.some(s => getStarName(s) === 'Thiên Hỷ');
      return hasHongLoan && hasThienHy;
    },
    result: 'Hồng Loan, Thiên Hỷ hội chiếu: hôn nhân sớm, tình duyên tốt đẹp, có tin vui về cưới hỏi.'
  },
  // Bạn có thể thêm nhiều quy tắc đặc biệt khác...
];

// --- Bảng luận giải theo cung và chính tinh ---
const starInterpretations = {
  'Mệnh': {
    'Tử Vi': 'Tử Vi tọa thủ là bậc đế vương, có tài lãnh đạo, tự tin, nhưng dễ tự cao. Cần có Tả Phụ, Hữu Bật trợ giúp.',
    'Thiên Cơ': 'Thiên Cơ là sao mưu lược, thông minh, thích thay đổi, hợp nghề nghiệp trí tuệ, truyền thông.',
    'Thái Dương': 'Thái Dương sáng sủa, hào phóng, quảng giao. Nữ mệnh thường đảm đang, có chí hướng.',
    'Vũ Khúc': 'Vũ Khúc chủ về tài chính, cứng rắn, quyết đoán. Nam mệnh giỏi kinh doanh, quản lý tiền bạc.',
    'Thiên Đồng': 'Thiên Đồng là phúc tinh, an nhàn, hưởng thụ, ưa nghệ thuật. Tính hiền hòa.',
    'Liêm Trinh': 'Liêm Trinh đào hoa, thông minh, có tài ngoại giao. Cẩn thận chuyện tình cảm thị phi.',
    'Thiên Phủ': 'Thiên Phủ ổn định, cẩn trọng, có năng lực quản lý, thường giàu sang bền vững.',
    'Thái Âm': 'Thái Âm nhu mì, hợp với nữ mệnh, chủ về tài lộc qua bất động sản, tiền tiết kiệm.',
    'Tham Lang': 'Tham Lang ham muốn, thích ăn chơi nhưng cũng thông minh, quyến rũ, dễ thành công trong môi trường cạnh tranh.',
    'Cự Môn': 'Cự Môn chủ về miệng lưỡi, thị phi, nhưng biện luận tốt, hợp nghề luật sư, bán hàng.',
    'Thiên Tướng': 'Thiên Tướng chính trực, có uy tín, thích giúp đỡ, hợp hành chính, công quyền.',
    'Thiên Lương': 'Thiên Lương phúc thọ, quan tâm y tế, từ thiện, hợp nghề y, luật, giáo dục.',
    'Thất Sát': 'Thất Sát mạnh mẽ, quyết liệt, thích phiêu lưu, hợp quân đội, thể thao, doanh nghiệp mạo hiểm.',
    'Phá Quân': 'Phá Quân phá cũ lập mới, táo bạo, khó kiểm soát, hợp nghề sáng tạo, xây dựng.',
  },
  'Phu Thê': {
    'Tử Vi': 'Vợ/chồng có uy quyền, địa vị, thích làm chủ. Duyên số bền nếu biết nhường nhịn.',
    'Thiên Cơ': 'Vợ/chồng thông minh, nhanh nhẹn, tình cảm dễ thay đổi, cần thấu hiểu.',
    'Thái Dương': 'Vợ/chồng hào phóng, nhiệt tình, có thể lớn tuổi hoặc có địa vị.',
    'Vũ Khúc': 'Vợ/chồng có năng lực tài chính, cứng rắn, tình cảm ít lãng mạn nhưng chung thủy.',
    'Thiên Đồng': 'Vợ/chồng hiền lành, tình cảm nhẹ nhàng, thích hưởng thụ, dễ hòa hợp.',
    'Liêm Trinh': 'Dễ có chuyện thị phi tình ái, đào hoa, cần giữ khoảng cách với người khác giới.',
    'Thiên Phủ': 'Hôn nhân ổn định, vợ/chồng biết quản lý tài chính gia đình.',
    'Thái Âm': 'Vợ hiền thục, chăm lo gia đình; chồng có thể yếu bóng vía hơn vợ.',
    'Tham Lang': 'Dễ trắc trở tình duyên, có thể kết hôn muộn hoặc có nhiều mối quan hệ.',
    'Cự Môn': 'Hay cãi vã, thị phi trong hôn nhân, cần học cách lắng nghe.',
    'Thiên Tướng': 'Vợ/chồng phụ trách, hậu thuẫn, có trách nhiệm với gia đình.',
    'Thiên Lương': 'Hôn nhân có sự che chở, bảo bọc, có thể chênh lệch tuổi tác.',
    'Thất Sát': 'Hôn nhân dễ đổ vỡ, có biến cố, cần tránh nóng vội.',
    'Phá Quân': 'Dễ ly hôn hoặc chia tay, hôn nhân không bền, cần cư xử nhẹ nhàng.',
  },
  'Tài Bạch': {
    'Vũ Khúc': 'Tài vận dồi dào nhờ kinh doanh, đầu tư mạo hiểm. Tiền bạc vào ra mạnh.',
    'Thái Âm': 'Tài lộc qua bất động sản, tiết kiệm, giàu có từ từ.',
    'Lộc Tồn': 'Lộc Tồn thủ cung Tài Bạch: giàu bền vững, giỏi giữ gìn của cải.',
    'Thiên Phủ': 'Tiền bạc ổn định, có của cải tích lũy, ít hao hụt.',
    'Tham Lang': 'Tham lang nhập Tài Bạch: thích tiêu xài hoang phí, nhưng cũng có tài kiếm tiền nhanh.',
    'Cự Môn': 'Buôn bán bằng miệng lưỡi, kinh doanh thực phẩm, truyền thông, nhưng có thể có kiện tụng.',
    'Thất Sát': 'Tiền bạc lên xuống thất thường, dễ phá sản nếu đầu tư liều lĩnh.',
  },
  'Thiên Di': {
    'Thiên Mã': 'Hay đi xa, xuất ngoại, thành công khi rời xa quê hương.',
    'Thất Sát': 'Ra ngoài gặp nhiều thử thách nhưng có cơ hội phát triển.',
    'Phá Quân': 'Dễ thay đổi nơi ở, công việc liên tục di chuyển.',
  },
  // Bổ sung thêm các cung khác tương tự...
};

// Hàm lấy câu luận từ bảng chính tinh
function getInterpretationByMajorStar(palaceName, majorStars) {
  if (!majorStars.length) return null;
  const mainStarName = getStarName(majorStars[0]);
  const palaceMap = starInterpretations[palaceName];
  if (palaceMap && palaceMap[mainStarName]) {
    return palaceMap[mainStarName];
  }
  return null;
}

// Hàm mô tả chung khi không có luận cụ thể
function getGeneralDescription(palaceName) {
  const desc = {
    'Mệnh': 'Chủ về tính cách, bản mệnh, vận thế cả đời.',
    'Huynh Đệ': 'Quan hệ anh chị em, bạn bè thân.',
    'Phu Thê': 'Tình duyên, hôn nhân, người phối ngẫu.',
    'Tử Tức': 'Con cái, sinh sản, quan hệ con cái.',
    'Tài Bạch': 'Tài lộc, tiền bạc, quản lý tài chính.',
    'Tật Ách': 'Sức khỏe, bệnh tật, tai nạn.',
    'Thiên Di': 'Di chuyển, xuất ngoại, quan hệ xã giao.',
    'Nô Bộc': 'Quan hệ cấp dưới, bạn bè, đồng nghiệp.',
    'Quan Lộc': 'Sự nghiệp, công danh, địa vị.',
    'Điền Trạch': 'Nhà cửa, đất đai, tài sản gia đình.',
    'Phúc Đức': 'Phúc phần, tâm hồn, hưởng thụ.',
    'Phụ Mẫu': 'Quan hệ cha mẹ, trưởng bối, sự bảo hộ.',
  };
  return desc[palaceName] || '';
}

// Hàm luận giải chính
function interpretPalace(palace, palaceName) {
  const major = palace.majorStarsFull || [];
  const minor = palace.minorStarsFull || [];
  const adj = palace.adjectiveStarsFull || [];

  // 1. Kiểm tra quy tắc đặc biệt
  for (const rule of specialRules) {
    if (rule.condition(palace, palaceName, major, minor, adj)) {
      return rule.result;
    }
  }

  // 2. Trường hợp vô chính diệu
  if (major.length === 0) {
    return `Cung ${palaceName} vô chính diệu. Vận thế bấp bênh, dễ thay đổi. Nên lấy các cung tam hợp và xung chiếu làm trọng.`;
  }

  // 3. Tra cứu theo chính tinh
  let interpretation = getInterpretationByMajorStar(palaceName, major);
  if (interpretation) {
    // Bổ sung nếu có sát tinh
    const badStars = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp'];
    const hasBad = [...minor, ...adj].some(s => badStars.includes(getStarName(s)));
    if (hasBad) {
      interpretation += ' Có sát tinh đi kèm, đề phòng trở ngại, tai ương đột ngột.';
    }
    return interpretation;
  }

  // 4. Fallback: mô tả chung + liệt kê sao
  const mainStarNames = major.map(s => getStarName(s)).join(', ');
  let fallback = `Cung ${palaceName} có chính tinh ${mainStarNames}. ${getGeneralDescription(palaceName)}`;
  if (minor.length) fallback += ` Kèm phụ tinh ${minor.map(s => getStarName(s)).join(', ')}.`;
  if (adj.length) fallback += ` Tạp diệu ${adj.map(s => getStarName(s)).join(', ')}.`;
  return fallback;
}

export function generateInterpretations(palaceData) {
  if (!palaceData || palaceData.length === 0) return [];
  return palaceData.map(palace => ({
    title: palace.PalaceName,
    content: interpretPalace(palace, palace.PalaceName)
  }));
}