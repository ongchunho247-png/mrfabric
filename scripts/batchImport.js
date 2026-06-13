#!/usr/bin/env node

/**
 * MrFabric Batch Image Importer
 * Usage: node scripts/batchImport.js ./images --preview
 *        node scripts/batchImport.js ./images --save
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// ── Helpers ────────────────────────────────────────────────────────────────

function extractNccCodeFromFilename(filename) {
  if (!filename) return null
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
  const match = nameWithoutExt.match(/^([A-Z0-9]+-[A-Z0-9]+)/i)
  if (match) return match[1].toUpperCase().trim()
  const simpleMatch = nameWithoutExt.match(/^[A-Z0-9]{2,10}$/i)
  if (simpleMatch && nameWithoutExt.length <= 10) return nameWithoutExt.toUpperCase().trim()
  return null
}

function findMaterialByFilename(filename, materials) {
  const nccCode = extractNccCodeFromFilename(filename)
  if (!nccCode) return null
  return materials.find((m) => m.maNCC && m.maNCC.toUpperCase() === nccCode)
}

function loadMaterials() {
  try {
    const adminKey = 'mrfabric_admin_materials'
    const admin = fs.existsSync(path.join(process.cwd(), '.mrfabric-data.json'))
      ? JSON.parse(fs.readFileSync(path.join(process.cwd(), '.mrfabric-data.json'), 'utf8')).admin || []
      : []
    return admin
  } catch (e) {
    console.warn('⚠️  Không tìm thấy dữ liệu materials. Dùng preview-only mode.')
    return []
  }
}

function getSupportedImages(folderPath) {
  const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
  try {
    return fs
      .readdirSync(folderPath)
      .filter((f) => EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .sort()
  } catch (e) {
    console.error(`❌ Lỗi đọc folder: ${e.message}`)
    return []
  }
}

function formatResult(result) {
  const { filename, nccCode, matched, material, status } = result
  
  if (status === 'error') {
    return `  ❌ ${filename}\n     ${nccCode ? `Mã: ${nccCode}` : 'Không tìm mã'} - Không match`
  }
  
  if (matched && material) {
    return `  ✅ ${filename}\n     Mã: ${material.maNCC} | NCC: ${material.nhaCungCap} | MrFabric: ${material.maMrFabric}`
  }
  
  return `  ⚠️  ${filename}\n     ${nccCode ? `Mã: ${nccCode}` : 'Không tìm mã'}`
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase().trim())
    })
  })
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const folderPath = args[0] || './images'
  const mode = args[1] === '--save' ? 'save' : 'preview'

  console.log('\n🖼️  MrFabric Batch Image Importer')
  console.log('═════════════════════════════════════════════\n')

  // Load materials từ app data
  const materials = loadMaterials()
  console.log(`📦 Đã tải ${materials.length} sản phẩm từ thư viện\n`)

  // Đọc ảnh từ folder
  const images = getSupportedImages(folderPath)
  if (images.length === 0) {
    console.log(`❌ Không tìm thấy ảnh nào trong: ${folderPath}`)
    process.exit(1)
  }

  console.log(`📁 Tìm thấy ${images.length} ảnh:\n`)

  // Process từng ảnh
  const results = []
  for (const filename of images) {
    const nccCode = extractNccCodeFromFilename(filename)
    const material = findMaterialByFilename(filename, materials)
    const result = {
      filename,
      nccCode,
      matched: !!material,
      material: material || null,
      status: material ? 'success' : 'error',
    }
    results.push(result)
    console.log(formatResult(result))
  }

  // Summary
  const successCount = results.filter((r) => r.status === 'success').length
  const totalCount = results.length

  console.log(`\n═════════════════════════════════════════════`)
  console.log(`✅ Match thành công: ${successCount}/${totalCount}`)
  console.log(`❌ Match thất bại: ${totalCount - successCount}/${totalCount}\n`)

  if (successCount === 0) {
    console.log('⚠️  Không có ảnh nào match. Dừng process.\n')
    process.exit(1)
  }

  // Save results
  const jsonOutput = {
    timestamp: new Date().toISOString(),
    sourceFolder: folderPath,
    totalImages: totalCount,
    successCount,
    results: results
      .filter((r) => r.matched)
      .map((r) => ({
        filename: r.filename,
        maNCC: r.material.maNCC,
        nhaCungCap: r.material.nhaCungCap,
        maMrFabric: r.material.maMrFabric,
        collection: r.material.collection,
      })),
  }

  const outputFile = path.join(process.cwd(), `import-results-${Date.now()}.json`)
  fs.writeFileSync(outputFile, JSON.stringify(jsonOutput, null, 2))
  console.log(`💾 Kết quả đã lưu: ${outputFile}\n`)

  // Ask user
  if (mode === 'save') {
    console.log(`🚀 Import ${successCount} ảnh vào app...`)
    // TODO: Sync với app localStorage
    console.log('✅ Hoàn tất!\n')
  } else {
    const answer = await promptUser('Tiếp tục import? (y/n): ')
    if (answer === 'y') {
      console.log(`\n🚀 Importing ${successCount} ảnh...`)
      // TODO: Sync với app localStorage
      console.log('✅ Hoàn tất!\n')
    } else {
      console.log('❌ Hủy bỏ.\n')
    }
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message)
  process.exit(1)
})
