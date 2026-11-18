"use client";

import * as React from "react";

export function FluidSmokeBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Deep dark obsidian base */}
      <div className="absolute inset-0 bg-[#070707]" />

      {/* Atmospheric organic fluid smoke & volumetric light mesh */}
      <svg
        className="absolute top-0 right-0 w-full md:w-[85%] h-full opacity-60 md:opacity-75 mix-blend-screen overflow-visible animate-float-smoke"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Grayscale smoke gradient 1 */}
          <radialGradient
            id="smokeGrad1"
            cx="65%"
            cy="40%"
            r="55%"
            fx="60%"
            fy="35%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="25%" stopColor="#d4d4d8" stopOpacity="0.3" />
            <stop offset="55%" stopColor="#52525b" stopOpacity="0.15" />
            <stop offset="85%" stopColor="#18181b" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#070707" stopOpacity="0" />
          </radialGradient>

          {/* Grayscale smoke gradient 2 */}
          <radialGradient
            id="smokeGrad2"
            cx="75%"
            cy="55%"
            r="45%"
            fx="70%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#a1a1aa" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#3f3f46" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#070707" stopOpacity="0" />
          </radialGradient>

          {/* Linear veil falloff */}
          <linearGradient id="veilFade" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#71717a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </linearGradient>

          <filter id="blurVeil" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" result="blur" />
          </filter>
          <filter id="softSmoke" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="70" result="blur" />
          </filter>
        </defs>

        {/* Volumetric core glow */}
        <circle cx="820" cy="360" r="340" fill="url(#smokeGrad1)" filter="url(#softSmoke)" />
        <ellipse cx="680" cy="420" rx="420" ry="260" fill="url(#smokeGrad2)" filter="url(#softSmoke)" />

        {/* Organic twisting smoke / veil curves matching reference visual */}
        <g filter="url(#blurVeil)" opacity="0.85">
          {/* Main diagonal swirling smoke plume */}
          <path
            d="M 450 0 C 620 180, 580 320, 720 460 C 860 600, 1100 680, 1250 820 L 1250 0 Z"
            fill="url(#veilFade)"
          />
          {/* Counter twist ribbon */}
          <path
            d="M 750 0 C 680 160, 820 280, 780 480 C 740 680, 920 760, 1100 800"
            stroke="#ffffff"
            strokeWidth="80"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />
          {/* Fine luminous strand 1 */}
          <path
            d="M 520 20 C 690 190, 640 330, 810 490 C 950 620, 1150 710, 1220 780"
            stroke="#f4f4f5"
            strokeWidth="35"
            strokeOpacity="0.22"
            strokeLinecap="round"
          />
          {/* Fine luminous strand 2 */}
          <path
            d="M 580 60 C 720 220, 710 360, 860 510 C 990 640, 1180 730, 1260 760"
            stroke="#ffffff"
            strokeWidth="20"
            strokeOpacity="0.28"
            strokeLinecap="round"
          />
          {/* Translucent hourglass swirl */}
          <path
            d="M 400 120 C 650 260, 600 480, 850 560 C 1050 620, 1180 500, 1280 450"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="50"
            strokeOpacity="0.15"
          />
        </g>
      </svg>

      {/* Vignette gradients to blend seamlessly into edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/70 to-transparent" />
    </div>
  );
}
