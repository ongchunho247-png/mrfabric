import { useRef } from 'react'
import './LabelImageUploader.css'

export default function LabelImageUploader({ preview, onFileSelect, onClear }) {
  const inputRef = useRef()

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) onFileSelect(file)
  }

  return (
    <div className="liu-section">
      <p className="section-title">1. Tải ảnh nhãn sản phẩm</p>

      {!preview ? (
        <div
          className="liu-dropzone"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <span className="liu-icon">🖼️</span>
          <p>Kéo thả ảnh nhãn vào đây hoặc <strong>bấm để chọn ảnh</strong></p>
          <p className="liu-hint">Hỗ trợ: JPG, PNG, WebP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="liu-preview-wrap">
          <img src={preview} alt="Ảnh nhãn sản phẩm" className="liu-preview-img" />
          <button className="btn btn-secondary liu-reselect-btn" onClick={onClear}>
            ✕ Chọn lại ảnh
          </button>
        </div>
      )}
    </div>
  )
}
