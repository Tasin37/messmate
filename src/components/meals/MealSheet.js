'use client';

import { useState, useEffect, useCallback } from 'react';

export default function MealSheet({ activeMess, onMealUpdated }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeSlot, setActiveSlot] = useState('lunch');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMealOffModal, setShowMealOffModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real Database State
  const [members, setMembers] = useState([]);
  const [mealRecords, setMealRecords] = useState([]);
  const [slots, setSlots] = useState([]);

  // Guest modal state
  const [guestHostId, setGuestHostId] = useState('');
  const [guestSlotCode, setGuestSlotCode] = useState('lunch');
  const [guestCount, setGuestCount] = useState(1);
  const [guestNote, setGuestNote] = useState('');

  // Meal off modal state
  const [mealOffMemberId, setMealOffMemberId] = useState('');
  const [mealOffReason, setMealOffReason] = useState('');

  // 1. Fetch slots and members
  const fetchMembersAndSlots = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/members?status=active`);
      const data = await res.json();
      if (data.data) {
        setMembers(data.data);
        if (data.data[0]) {
          setGuestHostId(data.data[0].id);
          setMealOffMemberId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [activeMess?.id]);

  // 2. Fetch meals for date
  const fetchMealsForDate = useCallback(async () => {
    if (!activeMess?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/meals?date=${selectedDate}`);
      const data = await res.json();
      if (data.data) {
        setSlots(data.data.slots || []);
        setMealRecords(data.data.meals || []);
      }
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMess?.id, selectedDate]);

  useEffect(() => {
    fetchMembersAndSlots();
  }, [fetchMembersAndSlots]);

  useEffect(() => {
    fetchMealsForDate();
  }, [fetchMealsForDate]);

  // Find slot ID by code
  const currentSlotObj = slots.find((s) => s.code === activeSlot) || slots[0];

  // Helper to get quantity for a member and slot
  const getMemberSlotQuantity = (memberId, slotCode) => {
    const slot = slots.find((s) => s.code === slotCode);
    if (!slot) return 1.0; // default
    const entry = mealRecords.find(
      (m) => m.member_id === memberId && m.meal_slot_id === slot.id && m.entry_type === 'self'
    );
    return entry ? Number(entry.quantity) : 1.0;
  };

  // Stepper quantity update -> writes to database!
  const updateQuantity = async (memberId, delta) => {
    if (!activeMess?.id || !currentSlotObj) return;
    const current = getMemberSlotQuantity(memberId, activeSlot);
    const nextQty = Math.max(0, current + delta);

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          mealDate: selectedDate,
          mealSlotId: currentSlotObj.id,
          quantity: nextQty,
          entryType: 'self',
        }),
      });

      if (res.ok) {
        fetchMealsForDate();
        if (onMealUpdated) onMealUpdated();
      }
    } catch (err) {
      console.error('Failed to save meal:', err);
    }
  };

  // Add Guest Meal -> writes to database!
  const handleAddGuestMeal = async () => {
    if (!activeMess?.id || !guestHostId) return;
    const targetSlot = slots.find((s) => s.code === guestSlotCode) || currentSlotObj;
    if (!targetSlot) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: guestHostId,
          mealDate: selectedDate,
          mealSlotId: targetSlot.id,
          quantity: Number(guestCount),
          entryType: 'guest',
          hostMemberId: guestHostId,
          note: guestNote || 'মেহমান মিল',
        }),
      });

      if (res.ok) {
        alert('মেহমান মিল ডাটাবেজে সংরক্ষিত হয়েছে!');
        setShowGuestModal(false);
        fetchMealsForDate();
        if (onMealUpdated) onMealUpdated();
      }
    } catch (err) {
      alert('মেহমান মিল সংরক্ষণে ত্রুটি: ' + err.message);
    }
  };

  // Submit Meal Off Request -> writes to database!
  const handleMealOff = async () => {
    if (!activeMess?.id || !mealOffMemberId) return;
    const targetSlot = currentSlotObj;
    if (!targetSlot) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/meal-off-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: mealOffMemberId,
          mealDate: selectedDate,
          mealSlotId: targetSlot.id,
          reason: mealOffReason || 'ব্যক্তিগত কারণ',
        }),
      });

      if (res.ok) {
        alert('মিল বন্ধের আবেদন সফলভাবে পাঠানো হয়েছে!');
        setShowMealOffModal(false);
        if (onMealUpdated) onMealUpdated();
      }
    } catch (err) {
      alert('আবেদন পাঠাতে ত্রুটি: ' + err.message);
    }
  };

  // Compute daily totals
  const totalMealsForDate = mealRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const guestRecords = mealRecords.filter((r) => r.entry_type === 'guest');

  return (
    <div className="space-y-4">
      {/* Date & Quick Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">তারিখ নির্বাচন (Date)</label>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            দৈনিক মোট মিল: {totalMealsForDate} টি
          </span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Meal Slot Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'breakfast', labelBn: 'সকাল', labelEn: 'Breakfast' },
            { id: 'lunch', labelBn: 'দুপুর', labelEn: 'Lunch' },
            { id: 'dinner', labelBn: 'রাত', labelEn: 'Dinner' },
          ].map((tab) => {
            const count = mealRecords
              .filter((m) => m.slot_code === tab.id)
              .reduce((s, r) => s + Number(r.quantity || 0), 0);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSlot(tab.id)}
                className={`py-2 px-1 rounded-lg text-center transition-all ${
                  activeSlot === tab.id
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div>{tab.labelBn}</div>
                <div className="text-[10px] font-medium opacity-80">{count} টি</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: Guest Meal & Meal Off */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowGuestModal(true)}
          className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-500 flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span className="text-emerald-600 font-extrabold">+</span>
          মেহমান মিল যোগ (Guest Meal)
        </button>

        <button
          onClick={() => setShowMealOffModal(true)}
          className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-amber-700 hover:border-amber-500 flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span>✋</span>
          মিল বন্ধের আবেদন (Meal Off)
        </button>
      </div>

      {/* Member Meal Stepper List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>সদস্য তালিকা (Members - {members.length} জন)</span>
          <span>{activeSlot.toUpperCase()} মিল সংখ্যা</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">ডাটা লোড হচ্ছে...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const qty = getMemberSlotQuantity(m.id, activeSlot);

              return (
                <div key={m.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.display_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">রুম নং: {m.room_label || 'সিট ১'}</p>
                  </div>

                  {/* Quantity Stepper (auto-saves to DB) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(m.id, -0.5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 font-extrabold flex items-center justify-center transition"
                    >
                      -
                    </button>

                    <span className="w-9 text-center font-bold text-sm text-slate-900">
                      {qty}
                    </span>

                    <button
                      onClick={() => updateQuantity(m.id, 0.5)}
                      className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-90 text-emerald-700 font-extrabold flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest Meals Section */}
      {guestRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800">আজকের মেহমান মিল (Guest Meals)</h4>
          <div className="space-y-1.5">
            {guestRecords.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs"
              >
                <div>
                  <span className="font-bold text-amber-900">হোস্ট: {g.member_name}</span>
                  <span className="text-[10px] text-amber-700 block">{g.note || 'মেহমান'}</span>
                </div>
                <span className="font-extrabold text-amber-900">{g.quantity} টি</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Meal Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
              মেহমান মিল যোগ করুন (Add Guest Meal)
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">হোস্ট সদস্য (Host)</label>
                <select
                  value={guestHostId}
                  onChange={(e) => setGuestHostId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">মিল স্লট (Slot)</label>
                <select
                  value={guestSlotCode}
                  onChange={(e) => setGuestSlotCode(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  <option value="breakfast">সকাল (Breakfast)</option>
                  <option value="lunch">দুপুর (Lunch)</option>
                  <option value="dinner">রাত (Dinner)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">সংখ্যা (Count)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">নোট / মেহমানের নাম</label>
                <input
                  value={guestNote}
                  onChange={(e) => setGuestNote(e.target.value)}
                  placeholder="যেমন: কাজিন / বন্ধু"
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGuestModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddGuestMeal}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Off Modal */}
      {showMealOffModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
              মিল বন্ধের আবেদন (Meal-Off Request)
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সদস্য (Member)</label>
                <select
                  value={mealOffMemberId}
                  onChange={(e) => setMealOffMemberId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
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
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">কারণ (Reason)</label>
                <input
                  value={mealOffReason}
                  onChange={(e) => setMealOffReason(e.target.value)}
                  placeholder="যেমন: বাড়িতে যাবো / অফিসে ডিনার"
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowMealOffModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={handleMealOff}
                className="flex-1 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700"
              >
                আবেদন পাঠান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
