<script lang="ts">
  import { onMount } from 'svelte'
  import { Plus } from '@lucide/svelte'
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
    document.documentElement.setAttribute('data-theme', theme)
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

<div class="min-h-screen flex flex-col font-sans transition-colors duration-150" style="background-color: var(--raster-canvas); color: var(--raster-fg-primary);">
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

  <main class="flex-1 raster-container py-5 sm:py-8">
    {#if !isLoaded}
      <div class="flex items-center justify-center py-28 text-muted text-sm">
        Loading...
      </div>
    {:else}
      <!-- 01. Metric Summary Cards & 50/30/20 Metric -->
      <section class="raster-section">
        <SummaryCards
          {stats}
          horizon={settings.timeHorizon}
          currency={settings.currency}
          whatIfActive={settings.whatIfActive}
          {hasIncome}
        />
      </section>

      <!-- What-If Simulator Banner (When active) -->
      {#if settings.whatIfActive}
        <section class="raster-section">
          <WhatIfSimulator
            whatIfActive={settings.whatIfActive}
            {stats}
            horizon={settings.timeHorizon}
            currency={settings.currency}
            onToggleWhatIf={handleToggleWhatIf}
            onResetCuts={handleResetCuts}
            onCutAllWants={handleCutAllWants}
          />
        </section>
      {/if}

      <!-- 02. Category Allocation & Savings Rate -->
      <section class="raster-section">
        <AnalyticsView
          {items}
          {stats}
          horizon={settings.timeHorizon}
          currency={settings.currency}
          whatIfActive={settings.whatIfActive}
          {hasIncome}
          onSelectCategoryFilter={(catId) => (activeCategoryFilter = catId)}
        />
      </section>

      <!-- 03. Financial Ledger -->
      <section class="raster-section">
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
      </section>
    {/if}
  </main>

  <!-- Mobile Floating Action Button (Clean minimal FAB, hidden on screens >= 640px) -->
  <button
    type="button"
    onclick={handleOpenAddModal}
    class="mobile-fab-btn fixed bottom-5 right-5 z-40 raster-btn raster-btn-primary shadow-lg"
    style="padding: 12px 18px; font-weight: 600; font-size: 13px;"
    aria-label="Add Expense"
  >
    <Plus class="w-4 h-4 mr-1.5" />
    <span>Add</span>
  </button>

  <!-- Minimalist Footer -->
  <footer class="border-top py-5 mt-10" style="background-color: var(--raster-surface);">
    <div class="raster-container flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted">
      <div class="flex items-center gap-2">
        <span class="font-bold text-primary">What The Cost</span>
        <span>•</span>
        <span>Local-first budgeting</span>
      </div>
      <div>
        100% private • Stored locally in your browser
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
