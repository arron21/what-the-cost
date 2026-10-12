<script lang="ts">
  import type { TimeHorizon } from '../types'
  import { Settings, Sun, Moon, Plus, Sparkles } from '@lucide/svelte'

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

  const horizons: { id: TimeHorizon; label: string }[] = [
    { id: 'daily', label: 'Day' },
    { id: 'weekly', label: 'Week' },
    { id: 'monthly', label: 'Month' },
    { id: 'yearly', label: 'Year' },
  ]
</script>

<header class="raster-masthead" style="border-bottom: 1px solid var(--raster-border); background-color: var(--raster-surface);">
  <div class="raster-container">
    <!-- Top Row: Brand & Quick Controls -->
    <div class="flex items-center justify-between py-3.5 sm:py-4 gap-3">
      <!-- Brand -->
      <div class="flex items-center gap-2.5">
        <span 
          style="display: inline-block; width: 8px; height: 8px; background: var(--raster-accent); border-radius: 1px;"
          aria-hidden="true"
        ></span>
        <span style="font-family: var(--raster-font-display); font-weight: 700; font-size: 1.15rem; letter-spacing: -0.02em; color: var(--raster-fg-primary);">
          What The Cost
        </span>
      </div>

      <!-- Desktop Horizon Switcher (Centered on desktop) -->
      <div class="hidden sm:inline-flex raster-btn-group">
        {#each horizons as h}
          <button
            type="button"
            onclick={() => onSelectHorizon(h.id)}
            class="raster-btn {timeHorizon === h.id ? 'is-active' : ''}"
            style="min-width: 60px; font-size: 12px; font-weight: 500;"
          >
            {h.label}
          </button>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- What-If Simulator Toggle -->
        <button
          type="button"
          onclick={onToggleWhatIf}
          class="raster-btn {whatIfActive ? 'raster-btn-accent' : 'raster-btn-outline'} raster-btn-sm"
          title="Toggle What-If Simulator"
          style="font-size: 11px; font-weight: 600;"
        >
          <Sparkles class="w-3 h-3 mr-1" />
          <span>{whatIfActive ? 'What-If On' : 'What-If'}</span>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          onclick={onToggleTheme}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
          style="padding: 6px 8px;"
        >
          {#if theme === 'dark'}
            <Sun class="w-4 h-4 text-secondary" />
          {:else}
            <Moon class="w-4 h-4 text-secondary" />
          {/if}
        </button>

        <!-- Settings Button -->
        <button
          type="button"
          onclick={onOpenSettings}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title="Settings"
          aria-label="Settings"
          style="padding: 6px 8px;"
        >
          <Settings class="w-4 h-4 text-secondary" />
        </button>

        <!-- Add Allocation Button (Desktop only, mobile has FAB) -->
        <button
          type="button"
          onclick={onOpenAddModal}
          class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
          style="font-size: 12px; font-weight: 600;"
        >
          <Plus class="w-3.5 h-3.5 mr-1" />
          <span>Add</span>
        </button>
      </div>
    </div>

    <!-- Mobile Horizon Switcher (Full-width row on mobile <= 640px) -->
    <div class="sm:hidden pb-3 pt-1">
      <div class="raster-btn-group raster-btn-group-responsive w-full">
        {#each horizons as h}
          <button
            type="button"
            onclick={() => onSelectHorizon(h.id)}
            class="raster-btn {timeHorizon === h.id ? 'is-active' : ''}"
            style="font-size: 12px; font-weight: 500; min-height: 38px;"
          >
            {h.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
</header>
