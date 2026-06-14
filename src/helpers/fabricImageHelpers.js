// ── Fabric Image Tool helpers — Canvas-based, no external deps ──────────────

// ── Color utilities ───────────────────────────────────────────────────────────

export const COLOR_HEX_MAP = {
  'beige':       '#D4C5A9',
  'black':       '#1A1A1A',
  'blue':        '#3B5998',
  'navy':        '#1B3A6B',
  'navy blue':   '#1B3A6B',
  'brown':       '#7B4F2E',
  'burgundy':    '#800020',
  'camel':       '#C19A6B',
  'charcoal':    '#36454F',
  'coral':       '#E8735A',
  'cream':       '#FFF8E7',
  'dark blue':   '#1A2F5E',
  'dark brown':  '#5C3317',
  'dark green':  '#1A4A2E',
  'dark grey':   '#4A4A4A',
  'dark gray':   '#4A4A4A',
  'emerald':     '#50C878',
  'gold':        '#C9A84C',
  'green':       '#3A7D44',
  'grey':        '#888888',
  'gray':        '#888888',
  'ivory':       '#FFFFF0',
  'khaki':       '#C3B091',
  'light blue':  '#ADD8E6',
  'light grey':  '#D3D3D3',
  'light gray':  '#D3D3D3',
  'linen':       '#FAF0E6',
  'maroon':      '#800000',
  'mint':        '#98D8C8',
  'moss':        '#8A9A5B',
  'mustard':     '#FFDB58',
  'natural':     '#F5F0E8',
  'nude':        '#E8C9A0',
  'ochre':       '#CC7722',
  'off white':   '#FAF9F6',
  'olive':       '#6B7C3A',
  'orange':      '#D4622A',
  'peach':       '#FFCBA4',
  'pink':        '#E8A0B0',
  'plum':        '#8E4585',
  'purple':      '#6A0DAD',
  'red':         '#C0392B',
  'rose':        '#E8909A',
  'rust':        '#B7410E',
  'sage':        '#B2AC88',
  'sand':        '#C2B280',
  'silver':      '#C0C0C0',
  'slate':       '#708090',
  'stone':       '#928374',
  'taupe':       '#9B8B7A',
  'teal':        '#008080',
  'terracotta':  '#E2725B',
  'truffle':     '#6B4C3B',
  'turquoise':   '#40E0D0',
  'walnut':      '#5C4033',
  'white':       '#FAFAFA',
  'wine':        '#722F37',
  'yellow':      '#F5D04A',
}

/** Tra cứu hex từ tên màu (không phân biệt hoa thường, fallback null) */
export function getColorHex(colorName) {
  if (!colorName) return null
  const key = colorName.trim().toLowerCase()
  return COLOR_HEX_MAP[key] || null
}

/**
 * Tìm tất cả màu variants của cùng 1 mẫu vải.
 *
 * Chỉ dùng cột "Nhóm biến thể" (nhomBienThe / variantGroup).
 * Nếu field này trống → mã độc lập, trả về [base].
 *
 * KHÔNG dùng nhaCungCap+tenCuon vì tenCuon là tên catalog (có thể chứa
 * nhiều sản phẩm khác nhau), không phải tên thiết kế cụ thể.
 */
export function findColorVariants(maNCC, priceTable) {
  if (!maNCC || !priceTable?.length) return []
  const code = maNCC.trim().toLowerCase()
  const base = priceTable.find(
    (e) => !e.deletedAt && (e.maNCC || '').trim().toLowerCase() === code,
  )
  if (!base) return []

  // Field thực tế trong priceTable là nhomVatLieu (xem PriceTableManager)
  const nhomBienThe = (base.nhomVatLieu || base.nhomBienThe || base.variantGroup || '').trim()
  if (!nhomBienThe) return [base]

  const variants = priceTable.filter(
    (e) => !e.deletedAt && ((e.nhomVatLieu || e.nhomBienThe || e.variantGroup || '').trim() === nhomBienThe),
  )

  // base lên đầu, dedup by maNCC
  const seen = new Set()
  const result = []
  for (const e of [base, ...variants]) {
    const key = (e.maNCC || '').trim().toLowerCase()
    if (!seen.has(key)) { seen.add(key); result.push(e) }
  }
  return result
}

