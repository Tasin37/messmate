'use client';

import { useState } from 'react';

export default function Header({
  messes = [],
  activeMess = null,
  onSelectMess = () => {},
  onOpenCreateMess = () => {},
  user = null,
  onOpenAuth = () => {},
  periodLabel = 'নভেম্বর ২০২৬',
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Mess Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-left group"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-base font-extrabold text-gray-900 tracking-tight leading-tight group-hover:text-emerald-700 transition">
                  {activeMess?.name || 'মেস মেট (MessMate)'}
                </h1>
                <span className="text-xs text-gray-400">▼</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                হিসাব: <span className="text-gray-700 font-bold">{periodLabel}</span>
              </p>
            </div>
          </button>

          {/* Mess Dropdown Menu */}
          {showDropdown && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                আপনার মেসসমূহ
              </div>
              {messes.length === 0 ? (
                <div className="px-3 py-2 text-slate-500 italic">কোনো মেস পাওয়া যায়নি</div>
              ) : (
                messes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMess(m);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      m.id === activeMess?.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span>{m.name}</span>
                    {m.id === activeMess?.id && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>
                ))
              )}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenCreateMess();
                  }}
                  className="w-full text-left px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
                >
                  <span>+</span> নতুন মেস খুলুন বা যুক্ত হোন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Login Button */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 text-right hover:opacity-80 transition"
            >
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900">{user.name || 'সদস্য'}</p>
                <p className="text-[10px] text-emerald-600 font-medium">লগইন অবস্থায় আছেন</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-200">
                {(user.name || 'U').charAt(0)}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              লগইন / সাইন-আপ 🔑
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
