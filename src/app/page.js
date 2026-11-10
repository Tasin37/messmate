'use client';

import { useState } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import MealSheet from '@/components/meals/MealSheet';
import BazaarExpenses from '@/components/expenses/BazaarExpenses';
import HisabPanel from '@/components/billing/HisabPanel';
import { formatBDT } from '@/lib/money/paisa';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState('meal'); // 'meal' | 'bazaar' | 'deposit'

  // Mock initial state for preview and dashboard verification
  const messSummary = {
    totalBazaar: '12,450.00',
    totalMeals: 215,
    mealRate: '57.91',
    sharedBills: '8,500.00',
  };

  const myAccount = {
    displayName: 'তানভীর আহমেদ / Tanvir Ahmed',
    myMeals: 48,
    mealCharge: '2,779.68',
    sharedBillCharge: '2,125.00',
    totalDeposit: '5,000.00',
    balance: '95.32', // Positive = owes mess (Due / বাকি)
    status: 'due',
    statusTextBn: 'বাকি',
    statusTextEn: 'Due',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20">
      <Header
        messName="স্বপ্নিল মেস (Shopnil Mess)"
        periodLabel="নভেম্বর ২০২৬ (Nov 2026)"
        userName={myAccount.displayName}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        {activeTab === 'meals' ? (
          <MealSheet />
        ) : (
          <>
            {/* User Balance Banner */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                আপনার বর্তমান হিসাব (My Balance)
              </p>
              <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
                {formatBDT(myAccount.balance)}
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-sm">
              {myAccount.statusTextBn} ({myAccount.statusTextEn})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-emerald-500/40 text-center">
            <div>
              <p className="text-[11px] text-emerald-200">মোট মিল</p>
              <p className="text-sm font-bold">{myAccount.myMeals} টি</p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-200">মিল খরচ</p>
              <p className="text-sm font-bold">৳{myAccount.mealCharge}</p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-200">মোট জমা</p>
              <p className="text-sm font-bold">৳{myAccount.totalDeposit}</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setActiveTab('meals')}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 active:scale-95 transition shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-800">মিল এন্ট্রি</span>
            <span className="text-[10px] text-slate-400">Add Meal</span>
          </button>

          <button
            onClick={() => {
              setModalType('bazaar');
              setIsQuickActionModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-500 active:scale-95 transition shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-800">বাজার খরচ</span>
            <span className="text-[10px] text-slate-400">Add Bazaar</span>
          </button>

          <button
            onClick={() => {
              setModalType('deposit');
              setIsQuickActionModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-500 active:scale-95 transition shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-800">জমা দিন</span>
            <span className="text-[10px] text-slate-400">Deposit</span>
          </button>
        </section>

        {/* Mess Summary Grid */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মেস সামগ্রিক সারসংক্ষেপ (Mess Overview)
            </h3>
            <span className="text-xs text-emerald-600 font-semibold cursor-pointer">বিস্তারিত দেখুন →</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">বর্তমান মিল রেট</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">৳{messSummary.mealRate}</p>
              <span className="text-[10px] text-emerald-600 font-medium">প্রতি মিল</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">মোট বাজার খরচ</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">৳{messSummary.totalBazaar}</p>
              <span className="text-[10px] text-slate-400 font-medium">চলতি মাস</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">মোট খাওয়া মিল</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{messSummary.totalMeals} টি</p>
              <span className="text-[10px] text-slate-400 font-medium">সব সদস্য</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">অন্যান্য বিলসমূহ</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">৳{messSummary.sharedBills}</p>
              <span className="text-[10px] text-slate-400 font-medium">ভাড়া ও ইউটিলিটি</span>
            </div>
          </div>
        </section>

        {/* Today's Schedule & Meal Log */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="text-sm font-bold text-slate-900">আজকের দায়িত্ব ও খাবার (Today)</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">১০ নভেম্বর ২০২৬</span>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg">
            <span className="text-slate-600">আজকের ম্যানেজার:</span>
            <span className="font-bold text-slate-900">রাকিবুল হাসান (রুম ২০২)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 border border-slate-150 rounded-lg">
              <span className="text-[11px] text-slate-500 block">সকাল (Breakfast)</span>
              <span className="font-bold text-emerald-700 text-sm">১ টি</span>
            </div>
            <div className="p-2 border border-slate-150 rounded-lg">
              <span className="text-[11px] text-slate-500 block">দুপুর (Lunch)</span>
              <span className="font-bold text-emerald-700 text-sm">১ টি</span>
            </div>
            <div className="p-2 border border-slate-150 rounded-lg">
              <span className="text-[11px] text-slate-500 block">রাত (Dinner)</span>
              <span className="font-bold text-emerald-700 text-sm">১ টি</span>
            </div>
          </div>
        </section>

        {/* Recent Activity List */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            সাম্প্রতিক কার্যক্রম (Recent Activity)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  বা
                </span>
                <div>
                  <p className="font-semibold text-slate-800">বাজার: মুরগি, আলু, পেঁয়াজ</p>
                  <p className="text-[10px] text-slate-400">ক্রেতা: তাসিন • আজ সকাল ১০:৩০</p>
                </div>
              </div>
              <span className="font-bold text-slate-900">৳১,৪৫০</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  জ
                </span>
                <div>
                  <p className="font-semibold text-slate-800">জমা: তানভীর আহমেদ (bKash)</p>
                  <p className="text-[10px] text-slate-400">গৃহীত: ম্যানেজার • গতকাল</p>
                </div>
              </div>
              <span className="font-bold text-emerald-600">+৳২,০০০</span>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Quick Action Modal Placeholder */}
      {isQuickActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-base text-slate-900">
                {modalType === 'meal' && 'নতুন মিল এন্ট্রি (Add Meal)'}
                {modalType === 'bazaar' && 'বাজার খরচ যোগ (Add Bazaar)'}
                {modalType === 'deposit' && 'জমা প্রদান (Make Deposit)'}
              </h4>
              <button
                onClick={() => setIsQuickActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">তারিখ (Date)</label>
                <input
                  type="date"
                  defaultValue="2026-11-10"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              {modalType === 'meal' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">মিলের পরিমাণ (Count)</label>
                  <input
                    type="number"
                    defaultValue="1"
                    step="0.5"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              )}

              {modalType !== 'meal' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (Amount ৳)</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsQuickActionModalOpen(false)}
                className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                বাতিল (Cancel)
              </button>
              <button
                onClick={() => {
                  alert('রেকর্ড সংরক্ষিত হয়েছে! / Saved successfully!');
                  setIsQuickActionModalOpen(false);
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
              >
                সংরক্ষণ (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </div>
  );
}
