/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Download, Calendar, Filter, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { startOfMonth, endOfMonth, format, isWithinInterval } from 'date-fns';

export default function Reports({ profileId }: { profileId: number }) {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray(), [profileId]) || [];
  const transactions = useLiveQuery(async () => {
    if (accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id).filter(id => id !== undefined) as number[];
    return db.transactions.where('accountId').anyOf(accountIds).toArray();
  }, [accounts]) || [];
  
  const filteredTxs = transactions.filter(tx => {
    return isWithinInterval(new Date(tx.date), {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    });
  });

  const income = filteredTxs
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const expenses = filteredTxs
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const net = income - expenses;

  // Category breakdown for reporting
  const categoryStats = filteredTxs
    .filter(tx => tx.type === 'expense')
    .reduce((acc: Record<string, number>, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

  const exportData = () => {
    const dataStr = JSON.stringify(filteredTxs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `the-wallet-report-${dateRange.start}-to-${dateRange.end}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Financial Reports</h2>
        <button 
          onClick={exportData}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Download size={16} />
          Export All
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Period</label>
          <div className="relative group">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input 
              type="date" 
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-7 pr-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all text-center"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">End Period</label>
          <div className="relative group">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input 
              type="date" 
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-7 pr-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-center"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight">{formatCurrency(income)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 tracking-tight">{formatCurrency(expenses)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-indigo-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Flow</p>
          <p className={cn("text-2xl font-bold tracking-tight", net >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800">Expense by Category</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{filteredTxs.length} Transactions</span>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(categoryStats).length > 0 ? (
            Object.entries(categoryStats).map(([cat, val]: [string, any]) => (
              <div key={cat} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{cat}</span>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block border border-slate-50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (val / expenses) * 100)}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(val)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-300">
              <p className="text-[10px] font-bold uppercase tracking-widest">No transaction reporting available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
