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

<header class="raster-masthead" style="border-bottom: 1px solid var(--raster-border); background-color: var(--raster-canvas);">
  <div class="raster-container">
    <!-- Top Row: Brand, Centered Underlined Tabs & Quick Controls -->
    <div class="flex items-center justify-between py-3 sm:py-3.5 gap-4">
      <!-- Brand -->
      <div class="raster-brand">
        <span>What The Cost</span>
      </div>

      <!-- Desktop Horizon Switcher (Quiet Underlined Tab Strip) -->
      <nav class="hidden sm:inline-flex raster-btn-group" aria-label="Time Horizon">
        {#each horizons as h}
          <button
            type="button"
            onclick={() => onSelectHorizon(h.id)}
            class="raster-btn {timeHorizon === h.id ? 'is-active' : ''}"
            style="padding: 4px 6px;"
          >
            {h.label}
          </button>
        {/each}
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- What-If Simulator Toggle -->
        <button
          type="button"
          onclick={onToggleWhatIf}
          class="raster-btn {whatIfActive ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
          title="Toggle What-If sandbox simulation"
          style="font-size: 11px;"
        >
          <Sparkles class="w-3 h-3 mr-1" />
          <span>{whatIfActive ? 'What-If on' : 'What-If'}</span>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          onclick={onToggleTheme}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle Theme"
          style="padding: 6px 8px;"
        >
          {#if theme === 'dark'}
            <Sun class="w-3.5 h-3.5" />
          {:else}
            <Moon class="w-3.5 h-3.5" />
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
          <Settings class="w-3.5 h-3.5" />
        </button>

        <!-- Add Allocation Button (Desktop only, mobile has FAB) -->
        <button
          type="button"
          onclick={onOpenAddModal}
          class="raster-btn raster-btn-primary raster-btn-sm hidden sm:inline-flex"
        >
          <Plus class="w-3.5 h-3.5 mr-1" />
          <span>Add expense</span>
        </button>
      </div>
    </div>

    <!-- Mobile Horizon Switcher (Full-width row on mobile <= 640px) -->
    <div class="sm:hidden pb-2.5 pt-0.5 border-t border-border-subtle flex justify-around">
      <div class="raster-btn-group w-full flex justify-between px-2">
        {#each horizons as h}
          <button
            type="button"
            onclick={() => onSelectHorizon(h.id)}
            class="raster-btn {timeHorizon === h.id ? 'is-active' : ''}"
            style="flex: 1; text-align: center; padding: 6px 0;"
          >
            {h.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
</header>
