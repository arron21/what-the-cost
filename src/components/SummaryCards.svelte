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
    daily: 'Daily cost',
    weekly: 'Weekly cost',
    monthly: 'Monthly cost',
    yearly: 'Annual cost',
  }
</script>

<div class="space-y-4 sm:space-y-5">
  <!-- 4 Studio Gray KPI Surface Wells (Refined Neo-Swiss / Motus pattern) -->
  <div class="raster-grid">
    <!-- 01. Total Outflow -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card-subtle">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>{horizonLabels[horizon]}</span>
            <span>Total</span>
          </div>
          <div class="raster-stat-value">
            {formatCurrency(whatIfActive ? stats.activeTotalOutflow : stats.totalOutflow, currency)}
          </div>
          <div class="raster-stat-sub">
            {#if whatIfActive && stats.simulatedSavings > 0}
              <span class="raster-delta" style="color: var(--raster-signal-emerald); font-weight: 500;">
                -{formatCurrency(stats.simulatedSavings, currency)}
              </span>
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
      <div class="raster-card-subtle">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>Needs</span>
            <span>Req · ~50%</span>
          </div>
          <div class="raster-stat-value">
            {formatCurrency(stats.needsTotal, currency)}
          </div>
          <div class="raster-stat-sub">
            <span class="raster-delta">
              {hasIncome ? `${stats.needsPercentOfIncome}% of income` : `${stats.needsPercentOfTotal}% of total`}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 03. Wants -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card-subtle">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>Wants</span>
            <span>Opt · ~30%</span>
          </div>
          <div class="raster-stat-value" style={whatIfActive && stats.cutWantsCount > 0 ? 'color: var(--raster-fg-muted); text-decoration: line-through;' : ''}>
            {formatCurrency(whatIfActive ? stats.activeWantsTotal : stats.wantsTotal, currency)}
          </div>
          <div class="raster-stat-sub">
            <span class="raster-delta">
              {hasIncome ? `${stats.wantsPercentOfIncome}% of income` : `${stats.wantsPercentOfTotal}% of total`}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 04. Savings & Surplus -->
    <div class="col-3 col-lg-6 col-sm-6 col-xs-12">
      <div class="raster-card-subtle">
        <div class="raster-stat">
          <div class="raster-stat-label">
            <span>Surplus</span>
            <span>Saved · ~20%</span>
          </div>
          <div class="raster-stat-value">
            {hasIncome ? formatCurrency(stats.activeNetSurplus, currency) : '—'}
          </div>
          <div class="raster-stat-sub">
            {#if hasIncome}
              <span class="raster-delta">
                {stats.savingsPercentOfIncome}% saved
              </span>
            {:else}
              <span>Requires income setup</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 50/30/20 Budget Health Metric Card -->
  {#if hasIncome}
    <div class="raster-card-subtle">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <span class="text-xs text-muted">50 / 30 / 20 budget target</span>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-secondary">
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2 h-2 inline-block" style="background-color: var(--raster-fg-primary);"></span>
            Needs: <strong>{stats.needsPercentOfIncome}%</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2 h-2 inline-block" style="background-color: var(--raster-fg-muted);"></span>
            Wants: <strong>{stats.wantsPercentOfIncome}%</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2 h-2 inline-block" style="background-color: var(--raster-signal-emerald);"></span>
            Savings: <strong>{stats.savingsPercentOfIncome}%</strong>
          </span>
        </div>
      </div>

      <!-- Segmented Multi-Bar -->
      <div class="raster-segmented-bar" style="height: 6px;">
        <div 
          style="width: {Math.min(100, stats.needsPercentOfIncome)}%; background-color: var(--raster-fg-primary);" 
          title={`Needs: ${stats.needsPercentOfIncome}% of income (target: ~50%)`}
        ></div>
        <div 
          style="width: {Math.min(100, stats.wantsPercentOfIncome)}%; background-color: var(--raster-fg-muted);" 
          title={`Wants: ${stats.wantsPercentOfIncome}% of income (target: ~30%)`}
        ></div>
        <div 
          style="width: {Math.min(100, Math.max(0, 100 - stats.needsPercentOfIncome - stats.wantsPercentOfIncome))}%; background-color: var(--raster-signal-emerald);" 
          title={`Savings: ${stats.savingsPercentOfIncome}% of income (target: ~20%)`}
        ></div>
      </div>

      <div class="flex justify-between mt-2 text-[11px] text-muted">
        <span>Target: 50% needs</span>
        <span>Target: 30% wants</span>
        <span>Target: 20% savings</span>
      </div>
    </div>
  {/if}
</div>
