"use client";

import * as React from "react";

export function TunnelSphereVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-full aspect-square sm:aspect-[4/3] rounded-[16px] sm:rounded-[20px] bg-[#080808] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center p-6 sm:p-8 select-none group ${className}`}
    >
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_75%,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Subtle stippled film grain noise overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14] mix-blend-overlay pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Left-edge glitch / dither pixel barcode strip matching reference */}
      <div className="absolute left-3 sm:left-4 top-4 bottom-4 w-7 sm:w-8 flex flex-col justify-between py-2 opacity-75 font-mono text-[8px] text-zinc-400 select-none pointer-events-none animate-barcode-flicker">
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-white/70" />
          <div className="h-0.5 w-2/3 bg-white/40" />
          <div className="h-1 w-5/6 bg-white/60" />
          <div className="h-0.5 w-1/2 bg-white/30" />
          <div className="h-2 w-3/4 bg-white/80" />
        </div>

        <div className="space-y-0.5 text-[7px] leading-tight text-white/50">
          <div>[DSMS]</div>
          <div>0x7F2A</div>
          <div>VAULT</div>
          <div>v2.04</div>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-0.5 w-full">
            <div className="h-1 bg-white/90" />
            <div className="h-1 bg-white/30" />
            <div className="h-1 bg-white/70" />
            <div className="h-1 bg-white/40" />
            <div className="h-1 bg-white/80" />
            <div className="h-1 bg-white/20" />
          </div>
          <div className="h-1 w-full bg-white/60" />
          <div className="h-2 w-4/5 bg-white/85" />
          <div className="h-0.5 w-1/2 bg-white/40" />
          <div className="h-1.5 w-full bg-white/90" />
        </div>
      </div>

      {/* Main 3D Concentric Tunnel & Glowing Sphere SVG */}
      <div className="relative w-full h-full max-w-[340px] max-h-[340px] ml-4 sm:ml-6 flex items-center justify-center animate-tunnel-breathe">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full overflow-visible transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Luminous stroke gradient fading into depth */}
            <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#d4d4d8" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#71717a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#27272a" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="ringGlowDim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#a1a1aa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.05" />
            </linearGradient>

            {/* Glowing sphere gradient */}
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f4f4f5" />
              <stop offset="100%" stopColor="#a1a1aa" />
            </radialGradient>

            {/* Soft shadow below sphere */}
            <radialGradient id="sphereShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Focal / Vanishing point coordinates */}
          {/* Outer thick enveloping crescent curve */}
          <path
            d="M 60 270 C 50 140, 150 40, 275 40 C 350 40, 385 100, 365 180 C 350 240, 320 280, 290 310"
            fill="none"
            stroke="url(#ringGlow)"
            strokeWidth="32"
            strokeLinecap="round"
          />

          {/* Concentric nested tunnel arcs stepping inward towards (285, 280) */}
          {/* Ring 1 */}
          <path
            d="M 95 270 C 85 165, 170 85, 270 85 C 330 85, 355 130, 340 195 C 328 240, 305 275, 285 295"
            fill="none"
            stroke="url(#ringGlow)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Ring 2 */}
          <path
            d="M 125 270 C 118 190, 185 125, 265 125 C 315 125, 332 160, 320 210 C 310 245, 295 270, 280 285"
            fill="none"
            stroke="url(#ringGlow)"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* Ring 3 */}
          <path
            d="M 152 270 C 146 210, 200 160, 260 160 C 300 160, 312 188, 302 225 C 295 250, 285 268, 275 280"
            fill="none"
            stroke="url(#ringGlow)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Ring 4 */}
          <path
            d="M 178 270 C 174 225, 215 190, 258 190 C 288 190, 296 210, 288 238 C 282 255, 276 268, 270 275"
            fill="none"
            stroke="url(#ringGlow)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Ring 5 */}
          <path
            d="M 200 270 C 198 238, 228 215, 258 215 C 278 215, 285 228, 280 248 C 276 258, 270 268, 265 272"
            fill="none"
            stroke="url(#ringGlowDim)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Ring 6 */}
          <path
            d="M 220 270 C 218 248, 240 234, 260 234 C 272 234, 276 244, 272 256 C 268 262, 264 268, 260 270"
            fill="none"
            stroke="url(#ringGlowDim)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Ring 7 (deepest tunnel lip) */}
          <path
            d="M 238 270 C 236 256, 250 248, 262 248 C 268 248, 270 254, 267 262"
            fill="none"
            stroke="url(#ringGlowDim)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Cast shadow behind the focal sphere */}
          <ellipse
            cx="285"
            cy="295"
            rx="45"
            ry="25"
            fill="url(#sphereShadow)"
          />

          {/* The iconic glowing white solid sphere orb at bottom-right */}
          <circle
            cx="290"
            cy="280"
            r="38"
            fill="url(#sphereGrad)"
            filter="drop-shadow(0 0 16px rgba(255,255,255,0.45))"
          />

          {/* High-specular specular reflection glint on the sphere */}
          <ellipse
            cx="278"
            cy="268"
            rx="12"
            ry="7"
            transform="rotate(-25 278 268)"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Floating subtle metadata label on bottom-right */}
      <div className="absolute right-4 bottom-3 text-[10px] font-mono text-zinc-500 tracking-wider uppercase select-none pointer-events-none">
        Fig. 01 — Escrow Conduit
      </div>
    </div>
  );
}
