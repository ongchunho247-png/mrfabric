import { useState, useEffect, useRef } from 'react'
import './MaterialImageViewer.css'

const IMAGE_TABS = [
  { key: 'surface_texture', fallback: 'closeup',      label: 'Bề mặt vải' },
  { key: 'main_hand_image', fallback: null,            label: 'Cầm tay' },
  { key: 'sofa_image',      fallback: 'sofaPillow',   label: 'Sofa / Gối' },
  { key: 'curtain_image',   fallback: 'curtain',      label: 'Trên rèm' },
  { key: 'ruler_image',     fallback: null,            label: 'Thước đo' },
  { key: 'detail_image',    fallback: 'renderTexture', label: 'Chi tiết' },
]

async function compressToBase64(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 900
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}

function ThumbItem({ tabKey, label, src, active, onClick }) {
  const [err, setErr] = useState(false)
  useEffect(() => { setErr(false) }, [src])

  return (
    <button
      className={`miv-thumb${active ? ' miv-thumb--active' : ''}`}
      onClick={() => onClick(tabKey)}
      title={label}
    >
      <div className="miv-thumb-img-wrap">
        {src && !err ? (
          <img src={src} className="miv-thumb-img" onError={() => setErr(true)} />
        ) : (
          <div className="miv-thumb-ph">📷</div>
        )}
      </div>
      <span className="miv-thumb-label">{label}</span>
    </button>
  )
}

function getTabSrc(material, tab) {
  return material.images?.[tab.key]?.path || material.images?.[tab.fallback]?.path || null
}

export default function MaterialImageViewer({ material, onUpload }) {
  const [activeTab, setActiveTab] = useState('surface_texture')
  const [mainErr, setMainErr] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const activeTabObj = IMAGE_TABS.find((t) => t.key === activeTab)
  const mainSrc = getTabSrc(material, activeTabObj || IMAGE_TABS[0])
  useEffect(() => { setMainErr(false) }, [mainSrc])

  // Clipboard paste → upload to active tab
  useEffect(() => {
    if (!onUpload) return
    const handlePaste = async (e) => {
      const items = [...e.clipboardData.items]
      const imageItem = items.find((i) => i.type.startsWith('image/'))
      if (!imageItem) return
      const file = imageItem.getAsFile()
      if (!file) return
      setUploading(true)
      try {
        const dataUrl = await compressToBase64(file)
        onUpload(activeTab, dataUrl)
      } finally {
        setUploading(false)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [activeTab, onUpload])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setUploading(true)
    try {
      const dataUrl = await compressToBase64(file)
      onUpload(activeTab, dataUrl)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleTabChange(key) {
    setActiveTab(key)
    setMainErr(false)
  }

  return (
    <div className="miv">
      {/* ── Main large image ── */}
      <div className="miv-main-wrap">
        {uploading && <div className="miv-uploading">Đang xử lý ảnh…</div>}
        {!uploading && mainSrc && !mainErr ? (
          <img
            key={mainSrc}
            src={mainSrc}
            alt={activeTabObj?.label}
            className="miv-main-img"
            onError={() => setMainErr(true)}
          />
        ) : (
          !uploading && (
            <div className="miv-main-ph img-placeholder">
              <span className="miv-ph-icon">📷</span>
              <strong>{activeTabObj?.label}</strong>
              <span>{material.maMrFabric}</span>
              {onUpload && <span className="miv-ph-note">Thêm ảnh bên dưới hoặc Ctrl+V</span>}
            </div>
          )
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      <div className="miv-thumbs">
        {IMAGE_TABS.map((t) => (
          <ThumbItem
            key={t.key}
            tabKey={t.key}
            label={t.label}
            src={getTabSrc(material, t)}
            active={activeTab === t.key}
            onClick={handleTabChange}
          />
        ))}
      </div>

      {/* ── Upload controls ── */}
      {onUpload && (
        <div className="miv-upload">
          <div className="miv-upload-btns">
            <label className="btn btn-ghost miv-upload-btn">
              📁 File
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>
            <label className="btn btn-ghost miv-upload-btn">
              📷 Camera
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} hidden />
            </label>
          </div>
          <p className="miv-upload-hint">Ctrl+V để dán — cập nhật ảnh cho tab đang xem</p>
        </div>
      )}

      {/* ── Render texture download ── */}
      {activeTab === 'detail_image' && (
        <div className="miv-texture-action">
          {material.files?.renderTexture?.path ? (
            <a href={material.files.renderTexture.path} download className="btn btn-primary">
              ↓ Tải map render
            </a>
          ) : (
            <button className="btn btn-secondary" disabled>↓ Tải map render</button>
          )}
          <p className="miv-texture-note">
            File texture gốc dùng cho render/diễn họa khi dữ liệu ảnh thật được cập nhật.
          </p>
        </div>
      )}
    </div>
  )
}
