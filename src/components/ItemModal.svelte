<script lang="ts">
  import type { Frequency, Item, ItemType } from '../types'
  import { FREQUENCY_LABELS, PRESET_CATEGORIES } from '../types'
  import { X, ShieldCheck, Sparkles, Check } from '@lucide/svelte'

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

  // Watch editingItem changes
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
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    tabindex="0"
    role="button"
    aria-label="Close modal backdrop"
  >
    <!-- Modal Card / Mobile Bottom Sheet -->
    <div
      class="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 relative text-slate-100"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          {#if editingItem}
            <span>Edit Item</span>
          {:else}
            <span>Add New Item / Expense</span>
          {/if}
        </h3>
        <button
          type="button"
          onclick={onClose}
          class="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4 pt-4">
        <!-- 1. Need vs Want Toggle (The Core Differentiator) -->
        <div>
          <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Classification
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => (type = 'need')}
              class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all {type === 'need' ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-2 ring-blue-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
            >
              <ShieldCheck class="w-4 h-4 text-blue-400" />
              <span>NEED (Essential)</span>
            </button>
            <button
              type="button"
              onclick={() => (type = 'want')}
              class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all {type === 'want' ? 'bg-pink-600/30 border-pink-500 text-pink-300 ring-2 ring-pink-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
            >
              <Sparkles class="w-4 h-4 text-pink-400" />
              <span>WANT (Discretionary)</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">
            {type === 'need' ? 'Essential commitments like rent, groceries, medicine, commute.' : 'Non-essentials like dining out, subscriptions, fun gear, coffee.'}
          </p>
        </div>

        <!-- 2. Item Name -->
        <div>
          <label for="item-name" class="block text-xs font-semibold text-slate-400 mb-1">
            Item / Service Name *
          </label>
          <input
            id="item-name"
            type="text"
            bind:value={name}
            required
            placeholder="e.g. Morning Latte, Rent, Netflix, Gym"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <!-- 3. Cost & Currency -->
        <div>
          <label for="item-amount" class="block text-xs font-semibold text-slate-400 mb-1">
            Cost Amount *
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
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
              class="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 4. Frequency Selector Pills -->
        <div>
          <span class="block text-xs font-semibold text-slate-400 mb-1.5">
            How often does this cost occur? *
          </span>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {#each frequencies as freq}
              <button
                type="button"
                onclick={() => (frequency = freq)}
                class="py-2 px-2 text-xs font-semibold rounded-lg border text-center transition {frequency === freq ? 'bg-slate-800 border-blue-500 text-blue-400 font-bold' : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'}"
              >
                {FREQUENCY_LABELS[freq]}
              </button>
            {/each}
          </div>
        </div>

        <!-- If One-Time: Date picker -->
        {#if frequency === 'once'}
          <div>
            <label for="item-date" class="block text-xs font-semibold text-slate-400 mb-1">
              Purchase Date
            </label>
            <input
              id="item-date"
              type="date"
              bind:value={date}
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        {/if}

        <!-- 5. Category Selection -->
        <div>
          <label for="item-cat" class="block text-xs font-semibold text-slate-400 mb-1">
            Category
          </label>
          <select
            id="item-cat"
            bind:value={category}
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {#each PRESET_CATEGORIES as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <!-- 6. Tags -->
        <div>
          <label for="tag-input-field" class="block text-xs font-semibold text-slate-400 mb-1">
            Tags (optional)
          </label>
          <div class="flex items-center gap-2 mb-2">
            <input
              id="tag-input-field"
              type="text"
              bind:value={tagInput}
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add tag (e.g. coffee, fixed) and press Enter"
              class="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onclick={addTag}
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700"
            >
              Add
            </button>
          </div>
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-1.5">
              {#each tags as t}
                <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  #{t}
                  <button type="button" onclick={() => removeTag(t)} class="hover:text-rose-400 ml-0.5">✕</button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 7. Notes (Optional) -->
        <div>
          <label for="item-notes" class="block text-xs font-semibold text-slate-400 mb-1">
            Notes / Due Date info (optional)
          </label>
          <input
            id="item-notes"
            type="text"
            bind:value={notes}
            placeholder="e.g. Billed on the 15th, includes family plan"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onclick={onClose}
            class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition flex items-center gap-1.5"
          >
            <Check class="w-4 h-4" />
            <span>{editingItem ? 'Save Changes' : 'Add Item'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
