// Mapping từ khóa "Dòng sản phẩm" → Mã type
// Thứ tự quan trọng: 'sáo nhôm' phải trước 'sáo gỗ' để tránh nhầm
export const PRODUCT_TYPE_RULES = [
  ['sáo nhôm', 'AL'],
  ['rèm vải',  'CUR'],
  ['rèm cuốn', 'BL'],
  ['sáo gỗ',   'WB'],
  ['roman',    'RM'],
  ['tổ ong',   'HN'],
  ['cầu vồng', 'CB'],
  ['trúc',     'BB'],
  ['sofa',     'FAB'],
]

export function detectProductType(dongSanPham) {
  if (!dongSanPham) return null
  const lower = dongSanPham.toLowerCase()
  for (const [keyword, code] of PRODUCT_TYPE_RULES) {
    if (lower.includes(keyword)) return code
  }
  return null
}

export const ALL_PRODUCT_TYPES = [
  { code: 'CUR', label: 'Rèm vải' },
  { code: 'FAB', label: 'Sofa / Vải bọc' },
  { code: 'BL',  label: 'Rèm cuốn' },
  { code: 'WB',  label: 'Sáo gỗ' },
  { code: 'AL',  label: 'Sáo nhôm' },
  { code: 'RM',  label: 'Roman' },
  { code: 'HN',  label: 'Tổ ong' },
  { code: 'CB',  label: 'Cầu vồng / Zebra' },
  { code: 'BB',  label: 'Trúc / Tre' },
]

// Template 6 slot theo từng type — key phải khớp SLOT_KEYS trong fabricImageHelpers.js
export const SLOT_TEMPLATES = {
  CUR: {
    name: 'Rèm vải Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vải' },
      { key: 'slot_2', label: 'Tay cầm vải' },
      { key: 'slot_3', label: 'Rèm trong không gian' },
      { key: 'slot_4', label: 'Rèm cận cảnh / góc khác' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết vải' },
    ],
  },
  FAB: {
    name: 'Sofa / Vải bọc Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vải' },
      { key: 'slot_2', label: 'Tay cầm vải' },
      { key: 'slot_3', label: 'Sofa tổng thể' },
      { key: 'slot_4', label: 'Sofa / gối cận cảnh' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết vải' },
    ],
  },
  CUR_FAB: {
    name: 'Rèm + Sofa (Hỗn hợp)',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vải' },
      { key: 'slot_2', label: 'Tay cầm vải' },
      { key: 'slot_3', label: 'Sofa' },
      { key: 'slot_4', label: 'Rèm' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết vải' },
    ],
  },
  BL: {
    name: 'Rèm cuốn Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vật liệu' },
      { key: 'slot_2', label: 'Tay cầm / cận cảnh vật liệu' },
      { key: 'slot_3', label: 'Rèm cuốn trong không gian' },
      { key: 'slot_4', label: 'Cơ chế cuốn / góc bên' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết / thanh đáy' },
    ],
  },
  WB: {
    name: 'Sáo gỗ Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt lá sáo / vân gỗ' },
      { key: 'slot_2', label: 'Cận cảnh lá sáo gỗ' },
      { key: 'slot_3', label: 'Sáo gỗ trong không gian' },
      { key: 'slot_4', label: 'Cơ chế xoay lật lá' },
      { key: 'slot_5', label: 'Thước đo / kích thước lá' },
      { key: 'slot_6', label: 'Chi tiết phụ kiện / dây thang' },
    ],
  },
  AL: {
    name: 'Sáo nhôm Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt lá sáo nhôm' },
      { key: 'slot_2', label: 'Cận cảnh lá nhôm' },
      { key: 'slot_3', label: 'Sáo nhôm trong không gian' },
      { key: 'slot_4', label: 'Cơ chế xoay lật / đóng mở' },
      { key: 'slot_5', label: 'Thước đo / kích thước bản lá' },
      { key: 'slot_6', label: 'Chi tiết dây thang / thanh đáy' },
    ],
  },
  RM: {
    name: 'Roman Blind Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vải' },
      { key: 'slot_2', label: 'Tay cầm vải' },
      { key: 'slot_3', label: 'Rèm roman trong không gian' },
      { key: 'slot_4', label: 'Nếp gấp roman cận cảnh' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết may / nếp gấp' },
    ],
  },
  HN: {
    name: 'Tổ ong Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vật liệu tổ ong' },
      { key: 'slot_2', label: 'Cận cảnh ô tổ ong' },
      { key: 'slot_3', label: 'Rèm tổ ong trong không gian' },
      { key: 'slot_4', label: 'Mặt cắt cấu trúc tổ ong' },
      { key: 'slot_5', label: 'Thước đo / kích thước ô' },
      { key: 'slot_6', label: 'Chi tiết ray / phụ kiện' },
    ],
  },
  CB: {
    name: 'Cầu vồng / Zebra Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vải cầu vồng' },
      { key: 'slot_2', label: 'Cận cảnh sọc vải' },
      { key: 'slot_3', label: 'Rèm cầu vồng trong không gian' },
      { key: 'slot_4', label: 'Cơ chế đóng mở / sọc xuyên sáng' },
      { key: 'slot_5', label: 'Thước đo' },
      { key: 'slot_6', label: 'Chi tiết sọc / thanh đáy' },
    ],
  },
  BB: {
    name: 'Trúc / Tre Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vật liệu trúc' },
      { key: 'slot_2', label: 'Cận cảnh thanh trúc' },
      { key: 'slot_3', label: 'Rèm trúc trong không gian' },
      { key: 'slot_4', label: 'Cơ chế cuốn / gấp' },
      { key: 'slot_5', label: 'Thước đo / kích thước thanh' },
      { key: 'slot_6', label: 'Chi tiết cạnh / đan trúc' },
    ],
  },
}

export function getSlotTemplate(typeCode, { useForSofa = false, useForCurtain = false } = {}) {
  if (!typeCode) return null
  if ((typeCode === 'CUR' && useForSofa) || (typeCode === 'FAB' && useForCurtain)) {
    return SLOT_TEMPLATES.CUR_FAB
  }
  return SLOT_TEMPLATES[typeCode] || null
}
