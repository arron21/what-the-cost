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
    daily: '/ day',
    weekly: '/ wk',
    monthly: '/ mo',
    yearly: '/ yr',
  }
</script>

<div class="space-y-4 sm:space-y-5">
  <!-- Section Header -->
  <div class="raster-section-header">
    <div class="flex items-baseline gap-3">
      <h2 class="raster-h2">Expenses & allocations</h2>
      <span class="raster-meta">{filteredItems().length} active</span>
    </div>

    <!-- Desktop Add Button -->
    <button
      type="button"
      onclick={onOpenAddModal}
      class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
    >
      <Plus class="w-3.5 h-3.5 mr-1" />
      <span>Add expense</span>
    </button>
  </div>

  <!-- Controls Bar (Search, Type Underlined Tabs, Category, Sort) -->
  <div class="raster-card-boxed">
    <div class="controls-row">
      <!-- Search Input -->
      <div class="relative w-full flex items-center">
        <Search class="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search expenses..."
          class="raster-input w-full text-xs"
          style="padding-left: 2.25rem !important; padding-right: 2rem; min-height: 38px;"
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
      <div class="controls-filters pt-1">
        <!-- Type Filter: Underlined Neo-Swiss Tabs -->
        <div class="raster-btn-group w-full md:w-auto shrink-0 flex gap-4">
          <button
            type="button"
            onclick={() => (selectedType = 'all')}
            class="raster-btn {selectedType === 'all' ? 'is-active' : ''}"
            style="padding: 2px 4px;"
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'need')}
            class="raster-btn {selectedType === 'need' ? 'is-active' : ''}"
            style="padding: 2px 4px;"
          >
            Needs ({items.filter(i => i.type === 'need').length})
          </button>
          <button
            type="button"
            onclick={() => (selectedType = 'want')}
            class="raster-btn {selectedType === 'want' ? 'is-active' : ''}"
            style="padding: 2px 4px;"
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
              style="min-height: 36px; padding: 6px 10px;"
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
            style="min-height: 36px; padding: 6px 10px;"
          >
            <option value="cost_desc">Highest cost</option>
            <option value="cost_asc">Lowest cost</option>
            <option value="name">Name (A–Z)</option>
            <option value="newest">Recently added</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Expenses List -->
  {#if filteredItems().length === 0}
    <div class="raster-card-boxed py-16 text-center">
      <p class="text-sm font-medium text-secondary mb-1">No expenses found</p>
      <p class="text-xs text-muted mb-4">Try clearing filters or record a new allocation.</p>
      <button
        type="button"
        onclick={onOpenAddModal}
        class="raster-btn raster-btn-primary raster-btn-sm"
      >
        <Plus class="w-3.5 h-3.5 mr-1" />
        <span>Add expense</span>
      </button>
    </div>
  {:else}
    <div class="raster-card-boxed p-0 overflow-hidden divide-y divide-border-subtle">
      {#each filteredItems() as item (item.id)}
        {@const normCost = normalizeCost(item.amount, item.frequency, horizon)}
        {@const hoursWorked = toHoursWorked(normCost, incomeSettings)}
        {@const categoryDef = PRESET_CATEGORIES.find((c) => c.id === item.category)}
        {@const isCut = whatIfActive && item.isSimulatedCut}

        <div 
          class="expense-row hover:bg-surface-subtle"
          style={isCut ? 'opacity: 0.5; background-color: var(--raster-surface);' : ''}
        >
          <!-- Left: Identification & Metadata -->
          <div class="expense-row-left">
            <!-- Line 1: Name, Type Tag, Category -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="font-medium text-sm text-primary {isCut ? 'line-through' : ''}">
                {item.name}
              </span>

              <!-- Type Tag -->
              {#if item.type === 'need'}
                <span class="raster-tag raster-tag-solid">Need</span>
              {:else}
                <span class="raster-tag">Want</span>
              {/if}

              <!-- Category -->
              <span class="text-xs text-muted">
                {categoryDef?.name || item.category}
              </span>
            </div>

            <!-- Line 2: Frequency, Work Math, Notes -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted mt-1.5">
              <span>{FREQUENCY_LABELS[item.frequency]}</span>

              {#if item.frequency !== horizon}
                <span>
                  ({formatCurrency(item.amount, currency)} {item.frequency})
                </span>
              {/if}

              {#if hoursWorked}
                <span>·</span>
                <span>
                  ⏱ {hoursWorked.formatted} work
                </span>
              {/if}

              {#if item.notes}
                <span>·</span>
                <span class="italic max-w-sm truncate">{item.notes}</span>
              {/if}

              {#if item.date && item.frequency === 'once'}
                <span>·</span>
                <span>{item.date}</span>
              {/if}
            </div>

            <!-- Line 3: Tags -->
            {#if item.tags && item.tags.length > 0}
              <div class="flex flex-wrap gap-1 mt-1.5">
                {#each item.tags as tag}
                  <span class="text-[10px] text-muted bg-surface px-1.5 py-0.5">
                    #{tag}
                  </span>
                {/each}
              </div>
            {/if}

            {#if isCut}
              <div class="mt-1.5 text-xs text-muted">
                Simulated cut: saves {formatCurrency(normCost, currency)} {horizonSuffix[horizon]}
              </div>
            {/if}
          </div>

          <!-- Right: Amount & Actions -->
          <div class="expense-row-right">
            <!-- Amount Display -->
            <div class="text-left sm:text-right">
              <div class="text-base font-medium text-primary {isCut ? 'line-through text-muted' : ''}">
                {formatCurrency(normCost, currency)}
                <span class="text-xs text-muted font-normal ml-0.5">{horizonSuffix[horizon]}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5">
              {#if item.type === 'want'}
                <button
                  type="button"
                  onclick={() => onToggleCut(item.id)}
                  class="raster-btn {item.isSimulatedCut ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
                  title={item.isSimulatedCut ? 'Restore this item' : 'Simulate cutting this item'}
                  style="font-size: 11px; padding: 2px 8px; height: 28px;"
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
                title="Edit entry"
                style="padding: 2px 8px; font-size: 11px; height: 28px;"
              >
                <Edit2 class="w-3 h-3 mr-1" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onclick={() => onDeleteItem(item.id)}
                class="raster-btn raster-btn-ghost raster-btn-sm"
                title="Delete entry"
                style="padding: 2px 6px; font-size: 11px; height: 28px;"
                aria-label="Delete entry"
              >
                <Trash2 class="w-3.5 h-3.5 text-muted hover:text-primary" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
