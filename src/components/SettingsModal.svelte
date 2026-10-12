<script lang="ts">
  import type { IncomeFrequency, UserSettings } from '../types'
  import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../utils/exportImport'
  import { X, Download, Upload, RefreshCw, Trash2, CheckCircle, AlertCircle } from '@lucide/svelte'

  interface Props {
    isOpen: boolean
    settings: UserSettings
    onClose: () => void
    onSaveSettings: (settings: UserSettings) => void
    onSeedData: () => void
    onClearData: () => void
    onDataChanged: () => void
  }

  let {
    isOpen,
    settings,
    onClose,
    onSaveSettings,
    onSeedData,
    onClearData,
    onDataChanged,
  }: Props = $props()

  let currency = $state('$')
  let incomeEnabled = $state(true)
  let incomeAmount = $state<number | ''>(4500)
  let incomeFrequency = $state<IncomeFrequency>('monthly')
  let hoursPerWeek = $state(40)
  let statusMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null)

  let jsonFileInput = $state<HTMLInputElement>()
  let csvFileInput = $state<HTMLInputElement>()

  $effect(() => {
    if (settings) {
      currency = settings.currency || '$'
      incomeEnabled = settings.income?.enabled ?? true
      incomeAmount = settings.income?.amount || ''
      incomeFrequency = settings.income?.frequency || 'monthly'
      hoursPerWeek = settings.income?.hoursPerWeek || 40
    }
  })

  function handleSave() {
    const updated: UserSettings = {
      ...settings,
      currency,
      income: {
        enabled: incomeEnabled,
        amount: incomeAmount === '' ? 0 : Number(incomeAmount),
        frequency: incomeFrequency,
        hoursPerWeek: Number(hoursPerWeek) || 40,
      }
    }
    onSaveSettings(updated)
    onClose()
  }

  async function handleJSONImport(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    const file = input.files[0]
    const res = await importFromJSON(file)
    if (res.success) {
      statusMessage = { type: 'success', text: `Restored ${res.count} items from JSON backup.` }
      onDataChanged()
    } else {
      statusMessage = { type: 'error', text: res.error || 'Failed to import JSON' }
    }
    input.value = ''
  }

  async function handleCSVImport(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    const file = input.files[0]
    const res = await importFromCSV(file)
    if (res.success) {
      statusMessage = { type: 'success', text: `Imported ${res.count} items from CSV.` }
      onDataChanged()
    } else {
      statusMessage = { type: 'error', text: res.error || 'Failed to import CSV' }
    }
    input.value = ''
  }

  const currencies = [
    { symbol: '$', name: 'USD / CAD / AUD ($)' },
    { symbol: '€', name: 'Euro (€)' },
    { symbol: '£', name: 'British Pound (£)' },
    { symbol: '¥', name: 'Japanese Yen (¥)' },
    { symbol: '₹', name: 'Indian Rupee (₹)' },
    { symbol: 'CHF', name: 'Swiss Franc (CHF)' },
    { symbol: 'kr', name: 'Nordic Krone (kr)' },
  ]
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="raster-modal-backdrop"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    tabindex="0"
    role="button"
    aria-label="Close Settings backdrop"
  >
    <div
      class="raster-modal-dialog"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex justify-between items-center pb-3 border-bottom mb-4">
        <h3 class="text-base font-bold text-primary">Settings</h3>
        <button
          type="button"
          onclick={onClose}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          aria-label="Close Settings modal"
        >
          <X class="w-4 h-4 text-muted hover:text-primary" />
        </button>
      </div>

      {#if statusMessage}
        <div class="p-3 mb-4 border border-border flex items-center gap-2 text-xs {statusMessage.type === 'success' ? 'bg-surface-subtle text-primary' : 'text-accent border-accent'}">
          {#if statusMessage.type === 'success'}
            <CheckCircle class="w-4 h-4 text-emerald-600 shrink-0" />
          {:else}
            <AlertCircle class="w-4 h-4 text-accent shrink-0" />
          {/if}
          <span>{statusMessage.text}</span>
        </div>
      {/if}

      <div class="space-y-5">
        <!-- 1. Income Benchmark -->
        <div class="p-4 border border-border space-y-3" style="background-color: var(--raster-surface);">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold text-sm text-primary">Income Benchmark</div>
              <p class="text-xs text-muted">Used for 50/30/20 ratios and work-hour calculations</p>
            </div>
            <button
              type="button"
              onclick={() => (incomeEnabled = !incomeEnabled)}
              class="raster-btn {incomeEnabled ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm text-xs"
            >
              <span>{incomeEnabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {#if incomeEnabled}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div class="space-y-1">
                <label for="income-amount" class="block text-xs font-semibold text-secondary">
                  Take-Home Income ({currency})
                </label>
                <div class="relative flex items-center">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted pointer-events-none text-xs">
                    {currency}
                  </span>
                  <input
                    id="income-amount"
                    type="number"
                    bind:value={incomeAmount}
                    placeholder="4500"
                    class="raster-input w-full font-bold text-sm"
                    style="padding-left: 2rem !important; min-height: 40px;"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label for="income-freq" class="block text-xs font-semibold text-secondary">Income Frequency</label>
                <select
                  id="income-freq"
                  bind:value={incomeFrequency}
                  class="raster-select w-full text-xs"
                  style="min-height: 40px;"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="hourly">Hourly Wage</option>
                </select>
              </div>

              <div class="col-span-1 sm:col-span-2 space-y-1">
                <label for="hours-week" class="block text-xs font-semibold text-secondary">
                  Weekly Work Hours (for Hourly Normalizer)
                </label>
                <input
                  id="hours-week"
                  type="number"
                  bind:value={hoursPerWeek}
                  placeholder="40"
                  class="raster-input w-full text-xs"
                  style="min-height: 40px;"
                />
              </div>
            </div>
          {/if}
        </div>

        <!-- 2. Currency Selection -->
        <div class="space-y-1.5">
          <label for="curr-select" class="block text-xs font-semibold text-secondary">Base Currency</label>
          <select
            id="curr-select"
            bind:value={currency}
            class="raster-select w-full text-xs"
            style="min-height: 40px;"
          >
            {#each currencies as c}
              <option value={c.symbol}>{c.name}</option>
            {/each}
          </select>
        </div>

        <!-- 3. Data Management & Backup -->
        <div class="p-4 border border-border space-y-3" style="background-color: var(--raster-surface);">
          <div>
            <div class="font-bold text-sm text-primary">Data & Backup</div>
            <p class="text-xs text-muted">Your data is stored locally in your browser (IndexedDB).</p>
          </div>

          <!-- Hidden File Inputs -->
          <input
            type="file"
            accept=".json"
            bind:this={jsonFileInput}
            onchange={handleJSONImport}
            class="hidden"
          />
          <input
            type="file"
            accept=".csv"
            bind:this={csvFileInput}
            onchange={handleCSVImport}
            class="hidden"
          />

          <!-- Export/Import Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => exportToJSON(settings)}
              class="raster-btn raster-btn-outline raster-btn-sm"
              title="Download full JSON backup"
            >
              <Download class="w-3.5 h-3.5 mr-1" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onclick={() => jsonFileInput?.click()}
              class="raster-btn raster-btn-outline raster-btn-sm"
              title="Restore from JSON backup"
            >
              <Upload class="w-3.5 h-3.5 mr-1" />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onclick={() => exportToCSV()}
              class="raster-btn raster-btn-outline raster-btn-sm"
              title="Export as CSV spreadsheet"
            >
              <Download class="w-3.5 h-3.5 mr-1" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onclick={() => csvFileInput?.click()}
              class="raster-btn raster-btn-outline raster-btn-sm"
              title="Import items from CSV"
            >
              <Upload class="w-3.5 h-3.5 mr-1" />
              <span>Import CSV</span>
            </button>
          </div>

          <!-- Sample Data & Reset -->
          <div class="pt-3 border-top flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <button
              type="button"
              onclick={async () => {
                if (confirm('Load sample budget items? Existing data will be preserved.')) {
                  await onSeedData()
                  statusMessage = { type: 'success', text: 'Sample budget items loaded successfully.' }
                }
              }}
              class="raster-btn raster-btn-ghost raster-btn-sm"
            >
              <RefreshCw class="w-3.5 h-3.5 mr-1" />
              <span>Load Sample Data</span>
            </button>

            <button
              type="button"
              onclick={async () => {
                if (confirm('Are you sure you want to clear all expenses? This cannot be undone.')) {
                  await onClearData()
                  statusMessage = { type: 'success', text: 'All expense data cleared.' }
                }
              }}
              class="raster-btn raster-btn-ghost raster-btn-sm text-accent hover:text-red-700"
            >
              <Trash2 class="w-3.5 h-3.5 mr-1" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2 pt-3 border-top">
          <button
            type="button"
            onclick={onClose}
            class="raster-btn raster-btn-ghost raster-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={handleSave}
            class="raster-btn raster-btn-primary"
            style="min-width: 120px;"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
