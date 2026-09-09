<script lang="ts">
  import { onMount } from 'svelte'
  import type { Item, TimeHorizon, UserSettings } from './types'
  import { 
    db, 
    loadSettings, 
    saveSettings, 
    getAllItems, 
    saveItem, 
    deleteItemById, 
    seedSampleData, 
    clearAllItems,
    DEFAULT_SETTINGS 
  } from './services/db'
  import { computeBudgetStats } from './utils/costNormalizer'

  import Header from './components/Header.svelte'
  import SummaryCards from './components/SummaryCards.svelte'
  import WhatIfSimulator from './components/WhatIfSimulator.svelte'
  import AnalyticsView from './components/AnalyticsView.svelte'
  import ItemList from './components/ItemList.svelte'
  import ItemModal from './components/ItemModal.svelte'
  import SettingsModal from './components/SettingsModal.svelte'
  import PWAPrompt from './components/PWAPrompt.svelte'
  import { Plus, Sparkles } from '@lucide/svelte'

  let settings = $state<UserSettings>(DEFAULT_SETTINGS)
  let items = $state<Item[]>([])
  let isLoaded = $state(false)

  let isItemModalOpen = $state(false)
  let editingItem = $state<Item | null>(null)
  let isSettingsModalOpen = $state(false)
  let activeCategoryFilter = $state<string>('')

  // Compute reactive budget analytics
  let stats = $derived(
    computeBudgetStats(
      items, 
      settings.income, 
      settings.timeHorizon, 
      settings.whatIfActive
    )
  )

  let hasIncome = $derived(settings.income.enabled && settings.income.amount > 0)

  onMount(async () => {
    await refreshData()
    // If DB is fresh/empty on first visit, seed sample data for immediate exploration
    if (items.length === 0) {
      await seedSampleData()
      await refreshData()
    }
    applyTheme(settings.theme)
    isLoaded = true
  })

  async function refreshData() {
    const loadedSettings = await loadSettings()
    settings = loadedSettings
    const loadedItems = await getAllItems()
    items = loadedItems
  }

  function applyTheme(theme: 'dark' | 'light') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function handleToggleTheme() {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark'
    settings = { ...settings, theme: nextTheme }
    applyTheme(nextTheme)
    await saveSettings(settings)
  }

  async function handleSelectHorizon(horizon: TimeHorizon) {
    settings = { ...settings, timeHorizon: horizon }
    await saveSettings(settings)
  }

  async function handleToggleWhatIf() {
    settings = { ...settings, whatIfActive: !settings.whatIfActive }
    await saveSettings(settings)
  }

  async function handleResetCuts() {
    const updated = items.map((i) => ({ ...i, isSimulatedCut: false }))
    await db.items.bulkPut(updated)
    items = updated
  }

  async function handleCutAllWants() {
    const updated = items.map((i) => (i.type === 'want' ? { ...i, isSimulatedCut: true } : i))
    await db.items.bulkPut(updated)
    items = updated
  }

  async function handleToggleCut(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const updatedItem = { ...item, isSimulatedCut: !item.isSimulatedCut }
    await saveItem(updatedItem)
    items = items.map((i) => (i.id === id ? updatedItem : i))
  }

  async function handleSaveItem(item: Item) {
    await saveItem(item)
    await refreshData()
  }

  async function handleDeleteItem(id: string) {
    await deleteItemById(id)
    items = items.filter((i) => i.id !== id)
  }

  function handleOpenAddModal() {
    editingItem = null
    isItemModalOpen = true
  }

  function handleEditItem(item: Item) {
    editingItem = item
    isItemModalOpen = true
  }

  async function handleSaveSettings(newSettings: UserSettings) {
    settings = newSettings
    applyTheme(newSettings.theme)
    await saveSettings(newSettings)
  }

  async function handleSeedData() {
    await seedSampleData()
    await refreshData()
  }

  async function handleClearData() {
    await clearAllItems()
    items = []
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
  <PWAPrompt />

  <Header
    timeHorizon={settings.timeHorizon}
    theme={settings.theme}
    whatIfActive={settings.whatIfActive}
    onSelectHorizon={handleSelectHorizon}
    onToggleTheme={handleToggleTheme}
    onOpenSettings={() => (isSettingsModalOpen = true)}
    onOpenAddModal={handleOpenAddModal}
    onToggleWhatIf={handleToggleWhatIf}
  />

  <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
    {#if !isLoaded}
      <div class="flex items-center justify-center py-24">
        <div class="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    {:else}
      <!-- Top Summary Cards & 50/30/20 Metric -->
      <SummaryCards
        {stats}
        horizon={settings.timeHorizon}
        currency={settings.currency}
        whatIfActive={settings.whatIfActive}
        {hasIncome}
      />

      <!-- What-If Simulator Banner (when active) -->
      <WhatIfSimulator
        whatIfActive={settings.whatIfActive}
        {stats}
        horizon={settings.timeHorizon}
        currency={settings.currency}
        onToggleWhatIf={handleToggleWhatIf}
        onResetCuts={handleResetCuts}
        onCutAllWants={handleCutAllWants}
      />

      <!-- Visual Analytics: Donut & Category Distribution -->
      <AnalyticsView
        {items}
        {stats}
        horizon={settings.timeHorizon}
        currency={settings.currency}
        whatIfActive={settings.whatIfActive}
        {hasIncome}
        onSelectCategoryFilter={(catId) => (activeCategoryFilter = catId)}
      />

      <!-- Main Items List & Filter Engine -->
      <ItemList
        {items}
        horizon={settings.timeHorizon}
        currency={settings.currency}
        whatIfActive={settings.whatIfActive}
        incomeSettings={settings.income}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onToggleCut={handleToggleCut}
        onOpenAddModal={handleOpenAddModal}
        {activeCategoryFilter}
      />
    {/if}
  </main>

  <!-- Mobile Floating Action Button (FAB) for Quick Add -->
  <button
    type="button"
    onclick={handleOpenAddModal}
    class="sm:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/40 active:scale-90 transition-transform"
    aria-label="Add Item"
  >
    <Plus class="w-7 h-7" />
  </button>

  <!-- Footer Info -->
  <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
    <div class="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-400">What The Cost</span>
        <span>•</span>
        <span>Needs vs. Wants Budgeting</span>
      </div>
      <div class="text-[11px] text-slate-400">
        100% Local-First PWA • IndexedDB Storage • Zero Cloud Logins
      </div>
    </div>
  </footer>

  <!-- Modals -->
  <ItemModal
    isOpen={isItemModalOpen}
    {editingItem}
    currency={settings.currency}
    onClose={() => { isItemModalOpen = false; editingItem = null; }}
    onSave={handleSaveItem}
  />

  <SettingsModal
    isOpen={isSettingsModalOpen}
    {settings}
    onClose={() => (isSettingsModalOpen = false)}
    onSaveSettings={handleSaveSettings}
    onSeedData={handleSeedData}
    onClearData={handleClearData}
    onDataChanged={refreshData}
  />
</div>
