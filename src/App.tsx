/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Welcome from './components/Welcome';
import TransactionModal from './components/TransactionModal';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [profileId, setProfileId] = useState(localStorage.getItem('currentProfileId'));

  const profile = useLiveQuery(
    async () => {
      if (!profileId) return null;
      return await db.profiles.get(Number(profileId));
    },
    [profileId]
  );

  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentProfileId');
    setProfileId(null);
    setActiveTab('dashboard');
  };

  const handleProfileSelected = (id: number) => {
    setProfileId(id.toString());
  };

  // If no profile or profile screen is requested
  if (!profileId || profile === null) {
    return <Welcome onProfileSelected={handleProfileSelected} />;
  }

  // Loading state
  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderContent = () => {
    const pid = Number(profileId);
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profileId={pid} onViewAll={() => setActiveTab('transactions')} />;
      case 'accounts':
        return <Accounts profileId={pid} />;
      case 'transactions':
        return <Transactions onEdit={handleEditTransaction} profileId={pid} />;
      case 'reports':
        return <Reports profileId={pid} />;
      case 'settings':
        return <Settings profile={profile} profileId={pid} onLogout={handleLogout} />;
      default:
        return <Dashboard profileId={pid} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddClick={handleAddClick}
        profile={profile}
      >
        {renderContent()}
      </Layout>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingTransaction={editingTransaction}
        profileId={Number(profileId)}
      />
    </>
  );
}
