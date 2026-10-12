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

<div class="raster-split-asymmetric">
  <!-- Left: Category Spending Ledger Table -->
  <div class="raster-card">
    <div class="raster-card-header">
      <div class="flex items-center gap-2">
        <span class="raster-index">[ 02 ]</span>
        <span class="raster-card-title">Category Spending Allocation</span>
      </div>
      <span class="raster-label">{categoryTotals().length} Categories Total</span>
    </div>

    {#if categoryTotals().length === 0}
      <div class="py-12 text-center raster-label">
        NO ALLOCATIONS LOGGED // SYSTEM EMPTY
      </div>
    {:else}
      <div class="raster-table-container border-0">
        <table class="raster-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th>Share</th>
              <th class="cell-num">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {#each categoryTotals().slice(0, 6) as cat}
              {@const maxAmount = categoryTotals()[0]?.amount || 1}
              {@const sharePct = Math.round((cat.amount / maxAmount) * 100)}
              {@const isNeedDominant = cat.needsAmount >= cat.wantsAmount}
              <tr 
                class="cursor-pointer"
                onclick={() => onSelectCategoryFilter && onSelectCategoryFilter(cat.id)}
                title="Filter ledger by this category"
              >
                <td style="font-weight: 600;">
                  <span class="text-primary hover:underline">{cat.name}</span>
                  <span class="raster-mono text-muted text-xs ml-1">({cat.count})</span>
                </td>
                <td>
                  {#if cat.needsAmount > 0 && cat.wantsAmount > 0}
                    <span class="raster-tag">Mixed</span>
                  {:else if cat.needsAmount > 0}
                    <span class="raster-tag raster-tag-solid">Essential</span>
                  {:else}
                    <span class="raster-tag raster-tag-accent">Discretionary</span>
                  {/if}
                </td>
                <td>
                  <div class="raster-meter-track" style="height: 4px; width: 70px;">
                    <div 
                      class="raster-meter-fill {isNeedDominant ? '' : 'raster-meter-fill-accent'}" 
                      style="width: {sharePct}%;"
                    ></div>
                  </div>
                </td>
                <td class="cell-num" style="font-weight: 600;">
                  {formatCurrency(cat.amount, currency)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if categoryTotals().length > 6}
        <div class="raster-card-footer">
          <span class="raster-label">Showing Top 6 of {categoryTotals().length} Categories</span>
          <span class="raster-mono text-muted text-xs">// SCROLL LEDGER BELOW</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Right: Capital Retention / Surplus Ratio Card -->
  <div class="raster-card flex flex-col justify-between">
    <div>
      <div class="raster-label mb-1">// SURPLUS RATIO</div>
      <h3 class="raster-h3 mb-4">Capital Retention</h3>

      <!-- Monolithic Display Figure -->
      <div style="padding: var(--raster-space-4) 0; border-top: 1px solid var(--raster-border); border-bottom: 1px solid var(--raster-border);">
        <div class="raster-label">Net Surplus Rate</div>
        <div class="raster-display-xl" style="color: var(--raster-accent);">
          {hasIncome ? `${stats.savingsPercentOfIncome}.0%` : `${stats.needsPercentOfTotal}%`}
        </div>
        <div class="raster-label mt-1" style="color: var(--raster-fg-secondary);">
          {#if hasIncome}
            {formatCurrency(stats.activeNetSurplus, currency)} retained after commitments
          {:else}
            Needs ratio of total expenditures
          {/if}
        </div>
      </div>

      <!-- Velocity Metrics -->
      <div class="mt-4">
        <div class="raster-label mb-2">BUDGET VELOCITY METRICS</div>
        <div class="flex justify-between py-2 border-bottom raster-small">
          <span class="raster-mono text-muted">Outflow Velocity:</span>
          <span class="raster-mono font-semibold">{formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}</span>
        </div>
        <div class="flex justify-between py-2 border-bottom raster-small">
          <span class="raster-mono text-muted">Discretionary Ratio:</span>
          <span class="raster-mono font-semibold">{stats.wantsPercentOfTotal}% of total</span>
        </div>
      </div>
    </div>

    <!-- Expenditure Notice Callout -->
    {#if topCategory}
      <div class="raster-callout raster-callout-accent mt-4">
        <span class="raster-label" style="color: var(--raster-accent);">EXPENDITURE NOTICE</span>
        <span class="raster-small text-muted">
          <strong>{topCategory.name}</strong> accounts for {topCategoryShare}% of active expenditures.
        </span>
      </div>
    {/if}
  </div>
</div>
