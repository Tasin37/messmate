'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import MealSheet from '@/components/meals/MealSheet';
import BazaarExpenses from '@/components/expenses/BazaarExpenses';
import HisabPanel from '@/components/billing/HisabPanel';
import MoreMenu from '@/components/navigation/MoreMenu';
import TrendsChart from '@/components/dashboard/TrendsChart';
import AuthModal from '@/components/auth/AuthModal';
import CreateMessModal from '@/components/messes/CreateMessModal';
import { formatBDT } from '@/lib/money/paisa';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [messes, setMesses] = useState([]);
  const [activeMess, setActiveMess] = useState(null);
  const [period, setPeriod] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Modals & triggers
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateMessModal, setShowCreateMessModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Check Auth Session
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/get-session');
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch {
      // Session not available yet
    }
    return null;
  }, []);

  // 2. Fetch User Messes
  const fetchMesses = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/messes');
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setMesses(list);
        if (list.length > 0) {
          setActiveMess((prev) => (prev ? list.find((m) => m.id === prev.id) || list[0] : list[0]));
        } else {
          // If logged in but no mess, prompt creation
          setShowCreateMessModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messes:', err);
    }
  }, []);

  // 3. Fetch Mess Summary
  const fetchSummary = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/summary`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSummaryData(data.data);
          setPeriod(data.data.period);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mess summary:', err);
    }
  }, [activeMess?.id]);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);
      const currentUser = await checkSession();
      if (currentUser) {
        await fetchMesses();
      } else {
        // Automatically prompt quick login if not logged in
        setShowAuthModal(true);
      }
      setLoading(false);
    }
    init();
  }, [checkSession, fetchMesses]);

  // Summary refetch on activeMess change or refreshKey increment
  useEffect(() => {
    if (activeMess?.id) {
      fetchSummary();
    }
  }, [activeMess?.id, refreshKey, fetchSummary]);

  // Handle successful login
  const handleAuthSuccess = async (loggedInUser) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
    await fetchMesses();
  };

  // Handle newly created mess
  const handleMessCreated = (newMess) => {
    setMesses((prev) => [newMess, ...prev]);
    setActiveMess(newMess);
    setShowCreateMessModal(false);
    setRefreshKey((k) => k + 1);
  };

  // Derived state values with fallback
  const myAccount = summaryData?.myAccount || {
    displayName: user?.name || 'সদস্য',
    myMeals: 0,
    mealCharge: '0.00',
    sharedBillCharge: '0.00',
    totalDeposit: '0.00',
    balance: '0.00',
    status: 'settled',
    statusTextBn: 'পরিশোধিত',
    statusTextEn: 'Settled',
  };

  const messSummary = summaryData?.summary || {
    totalBazaar: '0.00',
    totalMeals: 0,
    mealRate: '0.00',
    sharedBills: '0.00',
  };

  const todayData = summaryData?.today || {
    date: new Date().toISOString().slice(0, 10),
    meals: { breakfast: 0, lunch: 0, dinner: 0 },
    roster: null,
  };

  const recentExpenses = summaryData?.recentActivities?.expenses || [];
  const recentPayments = summaryData?.recentActivities?.payments || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20">
      {/* Top Header */}
      <Header
        messes={messes}
        activeMess={activeMess}
        onSelectMess={(m) => setActiveMess(m)}
        onOpenCreateMess={() => setShowCreateMessModal(true)}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        periodLabel={period ? `${period.year} সালের ${period.month} নং মাস` : 'চলতি মাস'}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        {/* If user not logged in or no mess selected yet */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>লোড হচ্ছে... / Loading MessMate...</p>
          </div>
        ) : !activeMess ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <span className="text-3xl">🏠</span>
            <h3 className="font-bold text-slate-900 text-sm">কোনো মেস নির্বাচন করা হয়নি</h3>
            <p className="text-xs text-slate-500">শুরু করতে লগইন করুন অথবা নতুন একটি মেস তৈরি করুন।</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                লগইন / সাইন-আপ 🔑
              </button>
              <button
                onClick={() => setShowCreateMessModal(true)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black"
              >
                + নতুন মেস তৈরি
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Tab Router */}
            {activeTab === 'meals' && (
              <MealSheet activeMess={activeMess} onMealUpdated={() => setRefreshKey((k) => k + 1)} />
            )}

            {activeTab === 'bazaar' && (
              <BazaarExpenses activeMess={activeMess} onExpenseAdded={() => setRefreshKey((k) => k + 1)} />
            )}

            {activeTab === 'hisab' && (
              <HisabPanel
                activeMess={activeMess}
                period={period}
                user={user}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            )}

            {activeTab === 'more' && (
              <MoreMenu
                activeMess={activeMess}
                period={period}
                user={user}
                onRefresh={() => {
                  fetchMesses();
                  setRefreshKey((k) => k + 1);
                }}
              />
            )}

            {activeTab === 'home' && (
              <>
                {/* Notification & Reminder Banners (Feature 8) */}
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔔</span>
                      <span>
                        <strong>মিল অফ রিমাইন্ডার:</strong> আজকের মিল বন্ধের কাট-অফ সময় রাত ১০:০০ টা।
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('meals')}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition shadow-2xs"
                    >
                      মিল অফ
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛒</span>
                      <span>
                        <strong>আজকের বাজার দায়িত্ব:</strong>{' '}
                        {todayData.roster ? `${todayData.roster.member_name}` : 'রোটেশন অনুযায়ী নির্ধারিত'}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('bazaar')}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition shadow-2xs"
                    >
                      রোস্টার
                    </button>
                  </div>
                </div>

                {/* User Balance Banner */}
                <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                        আপনার বর্তমান হিসাব ({myAccount.displayName})
                      </p>
                      <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
                        {formatBDT(myAccount.balance || '0.00')}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                        myAccount.status === 'due'
                          ? 'bg-amber-400 text-amber-950'
                          : myAccount.status === 'advance'
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-white/20 text-white'
                      }`}
                    >
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

                {/* Quick Actions (Switch Tabs) */}
                <section className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setActiveTab('meals')}
                    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 active:scale-95 transition shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 font-bold">
                      🍽️
                    </div>
                    <span className="text-xs font-semibold text-slate-800">মিল এন্ট্রি</span>
                    <span className="text-[10px] text-slate-400">Add Meal</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bazaar')}
                    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-500 active:scale-95 transition shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 font-bold">
                      🛒
                    </div>
                    <span className="text-xs font-semibold text-slate-800">বাজার খরচ</span>
                    <span className="text-[10px] text-slate-400">Add Bazaar</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('hisab')}
                    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-500 active:scale-95 transition shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-1.5 font-bold">
                      💳
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
                    <span
                      onClick={() => setActiveTab('hisab')}
                      className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline"
                    >
                      বিস্তারিত দেখুন →
                    </span>
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

                {/* Daily Expense & Meal Trends (Feature 7) */}
                <TrendsChart />

                {/* Today's Schedule & Meal Log */}
                <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h3 className="text-sm font-bold text-slate-900">আজকের দায়িত্ব ও খাবার (Today)</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{todayData.date}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-600">আজকের বাজার দায়িত্ব:</span>
                    <span className="font-bold text-slate-900">
                      {todayData.roster ? `${todayData.roster.member_name}` : 'রোটেশন অনুযায়ী'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 border border-slate-150 rounded-lg">
                      <span className="text-[11px] text-slate-500 block">সকাল (Breakfast)</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {todayData.meals?.breakfast || 0} টি
                      </span>
                    </div>
                    <div className="p-2 border border-slate-150 rounded-lg">
                      <span className="text-[11px] text-slate-500 block">দুপুর (Lunch)</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {todayData.meals?.lunch || 0} টি
                      </span>
                    </div>
                    <div className="p-2 border border-slate-150 rounded-lg">
                      <span className="text-[11px] text-slate-500 block">রাত (Dinner)</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {todayData.meals?.dinner || 0} টি
                      </span>
                    </div>
                  </div>
                </section>

                {/* Recent Activity List */}
                <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    সাম্প্রতিক কার্যক্রম (Recent Activity)
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    {recentExpenses.length === 0 && recentPayments.length === 0 ? (
                      <p className="text-slate-400 py-3 text-center">এখনো কোন কার্যক্রম রেকর্ড হয়নি।</p>
                    ) : (
                      <>
                        {recentExpenses.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                বা
                              </span>
                              <div>
                                <p className="font-semibold text-slate-800">বাজার: {exp.title}</p>
                                <p className="text-[10px] text-slate-400">
                                  ক্রেতা: {exp.paid_by_name} • {exp.expense_date}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900">৳{exp.amount}</span>
                          </div>
                        ))}

                        {recentPayments.map((pay) => (
                          <div key={pay.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                                জ
                              </span>
                              <div>
                                <p className="font-semibold text-slate-800">জমা: {pay.member_name} ({pay.method})</p>
                                <p className="text-[10px] text-slate-400">
                                  তারিখ: {pay.payment_date}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-emerald-600">+৳{pay.amount}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Create / Join Mess Modal */}
      <CreateMessModal
        isOpen={showCreateMessModal}
        onClose={() => setShowCreateMessModal(false)}
        onMessCreated={handleMessCreated}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </div>
  );
}
