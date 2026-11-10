'use client';

export default function TrendsChart({ days: propDays }) {
  // 7-day daily trend: accept prop or fallback to recent days
  const defaultDays = [
    { day: 'বুধ / Wed', date: '৪ নভে', meals: 14, bazar: 850 },
    { day: 'বৃহঃ / Thu', date: '৫ নভে', meals: 16, bazar: 1200 },
    { day: 'শুক্র / Fri', date: '৬ নভে', meals: 18, bazar: 2400 },
    { day: 'শনি / Sat', date: '৭ নভে', meals: 15, bazar: 650 },
    { day: 'রবি / Sun', date: '৮ নভে', meals: 17, bazar: 1450 },
    { day: 'সোম / Mon', date: '৯ নভে', meals: 16, bazar: 980 },
    { day: 'মঙ্গল / Tue', date: '১০ নভে', meals: 17, bazar: 1850 },
  ];

  const days = propDays && propDays.length > 0 ? propDays : defaultDays;
  const maxBazar = Math.max(...days.map((d) => d.bazar || 1), 1);
  const maxMeals = Math.max(...days.map((d) => d.meals || 1), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-slate-900">দৈনিক খরচ ও মিল ট্রেন্ড (Daily Trend)</h3>
          <p className="text-[10px] text-slate-400">গত ৭ দিনের বাজার ও খাবার পরিসংখ্যান</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> বাজার (৳)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> মিল (সংখ্যা)
          </span>
        </div>
      </div>

      {/* Bar Chart Representation */}
      <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4 px-1 border-b border-slate-100 pb-2">
        {days.map((d, i) => {
          const bazarHeight = Math.round(((d.bazar || 0) / maxBazar) * 100);
          const mealHeight = Math.round(((d.meals || 0) / maxMeals) * 100);

          return (
            <div key={i} className="flex flex-col items-center h-full justify-end group">
              <div className="text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition mb-1">
                ৳{d.bazar || 0}
              </div>
              <div className="w-full flex items-end justify-center gap-1 h-24">
                {/* Bazar bar */}
                <div
                  style={{ height: `${Math.max(bazarHeight, 6)}%` }}
                  className="w-2.5 bg-emerald-500 rounded-t-sm group-hover:bg-emerald-600 transition"
                  title={`বাজার: ৳${d.bazar || 0}`}
                ></div>
                {/* Meal bar */}
                <div
                  style={{ height: `${Math.max(mealHeight, 6)}%` }}
                  className="w-2.5 bg-blue-400 rounded-t-sm group-hover:bg-blue-500 transition"
                  title={`মিল: ${d.meals || 0} টি`}
                ></div>
              </div>
              <span className="text-[9px] text-slate-500 mt-2 block font-medium truncate w-full text-center">
                {(d.day || '').split('/')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
