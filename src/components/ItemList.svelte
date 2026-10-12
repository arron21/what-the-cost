<script lang="ts">
  import type { IncomeSettings, Item, TimeHorizon } from '../types'
  import { FREQUENCY_LABELS, PRESET_CATEGORIES } from '../types'
  import { formatCurrency, normalizeCost, toHoursWorked } from '../utils/costNormalizer'
  import { Search, Plus } from '@lucide/svelte'

  interface Props {
    items: Item[]
    horizon: TimeHorizon
    currency: string
    whatIfActive: boolean
    incomeSettings: IncomeSettings
    onEditItem: (item: Item) => void
    onDeleteItem: (id: string) => void
    onToggleCut: (id: string) => void
    onOpenAddModal: () => void
    activeCategoryFilter?: string
  }

  let {
    items,
    horizon,
    currency,
    whatIfActive,
    incomeSettings,
    onEditItem,
    onDeleteItem,
    onToggleCut,
    onOpenAddModal,
    activeCategoryFilter = ''
  }: Props = $props()

  let searchQuery = $state('')
  let selectedType = $state<'all' | 'need' | 'want'>('all')
  let selectedCategory = $state<string>('')
  let sortBy = $state<'cost_desc' | 'cost_asc' | 'name' | 'newest'>('cost_desc')

  $effect(() => {
    selectedCategory = activeCategoryFilter || ''
  })

  // Filter and sort items
  let filteredItems = $derived(() => {
    return items
      .filter((item) => {
        if (selectedType !== 'all' && item.type !== selectedType) return false
        if (selectedCategory && item.category !== selectedCategory) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesName = item.name.toLowerCase().includes(q)
          const matchesCategory = item.category.toLowerCase().includes(q)
          const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q))
          const matchesNotes = (item.notes || '').toLowerCase().includes(q)
          if (!matchesName && !matchesCategory && !matchesTags && !matchesNotes) return false
        }
        return true
      })
      .sort((a, b) => {
        const costA = normalizeCost(a.amount, a.frequency, horizon)
        const costB = normalizeCost(b.amount, b.frequency, horizon)
        switch (sortBy) {
          case 'cost_desc': return costB - costA
          case 'cost_asc': return costA - costB
          case 'name': return a.name.localeCompare(b.name)
          case 'newest': return (b.createdAt || 0) - (a.createdAt || 0)
        }
      })
  })

  const horizonSuffix: Record<TimeHorizon, string> = {
    daily: '/ day',
    weekly: '/ wk',
    monthly: '/ mo',
    yearly: '/ yr',
  }
</script>

