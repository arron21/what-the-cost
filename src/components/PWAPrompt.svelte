<script lang="ts">
  import { onMount } from 'svelte'
  import { Download, WifiOff, X, Sparkles } from '@lucide/svelte'

  let deferredPrompt: any = $state(null)
  let showInstallBanner = $state(false)
  let isOffline = $state(false)

  onMount(() => {
    // Check initial online status
    isOffline = !navigator.onLine

    const handleOnline = () => (isOffline = false)
    const handleOffline = () => (isOffline = true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Capture PWA install prompt
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
  <div class="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2 font-medium animate-in fade-in">
    <WifiOff class="w-4 h-4" />
    <span>Working Offline. All data is securely saved in your local database.</span>
  </div>
{/if}

<!-- Install PWA Floating Banner -->
{#if showInstallBanner}
  <div class="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-4 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-5">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
          <Download class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
            Install What The Cost
          </h4>
          <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Add to home screen for instant offline launch, fullscreen budgeting, and zero load time.
          </p>
        </div>
      </div>
      <button
        type="button"
        onclick={() => (showInstallBanner = false)}
        class="text-slate-500 hover:text-slate-300 p-1"
        aria-label="Dismiss install prompt"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
      <button
        type="button"
        onclick={() => (showInstallBanner = false)}
        class="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
      >
        Not now
      </button>
      <button
        type="button"
        onclick={handleInstallClick}
        class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    </div>
  </div>
{/if}
