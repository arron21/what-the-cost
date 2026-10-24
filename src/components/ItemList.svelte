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

<div class="space-y-5 sm:space-y-6">
  <!-- Section Header -->
  <div class="flex items-center justify-between pb-1">
    <div class="flex items-baseline gap-3">
      <h2 class="text-lg sm:text-xl font-bold tracking-tight text-primary">Expenses & Allocations</h2>
      <span class="text-xs text-muted font-medium px-2 py-0.5 border border-border-subtle bg-surface-subtle">
        {filteredItems().length} total
      </span>
    </div>

    <!-- Desktop Add Button -->
    <button
      type="button"
      onclick={onOpenAddModal}
      class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
      style="font-size: 13px; font-weight: 600; padding: 6px 14px;"
    >
      <Plus class="w-4 h-4 mr-1.5" />
      <span>Add Expense</span>
    </button>
  </div>

  <!-- Controls Bar (Search, Type, Category, Sort) -->
  <div class="raster-card p-4 sm:p-5">
    <div class="controls-row">
      <!-- Search Input -->
      <div class="relative w-full flex items-center">
        <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search expenses..."
          class="raster-input w-full text-sm"
          style="padding-left: 2.5rem !important; padding-right: 2.25rem; min-height: 42px;"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary p-1"
            aria-label="Clear search"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Filters & Dropdowns Row -->
      <div class="controls-filters">
        <!-- Type Filter Button Group -->
        <div class="raster-btn-group w-full md:w-auto shrink-0 flex">
          <button
            type="button"
            onclick={() => (selectedType = 'all')}
            class="raster-btn flex-1 md:flex-initial {selectedType === 'all' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 600; min-height: 38px; padding: 6px 14px;"
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'need')}
            class="raster-btn flex-1 md:flex-initial {selectedType === 'need' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 600; min-height: 38px; padding: 6px 14px;"
          >
            Needs ({items.filter(i => i.type === 'need').length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'want')}
            class="raster-btn flex-1 md:flex-initial {selectedType === 'want' ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 600; min-height: 38px; padding: 6px 14px;"
          >
            Wants ({items.filter(i => i.type === 'want').length})
          </button>
        </div>

        <!-- Dropdowns: 2 equal columns on mobile, auto-width on desktop -->
        <div class="grid grid-cols-2 md:flex items-center gap-2.5 w-full md:w-auto">
          <!-- Category Select -->
          <div class="flex items-center gap-1.5 w-full md:w-auto">
            <select
              bind:value={selectedCategory}
              class="raster-select text-xs w-full md:w-[170px]"
              style="min-height: 38px; padding: 8px 12px;"
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
            class="raster-select text-xs w-full md:w-[160px]"
            style="min-height: 38px; padding: 8px 12px;"
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
      <p class="text-sm font-semibold text-secondary mb-1">No expenses found</p>
      <p class="text-xs text-muted mb-5">Try clearing filters or add a new expense.</p>
      <button
        type="button"
        onclick={onOpenAddModal}
        class="raster-btn raster-btn-primary raster-btn-sm"
        style="padding: 8px 16px;"
      >
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Add Expense</span>
      </button>
    </div>
  {:else}
    <div class="raster-card p-0 overflow-hidden divide-y divide-border-subtle" style="background-color: var(--raster-surface);">
      {#each filteredItems() as item (item.id)}
        {@const normCost = normalizeCost(item.amount, item.frequency, horizon)}
        {@const hoursWorked = toHoursWorked(normCost, incomeSettings)}
        {@const categoryDef = PRESET_CATEGORIES.find((c) => c.id === item.category)}
        {@const isCut = whatIfActive && item.isSimulatedCut}

        <div 
          class="expense-row hover:bg-surface-subtle"
          style={isCut ? 'opacity: 0.55; background-color: var(--raster-surface-subtle);' : ''}
        >
          <!-- Left: Identification & Metadata -->
          <div class="expense-row-left">
            <!-- Line 1: Name, Type Badge, Category -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="font-semibold text-base text-primary {isCut ? 'line-through' : ''}">
                {item.name}
              </span>

              <!-- Type Badge -->
              {#if item.type === 'need'}
                <span class="raster-tag raster-tag-solid text-[10px] py-0.5 px-2">Need</span>
              {:else}
                <span class="raster-tag text-[10px] py-0.5 px-2" style="color: var(--raster-accent); border-color: currentColor;">Want</span>
              {/if}

              <!-- Category -->
              <span class="text-xs text-secondary font-medium">
                {categoryDef?.name || item.category}
              </span>
            </div>

            <!-- Line 2: Frequency, Work Math, Notes -->
            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted mt-1.5">
              <span>{FREQUENCY_LABELS[item.frequency]}</span>

              {#if item.frequency !== horizon}
                <span class="text-secondary font-medium">
                  ({formatCurrency(item.amount, currency)} {item.frequency})
                </span>
              {/if}

              {#if hoursWorked}
                <span>•</span>
                <span class="text-secondary">
                  ⏱ {hoursWorked.formatted} work
                </span>
              {/if}

              {#if item.notes}
                <span>•</span>
                <span class="italic text-secondary max-w-sm truncate">{item.notes}</span>
              {/if}

              {#if item.date && item.frequency === 'once'}
                <span>•</span>
                <span>{item.date}</span>
              {/if}
            </div>

            <!-- Line 3: Tags -->
            {#if item.tags && item.tags.length > 0}
              <div class="flex flex-wrap gap-1.5 mt-2">
                {#each item.tags as tag}
                  <span class="text-[10px] text-muted bg-surface-subtle px-2 py-0.5 border border-border-subtle">
                    #{tag}
                  </span>
                {/each}
              </div>
            {/if}

            {#if isCut}
              <div class="mt-2 text-xs font-semibold" style="color: var(--raster-accent);">
                Simulated Cut: saves {formatCurrency(normCost, currency)}{horizonSuffix[horizon]}
              </div>
            {/if}
          </div>

          <!-- Right: Amount & Actions -->
          <div class="expense-row-right">
            <!-- Amount Display -->
            <div class="text-left sm:text-right">
              <div class="text-base sm:text-lg font-bold text-primary {isCut ? 'line-through' : ''}">
                {formatCurrency(normCost, currency)}
                <span class="text-xs font-normal text-muted ml-0.5">{horizonSuffix[horizon]}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              {#if item.type === 'want'}
                <button
                  type="button"
                  onclick={() => onToggleCut(item.id)}
                  class="raster-btn {item.isSimulatedCut ? 'raster-btn-accent' : 'raster-btn-outline'} raster-btn-sm"
                  title={item.isSimulatedCut ? 'Restore this item' : 'Simulate cutting this item'}
                  style="font-size: 11px; padding: 5px 10px;"
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
                style="padding: 5px 10px; font-size: 11px;"
              >
                <Edit2 class="w-3 h-3 mr-1" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onclick={() => onDeleteItem(item.id)}
                class="raster-btn raster-btn-ghost raster-btn-sm text-secondary hover:text-accent"
                title="Delete Entry"
                style="padding: 5px 8px; font-size: 11px;"
                aria-label="Delete entry"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
