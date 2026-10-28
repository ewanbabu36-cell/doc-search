import React from 'react';

export const IOS18AuroraRibbons: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070817]">
      {/* 1. Base Midnight Ambient Radial Glows */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 45% 45%, #2e1065 0%, #170736 40%, #070817 80%)',
          opacity: 0.85,
        }}
      />

      {/* 2. Sweeping Luminous Cyan and Violet Ribbon Curves (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cyan to Azure Ribbon Gradient 1 */}
          <linearGradient id="cyanRibbonGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
          </linearGradient>

          {/* Cyan to Azure Ribbon Gradient 2 */}
          <linearGradient id="cyanRibbonGrad2" x1="20%" y1="100%" x2="90%" y2="20%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.1" />
          </linearGradient>

          {/* Violet / Magenta Ribbon Gradient 3 */}
          <linearGradient id="magentaRibbonGrad" x1="10%" y1="100%" x2="80%" y2="30%">
            <stop offset="0%" stopColor="#581c87" stopOpacity="0.1" />
            <stop offset="45%" stopColor="#c026d3" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#9333ea" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
          </linearGradient>

          {/* Soft Blur Filter for Aurora Feathering */}
          <filter id="ribbonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="32" />
          </filter>

          <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* Violet Ambient Wave */}
        <path
          d="M 320 900 C 420 600, 500 400, 680 150 C 780 20, 850 0, 950 0 C 820 180, 680 480, 520 900 Z"
          fill="url(#magentaRibbonGrad)"
          filter="url(#ribbonBlur)"
        />

        {/* Sweeping Cyan Primary Ribbon from Center Bottom to Right Edge */}
        <path
          d="M 380 900 C 520 700, 720 540, 1020 380 C 1220 280, 1380 220, 1440 200 L 1440 320 C 1320 360, 1140 450, 940 580 C 720 720, 540 850, 480 900 Z"
          fill="url(#cyanRibbonGrad1)"
          filter="url(#ribbonGlow)"
        />

        {/* Sweeping Cyan Secondary Foreground Ribbon */}
        <path
          d="M 460 900 C 620 740, 860 620, 1180 480 C 1340 410, 1420 380, 1440 370 L 1440 450 C 1380 480, 1260 540, 1060 660 C 840 800, 640 880, 560 900 Z"
          fill="url(#cyanRibbonGrad2)"
          filter="url(#ribbonBlur)"
        />

        {/* Diagonal Soft Light Sheen */}
        <ellipse
          cx="720"
          cy="450"
          rx="500"
          ry="300"
          fill="#38bdf8"
          opacity="0.08"
          transform="rotate(-25 720 450)"
          filter="url(#ribbonBlur)"
        />
      </svg>
    </div>
  );
};
