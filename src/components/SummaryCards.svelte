<script lang="ts">
  import type { BudgetStats, TimeHorizon } from '../types'
  import { formatCurrency } from '../utils/costNormalizer'

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

<div class="space-y-5 sm:space-y-6">
  <!-- Metric KPI Cards: 4 columns on desktop, clean 2x2 on mobile -->
  <div class="raster-grid">
    <!-- 01. Total Outflow -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card p-5 sm:p-6">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>{horizonLabels[horizon]} Outflow</span>
          </div>
          <div class="raster-stat-value text-2xl sm:text-3xl font-bold tracking-tight mt-1 mb-1.5">
            {formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}
          </div>
          <div class="raster-stat-sub text-xs text-muted">
            {#if whatIfActive && stats.simulatedSavings > 0}
              <span class="raster-delta raster-delta-positive">-{formatCurrency(stats.simulatedSavings, currency)}</span>
              <span>simulated</span>
            {:else if hasIncome}
              <span>of {formatCurrency(stats.income, currency)} income</span>
            {:else}
              <span>Set income in settings</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 02. Needs -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card p-5 sm:p-6">
        <div class="raster-stat">
          <div class="raster-stat-label flex items-center justify-between">
            <span>Needs</span>
            <span class="text-[10px] text-muted font-normal">Target ~50%</span>
          </div>
          <div class="raster-stat-value text-2xl sm:text-3xl font-bold tracking-tight mt-1 mb-1.5">
            {formatCurrency(stats.needsTotal, currency)}
          </div>
          <div class="raster-stat-sub text-xs">
            <span class="raster-delta {hasIncome && stats.needsPercentOfIncome > 50 ? 'raster-delta-negative' : 'raster-delta-positive'}">
              {hasIncome ? `${stats.needsPercentOfIncome}% of income` : `${stats.needsPercentOfTotal}% of total`}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 03. Wants -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card p-5 sm:p-6">
        <div class="raster-stat">
          <div class="raster-stat-label flex items-center justify-between">
            <span>Wants</span>
            <span class="text-[10px] text-muted font-normal">Target ~30%</span>
          </div>
          <div class="raster-stat-value text-2xl sm:text-3xl font-bold tracking-tight mt-1 mb-1.5" style={whatIfActive && stats.cutWantsCount > 0 ? 'color: var(--raster-accent);' : ''}>
            {formatCurrency(whatIfActive ? stats.activeWantsTotal : stats.wantsTotal, currency)}
          </div>
          <div class="raster-stat-sub text-xs">
            <span class="raster-delta {hasIncome && stats.wantsPercentOfIncome > 30 ? 'raster-delta-negative' : 'raster-delta-positive'}">
              {hasIncome ? `${stats.wantsPercentOfIncome}% of income` : `${stats.wantsPercentOfTotal}% of total`}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 04. Savings & Surplus -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card p-5 sm:p-6">
        <div class="raster-stat">
          <div class="raster-stat-label flex items-center justify-between">
            <span>Savings / Surplus</span>
            <span class="text-[10px] text-muted font-normal">Target ~20%</span>
          </div>
          <div class="raster-stat-value text-2xl sm:text-3xl font-bold tracking-tight mt-1 mb-1.5" style={hasIncome && stats.activeNetSurplus < 0 ? 'color: var(--raster-accent);' : ''}>
            {hasIncome ? formatCurrency(stats.activeNetSurplus, currency) : '—'}
          </div>
          <div class="raster-stat-sub text-xs">
            {#if hasIncome}
              <span class="raster-delta {stats.activeNetSurplus >= 0 ? 'raster-delta-positive' : 'raster-delta-negative'}">
                {stats.savingsPercentOfIncome}% saved
              </span>
            {:else}
              <span class="text-muted">Requires income setup</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 50/30/20 Budget Health Metric Card -->
  {#if hasIncome}
    <div class="raster-card p-5 sm:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-secondary">50 / 30 / 20 Budget Target</span>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-secondary">
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: var(--raster-fg-primary);"></span>
            Needs: <strong>{stats.needsPercentOfIncome}%</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: var(--raster-accent);"></span>
            Wants: <strong>{stats.wantsPercentOfIncome}%</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: var(--raster-signal-emerald);"></span>
            Savings: <strong>{stats.savingsPercentOfIncome}%</strong>
          </span>
        </div>
      </div>

      <!-- Segmented Multi-Bar -->
      <div class="raster-segmented-bar" style="height: 10px;">
        <div 
          style="width: {Math.min(100, stats.needsPercentOfIncome)}%; background-color: var(--raster-fg-primary);" 
          title={`Needs: ${stats.needsPercentOfIncome}% of income (target: ~50%)`}
        ></div>
        <div 
          style="width: {Math.min(100, stats.wantsPercentOfIncome)}%; background-color: var(--raster-accent);" 
          title={`Wants: ${stats.wantsPercentOfIncome}% of income (target: ~30%)`}
        ></div>
        <div 
          style="width: {Math.min(100, Math.max(0, 100 - stats.needsPercentOfIncome - stats.wantsPercentOfIncome))}%; background-color: var(--raster-signal-emerald);" 
          title={`Savings: ${stats.savingsPercentOfIncome}% of income (target: ~20%)`}
        ></div>
      </div>

      <div class="flex justify-between mt-2.5 text-[11px] text-muted">
        <span>Target: 50% Needs</span>
        <span>Target: 30% Wants</span>
        <span>Target: 20% Savings</span>
      </div>
    </div>
  {/if}
</div>