/**
 * Áp dụng transform (xoay / lật) lên ảnh dataURL.
 * Dùng để admin xác nhận chiều đúng của họa tiết / vân vải.
 */
export function applyImageTransform(dataUrl, transform) {
  if (!dataUrl || !transform || transform === 'none') return Promise.resolve(dataUrl)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const rot = transform === 'rotate90' || transform === 'rotate270'
      const w = rot ? img.height : img.width
      const h = rot ? img.width : img.height
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.save()
      if (transform === 'rotate90')  { ctx.translate(w, 0); ctx.rotate(Math.PI / 2) }
      if (transform === 'rotate180') { ctx.translate(w, h); ctx.rotate(Math.PI) }
      if (transform === 'rotate270') { ctx.translate(0, h); ctx.rotate(-Math.PI / 2) }
      if (transform === 'flipH')     { ctx.translate(w, 0); ctx.scale(-1, 1) }
      if (transform === 'flipV')     { ctx.translate(0, h); ctx.scale(1, -1) }
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/** Tải ảnh dataURL xuống máy với tên file chỉ định */
export function downloadImageAs(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}


/** Slot index → image field mapping */
export const SLOT_KEYS = [
  { slot: 'slot_1', field: 'surface_texture', label: 'Bề mặt' },
  { slot: 'slot_2', field: 'main_hand_image', label: 'Thành phẩm ~1m' },
  { slot: 'slot_3', field: 'curtain_image',   label: 'Nội thất ~2m' },
  { slot: 'slot_4', field: 'detail_image',    label: 'Sơ đồ kỹ thuật' },
]

export const BATCH_STATUS = {
  PENDING:    'pending',
  FOUND:      'found',
  NOT_FOUND:  'not_found',
  MULTIPLE:   'multiple',
  PARTIAL:    'partial',
  INVALID:    'invalid',
  PROCESSING: 'processing',
  DONE:       'done',
  ERROR:      'error',
}

export const STATUS_LABEL = {
  pending:    'Chờ xử lý',
  found:      'Đã tìm thấy mã NCC',
  not_found:  'Không tìm thấy mã NCC',
  multiple:   'Nhiều kết quả trùng',
  partial:    'Tương tự một số mã',
  invalid:    'Không đọc được mã NCC từ tên file',
  processing: 'Đang xử lý…',
  done:       'Đã xử lý xong',
  error:      'Lỗi xử lý',
}

// ── NCC extraction ────────────────────────────────────────────────────────────

/**
 * Đọc mã NCC từ tên file.
 * Quy tắc: bỏ extension → bỏ hậu tố _master / _slot1-6 → trim
 * Ví dụ: "ABC123_master.jpg" → "ABC123", "XY-01_slot3.png" → "XY-01"
 */
export function extractNccCode(filename) {
  if (!filename) return null
  const noExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '')
  const noSuffix = noExt.replace(/[_-](master|slot[1-6])$/i, '')
  const code = noSuffix.trim()
  return code || null
}

/**
 * Xác định loại ảnh dựa trên tên file.
 * Trả về: 'master' | 'slot_1'…'slot_6' | 'single'
 */
export function detectImageType(filename) {
  if (!filename) return 'single'
  const noExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '')
  if (/[_-]master$/i.test(noExt)) return 'master'
  const m = noExt.match(/[_-](slot[1-6])$/i)
  if (m) return m[1].toLowerCase()
  return 'single'
}

// ── Price table matching ──────────────────────────────────────────────────────

/**
 * Tìm mã NCC trong bảng đơn giá.
 * Ưu tiên exact match, fallback về partial.
 */
export function matchNccInPriceTable(nccCode, priceTable) {
  if (!nccCode || !priceTable?.length) return { type: BATCH_STATUS.NOT_FOUND, matches: [] }
  const code = nccCode.trim().toLowerCase()

  const exact = priceTable.filter(
    (e) => !e.deletedAt && (e.maNCC || '').trim().toLowerCase() === code,
  )
  if (exact.length === 1) return { type: BATCH_STATUS.FOUND, matches: exact }
  if (exact.length > 1)   return { type: BATCH_STATUS.MULTIPLE, matches: exact }

  // Partial: mã NCC bắt đầu bằng code hoặc code chứa trong mã NCC
  const partial = priceTable.filter((e) => {
    if (e.deletedAt) return false
    const m = (e.maNCC || '').trim().toLowerCase()
    return m && (m.startsWith(code) || code.startsWith(m))
  })
  if (partial.length > 0) return { type: BATCH_STATUS.PARTIAL, matches: partial }

  return { type: BATCH_STATUS.NOT_FOUND, matches: [] }
}

