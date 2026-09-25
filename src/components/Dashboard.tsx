/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { subDays, startOfDay, format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard({ profileId, onViewAll }: { profileId: number, onViewAll?: () => void }) {
  const accounts = useLiveQuery(() => db.accounts.where('profileId').equals(profileId).toArray(), [profileId]) || [];
  const transactions = useLiveQuery(async () => {
    if (accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id).filter(id => id !== undefined) as number[];
    return db.transactions.where('accountId').anyOf(accountIds).reverse().sortBy('date');
  }, [accounts]) || [];
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0) + 
    transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
  
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Last 7 days spending
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    const dayStart = startOfDay(d).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dayTxs = transactions.filter(tx => tx.date >= dayStart && tx.date < dayEnd);
    const daySpending = dayTxs
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      name: format(d, 'MMM dd'),
      amount: daySpending
    };
  }).reverse();
  
  // Category breakdown
  const categoryData = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc: Record<string, number>, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});
  
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value: value as number }));
  
  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-4 bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet size={120} />
          </div>
          <div>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Total Net Balance</p>
            <h2 className="text-3xl font-bold mt-1 tracking-tight">{formatCurrency(totalBalance)}</h2>
          </div>
          <div className="mt-6">
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">Active Portfolio</span>
          </div>
        </div>
  
        {/* Income Card */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monthly Income</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800 tracking-tight">{formatCurrency(totalIncome)}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-4 uppercase tracking-tighter">
            <TrendingUp size={14} />
            Recurrent items
          </div>
        </div>
  
        {/* Expense Card */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monthly Expenses</p>
            <h2 className="text-3xl font-bold mt-1 text-rose-500 tracking-tight">{formatCurrency(totalExpense)}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold mt-4 uppercase tracking-tighter">
            <TrendingDown size={14} />
            Top: {pieData[0]?.name || 'No data'}
          </div>
        </div>
      </div>
  
      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Spending Trend Chart */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-sm">Cash Flow Trend</h3>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button className="text-[9px] px-2 py-1 rounded font-bold text-slate-500 uppercase tracking-widest">1M</button>
              <button className="text-[9px] bg-white px-2 py-1 rounded font-bold text-indigo-600 shadow-sm uppercase tracking-widest">3M</button>
              <button className="text-[9px] px-2 py-1 rounded font-bold text-slate-500 uppercase tracking-widest">1Y</button>
            </div>
          </div>
          <div className="h-48 md:h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
  
        {/* Top Categories Progress */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-sm mb-6">Top Categories</h3>
          <div className="space-y-5 flex-1">
            {pieData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                  <span className="text-slate-600">{cat.name}</span>
                  <span className="text-slate-400">{formatCurrency(cat.value)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(cat.value / totalExpense) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
            {pieData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                <TrendingDown className="mb-2 opacity-50" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No spending yet</p>
              </div>
            )}
          </div>
          <button 
            onClick={onViewAll}
            className="mt-6 text-[10px] text-indigo-600 font-bold hover:bg-indigo-50 py-2 rounded-lg border border-indigo-100 transition-colors uppercase tracking-widest"
          >
            View full breakdown
          </button>
        </div>
      </div>
  
      {/* Recent Activity Table style */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Recent Activity</h3>
          <button 
            onClick={onViewAll}
            className="text-[10px] bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded font-bold transition-all uppercase tracking-widest border border-slate-200 hover:border-indigo-600"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 uppercase text-[9px] tracking-[0.2em] font-bold border-b border-slate-50">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-[11px] font-medium text-slate-500 uppercase">
                    {format(tx.date, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                      tx.type === 'income' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {tx.category}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold text-sm",
                    tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-12 text-center text-slate-300">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Start your journey by adding a transaction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
