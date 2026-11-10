'use client';

import { useState } from 'react';

export default function HisabPanel() {
  const [activeHisabTab, setActiveHisabTab] = useState('bills');

  // Shared Bills Mock
  const sharedBills = [
    { id: 'b1', title: 'বাসা ভাড়া / House Rent', category: 'rent', amount: '5,000.00', method: 'equal', status: 'confirmed' },
    { id: 'b2', title: 'বিদ্যুৎ বিল / Electricity', category: 'utilities', amount: '1,200.00', method: 'equal', status: 'confirmed' },
    { id: 'b3', title: 'ইন্টারনেট / WiFi', category: 'internet', amount: '800.00', method: 'equal', status: 'confirmed' },
    { id: 'b4', title: 'বুয়া বিল / Maid', category: 'maid', amount: '1,500.00', method: 'equal', status: 'confirmed' },
  ];

  // Payments (Deposits) Mock
  const payments = [
    { id: 'p1', member: 'তানভীর আহমেদ', amount: '5,000.00', date: '2026-11-05', method: 'bKash', status: 'confirmed' },
    { id: 'p2', member: 'রাকিবুল হাসান', amount: '4,000.00', date: '2026-11-03', method: 'নগদ', status: 'confirmed' },
    { id: 'p3', member: 'সাকিব মাহমুদ', amount: '5,500.00', date: '2026-11-02', method: 'Cash', status: 'confirmed' },
    { id: 'p4', member: 'নাঈম ইসলাম', amount: '3,000.00', date: '2026-11-01', method: 'Nagad', status: 'confirmed' },
  ];

  // Member Settlement Preview
  const memberSettlement = [
    { name: 'তানভীর আহমেদ', mealCharge: '2,779.68', sharedCharge: '2,125.00', expenseCredit: '0.00', deposit: '5,000.00', balance: '-95.32', status: 'advance' },
    { name: 'রাকিবুল হাসান', mealCharge: '2,316.40', sharedCharge: '2,125.00', expenseCredit: '980.00', deposit: '4,000.00', balance: '-538.60', status: 'advance' },
    { name: 'সাকিব মাহমুদ', mealCharge: '2,547.04', sharedCharge: '2,125.00', expenseCredit: '1,350.00', deposit: '5,500.00', balance: '-2,177.96', status: 'advance' },
    { name: 'নাঈম ইসলাম', mealCharge: '2,779.68', sharedCharge: '2,125.00', expenseCredit: '0.00', deposit: '3,000.00', balance: '1,904.68', status: 'due' },
  ];

  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Hisab Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs">
        <div className="grid grid-cols-3 gap-1 text-xs font-semibold">
          {[
            { id: 'bills', label: 'বিল সমূহ (Bills)' },
            { id: 'payments', label: 'জমা (Deposits)' },
            { id: 'settlement', label: 'হিসাব (Settlement)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveHisabTab(tab.id)}
              className={`py-2 px-1 rounded-xl text-center transition-all ${
                activeHisabTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bills Tab ─── */}
      {activeHisabTab === 'bills' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">মাসিক শেয়ারড বিল</h3>
            <button
              onClick={() => setShowBillModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
            >
              + নতুন বিল
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {sharedBills.map((b) => (
              <div key={b.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{b.title}</p>
                  <p className="text-[10px] text-slate-400">
                    বণ্টন: {b.method === 'equal' ? 'সমান ভাগ' : b.method} •{' '}
                    <span className="text-emerald-600">নিশ্চিত ✓</span>
                  </p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">৳{b.amount}</span>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-emerald-700 font-medium">মোট শেয়ারড বিল</p>
            <p className="text-xl font-extrabold text-emerald-800">৳৮,৫০০.০০</p>
            <p className="text-[10px] text-emerald-600">প্রতি সদস্য: ৳২,১২৫.০০ (৪ জন সমান ভাগ)</p>
          </div>
        </div>
      )}

      {/* ─── Payments Tab ─── */}
      {activeHisabTab === 'payments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">জমার তালিকা</h3>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg"
            >
              + জমা নিন
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                    {p.member.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.member}</p>
                    <p className="text-[10px] text-slate-400">{p.date} • {p.method}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">+৳{p.amount}</span>
              </div>
            ))}
          </div>

          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-violet-700 font-medium">মোট জমা সংগৃহীত</p>
            <p className="text-xl font-extrabold text-violet-800">৳১৭,৫০০.০০</p>
          </div>
        </div>
      )}

      {/* ─── Settlement Tab ─── */}
      {activeHisabTab === 'settlement' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">সদস্যভিত্তিক মাসিক হিসাব</h3>

          <div className="space-y-2.5">
            {memberSettlement.map((m, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.name}</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    m.status === 'due'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.status === 'due' ? `বাকি ৳${m.balance}` : `অগ্রিম ৳${m.balance.replace('-', '')}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-slate-500">মিল খরচ:</span>
                    <span className="font-bold text-slate-800 ml-1">৳{m.mealCharge}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-slate-500">বিল ভাগ:</span>
                    <span className="font-bold text-slate-800 ml-1">৳{m.sharedCharge}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-slate-500">বাজার ক্রেডিট:</span>
                    <span className="font-bold text-emerald-700 ml-1">-৳{m.expenseCredit}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <span className="text-slate-500">জমা:</span>
                    <span className="font-bold text-emerald-700 ml-1">-৳{m.deposit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">নতুন শেয়ারড বিল</h4>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">বিলের নাম (Title)</label>
                <input placeholder="যেমন: বাসা ভাড়া" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">ক্যাটাগরি</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option>ভাড়া (Rent)</option>
                  <option>বিদ্যুৎ (Electricity)</option>
                  <option>ইন্টারনেট (WiFi)</option>
                  <option>বুয়া (Maid)</option>
                  <option>অন্যান্য (Other)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (৳)</label>
                <input type="text" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">বণ্টন পদ্ধতি</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option value="equal">সমান ভাগ (Equal)</option>
                  <option value="weighted">ওজনভিত্তিক (Weighted)</option>
                  <option value="custom">কাস্টম (Custom)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowBillModal(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl">বাতিল</button>
              <button
                onClick={() => { alert('বিল সফলভাবে যোগ হয়েছে!'); setShowBillModal(false); }}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">জমা গ্রহণ (Record Deposit)</h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সদস্য (Member)</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option>তানভীর আহমেদ</option>
                  <option>রাকিবুল হাসান</option>
                  <option>সাকিব মাহমুদ</option>
                  <option>নাঈম ইসলাম</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (৳)</label>
                <input type="text" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">তারিখ</label>
                <input type="date" defaultValue="2026-11-10" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">মাধ্যম (Method)</label>
                <div className="flex gap-2 flex-wrap">
                  {['Cash', 'bKash', 'Nagad', 'Bank'].map((m) => (
                    <label key={m} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border text-[11px]">
                      <input type="radio" name="method" defaultChecked={m === 'Cash'} /> {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl">বাতিল</button>
              <button
                onClick={() => { alert('জমা সফলভাবে গৃহীত!'); setShowPaymentModal(false); }}
                className="flex-1 py-2 text-xs font-bold bg-violet-600 text-white rounded-xl"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
