export function handleImageError(e, material, imageKey) {
  e.target.style.display = 'none'
  const placeholder = e.target.nextSibling
  if (placeholder && placeholder.classList.contains('img-placeholder')) {
    placeholder.style.display = 'flex'
  }
}

export function getImageLabel(imageKey) {
  const labels = {
    closeup: 'Cận bề mặt vật liệu',
    curtain: 'Ứng dụng trên rèm',
    sofaPillow: 'Ứng dụng trên sofa / gối',
    renderTexture: 'Ảnh map/texture dùng cho render',
  }
  return labels[imageKey] || imageKey
}
