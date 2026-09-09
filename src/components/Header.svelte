<script lang="ts">
  import type { TimeHorizon } from '../types'
  import { Sun, Moon, Settings, Plus, Sparkles } from '@lucide/svelte'

  interface Props {
    timeHorizon: TimeHorizon
    theme: 'dark' | 'light'
    whatIfActive: boolean
    onSelectHorizon: (horizon: TimeHorizon) => void
    onToggleTheme: () => void
    onOpenSettings: () => void
    onOpenAddModal: () => void
    onToggleWhatIf: () => void
  }

  let {
    timeHorizon,
    theme,
    whatIfActive,
    onSelectHorizon,
    onToggleTheme,
    onOpenSettings,
    onOpenAddModal,
    onToggleWhatIf
  }: Props = $props()

  const horizons: { id: TimeHorizon; label: string; short: string }[] = [
    { id: 'daily', label: 'Day', short: 'Day' },
    { id: 'weekly', label: 'Week', short: 'Wk' },
    { id: 'monthly', label: 'Month', short: 'Mo' },
    { id: 'yearly', label: 'Year', short: 'Yr' },
  ]
</script>

<header class="sticky top-0 z-30 backdrop-blur-md bg-slate-950/85 dark:bg-slate-950/85 border-b border-slate-800/80 transition-colors">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-3">
    <div class="flex items-center justify-between gap-3">
      <!-- Logo & App Name -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <span class="text-white font-black text-lg tracking-tight">$</span>
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-tight">
            What The Cost
            <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hidden sm:inline-block">PWA</span>
          </h1>
          <p class="text-[11px] text-slate-400 font-medium truncate hidden sm:block">Needs vs. Wants Budgeting</p>
        </div>
      </div>

      <!-- Time Horizon Toggle (Segmented Controller) -->
      <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
        {#each horizons as h}
          <button
            type="button"
            onclick={() => onSelectHorizon(h.id)}
            class="px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all {timeHorizon === h.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}"
            title={`View normalized per ${h.label.toLowerCase()}`}
          >
            {h.short}
          </button>
        {/each}
      </div>

      <!-- Header Action Controls -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <!-- What-If Mode Toggle Button -->
        <button
          type="button"
          onclick={onToggleWhatIf}
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border {whatIfActive ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 ring-1 ring-pink-500/50' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'}"
          title="Toggle 'What-If I Cut This Want?' Simulator Mode"
        >
          <Sparkles class="w-3.5 h-3.5 {whatIfActive ? 'text-pink-400 animate-spin' : 'text-slate-400'}" />
          <span class="hidden md:inline">What-If</span>
          {#if whatIfActive}
            <span class="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
          {/if}
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          onclick={onToggleTheme}
          class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Toggle Light/Dark Theme"
          aria-label="Toggle Theme"
        >
          {#if theme === 'dark'}
            <Sun class="w-4 h-4 text-amber-400" />
          {:else}
            <Moon class="w-4 h-4 text-slate-300" />
          {/if}
        </button>

        <!-- Settings Button -->
        <button
          type="button"
          onclick={onOpenSettings}
          class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Settings & Data Export/Import"
          aria-label="Settings"
        >
          <Settings class="w-4 h-4" />
        </button>

        <!-- Add Item Button (visible on desktop) -->
        <button
          type="button"
          onclick={onOpenAddModal}
          class="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/30 active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  </div>
</header>
