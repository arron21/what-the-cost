export type ItemType = 'need' | 'want'

export type Frequency = 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'yearly' 
  | 'once'

export type TimeHorizon = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type IncomeFrequency = 'hourly' | 'monthly' | 'yearly'

export interface Item {
  id: string
  name: string
  type: ItemType
  amount: number
  frequency: Frequency
  date?: string // YYYY-MM-DD
  category: string
  tags: string[]
  notes?: string
  isSimulatedCut?: boolean
  createdAt: number
  updatedAt: number
}

export interface IncomeSettings {
  enabled: boolean
  amount: number
  frequency: IncomeFrequency
  hoursPerWeek: number
}

export interface UserSettings {
  id: string
  currency: string
  income: IncomeSettings
  theme: 'dark' | 'light'
  timeHorizon: TimeHorizon
  whatIfActive: boolean
}

export interface CategoryInfo {
  id: string
  name: string
  icon: string
  color: string
}

export const PRESET_CATEGORIES: CategoryInfo[] = [
  { id: 'housing', name: 'Housing & Rent', icon: 'Home', color: 'blue' },
  { id: 'groceries', name: 'Food & Groceries', icon: 'ShoppingCart', color: 'emerald' },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'Zap', color: 'amber' },
  { id: 'transport', name: 'Transport & Auto', icon: 'Car', color: 'indigo' },
  { id: 'health', name: 'Health & Medical', icon: 'HeartPulse', color: 'rose' },
  { id: 'dining', name: 'Dining Out & Cafes', icon: 'Utensils', color: 'orange' },
  { id: 'subscriptions', name: 'Subscriptions & Streaming', icon: 'Tv', color: 'purple' },
  { id: 'entertainment', name: 'Fun & Entertainment', icon: 'Gamepad2', color: 'pink' },
  { id: 'shopping', name: 'Shopping & Gear', icon: 'ShoppingBag', color: 'cyan' },
  { id: 'personal', name: 'Personal Care', icon: 'Sparkles', color: 'teal' },
  { id: 'other', name: 'Miscellaneous', icon: 'Tag', color: 'slate' },
]

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  once: 'One-time',
}

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  daily: 'Per Day',
  weekly: 'Per Week',
  monthly: 'Per Month',
  yearly: 'Per Year',
}

export interface BudgetStats {
  needsTotal: number
  wantsTotal: number
  activeWantsTotal: number
  simulatedSavings: number
  cutWantsCount: number
  totalOutflow: number
  activeTotalOutflow: number
  income: number
  netSurplus: number
  activeNetSurplus: number
  needsPercentOfIncome: number
  wantsPercentOfIncome: number
  savingsPercentOfIncome: number
  needsPercentOfTotal: number
  wantsPercentOfTotal: number
}

