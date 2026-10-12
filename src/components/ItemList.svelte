<script lang="ts">
  import type { IncomeSettings, Item, TimeHorizon } from '../types'
  import { FREQUENCY_LABELS, PRESET_CATEGORIES } from '../types'
  import { formatCurrency, normalizeCost, toHoursWorked } from '../utils/costNormalizer'
  import { Search, Plus, Trash2, Edit2, Scissors, RotateCcw } from '@lucide/svelte'

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
    daily: '/day',
    weekly: '/wk',
    monthly: '/mo',
    yearly: '/yr',
  }
</script>

<div class="space-y-4 sm:space-y-5">
  <!-- Section Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-baseline gap-2.5">
      <h2 class="text-base sm:text-lg font-bold tracking-tight text-primary">Expenses & Allocations</h2>
      <span class="text-xs text-muted">({filteredItems().length})</span>
    </div>

    <!-- Desktop Add Button -->
    <button
      type="button"
      onclick={onOpenAddModal}
      class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
      style="font-size: 12px; font-weight: 600;"
    >
      <Plus class="w-3.5 h-3.5 mr-1" />
      <span>Add Expense</span>
    </button>
  </div>

  <!-- Controls Bar (Search, Type, Category, Sort) -->
  <div class="raster-card p-3 sm:p-4">
    <div class="flex flex-col gap-3">
      <!-- Row 1: Search -->
      <div class="relative w-full flex items-center">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search expenses..."
          class="raster-input w-full text-xs"
          style="padding-left: 2.25rem !important; padding-right: 2rem; min-height: 40px;"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary p-1"
            aria-label="Clear search"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Row 2: Type Filter and Dropdowns -->
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3">
        <!-- Type Filter Button Group -->
        <div class="raster-btn-group raster-btn-group-responsive sm:w-auto shrink-0">
          <button
            type="button"
            onclick={() => (selectedType = 'all')}
            class="raster-btn {selectedType === 'all' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 500; min-height: 38px;"
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'need')}
            class="raster-btn {selectedType === 'need' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 500; min-height: 38px;"
          >
            Needs ({items.filter(i => i.type === 'need').length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'want')}
            class="raster-btn {selectedType === 'want' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 500; min-height: 38px;"
          >
            Wants ({items.filter(i => i.type === 'want').length})
          </button>
        </div>

        <!-- Dropdowns: 2 columns on mobile, inline on desktop -->
        <div class="grid grid-cols-2 sm:flex items-center gap-2">
          <!-- Category Select -->
          <div class="flex items-center gap-1.5 min-w-0">
            <select
              bind:value={selectedCategory}
              class="raster-select text-xs w-full sm:w-auto py-2"
              style="min-height: 38px;"
            >
              <option value="">All Categories</option>
              {#each PRESET_CATEGORIES as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
            {#if selectedCategory}
              <button
                type="button"
                onclick={() => (selectedCategory = '')}
                class="raster-btn raster-btn-ghost raster-btn-sm shrink-0 px-2"
                title="Clear category filter"
              >
                ✕
              </button>
            {/if}
          </div>

          <!-- Sort Select -->
          <select
            bind:value={sortBy}
            class="raster-select text-xs w-full sm:w-auto py-2"
            style="min-height: 38px;"
          >
            <option value="cost_desc">Highest Cost</option>
            <option value="cost_asc">Lowest Cost</option>
            <option value="name">Name (A–Z)</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Expenses List -->
  {#if filteredItems().length === 0}
    <div class="raster-card py-16 text-center">
      <p class="text-sm font-medium text-secondary mb-1">No expenses found</p>
      <p class="text-xs text-muted mb-4">Try clearing filters or add a new expense.</p>
      <button
        type="button"
        onclick={onOpenAddModal}
        class="raster-btn raster-btn-primary raster-btn-sm"
      >
        <Plus class="w-3.5 h-3.5 mr-1" />
        <span>Add Expense</span>
      </button>
    </div>
  {:else}
    <div class="border-hairline divide-y divide-border-subtle" style="background-color: var(--raster-surface);">
      {#each filteredItems() as item (item.id)}
        {@const normCost = normalizeCost(item.amount, item.frequency, horizon)}
        {@const hoursWorked = toHoursWorked(normCost, incomeSettings)}
        {@const categoryDef = PRESET_CATEGORIES.find((c) => c.id === item.category)}
        {@const isCut = whatIfActive && item.isSimulatedCut}

        <div 
          class="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors hover:bg-surface-subtle"
          style={isCut ? 'opacity: 0.55; background-color: var(--raster-surface-subtle);' : ''}
        >
          <!-- Left: Identification & Metadata -->
          <div class="min-w-0 w-full sm:w-auto flex-1">
            <div class="flex items-center justify-between sm:justify-start gap-2">
              <span class="font-semibold text-sm text-primary truncate {isCut ? 'line-through' : ''}">
                {item.name}
              </span>

              <!-- Type Badge -->
              {#if item.type === 'need'}
                <span class="raster-tag raster-tag-solid text-[10px] py-0.5 px-1.5 shrink-0">Need</span>
              {:else}
                <span class="raster-tag text-[10px] py-0.5 px-1.5 shrink-0" style="color: var(--raster-accent); border-color: currentColor;">Want</span>
              {/if}

              <!-- Mobile Amount on the top right for compact banking feel -->
              <div class="sm:hidden text-right shrink-0">
                <span class="font-bold text-sm text-primary {isCut ? 'line-through' : ''}">
                  {formatCurrency(normCost, currency)}
                </span>
                <span class="text-[10px] text-muted">{horizonSuffix[horizon]}</span>
              </div>
            </div>

            <!-- Subtitle info: Category, Frequency, Notes -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted mt-1">
              <span class="text-secondary font-medium">{categoryDef?.name || item.category}</span>
              <span>•</span>
              <span>{FREQUENCY_LABELS[item.frequency]}</span>
              {#if item.notes}
                <span>•</span>
                <span class="truncate max-w-[200px] sm:max-w-xs">{item.notes}</span>
              {/if}
              {#if item.frequency !== horizon}
                <span class="hidden sm:inline text-muted">
                  ({formatCurrency(item.amount, currency)} {item.frequency})
                </span>
              {/if}
              {#if hoursWorked}
                <span>•</span>
                <span class="text-secondary">
                  ⏱ {hoursWorked.formatted} work
                </span>
              {/if}
            </div>

            <!-- Tags -->
            {#if item.tags && item.tags.length > 0}
              <div class="flex flex-wrap gap-1 mt-1.5">
                {#each item.tags as tag}
                  <span class="text-[10px] text-muted bg-surface-subtle px-1.5 py-0.5 border border-border-subtle">
                    #{tag}
                  </span>
                {/each}
              </div>
            {/if}

            {#if isCut}
              <div class="mt-1 text-xs font-medium" style="color: var(--raster-accent);">
                Simulated Cut (+{formatCurrency(normCost, currency)}{horizonSuffix[horizon]})
              </div>
            {/if}
          </div>

          <!-- Right: Desktop Amount & Action Buttons -->
          <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
            <!-- Desktop Amount -->
            <div class="hidden sm:block text-right">
              <div class="text-base font-bold text-primary {isCut ? 'line-through' : ''}">
                {formatCurrency(normCost, currency)}
                <span class="text-xs font-normal text-muted">{horizonSuffix[horizon]}</span>
              </div>
              {#if item.frequency !== horizon}
                <div class="text-[11px] text-muted">
                  {formatCurrency(item.amount, currency)} {item.frequency}
                </div>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              {#if item.type === 'want'}
                <button
                  type="button"
                  onclick={() => onToggleCut(item.id)}
                  class="raster-btn {item.isSimulatedCut ? 'raster-btn-accent' : 'raster-btn-outline'} raster-btn-sm"
                  title={item.isSimulatedCut ? 'Restore this item' : 'Simulate cutting this item'}
                  style="font-size: 11px; padding: 4px 8px;"
                >
                  {#if item.isSimulatedCut}
                    <RotateCcw class="w-3 h-3 mr-1" />
                    <span>Restore</span>
                  {:else}
                    <Scissors class="w-3 h-3 mr-1" />
                    <span>Cut</span>
                  {/if}
                </button>
              {/if}

              <button
                type="button"
                onclick={() => onEditItem(item)}
                class="raster-btn raster-btn-ghost raster-btn-sm"
                title="Edit Entry"
                style="padding: 4px 8px; font-size: 11px;"
              >
                <Edit2 class="w-3 h-3 mr-1" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onclick={() => onDeleteItem(item.id)}
                class="raster-btn raster-btn-ghost raster-btn-sm"
                title="Delete Entry"
                style="padding: 4px 8px; font-size: 11px;"
              >
                <Trash2 class="w-3 h-3 text-secondary hover:text-accent" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
