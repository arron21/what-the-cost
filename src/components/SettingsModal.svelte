<script lang="ts">
  import type { IncomeFrequency, UserSettings } from '../types'
  import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../utils/exportImport'

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
      statusMessage = { type: 'success', text: `Restored ${res.count} allocations from JSON backup.` }
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
      statusMessage = { type: 'success', text: `Imported ${res.count} allocations from CSV ledger.` }
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
      <div class="flex justify-between items-baseline pb-3 border-bottom mb-4">
        <div>
          <span class="raster-index">[ CONFIG ]</span>
          <h3 class="raster-h3 inline ml-2">SYSTEM PARAMETERS & LEDGER</h3>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          aria-label="Close Settings modal"
        >
          ✕
        </button>
      </div>

      {#if statusMessage}
        <div class="raster-callout {statusMessage.type === 'success' ? '' : 'raster-callout-accent'} mb-4">
          <span class="raster-label">{statusMessage.type === 'success' ? 'STATUS: SUCCESS' : 'STATUS: ERROR'}</span>
          <span class="raster-small">{statusMessage.text}</span>
        </div>
      {/if}

      <div class="space-y-5">
        <!-- 1. Income Benchmark -->
        <div class="raster-card raster-card-subtle p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="raster-label">// INCOME BENCHMARK</span>
              <div class="font-bold text-sm text-primary">Baseline Capital Inflow</div>
            </div>
            <button
              type="button"
              onclick={() => (incomeEnabled = !incomeEnabled)}
              class="raster-btn {incomeEnabled ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
            >
              <span>{incomeEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </button>
          </div>

          {#if incomeEnabled}
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="raster-field">
                <label for="income-amount" class="raster-field-label">TAKE-HOME AMOUNT ({currency})</label>
                <div class="relative flex items-center">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 raster-mono font-bold text-muted pointer-events-none select-none text-sm">
                    {currency}
                  </span>
                  <input
                    id="income-amount"
                    type="number"
                    bind:value={incomeAmount}
                    placeholder="4500"
                    class="raster-input raster-input-with-prefix font-bold"
                    style="padding-left: 2.25rem !important; padding-top: 10px; padding-bottom: 10px; padding-right: 14px;"
                  />
                </div>
              </div>

              <div class="raster-field">
                <label for="income-freq" class="raster-field-label">INFLOW FREQUENCY</label>
                <select
                  id="income-freq"
                  bind:value={incomeFrequency}
                  class="raster-select"
                  style="padding: 10px 14px;"
                >
                  <option value="monthly">MONTHLY</option>
                  <option value="yearly">YEARLY</option>
                  <option value="hourly">HOURLY WAGE</option>
                </select>
              </div>

              <div class="col-span-2 raster-field">
                <label for="hours-week" class="raster-field-label">WORK HOURS / WEEK (HOURLY NORMALIZER)</label>
                <input
                  id="hours-week"
                  type="number"
                  bind:value={hoursPerWeek}
                  placeholder="40"
                  class="raster-input raster-mono text-xs"
                  style="padding: 10px 14px;"
                />
              </div>
            </div>
          {/if}
        </div>

        <!-- 2. Currency Specification -->
        <div class="raster-field">
          <label for="settings-curr" class="raster-field-label">CURRENCY SYMBOL</label>
          <select
            id="settings-curr"
            bind:value={currency}
            class="raster-select"
          >
            {#each currencies as c}
              <option value={c.symbol}>{c.name}</option>
            {/each}
          </select>
        </div>

        <!-- 3. Local-First Notice -->
        <div class="raster-callout">
          <span class="raster-label">// STORAGE PROTOCOL</span>
          <span class="raster-small text-secondary">
            <strong>100% Local-First:</strong> All records are written exclusively to browser IndexedDB. Zero cloud telemetry.
          </span>
        </div>

        <!-- 4. Data Backup & Restore -->
        <div>
          <span class="raster-field-label mb-2 block">DATA MIGRATION // BACKUP & RESTORE</span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => exportToJSON(settings)}
              class="raster-btn raster-btn-outline raster-btn-sm"
            >
              <span>BACKUP JSON</span>
            </button>

            <button
              type="button"
              onclick={() => jsonFileInput?.click()}
              class="raster-btn raster-btn-outline raster-btn-sm"
            >
              <span>RESTORE JSON</span>
            </button>
            <input
              type="file"
              accept=".json"
              bind:this={jsonFileInput}
              onchange={handleJSONImport}
              class="hidden"
            />

            <button
              type="button"
              onclick={exportToCSV}
              class="raster-btn raster-btn-outline raster-btn-sm"
            >
              <span>EXPORT CSV</span>
            </button>

            <button
              type="button"
              onclick={() => csvFileInput?.click()}
              class="raster-btn raster-btn-outline raster-btn-sm"
            >
              <span>IMPORT CSV</span>
            </button>
            <input
              type="file"
              accept=".csv"
              bind:this={csvFileInput}
              onchange={handleCSVImport}
              class="hidden"
            />
          </div>
        </div>

        <!-- 5. Sample Data & Reset -->
        <div class="pt-3 border-top flex justify-between items-center">
          <button
            type="button"
            onclick={() => {
              if (confirm('Load standard reference allocation data?')) {
                onSeedData()
                statusMessage = { type: 'success', text: 'Reference allocations loaded.' }
              }
            }}
            class="raster-btn raster-btn-ghost raster-btn-sm"
          >
            <span>LOAD REFERENCE DATA</span>
          </button>

          <button
            type="button"
            onclick={() => {
              if (confirm('Permanently clear all ledger allocations? Ensure you have exported a backup.')) {
                onClearData()
                statusMessage = { type: 'success', text: 'Ledger cleared.' }
              }
            }}
            class="raster-btn raster-btn-ghost raster-btn-sm"
            style="color: var(--raster-accent);"
          >
            <span>PURGE LEDGER</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-4 border-top">
          <button
            type="button"
            onclick={handleSave}
            class="raster-btn raster-btn-primary raster-btn-sm"
          >
            <span>CONFIRM & APPLY</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
