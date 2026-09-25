/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Wallet, Plus, ArrowRight, User as UserIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { createOrOpenDemoProfile } from '../lib/createDemoProfile';

interface WelcomeProps {
  onProfileSelected: (id: number) => void;
}

export default function Welcome({ onProfileSelected }: WelcomeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const profiles = useLiveQuery(() => db.profiles.toArray());

  const handleSelectProfile = (id: number) => {
    localStorage.setItem('currentProfileId', id.toString());
    onProfileSelected(id);
  };

  const handleOpenDemoProfile = async () => {
    setIsLoadingDemo(true);
    try {
      const id = await createOrOpenDemoProfile();
      localStorage.setItem('currentProfileId', id.toString());
      onProfileSelected(id);
    } catch (err) {
      console.error('Failed to open demo profile:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = await db.profiles.add({
      name: newName.trim(),
      currency: 'USD',
      theme: 'light',
      createdAt: Date.now(),
    });

    localStorage.setItem('currentProfileId', id.toString());
    onProfileSelected(Number(id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 mb-4 transform -rotate-3">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">The Wallet</h1>
          <p className="text-slate-500 mt-2">Personal finance tracker, locally stored.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          {!isCreating ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-800">Choose your profile</h2>
                <p className="text-sm text-slate-400">Select a profile to continue or create a new one.</p>
              </div>

              <div className="space-y-3">
                {profiles?.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id!)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-slate-200 group-hover:border-indigo-100 shadow-sm">
                        <UserIcon size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-700 group-hover:text-indigo-700">{profile.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">Personal Account</div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}

                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all font-medium py-5"
                >
                  <Plus size={20} />
                  Create New Profile
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleOpenDemoProfile}
                    disabled={isLoadingDemo}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-300 hover:decoration-indigo-600 transition-all py-2 px-3 rounded-lg hover:bg-indigo-50/60 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={14} className="text-amber-500 shrink-0" />
                    {isLoadingDemo ? 'Setting up Demo Profile...' : 'Demo Profile'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateProfile} className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-800">Create Profile</h2>
                <p className="text-sm text-slate-400">Enter a name for your new wallet profile.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Profile Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-xs text-slate-400 font-medium">
          All data is stored in your browser's IndexedDB.
        </p>
      </motion.div>
    </div>
  );
}
