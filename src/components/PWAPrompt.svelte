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

  async function handleInstallClick() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      showInstallBanner = false
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

<!-- Install PWA Architectural Card -->
{#if showInstallBanner}
  <div 
    class="fixed bottom-6 right-6 z-40 max-w-sm w-[calc(100%-3rem)] raster-card raster-card-accent-top"
    style="box-shadow: var(--raster-shadow-hard-lg);"
  >
    <div class="flex justify-between items-start mb-2">
      <div class="flex items-center gap-2">
        <span class="badge-swiss" style="padding: 1px 5px; font-size: 10px;">+</span>
        <span class="raster-label font-bold text-primary">INSTALL PWA LAUNCHER</span>
      </div>
      <button
        type="button"
        onclick={() => (showInstallBanner = false)}
        class="text-muted hover:text-primary text-xs"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>

    <p class="raster-small text-secondary mb-4">
      Install What The Cost to home screen for fullscreen offline launch and zero network latency.
    </p>

    <div class="flex justify-end gap-2 border-top pt-3">
      <button
        type="button"
        onclick={() => (showInstallBanner = false)}
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
{/if}
