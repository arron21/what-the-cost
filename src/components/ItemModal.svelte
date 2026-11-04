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

  // Grouped frequencies for balanced layout
  const recurringFrequencies: Frequency[] = ['monthly', 'weekly', 'biweekly', 'daily']
  const secondaryFrequencies: { freq: Frequency; span: string }[] = [
    { freq: 'yearly', span: 'col-span-1' },
    { freq: 'quarterly', span: 'col-span-1' },
    { freq: 'once', span: 'col-span-2' },
  ]
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
      <div class="flex justify-between items-center pb-4 mb-6 border-b border-border">
        <h3 class="raster-h2">
          {editingItem ? 'Edit expense' : 'New expense'}
        </h3>
        <button
          type="button"
          onclick={onClose}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          style="padding: 6px 8px;"
          aria-label="Close modal"
        >
          <X class="w-4 h-4 text-muted hover:text-primary" />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-5">
        <!-- 1. Type: Need vs Want -->
        <div>
          <div class="raster-field-label mb-2">
            Expense classification
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onclick={() => (type = 'need')}
              class="raster-btn py-3 {type === 'need' ? 'raster-btn-primary' : 'raster-btn-outline'}"
              style="font-size: 13px; font-weight: 500;"
            >
              Need (Essential)
            </button>
            <button
              type="button"
              onclick={() => (type = 'want')}
              class="raster-btn py-3 {type === 'want' ? 'raster-btn-primary' : 'raster-btn-outline'}"
              style="font-size: 13px; font-weight: 500;"
            >
              Want (Discretionary)
            </button>
          </div>
          <p class="text-xs text-muted mt-2 leading-relaxed">
            {type === 'need' 
              ? 'Fixed essentials like housing, groceries, utilities, and transport.' 
              : 'Discretionary spending like dining out, entertainment, and leisure.'}
          </p>
        </div>

        <!-- 2 & 3. Name & Amount (Side-by-side on tablet/desktop) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Name -->
          <div class="sm:col-span-2 raster-field">
            <label for="item-name" class="raster-field-label">
              Name *
            </label>
            <input
              id="item-name"
              type="text"
              bind:value={name}
              required
              placeholder="e.g. Rent, Groceries, Cloud storage"
              class="raster-input w-full text-sm"
              style="min-height: 42px;"
            />
          </div>

          <!-- Amount -->
          <div class="raster-field">
            <label for="item-amount" class="raster-field-label">
              Amount ({currency}) *
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted pointer-events-none select-none text-sm">
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
                class="raster-input w-full text-base"
                style="padding-left: 2rem !important; min-height: 42px;"
              />
            </div>
          </div>
        </div>

        <!-- 4. Recurrence Frequency -->
        <div>
          <div class="raster-field-label mb-2">
            Frequency
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {#each recurringFrequencies as freq}
              <button
                type="button"
                onclick={() => (frequency = freq)}
                class="raster-btn py-2 {frequency === freq ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
                style="font-size: 11px; font-weight: 400; min-height: 36px;"
              >
                {FREQUENCY_LABELS[freq]}
              </button>
            {/each}

            {#each secondaryFrequencies as item}
              <button
                type="button"
                onclick={() => (frequency = item.freq)}
                class="raster-btn py-2 {item.span} {frequency === item.freq ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
                style="font-size: 11px; font-weight: 400; min-height: 36px;"
              >
                {FREQUENCY_LABELS[item.freq]}
              </button>
            {/each}
          </div>
        </div>

        <!-- If frequency is once: Date input -->
        {#if frequency === 'once'}
          <div class="raster-field p-3 bg-surface">
            <label for="item-date" class="raster-field-label">
              Transaction date
            </label>
            <input
              id="item-date"
              type="date"
              bind:value={date}
              class="raster-input w-full text-xs"
              style="min-height: 38px;"
            />
          </div>
        {/if}

        <!-- 5. Category Selection -->
        <div class="raster-field">
          <label for="item-category" class="raster-field-label">
            Category
          </label>
          <select
            id="item-category"
            bind:value={category}
            class="raster-select w-full text-sm"
            style="min-height: 42px;"
          >
            {#each PRESET_CATEGORIES as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <!-- 6. Tags -->
        <div class="raster-field">
          <label for="item-tags" class="raster-field-label">
            Tags (Optional)
          </label>
          <div class="flex gap-2">
            <input
              id="item-tags"
              type="text"
              bind:value={tagInput}
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="e.g. fixed, subscription, essentials"
              class="raster-input flex-1 text-xs"
              style="min-height: 38px;"
            />
            <button
              type="button"
              onclick={addTag}
              class="raster-btn raster-btn-outline px-3 shrink-0"
              style="min-height: 38px; font-size: 11px;"
            >
              Add tag
            </button>
          </div>

          {#if tags.length > 0}
            <div class="flex flex-wrap gap-1.5 pt-1">
              {#each tags as t}
                <span class="raster-tag inline-flex items-center gap-1.5">
                  #{t}
                  <button
                    type="button"
                    onclick={() => removeTag(t)}
                    class="text-muted hover:text-primary text-xs ml-0.5"
                    aria-label={`Remove tag ${t}`}
                  >
                    ✕
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 7. Notes -->
        <div class="raster-field">
          <label for="item-notes" class="raster-field-label">
            Notes (Optional)
          </label>
          <textarea
            id="item-notes"
            bind:value={notes}
            placeholder="Add any extra details, renewal reminders, or payment notes..."
            class="raster-textarea w-full text-xs"
            rows="2"
            style="min-height: 60px;"
          ></textarea>
        </div>

        <!-- Modal Actions Footer -->
        <div class="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-border">
          <button
            type="button"
            onclick={onClose}
            class="raster-btn raster-btn-ghost"
            style="font-size: 13px;"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="raster-btn raster-btn-primary"
            style="min-width: 130px; font-size: 13px;"
          >
            {editingItem ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
