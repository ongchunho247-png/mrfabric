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

// Template 4 slot theo từng type
// S1=Bề mặt phẳng | S2=Thành phẩm ~1m | S3=Nội thất ~2m | S4=Sơ đồ kỹ thuật
export const SLOT_TEMPLATES = {
  CUR: {
    name: 'Rèm vải Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Rèm thành phẩm ~1m' },
      { key: 'slot_3', label: 'Rèm trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  FAB: {
    name: 'Sofa / Vải bọc Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Sofa ~1m' },
      { key: 'slot_3', label: 'Sofa trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  CUR_FAB: {
    name: 'Rèm + Sofa (Hỗn hợp)',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Sofa ~1m' },
      { key: 'slot_3', label: 'Rèm + Sofa trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  BL: {
    name: 'Rèm cuốn Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Rèm cuốn ~1m' },
      { key: 'slot_3', label: 'Rèm cuốn trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  WB: {
    name: 'Sáo gỗ Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt vân gỗ' },
      { key: 'slot_2', label: 'Sáo gỗ ~1m' },
      { key: 'slot_3', label: 'Sáo gỗ trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  AL: {
    name: 'Sáo nhôm Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt nhôm' },
      { key: 'slot_2', label: 'Sáo nhôm ~1m' },
      { key: 'slot_3', label: 'Sáo nhôm trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  RM: {
    name: 'Roman Blind Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt' },
      { key: 'slot_2', label: 'Roman ~1m' },
      { key: 'slot_3', label: 'Roman trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  HN: {
    name: 'Tổ ong Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt tổ ong' },
      { key: 'slot_2', label: 'Tổ ong ~1m' },
      { key: 'slot_3', label: 'Tổ ong trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  CB: {
    name: 'Cầu vồng / Zebra Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt cầu vồng' },
      { key: 'slot_2', label: 'Cầu vồng ~1m' },
      { key: 'slot_3', label: 'Cầu vồng trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
    ],
  },
  BB: {
    name: 'Trúc / Tre Template',
    slots: [
      { key: 'slot_1', label: 'Bề mặt trúc' },
      { key: 'slot_2', label: 'Rèm trúc ~1m' },
      { key: 'slot_3', label: 'Rèm trúc trong nội thất ~2m' },
      { key: 'slot_4', label: 'Sơ đồ kỹ thuật' },
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
