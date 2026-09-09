<script lang="ts">
  import type { BudgetStats, TimeHorizon } from '../types'
  import { formatCurrency, normalizeCost } from '../utils/costNormalizer'
  import { Sparkles, X, RotateCcw, Scissors, ArrowRight, CheckCircle2 } from '@lucide/svelte'

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

  // Compute annualized simulated savings to show big picture
  let annualSavings = $derived(
    horizon === 'yearly' 
      ? stats.simulatedSavings 
      : normalizeCost(stats.simulatedSavings, horizon === 'daily' ? 'daily' : horizon === 'weekly' ? 'weekly' : 'monthly', 'yearly')
  )

  let monthlySavings = $derived(
    horizon === 'monthly'
      ? stats.simulatedSavings
      : normalizeCost(stats.simulatedSavings, horizon === 'daily' ? 'daily' : horizon === 'weekly' ? 'weekly' : 'yearly', 'monthly')
  )
</script>

{#if whatIfActive}
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-950/60 via-purple-950/40 to-slate-900 border border-pink-500/40 p-4 shadow-xl shadow-pink-950/20 animate-in fade-in duration-300">
    <!-- Ambient glow -->
    <div class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl pointer-events-none"></div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
      <!-- Info header -->
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0 mt-0.5 sm:mt-0">
          <Scissors class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm sm:text-base font-bold text-pink-200 flex items-center gap-1.5">
              "What-If" Cut Simulator Active
            </h3>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-300 border border-pink-500/40">
              Sandbox
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-0.5">
            {#if stats.cutWantsCount > 0}
              Simulating cutting <span class="font-bold text-white">{stats.cutWantsCount}</span> item{stats.cutWantsCount > 1 ? 's' : ''}:
              Reclaiming <span class="font-bold text-emerald-400">{formatCurrency(stats.simulatedSavings, currency)}</span>/{horizon === 'daily' ? 'day' : horizon === 'weekly' ? 'wk' : horizon === 'monthly' ? 'mo' : 'yr'}
              <span class="text-slate-400">({formatCurrency(annualSavings, currency)}/year)!</span>
            {:else}
              Tap any <span class="font-semibold text-pink-300">Want</span> below to simulate cutting it and watch your annual savings jump!
            {/if}
          </p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
        {#if stats.cutWantsCount > 0}
          <button
            type="button"
            onclick={onResetCuts}
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700"
            title="Restore all simulated cuts"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        {:else}
          <button
            type="button"
            onclick={onCutAllWants}
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-900/50 hover:bg-pink-800/70 text-xs font-semibold text-pink-200 transition border border-pink-700/50"
            title="Simulate cutting all wants to see baseline essential expenses"
          >
            <Scissors class="w-3.5 h-3.5" />
            <span>Cut All Wants</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={onToggleWhatIf}
          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
          title="Exit Simulator"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
{/if}
