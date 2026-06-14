const KEY = 'mrfabric_openai_budget'

// Chi phí thực tế đo được (không phải lý thuyết)
export const REAL_COST = {
  low:    0.011,
  medium: 0.042,
  high:   0.167,
  gpt4o_overhead: 0.007, // GPT-4o vision analysis, đo thực tế 14/06/2026
}

export function estimateCost(qualities) {
  const slotCost = Object.values(qualities).reduce(
    (sum, q) => sum + (REAL_COST[q] || 0), 0
  )
  return +(slotCost + REAL_COST.gpt4o_overhead).toFixed(4)
}

const DEFAULT_STATE = { balance: null, history: [] }

export function loadBudget() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { ...DEFAULT_STATE }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  return state
}

export function setBalance(newBalance) {
  const state = loadBudget()
  return save({ ...state, balance: +newBalance })
}

export function recordGeneration({ maNCC, maMrFabric, preset, qualities, colorCount = 1 }) {
  const state = loadBudget()
  const costPerSet = estimateCost(qualities)
  const totalCost  = +(costPerSet * colorCount).toFixed(4)
  const balanceBefore = state.balance
  const balanceAfter  = balanceBefore !== null ? +(balanceBefore - totalCost).toFixed(4) : null

  const entry = {
    id:            Date.now(),
    date:          new Date().toLocaleDateString('vi-VN'),
    time:          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    maNCC:         maNCC || '',
    maMrFabric:    maMrFabric || '',
    preset:        preset || 'custom',
    colorCount,
    costPerSet,
    totalCost,
    balanceBefore,
    balanceAfter,
  }

  const history = [entry, ...state.history].slice(0, 50) // giữ 50 records gần nhất
  return save({ balance: balanceAfter, history })
}

export function clearHistory() {
  const state = loadBudget()
  return save({ ...state, history: [] })
}
