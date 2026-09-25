/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';

/**
 * Creates or retrieves the Demo Profile pre-populated with 6 months of financial data.
 * Shows consistent savings growth and rich analytics for visualization.
 */
export async function createOrOpenDemoProfile(): Promise<number> {
  // Check if a profile named "Demo Profile" already exists
  const existing = await db.profiles.where('name').equals('Demo Profile').first();
  if (existing && existing.id) {
    return existing.id;
  }

  // Create Demo Profile with accounts and 6 months of dummy data in a single transaction
  return await db.transaction('rw', [db.profiles, db.accounts, db.transactions], async () => {
    const profileId = await db.profiles.add({
      name: 'Demo Profile',
      currency: 'USD',
      theme: 'light',
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    });

    const numProfileId = Number(profileId);

    // Create 3 realistic accounts
    const checkingId = Number(await db.accounts.add({
      profileId: numProfileId,
      name: 'Primary Checking',
      type: 'bank',
      currency: 'USD',
      initialBalance: 3200,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    }));

    const savingsId = Number(await db.accounts.add({
      profileId: numProfileId,
      name: 'High-Yield Savings',
      type: 'savings',
      currency: 'USD',
      initialBalance: 5000,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    }));

    const creditId = Number(await db.accounts.add({
      profileId: numProfileId,
      name: 'Everyday Rewards Card',
      type: 'credit',
      currency: 'USD',
      initialBalance: 0,
      createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    }));

    // Generate past 6 months of transactions
    const now = new Date();
    const transactionsToInsert = [];

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      // Base date for each month
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const getDateTimestamp = (day: number) => {
        const d = new Date(year, month, Math.min(day, 28), 12, 0, 0);
        return d.getTime();
      };

      // 1. Monthly Salary Income ($4,200 on the 1st)
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'income' as const,
        amount: 4200,
        date: getDateTimestamp(1),
        category: 'Salary',
        notes: 'Monthly Paycheck',
        createdAt: getDateTimestamp(1),
      });

      // 2. Side Hustle / Freelance Income ($850 - $1,150 on the 15th)
      const freelanceAmt = 850 + ((monthOffset * 75) % 300);
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'income' as const,
        amount: freelanceAmt,
        date: getDateTimestamp(15),
        category: 'Freelance',
        notes: 'Client Design Project',
        createdAt: getDateTimestamp(15),
      });

      // 3. Monthly Savings Contribution ($1,000 - $1,200 into Savings on 5th)
      transactionsToInsert.push({
        accountId: savingsId,
        type: 'income' as const,
        amount: 1000 + (monthOffset % 2 === 0 ? 200 : 0),
        date: getDateTimestamp(5),
        category: 'Savings Deposit',
        notes: 'Automated Monthly Savings Goal',
        createdAt: getDateTimestamp(5),
      });

      // 4. Interest Earned ($38 - $48 on 28th)
      transactionsToInsert.push({
        accountId: savingsId,
        type: 'income' as const,
        amount: 38 + monthOffset * 2,
        date: getDateTimestamp(28),
        category: 'Investments',
        notes: '4.5% APY High-Yield Savings Yield',
        createdAt: getDateTimestamp(28),
      });

      // --- MONTHLY EXPENSES ---
      // Rent / Housing ($1,450 on 2nd)
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'expense' as const,
        amount: 1450,
        date: getDateTimestamp(2),
        category: 'Housing',
        notes: 'Monthly Apartment Rent',
        createdAt: getDateTimestamp(2),
      });

      // Utilities & Internet ($180 - $215 on 6th)
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'expense' as const,
        amount: 180 + ((monthOffset * 12) % 35),
        date: getDateTimestamp(6),
        category: 'Utilities',
        notes: 'Electricity, Water & Fiber Internet',
        createdAt: getDateTimestamp(6),
      });

      // Groceries 1 ($140 - $175 on 4th)
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'expense' as const,
        amount: 140 + ((monthOffset * 15) % 35),
        date: getDateTimestamp(4),
        category: 'Food & Groceries',
        notes: 'Weekly Grocery Store Haul',
        createdAt: getDateTimestamp(4),
      });

      // Groceries 2 ($150 - $180 on 18th)
      transactionsToInsert.push({
        accountId: checkingId,
        type: 'expense' as const,
        amount: 150 + ((monthOffset * 10) % 30),
        date: getDateTimestamp(18),
        category: 'Food & Groceries',
        notes: 'Organic Market & Pantry Supplies',
        createdAt: getDateTimestamp(18),
      });

      // Subscriptions ($52 on 10th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 52,
        date: getDateTimestamp(10),
        category: 'Subscriptions',
        notes: 'Streaming Services & Gym Pass',
        createdAt: getDateTimestamp(10),
      });

      // Dining Out 1 ($45 - $85 on 12th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 45 + ((monthOffset * 14) % 40),
        date: getDateTimestamp(12),
        category: 'Dining',
        notes: 'Dinner with colleagues',
        createdAt: getDateTimestamp(12),
      });

      // Dining Out 2 ($35 - $65 on 24th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 35 + ((monthOffset * 8) % 30),
        date: getDateTimestamp(24),
        category: 'Dining',
        notes: 'Weekend Brunch & Specialty Coffee',
        createdAt: getDateTimestamp(24),
      });

      // Transportation / Fuel ($55 - $73 on 8th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 55 + ((monthOffset * 6) % 18),
        date: getDateTimestamp(8),
        category: 'Transportation',
        notes: 'Gas Station Refill',
        createdAt: getDateTimestamp(8),
      });

      // Transportation ($50 - $65 on 22nd)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 50 + ((monthOffset * 7) % 15),
        date: getDateTimestamp(22),
        category: 'Transportation',
        notes: 'Transit Card & Rideshares',
        createdAt: getDateTimestamp(22),
      });

      // Shopping ($85 - $160 on 16th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 85 + ((monthOffset * 22) % 75),
        date: getDateTimestamp(16),
        category: 'Shopping',
        notes: 'Home essentials & Apparel',
        createdAt: getDateTimestamp(16),
      });

      // Entertainment ($60 - $110 on 20th)
      transactionsToInsert.push({
        accountId: creditId,
        type: 'expense' as const,
        amount: 60 + ((monthOffset * 18) % 50),
        date: getDateTimestamp(20),
        category: 'Entertainment',
        notes: 'Concert Tickets & Movies',
        createdAt: getDateTimestamp(20),
      });
    }

    await db.transactions.bulkAdd(transactionsToInsert);

    return numProfileId;
  });
}
