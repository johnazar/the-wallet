/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { db, Profile } from '../db';
import { User, Shield, Download, Upload, Trash2, Heart, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings({ profile, profileId, onLogout }: { profile?: Profile, profileId: number, onLogout?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = React.useState(profile?.name || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (profile?.name && profile.name !== localName && !showSuccess) {
      setLocalName(profile.name);
    }
  }, [profile?.name]);

  const handleSave = async () => {
    const trimmedName = localName.trim();
    if (!trimmedName || !profile?.id) return;
    
    setIsSaving(true);
    try {
      await db.profiles.update(profile.id, { name: trimmedName });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  };

  const isSaveDisabled = isSaving || !localName.trim() || localName.trim() === profile?.name;

  const exportAllData = async () => {
    const rawData = {
      profile: await db.profiles.toArray(),
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      version: 1,
      exportedAt: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-wallet-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [importStatus, setImportStatus] = React.useState<string | null>(null);

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        await db.transaction('rw', [db.profiles, db.accounts, db.transactions], async () => {
          await db.profiles.clear();
          await db.accounts.clear();
          await db.transactions.clear();
          
          if (data.profile) await db.profiles.bulkAdd(data.profile);
          if (data.accounts) await db.accounts.bulkAdd(data.accounts);
          if (data.transactions) await db.transactions.bulkAdd(data.transactions);
        });
        
        setImportStatus('Data imported successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        setImportStatus('Failed: Invalid backup file.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const [confirmState, setConfirmState] = React.useState<'idle' | 'confirming' | 'final'>('idle');
  const confirmTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  const clearUserData = async () => {
    if (!profileId) return;

    if (confirmState === 'idle') {
      setConfirmState('confirming');
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmState('idle'), 3000);
      return;
    }

    if (confirmState === 'confirming') {
      setConfirmState('final');
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmState('idle'), 3000);
      return;
    }

    try {
      // 1. Get all accounts for this profile first to be safe
      const accounts = await db.accounts.where('profileId').equals(Number(profileId)).toArray();
      const accountIds = accounts.map(a => a.id).filter(id => id !== undefined) as number[];
      
      await db.transaction('rw', [db.profiles, db.accounts, db.transactions], async () => {
        // 2. Delete transactions for those accounts
        if (accountIds.length > 0) {
          await db.transactions.where('accountId').anyOf(accountIds).delete();
        }
        
        // 3. Delete accounts
        await db.accounts.where('profileId').equals(Number(profileId)).delete();
        
        // 4. Delete the profile itself
        await db.profiles.delete(Number(profileId));
      });

      setConfirmState('idle');
      // Reset state and go to welcome
      localStorage.removeItem('currentProfileId');
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to erase user data:', err);
      setConfirmState('idle');
      alert('Specific deletion failed.');
    }
  };

  const [globalResetState, setGlobalResetState] = React.useState<'idle' | 'confirming'>('idle');
  const globalResetTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleGlobalReset = async () => {
    if (globalResetState === 'idle') {
      setGlobalResetState('confirming');
      if (globalResetTimeoutRef.current) clearTimeout(globalResetTimeoutRef.current);
      globalResetTimeoutRef.current = setTimeout(() => setGlobalResetState('idle'), 3000);
      return;
    }

    try {
      await db.delete();
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset database:', err);
      setGlobalResetState('idle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold">Settings</h2>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <LogOut size={14} />
          Switch Profile
        </button>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight">Your Profile</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Display Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              value={localName}
              onChange={handleNameChange}
              placeholder="Enter your name"
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={cn(
              "w-full py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2",
              showSuccess 
                ? "bg-emerald-500 text-white" 
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
            )}
          >
            {isSaving ? "Saving..." : showSuccess ? "Changes Saved!" : "Save Profile Changes"}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight">Data & Privacy</h3>
        </div>
        
        <p className="text-xs text-slate-500 px-1 leading-relaxed">
          Your data lives exclusively in your browser's IndexedDB. We never track or sync your transactions to a server.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={exportAllData}
            className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Download size={14} />
            Export JSON
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Upload size={14} />
            Import JSON
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={importData}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-1 space-y-3">
        <button 
          onClick={clearUserData}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-bold border active:scale-95 transition-all outline-none",
            confirmState === 'idle' && "bg-rose-50 text-rose-600 border-rose-100",
            confirmState === 'confirming' && "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200 animate-pulse",
            confirmState === 'final' && "bg-slate-900 text-white border-slate-950 shadow-xl"
          )}
        >
          <Trash2 size={16} />
          {confirmState === 'idle' && "Erase User Data Completely"}
          {confirmState === 'confirming' && "Are you sure? Click again"}
          {confirmState === 'final' && "FINAL WARNING: Click to Erase"}
        </button>

        <button 
          onClick={handleGlobalReset}
          className={cn(
            "w-full text-[10px] font-bold uppercase tracking-widest transition-colors py-2 rounded-lg",
            globalResetState === 'idle' ? "text-slate-400 hover:text-rose-500" : "text-rose-600 bg-rose-50"
          )}
        >
          {globalResetState === 'idle' ? "Reset Entire Database" : "Confirm Triple Wipe?"}
        </button>
      </div>

      {/* About */}
      <div className="text-center pt-4 pb-8">
        <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-medium uppercase tracking-widest">
          Build with <Heart size={10} className="text-rose-400 fill-rose-400" /> offline-first
        </div>
        <p className="text-[10px] text-slate-300 mt-1">Version 1.0.0 (Client-side Beta)</p>
      </div>
    </div>
  );
}
