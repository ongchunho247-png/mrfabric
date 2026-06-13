const KEY = 'mrfabric_tags_v2'

const BE_MAT_DEFAULTS = [
  'Jacquard', 'Velvet', 'Velour', 'Linen Look', 'Plain Weave',
  'Satin', 'Chenille', 'Sheer', 'Blackout', 'Dimout',
  'Embossed', 'Knit', 'Woven',
]

const DEFAULT_TAGS = {
  beMat: BE_MAT_DEFAULTS,
  congNang: [
    'Rèm vải blackout', 'Rèm vải dimout', 'Rèm vải sheer',
    'Rèm cuốn blackout', 'Rèm cuốn sheer', 'Rèm sáo gỗ',
    'Rèm roman', 'Rèm tổ ong', 'Rèm cầu vồng', 'Rèm trúc', 'Sofa',
  ],
  ungDung: ['Rèm cửa', 'Bọc ghế sofa', 'Trải giường', 'Gối trang trí', 'Rèm cuốn', 'Vải thành phần rèm', 'Bọc đầu giường', 'Rèm phòng ngủ', 'Rèm văn phòng'],
}

export function loadTags() {
  const raw = localStorage.getItem(KEY)
  if (raw === null) return DEFAULT_TAGS  // first run — use defaults
  try {
    const parsed = JSON.parse(raw)
    return {
      beMat: Array.isArray(parsed.beMat) ? parsed.beMat : BE_MAT_DEFAULTS,
      congNang: Array.isArray(parsed.congNang) ? parsed.congNang : DEFAULT_TAGS.congNang,
      ungDung: Array.isArray(parsed.ungDung) ? parsed.ungDung : [],
    }
  } catch {
    return DEFAULT_TAGS
  }
}

export function saveTags(tags) {
  localStorage.setItem(KEY, JSON.stringify(tags))
}

export function addTag(tags, fieldName, newTag) {
  const list = tags[fieldName] || []
  if (list.includes(newTag)) return tags
  return { ...tags, [fieldName]: [...list, newTag] }
}

export function removeTag(tags, fieldName, tagToRemove) {
  const list = tags[fieldName] || []
  return { ...tags, [fieldName]: list.filter((t) => t !== tagToRemove) }
}
