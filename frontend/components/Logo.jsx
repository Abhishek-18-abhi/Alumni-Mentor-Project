import React from 'react';

export default function Logo({ showText = true, size = 34 }) {
  return (
    <div className="brand">
      <div className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
        <svg
          width={Math.round(size * 0.58)}
          height={Math.round(size * 0.58)}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mortarboard Diamond */}
          <path d="M32 13L10 24L32 35L54 24L32 13Z" fill="#FFFFFF" />
          
          {/* Cap Base Arc */}
          <path
            d="M18 28.5V40C18 45.5 24 49 32 49C40 49 46 45.5 46 40V28.5"
            stroke="#FFFFFF"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Tassel String and Ring */}
          <path d="M49 26V40.5" stroke="#90E0EF" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="49" cy="42" r="2.5" fill="#CAF0F8" />
          
          {/* Connected Mentorship Nodes */}
          <circle cx="32" cy="24" r="3" fill="#0077B6" />
          <circle cx="32" cy="38" r="3" fill="#00B4D8" />
          <path
            d="M32 27V35"
            stroke="#90E0EF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
      {showText && (
        <span className="brand-text">
          Mentor<span className="brand-accent">Connect</span>
        </span>
      )}
    </div>
  );
}
