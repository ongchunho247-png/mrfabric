import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import OpenAI from 'openai'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'openai-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/openai-generate', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'Method not allowed. Use POST.' }))
              return
            }

            const apiKey = env.OPENAI_API_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'Thiếu OPENAI_API_KEY trong .env.local' }))
              return
            }

            const chunks = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('error', (err) => {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: err.message }))
            })
            req.on('end', async () => {
              let body = {}
              try { body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) } catch (_) {}

              const { type = 'text', prompt, nccCode, color, surfaceTextureUrl, scaleMetadata } = body

              if (!prompt || typeof prompt !== 'string') {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: 'Thiếu prompt.' }))
                return
              }

              try {
                const client = new OpenAI({ apiKey })
                const systemInstruction = `Bạn là trợ lý AI cho app MrFabric — hệ thống quản lý thư viện vật liệu vải.
Nhiệm vụ: hỗ trợ tạo nội dung/prompt xử lý ảnh vật liệu vải cho admin.
Nguyên tắc: surface_texture là nguồn chính, không tạo họa tiết mới, giữ rõ vân vải.
Trả lời ngắn gọn bằng tiếng Việt trừ khi yêu cầu tiếng Anh.`
                const userInput = `Loại: ${type}\nMã NCC: ${nccCode || ''}\nMàu: ${color || ''}\nSurface texture: ${surfaceTextureUrl ? '(có)' : '(chưa có)'}\n\nYêu cầu:\n${prompt}`

                const response = await client.responses.create({
                  model: 'gpt-5.5',
                  input: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userInput },
                  ],
                })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: true, type, result: response.output_text }))
              } catch (err) {
                console.error('[openai-middleware]', err.message)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: err.message || 'Lỗi khi gọi OpenAI API.' }))
              }
            })
          })
        },
      },
      {
        name: 'claude-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/claude/v1/messages', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method Not Allowed')
              return
            }

            if (!env.CLAUDE_API_KEY) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing CLAUDE_API_KEY in .env.local' }))
              return
            }

            const chunks = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('error', (err) => {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            })
            req.on('end', async () => {
              const body = Buffer.concat(chunks).toString('utf-8')
              try {
                const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                  },
                  body,
                })
                const text = await apiRes.text()
                res.statusCode = apiRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(text)
              } catch (err) {
                console.error('[claude-middleware] fetch error:', err.message)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
