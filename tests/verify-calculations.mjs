import { 
  toAnnualCost, 
  normalizeCost, 
  toAnnualIncome, 
  normalizeIncome, 
  toHoursWorked, 
  computeBudgetStats,
  formatCurrency 
} from '../src/utils/costNormalizer.ts'

console.log('🧪 Starting Cost Normalizer & Budget Verification...\n')

// Test 1: Daily Espresso
const dailyEspresso = 5.50
const espressoAnnual = toAnnualCost(dailyEspresso, 'daily')
const espressoMonthly = normalizeCost(dailyEspresso, 'daily', 'monthly')
console.log(`☕ Daily $5.50 Coffee:`)
console.log(`   Annualized: $${espressoAnnual.toFixed(2)}`)
console.log(`   Normalized Monthly: $${espressoMonthly.toFixed(2)}`)
if (Math.round(espressoMonthly) !== 167) {
  throw new Error(`Unexpected monthly coffee: ${espressoMonthly}`)
}

// Test 2: Monthly Rent
const rent = 1650
const rentAnnual = toAnnualCost(rent, 'monthly')
const rentDaily = normalizeCost(rent, 'monthly', 'daily')
console.log(`\n🏠 Monthly $1650 Rent:`)
console.log(`   Annualized: $${rentAnnual.toFixed(2)}`)
console.log(`   Normalized Daily: $${rentDaily.toFixed(2)}`)
if (rentAnnual !== 19800) {
  throw new Error(`Unexpected rent annual: ${rentAnnual}`)
}

// Test 3: Income Normalization & Wage Conversion
const incomeSettings = {
  enabled: true,
  amount: 4500,
  frequency: 'monthly',
  hoursPerWeek: 40,
}
const annualIncome = toAnnualIncome(incomeSettings)
const monthlyIncome = normalizeIncome(incomeSettings, 'monthly')
const timeWorked = toHoursWorked(100, incomeSettings)

console.log(`\n💼 Income & Wage Math:`)
console.log(`   Annual Income: $${annualIncome}`)
console.log(`   Monthly Income: $${monthlyIncome}`)
console.log(`   $100 Purchase = ${timeWorked?.formatted} of work`)
if (!timeWorked || timeWorked.hours < 3 || timeWorked.hours > 4) {
  throw new Error(`Unexpected time worked for $100: ${JSON.stringify(timeWorked)}`)
}

// Test 4: Budget Stats & What-If Cut Simulation
const mockItems = [
  { id: '1', name: 'Rent', type: 'need', amount: 1650, frequency: 'monthly', category: 'housing', tags: [], createdAt: 1, updatedAt: 1 },
  { id: '2', name: 'Groceries', type: 'need', amount: 130, frequency: 'weekly', category: 'groceries', tags: [], createdAt: 1, updatedAt: 1 },
  { id: '3', name: 'Coffee', type: 'want', amount: 5.50, frequency: 'daily', category: 'dining', tags: [], isSimulatedCut: true, createdAt: 1, updatedAt: 1 },
  { id: '4', name: 'Gym', type: 'want', amount: 85, frequency: 'monthly', category: 'health', tags: [], isSimulatedCut: false, createdAt: 1, updatedAt: 1 },
]

// Baseline without What-If
const baseStats = computeBudgetStats(mockItems, incomeSettings, 'monthly', false)
console.log(`\n📊 Baseline Stats (Monthly):`)
console.log(`   Total Outflow: $${baseStats.totalOutflow.toFixed(2)}`)
console.log(`   Needs: $${baseStats.needsTotal.toFixed(2)} (${baseStats.needsPercentOfIncome}% of income)`)
console.log(`   Wants: $${baseStats.wantsTotal.toFixed(2)} (${baseStats.wantsPercentOfIncome}% of income)`)
console.log(`   Surplus: $${baseStats.netSurplus.toFixed(2)} (${baseStats.savingsPercentOfIncome}% saved)`)

// With What-If Active
const whatIfStats = computeBudgetStats(mockItems, incomeSettings, 'monthly', true)
console.log(`\n✂️ What-If Cut Simulator Active (Coffee cut):`)
console.log(`   Simulated Savings: $${whatIfStats.simulatedSavings.toFixed(2)}/mo`)
console.log(`   Active Wants Total: $${whatIfStats.activeWantsTotal.toFixed(2)}/mo`)
console.log(`   Active Surplus: $${whatIfStats.activeNetSurplus.toFixed(2)}/mo`)
console.log(`   New Savings %: ${whatIfStats.savingsPercentOfIncome}%`)

if (whatIfStats.simulatedSavings <= 0) {
  throw new Error('What-if simulated savings should be greater than 0!')
}
if (whatIfStats.activeTotalOutflow >= baseStats.totalOutflow) {
  throw new Error('Active total outflow with cuts should be lower than baseline!')
}

console.log('\n✅ All cost normalization and budgeting tests PASSED!')
