<script lang="ts">
  import type { BudgetStats, Item, TimeHorizon } from '../types'
  import { PRESET_CATEGORIES } from '../types'
  import { formatCurrency, normalizeCost } from '../utils/costNormalizer'

  interface Props {
    items: Item[]
    stats: BudgetStats
    horizon: TimeHorizon
    currency: string
    whatIfActive: boolean
    hasIncome: boolean
    onSelectCategoryFilter?: (catId: string) => void
  }

  let {
    items,
    stats,
    horizon,
    currency,
    whatIfActive,
    hasIncome,
    onSelectCategoryFilter
  }: Props = $props()

  // Category aggregation
  let categoryTotals = $derived(() => {
    const map = new Map<string, { id: string; name: string; amount: number; needsAmount: number; wantsAmount: number; count: number }>()

    for (const item of items) {
      if (whatIfActive && item.isSimulatedCut) continue
      const cost = normalizeCost(item.amount, item.frequency, horizon)
      const existing = map.get(item.category) || {
        id: item.category,
        name: PRESET_CATEGORIES.find((c) => c.id === item.category)?.name || item.category,
        amount: 0,
        needsAmount: 0,
        wantsAmount: 0,
        count: 0
      }

      existing.amount += cost
      existing.count += 1
      if (item.type === 'need') {
        existing.needsAmount += cost
      } else {
        existing.wantsAmount += cost
      }
      map.set(item.category, existing)
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  })

  let topCategory = $derived(categoryTotals()[0])
  let topCategoryShare = $derived(
    topCategory && stats.totalOutflow > 0 
      ? Math.round((topCategory.amount / (whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow)) * 100) 
      : 0
  )
</script>

<div class="raster-split-asymmetric gap-5 sm:gap-6">
  <!-- Left: Category Breakdown Table -->
  <div class="raster-card p-5 sm:p-6">
    <div class="flex items-center justify-between pb-3.5 mb-3 border-b border-border">
      <div>
        <h3 class="font-bold text-sm sm:text-base text-primary">Category Breakdown</h3>
        <span class="text-xs text-muted mt-0.5">{categoryTotals().length} categories</span>
      </div>
    </div>

    {#if categoryTotals().length === 0}
      <div class="py-14 text-center text-xs text-muted">
        No expenses recorded yet.
      </div>
    {:else}
      <div class="raster-table-container border-0">
        <table class="raster-table w-full">
          <thead>
            <tr>
              <th class="text-left font-medium text-xs text-muted py-2.5">Category</th>
              <th class="text-left font-medium text-xs text-muted py-2.5">Type</th>
              <th class="text-left font-medium text-xs text-muted py-2.5 hidden sm:table-cell">Share</th>
              <th class="cell-num font-medium text-xs text-muted py-2.5">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each categoryTotals().slice(0, 6) as cat}
              {@const maxAmount = categoryTotals()[0]?.amount || 1}
              {@const sharePct = Math.round((cat.amount / maxAmount) * 100)}
              {@const isNeedDominant = cat.needsAmount >= cat.wantsAmount}
              <tr 
                class="cursor-pointer transition-colors hover:bg-surface-subtle"
                onclick={() => onSelectCategoryFilter && onSelectCategoryFilter(cat.id)}
                title="Filter ledger by this category"
              >
                <td class="py-3">
                  <span class="font-medium text-xs sm:text-sm text-primary hover:underline">{cat.name}</span>
                  <span class="text-[11px] text-muted ml-1.5">({cat.count})</span>
                </td>
                <td class="py-3">
                  {#if cat.needsAmount > 0 && cat.wantsAmount > 0}
                    <span class="raster-tag text-[10px] py-0.5 px-2">Mixed</span>
                  {:else if cat.needsAmount > 0}
                    <span class="raster-tag raster-tag-solid text-[10px] py-0.5 px-2">Need</span>
                  {:else}
                    <span class="raster-tag text-[10px] py-0.5 px-2" style="color: var(--raster-accent); border-color: currentColor;">Want</span>
                  {/if}
                </td>
                <td class="py-3 hidden sm:table-cell">
                  <div class="raster-meter-track" style="height: 4px; width: 68px;">
                    <div 
                      class="raster-meter-fill {isNeedDominant ? '' : 'raster-meter-fill-accent'}" 
                      style="width: {sharePct}%;"
                    ></div>
                  </div>
                </td>
                <td class="cell-num py-3 font-semibold text-xs sm:text-sm text-primary">
                  {formatCurrency(cat.amount, currency)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if categoryTotals().length > 6}
        <div class="pt-4 mt-3 border-t border-border-subtle flex justify-between items-center text-xs text-muted">
          <span>Top 6 of {categoryTotals().length} categories</span>
          <span class="text-[11px]">Filtered in ledger below</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Right: Savings Rate & Quick Summary -->
  <div class="raster-card p-5 sm:p-6 flex flex-col justify-between">
    <div>
      <span class="text-xs font-semibold uppercase tracking-wider text-secondary">Savings & Surplus Rate</span>

      <!-- Monolithic Display Figure -->
      <div class="py-5 my-4 border-t border-b border-border">
        <div class="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          {hasIncome ? `${stats.savingsPercentOfIncome}%` : `${stats.needsPercentOfTotal}%`}
        </div>
        <div class="text-xs text-secondary mt-1.5">
          {#if hasIncome}
            {formatCurrency(stats.activeNetSurplus, currency)} retained after commitments
          {:else}
            Needs account for {stats.needsPercentOfTotal}% of total spending
          {/if}
        </div>
      </div>

      <!-- Quick Metrics with Generous Whitespace -->
      <div class="space-y-2 mt-5 text-sm">
        <div class="flex justify-between items-center py-2.5 border-b border-border-subtle">
          <span class="text-muted text-xs sm:text-sm">Total Outflow:</span>
          <span class="font-semibold text-primary">{formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}</span>
        </div>
        <div class="flex justify-between items-center py-2.5 border-b border-border-subtle">
          <span class="text-muted text-xs sm:text-sm">Discretionary:</span>
          <span class="font-semibold text-primary">{stats.wantsPercentOfTotal}% of total</span>
        </div>
      </div>
    </div>

    <!-- Notice if top category exists -->
    {#if topCategory}
      <div class="mt-6 pt-4 border-t border-border-subtle text-xs text-secondary leading-relaxed">
        <strong>{topCategory.name}</strong> represents <strong>{topCategoryShare}%</strong> of total expenditures.
      </div>
    {/if}
  </div>
</div>
