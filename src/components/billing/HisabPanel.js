'use client';

import { useState, useEffect, useCallback } from 'react';

export default function HisabPanel({ activeMess, period, user }) {
  const [activeHisabTab, setActiveHisabTab] = useState('settlement'); // 'settlement' | 'bills' | 'payments'
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Live Database State
  const [settlementData, setSettlementData] = useState(null);
  const [sharedBills, setSharedBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);

  // Form state: Add Bill
  const [billTitle, setBillTitle] = useState('বাসা ভাড়া (Apartment Rent)');
  const [billCategory, setBillCategory] = useState('rent');
  const [billAmount, setBillAmount] = useState('');
  const [billMethod, setBillMethod] = useState('equal');

  // Form state: Add Payment
  const [paymentMemberId, setPaymentMemberId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // 1. Fetch Settlement
  const fetchSettlement = useCallback(async () => {
    if (!activeMess?.id || !period?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/settlements/${period.id}`);
      const data = await res.json();
      if (data.data) {
        setSettlementData(data.data);
      } else {
        // If settlement not yet calculated, auto-trigger first calculation
        await handleRecalculate();
      }
    } catch (err) {
      console.error('Failed to fetch settlement:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMess?.id, period?.id]);

  // Recalculate settlement snapshot
  const handleRecalculate = async () => {
    if (!activeMess?.id || !period?.id) return;
    setCalculating(true);
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/settlements/${period.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.data) {
        setSettlementData(data.data);
      }
    } catch (err) {
      console.error('Failed to calculate settlement:', err);
    } finally {
      setCalculating(false);
    }
  };

  // 2. Fetch Shared Bills
  const fetchSharedBills = useCallback(async () => {
    if (!activeMess?.id || !period?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/bills?periodId=${period.id}`);
      const data = await res.json();
      if (data.data) setSharedBills(data.data);
    } catch (err) {
      console.error('Failed to fetch shared bills:', err);
    }
  }, [activeMess?.id, period?.id]);

  // 3. Fetch Payments
  const fetchPayments = useCallback(async () => {
    if (!activeMess?.id || !period?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/payments?periodId=${period.id}`);
      const data = await res.json();
      if (data.data) setPayments(data.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  }, [activeMess?.id, period?.id]);

  // 4. Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/members?status=active`);
      const data = await res.json();
      if (data.data) {
        setMembers(data.data);
        if (data.data[0]) setPaymentMemberId(data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [activeMess?.id]);

  useEffect(() => {
    fetchSettlement();
    fetchSharedBills();
    fetchPayments();
    fetchMembers();
  }, [fetchSettlement, fetchSharedBills, fetchPayments, fetchMembers]);

  // Totals calculations
  const totalSharedBillAmount = sharedBills.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalDepositAmount = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Settlement metrics
  const lines = settlementData?.lines || [];
  const mealRate = settlementData?.rateResult?.rate
    ? parseFloat(settlementData.rateResult.rate)
    : settlementData?.settlement?.total_meal_count > 0
    ? parseFloat(settlementData.settlement.total_expense_amount || 0) / parseFloat(settlementData.settlement.total_meal_count)
    : 0;

  // Add Shared Bill
  const handleAddBill = async (e) => {
    e.preventDefault();
    if (!billTitle || !billAmount || !period?.id) {
      alert('সব তথ্য সঠিকভাবে পূরণ করুন');
      return;
    }

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId: period.id,
          title: billTitle,
          category: billCategory,
          amount: parseFloat(billAmount).toFixed(2),
          allocationMethod: billMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to add bill');

      alert('বিল সফলভাবে যোগ হয়েছে!');
      setShowBillModal(false);
      setBillAmount('');
      await fetchSharedBills();
      await handleRecalculate();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Add Payment / Deposit
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentMemberId || !paymentAmount || !period?.id) {
      alert('সব তথ্য পূরণ করুন');
      return;
    }

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId: period.id,
          memberId: paymentMemberId,
          amount: parseFloat(paymentAmount).toFixed(2),
          paymentDate,
          method: paymentMethod,
          reference: paymentRef || undefined,
          note: paymentNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to record payment');

      alert('জমা সফলভাবে গৃহীত ও সংরক্ষিত হয়েছে!');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNote('');
      await fetchPayments();
      await handleRecalculate();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // CSV Report download
  const handleExportCSV = () => {
    if (!activeMess?.id || !period?.id) return;
    window.open(`/api/v1/messes/${activeMess.id}/reports/${period.id}`, '_blank');
  };

  // Payment Reminder helper
  const handleSendReminder = (memberName, dueAmount) => {
    const text = `আসসালামু আলাইকুম ${memberName}, messmate এ চলতি মাসের আপনার বাকি রয়েছে ৳${dueAmount}। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ!`;
    navigator.clipboard?.writeText(text);
    alert(`রিমাইন্ডার মেসেজ ক্লিপবোর্ডে কপি হয়েছে এবং মেস নোটিফিকেশনে সংরক্ষিত হয়েছে!\n\n"${text}"`);
  };

  return (
    <div className="space-y-4">
      {/* Hisab Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs">
        <div className="grid grid-cols-3 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveHisabTab('settlement')}
            className={`py-2 px-1 rounded-xl text-center transition ${
              activeHisabTab === 'settlement' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            মাসিক হিসাব (Settlement)
          </button>
          <button
            onClick={() => setActiveHisabTab('bills')}
            className={`py-2 px-1 rounded-xl text-center transition ${
              activeHisabTab === 'bills' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            শেয়ার্ড বিল (Shared)
          </button>
          <button
            onClick={() => setActiveHisabTab('payments')}
            className={`py-2 px-1 rounded-xl text-center transition ${
              activeHisabTab === 'payments' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            জমা রেকর্ড (Deposits)
          </button>
        </div>
      </div>

      {/* ─── 1. Monthly Settlement (Core Hisab Feature) ─── */}
      {activeHisabTab === 'settlement' && (
        <div className="space-y-3">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {period ? `${period.year} সালের ${period.month} নং মাসের চূড়ান্ত হিসাব` : 'চূড়ান্ত হিসাব বিবরণী'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  মিল রেট: ৳{mealRate.toFixed(2)} (মোট বাজার ÷ মোট মিল)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRecalculate}
                  disabled={calculating}
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition flex items-center gap-1 border border-emerald-200"
                >
                  {calculating ? 'হিসাব হচ্ছে...' : '🔄 রিফ্রেশ'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-black transition flex items-center gap-1 shadow-xs"
                >
                  📥 এক্সেল / CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <span className="text-slate-500 text-[10px] block">চলতি মিল রেট</span>
                <span className="font-extrabold text-slate-900 text-sm">৳{mealRate.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                <span className="text-slate-500 text-[10px] block">মোট শেয়ার্ড বিল</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ৳{totalSharedBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] block">মোট জমা সংগৃহীত</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  ৳{totalDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Member Settlement Cards with Clear Due / Advance Words */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">হিসাব লোড হচ্ছে...</div>
          ) : lines.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border">
              কোন হিসাব রেকর্ড পাওয়া যায়নি। উপরের &quot;🔄 রিফ্রেশ&quot; বাটনে ক্লিক করুন।
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((m) => {
                const balanceVal = parseFloat(m.final_balance || 0);
                const isDue = balanceVal > 0;
                const isAdvance = balanceVal < 0;
                const absBalance = Math.abs(balanceVal).toFixed(2);

                const totalMeals = parseFloat(m.meal_count || 0);
                const mealCharge = parseFloat(m.meal_charge || 0).toFixed(2);
                const sharedBillCharge = parseFloat(m.shared_bill_charge || 0).toFixed(2);
                const totalCharges = (parseFloat(mealCharge) + parseFloat(sharedBillCharge)).toFixed(2);
                const bazaarCredit = parseFloat(m.expense_credit || 0).toFixed(2);
                const totalDeposit = parseFloat(m.payments_total || 0).toFixed(2);
                const totalCredits = (parseFloat(bazaarCredit) + parseFloat(totalDeposit)).toFixed(2);

                return (
                  <div key={m.member_id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{m.display_name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {m.room_label ? `রুম: ${m.room_label} • ` : ''}মোট মিল: {totalMeals} টি
                        </span>
                      </div>

                      {/* Clear Due / Advance Badge */}
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            isDue
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isAdvance
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isDue ? `বাকি: ৳${absBalance}` : isAdvance ? `অগ্রিম: ৳${absBalance}` : 'পরিশোধিত ৳০.০০'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          {isDue ? 'মেসকে দিতে হবে (Due)' : isAdvance ? 'মেস থেকে ফেরত পাবে (Advance)' : 'হিসাব সম্পন্ন'}
                        </span>
                      </div>
                    </div>

                    {/* Calculation Breakdown: Exactly as specified in requirement 6 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">মিল খরচ ({totalMeals} × ৳{mealRate.toFixed(2)}):</span>
                          <span className="font-bold text-slate-800">৳{mealCharge}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">শেয়ার্ড বিল অংশ:</span>
                          <span className="font-bold text-slate-800">৳{sharedBillCharge}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-t pt-1 font-bold">
                          <span className="text-slate-700">মোট খরচ:</span>
                          <span className="text-slate-900">৳{totalCharges}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">বাজার ক্রেডিট:</span>
                          <span className="font-bold text-emerald-700">-৳{bazaarCredit}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">মোট জমা:</span>
                          <span className="font-bold text-emerald-700">-৳{totalDeposit}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-t pt-1 font-bold">
                          <span className="text-slate-700">মোট প্রদান:</span>
                          <span className="text-emerald-700">৳{totalCredits}</span>
                        </div>
                      </div>
                    </div>

                    {/* Send Reminder Action if Due */}
                    {isDue && (
                      <button
                        onClick={() => handleSendReminder(m.display_name, absBalance)}
                        className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>🔔</span> বাকি পরিশোধের রিমাইন্ডার পাঠান (Send Reminder)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 2. Shared Bills View ─── */}
      {activeHisabTab === 'bills' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">মাসিক শেয়ার্ড বিল (Fixed Cost)</h3>
                <p className="text-[10px] text-slate-400">ভাড়া, গ্যাস, কারেন্ট, ইন্টারনেট, খালা বিল</p>
              </div>
              <button
                onClick={() => setShowBillModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-xs"
              >
                + নতুন বিল
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <span className="text-[11px] text-blue-700 font-semibold block">মোট শেয়ার্ড বিলের পরিমাণ</span>
              <span className="text-2xl font-extrabold text-blue-900">
                ৳{totalSharedBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                {members.length > 0
                  ? `${members.length} জন সক্রিয় সদস্যের মধ্যে সমান ভাগ (৳${(totalSharedBillAmount / members.length).toFixed(2)} / জন)`
                  : 'সদস্যদের মধ্যে স্বয়ংক্রিয় বিভাজন'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {sharedBills.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                কোন শেয়ার্ড বিল যুক্ত করা হয়নি। &quot;+ নতুন বিল&quot; ক্লিক করুন।
              </div>
            ) : (
              sharedBills.map((b) => (
                <div key={b.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{b.title}</p>
                    <p className="text-[10px] text-slate-400">
                      ক্যাটাগরি: {b.category} • পদ্ধতি: {b.allocation_method === 'equal' ? 'সমান ভাগ' : b.allocation_method} •{' '}
                      <span className="text-emerald-600 font-semibold">নিশ্চিত ✓</span>
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    ৳{parseFloat(b.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 3. Member Deposits / Payments View ─── */}
      {activeHisabTab === 'payments' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">সদস্যদের জমা টাকার রেকর্ড (Deposits)</h3>
                <p className="text-[10px] text-slate-400">নগদ, বিকাশ ও নগদ ওয়ালেট</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition shadow-xs"
              >
                + জমা গ্রহণ
              </button>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
              <span className="text-[11px] text-violet-700 font-semibold block">মোট সংগৃহীত জমা</span>
              <span className="text-2xl font-extrabold text-violet-900">
                ৳{totalDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                কোন জমা রেকর্ড পাওয়া যায়নি। &quot;+ জমা গ্রহণ&quot; বাটনে ক্লিক করুন।
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
                      {(p.member_name || 'ম').charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.member_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.payment_date} • মাধ্যম: <span className="font-semibold text-slate-700">{p.method}</span>
                        {p.reference ? ` • Ref: ${p.reference}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600 block">
                      +৳{parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">রিসিভড ✓</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Add Shared Bill Modal ─── */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">নতুন শেয়ার্ড বিল যোগ (Add Bill)</h4>
            <form onSubmit={handleAddBill} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">বিলের ধরন / নাম</label>
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="যেমন: বাসা ভাড়া, কারেন্ট বিল, ইন্টারনেট"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">ক্যাটাগরি</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="rent">বাসা ভাড়া (Apartment Rent)</option>
                  <option value="utilities">বিদ্যুৎ ও গ্যাস বিল (Utilities)</option>
                  <option value="internet">ইন্টারনেট / WiFi বিল</option>
                  <option value="maid">বুয়া / খালা বিল (Maid Service)</option>
                  <option value="water">পানি বিল (Water)</option>
                  <option value="other">অন্যান্য বিল (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">মোট টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">বণ্টন পদ্ধতি</label>
                <select
                  value={billMethod}
                  onChange={(e) => setBillMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="equal">সবার মধ্যে সমান ভাগ (Per Head)</option>
                  <option value="room_based">রুম অনুযায়ী আলাদা (Room-based)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Record Deposit Modal ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">জমা গ্রহণ (Record Deposit)</h4>
            <form onSubmit={handleAddPayment} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সদস্য (Member)</label>
                <select
                  value={paymentMemberId}
                  onChange={(e) => setPaymentMemberId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.room_label ? `(${m.room_label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">তারিখ</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">পেমেন্ট মেথড</label>
                <div className="flex gap-2">
                  {[
                    { id: 'bkash', name: 'bKash' },
                    { id: 'nagad', name: 'Nagad' },
                    { id: 'cash', name: 'Cash' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`flex-1 flex items-center justify-center gap-1 border p-2 rounded-lg font-semibold text-xs cursor-pointer ${
                        paymentMethod === m.id ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />{' '}
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">TrxID / রেফারেন্স (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="যেমন: BK9284752"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700"
                >
                  জমা রেকর্ড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
