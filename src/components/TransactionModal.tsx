/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, Transaction } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  profileId: number;
}

const CATEGORIES = [
  'Food & Drink', 'Shopping', 'Housing', 'Transportation', 'Healthcare', 
  'Entertainment', 'Personal Care', 'Education', 'Investment', 'Debt', 
  'Salary', 'Business', 'Gift', 'Other'
];

export default function TransactionModal({ isOpen, onClose, editingTransaction, profileId }: TransactionModalProps) {
  const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray(), [profileId]) || [];
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    accountId: 0,
    type: 'expense',
    amount: 0,
    date: Date.now(),
    category: 'Other',
    notes: ''
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData(editingTransaction);
    } else {
      setFormData({
        accountId: accounts[0]?.id || 0,
        type: 'expense',
        amount: 0,
        date: Date.now(),
        category: 'Other',
        notes: ''
      });
    }
  }, [editingTransaction, isOpen, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId || !formData.amount) {
      alert('Please select an account and enter an amount.');
      return;
    }

    const txData = {
      ...formData as any,
      amount: Number(formData.amount),
      date: typeof formData.date === 'string' ? new Date(formData.date).getTime() : formData.date,
      createdAt: formData.createdAt || Date.now()
    };

    if (editingTransaction?.id) {
      await db.transactions.update(editingTransaction.id, txData);
    } else {
      await db.transactions.add(txData);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-hidden"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[60] max-w-2xl mx-auto shadow-2xl p-6 pb-12"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-100 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Switch */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
                {(['expense', 'income'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      formData.type === type 
                        ? (type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-rose-600 text-white shadow-lg shadow-rose-100')
                        : "text-slate-500"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div className="text-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</label>
                <div className="relative inline-block w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    className="w-full text-center text-4xl font-extrabold text-slate-900 border-none bg-transparent focus:ring-0 placeholder:text-slate-100"
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Account</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    value={formData.accountId}
                    required
                    onChange={e => setFormData({...formData, accountId: Number(e.target.value)})}
                  >
                    <option value="" disabled>Select</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-9 pr-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-center"
                      value={format(formData.date || Date.now(), 'yyyy-MM-dd')}
                      onChange={e => setFormData({...formData, date: new Date(e.target.value).getTime()})}
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Category</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat})}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                        formData.category === cat 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Notes (Optional)</label>
                <textarea 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="What was this for?"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
