'use client';

import { useState } from 'react';

export default function CreateMessModal({ isOpen, onClose, onMessCreated }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
      const res = await fetch('/api/v1/messes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          address,
          currencyCode: 'BDT',
          timezone: 'Asia/Dhaka',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create mess');

      onMessCreated(data.data.mess);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanToken = inviteToken.trim().split('/').pop();
      const res = await fetch(`/api/v1/invites/${cleanToken}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to join mess');

      alert('সফলভাবে মেসে যুক্ত হয়েছেন!');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-2.5">
          <h3 className="text-base font-extrabold text-slate-900">মেস নির্বাচন বা তৈরি</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`py-2 rounded-lg transition ${tab === 'create' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'}`}
          >
            নতুন মেস খুলুন
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`py-2 rounded-lg transition ${tab === 'join' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            ইনভাইট দিয়ে যুক্ত হোন
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            {error}
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">মেসের নাম</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: স্বপ্নিল মেস / ধানমন্ডি মেস"
                className="w-full border rounded-xl p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ঠিকানা (ঐচ্ছিক)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="রোড নং, এলাকা, শহর"
                className="w-full border rounded-xl p-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'তৈরি হচ্ছে...' : 'মেস তৈরি করুন'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ইনভাইট লিংক বা টোকেন</label>
              <input
                required
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="ইনভাইট লিংক বা কোড পেস্ট করুন"
                className="w-full border rounded-xl p-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'যুক্ত হচ্ছে...' : 'মেসে জয়েন করুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
