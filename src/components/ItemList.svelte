<script lang="ts">
  import type { Frequency, IncomeSettings, Item, ItemType, TimeHorizon } from '../types'
  import { FREQUENCY_LABELS, PRESET_CATEGORIES } from '../types'
  import { formatCurrency, normalizeCost, toHoursWorked } from '../utils/costNormalizer'
  import { 
    Search, 
    Filter, 
    ArrowUpDown, 
    Scissors, 
    Edit2, 
    Trash2, 
    Clock, 
    Sparkles, 
    ShieldCheck, 
    Calendar,
    Tag as TagIcon,
    Plus,
    RotateCcw
  } from '@lucide/svelte'

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
        // Type filter
        if (selectedType !== 'all' && item.type !== selectedType) {
          return false
        }
        // Category filter
        if (selectedCategory && item.category !== selectedCategory) {
          return false
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesName = item.name.toLowerCase().includes(q)
          const matchesCategory = item.category.toLowerCase().includes(q)
          const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q))
          const matchesNotes = (item.notes || '').toLowerCase().includes(q)
          if (!matchesName && !matchesCategory && !matchesTags && !matchesNotes) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        const costA = normalizeCost(a.amount, a.frequency, horizon)
        const costB = normalizeCost(b.amount, b.frequency, horizon)

        switch (sortBy) {
          case 'cost_desc':
            return costB - costA
          case 'cost_asc':
            return costA - costB
          case 'name':
            return a.name.localeCompare(b.name)
          case 'newest':
            return (b.createdAt || 0) - (a.createdAt || 0)
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

<div class="space-y-4">
  <!-- Controls Bar: Search, Type Tabs, Category Filter & Sorting -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
    <!-- Top Row: Search & Type Tabs -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search items, tags, categories..."
          class="w-full pl-9.5 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Segmented Type Selector -->
      <div class="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onclick={() => (selectedType = 'all')}
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition {selectedType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}"
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onclick={() => (selectedType = 'need')}
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition {selectedType === 'need' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-blue-300'}"
        >
          <ShieldCheck class="w-3.5 h-3.5 text-blue-400" />
          <span>Needs ({items.filter(i => i.type === 'need').length})</span>
        </button>
        <button
          type="button"
          onclick={() => (selectedType = 'want')}
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition {selectedType === 'want' ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40' : 'text-slate-400 hover:text-pink-300'}"
        >
          <Sparkles class="w-3.5 h-3.5 text-pink-400" />
          <span>Wants ({items.filter(i => i.type === 'want').length})</span>
        </button>
      </div>
    </div>

    <!-- Bottom Row: Category and Sort Dropdowns -->
    <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
      <!-- Category Filter -->
      <div class="flex items-center gap-2">
        <span class="text-slate-400 font-medium hidden sm:inline">Category:</span>
        <select
          bind:value={selectedCategory}
          class="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
            class="text-[11px] text-blue-400 hover:underline"
          >
            Clear
          </button>
        {/if}
      </div>

      <!-- Sorting Select -->
      <div class="flex items-center gap-2">
        <ArrowUpDown class="w-3.5 h-3.5 text-slate-400" />
        <span class="text-slate-400 font-medium hidden sm:inline">Sort:</span>
        <select
          bind:value={sortBy}
          class="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="cost_desc">Highest Cost First</option>
          <option value="cost_asc">Lowest Cost First</option>
          <option value="name">Name (A-Z)</option>
          <option value="newest">Recently Added</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Items List -->
  {#if filteredItems().length === 0}
    <div class="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
      <div class="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
        <TagIcon class="w-6 h-6" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-200">No items found</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          {searchQuery || selectedCategory || selectedType !== 'all'
            ? 'Try changing your search keywords or resetting your filters.'
            : 'Your budget is clear! Start by adding your regular needs and wants.'}
        </p>
      </div>
      <button
        type="button"
        onclick={onOpenAddModal}
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30"
      >
        <Plus class="w-4 h-4" />
        <span>Add Your First Item</span>
      </button>
    </div>
  {:else}
    <div class="space-y-2.5">
      {#each filteredItems() as item (item.id)}
        {@const normCost = normalizeCost(item.amount, item.frequency, horizon)}
        {@const hoursWorked = toHoursWorked(normCost, incomeSettings)}
        {@const categoryDef = PRESET_CATEGORIES.find((c) => c.id === item.category)}
        {@const isCut = whatIfActive && item.isSimulatedCut}

        <div
          class="group relative bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 {isCut ? 'border-dashed border-pink-500/50 bg-pink-950/20 opacity-75' : item.type === 'need' ? 'border-slate-800 hover:border-blue-900/50' : 'border-slate-800 hover:border-pink-900/50'}"
        >
          <div class="flex items-start justify-between gap-3">
            <!-- Left side: Type Icon, Item Title, Category & Tags -->
            <div class="flex items-start gap-3 min-w-0">
              <!-- Type Indicator Badge / Icon -->
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-sm {item.type === 'need' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-pink-500/10 text-pink-400 border-pink-500/30'}"
                title={item.type === 'need' ? 'Essential Need' : 'Discretionary Want'}
              >
                {#if item.type === 'need'}
                  <ShieldCheck class="w-5 h-5" />
                {:else}
                  <Sparkles class="w-5 h-5" />
                {/if}
              </div>

              <!-- Main info -->
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <h4 class="text-sm font-bold text-white tracking-tight truncate {isCut ? 'line-through text-slate-400' : ''}">
                    {item.name}
                  </h4>

                  <!-- Need / Want pill -->
                  <span class="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border {item.type === 'need' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-pink-500/15 text-pink-300 border-pink-500/30'}">
                    {item.type}
                  </span>

                  <!-- Frequency pill -->
                  <span class="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {FREQUENCY_LABELS[item.frequency] || item.frequency}
                  </span>

                  {#if isCut}
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      Cut in Simulator (+{formatCurrency(normCost, currency)}{horizonSuffix[horizon]})
                    </span>
                  {/if}
                </div>

                <!-- Category & Notes/Date -->
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-1">
                  <span class="text-slate-300 font-medium">{categoryDef?.name || item.category}</span>
                  
                  {#if item.notes}
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400 italic truncate max-w-xs">{item.notes}</span>
                  {/if}

                  {#if item.date}
                    <span class="text-slate-500">•</span>
                    <span class="text-slate-400 flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {item.date}
                    </span>
                  {/if}
                </div>

                <!-- Tags list -->
                {#if item.tags && item.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    {#each item.tags as tag}
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        #{tag}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Right side: Normalized Price & Action Buttons -->
            <div class="text-right shrink-0">
              <!-- Primary: Normalized Cost -->
              <div class="text-base sm:text-lg font-black tracking-tight {isCut ? 'line-through text-slate-500' : item.type === 'need' ? 'text-blue-300' : 'text-pink-300'}">
                {formatCurrency(normCost, currency)}
                <span class="text-xs font-semibold text-slate-400">{horizonSuffix[horizon]}</span>
              </div>

              <!-- Secondary: Original Entered Cost -->
              {#if item.frequency !== horizon}
                <div class="text-[11px] text-slate-400 font-medium">
                  {formatCurrency(item.amount, currency)} {item.frequency === 'once' ? 'once' : FREQUENCY_LABELS[item.frequency].toLowerCase()}
                </div>
              {/if}

              <!-- Time worked conversion (What The Cost magic) -->
              {#if hoursWorked}
                <div class="text-[10px] font-semibold text-amber-300/90 flex items-center justify-end gap-1 mt-0.5" title="Time worked to earn this amount">
                  <Clock class="w-3 h-3" />
                  <span>{hoursWorked.formatted} of work</span>
                </div>
              {/if}

              <!-- Quick Action Row -->
              <div class="flex items-center justify-end gap-1 mt-2">
                <!-- What-If Cut Toggle Button (for Wants) -->
                {#if item.type === 'want'}
                  <button
                    type="button"
                    onclick={() => onToggleCut(item.id)}
                    class="p-1.5 rounded-lg border text-xs font-semibold transition {item.isSimulatedCut ? 'bg-pink-600/30 border-pink-500 text-pink-200' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-pink-300 hover:border-pink-500/50'}"
                    title={item.isSimulatedCut ? 'Restore this want' : 'Simulate cutting this want'}
                  >
                    {#if item.isSimulatedCut}
                      <RotateCcw class="w-3.5 h-3.5" />
                    {:else}
                      <Scissors class="w-3.5 h-3.5" />
                    {/if}
                  </button>
                {/if}

                <!-- Edit Button -->
                <button
                  type="button"
                  onclick={() => onEditItem(item)}
                  class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                  title="Edit Item"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>

                <!-- Delete Button -->
                <button
                  type="button"
                  onclick={() => onDeleteItem(item.id)}
                  class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 transition"
                  title="Delete Item"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
