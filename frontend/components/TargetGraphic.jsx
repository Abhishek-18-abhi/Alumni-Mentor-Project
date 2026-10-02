import React from 'react';

export default function TargetGraphic() {
  return (
    <div className="target-graphic-card">
      <div className="target-svg-wrap">
        <svg
          viewBox="0 0 200 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="target-svg"
          aria-hidden="true"
        >
          {/* Subtle Corner Sparkles */}
          <path d="M 45 110 L 48 115 L 45 120 L 42 115 Z" fill="#93c5fd" />
          <path d="M 155 110 L 157 114 L 155 118 L 153 114 Z" fill="#93c5fd" />

          {/* Outer Ring */}
          <circle cx="100" cy="95" r="50" stroke="#3b82f6" strokeWidth="2.5" />

          {/* Middle Ring */}
          <circle cx="100" cy="95" r="32" stroke="#60a5fa" strokeWidth="2" />

          {/* Inner Bullseye */}
          <circle cx="100" cy="95" r="14" stroke="#2563eb" strokeWidth="2.5" fill="#eff6ff" />
          <circle cx="100" cy="95" r="4.5" fill="#1d4ed8" />

          {/* Arrow Hitting the Center (Diagonal from top right) */}
          {/* Arrow Tail */}
          <line
            x1="140"
            y1="55"
            x2="105"
            y2="90"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrow Fletching */}
          <path
            d="M 136 50 L 145 59 M 141 45 L 150 54"
            stroke="#1e293b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Arrow Head */}
          <path
            d="M 102 85 L 102 93 L 110 93"
            stroke="#1e293b"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="target-copy">
        <div className="target-words">
          <span>Learn</span>
          <span className="dot">•</span>
          <span>Connect</span>
          <span className="dot">•</span>
          <span>Grow</span>
        </div>
        <div className="target-accent-bar" />
      </div>
    </div>
  );
}
