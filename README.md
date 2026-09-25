# 💳 TheWallet - Personal Finance & Portfolio Manager

A highly-crafted, visually modern, and responsive personal finance application designed for local-first, multi-profile account and transaction management. Built with **React 19**, **Vite**, **Tailwind CSS v4**, **Dexie.js** (IndexedDB), and **Motion** for fluid animations.

---

## ✨ Features

- 👤 **Multi-Profile System**: Separate environments for different profiles (e.g., Personal, Business, Joint) with secure sandboxed data storage.
- 🏦 **Comprehensive Account Management**: Track multiple accounts of various types—Cash, Bank, Savings, Credit Cards, or other customized vehicles.
- 💸 **Activity & Transaction Ledger**: Register incomes and expenses, organize with categories and tags, and add customizable notes.
- 📊 **Dynamic Reports & Interactive Analytics**:
  - Filter transactions by date period seamlessly with interactive sliders/inputs.
  - Category breakdown visualizations with interactive pie charts (utilizing Recharts).
  - Staggered bar charts tracking last 7 days of historical spending.
- 💾 **Local-First & Offline Resilience**: Instant UI updates and durable offline persistence with Dexie-backed IndexedDB database.
- 📥 **Export / Import Utilities**: Keep your data safe with JSON-formatted backup export and overwrite-based import utilities.
- 🎨 **Designed with Craftsmanship**: Elegant transitions, responsive layouts, high contrast typography using **Inter** and modern slate color schemes.

---

## 🛠️ Technology Stack

The application leverages a lightweight, production-grade local-first architecture:

| Library / Tool | Purpose | Key Details |
| :--- | :--- | :--- |
| **React 19** | UI Framework | Declarative, component-driven reactive structure |
| **TypeScript** | Type Safety | Strict contract definitions for data models and states |
| **Vite** | Build Tooling | Lightning-fast dev server with bundle size optimizations |
| **Dexie.js** | Client-side Storage | High-performance transactional IndexedDB wrapper |
| **Tailwind CSS v4** | Aesthetic Styling | Custom utility framework, modern color palette |
| **Motion** | Fluid Animations | Smooth micro-interactions, layout transitions, modals |
| **Recharts** | Data Visualizations | SVGs charting engine for trends and category splits |

---

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (v18+) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation

1. Clone the project repository.
2. Install the workspace dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the interactive development server:
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### Production Build

Create an optimized static distribution of the application:
```bash
npm run build
```
This produces production-ready build artifacts in the `dist/` directory, which can be instantly deployed to any static host (e.g., Cloud Run, Vercel, Netlify).

---

## 📂 Code Structure

A quick overview of how the codebase is organized:

```text
├── src/
│   ├── App.tsx             # Root application coordinator and navigation
│   ├── main.tsx            # Main Web entry point
│   ├── index.css           # Global Tailwind stylesheet and layout rules
│   ├── db.ts               # Dexie.js database client and collection schemas
│   ├── lib/
│   │   └── utils.ts        # CN styling helper for dynamic Tailwind logic
│   └── components/         # Modular, reusable presentation & logic components
│       ├── Welcome.tsx             # Multi-profile onboarding and portal selection
│       ├── Dashboard.tsx           # Home screen with analytics, summaries, and recents
│       ├── Accounts.tsx            # Account listing, balances, and deletion controls
│       ├── Transactions.tsx        # Searchable, paginated ledger with detail viewing
│       ├── TransactionModal.tsx    # Create and Edit transaction interface
│       ├── Reports.tsx             # Category progress and date range analysis
│       ├── Settings.tsx            # JSON backup tools, reset database, profile management
│       └── Layout.tsx              # Adaptive navigation bars and main page structure
```

---

## 🔒 Security & Privacy

Since **TheWallet** is a **local-first** app:
- **No data is ever uploaded** to external servers or third parties.
- All transactional ledgers and account metrics remain strictly inside your browser's sandboxed IndexedDB database (`TheWalletDB`).
- To transfer profiles across devices, utilize the secure Backup/Export mechanism available in the **Settings** tab.
