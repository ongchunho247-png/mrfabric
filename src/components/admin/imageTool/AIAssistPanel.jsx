import { useState } from 'react'
import { callOpenAI, AI_PROMPT_TYPES } from '../../../lib/openaiClient'

export default function AIAssistPanel({ nccCode = '', color = '', surfaceTextureUrl = '', scaleMetadata = null }) {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeType, setActiveType] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handlePrompt(pt) {
    setLoading(true)
    setError(null)
    setActiveType(pt.type)
    setResult('')
    try {
      const prompt = pt.buildPrompt({ nccCode, color })
      const res = await callOpenAI({ type: pt.type, prompt, nccCode, color, surfaceTextureUrl, scaleMetadata })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTest() {
    setLoading(true)
    setError(null)
    setActiveType('_test')
    setResult('')
    try {
      const res = await callOpenAI({
        type: 'text',
        prompt: 'Trả lời ngắn gọn: OpenAI đã kết nối thành công với MrFabric.',
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const missingKey = error?.includes('OPENAI_API_KEY') || error?.includes('Thiếu')

  return (
    <div className="fit-card fit-ai-panel">
      <div className="fit-card-title">AI / ChatGPT</div>

      <div className="fit-ai-btns">
        <button
          className={`btn btn-secondary btn-xs${activeType === '_test' ? ' fit-ai-btn--active' : ''}`}
          onClick={handleTest}
          disabled={loading}
          title="Kiểm tra kết nối OpenAI"
        >
          🔌 Test kết nối
        </button>

        {AI_PROMPT_TYPES.map((pt) => (
          <button
            key={pt.type}
            className={`btn btn-secondary btn-xs${activeType === pt.type ? ' fit-ai-btn--active' : ''}`}
            onClick={() => handlePrompt(pt)}
            disabled={loading}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="fit-ai-loading">⏳ Đang hỏi ChatGPT…</div>
      )}

      {error && !loading && (
        <div className="fit-ai-error">
          <span>✕ {error}</span>
          {missingKey && (
            <div className="fit-phase-notice" style={{ marginTop: 6 }}>
              Thêm <code>OPENAI_API_KEY</code> vào Vercel: Settings → Environment Variables → Redeploy.
              Khi dev local, thêm vào <code>.env.local</code>: <code>OPENAI_API_KEY=sk-…</code>
            </div>
          )}
        </div>
      )}

      {result && !loading && (
        <div className="fit-ai-result">
          <div className="fit-ai-result-header">
            <span className="fit-card-title" style={{ margin: 0 }}>Kết quả</span>
            <button className="fit-reset-btn" onClick={handleCopy}>
              {copied ? '✓ Đã copy' : 'Copy'}
            </button>
          </div>
          <textarea
            className="fit-ai-textarea"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={8}
          />
        </div>
      )}
    </div>
  )
}
