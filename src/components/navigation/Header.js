'use client';

export default function Header({
  messName = 'মেস মেট (MessMate)',
  periodLabel = 'নভেম্বর ২০২৬ / Nov 2026',
  userName = 'সদস্য / Member',
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
              {messName}
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            চলতি হিসাব: <span className="text-gray-700 font-semibold">{periodLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{userName}</p>
            <p className="text-[11px] text-emerald-600 font-medium">সক্রিয় সদস্য (Active)</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-200">
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
