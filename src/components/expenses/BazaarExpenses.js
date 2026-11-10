'use client';

import { useState, useEffect, useCallback } from 'react';

export default function BazaarExpenses({ activeMess, onExpenseAdded }) {
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'roster'
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddRosterModal, setShowAddRosterModal] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live Database State
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [roster, setRoster] = useState([]);

  // Form states for new expense
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  // Form states for new roster
  const [rosterMemberId, setRosterMemberId] = useState('');
  const [rosterDutyDate, setRosterDutyDate] = useState(new Date().toISOString().slice(0, 10));
  const [rosterNote, setRosterNote] = useState('');

  // Fetch categories, members, expenses, and roster
  const fetchExpensesAndCategories = useCallback(async () => {
    if (!activeMess?.id) return;
    setLoading(true);
    try {
      const [expRes, catRes, memRes] = await Promise.all([
        fetch(`/api/v1/messes/${activeMess.id}/expenses`),
        fetch(`/api/v1/messes/${activeMess.id}/categories`),
        fetch(`/api/v1/messes/${activeMess.id}/members?status=active`),
      ]);

      const expData = await expRes.json();
      const catData = await catRes.json();
      const memData = await memRes.json();

      if (expData.data) setExpenses(expData.data);
      if (catData.data) {
        setCategories(catData.data);
        if (catData.data[0]) setExpenseCategoryId(catData.data[0].id);
      }
      if (memData.data) {
        setMembers(memData.data);
        if (memData.data[0]) {
          setExpensePaidBy(memData.data[0].id);
          setRosterMemberId(memData.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load bazaar expenses data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMess?.id]);

  const fetchRoster = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/bazaar-roster`);
      const data = await res.json();
      if (data.data) {
        setRoster(data.data);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    }
  }, [activeMess?.id]);

  useEffect(() => {
    fetchExpensesAndCategories();
    fetchRoster();
  }, [fetchExpensesAndCategories, fetchRoster]);

  const totalBazar = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || !expenseCategoryId || !expensePaidBy) {
      alert('অনুগ্রহ করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন / Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseTitle,
          amount: parseFloat(expenseAmount).toFixed(2),
          expenseDate,
          categoryId: expenseCategoryId,
          paidByMemberId: expensePaidBy,
          note: expenseNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save expense');
      }

      alert('বাজার খরচ সফলভাবে যুক্ত হয়েছে! / Expense added successfully!');
      setShowAddExpenseModal(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNote('');
      setReceiptPreview(null);
      await fetchExpensesAndCategories();
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      alert('ভুল হয়েছে: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoster = async (e) => {
    e.preventDefault();
    if (!rosterMemberId || !rosterDutyDate) {
      alert('সদস্য ও তারিখ নির্বাচন করুন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/bazaar-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: rosterMemberId,
          dutyDate: rosterDutyDate,
          note: rosterNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save roster');
      }

      alert('বাজারের রোস্টার সফলভাবে নির্ধারিত হয়েছে!');
      setShowAddRosterModal(false);
      setRosterNote('');
      await fetchRoster();
    } catch (err) {
      alert('ভুল হয়েছে: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs">
        <div className="grid grid-cols-2 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`py-2 px-2 rounded-xl text-center transition ${
              activeSubTab === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            দৈনিক বাজার খরচ (Expenses)
          </button>
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`py-2 px-2 rounded-xl text-center transition ${
              activeSubTab === 'roster' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            বাজার শিডিউল / রোস্টার (Roster)
          </button>
        </div>
      </div>

      {/* ─── 1. Expenses View ─── */}
      {activeSubTab === 'list' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">চলতি মাসের মোট বাজার</h3>
                <p className="text-[10px] text-slate-400">মিল রেটের প্রধান অংশ (Total Bazaar)</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-xs"
              >
                + নতুন বাজার এন্ট্রি
              </button>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-semibold block">মোট বাজার খরচ</span>
              <span className="text-2xl font-extrabold text-emerald-900">
                ৳{totalBazar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>খরচের তালিকা (Expense List)</span>
              <span className="text-slate-400 text-[11px]">{expenses.length} টি রেকর্ড</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                কোন বাজার খরচ নেই। নতুন যোগ করতে উপরের বাটনে ক্লিক করুন।
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {e.category_name || 'বাজার'}
                        </span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                          অনুমোদিত ✓
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{e.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {e.expense_date} • ক্রেতা:{' '}
                        <span className="font-semibold text-slate-700">{e.paid_by_name || 'সদস্য'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        ৳{parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 2. Bazaar Roster View ─── */}
      {activeSubTab === 'roster' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">বাজার করার রোস্টার শিডিউল</h3>
                <p className="text-[10px] text-slate-400">কার কোনদিন বাজার করার পালা (Roster)</p>
              </div>
              <button
                onClick={() => setShowAddRosterModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
              >
                + রোস্টার সেট করুন
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {roster.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                রোস্টার তৈরি করা হয়নি। &quot;+ রোস্টার সেট করুন&quot; ক্লিক করুন।
              </div>
            ) : (
              roster.map((r) => {
                const isToday = r.duty_date === todayStr;
                return (
                  <div key={r.id} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {(r.member_name || 'ম').charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{r.member_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {r.room_label ? `রুম: ${r.room_label} • ` : ''}তারিখ: {r.duty_date}
                          {r.note ? ` • ${r.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isToday ? 'আজকের বাজার (Today)' : 'আসন্ন (Upcoming)'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Add Expense Modal with Receipt Upload ─── */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">বাজার খরচ এন্ট্রি (Add Bazaar)</h4>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">ক্যাটাগরি (Category)</label>
                <select
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-medium"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">বাজারের বিবরণ (কি কি কিনলেন?)</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="যেমন: চাল, তেল, মুরগি, সবজি"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">টাকার পরিমাণ (Amount ৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">তারিখ (Date)</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">কে বাজার করেছেন? (Payer)</label>
                <select
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
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

              {/* Receipt / Memo Photo Upload */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">মেমো / রসিদের ছবি (Receipt Upload)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {receiptPreview && (
                  <div className="mt-2 p-1 border rounded-lg bg-slate-50 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptPreview} alt="Receipt preview" className="w-12 h-12 object-cover rounded" />
                    <span className="text-[10px] text-emerald-700 font-semibold">ছবি নির্বাচন সম্পন্ন ✓</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Roster Modal ─── */}
      {showAddRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">বাজারের রোস্টার নির্ধারণ</h4>
            <form onSubmit={handleCreateRoster} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সদস্য (Member)</label>
                <select
                  value={rosterMemberId}
                  onChange={(e) => setRosterMemberId(e.target.value)}
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
                <label className="block text-slate-600 font-medium mb-1">তারিখ (Date)</label>
                <input
                  type="date"
                  value={rosterDutyDate}
                  onChange={(e) => setRosterDutyDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={rosterNote}
                  onChange={(e) => setRosterNote(e.target.value)}
                  placeholder="যেমন: চাল ও মসলা কিনবে"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRosterModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'নির্ধারণ হচ্ছে...' : 'নির্ধারণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
