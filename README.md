# What The Cost — Smart Needs & Wants Budgeting (PWA)

**What The Cost** is a fast, privacy-first budgeting Progressive Web App built to answer the fundamental question: *“What does my life actually cost me?”*

Instead of overwhelming spreadsheets, everything entered into What The Cost is classified as either an essential **Need** or a discretionary **Want**. The app normalizes daily, weekly, monthly, quarterly, and yearly expenses into any target time-horizon on the fly, compares your spending to the **50/30/20 budget benchmark**, and features an interactive **"What-If" Cut Simulator** so you can see how much annual cash you reclaim by trimming non-essentials.

🌐 **Live Demo**: [https://arron21.github.io/what-the-cost/](https://arron21.github.io/what-the-cost/)

---

## 🌟 Key Features

- **Needs vs. Wants Focus**: Clearly distinguish between fixed survival essentials and discretionary lifestyle spending.
- **Unified Time-Horizon Switcher**: Instantly toggle all figures between **Day, Week, Month, and Year** (`Day` | `Wk` | `Mo` | `Yr`).
- **Interactive "What-If" Cut Simulator**: Sandbox mode to simulate disabling wants—instantly calculating reclaimed cash and improved savings rates without modifying actual records.
- **50 / 30 / 20 Budget Health Meter**: Benchmarks your spending against the classic rule of thumb (50% Needs, 30% Wants, 20% Savings).
- **Time-Cost / Wage Math**: Enter your income to see what each purchase costs you in *hours and minutes of work* (e.g. *"$100 concert = 3h 52m of work"*).
- **Fast Quick-Add Bottom Sheet**: Log recurring expenses or one-off transactions in seconds with preset categories and custom tags.
- **100% Local-First & Private**: Powered by browser IndexedDB (Dexie.js). Zero accounts, zero tracking, zero remote servers.
- **Offline PWA Support**: Installable on iOS, Android, macOS, and Windows with offline service worker caching.
- **Complete Data Portability**: Export and import your data anytime via **JSON backups** and **CSV spreadsheets**.

---

## 🛠️ Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (Runes reactivity)
- **Tooling**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide Svelte](https://lucide.dev/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox Service Worker)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Clone or navigate to directory
cd what-the-cost

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will start at `http://localhost:5173/`.

### Production Build

```bash
npm run build
npm run preview
```

### Type Checking & Diagnostics

```bash
npm run check
```

### Verification Tests

```bash
node --experimental-strip-types tests/verify-calculations.mjs
```
