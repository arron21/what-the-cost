import Dexie, { type Table } from 'dexie'
import type { Item, UserSettings } from '../types'

export class WhatTheCostDatabase extends Dexie {
  items!: Table<Item, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super('whatTheCostDB')
    this.version(1).stores({
      items: 'id, name, type, amount, frequency, category, createdAt',
      settings: 'id'
    })
  }
}

export const db = new WhatTheCostDatabase()

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current_user_settings',
  currency: '$',
  income: {
    enabled: true,
    amount: 4500,
    frequency: 'monthly',
    hoursPerWeek: 40,
  },
  theme: 'dark',
  timeHorizon: 'monthly',
  whatIfActive: false,
}

export const SAMPLE_ITEMS: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Needs
  {
    name: 'Apartment Rent',
    type: 'need',
    amount: 1650,
    frequency: 'monthly',
    category: 'housing',
    tags: ['fixed', 'home'],
    notes: 'Due on the 1st of every month',
  },
  {
    name: 'Weekly Groceries & Essentials',
    type: 'need',
    amount: 130,
    frequency: 'weekly',
    category: 'groceries',
    tags: ['food', 'supermarket'],
  },
  {
    name: 'Electricity & Water',
    type: 'need',
    amount: 115,
    frequency: 'monthly',
    category: 'utilities',
    tags: ['bills'],
  },
  {
    name: 'High-Speed Home Fiber Internet',
    type: 'need',
    amount: 65,
    frequency: 'monthly',
    category: 'utilities',
    tags: ['bills', 'remote-work'],
  },
  {
    name: 'Health & Dental Insurance',
    type: 'need',
    amount: 210,
    frequency: 'monthly',
    category: 'health',
    tags: ['medical'],
  },
  {
    name: 'Gasoline & Transit Pass',
    type: 'need',
    amount: 40,
    frequency: 'weekly',
    category: 'transport',
    tags: ['commute'],
  },

  // Wants
  {
    name: 'Artisan Morning Espresso',
    type: 'want',
    amount: 5.50,
    frequency: 'daily',
    category: 'dining',
    tags: ['coffee', 'habit'],
    notes: 'Weekday cafe stop on the way to office',
  },
  {
    name: 'Weekend Dining & Cocktails',
    type: 'want',
    amount: 75,
    frequency: 'weekly',
    category: 'dining',
    tags: ['social', 'food'],
  },
  {
    name: 'Streaming Bundle (Netflix & Spotify)',
    type: 'want',
    amount: 32,
    frequency: 'monthly',
    category: 'subscriptions',
    tags: ['media'],
  },
  {
    name: 'Boutique Gym Membership',
    type: 'want',
    amount: 85,
    frequency: 'monthly',
    category: 'health',
    tags: ['fitness'],
  },
  {
    name: 'Noise Cancelling Headphones',
    type: 'want',
    amount: 240,
    frequency: 'once',
    date: new Date().toISOString().slice(0, 10),
    category: 'shopping',
    tags: ['gadgets', 'tech'],
    notes: 'Bought for focused work',
  },
  {
    name: 'Gaming Pass & Online Cloud',
    type: 'want',
    amount: 16.99,
    frequency: 'monthly',
    category: 'entertainment',
    tags: ['games'],
  },
]

export async function loadSettings(): Promise<UserSettings> {
  const existing = await db.settings.get(DEFAULT_SETTINGS.id)
  if (existing) {
    return { ...DEFAULT_SETTINGS, ...existing }
  }
  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put(settings)
}

export async function getAllItems(): Promise<Item[]> {
  return await db.items.orderBy('createdAt').reverse().toArray()
}

export async function saveItem(item: Item): Promise<void> {
  await db.items.put(item)
}

export async function deleteItemById(id: string): Promise<void> {
  await db.items.delete(id)
}

export async function seedSampleData(): Promise<void> {
  const now = Date.now()
  const items: Item[] = SAMPLE_ITEMS.map((item, index) => ({
    ...item,
    id: `sample_${now}_${index}`,
    createdAt: now - index * 1000 * 60,
    updatedAt: now - index * 1000 * 60,
    isSimulatedCut: false,
  }))

  await db.items.clear()
  await db.items.bulkAdd(items)
  await db.settings.put({
    ...DEFAULT_SETTINGS,
    whatIfActive: false,
  })
}

export async function clearAllItems(): Promise<void> {
  await db.items.clear()
}
