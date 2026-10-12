<script lang="ts">
  import { onMount } from 'svelte'

  let deferredPrompt: any = $state(null)
  let showInstallBanner = $state(false)
  let isOffline = $state(false)

  onMount(() => {
    isOffline = !navigator.onLine

    const handleOnline = () => (isOffline = false)
    const handleOffline = () => (isOffline = true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      // Only show if user hasn't dismissed it in this session
      if (sessionStorage.getItem('whatthecost_pwa_dismissed') === 'true') {
        return
      }
      deferredPrompt = e
      showInstallBanner = true
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  })

  function dismissBanner() {
    showInstallBanner = false
    sessionStorage.setItem('whatthecost_pwa_dismissed', 'true')
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismissBanner()
    }
    deferredPrompt = null
  }
</script>

<!-- Offline Status Indicator Banner -->
{#if isOffline}
  <div class="border-bottom py-2 px-4 text-center raster-mono text-xs font-bold" style="background-color: var(--raster-accent); color: #ffffff;">
    [ OFFLINE PROTOCOL ACTIVE // LOCAL INDEXEDDB IN EFFECT ]
  </div>
{/if}

<!-- Install PWA Architectural Card (Fixed at bottom right, never in document flow) -->
{#if showInstallBanner}
  <aside 
    class="pwa-floating-prompt"
    style="position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 9999 !important; width: 360px; max-width: calc(100vw - 48px);"
    aria-label="PWA Installation Prompt"
  >
    <div 
      class="raster-card raster-card-accent-top"
      style="box-shadow: var(--raster-shadow-hard-lg); background-color: var(--raster-surface); padding: var(--raster-space-4);"
    >
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <span 
            style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: var(--raster-accent); color: #ffffff; font-weight: 800; font-family: var(--raster-font-mono); font-size: 12px; border-radius: var(--raster-radius);"
          >
            +
          </span>
          <span class="raster-label font-bold text-primary">INSTALL PWA LAUNCHER</span>
        </div>
        <button
          type="button"
          onclick={dismissBanner}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          style="padding: 2px 6px; font-size: 11px;"
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      </div>

      <p class="raster-small text-secondary mb-3" style="font-size: 12px; line-height: 1.45;">
        Install What The Cost to home screen for fullscreen offline launch, persistent local database, and zero latency.
      </p>

      <div class="flex justify-end gap-2 border-top pt-2.5">
        <button
          type="button"
          onclick={dismissBanner}
          class="raster-btn raster-btn-ghost raster-btn-sm"
        >
          LATER
        </button>
        <button
          type="button"
          onclick={handleInstallClick}
          class="raster-btn raster-btn-primary raster-btn-sm"
        >
          + INSTALL
        </button>
      </div>
    </div>
  </aside>
{/if}
