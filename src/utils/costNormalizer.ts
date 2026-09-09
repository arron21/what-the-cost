import type { BudgetStats, Frequency, IncomeSettings, Item, TimeHorizon } from '../types'
export type { BudgetStats }

const DAYS_PER_YEAR = 365.25
const WEEKS_PER_YEAR = 52.143
const MONTHS_PER_YEAR = 12

/**
 * Calculates annual cost of an item based on its frequency.
 */
export function toAnnualCost(amount: number, frequency: Frequency): number {
  if (amount <= 0 || isNaN(amount)) return 0

  switch (frequency) {
    case 'daily':
      return amount * DAYS_PER_YEAR
    case 'weekly':
      return amount * WEEKS_PER_YEAR
    case 'biweekly':
      return amount * (WEEKS_PER_YEAR / 2)
    case 'monthly':
      return amount * MONTHS_PER_YEAR
    case 'quarterly':
      return amount * 4
    case 'yearly':
      return amount
    case 'once':
      // Amortized over 1 year
      return amount
    default:
      return amount
  }
}

/**
 * Normalizes an item's cost to the requested TimeHorizon.
 */
export function normalizeCost(amount: number, frequency: Frequency, horizon: TimeHorizon): number {
  const annual = toAnnualCost(amount, frequency)
  switch (horizon) {
    case 'daily':
      return annual / DAYS_PER_YEAR
    case 'weekly':
      return annual / WEEKS_PER_YEAR
    case 'monthly':
      return annual / MONTHS_PER_YEAR
    case 'yearly':
      return annual
  }
}

/**
 * Calculates user's annual income from settings.
 */
export function toAnnualIncome(income: IncomeSettings): number {
  if (!income.enabled || income.amount <= 0 || isNaN(income.amount)) return 0

  const hours = income.hoursPerWeek > 0 ? income.hoursPerWeek : 40

  switch (income.frequency) {
    case 'hourly':
      return income.amount * hours * WEEKS_PER_YEAR
    case 'monthly':
      return income.amount * MONTHS_PER_YEAR
    case 'yearly':
      return income.amount
  }
}

/**
 * Normalizes income to the requested TimeHorizon.
 */
export function normalizeIncome(income: IncomeSettings, horizon: TimeHorizon): number {
  const annual = toAnnualIncome(income)
  switch (horizon) {
    case 'daily':
      return annual / DAYS_PER_YEAR
    case 'weekly':
      return annual / WEEKS_PER_YEAR
    case 'monthly':
      return annual / MONTHS_PER_YEAR
    case 'yearly':
      return annual
  }
}

/**
 * Calculates effective hourly rate.
 */
export function getEffectiveHourlyRate(income: IncomeSettings): number {
  if (!income.enabled || income.amount <= 0) return 0
  const hours = income.hoursPerWeek > 0 ? income.hoursPerWeek : 40
  const annual = toAnnualIncome(income)
  const totalAnnualHours = hours * WEEKS_PER_YEAR
  return totalAnnualHours > 0 ? annual / totalAnnualHours : 0
}

/**
 * Converts a dollar amount into hours of work based on income.
 */
export function toHoursWorked(amount: number, income: IncomeSettings): { hours: number; minutes: number; formatted: string } | null {
  const hourlyRate = getEffectiveHourlyRate(income)
  if (hourlyRate <= 0) return null

  const totalDecimalHours = amount / hourlyRate
  const hours = Math.floor(totalDecimalHours)
  const minutes = Math.round((totalDecimalHours - hours) * 60)

  let formatted = ''
  if (hours > 0 && minutes > 0) {
    formatted = `${hours}h ${minutes}m`
  } else if (hours > 0) {
    formatted = `${hours}h`
  } else {
    formatted = `${minutes}m`
  }

  return { hours, minutes, formatted }
}

/**
 * Formats a currency number with appropriate decimal places.
 */
export function formatCurrency(amount: number, currency: string = '$', decimals?: number): string {
  if (isNaN(amount)) amount = 0
  const dec = decimals !== undefined ? decimals : (Math.abs(amount) < 10 && amount % 1 !== 0 ? 2 : 2)
  const formattedNumber = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
  const sign = amount < 0 ? '-' : ''
  return `${sign}${currency}${formattedNumber}`
}


export function computeBudgetStats(
  items: Item[],
  incomeSettings: IncomeSettings,
  horizon: TimeHorizon,
  isWhatIfActive: boolean
): BudgetStats {
  let needsTotal = 0
  let wantsTotal = 0
  let activeWantsTotal = 0
  let simulatedSavings = 0
  let cutWantsCount = 0

  for (const item of items) {
    const cost = normalizeCost(item.amount, item.frequency, horizon)
    if (item.type === 'need') {
      needsTotal += cost
    } else {
      wantsTotal += cost
      if (isWhatIfActive && item.isSimulatedCut) {
        simulatedSavings += cost
        cutWantsCount++
      } else {
        activeWantsTotal += cost
      }
    }
  }

  const totalOutflow = needsTotal + wantsTotal
  const activeTotalOutflow = needsTotal + (isWhatIfActive ? activeWantsTotal : wantsTotal)
  const normIncome = normalizeIncome(incomeSettings, horizon)

  const netSurplus = normIncome > 0 ? normIncome - totalOutflow : 0
  const activeNetSurplus = normIncome > 0 ? normIncome - activeTotalOutflow : 0

  const hasIncome = normIncome > 0

  const needsPercentOfIncome = hasIncome ? Math.min(100, Math.round((needsTotal / normIncome) * 100)) : 0
  const wantsPercentOfIncome = hasIncome 
    ? Math.min(100, Math.round(((isWhatIfActive ? activeWantsTotal : wantsTotal) / normIncome) * 100)) 
    : 0
  const savingsPercentOfIncome = hasIncome 
    ? Math.max(0, Math.round((activeNetSurplus / normIncome) * 100)) 
    : 0

  const sumCosts = totalOutflow > 0 ? totalOutflow : 1
  const needsPercentOfTotal = Math.round((needsTotal / sumCosts) * 100)
  const wantsPercentOfTotal = 100 - needsPercentOfTotal

  return {
    needsTotal,
    wantsTotal,
    activeWantsTotal,
    simulatedSavings,
    cutWantsCount,
    totalOutflow,
    activeTotalOutflow,
    income: normIncome,
    netSurplus,
    activeNetSurplus,
    needsPercentOfIncome,
    wantsPercentOfIncome,
    savingsPercentOfIncome,
    needsPercentOfTotal,
    wantsPercentOfTotal,
  }
}
