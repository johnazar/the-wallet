/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  BarChart3, 
  Settings as SettingsIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddClick: () => void;
  profile: any;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'transactions', label: 'Activity', icon: ArrowLeftRight },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout({ children, activeTab, setActiveTab, onAddClick, profile }: LayoutProps) {
  const getInitials = (name: string) => {
    if (!name || name === 'Loading...') return '??';
    return name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.name?.trim() || (profile === undefined ? 'Loading...' : 'User');
  const initials = getInitials(displayName);

  const handleNavClick = (tabId: string) => {
    if (activeTab === tabId) return;
    setActiveTab(tabId);
  };

  return (
    <div className="flex bg-slate-50 h-screen overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity text-left w-full group"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">The Wallet</span>
        </button>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={20} className={cn("transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex md:block items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Wallet className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-sm md:text-lg font-semibold text-slate-800 capitalize">
                {activeTab === 'dashboard' ? (profile ? `${displayName}'s Hub` : 'Dashboard') : activeTab}
              </h1>
              <p className="hidden md:block text-[10px] text-slate-400">Offline Ready (Local Storage)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onAddClick}
              className="bg-indigo-600 text-white px-2 py-2 md:px-4 md:py-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 group"
            >
              <Plus size={20} className="shrink-0 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] leading-none">New Transaction</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-3 border-l md:border-l border-slate-200 pl-2 md:pl-4 hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-xs font-bold text-slate-800">{displayName}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Budget Master</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm group-hover:bg-indigo-200 transition-colors">
                {initials}
              </div>
            </button>
          </div>
        </header>

        {/* Content Region */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="h-20 md:hidden" /> {/* Spacer for bottom nav */}
        </main>
      </div>

      {/* Navigation (Sticky Bottom for Mobile) */}
      <nav className="md:hidden bg-white border-t border-slate-200 px-2 py-1 fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center h-16 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-lg relative font-medium",
                isActive ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute -top-1 w-8 h-1 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
