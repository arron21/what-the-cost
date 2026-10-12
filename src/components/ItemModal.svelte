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
      <div class="flex justify-between items-center pb-3 border-bottom mb-4">
        <h3 class="text-base font-bold text-primary">
          {editingItem ? 'Edit Expense' : 'Add Expense'}
        </h3>
        <button
          type="button"
          onclick={onClose}
          class="raster-btn raster-btn-ghost raster-btn-sm"
          aria-label="Close modal"
        >
          <X class="w-4 h-4 text-muted hover:text-primary" />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- 1. Type: Need vs Want -->
        <div class="space-y-1.5">
          <div class="block text-xs font-semibold text-secondary">Expense Classification</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => (type = 'need')}
              class="raster-btn py-2.5 {type === 'need' ? 'raster-btn-primary' : 'raster-btn-outline'}"
              style="font-size: 13px; font-weight: 600;"
            >
              Need (Essential)
            </button>
            <button
              type="button"
              onclick={() => (type = 'want')}
              class="raster-btn py-2.5 {type === 'want' ? 'raster-btn-accent' : 'raster-btn-outline'}"
              style="font-size: 13px; font-weight: 600;"
            >
              Want (Discretionary)
            </button>
          </div>
          <p class="text-[11px] text-muted">
            {type === 'need' ? 'Essentials like housing, groceries, utilities, and transport.' : 'Discretionary spending like dining out, entertainment, and hobbies.'}
          </p>
        </div>

        <!-- 2. Item Name -->
        <div class="space-y-1.5">
          <label for="item-name" class="block text-xs font-semibold text-secondary">Name</label>
          <input
            id="item-name"
            type="text"
            bind:value={name}
            required
            placeholder="e.g. Rent, Groceries, Netflix"
            class="raster-input w-full text-sm"
            style="min-height: 42px;"
          />
        </div>

        <!-- 3. Cost & Currency -->
        <div class="space-y-1.5">
          <label for="item-amount" class="block text-xs font-semibold text-secondary">Amount ({currency})</label>
          <div class="relative flex items-center">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted pointer-events-none select-none text-sm">
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
              class="raster-input w-full text-base font-bold"
              style="padding-left: 2.25rem !important; min-height: 42px;"
            />
          </div>
        </div>

        <!-- 4. Recurrence Frequency -->
        <div class="space-y-1.5">
          <div class="block text-xs font-semibold text-secondary">Frequency</div>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {#each frequencies as freq}
              <button
                type="button"
                onclick={() => (frequency = freq)}
                class="raster-btn {frequency === freq ? 'raster-btn-primary' : 'raster-btn-outline'} raster-btn-sm"
                style="font-size: 11px; font-weight: 500; min-height: 36px;"
              >
                {FREQUENCY_LABELS[freq]}
              </button>
            {/each}
          </div>
        </div>

        <!-- If frequency is once: Date input -->
        {#if frequency === 'once'}
          <div class="space-y-1.5">
            <label for="item-date" class="block text-xs font-semibold text-secondary">Date</label>
            <input
              id="item-date"
              type="date"
              bind:value={date}
              class="raster-input w-full text-xs"
              style="min-height: 42px;"
            />
          </div>
        {/if}

        <!-- 5. Category Selection -->
        <div class="space-y-1.5">
          <label for="item-category" class="block text-xs font-semibold text-secondary">Category</label>
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
        <div class="space-y-1.5">
          <label for="item-tags" class="block text-xs font-semibold text-secondary">Tags (Optional)</label>
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
              placeholder="Type tag and press Add"
              class="raster-input flex-1 text-xs"
              style="min-height: 40px;"
            />
            <button
              type="button"
              onclick={addTag}
              class="raster-btn raster-btn-outline raster-btn-sm px-3"
            >
              Add Tag
            </button>
          </div>

          {#if tags.length > 0}
            <div class="flex flex-wrap gap-1.5 mt-2">
              {#each tags as t}
                <span class="inline-flex items-center gap-1 text-xs bg-surface-subtle border border-border px-2 py-0.5">
                  #{t}
                  <button
                    type="button"
                    onclick={() => removeTag(t)}
                    class="text-muted hover:text-primary text-xs ml-1"
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
        <div class="space-y-1.5">
          <label for="item-notes" class="block text-xs font-semibold text-secondary">Notes (Optional)</label>
          <textarea
            id="item-notes"
            bind:value={notes}
            placeholder="Add any extra details or renewal reminders..."
            class="raster-textarea w-full text-xs"
            rows="2"
          ></textarea>
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center justify-end gap-2 pt-4 border-top">
          <button
            type="button"
            onclick={onClose}
            class="raster-btn raster-btn-ghost raster-btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="raster-btn raster-btn-primary"
            style="min-width: 120px;"
          >
            {editingItem ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
