import React from 'react';
import { GraduationCap, Users, Target } from 'lucide-react';

export default function HeroIllustration() {
  return (
    <div className="hero-illustration-wrapper">
      {/* Soft Cloud Ambient Backdrop */}
      <div className="hero-cloud-backdrop" />

      {/* SVG Connecting Dashed Lines */}
      <svg
        className="hero-connectors-svg"
        viewBox="0 0 520 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M 330 90 C 330 140 330 180 330 200"
          stroke="#93c5fd"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        <path
          d="M 180 180 C 230 180 270 200 290 220"
          stroke="#93c5fd"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        <path
          d="M 430 170 C 390 170 370 200 350 220"
          stroke="#93c5fd"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Floating Badges */}
      {/* 1. Top Badge: Get Guidance */}
      <div className="hero-float-badge badge-top">
        <div className="float-badge-icon">
          <GraduationCap size={16} />
        </div>
        <span>Get Guidance</span>
      </div>

      {/* 2. Left Badge: Find Mentors */}
      <div className="hero-float-badge badge-left">
        <div className="float-badge-icon">
          <Users size={16} />
        </div>
        <span>Find Mentors</span>
      </div>

      {/* 3. Right Badge: Achieve Goals */}
      <div className="hero-float-badge badge-right">
        <div className="float-badge-icon">
          <Target size={16} />
        </div>
        <span>Achieve Goals</span>
      </div>

      {/* Vector Illustration: Girl with Laptop & Plant */}
      <div className="hero-character-art">
        <svg
          viewBox="0 0 460 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="hero-svg-character"
          role="img"
          aria-label="Illustration of a student using a laptop for mentorship"
        >
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fcd34d" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="sweaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="plantPotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Desk Base Line */}
          <rect x="20" y="340" width="420" height="8" rx="4" fill="url(#deskGrad)" />

          {/* Plant on Desk (Right side) */}
          <g className="hero-plant">
            {/* Pot */}
            <path d="M 370 315 L 366 340 L 394 340 L 390 315 Z" fill="url(#plantPotGrad)" />
            {/* Leaves */}
            <path
              d="M 380 315 C 375 285 365 270 355 275 C 365 295 375 305 380 315 Z"
              fill="url(#leafGrad)"
            />
            <path
              d="M 380 315 C 385 280 395 260 405 270 C 395 290 385 305 380 315 Z"
              fill="#2563eb"
            />
            <path
              d="M 380 315 C 378 285 380 260 382 250 C 385 275 383 295 380 315 Z"
              fill="#1d4ed8"
            />
            <path
              d="M 380 315 C 360 300 350 310 345 320 C 360 322 372 320 380 315 Z"
              fill="#93c5fd"
            />
          </g>

          {/* Character Group */}
          <g className="hero-person">
            {/* Hair Back */}
            <path
              d="M 190 190 C 180 150 200 115 240 115 C 285 115 295 150 285 220 C 275 260 250 270 230 270 C 205 270 195 230 190 190 Z"
              fill="url(#hairGrad)"
            />

            {/* Torso / Blue Sweater */}
            <path
              d="M 180 340 C 185 290 200 240 235 240 C 270 240 290 280 305 340 Z"
              fill="url(#sweaterGrad)"
            />

            {/* Left Arm / Shoulder */}
            <path
              d="M 180 340 C 180 300 190 260 215 255 L 205 310 C 200 330 190 340 180 340 Z"
              fill="#1d4ed8"
            />

            {/* Neck */}
            <path d="M 235 220 L 245 220 L 243 250 L 235 250 Z" fill="#fdba74" />

            {/* Head & Face */}
            <ellipse cx="242" cy="190" rx="22" ry="26" fill="url(#skinGrad)" />

            {/* Facial Features */}
            {/* Eyebrows & Eyes (Look up and smiling) */}
            <path
              d="M 235 182 Q 240 179 244 182"
              stroke="#475569"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M 248 182 Q 253 179 257 182"
              stroke="#475569"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="240" cy="188" r="2.2" fill="#0f172a" />
            <circle cx="253" cy="188" r="2.2" fill="#0f172a" />

            {/* Cute Blush */}
            <ellipse cx="233" cy="195" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6" />
            <ellipse cx="258" cy="195" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6" />

            {/* Nose & Smile */}
            <path
              d="M 245 190 Q 246 195 244 196"
              stroke="#ea580c"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 241 202 Q 246 206 251 202"
              stroke="#b91c1c"
              strokeWidth="1.6"
              strokeLinecap="round"
            />

            {/* Hair Front / Bangs */}
            <path
              d="M 220 180 C 220 150 235 140 255 145 C 270 148 265 170 262 178 C 255 168 245 168 238 174 C 230 180 225 185 220 180 Z"
              fill="url(#hairGrad)"
            />
            {/* Left ear */}
            <ellipse cx="221" cy="192" rx="3" ry="5" fill="#fcd34d" />

            {/* Right Arm - Hand resting thoughtfully under chin */}
            <path
              d="M 285 270 C 285 270 275 250 265 240 L 255 220 C 253 218 249 220 250 225 L 260 255 C 265 270 270 300 275 340 Z"
              fill="url(#sweaterGrad)"
            />
            {/* Hand under chin */}
            <circle cx="250" cy="216" r="6" fill="url(#skinGrad)" />

            {/* Laptop Base & Screen */}
            {/* Screen Back */}
            <path
              d="M 290 235 L 350 235 L 342 335 L 282 335 Z"
              fill="url(#laptopGrad)"
              transform="rotate(-8 316 285)"
            />
            {/* Minimalist Logo on Laptop */}
            <circle cx="316" cy="280" r="3.5" fill="#ffffff" opacity="0.9" />

            {/* Laptop Keyboard Base on Desk */}
            <path d="M 270 338 L 355 338 L 362 342 L 265 342 Z" fill="#94a3b8" />
          </g>
        </svg>
      </div>
    </div>
  );
}
