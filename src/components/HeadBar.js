// src/components/HeaderBar.js
import React from 'react';

export default function HeaderBar({ userEmail, onSignOut }) {
  return (
    <header className="w-full border-b border-[#d9d7c8] bg-white/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: org identity */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/images/swac-oecd.png"
            alt="SWAC / OECD"
            className="h-8 w-auto object-contain opacity-80"
          />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#2f463f] tracking-wide">
              Food Security Knowledge Platform
            </div>
            <div className="text-[11px] text-[#707070]">
              Internal Document Intake
            </div>
          </div>
        </div>

        {/* Right side: user info */}
        <div className="flex items-center gap-4 text-sm text-[#2f463f]">
          {userEmail && (
            <span className="truncate max-w-[180px] text-right leading-snug text-[#2f463f]">
              {userEmail}
            </span>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-[#316c41] border border-[#316c41] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#316c41] hover:text-white transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
