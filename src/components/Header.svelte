<script lang="ts">
  import type { TimeHorizon } from '../types'
  import { Settings } from '@lucide/svelte'

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

<header class="raster-masthead">
  <div class="raster-container">
    <div class="raster-masthead-inner flex-wrap gap-y-3">
      <!-- Left: Swiss Brand Lockup -->
      <div class="flex items-center gap-3">
        <span 
          style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: var(--raster-accent); color: #ffffff; font-weight: 800; font-family: var(--raster-font-mono); font-size: 15px; border-radius: var(--raster-radius);"
          title="Swiss Design System"
        >
          +
        </span>
        <div class="flex items-baseline gap-2">
          <span style="font-family: var(--raster-font-display); font-weight: 800; font-size: 1.25rem; letter-spacing: -0.03em; color: var(--raster-fg-primary);">
            WHAT THE COST
          </span>
          <span class="raster-tag raster-tag-accent">PWA</span>
        </div>
        <span class="raster-label hidden md:inline" style="border-left: 1px solid var(--raster-border); padding-left: 12px; margin-left: 4px;">
          Needs vs. Wants Ledger
        </span>
      </div>

      <!-- Right: Horizon Switcher & Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Segmented Time Period Filter -->
        <div class="raster-btn-group">
          {#each horizons as h}
            <button
              type="button"
              onclick={() => onSelectHorizon(h.id)}
              class="raster-btn {timeHorizon === h.id ? 'is-active' : ''}"
              title={`View normalized per ${h.label.toLowerCase()}`}
            >
              {h.short}
            </button>
          {/each}
        </div>

        <!-- What-If Simulator Toggle -->
        <button
          type="button"
          onclick={onToggleWhatIf}
          class="raster-btn {whatIfActive ? 'raster-btn-accent' : 'raster-btn-outline'} raster-btn-sm"
          title="Toggle 'What-If I Cut This Want?' Sandbox Simulator"
        >
          <span>{whatIfActive ? '● SANDBOX ON' : 'SIMULATE WHAT-IF'}</span>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          onclick={onToggleTheme}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title="Toggle Carbon (Dark) / Paper (Light) Theme"
          aria-label="Toggle Theme"
        >
          <span>{theme === 'dark' ? '◐ CARBON' : '◐ PAPER'}</span>
        </button>

        <!-- Settings Button -->
        <button
          type="button"
          onclick={onOpenSettings}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title="Configuration & Data Backup"
          aria-label="Settings"
        >
          <Settings class="w-3.5 h-3.5" />
          <span class="hidden lg:inline">CONFIG</span>
        </button>

        <!-- Add Allocation Button -->
        <button
          type="button"
          onclick={onOpenAddModal}
          class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
        >
          <span>+ ALLOCATION</span>
        </button>
      </div>
    </div>
  </div>
</header>
