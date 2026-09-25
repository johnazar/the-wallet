/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Account } from '../db';
import { Plus, Trash2, Landmark, Wallet, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const iconMap = {
  bank: Landmark,
  cash: Banknote,
  savings: Wallet,
  credit: CreditCard,
  other: Landmark
};

export default function Accounts({ profileId }: { profileId: number }) {
  const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray(), [profileId]) || [];
  const transactions = useLiveQuery(async () => {
    if (accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id).filter(id => id !== undefined) as number[];
    return db.transactions.where('accountId').anyOf(accountIds).toArray();
  }, [accounts]) || [];

  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    type: 'bank',
    initialBalance: 0,
    currency: 'USD'
  });

  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;
    
    await db.accounts.add({
      profileId,
      name: newAccount.name!,
      type: newAccount.type as any,
      initialBalance: Number(newAccount.initialBalance),
      currency: newAccount.currency || 'USD',
      createdAt: Date.now()
    });
    
    setIsAdding(false);
    setNewAccount({ name: '', type: 'bank', initialBalance: 0, currency: 'USD' });
  };

  const confirmDeleteAccount = async (id: number) => {
    try {
      await db.transaction('rw', [db.accounts, db.transactions], async () => {
        await db.transactions.where('accountId').equals(id).delete();
        await db.accounts.delete(id);
      });
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setDeletingAccountId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Your Accounts</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-indigo-600 bg-indigo-50 p-2 rounded-xl active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-50/50 space-y-4 overflow-hidden mb-6"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Chase Checkings"
                className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={newAccount.name}
                onChange={e => setNewAccount({...newAccount, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-indigo-500"
                  value={newAccount.type}
                  onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash/Wallet</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Starting Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 focus:ring-2 focus:ring-indigo-500"
                  value={newAccount.initialBalance}
                  onChange={e => setNewAccount({...newAccount, initialBalance: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 px-4 bg-slate-100 rounded-2xl font-semibold text-slate-600 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] py-3 px-4 bg-indigo-600 rounded-2xl font-semibold text-white shadow-lg shadow-indigo-200 active:scale-95 transition-all"
              >
                Create Account
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {accounts.map(acc => {
          const Icon = iconMap[acc.type as keyof typeof iconMap] || Landmark;
          const isDeletingThis = deletingAccountId === acc.id;

          const accountTxs = transactions.filter(tx => tx.accountId === acc.id);
          const currentBalance = acc.initialBalance + accountTxs.reduce(
            (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 
            0
          );

          return (
            <div 
              key={acc.id}
              className={cn(
                "bg-white p-5 rounded-2xl border transition-all",
                isDeletingThis ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/30" : "border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md"
              )}
            >
              {isDeletingThis ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                      <AlertTriangle size={22} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-rose-900">Warning: Permanent Data Loss!</h5>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        Deleting <strong className="font-bold text-rose-900">{acc.name}</strong> will automatically and permanently delete all <strong className="font-bold text-rose-900">{accountTxs.length} linked transaction{accountTxs.length === 1 ? '' : 's'}</strong> in your history. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
                    <button
                      onClick={() => setDeletingAccountId(null)}
                      className="px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => acc.id && confirmDeleteAccount(acc.id)}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete Account & Transactions
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 tracking-tight">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{acc.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-800">{formatCurrency(currentBalance, acc.currency)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Current Balance</p>
                    </div>
                    <button 
                      onClick={() => acc.id && setDeletingAccountId(acc.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 cursor-pointer"
                      aria-label="Delete Account"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {accounts.length === 0 && !isAdding && (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Plus className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No Accounts Detected</p>
            <p className="text-xs text-slate-400 mt-2 max-w-[240px] mx-auto leading-relaxed">Securely track your finances by connecting your local banking profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
