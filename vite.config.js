import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
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
