<script lang="ts">
  import type { BudgetStats, Item, TimeHorizon } from '../types'
  import { PRESET_CATEGORIES } from '../types'
  import { formatCurrency, normalizeCost } from '../utils/costNormalizer'
  import { PieChart, Layers, ArrowUpRight } from '@lucide/svelte'

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

  // SVG Doughnut Chart parameters
  const size = 180
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate angles for Donut
  let donutSegments = $derived(() => {
    const total = hasIncome ? stats.income : stats.totalOutflow || 1
    const needsPct = hasIncome 
      ? stats.needsPercentOfIncome / 100 
      : (stats.needsTotal / (stats.totalOutflow || 1))
    const wantsPct = hasIncome 
      ? (whatIfActive ? stats.activeWantsTotal : stats.wantsTotal) / stats.income 
      : ((whatIfActive ? stats.activeWantsTotal : stats.wantsTotal) / (stats.totalOutflow || 1))
    const savingsPct = hasIncome 
      ? Math.max(0, stats.activeNetSurplus) / stats.income 
      : 0

    const needsLength = needsPct * circumference
    const wantsLength = wantsPct * circumference
    const savingsLength = savingsPct * circumference

    return {
      circumference,
      needsLength,
      wantsLength,
      savingsLength,
      needsOffset: 0,
      wantsOffset: -needsLength,
      savingsOffset: -(needsLength + wantsLength),
    }
  })
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
  <!-- Donut Chart & Ratio Card -->
  <div class="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <PieChart class="w-4 h-4 text-indigo-400" />
        <h3 class="text-sm font-bold text-slate-200">Budget Allocation</h3>
      </div>
      <span class="text-[11px] font-medium text-slate-400">
        {hasIncome ? 'Income breakdown' : 'Cost breakdown'}
      </span>
    </div>

    <!-- Interactive SVG Donut -->
    <div class="relative flex items-center justify-center my-2">
      <svg width={size} height={size} class="rotate-[-90deg]">
        <!-- Background track -->
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          stroke-width={strokeWidth}
        />

        <!-- Needs Segment (Blue) -->
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          stroke-width={strokeWidth}
          stroke-dasharray={`${donutSegments().needsLength} ${circumference}`}
          stroke-dashoffset={donutSegments().needsOffset}
          stroke-linecap="round"
          class="transition-all duration-700 ease-out"
        />

        <!-- Wants Segment (Pink) -->
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ec4899"
          stroke-width={strokeWidth}
          stroke-dasharray={`${donutSegments().wantsLength} ${circumference}`}
          stroke-dashoffset={donutSegments().wantsOffset}
          stroke-linecap="round"
          class="transition-all duration-700 ease-out"
        />

        <!-- Savings Segment (Emerald) -->
        {#if hasIncome && stats.activeNetSurplus > 0}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10b981"
            stroke-width={strokeWidth}
            stroke-dasharray={`${donutSegments().savingsLength} ${circumference}`}
            stroke-dashoffset={donutSegments().savingsOffset}
            stroke-linecap="round"
            class="transition-all duration-700 ease-out"
          />
        {/if}
      </svg>

      <!-- Center Typography -->
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {hasIncome ? 'Savings Rate' : 'Needs Ratio'}
        </span>
        <span class="text-2xl font-black tracking-tight text-white">
          {hasIncome ? `${stats.savingsPercentOfIncome}%` : `${stats.needsPercentOfTotal}%`}
        </span>
        <span class="text-[10px] text-slate-400">
          {hasIncome ? (stats.activeNetSurplus >= 0 ? 'Surplus' : 'Deficit') : 'Essential'}
        </span>
      </div>
    </div>

    <!-- Legend with clean indicator pills -->
    <div class="grid grid-cols-3 gap-1 pt-3 border-t border-slate-800/80 text-center">
      <div class="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div class="text-[10px] uppercase font-bold text-blue-400">Needs</div>
        <div class="text-xs font-bold text-white mt-0.5">
          {formatCurrency(stats.needsTotal, currency, 0)}
        </div>
      </div>
      <div class="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
        <div class="text-[10px] uppercase font-bold text-pink-400">Wants</div>
        <div class="text-xs font-bold text-white mt-0.5">
          {formatCurrency(whatIfActive ? stats.activeWantsTotal : stats.wantsTotal, currency, 0)}
        </div>
      </div>
      <div class="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div class="text-[10px] uppercase font-bold text-emerald-400">Savings</div>
        <div class="text-xs font-bold text-white mt-0.5">
          {hasIncome ? formatCurrency(stats.activeNetSurplus, currency, 0) : '—'}
        </div>
      </div>
    </div>
  </div>

  <!-- Category Breakdown List -->
  <div class="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-blue-400" />
          <h3 class="text-sm font-bold text-slate-200">Category Spending</h3>
        </div>
        <span class="text-[11px] text-slate-400">{categoryTotals().length} categories</span>
      </div>

      {#if categoryTotals().length === 0}
        <div class="py-12 text-center text-slate-500 text-xs">
          No items logged yet. Add your first expense or subscription!
        </div>
      {:else}
        <div class="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {#each categoryTotals().slice(0, 6) as cat}
            {@const maxCatAmount = categoryTotals()[0]?.amount || 1}
            {@const pctOfMax = Math.round((cat.amount / maxCatAmount) * 100)}
            <div class="group p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 transition">
              <div class="flex items-center justify-between text-xs mb-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-slate-200">{cat.name}</span>
                  <span class="text-[10px] text-slate-500">{cat.count} item{cat.count > 1 ? 's' : ''}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white">{formatCurrency(cat.amount, currency)}</span>
                  {#if onSelectCategoryFilter}
                    <button
                      type="button"
                      onclick={() => onSelectCategoryFilter(cat.id)}
                      class="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition"
                      title="Filter by this category"
                    >
                      <ArrowUpRight class="w-3.5 h-3.5" />
                    </button>
                  {/if}
                </div>
              </div>
              
              <!-- Stacked category mini-bar (Needs vs Wants within category) -->
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                {#if cat.needsAmount > 0}
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300" 
                    style="width: {(cat.needsAmount / (cat.amount || 1)) * pctOfMax}%"
                    title={`Needs: ${formatCurrency(cat.needsAmount, currency)}`}
                  ></div>
                {/if}
                {#if cat.wantsAmount > 0}
                  <div 
                    class="h-full bg-pink-500 transition-all duration-300" 
                    style="width: {(cat.wantsAmount / (cat.amount || 1)) * pctOfMax}%"
                    title={`Wants: ${formatCurrency(cat.wantsAmount, currency)}`}
                  ></div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if categoryTotals().length > 6}
      <div class="pt-2 text-center text-[11px] text-slate-500">
        + {categoryTotals().length - 6} more categories in item list
      </div>
    {/if}
  </div>
</div>
