import { useRef, useState } from 'react'
import { findMaterialByFilename, extractNccCodeFromFilename } from '../../helpers/matchMaterialByFilename'
import './SmartImageUploader.css'

/**
 * SmartImageUploader: Upload ảnh, auto-match với maNCC, nạp dữ liệu tự động
 * @param {array} allMaterials - Danh sách tất cả vật liệu để match
 * @param {function} onMatch - Gọi khi tìm thấy match: onMatch(material, file)
 * @param {function} onFileSelect - Gọi khi chọn file (fallback nếu không match)
 * @param {function} onClear - Gọi khi user clear ảnh
 */
export default function SmartImageUploader({ allMaterials, onMatch, onFileSelect, onClear }) {
  const inputRef = useRef()
  const [preview, setPreview] = useState(null)
  const [matchedMaterial, setMatchedMaterial] = useState(null)
  const [extractedCode, setExtractedCode] = useState(null)
  const [loadingFile, setLoadingFile] = useState(null)

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) return

    // Tạo preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Extract code từ tên file
    const code = extractNccCodeFromFilename(file.name)
    setExtractedCode(code)
    setLoadingFile(file.name)

    // Tìm material match
    const material = findMaterialByFilename(file.name, allMaterials)

    if (material) {
      // ✅ Tìm thấy material
      setMatchedMaterial(material)
      // Tự động gọi onMatch sau 300ms (để show animation trước)
      setTimeout(() => {
        if (onMatch) onMatch(material, file)
      }, 300)
    } else {
      // ❌ Không tìm thấy
      setMatchedMaterial(null)
      // Fallback: gọi onFileSelect để user tự chọn material
      if (onFileSelect) onFileSelect(file)
    }
  }

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleClear() {
    setPreview(null)
    setMatchedMaterial(null)
    setExtractedCode(null)
    setLoadingFile(null)
    inputRef.current.value = ''
    if (onClear) onClear()
  }

  function handleSkipMatch() {
    // Bỏ qua auto-match, gọi fallback handler
    const file = inputRef.current?.files?.[0]
    if (file && onFileSelect) onFileSelect(file)
    handleClear()
  }

  return (
    <div className="sia-section">
      <p className="section-title">1. Tải ảnh nhãn sản phẩm</p>

      {!preview ? (
        <div
          className="sia-dropzone"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <span className="sia-icon">🖼️</span>
          <p>Kéo thả ảnh nhãn vào đây hoặc <strong>bấm để chọn ảnh</strong></p>
          <p className="sia-hint">💡 Tên file theo mã NCC (VD: KC-03.jpg) sẽ tự động nạp dữ liệu</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="sia-preview-wrap">
          {/* Preview ảnh */}
          <img src={preview} alt="Ảnh nhãn sản phẩm" className="sia-preview-img" />

          {/* Kết quả match */}
          {matchedMaterial ? (
            <div className="sia-match-result sia-match-result--success">
              <div className="sia-match-header">
                <span className="sia-match-icon">✅</span>
                <span className="sia-match-title">Tìm thấy sản phẩm!</span>
              </div>
              <div className="sia-match-details">
                <div className="sia-detail-row">
                  <span className="sia-detail-label">Mã NCC:</span>
                  <span className="sia-detail-value">{matchedMaterial.maNCC}</span>
                </div>
                <div className="sia-detail-row">
                  <span className="sia-detail-label">Nhà cung cấp:</span>
                  <span className="sia-detail-value">{matchedMaterial.nhaCungCap || 'N/A'}</span>
                </div>
                <div className="sia-detail-row">
                  <span className="sia-detail-label">Mã MrFabric:</span>
                  <span className="sia-detail-value">{matchedMaterial.maMrFabric || '(Chưa có)'}</span>
                </div>
                {matchedMaterial.collection && (
                  <div className="sia-detail-row">
                    <span className="sia-detail-label">Collection:</span>
                    <span className="sia-detail-value">{matchedMaterial.collection}</span>
                  </div>
                )}
              </div>
              <p className="sia-match-msg">ℹ️ Ảnh sẽ được nạp vào sản phẩm này</p>
            </div>
          ) : (
            <div className="sia-match-result sia-match-result--no-match">
              <div className="sia-match-header">
                <span className="sia-match-icon">❓</span>
                <span className="sia-match-title">Không tìm thấy sản phẩm</span>
              </div>
              {extractedCode && (
                <p className="sia-match-msg">Không có sản phẩm với mã NCC: <strong>{extractedCode}</strong></p>
              )}
              <p className="sia-match-hint">Bạn có thể:</p>
              <ul className="sia-options">
                <li>✏️ Kiểm tra lại tên file (phải có mã NCC)</li>
                <li>🔍 Chọn sản phẩm thủ công ở form dưới</li>
              </ul>
              <button className="btn btn-primary sia-continue-btn" onClick={handleSkipMatch}>
                Tiếp tục (chọn thủ công)
              </button>
            </div>
          )}

          {/* Nút actions */}
          <button className="btn btn-secondary sia-reselect-btn" onClick={handleClear}>
            ✕ Chọn lại ảnh
          </button>
        </div>
      )}
    </div>
  )
}
