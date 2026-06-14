// Vẽ thước L (trái + đáy) lên ảnh vải bằng Canvas
// AI tạo mặt vải full frame, hàm này overlay thước pixel-perfect lên trên
export function addRulerOverlay(dataUrl, { scale = 15, rulerSize = 56, fontSize = 17 } = {}) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const W = img.width
      const H = img.height
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // Nền trắng toàn khung
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // Vải chiếm phần bên phải và trên cùng (sau 2 dải thước)
      const fabX = rulerSize
      const fabY = 0
      const fabW = W - rulerSize
      const fabH = H - rulerSize
      ctx.drawImage(img, fabX, fabY, fabW, fabH)

      // Nền trắng cho 2 dải thước
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rulerSize, H)
      ctx.fillRect(0, H - rulerSize, W, rulerSize)

      // Đường viền phân cách thước / vải
      ctx.strokeStyle = '#222222'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(rulerSize, 0)
      ctx.lineTo(rulerSize, H - rulerSize)
      ctx.moveTo(rulerSize, H - rulerSize)
      ctx.lineTo(W, H - rulerSize)
      ctx.stroke()

      // Viền sắc nét 4 cạnh của vải
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1
      ctx.strokeRect(rulerSize + 0.5, 0.5, fabW - 1, fabH - 1)

      // Tick marks + số
      ctx.fillStyle = '#111111'
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 1.2

      // Trục Y (thước trái): 0 ở dưới, scale ở trên
      for (let cm = 0; cm <= scale; cm++) {
        const y = fabH - (fabH * cm) / scale
        const isMajor = cm % 5 === 0
        const tickLen = isMajor ? 14 : 6

        ctx.beginPath()
        ctx.moveTo(rulerSize, y)
        ctx.lineTo(rulerSize - tickLen, y)
        ctx.stroke()

        if (isMajor) {
          ctx.save()
          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(cm), rulerSize - 16, y)
          ctx.restore()
        }
      }

      // Trục X (thước đáy): 0 ở trái, scale ở phải
      for (let cm = 0; cm <= scale; cm++) {
        const x = rulerSize + (fabW * cm) / scale
        const isMajor = cm % 5 === 0
        const tickLen = isMajor ? 14 : 6

        ctx.beginPath()
        ctx.moveTo(x, H - rulerSize)
        ctx.lineTo(x, H - rulerSize + tickLen)
        ctx.stroke()

        if (isMajor) {
          ctx.save()
          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(String(cm), x, H - rulerSize + 16)
          ctx.restore()
        }
      }

      // Đơn vị "cm" ở góc dưới trái (giao 2 thước)
      ctx.save()
      ctx.font = `bold ${fontSize - 2}px Arial, sans-serif`
      ctx.fillStyle = '#444444'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('cm', rulerSize / 2, H - rulerSize / 2)
      ctx.restore()

      resolve(canvas.toDataURL('image/jpeg', 0.93))
    }
    img.src = dataUrl
  })
}
