import OpenAI, { toFile } from 'openai'

export const config = { maxDuration: 60 }

// ── Step 1: Phân tích vải bằng GPT-4o Vision ─────────────────────────────────
// Trả về mô tả ngắn gọn về họa tiết, màu sắc, kết cấu để inject vào prompt
async function analyzeFabric(client, base64Image, imageType) {
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/${imageType};base64,${base64Image}` },
            },
            {
              type: 'text',
              text: `You are a textile expert. Analyze this fabric image and describe it precisely for product photography.
Include:
- Pattern type (e.g., "tone-on-tone floral jacquard", "solid plain weave", "geometric print", "abstract chenille")
- Exact colors (e.g., "warm oat/cream base with ivory floral motifs")
- Visual texture quality (e.g., "soft woven surface with slight raised jacquard detail")
- Overall style (e.g., "classic European, luxury residential")
Be specific, factual, and concise. Max 3 sentences. English only.`,
            },
          ],
        },
      ],
      max_tokens: 200,
    })
    return res.choices[0]?.message?.content?.trim() || ''
  } catch (e) {
    console.warn('[analyzeFabric] GPT-4o vision failed:', e.message)
    return ''
  }
}

// ── Step 2: Prompt cho từng slot (dùng fabricAnalysis từ vision) ──────────────

function buildPrompt(slot, { fabricAnalysis, colorName, supplier, collection, materialMetadata }) {
  const desc = fabricAnalysis
    || `fabric with exact pattern, color (${colorName || 'as shown in reference'}), and texture from the reference image`

  const brandLine = [
    supplier ? `Supplier: ${supplier}.` : '',
    collection ? ` Collection: ${collection}.` : '',
    colorName ? ` Colorway: ${colorName}.` : '',
    materialMetadata?.thanhPhan ? ` Composition: ${materialMetadata.thanhPhan}.` : '',
  ].join('')

  const noText = 'No text, no watermarks, no logos, no branding overlays.'

  const prompts = {
    slot_2: `Professional high-end textile showroom photography.

FABRIC: ${desc}

SCENE: An elegant woman's hand gently holds this fabric, lightly pinching the top edge between thumb and index finger. The fabric cascades downward in soft, natural folds revealing its drape and weight. The grip is relaxed and refined — not clutching.

COMPOSITION & CAMERA:
- Medium close-up shot
- 45-degree diagonal angle showing the hand from slightly above
- Shallow depth of field: sharp focus on fabric texture and weave, hand slightly soft
- Fabric fills 70% of the frame

LIGHTING:
- Soft diffused studio lighting, key light from upper left
- Subtle fill light from right to open shadows
- Light reveals the surface texture and sheen of the weave

BACKGROUND: Clean seamless white or very light warm gray studio backdrop. No distractions.

STYLE: Luxury textile catalogue. Think Rubelli, Dedar, or Zimmer+Rohde showroom photography. Editorial, aspirational, refined.

CRITICAL: Reproduce the exact pattern, weave structure, color, and sheen of the reference fabric. Do not alter the design.
${brandLine}
${noText}`,

    slot_3: `Professional luxury interior design product photography.

FABRIC: ${desc}

SCENE: A contemporary 2–3 seat sofa, fully and precisely upholstered in this fabric. The sofa has:
- Clean, straight-lined silhouette with tight seat cushions and low-profile arms
- 1 large square decorative pillow + 1 rectangular lumbar pillow in the same fabric
- A small round side table partially visible at the right edge (light oak or marble top)
- A single tall white vase with minimal branches (or subtle wall artwork) in the background

ROOM:
- Minimalist Scandinavian-inspired living space
- Warm white textured walls
- Light wood or matte concrete flooring
- Soft natural daylight entering from the left creating gentle shadows on the cushions

CAMERA: 3/4 front view, slight low angle (eye-level with seat cushion), showing the full sofa

STYLE: Interior design magazine spread — Architectural Digest, Elle Decor. Aspirational, warm, refined, luxurious.

CRITICAL: The exact fabric pattern, texture, and color must cover the sofa and pillows faithfully. No substitution with leather, velvet, or different material.
${brandLine}
${noText}`,

    slot_4: `Professional luxury window treatment product photography.

FABRIC: ${desc}

SCENE: Elegant floor-to-ceiling curtain panels crafted from this fabric:
- 2 panels hanging from a slim minimal curtain rod (brushed gold or matte black)
- Panels softly parted in the middle, each falling in relaxed natural wave folds
- Full length from ceiling to floor, touching or just grazing the floor
- Subtle window frame visible behind, soft diffused light filtering through

ROOM:
- Light, airy minimal interior with warm white walls
- Parquet or light wood floor
- Soft morning/afternoon light from behind and beside the curtain creating a luminous effect
- Gentle shadows in the fold valleys reveal fabric depth and drape quality

CAMERA:
- Full vertical composition showing curtains from rod to floor
- Slight 3/4 angle to show drape depth
- Wide enough to show the room context

STYLE: High-end window treatment showroom — Designers Guild, Colefax & Fowler. Elegant, airy, architectural.

CRITICAL: Fabric pattern, weave, and color must be clearly and faithfully visible on the curtain surface. Natural soft drape — not stiff, synthetic-looking, or over-pleated.
${brandLine}
${noText}`,

    slot_5: `Technical textile measurement reference photography.

FABRIC: ${desc}

SCENE:
- The fabric laid perfectly flat on a pure white surface
- A classic wooden ruler (cm markings, 0–15cm visible) placed horizontally across the center of the fabric
- Ruler markings must be crisp and clearly readable (1, 2, 3... cm)
- Fabric edges slightly visible on both sides of the ruler

LIGHTING:
- Bright, even, flat overhead lighting — zero harsh shadows, zero glare on ruler
- Fabric weave and surface texture must be visible (not blown out)

CAMERA:
- Directly overhead (bird's eye view, 90° top-down)
- Perfectly level, no perspective distortion
- Fabric and ruler fill the frame

BACKGROUND: Pure white seamless surface.

STYLE: Technical product swatch card, textile specification sheet. Clinical, precise, professional.

CRITICAL: Pattern and weave must be clearly shown. Ruler cm markings must be legible.
${brandLine}
${noText}`,

    slot_6: `Luxury macro textile detail photography.

FABRIC: ${desc}

SCENE: The fabric folded at a crisp 90-degree angle, displaying:
- The FRONT face of the fabric with its full pattern and surface texture
- The folded EDGE revealing the interior weave structure and thread cross-section
- Both surfaces visible simultaneously — front face and fold interior

LIGHTING:
- Raking sidelight or macro ring light to emphasize the three-dimensional woven structure
- Light catches the raised texture and individual threads
- Crisp, even illumination with soft shadow in the fold for depth

CAMERA:
- Extreme macro close-up — the fold edge is the primary subject
- Razor-sharp focus on the weave detail at the fold
- Very shallow depth of field: background fabric fades into soft blur
- Slight 45-degree angle to the fold edge

BACKGROUND: Softly blurred neutral background (warm cream or matching the fabric palette).

STYLE: Premium material sample card photography. Think luxury swatch books from Maharam or Kvadrat. Tactile, sensuous, precise.

CRITICAL: Exact weave structure, fiber texture, thread count appearance, pattern, and color must be faithfully reproduced. Show the physical depth and tactile quality of the fabric.
${brandLine}
${noText}`,
  }

  return prompts[slot] || ''
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

    const match = surfaceTextureUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      return res.status(400).json({ ok: false, error: 'surfaceTextureUrl phải là base64 dataURL.' })
    }
    const [, imageType, base64Image] = match

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const imageBuffer = Buffer.from(base64Image, 'base64')

    // Step 1: Phân tích vải bằng GPT-4o Vision
    const fabricAnalysis = await analyzeFabric(client, base64Image, imageType)
    console.log(`[generate-slot:${slot}] fabric analysis:`, fabricAnalysis.slice(0, 120))

    // Step 2: Build prompt chi tiết
    const prompt = buildPrompt(slot, {
      fabricAnalysis,
      colorName,
      supplier,
      collection,
      materialMetadata,
      nccCode,
    })

    // Step 3a: gpt-image-1 via images.edit() — dùng ảnh texture thật làm tham chiếu
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
        slot,
        imageUrl: `data:image/png;base64,${b64}`,
        model: 'gpt-image-1',
        fabricAnalysis,
      })
    } catch (e1) {
      console.warn(`[generate-slot:${slot}] gpt-image-1 thất bại (${e1.message}) — fallback dall-e-3`)
    }

    // Step 3b: dall-e-3 fallback (không có ảnh tham chiếu nhưng prompt đã có mô tả chi tiết từ vision)
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
      quality: 'hd',
    })

    const b64 = response.data[0]?.b64_json
    if (!b64) throw new Error('dall-e-3 không trả về b64_json')

    return res.status(200).json({
      ok: true,
      slot,
      imageUrl: `data:image/png;base64,${b64}`,
      model: 'dall-e-3',
      fabricAnalysis,
    })
  } catch (error) {
    console.error(`[generate-slot]`, error?.message || error)
    return res.status(500).json({ ok: false, error: error?.message || 'Lỗi khi gọi OpenAI tạo ảnh.' })
  }
}
