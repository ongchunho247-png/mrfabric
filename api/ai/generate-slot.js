import OpenAI, { toFile } from 'openai'

export const config = { maxDuration: 60 }

// ── Prompt cho từng slot ──────────────────────────────────────────────────────

const SLOT_PROMPTS = {
  slot_2: ({ supplier, collection, colorName }) =>
    `Professional textile product photography. An elegant woman's hand gently holds or lightly touches fabric.
The fabric texture, weave pattern, and color in this image must be reproduced faithfully.
The hand only partially contacts the fabric — the texture remains clearly visible.
Vary the hand angle (avoid generic overhead flat view).
Clean white or soft neutral studio background. Soft even lighting reveals the weave.
High-end textile catalogue style. Sharp focus on the fabric surface.
${supplier ? `Supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}
No text, no watermarks, no logos.`,

  slot_3: ({ supplier, collection, colorName }) =>
    `Professional interior design product photography. A modern minimalist sofa with 2–3 matching throw pillows.
The fabric texture, weave, and color in this image MUST appear on both the sofa seat and the pillows.
Do NOT substitute with leather, velvet, or any other material. Keep the exact texture and color.
Natural studio lighting with soft shadows. Clean modern sofa, minimal background.
High-end interior design catalogue style.
${supplier ? `Supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}
No text, no watermarks, no logos.`,

  slot_4: ({ supplier, collection, colorName }) =>
    `Professional interior design product photography. Elegant curtains with natural draping folds.
The fabric texture, weave, and color in this image MUST be clearly visible on the curtain surface.
Natural soft draping — not stiff, not over-pleated, not synthetic-looking.
Do NOT make the fabric shinier or silkier than the reference.
Soft natural or studio light falling across the curtain, revealing the texture.
High-end interior catalogue style.
${supplier ? `Supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}
No text, no watermarks, no logos.`,

  slot_5: ({ supplier, collection }) =>
    `Technical fabric reference photography. The fabric from this image laid flat with a measuring ruler or tape measure placed across the surface.
The weave and texture must be clearly visible. Ruler markings (cm) must be legible.
Clean white background. Even bright lighting, no harsh shadows.
Technical product photography style.
${supplier ? `Supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}
No text overlays, no watermarks, no logos.`,

  slot_6: ({ supplier, collection, colorName }) =>
    `Close-up macro textile photography. Detail shot of the fabric from this image.
Choose ONE detail type: fabric edge revealing interior weave structure, OR fabric corner showing edge finish, OR surface macro showing exact weave up close.
The texture, weave, and color from the reference must closely match.
Razor-sharp focus on the detail. Shallow depth of field for background.
High-end material catalogue quality.
${supplier ? `Supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}
No text, no watermarks, no logos.`,
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Thiếu OPENAI_API_KEY trong Vercel Environment Variables.' })
  }

  try {
    const {
      slot,
      surfaceTextureUrl,
      nccCode,
      colorName,
      supplier,
      collection,
      materialMetadata,
    } = req.body || {}

    const VALID_SLOTS = ['slot_2', 'slot_3', 'slot_4', 'slot_5', 'slot_6']
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ ok: false, error: `Slot không hợp lệ. Cần: ${VALID_SLOTS.join(', ')}.` })
    }

    if (!surfaceTextureUrl) {
      return res.status(400).json({ ok: false, error: 'Thiếu surfaceTextureUrl.' })
    }

    // Parse base64 dataURL
    const match = surfaceTextureUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ ok: false, error: 'surfaceTextureUrl phải là base64 dataURL.' })
    }
    const [, imageType, base64Image] = match

    const meta = { nccCode, colorName, supplier, collection, materialMetadata }
    const prompt = SLOT_PROMPTS[slot](meta)
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const imageBuffer = Buffer.from(base64Image, 'base64')

    // ── Strategy 1: gpt-image-1 via images.edit() — dùng ảnh texture thật ──
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

      return res.status(200).json({ ok: true, slot, imageUrl: `data:image/png;base64,${b64}`, model: 'gpt-image-1' })
    } catch (e1) {
      console.warn(`[ai/generate-slot:${slot}] gpt-image-1 thất bại (${e1.message}) — thử dall-e-3`)
    }

    // ── Strategy 2: dall-e-3 via images.generate() — fallback không cần ảnh tham chiếu ──
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    })

    const b64 = response.data[0]?.b64_json
    if (!b64) throw new Error('dall-e-3 không trả về b64_json')

    return res.status(200).json({ ok: true, slot, imageUrl: `data:image/png;base64,${b64}`, model: 'dall-e-3' })
  } catch (error) {
    console.error(`[ai/generate-slot]`, error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi gọi OpenAI tạo ảnh.' })
  }
}
