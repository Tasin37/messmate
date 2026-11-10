'use client';

import { useState } from 'react';

export default function MealSheet() {
  const [selectedDate, setSelectedDate] = useState('2026-11-10');
  const [activeSlot, setActiveSlot] = useState('lunch'); // 'breakfast' | 'lunch' | 'dinner'
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMealOffModal, setShowMealOffModal] = useState(false);

  // Mock members data for demonstration & interactive testing
  const [members, setMembers] = useState([
    { id: 'm1', name: 'তানভীর আহমেদ / Tanvir', room: '২০১', breakfast: 1, lunch: 1, dinner: 1 },
    { id: 'm2', name: 'রাকিবুল হাসান / Rakib', room: '২০২', breakfast: 1, lunch: 0, dinner: 1 },
    { id: 'm3', name: 'সাকিব মাহমুদ / Sakib', room: '২০৩', breakfast: 0.5, lunch: 1, dinner: 1 },
    { id: 'm4', name: 'নাঈম ইসলাম / Naim', room: '২০৪', breakfast: 1, lunch: 1, dinner: 1 },
  ]);

  const [guestMeals, setGuestMeals] = useState([
    { id: 'g1', hostName: 'তানভীর আহমেদ', slot: 'lunch', count: 1, note: 'বন্ধু / Friend' },
  ]);

  const updateQuantity = (memberId, slot, delta) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const current = m[slot];
          const next = Math.max(0, current + delta);
          return { ...m, [slot]: next };
        }
        return m;
      })
    );
  };

  const getSlotTotal = (slot) => {
    const memberTotal = members.reduce((sum, m) => sum + m[slot], 0);
    const guestTotal = guestMeals
      .filter((g) => g.slot === slot)
      .reduce((sum, g) => sum + g.count, 0);
    return memberTotal + guestTotal;
  };

  const todayDailyTotal =
    getSlotTotal('breakfast') + getSlotTotal('lunch') + getSlotTotal('dinner');

  return (
    <div className="space-y-4">
      {/* Date & Quick Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">তারিখ নির্বাচন (Date)</label>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            দৈনিক মোট মিল: {todayDailyTotal} টি
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
            { id: 'breakfast', labelBn: 'সকাল', labelEn: 'Breakfast', count: getSlotTotal('breakfast') },
            { id: 'lunch', labelBn: 'দুপুর', labelEn: 'Lunch', count: getSlotTotal('lunch') },
            { id: 'dinner', labelBn: 'রাত', labelEn: 'Dinner', count: getSlotTotal('dinner') },
          ].map((tab) => (
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
              <div className="text-[10px] font-medium opacity-80">{tab.count} টি</div>
            </button>
          ))}
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
          <span>সদস্য তালিকা (Members)</span>
          <span>{activeSlot.toUpperCase()} মিল সংখ্যা</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{m.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">রুম নং: {m.room}</p>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(m.id, activeSlot, -0.5)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 font-extrabold flex items-center justify-center transition"
                >
                  -
                </button>

                <span className="w-9 text-center font-bold text-sm text-slate-900">
                  {m[activeSlot]}
                </span>

                <button
                  onClick={() => updateQuantity(m.id, activeSlot, 0.5)}
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-90 text-emerald-700 font-extrabold flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guest Meals Section */}
      {guestMeals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800">আজকের মেহমান মিল (Guest Meals)</h4>
          <div className="space-y-1.5">
            {guestMeals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs"
              >
                <div>
                  <span className="font-bold text-amber-900">হোস্ট: {g.hostName}</span>
                  <span className="text-[10px] text-amber-700 block">{g.note}</span>
                </div>
                <span className="font-extrabold text-amber-900">{g.count} টি</span>
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
                <select className="w-full border border-slate-200 rounded-lg p-2">
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">মিল স্লট (Slot)</label>
                <select className="w-full border border-slate-200 rounded-lg p-2">
                  <option value="breakfast">সকাল (Breakfast)</option>
                  <option value="lunch">দুপুর (Lunch)</option>
                  <option value="dinner">রাত (Dinner)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">সংখ্যা (Count)</label>
                <input type="number" defaultValue="1" className="w-full border border-slate-200 rounded-lg p-2" />
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
                onClick={() => {
                  alert('মেহমান মিল যোগ হয়েছে!');
                  setShowGuestModal(false);
                }}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
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
                <label className="block text-slate-600 font-medium mb-1">তারিখ (Date)</label>
                <input type="date" defaultValue="2026-11-11" className="w-full border border-slate-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">কোন মিল বন্ধ থাকবে?</label>
                <div className="flex gap-2 mt-1">
                  {['সকাল', 'দুপুর', 'রাত'].map((s) => (
                    <label key={s} className="flex items-center gap-1">
                      <input type="checkbox" defaultChecked /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">কারণ (Reason)</label>
                <input placeholder="বাড়িতে যাবো / Going home" className="w-full border border-slate-200 rounded-lg p-2" />
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
                onClick={() => {
                  alert('মিল বন্ধের আবেদন সফলভাবে পাঠানো হয়েছে!');
                  setShowMealOffModal(false);
                }}
                className="flex-1 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl"
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
