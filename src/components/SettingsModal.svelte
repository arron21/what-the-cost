<script lang="ts">
  import type { IncomeFrequency, UserSettings } from '../types'
  import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../utils/exportImport'
  import { 
    X, 
    Download, 
    Upload, 
    Sparkles, 
    Trash2, 
    Check, 
    AlertCircle, 
    HardDrive
  } from '@lucide/svelte'

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
      statusMessage = { type: 'success', text: `Successfully restored ${res.count} items from JSON backup!` }
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
      statusMessage = { type: 'success', text: `Successfully imported ${res.count} items from CSV!` }
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
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    tabindex="0"
    role="button"
    aria-label="Close Settings backdrop"
  >
    <div
      class="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 relative text-slate-100"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>Settings & Data Management</span>
        </h3>
        <button
          type="button"
          onclick={onClose}
          class="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          aria-label="Close Settings modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if statusMessage}
        <div class="mt-3 p-3 rounded-xl text-xs flex items-center gap-2 {statusMessage.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'}">
          {#if statusMessage.type === 'success'}
            <Check class="w-4 h-4 shrink-0 text-emerald-400" />
          {:else}
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          {/if}
          <span>{statusMessage.text}</span>
        </div>
      {/if}

      <div class="space-y-5 pt-4">
        <!-- 1. Income Settings -->
        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider">Income Benchmark</h4>
              <p class="text-[11px] text-slate-400">Enables 50/30/20 rule and time-wage calculations</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={incomeEnabled} class="sr-only peer" />
              <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {#if incomeEnabled}
            <div class="space-y-3 pt-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="income-amount" class="block text-[11px] font-semibold text-slate-400 mb-1">
                    Take-Home Income
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency}</span>
                    <input
                      id="income-amount"
                      type="number"
                      bind:value={incomeAmount}
                      placeholder="4500"
                      class="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label for="income-freq" class="block text-[11px] font-semibold text-slate-400 mb-1">
                    Frequency
                  </label>
                  <select
                    id="income-freq"
                    bind:value={incomeFrequency}
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="hourly">Hourly Wage</option>
                  </select>
                </div>
              </div>

              {#if incomeFrequency === 'hourly' || incomeAmount}
                <div>
                  <label for="hours-week" class="block text-[11px] font-semibold text-slate-400 mb-1">
                    Work Hours / Week (to calculate hourly rate)
                  </label>
                  <input
                    id="hours-week"
                    type="number"
                    bind:value={hoursPerWeek}
                    placeholder="40"
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- 2. Currency Selector -->
        <div>
          <label for="settings-curr" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Currency Symbol
          </label>
          <select
            id="settings-curr"
            bind:value={currency}
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {#each currencies as c}
              <option value={c.symbol}>{c.name}</option>
            {/each}
          </select>
        </div>

        <!-- 3. Local-First & Privacy Badge -->
        <div class="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3 flex items-start gap-2.5">
          <HardDrive class="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div class="text-[11px] text-slate-300">
            <span class="font-bold text-white">100% Local-First & Private:</span> All your data stays strictly in your browser's IndexedDB. No external servers or cloud logins required.
          </div>
        </div>

        <!-- 4. Export & Import Actions -->
        <div>
          <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Data Backup & Restore
          </span>
          <div class="grid grid-cols-2 gap-2">
            <!-- JSON Export -->
            <button
              type="button"
              onclick={() => exportToJSON(settings)}
              class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Download class="w-3.5 h-3.5 text-blue-400" />
              <span>Backup JSON</span>
            </button>

            <!-- JSON Import -->
            <button
              type="button"
              onclick={() => jsonFileInput?.click()}
              class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Upload class="w-3.5 h-3.5 text-indigo-400" />
              <span>Restore JSON</span>
            </button>
            <input
              type="file"
              accept=".json"
              bind:this={jsonFileInput}
              onchange={handleJSONImport}
              class="hidden"
            />

            <!-- CSV Export -->
            <button
              type="button"
              onclick={exportToCSV}
              class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Download class="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <!-- CSV Import -->
            <button
              type="button"
              onclick={() => csvFileInput?.click()}
              class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <Upload class="w-3.5 h-3.5 text-amber-400" />
              <span>Import CSV</span>
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

        <!-- 5. Sample Data & Danger Zone -->
        <div class="pt-2 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <button
              type="button"
              onclick={() => {
                if (confirm('Load realistic sample budgeting data? This will populate sample needs and wants.')) {
                  onSeedData()
                  statusMessage = { type: 'success', text: 'Sample budgeting data loaded successfully!' }
                }
              }}
              class="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 py-1"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Load Realistic Demo Data</span>
            </button>

            <button
              type="button"
              onclick={() => {
                if (confirm('Are you sure you want to clear all items? Make sure to export a backup if needed.')) {
                  onClearData()
                  statusMessage = { type: 'success', text: 'All items cleared.' }
                }
              }}
              class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 py-1"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Clear All Items</span>
            </button>
          </div>
        </div>

        <!-- Footer action -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onclick={handleSave}
            class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
          >
            <Check class="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
