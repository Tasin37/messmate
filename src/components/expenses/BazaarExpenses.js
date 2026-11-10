'use client';

import { useState } from 'react';

export default function BazaarExpenses() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const categories = [
    { id: 'c1', code: 'bazaar', name: 'বাজার / Daily Bazaar', pool: 'meal' },
    { id: 'c2', code: 'rent', name: 'বাসা ভাড়া / House Rent', pool: 'shared' },
    { id: 'c3', code: 'utilities', name: 'বিদ্যুৎ/পানি / Utilities', pool: 'shared' },
    { id: 'c4', code: 'internet', name: 'ইন্টারনেট / WiFi', pool: 'shared' },
    { id: 'c5', code: 'maid', name: 'বুয়া বিল / Maid Service', pool: 'shared' },
  ];

  const [expenses, setExpenses] = useState([
    { id: 'e1', date: '2026-11-10', title: 'মুরগি, আলু, পেঁয়াজ, সবজি', amount: '1,450.00', payer: 'তাসিন', category: 'বাজার', pool: 'meal', status: 'approved' },
    { id: 'e2', date: '2026-11-09', title: 'চাল (১০ কেজি), ডাল, তেল', amount: '2,200.00', payer: 'তানভীর', category: 'বাজার', pool: 'meal', status: 'approved' },
    { id: 'e3', date: '2026-11-08', title: 'মাছ, ডিম, দুধ', amount: '980.00', payer: 'রাকিব', category: 'বাজার', pool: 'meal', status: 'approved' },
    { id: 'e4', date: '2026-11-07', title: 'গ্যাস সিলিন্ডার', amount: '1,350.00', payer: 'সাকিব', category: 'বাজার', pool: 'meal', status: 'approved' },
  ]);

  const totalMealPool = 5980;
  const totalShared = 0;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">বাজার ও খরচ (Bazaar & Expenses)</h3>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
          >
            + নতুন খরচ
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl text-center">
            <p className="text-[11px] text-emerald-700 font-medium">মিল পুল খরচ (Meal Pool)</p>
            <p className="text-lg font-extrabold text-emerald-800">৳{totalMealPool.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <p className="text-[11px] text-blue-700 font-medium">শেয়ারড খরচ (Shared)</p>
            <p className="text-lg font-extrabold text-blue-800">৳{totalShared.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50/80 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600">সাম্প্রতিক খরচ (Recent Expenses)</span>
        </div>
        <div className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <div key={e.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  e.pool === 'meal'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {e.pool === 'meal' ? 'বা' : 'শে'}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">{e.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {e.date} • ক্রেতা: {e.payer} •{' '}
                    <span className={e.status === 'approved' ? 'text-emerald-600' : 'text-red-500'}>
                      {e.status === 'approved' ? 'অনুমোদিত ✓' : 'বাতিল ✗'}
                    </span>
                  </p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-slate-900">৳{e.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">নতুন খরচ যোগ (Add Expense)</h4>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">বিবরণ (Title)</label>
                <input placeholder="যেমন: মুরগি, সবজি, চাল" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (Amount ৳)</label>
                <input type="text" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">তারিখ (Date)</label>
                <input type="date" defaultValue="2026-11-10" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">ক্রেতা / পরিশোধকারী</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option>তাসিন</option>
                  <option>তানভীর</option>
                  <option>রাকিব</option>
                  <option>সাকিব</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">ক্যাটাগরি (Category)</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">নোট (Note)</label>
                <input placeholder="ঐচ্ছিক" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  alert('খরচ সফলভাবে যোগ হয়েছে!');
                  setShowAddExpenseModal(false);
                }}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
