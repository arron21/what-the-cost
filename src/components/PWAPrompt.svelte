<script lang="ts">
  import { onMount } from 'svelte'
  import { Download, X, WifiOff } from '@lucide/svelte'

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
  <div class="py-1.5 px-4 text-center text-xs font-medium flex items-center justify-center gap-1.5 bg-neutral-900 text-white dark:bg-neutral-800">
    <WifiOff class="w-3.5 h-3.5 text-secondary" />
    <span>Offline mode — Changes saved locally in your browser</span>
  </div>
{/if}

<!-- Install PWA Floating Card (Fixed at bottom right) -->
{#if showInstallBanner}
  <aside 
    class="pwa-floating-prompt"
    style="position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 9999 !important; width: 340px; max-width: calc(100vw - 32px);"
    aria-label="App Installation Prompt"
  >
    <div 
      class="raster-card p-4"
      style="box-shadow: var(--raster-shadow-hard); background-color: var(--raster-surface);"
    >
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <Download class="w-4 h-4 text-primary" />
          <span class="font-bold text-xs text-primary">Install What The Cost</span>
        </div>
        <button
          type="button"
          onclick={dismissBanner}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          style="padding: 2px 6px;"
          aria-label="Dismiss install prompt"
        >
          <X class="w-3.5 h-3.5 text-muted hover:text-primary" />
        </button>
      </div>

      <p class="text-xs text-secondary mb-3 leading-relaxed">
        Install to your home screen for quick offline launch and native app experience.
      </p>

      <div class="flex justify-end gap-2 border-top pt-2.5">
        <button
          type="button"
          onclick={dismissBanner}
          class="raster-btn raster-btn-ghost raster-btn-sm text-xs"
        >
          Not now
        </button>
        <button
          type="button"
          onclick={handleInstallClick}
          class="raster-btn raster-btn-primary raster-btn-sm text-xs"
        >
          Install
        </button>
      </div>
    </div>
  </aside>
{/if}
