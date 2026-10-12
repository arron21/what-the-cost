<script lang="ts">
  import type { BudgetStats, TimeHorizon } from '../types'
  import { formatCurrency, normalizeCost } from '../utils/costNormalizer'

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

  // Compute annualized simulated savings
  let annualSavings = $derived(
    horizon === 'yearly' 
      ? stats.simulatedSavings 
      : normalizeCost(stats.simulatedSavings, horizon === 'daily' ? 'daily' : horizon === 'weekly' ? 'weekly' : 'monthly', 'yearly')
  )
</script>

{#if whatIfActive}
  <div class="raster-callout raster-callout-accent" style="background-color: var(--raster-surface); border: 1px solid var(--raster-border); border-left: 3px solid var(--raster-accent);">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="raster-label raster-label-accent">// SANDBOX SIMULATOR ACTIVE</span>
          <span class="raster-tag raster-tag-accent" style="font-size: 9px; padding: 1px 4px;">EXPERIMENTAL</span>
        </div>
        <p class="raster-body text-sm" style="color: var(--raster-fg-primary);">
          {#if stats.cutWantsCount > 0}
            Simulating cutting <strong style="color: var(--raster-accent);">{stats.cutWantsCount}</strong> discretionary item{stats.cutWantsCount > 1 ? 's' : ''}:
            Reclaiming <strong class="raster-mono" style="color: var(--raster-signal-emerald);">{formatCurrency(stats.simulatedSavings, currency)}</strong>/{horizon === 'daily' ? 'day' : horizon === 'weekly' ? 'wk' : horizon === 'monthly' ? 'mo' : 'yr'}
            <span class="raster-mono text-muted">({formatCurrency(annualSavings, currency)} / yr)</span>
          {:else}
            Tap any <strong style="color: var(--raster-accent);">Want</strong> in the ledger below to simulate cutting it and observe real-time capital retention.
          {/if}
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        {#if stats.cutWantsCount > 0}
          <button
            type="button"
            onclick={onResetCuts}
            class="raster-btn raster-btn-outline raster-btn-sm"
            title="Restore all simulated cuts"
          >
            <span>[ RESET CUTS ]</span>
          </button>
        {:else}
          <button
            type="button"
            onclick={onCutAllWants}
            class="raster-btn raster-btn-accent raster-btn-sm"
            title="Simulate cutting all non-essentials"
          >
            <span>[ CUT ALL WANTS ]</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={onToggleWhatIf}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title="Exit Sandbox Mode"
        >
          <span>✕ CLOSE</span>
        </button>
      </div>
    </div>
  </div>
{/if}
