import OpenAI from 'openai'

// Tăng timeout cho Vercel (image generation tốn ~15-30s/slot)
export const config = { maxDuration: 60 }

const SLOT_PROMPTS = {
  slot_2: ({ supplier, collection, colorName }) =>
    `You are a professional textile product photographer creating high-end catalogue images.

TASK: Using the fabric texture shown in the reference image as the EXACT material, create a product photography image of an elegant woman's hand gently holding or lightly touching the fabric.

STRICT REQUIREMENTS:
- Reproduce the EXACT fabric texture, weave pattern, and color from the reference image faithfully
- The hand should only partially contact the fabric — fabric texture must remain visible
- Vary the hand angle and position (avoid a generic flat overhead view)
- Clean white or very soft neutral studio background
- Professional textile catalogue lighting — soft, even, reveals the weave
- Sharp focus on the fabric surface
${supplier ? `Fabric supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}

NO text, NO watermarks, NO logos in the image.`,

  slot_3: ({ supplier, collection, colorName }) =>
    `You are a professional interior design photographer creating high-end catalogue images.

TASK: Using the fabric texture shown in the reference image as the EXACT upholstery material, create a product photo of a modern minimalist sofa with 2–3 matching throw pillows.

STRICT REQUIREMENTS:
- The EXACT fabric texture, weave, and color from the reference image MUST be visible on the sofa seat, backrest, and pillows
- Do NOT substitute the material with leather, velvet, linen, or any other texture — only the reference texture
- Do NOT change the color or texture pattern
- Natural studio lighting, soft shadows that reveal the weave
- Clean, modern sofa design — minimal background clutter
- High-end interior design catalogue style
${supplier ? `Fabric supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}

NO text, NO watermarks, NO logos in the image.`,

  slot_4: ({ supplier, collection, colorName }) =>
    `You are a professional interior design photographer creating high-end catalogue images.

TASK: Using the fabric texture shown in the reference image as the EXACT curtain material, create a product photo showing elegant curtains with natural draping folds.

STRICT REQUIREMENTS:
- The EXACT fabric texture, weave, and color from the reference image MUST be clearly visible on the curtain surface
- Natural, soft draping folds — not stiff, not synthetic-looking, not overly pleated
- Do NOT make the fabric appear shinier or silkier than the reference image shows
- Soft natural light or studio light falling across the curtain, revealing the texture
- High-end interior design catalogue style
${supplier ? `Fabric supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}

NO text, NO watermarks, NO logos in the image.`,

  slot_5: ({ supplier, collection }) =>
    `You are a product photography specialist creating technical fabric reference images.

TASK: Using the fabric texture shown in the reference image, create a clean technical product photo showing the fabric laid flat with a measuring ruler or fabric tape measure placed across the surface.

STRICT REQUIREMENTS:
- The fabric weave and texture from the reference must be clearly visible
- A standard ruler or tape measure placed diagonally or horizontally on the fabric
- The ruler markings (cm or mm) must be legible
- Clean white background — even, bright lighting with no harsh shadows
- Technical product photography style — no decorative elements
${supplier ? `Fabric supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}

NO text overlays, NO watermarks, NO logos in the image.`,

  slot_6: ({ supplier, collection, colorName }) =>
    `You are a professional textile photographer creating high-end material catalogue detail shots.

TASK: Using the fabric texture shown in the reference image, create a close-up macro photograph showing one fabric detail. Vary the detail type between different fabrics — choose ONE of: (1) fabric edge or selvedge revealing interior weave structure, (2) fabric corner with edge-finish detail, (3) fabric surface macro showing exact weave at close range.

STRICT REQUIREMENTS:
- The texture, weave pattern, and color from the reference image must closely match
- Razor-sharp focus on the chosen detail
- Shallow depth of field for background — fabric edge or fold as visual interest
- Do NOT repeat the same detail type across different fabric calls
- Professional material catalogue quality
${supplier ? `Fabric supplier: ${supplier}.` : ''}${collection ? ` Collection: ${collection}.` : ''}${colorName ? ` Color: ${colorName}.` : ''}

NO text, NO watermarks, NO logos in the image.`,
}

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
      colorHex,
      supplier,
      collection,
      materialMetadata,
      scaleMetadata,
    } = req.body || {}

    const VALID_SLOTS = ['slot_2', 'slot_3', 'slot_4', 'slot_5', 'slot_6']
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ ok: false, error: `Slot không hợp lệ. Cần: ${VALID_SLOTS.join(', ')}.` })
    }

    if (!surfaceTextureUrl) {
      return res.status(400).json({ ok: false, error: 'Thiếu surfaceTextureUrl (base64 dataURL của surface_texture).' })
    }

    // Parse base64 dataURL: data:image/<type>;base64,<data>
    const match = surfaceTextureUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ ok: false, error: 'surfaceTextureUrl phải là base64 dataURL (data:image/jpeg;base64,...).' })
    }
    const [, imageType, base64Image] = match

    const meta = { nccCode, colorName, colorHex, supplier, collection, materialMetadata, scaleMetadata }
    const prompt = SLOT_PROMPTS[slot](meta)

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.responses.create({
      model: 'gpt-image-1',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/${imageType};base64,${base64Image}`,
            },
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    })

    // Trích xuất ảnh từ output
    const imageBlock = response.output?.find((item) => item.type === 'image_generation_call')
    if (!imageBlock?.result) {
      return res.status(500).json({
        ok: false,
        error: 'OpenAI không trả về ảnh. Kiểm tra model gpt-image-1 và quota tài khoản.',
        debug: response.output?.map((o) => o.type),
      })
    }

    return res.status(200).json({
      ok: true,
      slot,
      imageUrl: `data:image/png;base64,${imageBlock.result}`,
    })
  } catch (error) {
    console.error('[ai/generate-slot]', error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi gọi OpenAI tạo ảnh.' })
  }
}
