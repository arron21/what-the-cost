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
    daily: 'DAILY COST',
    weekly: 'WEEKLY COST',
    monthly: 'MONTHLY COST',
    yearly: 'ANNUAL COST',
  }
</script>

<div class="space-y-6">
  <!-- Metric KPI Cards (4-Column Swiss Grid) -->
  <div class="raster-grid">
    <!-- 01. Total Cost -->
    <div class="col-3 col-lg-6">
      <div class="raster-card raster-card-accent-top">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>{horizonLabels[horizon]}</span>
            <span class="raster-mono">[ 01 ]</span>
          </div>
          <div class="raster-stat-value">
            {formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}
          </div>
          <div class="raster-stat-sub">
            {#if whatIfActive && stats.simulatedSavings > 0}
              <span class="raster-delta raster-delta-positive">-{formatCurrency(stats.simulatedSavings, currency)}</span>
              <span class="raster-mono">WAS {formatCurrency(stats.totalOutflow, currency)}</span>
            {:else if hasIncome}
              <span>of {formatCurrency(stats.income, currency)} baseline</span>
            {:else}
              <span class="raster-mono">UNBENCHMARKED</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 02. Needs -->
    <div class="col-3 col-lg-6">
      <div class="raster-card">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span class="flex items-center gap-1.5">
              NEEDS <span class="raster-tag raster-tag-solid" style="font-size: 9px; padding: 1px 4px;">REQ</span>
            </span>
            <span class="raster-mono">[ 02 ]</span>
          </div>
          <div class="raster-stat-value">
            {formatCurrency(stats.needsTotal, currency)}
          </div>
          <div class="raster-stat-sub">
            <span class="raster-delta {hasIncome && stats.needsPercentOfIncome > 50 ? 'raster-delta-negative' : 'raster-delta-positive'}">
              {hasIncome ? `${stats.needsPercentOfIncome}% OF INC` : `${stats.needsPercentOfTotal}% OF TOT`}
            </span>
            <span class="raster-mono">GOAL: ~50%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 03. Wants -->
    <div class="col-3 col-lg-6">
      <div class="raster-card">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span class="flex items-center gap-1.5">
              WANTS <span class="raster-tag" style="font-size: 9px; padding: 1px 4px;">OPT</span>
            </span>
            <span class="raster-mono">[ 03 ]</span>
          </div>
          <div class="raster-stat-value" style={whatIfActive && stats.cutWantsCount > 0 ? 'color: var(--raster-accent);' : ''}>
            {formatCurrency(whatIfActive ? stats.activeWantsTotal : stats.wantsTotal, currency)}
          </div>
          <div class="raster-stat-sub">
            <span class="raster-delta {hasIncome && stats.wantsPercentOfIncome > 30 ? 'raster-delta-negative' : 'raster-delta-positive'}">
              {hasIncome ? `${stats.wantsPercentOfIncome}% OF INC` : `${stats.wantsPercentOfTotal}% OF TOT`}
            </span>
            <span class="raster-mono">GOAL: ~30%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 04. Savings / Surplus -->
    <div class="col-3 col-lg-6">
      <div class="raster-card">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>SAVINGS / SURPLUS</span>
            <span class="raster-mono">[ 04 ]</span>
          </div>
          <div class="raster-stat-value" style={hasIncome && stats.activeNetSurplus < 0 ? 'color: var(--raster-accent);' : ''}>
            {hasIncome ? formatCurrency(stats.activeNetSurplus, currency) : '—'}
          </div>
          <div class="raster-stat-sub">
            {#if hasIncome}
              <span class="raster-delta {stats.activeNetSurplus >= 0 ? 'raster-delta-positive' : 'raster-delta-negative'}">
                {stats.savingsPercentOfIncome}% SAVED
              </span>
              <span class="raster-mono">GOAL: ~20%</span>
            {:else}
              <span class="raster-mono">ADD INCOME IN CONFIG</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 50/30/20 Budget Health Metric Card -->
  {#if hasIncome}
    <div class="raster-card">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-2">
        <div class="raster-label">50 / 30 / 20 BUDGET HEALTH ALLOCATION</div>
        <div class="raster-label raster-mono flex flex-wrap gap-x-4">
          <span style="color: var(--raster-fg-primary);">■ NEEDS: {stats.needsPercentOfIncome}%</span>
          <span style="color: var(--raster-accent);">■ WANTS: {stats.wantsPercentOfIncome}%</span>
          <span style="color: var(--raster-signal-emerald);">■ SAVINGS: {stats.savingsPercentOfIncome}%</span>
        </div>
      </div>

      <!-- Segmented Multi-Bar -->
      <div class="raster-segmented-bar" style="height: 12px;">
        <div 
          style="width: {Math.min(100, stats.needsPercentOfIncome)}%; background-color: var(--raster-fg-primary);" 
          title={`Needs: ${stats.needsPercentOfIncome}% of income (ideal: ~50%)`}
        ></div>
        <div 
          style="width: {Math.min(100, stats.wantsPercentOfIncome)}%; background-color: var(--raster-accent);" 
          title={`Wants: ${stats.wantsPercentOfIncome}% of income (ideal: ~30%)`}
        ></div>
        <div 
          style="width: {Math.min(100, Math.max(0, 100 - stats.needsPercentOfIncome - stats.wantsPercentOfIncome))}%; background-color: var(--raster-signal-emerald);" 
          title={`Savings: ${stats.savingsPercentOfIncome}% of income (ideal: ~20%)`}
        ></div>
      </div>

      <div class="flex justify-between mt-2 raster-label" style="font-size: 10px;">
        <span>TARGET: 50% NEEDS</span>
        <span>TARGET: 30% WANTS</span>
        <span>TARGET: 20% SAVINGS</span>
      </div>
    </div>
  {/if}
</div>
