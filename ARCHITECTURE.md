# 🏛️ Architecture & System Design Documentation

This document explains the technical architecture, design patterns, database design, and key system flows of **TheWallet**.

---

## 🗺️ High-Level Design Principles

The application is engineered around several core architectural tenets:

1. **Local-First & Offline Resilience**: No cloud backend is required for standard application operations. Data is persistently stored, queried, and updated directly inside the browser using IndexedDB. This yields sub-millisecond latencies, 100% offline functionality, and maximum user privacy.
2. **Reactive Data Binding**: UI components never query the database once; instead, they establish a live reactive subscription to IndexedDB queries. Changes made by any modal or action immediately propagate across all currently mounted screens.
3. **Strict Separation of Concerns**: Database operations, global layout routing, and UI presentation are cleanly separated. State is lifted responsibly to allow consistent layouts.

---

## 🗄️ Database Schema & Relationships

We utilize **Dexie.js** as our IndexedDB object-relational mapping (ORM) wrapper. The database is named `TheWalletDB` and defines three primary tables:

```text
  [Profiles] 1 ──── ⚛ ──── 0..* [Accounts] 1 ──── ⚛ ──── 0..* [Transactions]
  (Separate workspaces)        (e.g., Cash, Credit)        (Incomes & Expenses)
```

### Table Schemas (defined in `src/db.ts`)

#### 1. `profiles`
The root container representing a sandboxed profile.
- **Primary Store Index**: `++id, name`
- **TypeScript Interface**:
  ```typescript
  export interface Profile {
    id?: number;
    name: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    createdAt: number;
  }
  ```

#### 2. `accounts`
Associated with a specific profile. Can represent physical cash, bank checking accounts, credit lines, etc.
- **Primary Store Index**: `++id, profileId, name, type`
- **TypeScript Interface**:
  ```typescript
  export interface Account {
    id?: number;
    profileId: number;
    name: string;
    type: 'cash' | 'bank' | 'savings' | 'credit' | 'other';
    currency: string;
    initialBalance: number;
    createdAt: number;
  }
  ```

#### 3. `transactions`
The immutable ledger elements representing real-world inflows (income) or outflows (expense) under an account.
- **Primary Store Index**: `++id, accountId, type, date, category`
- **TypeScript Interface**:
  ```typescript
  export interface Transaction {
    id?: number;
    accountId: number;
    type: 'income' | 'expense';
    amount: number;
    date: number; // UTC Unix timestamp
    category: string;
    notes?: string;
    createdAt: number;
  }
  ```

---

## 🔗 Data Synchronization Flow

All components use `useLiveQuery` from `dexie-react-hooks` to fetch real-time updates. This creates an automatic reactive loop:

```text
┌─────────────────┐       (Triggers mutation)       ┌──────────────────┐
│   React UI /    ├────────────────────────────────>│     Dexie DB     │
│   Action Button │                                 │  (IndexedDB)     │
└────────┬────────┘                                 └────────┬─────────┘
         │                                                   │
         │             (Auto-emits database change)          │
         └<──────────────────────────────────────────────────┘
```

**Example (Dashboard calculations):**
```typescript
const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray());
const transactions = useLiveQuery(async () => {
  if (accounts.length === 0) return [];
  const accountIds = accounts.map(a => a.id).filter(Boolean);
  return db.transactions.where('accountId').anyOf(accountIds).reverse().sortBy('date');
}, [accounts]);
```
Whenever a transaction is added, edited, or deleted in the database, the dashboard recalculates values (Total Balance, Expenses, Income, Recent Lists) instantly without requiring manual page refreshes.

---

## 🏗️ Navigation & Active Tab Routing

Global state is orchestrated in `/src/App.tsx`:
- **Current Profile**: Managed via `localStorage` key `currentProfileId`.
- **Portal Entry**: If no profile ID is selected (or when onboarding), the user is presented with the `/src/components/Welcome.tsx` view where they can create, import, or select profiles.
- **Interactive Tabs**: Once inside a profile, the persistent structural shell `/src/components/Layout.tsx` presents five views:
  - **Dashboard**: High-level financial overview, Recharts charts, and a quick list of recent transactions.
  - **Accounts**: Manage balances, add bank/savings containers, and delete individual accounts.
  - **Activity (Transactions)**: Full search-friendly, sortable ledger history with editing controls.
  - **Reports**: Advanced category analytics filtering with high-precision custom period constraints.
  - **Settings**: Backup controls, JSON importing, and profile wiping tools.

---

## 💎 Design Polish & Visual Quality

The application strictly adheres to high-craft visual patterns:

- **Invisible Input Date Indicators**: Web browsers show clunky, platform-specific date selector buttons. The global `/src/index.css` hides the webkit native picker icon (`::-webkit-calendar-picker-indicator` set to opacity 0) while overlays of beautiful SVG `Calendar` icons from `lucide-react` provide a seamless, unified design language across operating systems.
- **Perfect Center Aligned Date Picker Text**: Inputs inside reports and transaction editors utilize absolute positioning paired with custom padding-left/right and `text-center` utilities to center-align selection metrics perfectly inside their rounded containers.
- **Always Visible Action Utilities**: Button groups (e.g. row edits, deletions) remain clearly visible at all times, preventing usability hurdles where users are forced to guess hover actions.
- **Fluid Layout Intersect transitions**: Route overlays, portal views, and the create/edit transaction sheet integrate spring physics animations (`motion/react`) for intuitive depth and feedback.
- **Intentional Safety Interlocks**: Destructive operations such as profile or database resets use multi-stage confirmation flows (with automatic timeout decays) to prevent accidental data loss.
