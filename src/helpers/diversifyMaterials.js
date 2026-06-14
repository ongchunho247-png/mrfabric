// Greedy diversity spread: xen kẽ các mẫu khác màu/bề mặt/chất liệu
// Không thay đổi dữ liệu gốc, chỉ sắp xếp lại thứ tự hiển thị.

function getAttrs(m) {
  return {
    tone:    (m.toneMau || '').toLowerCase(),
    color:   (m.nhomMau || '').toLowerCase(),
    surface: (Array.isArray(m.beMat) ? m.beMat[0] : m.beMat || '').toLowerCase(),
    type:    (m.tenDongSanPham || '').toLowerCase(),
  }
}

// Trả về điểm "khác biệt" giữa 2 mẫu (cao hơn = khác nhau hơn)
function dissimilarity(a, b) {
  const aa = getAttrs(a)
  const ba = getAttrs(b)
  let score = 0
  if (aa.tone    && ba.tone    && aa.tone    !== ba.tone)    score += 3
  if (aa.color   && ba.color   && aa.color   !== ba.color)   score += 2
  if (aa.surface && ba.surface && aa.surface !== ba.surface) score += 2
  if (aa.type    && ba.type    && aa.type    !== ba.type)    score += 1
  // Nếu 1 bên không có dữ liệu cũng tính là khác biệt nhỏ
  if (!aa.color  || !ba.color)  score += 1
  if (!aa.tone   || !ba.tone)   score += 1
  return score
}

export function diversifyMaterials(materials) {
  if (materials.length <= 3) return [...materials]

  const pool = [...materials]
  const result = [pool.shift()]

  while (pool.length > 0) {
    // So sánh với 4 mẫu gần nhất để tránh lặp màu/bề mặt
    const recent = result.slice(-4)
    let bestScore = -1
    let bestIdx   = 0

    for (let i = 0; i < pool.length; i++) {
      const score = recent.reduce((s, r) => s + dissimilarity(r, pool[i]), 0)
      if (score > bestScore) {
        bestScore = score
        bestIdx   = i
        // Dừng sớm nếu đã đạt điểm tối đa có thể
        if (score >= recent.length * 9) break
      }
    }

    result.push(pool.splice(bestIdx, 1)[0])
  }

  return result
}
