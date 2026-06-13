import OpenAI, { toFile } from 'openai'

export const config = { maxDuration: 60 }

// ── Phân tích vải bằng GPT-4o (tái sử dụng từ generate-slot) ─────────────────
async function analyzeFabric(client, base64Image, imageType) {
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${base64Image}` } },
            {
              type: 'text',
              text: 'Describe this fabric for product photography. Include: pattern type (floral/geometric/plain/jacquard etc), texture quality (smooth/woven/embossed etc), and overall style. Max 2 sentences. English only. Do NOT mention the current color.',
            },
          ],
        },
      ],
      max_tokens: 150,
    })
    return res.choices[0]?.message?.content?.trim() || ''
  } catch {
    return ''
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Thiếu OPENAI_API_KEY.' })
  }

  try {
    const { surfaceTextureUrl, targetColor, nccCode, supplier, collection } = req.body || {}

    if (!surfaceTextureUrl) {
      return res.status(400).json({ ok: false, error: 'Thiếu surfaceTextureUrl.' })
    }
    if (!targetColor?.name) {
      return res.status(400).json({ ok: false, error: 'Thiếu targetColor.name.' })
    }

    const match = surfaceTextureUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ ok: false, error: 'surfaceTextureUrl phải là base64 dataURL.' })
    }
    const [, imageType, base64Image] = match
    const imageBuffer = Buffer.from(base64Image, 'base64')

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Phân tích cấu trúc vải (không đề cập màu gốc)
    const fabricAnalysis = await analyzeFabric(client, base64Image, imageType)
    console.log(`[recolor-surface] target=${targetColor.name} analysis:`, fabricAnalysis.slice(0, 100))

    const colorDesc = `${targetColor.name}${targetColor.hex ? ` (hex ${targetColor.hex})` : ''}`
    const brandLine = [
      supplier ? `Supplier: ${supplier}.` : '',
      collection ? ` Collection: ${collection}.` : '',
      nccCode ? ` Code: ${nccCode}.` : '',
    ].join('')

    const prompt = `Professional premium fabric surface texture photography.

TASK: Generate this fabric in the color ${colorDesc}.

FABRIC STRUCTURE: ${fabricAnalysis || 'Fabric with detailed weave pattern and texture.'}

COLOR TRANSFORMATION:
- Change the fabric color to ${colorDesc}
- Keep EXACTLY the same pattern, motifs, and design elements
- Keep EXACTLY the same weave structure and texture quality
- Keep EXACTLY the same surface finish, sheen level, and fabric weight appearance
- The result must look like the same fabric design produced in the ${targetColor.name} colorway

PHOTOGRAPHY:
- Fabric fills the entire frame edge-to-edge
- Slight overhead angle (75–80°) giving subtle perspective and depth
- Soft directional sidelight at 30–45° from upper left revealing weave texture
- No harsh shadows, no glare on surface
- Maximum sharpness across the fabric surface

STYLE: Premium fabric swatch photography. Liberty Fabrics, Schumacher, Dedar quality level.

CRITICAL: Reproduce the exact pattern and weave structure in ${colorDesc}. Do not simplify or alter the design. No text, no watermarks, no logos.
${brandLine}`

    // ── Strategy 1: gpt-image-1 via images.edit() — ảnh thật làm tham chiếu ──
    try {
      const imageFile = await toFile(imageBuffer, `texture.${imageType}`, { type: `image/${imageType}` })
      const response = await client.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt,
        n: 1,
        size: '1024x1024',
      })
      const b64 = response.data[0]?.b64_json
      if (!b64) throw new Error('gpt-image-1 không trả về b64_json')

      return res.status(200).json({
        ok: true,
        imageUrl: `data:image/png;base64,${b64}`,
        model: 'gpt-image-1',
        targetColor,
      })
    } catch (e1) {
      console.warn(`[recolor-surface] gpt-image-1 thất bại (${e1.message}) — fallback dall-e-3`)
    }

    // ── Strategy 2: dall-e-3 fallback ────────────────────────────────────────
    const fallbackPrompt = `Professional fabric surface texture photography. ${fabricAnalysis || 'Fabric with detailed woven pattern.'} The fabric is in ${colorDesc} color. Fabric fills the entire frame. Sidelight reveals weave texture. Maximum sharpness. Premium textile catalog quality. No text, no logos.`

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: fallbackPrompt.slice(0, 4000),
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
      quality: 'hd',
    })
    const b64 = response.data[0]?.b64_json
    if (!b64) throw new Error('dall-e-3 không trả về b64_json')

    return res.status(200).json({
      ok: true,
      imageUrl: `data:image/png;base64,${b64}`,
      model: 'dall-e-3',
      targetColor,
    })
  } catch (error) {
    console.error('[recolor-surface]', error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi đổi màu vải.' })
  }
}
