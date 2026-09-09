import type { Frequency, Item, ItemType, UserSettings } from '../types'
import { db } from '../services/db'

export interface BackupData {
  version: number
  exportedAt: string
  settings: UserSettings
  items: Item[]
}

/**
 * Trigger browser file download from a string payload.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export full application state as JSON.
 */
export async function exportToJSON(settings: UserSettings): Promise<void> {
  const items = await db.items.toArray()
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    items,
  }

  const jsonString = JSON.stringify(backup, null, 2)
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadFile(jsonString, `what-the-cost-backup-${dateStr}.json`, 'application/json')
}

/**
 * Export items as CSV file for Excel / Google Sheets.
 */
export async function exportToCSV(): Promise<void> {
  const items = await db.items.toArray()
  const headers = ['ID', 'Name', 'Type', 'Amount', 'Frequency', 'Category', 'Tags', 'Date', 'Notes']
  
  const rows = items.map((item) => {
    const cleanNotes = (item.notes || '').replace(/"/g, '""')
    const cleanTags = (item.tags || []).join(';')
    return [
      `"${item.id}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      item.amount,
      `"${item.frequency}"`,
      `"${item.category}"`,
      `"${cleanTags}"`,
      `"${item.date || ''}"`,
      `"${cleanNotes}"`,
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\r\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadFile(csvContent, `what-the-cost-items-${dateStr}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Import and validate JSON backup.
 */
export async function importFromJSON(file: File): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)

    if (!parsed || !Array.isArray(parsed.items)) {
      return { success: false, count: 0, error: 'Invalid backup file format: missing items array.' }
    }

    const validItems: Item[] = []
    const now = Date.now()

    for (const item of parsed.items) {
      if (typeof item.name === 'string' && typeof item.amount === 'number') {
        validItems.push({
          id: item.id || `item_${now}_${Math.random().toString(36).substring(2, 8)}`,
          name: item.name,
          type: item.type === 'need' ? 'need' : 'want',
          amount: Math.max(0, item.amount),
          frequency: item.frequency || 'monthly',
          category: item.category || 'other',
          tags: Array.isArray(item.tags) ? item.tags : [],
          notes: item.notes || '',
          date: item.date || undefined,
          isSimulatedCut: false,
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now,
        })
      }
    }

    if (validItems.length > 0) {
      await db.items.clear()
      await db.items.bulkPut(validItems)
    }

    if (parsed.settings && typeof parsed.settings === 'object') {
      await db.settings.put(parsed.settings)
    }

    return { success: true, count: validItems.length }
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Failed to parse JSON file' }
  }
}

/**
 * Import items from CSV.
 */
export async function importFromCSV(file: File): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      return { success: false, count: 0, error: 'CSV file is empty or missing data rows.' }
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())
    const nameIdx = headers.indexOf('name')
    const typeIdx = headers.indexOf('type')
    const amountIdx = headers.indexOf('amount')
    const freqIdx = headers.indexOf('frequency')
    const catIdx = headers.indexOf('category')
    const tagsIdx = headers.indexOf('tags')
    const notesIdx = headers.indexOf('notes')
    const dateIdx = headers.indexOf('date')

    if (nameIdx === -1 || amountIdx === -1) {
      return { success: false, count: 0, error: 'CSV must contain at least "Name" and "Amount" columns.' }
    }

    const newItems: Item[] = []
    const now = Date.now()

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      if (!cols[nameIdx]) continue

      const rawAmount = parseFloat(cols[amountIdx].replace(/[^0-9.-]+/g, ''))
      if (isNaN(rawAmount)) continue

      const rawType = typeIdx !== -1 ? cols[typeIdx]?.toLowerCase().trim() : 'need'
      const type: ItemType = rawType === 'want' ? 'want' : 'need'

      const rawFreq = freqIdx !== -1 ? (cols[freqIdx]?.toLowerCase().trim() as Frequency) : 'monthly'
      const frequency: Frequency = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'once'].includes(rawFreq)
        ? rawFreq
        : 'monthly'

      const tags = tagsIdx !== -1 && cols[tagsIdx] ? cols[tagsIdx].split(';').map((t) => t.trim()).filter(Boolean) : []

      newItems.push({
        id: `csv_${now}_${i}`,
        name: cols[nameIdx].trim(),
        type,
        amount: Math.max(0, rawAmount),
        frequency,
        category: catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim() : 'other',
        tags,
        notes: notesIdx !== -1 ? cols[notesIdx]?.trim() : '',
        date: dateIdx !== -1 ? cols[dateIdx]?.trim() : undefined,
        isSimulatedCut: false,
        createdAt: now - i * 100,
        updatedAt: now,
      })
    }

    if (newItems.length > 0) {
      await db.items.bulkPut(newItems)
    }

    return { success: true, count: newItems.length }
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Failed to parse CSV file' }
  }
}

/**
 * Basic CSV line parser accounting for quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}
