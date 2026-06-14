import { useEffect } from 'react'
import MaterialImageViewer from './MaterialImageViewer'
import { COLOR_GROUPS, findColorEntry } from '../../data/colorGroups'
import './MaterialDetailModal.css'

function formatPrice(val, unit = 'đ/m') {
  if (!val) return null
  const digits = String(val).replace(/\D/g, '')
  if (!digits) return String(val)
  return parseInt(digits, 10).toLocaleString('vi-VN') + ' ' + unit
}

function Row({ label, value, code }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const display = Array.isArray(value) ? value.join(', ') : value
  return (
    <div className="mdm-info-row">
      <span className="mdm-info-label">{label}</span>
      {code
        ? <code className="mdm-info-code">{display}</code>
        : <span className="mdm-info-value">{display}</span>}
    </div>
  )
}

function InfoSection({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children)
  if (!hasContent) return null
  return (
    <div className="mdm-section">
      <p className="section-title">{title}</p>
      {children}
    </div>
  )
}

export default function MaterialDetailModal({ material, moodboardItems, onSave, onClose, onUpdateImage, showPrice = true, allMaterials, onSwitchVariant }) {
  const isSaved = moodboardItems.some((i) => i.maMrFabric === material.maMrFabric)

  const variants = (allMaterials && material.nhomVatLieu)
    ? allMaterials.filter((m) => m.nhomVatLieu === material.nhomVatLieu && m.id !== material.id)
    : []

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box mdm-box">
        <button className="mdm-close-btn" onClick={onClose} title="Đóng">✕</button>

        <div className="mdm-layout">
          {/* LEFT: Images + variant dots */}
          <div className="mdm-left">
            <MaterialImageViewer
              material={material}
            />

            {/* Variant color dots — right below image viewer */}
            {variants.length > 0 && (
              <div className="mdm-variant-dots">
                {variants.map((v) => {
                  const vce = findColorEntry(v.nhomMau)
                  // Ưu tiên aiColorHex (màu AI đã render thực tế) > nhomMau group color
                  const dotColor = v.aiColorHex || vce?.hex || '#ccc'
                  const colorLabel = vce?.name_en || v.nhomMau || ''
                  return (
                    <span
                      key={v.id}
                      className="mdm-variant-dot-btn"
                      style={{ background: dotColor }}
                      title={`${colorLabel} · ${v.maMrFabric}${v.aiColorHex ? ` · ${v.aiColorHex}` : ''}`}
                      onClick={() => onSwitchVariant?.(v)}
                    />
                  )
                })}
              </div>
            )}

            {material.files?.specSheet?.path && (
              <a href={material.files.specSheet.path} download className="btn btn-secondary mdm-spec-btn">
                ↓ Tải spec vật liệu
              </a>
            )}
          </div>

          {/* RIGHT: Info — USER VIEW: MrFabric + Thiết kế (không có NCC) */}
          <div className="mdm-right">
            {/* Header */}
            <div className="mdm-header">
              <div>
                <div className="mdm-code">{material.maMrFabric}</div>
                {!material.hiddenProductType && material.tenDongSanPham && (
                  <div className="mdm-line">{material.tenDongSanPham}</div>
                )}
              </div>
              <button
                className={`btn${isSaved ? ' btn-secondary' : ' btn-primary'} mdm-save-btn`}
                onClick={() => onSave(material)}
              >
                {isSaved ? '♥ Đã lưu' : '♡ Lưu mẫu'}
              </button>
            </div>

            {material.moTaNgan && (
              <p className="mdm-desc">{material.moTaNgan}</p>
            )}

            {/* ── THÔNG TIN MRFABRIC ── */}
            <InfoSection title="Thông tin MrFabric">
              <Row label="Mã MrFabric" value={material.maMrFabric} code />
              <Row label="Phân khúc" value={material.phanKhuc} />
            </InfoSection>

            {/* ── THÔNG TIN THIẾT KẾ ── */}
            <InfoSection title="Thông tin Thiết kế">
              {(() => {
                const colorEntry = findColorEntry(material.nhomMau)
                const colorDisplay = colorEntry ? colorEntry.name_en : material.nhomMau
                return (
                  <Row
                    label="Nhóm màu"
                    value={
                      material.aiColorHex
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {colorDisplay}
                            <span style={{ width: 14, height: 14, borderRadius: 3, background: material.aiColorHex, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8em', color: 'var(--color-text-muted)' }}>{material.aiColorHex.toUpperCase()}</span>
                          </span>
                        : colorDisplay
                    }
                  />
                )
              })()}
              <Row label="Tone màu" value={material.toneMau} />
              <Row label="Bề mặt" value={material.beMat} />
              <Row label="Ứng dụng" value={material.ungDung} />
              {!material.hiddenProductType && <Row label="Dòng sản phẩm" value={material.congNang} />}
              <Row label="Phong cách" value={material.phongCach} />
            </InfoSection>

            {/* ── THÔNG SỐ KỸ THUẬT (hữu ích cho KTS, không phải NCC nội bộ) ── */}
            <InfoSection title="Thông số kỹ thuật">
              <Row label="Khổ" value={material.khoVai} />
              <Row label="Thành phần" value={material.thanhPhan} />
              <Row label="Tiêu chuẩn" value={material.tieuChuan} />
            </InfoSection>

            {/* ── ĐƠN GIÁ ── */}
            {showPrice && (
              <InfoSection title="Đơn giá">
                <Row label="Giá bán vải" value={formatPrice(material.giaBan, 'đ/m')} />
                <Row label="Giá bán rèm" value={formatPrice(material.giaBanRem, 'đ/m²')} />
              </InfoSection>
            )}


            {/* ── GHI CHÚ TƯ VẤN ── */}
            {(material.ghiChuTuVan || material.ghiChuTuVanKTS || material.ghiChuTuVanSale) && (
              <InfoSection title="Ghi chú tư vấn">
                {material.ghiChuTuVan && (
                  <div className="mdm-note">
                    <span className="mdm-note-label">Chung</span>
                    <span>{material.ghiChuTuVan}</span>
                  </div>
                )}
                {material.ghiChuTuVanKTS && (
                  <div className="mdm-note">
                    <span className="mdm-note-label">Cho KTS</span>
                    <span>{material.ghiChuTuVanKTS}</span>
                  </div>
                )}
                {material.ghiChuTuVanSale && (
                  <div className="mdm-note">
                    <span className="mdm-note-label">Cho Sale</span>
                    <span>{material.ghiChuTuVanSale}</span>
                  </div>
                )}
              </InfoSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
