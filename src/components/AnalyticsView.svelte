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

  const horizonSuffix: Record<TimeHorizon, string> = {
    daily: '/ day',
    weekly: '/ wk',
    monthly: '/ mo',
    yearly: '/ yr',
  }

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
  <!-- Left: Category Spending Table (Motus Table Pattern) -->
  <div class="raster-card-boxed">
    <div class="raster-section-header mb-2">
      <h3 class="raster-h2">Category spending</h3>
      <span class="raster-meta">{categoryTotals().length} categories</span>
    </div>

    {#if categoryTotals().length === 0}
      <div class="py-14 text-center text-xs text-muted">
        No expenses recorded yet.
      </div>
    {:else}
      <div class="raster-table-container">
        <table class="raster-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th class="hidden sm:table-cell">Share</th>
              <th class="cell-num">Amount</th>
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
                <td>
                  <span class="font-medium hover:underline">{cat.name}</span>
                  <span class="text-muted ml-1" style="font-size: 11px;">({cat.count})</span>
                </td>
                <td>
                  {#if cat.needsAmount > 0 && cat.wantsAmount > 0}
                    <span class="raster-tag">Mixed</span>
                  {:else if cat.needsAmount > 0}
                    <span class="raster-tag raster-tag-solid">Need</span>
                  {:else}
                    <span class="raster-tag">Want</span>
                  {/if}
                </td>
                <td class="hidden sm:table-cell">
                  <div class="raster-flex raster-items-center gap-3">
                    <div class="raster-meter-track" style="width: 70px;">
                      <div 
                        class="raster-meter-fill {isNeedDominant ? '' : 'raster-meter-fill-accent'}" 
                        style="width: {sharePct}%;"
                      ></div>
                    </div>
                    <span class="raster-tabular" style="color: var(--raster-fg-muted); font-size: 11px;">{sharePct}%</span>
                  </div>
                </td>
                <td class="cell-num font-medium">
                  {formatCurrency(cat.amount, currency)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if categoryTotals().length > 6}
        <div class="pt-3 mt-1 flex justify-between items-center text-xs text-muted">
          <span>Top 6 of {categoryTotals().length} categories</span>
          <span style="font-size: 11px;">Filtered in expenses below</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Right: Capital Retention & Specification Pane (Signature .raster-spec-list) -->
  <div class="raster-card-boxed flex flex-col justify-between">
    <div>
      <div class="raster-section-header mb-2">
        <h3 class="raster-h2">Capital retention</h3>
        <span class="raster-meta">Surplus ratio</span>
      </div>

      <!-- Monolithic Display Figure (Motus quiet scale) -->
      <div class="py-4 my-2 border-t border-b border-border">
        <div class="raster-display-xl" style="font-weight: 400;">
          {hasIncome ? `${stats.savingsPercentOfIncome}.0%` : `${stats.needsPercentOfTotal}%`}
        </div>
        <div class="text-xs text-muted mt-1">
          {#if hasIncome}
            {formatCurrency(stats.activeNetSurplus, currency)} retained after commitments
          {:else}
            Needs account for {stats.needsPercentOfTotal}% of total spending
          {/if}
        </div>
      </div>

      <!-- Specification Rows (Signature Raster 2.0 pattern) -->
      <div class="raster-spec-list mt-3">
        <div class="raster-spec-row-split py-3.5">
          <span class="raster-spec-key">Total outflow</span>
          <span class="font-mono text-sm font-medium text-primary tabular-nums">
            {formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)} {horizonSuffix[horizon]}
          </span>
        </div>

        <div class="raster-spec-row-split py-3.5">
          <span class="raster-spec-key">Discretionary</span>
          <span class="text-xs text-secondary font-mono">
            {stats.wantsPercentOfTotal}% of total expenditures
          </span>
        </div>

        {#if topCategory}
          <div class="raster-spec-row-split py-3.5 border-b border-border">
            <span class="raster-spec-key">Top category</span>
            <span class="text-xs text-primary">
              {topCategory.name} <span class="text-muted font-mono">({topCategoryShare}%)</span>
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