<div class="space-y-6">
  <!-- Architectural Section Header -->
  <div class="raster-section-header">
    <span class="raster-index">[ 03 ]</span>
    <h2 class="raster-h2">FINANCIAL LEDGER // ALLOCATIONS</h2>
    <div class="raster-rule"></div>
    <span class="raster-meta">{filteredItems().length} ITEMS ACTIVE</span>
  </div>

  <!-- Controls Bar (Search, Type Filter, Category, Sort) -->
  <div class="raster-card py-4">
    <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="SEARCH LEDGER..."
          class="raster-input pl-8 py-1.5 text-xs raster-mono"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Segmented Type Selector -->
      <div class="raster-btn-group shrink-0 self-start md:self-auto">
        <button
          type="button"
          onclick={() => (selectedType = 'all')}
          class="raster-btn {selectedType === 'all' ? 'is-active' : ''}"
        >
          ALL ({items.length})
        </button>
        <button
          type="button"
          onclick={() => (selectedType = 'need')}
          class="raster-btn {selectedType === 'need' ? 'is-active' : ''}"
        >
          NEEDS ({items.filter(i => i.type === 'need').length})
        </button>
        <button
          type="button"
          onclick={() => (selectedType = 'want')}
          class="raster-btn {selectedType === 'want' ? 'is-active' : ''}"
        >
          WANTS ({items.filter(i => i.type === 'want').length})
        </button>
      </div>

      <!-- Category Filter -->
      <div class="flex items-center gap-2 shrink-0">
        <select
          bind:value={selectedCategory}
          class="raster-select text-xs py-1.5"
        >
          <option value="">ALL CATEGORIES</option>
          {#each PRESET_CATEGORIES as cat}
            <option value={cat.id}>{cat.name.toUpperCase()}</option>
          {/each}
        </select>
        {#if selectedCategory}
          <button
            type="button"
            onclick={() => (selectedCategory = '')}
            class="raster-btn raster-btn-ghost raster-btn-sm"
          >
            CLEAR
          </button>
        {/if}
      </div>

      <!-- Sort Filter -->
      <div class="shrink-0">
        <select
          bind:value={sortBy}
          class="raster-select text-xs py-1.5"
        >
          <option value="cost_desc">COST: HIGH → LOW</option>
          <option value="cost_asc">COST: LOW → HIGH</option>
          <option value="name">NAME (A–Z)</option>
          <option value="newest">RECENT</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Items Ledger List -->
  {#if filteredItems().length === 0}
    <div class="raster-card py-16 text-center">
      <div class="raster-label mb-2">[ EMPTY LEDGER ]</div>
      <p class="raster-body mb-4">No allocations match your filter criteria.</p>
      <button
        type="button"
        onclick={onOpenAddModal}
        class="raster-btn raster-btn-primary raster-btn-sm"
      >
        <span>+ RECORD FIRST ALLOCATION</span>
      </button>
    </div>
  {:else}
    <div class="border-hairline" style="background-color: var(--raster-surface);">
      {#each filteredItems() as item, idx (item.id)}
        {@const normCost = normalizeCost(item.amount, item.frequency, horizon)}
        {@const hoursWorked = toHoursWorked(normCost, incomeSettings)}
        {@const categoryDef = PRESET_CATEGORIES.find((c) => c.id === item.category)}
        {@const isCut = whatIfActive && item.isSimulatedCut}

        <div 
          class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors hover:bg-surface-subtle"
          style="border-bottom: 1px solid var(--raster-border-subtle); {isCut ? 'opacity: 0.55; background-color: var(--raster-surface-subtle);' : ''}"
        >
          <!-- Left: Identification & Metadata -->
          <div class="flex items-start gap-3 min-w-0">
            <span class="raster-mono text-xs text-muted mt-0.5" style="width: 28px;">
              [{String(idx + 1).padStart(2, '0')}]
            </span>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-bold text-sm text-primary {isCut ? 'line-through' : ''}">
                  {item.name}
                </span>

                <!-- Type tag -->
                {#if item.type === 'need'}
                  <span class="raster-tag raster-tag-solid" style="font-size: 9px; padding: 1px 4px;">REQ</span>
                {:else}
                  <span class="raster-tag raster-tag-accent" style="font-size: 9px; padding: 1px 4px;">OPT</span>
                {/if}

                <!-- Frequency tag -->
                <span class="raster-tag" style="font-size: 9px; padding: 1px 4px;">
                  {FREQUENCY_LABELS[item.frequency].toUpperCase()}
                </span>

                {#if isCut}
                  <span class="raster-tag raster-tag-accent">
                    CUT SIMULATED (+{formatCurrency(normCost, currency)} {horizonSuffix[horizon]})
                  </span>
                {/if}
              </div>

              <!-- Category & notes -->
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted mt-1">
                <span class="font-medium text-secondary">{categoryDef?.name || item.category}</span>
                {#if item.notes}
                  <span>//</span>
                  <span class="italic truncate max-w-sm">{item.notes}</span>
                {/if}
                {#if item.date}
                  <span>//</span>
                  <span class="raster-mono">{item.date}</span>
                {/if}
              </div>

              <!-- Tags -->
              {#if item.tags && item.tags.length > 0}
                <div class="flex flex-wrap gap-1 mt-1.5">
                  {#each item.tags as tag}
                    <span class="raster-mono text-[10px] text-muted">
                      #{tag}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Right: Tabular Amount, Wage Math & Action Controls -->
          <div class="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-dashed border-border-subtle">
            <div class="text-left md:text-right">
              <div class="raster-stat-value text-xl font-bold {isCut ? 'line-through' : ''}">
                {formatCurrency(normCost, currency)}
                <span class="raster-label font-normal text-muted text-[10px]">{horizonSuffix[horizon]}</span>
              </div>

              {#if item.frequency !== horizon}
                <div class="raster-mono text-xs text-muted">
                  {formatCurrency(item.amount, currency)} {item.frequency}
                </div>
              {/if}

              {#if hoursWorked}
                <div class="raster-mono text-[11px]" style="color: var(--raster-accent);">
                  ⏱ {hoursWorked.formatted} work
                </div>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5">
              {#if item.type === 'want'}
                <button
                  type="button"
                  onclick={() => onToggleCut(item.id)}
                  class="raster-btn {item.isSimulatedCut ? 'raster-btn-accent' : 'raster-btn-outline'} raster-btn-sm"
                  title={item.isSimulatedCut ? 'Restore this want' : 'Simulate cutting this want'}
                >
                  <span>{item.isSimulatedCut ? 'RESTORE' : 'CUT'}</span>
                </button>
              {/if}

              <button
                type="button"
                onclick={() => onEditItem(item)}
                class="raster-btn raster-btn-ghost raster-btn-sm"
                title="Edit Entry"
              >
                <span>EDIT</span>
              </button>

              <button
                type="button"
                onclick={() => onDeleteItem(item.id)}
                class="raster-btn raster-btn-ghost raster-btn-sm"
                title="Delete Entry"
              >
                <span style="color: var(--raster-accent);">DEL</span>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
