import { useState, useRef } from 'react'
import { extractNccCodeFromFilename } from '../../helpers/matchMaterialByFilename'
import './BatchImageUpdater.css'

export default function BatchImageUpdater({ allMaterials, onUpdateImage }) {
  const inputRef = useRef()
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function processFiles(files) {
    const imageFiles = [...files].filter((f) => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    setProcessing(true)
    setResults([])

    const out = []
    for (const file of imageFiles) {
      const nccCode = extractNccCodeFromFilename(file.name)
      const material = nccCode
        ? allMaterials.find((m) => !m.deletedAt && (m.maNCC || '').toUpperCase() === nccCode)
        : null

      if (material) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
        onUpdateImage(material.id, 'closeup', dataUrl)
        out.push({ filename: file.name, nccCode, material, status: 'ok' })
      } else {
        out.push({ filename: file.name, nccCode, material: null, status: 'nomatch' })
      }
    }

    setResults(out)
    setProcessing(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  function handleChange(e) {
    processFiles(e.target.files)
    e.target.value = ''
  }

  const matched = results.filter((r) => r.status === 'ok').length
  const unmatched = results.filter((r) => r.status === 'nomatch').length

  return (
    <div className="biu-wrap">
      <div
        className={`biu-dropzone${dragging ? ' biu-dropzone--drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
      >
        <span className="biu-drop-icon">🖼️</span>
        <p className="biu-drop-title">Kéo thả ảnh vào đây hoặc <strong>bấm để chọn</strong></p>
        <p className="biu-drop-hint">Tên file phải khớp với Mã NCC (VD: <code>A15-8.jpg</code>, <code>KC-03.png</code>)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>

      {processing && <p className="biu-processing">Đang xử lý ảnh...</p>}

      {results.length > 0 && (
        <div className="biu-results">
          <div className="biu-summary">
            <span className="biu-summary-ok">✅ {matched} ảnh đã cập nhật</span>
            {unmatched > 0 && <span className="biu-summary-fail">❌ {unmatched} không match</span>}
            <button className="btn btn-ghost biu-clear-btn" onClick={() => setResults([])}>Xoá kết quả</button>
          </div>
          <div className="biu-list">
            {results.map((r) => (
              <div key={r.filename} className={`biu-row biu-row--${r.status}`}>
                <span className="biu-row-icon">{r.status === 'ok' ? '✅' : '❌'}</span>
                <span className="biu-row-file">{r.filename}</span>
                {r.status === 'ok' ? (
                  <span className="biu-row-match">
                    {r.material.maNCC} → <code>{r.material.maMrFabric || '(Chưa có mã)'}</code>
                  </span>
                ) : (
                  <span className="biu-row-nomatch">
                    {r.nccCode ? `Không tìm thấy mã ${r.nccCode}` : 'Không đọc được mã từ tên file'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