// ── Canvas image processing ───────────────────────────────────────────────────

/** Load File → dataURL (compressed, max maxDim px on longest side) */
export function loadImageAsDataUrl(file, maxDim = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không tải được ảnh')) }
    img.src = url
  })
}

/** Crop trung tâm về hình vuông 1:1 */
export function cropToSquare(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const x = Math.floor((img.width - size) / 2)
      const y = Math.floor((img.height - size) / 2)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d').drawImage(img, x, y, size, size, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Làm nét vải: contrast nhẹ + sharpen kernel 3×3.
 * Không tạo texture giả, không đổi họa tiết — chỉ làm rõ nét đã có.
 */
export function enhanceTexture(dataUrl, { brightness = 1.0, contrast = 1.08 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.filter = `brightness(${brightness}) contrast(${contrast})`
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'

      // Sharpen convolution 0 -1 0 / -1 5 -1 / 0 -1 0
      const src = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const out = applySharpen(src)
      ctx.putImageData(out, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

function applySharpen(imageData) {
  const { data, width, height } = imageData
  const output = new Uint8ClampedArray(data)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = (y * width + x) * 4 + c
        const sum =
          -data[((y - 1) * width + x) * 4 + c] +
          -data[(y * width + (x - 1)) * 4 + c] +
          5 * data[i] +
          -data[(y * width + (x + 1)) * 4 + c] +
          -data[((y + 1) * width + x) * 4 + c]
        output[i] = Math.max(0, Math.min(255, sum))
      }
    }
  }
  return new ImageData(output, width, height)
}

/**
 * Tách ảnh master (3×2 grid) thành 6 slot.
 * Template fabric_6_grid_A: hàng 1 = slot 1-2-3, hàng 2 = slot 4-5-6.
 * Trả về mảng 6 dataURL theo thứ tự slot_1…slot_6.
 */
export function splitMasterGrid(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const W = img.width
      const H = img.height
      const sw = Math.floor(W / 3)
      const sh = Math.floor(H / 2)
      // Positions: [row, col]
      const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]
      const result = positions.map(([row, col]) => {
        const canvas = document.createElement('canvas')
        canvas.width = sw
        canvas.height = sh
        canvas.getContext('2d').drawImage(img, col * sw, row * sh, sw, sh, 0, 0, sw, sh)
        return canvas.toDataURL('image/jpeg', 0.92)
      })
      resolve(result)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không tải được ảnh master')) }
    img.src = url
  })
}

/**
 * Pipeline hoàn chỉnh cho ảnh đơn (single):
 * load → crop vuông → enhance → trả về dataURL cho surface_texture
 */
export async function processSingleImage(file, options = {}) {
  const raw = await loadImageAsDataUrl(file, 1400)
  const cropped = await cropToSquare(raw)
  const enhanced = await enhanceTexture(cropped, options)
  return enhanced
}

/**
 * Pipeline cho ảnh master (3×2 grid):
 * load file → tách 6 slot → trả về object { surface_texture, main_hand_image, … }
 */
export async function processMasterImage(file) {
  const slots = await splitMasterGrid(file)
  const result = {}
  SLOT_KEYS.forEach((s, i) => { result[s.field] = slots[i] })
  return result
}

/**
 * Pipeline cho file slot đơn lẻ (ví dụ slot_3.jpg → sofa_image):
 * load → crop → enhance → trả về object { [field]: dataURL }
 */
export async function processSlotImage(file, slotKey, options = {}) {
  const raw = await loadImageAsDataUrl(file, 1200)
  const cropped = await cropToSquare(raw)
  const enhanced = await enhanceTexture(cropped, options)
  const sk = SLOT_KEYS.find((s) => s.slot === slotKey)
  const field = sk ? sk.field : 'surface_texture'
  return { [field]: enhanced }
}
