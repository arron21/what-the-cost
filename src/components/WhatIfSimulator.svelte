<script lang="ts">
  import type { BudgetStats, TimeHorizon } from '../types'
  import { formatCurrency, normalizeCost } from '../utils/costNormalizer'
  import { Sparkles, RotateCcw, Scissors, X } from '@lucide/svelte'

  interface Props {
    whatIfActive: boolean
    stats: BudgetStats
    horizon: TimeHorizon
    currency: string
    onToggleWhatIf: () => void
    onResetCuts: () => void
    onCutAllWants: () => void
  }

  let {
    whatIfActive,
    stats,
    horizon,
    currency,
    onToggleWhatIf,
    onResetCuts,
    onCutAllWants,
  }: Props = $props()

  const horizonSuffix: Record<TimeHorizon, string> = {
    daily: '/day',
    weekly: '/wk',
    monthly: '/mo',
    yearly: '/yr',
  }

  let annualSavings = $derived(
    horizon === 'yearly' 
      ? stats.simulatedSavings 
      : normalizeCost(stats.simulatedSavings, horizon === 'daily' ? 'daily' : horizon === 'weekly' ? 'weekly' : 'monthly', 'yearly')
  )
</script>

{#if whatIfActive}
  <div 
    class="raster-card p-4 sm:p-5" 
    style="border-left: 3px solid var(--raster-accent); background-color: var(--raster-surface);"
  >
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Sparkles class="w-3.5 h-3.5 text-secondary" style="color: var(--raster-accent);" />
          <span class="text-xs font-semibold uppercase tracking-wider text-primary">What-If Simulation</span>
        </div>
        <p class="text-sm text-secondary">
          {#if stats.cutWantsCount > 0}
            Cutting <strong>{stats.cutWantsCount}</strong> discretionary item{stats.cutWantsCount > 1 ? 's' : ''} saves
            <strong style="color: var(--raster-signal-emerald);">{formatCurrency(stats.simulatedSavings, currency)}</strong>{horizonSuffix[horizon]}
            <span class="text-muted">({formatCurrency(annualSavings, currency)}/yr)</span>
          {:else}
            Tap "Cut" on any discretionary want in the expenses list below to test how cutting it impacts your budget.
          {/if}
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0 w-full md:w-auto">
        {#if stats.cutWantsCount > 0}
          <button
            type="button"
            onclick={onResetCuts}
            class="raster-btn raster-btn-outline raster-btn-sm flex-1 md:flex-initial"
            title="Restore all cuts"
          >
            <RotateCcw class="w-3 h-3 mr-1" />
            <span>Reset</span>
          </button>
        {:else}
          <button
            type="button"
            onclick={onCutAllWants}
            class="raster-btn raster-btn-accent raster-btn-sm flex-1 md:flex-initial"
            title="Simulate cutting all wants"
          >
            <Scissors class="w-3 h-3 mr-1" />
            <span>Cut All Wants</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={onToggleWhatIf}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title="Exit Simulator"
        >
          <X class="w-3.5 h-3.5 mr-1" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  </div>
{/if}
