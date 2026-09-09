<script lang="ts">
  import type { BudgetStats, TimeHorizon } from '../types'
  import { formatCurrency } from '../utils/costNormalizer'
  import { ShieldCheck, Sparkles, PiggyBank, ArrowDownRight, TrendingUp } from '@lucide/svelte'

  interface Props {
    stats: BudgetStats
    horizon: TimeHorizon
    currency: string
    whatIfActive: boolean
    hasIncome: boolean
  }

  let { stats, horizon, currency, whatIfActive, hasIncome }: Props = $props()

  const horizonLabels: Record<TimeHorizon, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Annual',
  }
</script>

<div class="space-y-4">
  <!-- Top 4 Summary Cards Grid -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <!-- Total Cost Card -->
    <div class="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">{horizonLabels[horizon]} Cost</span>
        <div class="p-1.5 rounded-lg bg-slate-800 text-slate-300">
          <ArrowDownRight class="w-4 h-4" />
        </div>
      </div>
      <div>
        <div class="text-xl sm:text-2xl font-black tracking-tight text-white">
          {formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}
        </div>
        {#if whatIfActive && stats.simulatedSavings > 0}
          <div class="text-[11px] text-pink-400 font-medium flex items-center gap-1 mt-0.5">
            <span>Was {formatCurrency(stats.totalOutflow, currency)}</span>
          </div>
        {:else if hasIncome}
          <div class="text-[11px] text-slate-400 font-medium mt-0.5">
            of {formatCurrency(stats.income, currency)} income
          </div>
        {/if}
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-700 to-slate-600"></div>
    </div>

    <!-- Needs Card (Blue) -->
    <div class="bg-slate-900/80 backdrop-blur border border-blue-900/40 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-700/60 transition">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-blue-400">Needs</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">Req</span>
        </div>
        <div class="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
          <ShieldCheck class="w-4 h-4" />
        </div>
      </div>
      <div>
        <div class="text-xl sm:text-2xl font-black tracking-tight text-blue-200">
          {formatCurrency(stats.needsTotal, currency)}
        </div>
        <div class="text-[11px] font-medium flex items-center justify-between text-slate-400 mt-0.5">
          <span>{hasIncome ? `${stats.needsPercentOfIncome}% of income` : `${stats.needsPercentOfTotal}% of total`}</span>
          <span class="text-slate-500">Goal: ~50%</span>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1 bg-blue-500"></div>
    </div>

    <!-- Wants Card (Pink) -->
    <div class="bg-slate-900/80 backdrop-blur border border-pink-900/40 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-pink-700/60 transition">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-pink-400">Wants</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-medium">Opt</span>
        </div>
        <div class="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
          <Sparkles class="w-4 h-4" />
        </div>
      </div>
      <div>
        <div class="text-xl sm:text-2xl font-black tracking-tight text-pink-200">
          {formatCurrency(whatIfActive ? stats.activeWantsTotal : stats.wantsTotal, currency)}
        </div>
        <div class="text-[11px] font-medium flex items-center justify-between text-slate-400 mt-0.5">
          <span>{hasIncome ? `${stats.wantsPercentOfIncome}% of income` : `${stats.wantsPercentOfTotal}% of total`}</span>
          <span class="text-slate-500">Goal: ~30%</span>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1 bg-pink-500"></div>
    </div>

    <!-- Savings / Cash Flow Card (Emerald) -->
    <div class="bg-slate-900/80 backdrop-blur border border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-700/60 transition">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Savings / Surplus</span>
        <div class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <PiggyBank class="w-4 h-4" />
        </div>
      </div>
      <div>
        {#if hasIncome}
          <div class="text-xl sm:text-2xl font-black tracking-tight {stats.activeNetSurplus >= 0 ? 'text-emerald-300' : 'text-rose-400'}">
            {formatCurrency(stats.activeNetSurplus, currency)}
          </div>
          <div class="text-[11px] font-medium flex items-center justify-between text-slate-400 mt-0.5">
            <span>{stats.savingsPercentOfIncome}% saved</span>
            <span class="text-slate-500">Goal: ~20%</span>
          </div>
        {:else}
          <div class="text-sm font-semibold text-slate-400">
            No Income Set
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5">
            Add income in Settings to see savings rate
          </div>
        {/if}
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1 {hasIncome && stats.activeNetSurplus < 0 ? 'bg-rose-500' : 'bg-emerald-500'}"></div>
    </div>
  </div>

  <!-- 50/30/20 Benchmark Visualizer Bar -->
  {#if hasIncome}
    <div class="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <TrendingUp class="w-3.5 h-3.5 text-blue-400" />
          <span class="font-bold text-slate-300">50 / 30 / 20 Budget Health Metric</span>
        </div>
        <div class="flex items-center gap-3 text-[11px] font-medium">
          <span class="flex items-center gap-1 text-blue-400"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Needs: {stats.needsPercentOfIncome}%</span>
          <span class="flex items-center gap-1 text-pink-400"><span class="w-2 h-2 rounded-full bg-pink-500"></span> Wants: {stats.wantsPercentOfIncome}%</span>
          <span class="flex items-center gap-1 text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Savings: {stats.savingsPercentOfIncome}%</span>
        </div>
      </div>

      <!-- Segmented Bar -->
      <div class="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
        <!-- Needs Segment -->
        <div 
          class="h-full bg-blue-500 rounded-l-full transition-all duration-500" 
          style="width: {Math.min(100, stats.needsPercentOfIncome)}%"
          title={`Needs: ${stats.needsPercentOfIncome}% of income (ideal: ~50%)`}
        ></div>
        <!-- Wants Segment -->
        <div 
          class="h-full bg-pink-500 transition-all duration-500" 
          style="width: {Math.min(100, stats.wantsPercentOfIncome)}%"
          title={`Wants: ${stats.wantsPercentOfIncome}% of income (ideal: ~30%)`}
        ></div>
        <!-- Savings Segment -->
        <div 
          class="h-full bg-emerald-500 rounded-r-full transition-all duration-500" 
          style="width: {Math.min(100, Math.max(0, 100 - stats.needsPercentOfIncome - stats.wantsPercentOfIncome))}%"
          title={`Savings: ${stats.savingsPercentOfIncome}% of income (ideal: ~20%)`}
        ></div>
      </div>

      <div class="flex justify-between text-[10px] text-slate-500 px-0.5">
        <span>Target: 50% Needs</span>
        <span>Target: 30% Wants</span>
        <span>Target: 20% Savings</span>
      </div>
    </div>
  {/if}
</div>
