/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transaction } from '../db';
import { Edit2, Trash2, Filter, Search, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';

interface TransactionsProps {
  onEdit: (tx: Transaction) => void;
  profileId: number;
}

export default function Transactions({ onEdit, profileId }: TransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray(), [profileId]) || [];
  
  const transactions = useLiveQuery(async () => {
    if (accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id).filter(id => id !== undefined) as number[];
    
    const results = await db.transactions.where('accountId').anyOf(accountIds).reverse().sortBy('date');
    
    return results.filter(tx => {
      const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, filterType, accounts]) || [];

  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);

  const confirmDeleteTx = async (id: number) => {
    try {
      await db.transactions.delete(id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setDeletingTxId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="w-full bg-white border-none rounded-2xl py-3 pl-11 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'income', 'expense'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                filterType === type 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 uppercase text-[9px] tracking-[0.2em] font-bold border-b border-slate-50">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transaction</th>
                <th className="hidden sm:table-cell px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(tx => (
                <tr 
                  key={tx.id} 
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{tx.category}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{format(tx.date, 'MMM dd, yyyy')}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <span className="text-xs text-slate-500 italic truncate max-w-[150px] block">
                      {tx.notes || '-'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {deletingTxId === tx.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => tx.id && confirmDeleteTx(tx.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeletingTxId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1 transition-opacity">
                        <button 
                          onClick={() => onEdit(tx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          aria-label="Edit Transaction"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => tx.id && setDeletingTxId(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          aria-label="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No filtered transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
