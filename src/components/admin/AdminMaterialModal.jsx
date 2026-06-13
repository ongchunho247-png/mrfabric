import { useEffect } from 'react'
import MaterialImageViewer from '../library/MaterialImageViewer'
import { COLOR_GROUPS, findColorEntry } from '../../data/colorGroups'
import './AdminMaterialModal.css'

function Row({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const display = Array.isArray(value) ? value.join(', ') : value
  return (
    <div className="amm-row">
      <span className="amm-row-label">{label}</span>
      <span className="amm-row-value">{display}</span>
    </div>
  )
}

function SectionBlock({ accent, icon, title, children }) {
  return (
    <div className={`amm-block amm-block--${accent}`}>
      <div className="amm-block-header">
        <span>{icon}</span>
        <strong>{title}</strong>
      </div>
      <div className="amm-block-body">{children}</div>
    </div>
  )
}

export default function AdminMaterialModal({ material, onClose, onEdit }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isAdmin = !!material.source

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box amm-box">
        <button className="amm-close" onClick={onClose} title="Đóng">✕</button>

        <div className="amm-layout">
          {/* LEFT */}
          <div className="amm-left">
            <MaterialImageViewer material={material} />
          </div>

          {/* RIGHT */}
          <div className="amm-right">
            {/* Header */}
            <div className="amm-header">
              <div className="amm-code">{material.maMrFabric}</div>
              <div className="amm-line">{material.tenDongSanPham}</div>
              {isAdmin && (
                <div className="amm-source">
                  Admin — {material.source?.labelImageName || 'không có ảnh nhãn'}
                  {material.source?.createdAt && (
                    <span> · {new Date(material.source.createdAt).toLocaleDateString('vi-VN')}</span>
                  )}
                  {material.source?.ocrFieldsFound?.length > 0 && (
                    <span> · OCR: {material.source.ocrFieldsFound.length} trường</span>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 1: NCC ── */}
            <SectionBlock accent="ncc" icon="🏷️" title="Thông tin NCC">
              <Row label="Nhà cung cấp" value={material.nhaCungCap} />
              <Row label="Mã NCC" value={material.maNCC} />
              <Row label="Collection" value={material.collection} />
              <Row label="Khổ" value={material.khoVai} />
              <Row label="Thành phần" value={material.thanhPhan} />
              <Row label="Tiêu chuẩn" value={material.tieuChuan} />
            </SectionBlock>

            {/* ── SECTION 2: MRFABRIC ── */}
            <SectionBlock accent="mrfabric" icon="🏷️" title="Thông tin MrFabric">
              <Row label="Phân khúc" value={material.phanKhuc} />
              {material.moTaNgan && (
                <div className="amm-desc">{material.moTaNgan}</div>
              )}
              {material.ghiChuTuVan && (
                <div className="amm-note">
                  <span className="amm-note-label">Tư vấn chung</span>
                  <span>{material.ghiChuTuVan}</span>
                </div>
              )}
              {material.ghiChuTuVanKTS && (
                <div className="amm-note">
                  <span className="amm-note-label">Cho KTS</span>
                  <span>{material.ghiChuTuVanKTS}</span>
                </div>
              )}
              {material.ghiChuTuVanSale && (
                <div className="amm-note">
                  <span className="amm-note-label">Cho Sale</span>
                  <span>{material.ghiChuTuVanSale}</span>
                </div>
              )}
              {material.ghiChuNganGuiKhach && (
                <div className="amm-note">
                  <span className="amm-note-label">Gửi khách</span>
                  <span>{material.ghiChuNganGuiKhach}</span>
                </div>
              )}
            </SectionBlock>

            {/* ── SECTION 3: THIẾT KẾ ── */}
            <SectionBlock accent="design" icon="🎨" title="Thông tin Thiết kế">
              {(() => {
                const colorEntry = findColorEntry(material.nhomMau)
                return <Row label="Nhóm màu" value={colorEntry ? colorEntry.name_en : material.nhomMau} />
              })()}
              <Row label="Tone màu" value={material.toneMau} />
              <Row label="Bề mặt" value={material.beMat} />
              <Row label="Ứng dụng" value={material.ungDung} />
              <Row label="Dòng sản phẩm" value={material.congNang} />
              <Row label="Phong cách" value={material.phongCach} />
            </SectionBlock>

            {/* Actions */}
            <div className="amm-actions">
              {isAdmin && onEdit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => { onClose(); onEdit(material) }}
                >
                  ✎ Sửa vật liệu này
                </button>
              )}
              <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
