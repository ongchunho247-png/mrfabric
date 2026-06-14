import { useState, useEffect } from 'react'
import './MaterialImageViewer.css'

const IMAGE_TABS = [
  { key: 'surface_texture', fallback: 'closeup',      label: 'Bề mặt' },
  { key: 'main_hand_image', fallback: null,            label: 'Thành phẩm ~1m' },
  { key: 'curtain_image',   fallback: 'curtain',      label: 'Nội thất ~2m' },
  { key: 'detail_image',    fallback: 'renderTexture', label: 'Sơ đồ kỹ thuật' },
]

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

export default function MaterialImageViewer({ material }) {
  const [activeTab, setActiveTab] = useState('surface_texture')
  const [mainErr, setMainErr] = useState(false)

  const activeTabObj = IMAGE_TABS.find((t) => t.key === activeTab)
  const mainSrc = getTabSrc(material, activeTabObj || IMAGE_TABS[0])
  useEffect(() => { setMainErr(false) }, [mainSrc])

  function handleTabChange(key) {
    setActiveTab(key)
    setMainErr(false)
  }

  const isDiagram = activeTab === 'detail_image'

  return (
    <div className="miv">
      {/* ── Main large image ── */}
      <div
        className="miv-main-wrap"
        style={isDiagram ? { aspectRatio: '1/1', background: '#ffffff' } : undefined}
      >
        {mainSrc && !mainErr ? (
          <img
            key={mainSrc}
            src={mainSrc}
            alt={activeTabObj?.label}
            className="miv-main-img"
            style={isDiagram ? { objectFit: 'contain' } : undefined}
            onError={() => setMainErr(true)}
          />
        ) : (
          <div className="miv-main-ph img-placeholder">
            <span className="miv-ph-icon">📷</span>
            <strong>{activeTabObj?.label}</strong>
            <span>{material.maMrFabric}</span>
          </div>
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

    </div>
  )
}
