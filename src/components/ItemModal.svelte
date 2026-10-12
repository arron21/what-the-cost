<script lang="ts">
  import type { Frequency, Item, ItemType } from '../types'
  import { FREQUENCY_LABELS, PRESET_CATEGORIES } from '../types'
  import { X } from '@lucide/svelte'

  interface Props {
    isOpen: boolean
    editingItem: Item | null
    currency: string
    onClose: () => void
    onSave: (item: Item) => void
  }

  let { isOpen, editingItem, currency, onClose, onSave }: Props = $props()

  let name = $state('')
  let type = $state<ItemType>('need')
  let amount = $state<number | ''>('')
  let frequency = $state<Frequency>('monthly')
  let category = $state('housing')
  let tagInput = $state('')
  let tags = $state<string[]>([])
  let notes = $state('')
  let date = $state('')

  $effect(() => {
    if (editingItem) {
      name = editingItem.name
      type = editingItem.type
      amount = editingItem.amount
      frequency = editingItem.frequency
      category = editingItem.category
      tags = [...(editingItem.tags || [])]
      notes = editingItem.notes || ''
      date = editingItem.date || ''
    } else {
      resetForm()
    }
  })

  function resetForm() {
    name = ''
    type = 'need'
    amount = ''
    frequency = 'monthly'
    category = 'groceries'
    tagInput = ''
    tags = []
    notes = ''
    date = new Date().toISOString().slice(0, 10)
  }

  function addTag() {
    if (!tagInput.trim()) return
    const cleaned = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (!tags.includes(cleaned)) {
      tags = [...tags, cleaned]
    }
    tagInput = ''
  }

  function removeTag(t: string) {
    tags = tags.filter((x) => x !== t)
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (!name.trim() || amount === '' || Number(amount) <= 0) return

    const now = Date.now()
    const itemToSave: Item = {
      id: editingItem ? editingItem.id : `item_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      type,
      amount: Number(amount),
      frequency,
      category,
      tags,
      notes: notes.trim(),
      date: frequency === 'once' ? date || new Date().toISOString().slice(0, 10) : undefined,
      isSimulatedCut: editingItem ? editingItem.isSimulatedCut : false,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
    }

    onSave(itemToSave)
    onClose()
  }

  const frequencies: Frequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'once']
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="raster-modal-backdrop"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    tabindex="0"
    role="button"
    aria-label="Close modal backdrop"
  >
    <!-- Modal Card -->
    <div
      class="raster-modal-dialog"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex justify-between items-baseline pb-3 border-bottom mb-4">
        <div>
          <span class="raster-index">[ RECORD ]</span>
          <h3 class="raster-h3 inline ml-2">
            {editingItem ? 'EDIT ALLOCATION' : 'NEW ALLOCATION ENTRY'}
          </h3>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- 1. Need vs Want Classification -->
        <div class="raster-field">
          <span class="raster-field-label">CLASSIFICATION // NATURE OF COMMITMENT</span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => (type = 'need')}
              class="raster-btn py-3 {type === 'need' ? 'raster-btn-primary' : 'raster-btn-outline'}"
            >
              <span>NEED [ESSENTIAL]</span>
            </button>
            <button
              type="button"
              onclick={() => (type = 'want')}
              class="raster-btn py-3 {type === 'want' ? 'raster-btn-accent' : 'raster-btn-outline'}"
            >
              <span>WANT [DISCRETIONARY]</span>
            </button>
          </div>
          <span class="raster-mono text-muted text-xs">
            {type === 'need' ? '// Fixed survival costs: housing, basic sustenance, medical, utility.' : '// Non-essentials: dining out, entertainment, subscriptions, leisure.'}
          </span>
        </div>

        <!-- 2. Item Name -->
        <div class="raster-field">
          <label for="item-name" class="raster-field-label">ITEM / COMMITMENT IDENTIFIER *</label>
          <input
            id="item-name"
            type="text"
            bind:value={name}
            required
            placeholder="e.g. APARTMENT LEASE, MORNING ESPRESSO, CLOUD GAMING"
            class="raster-input font-bold"
          />
        </div>

        <!-- 3. Cost & Currency -->
        <div class="raster-field">
          <label for="item-amount" class="raster-field-label">MONETARY ALLOCATION ({currency}) *</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 raster-mono font-bold text-muted">
              {currency}
            </span>
            <input
              id="item-amount"
              type="number"
              step="any"
              min="0.01"
              bind:value={amount}
              required
              placeholder="0.00"
              class="raster-input pl-8 raster-stat-value text-xl font-bold"
            />
          </div>
        </div>

        <!-- 4. Recurrence Frequency -->
        <div class="raster-field">
          <span class="raster-field-label">RECURRENCE FREQUENCY // OCCURRENCE CADENCE *</span>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {#each frequencies as freq}
              <button
                type="button"
                onclick={() => (frequency = freq)}
                class="raster-btn {frequency === freq ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
              >
                {FREQUENCY_LABELS[freq].toUpperCase()}
              </button>
            {/each}
          </div>
        </div>

        <!-- Date (if One-Time) -->
        {#if frequency === 'once'}
          <div class="raster-field">
            <label for="item-date" class="raster-field-label">SETTLEMENT DATE</label>
            <input
              id="item-date"
              type="date"
              bind:value={date}
              class="raster-input raster-mono text-xs"
            />
          </div>
        {/if}

        <!-- 5. Category Selection -->
        <div class="raster-field">
          <label for="item-cat" class="raster-field-label">LEDGER CATEGORY</label>
          <select
            id="item-cat"
            bind:value={category}
            class="raster-select"
          >
            {#each PRESET_CATEGORIES as cat}
              <option value={cat.id}>{cat.name.toUpperCase()}</option>
            {/each}
          </select>
        </div>

        <!-- 6. Tags -->
        <div class="raster-field">
          <label for="tag-input-field" class="raster-field-label">INDEX TAGS (OPTIONAL)</label>
          <div class="flex gap-2">
            <input
              id="tag-input-field"
              type="text"
              bind:value={tagInput}
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="ENTER TAG AND PRESS ENTER"
              class="raster-input text-xs raster-mono flex-1"
            />
            <button
              type="button"
              onclick={addTag}
              class="raster-btn raster-btn-outline raster-btn-sm"
            >
              + ADD
            </button>
          </div>
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-1 mt-1">
              {#each tags as t}
                <span class="raster-tag">
                  #{t}
                  <button type="button" onclick={() => removeTag(t)} class="ml-1 text-muted hover:text-accent">✕</button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 7. Notes -->
        <div class="raster-field">
          <label for="item-notes" class="raster-field-label">MEMO / DUE DATE SPECIFICATION (OPTIONAL)</label>
          <input
            id="item-notes"
            type="text"
            bind:value={notes}
            placeholder="e.g. Due 1st of month, family tier"
            class="raster-input text-xs"
          />
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 pt-4 border-top">
          <button
            type="button"
            onclick={onClose}
            class="raster-btn raster-btn-ghost raster-btn-sm"
          >
            CANCEL
          </button>
          <button
            type="submit"
            class="raster-btn raster-btn-primary raster-btn-sm"
          >
            {editingItem ? 'SAVE ALLOCATION' : '+ CONFIRM ALLOCATION'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
