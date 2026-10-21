/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ApplepAILogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showPoweredBy?: boolean;
  poweredByText?: string;
  poweredByPlacement?: 'top' | 'bottom' | 'inline';
  showWordmark?: boolean;
  name?: string;
  poweredByBrand?: string;
}

export const ApplepAILogo: React.FC<ApplepAILogoProps> = ({
  className = '',
  size = 'md',
  variant = 'auto',
  showPoweredBy = false,
  poweredByText = 'powered by',
  poweredByPlacement = 'bottom',
  showWordmark = true,
  name = 'ApplepAI',
  poweredByBrand = 'ApplechAI'
}) => {
  // Determine sizing
  const iconSizes = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const isDarkBg = variant === 'dark';
  const textColorPrimary = isDarkBg 
    ? 'text-white' 
    : variant === 'light' 
      ? 'text-slate-900' 
      : 'text-slate-900 dark:text-white';

  // Split name for dual-color branding (e.g., "Applep" + "AI")
  const mainPart = name.endsWith('AI') ? name.slice(0, -2) : name;
  const aiPart = name.endsWith('AI') ? 'AI' : '';

  const logoGraphic = (
    <div className="flex items-center gap-2.5">
      {/* Constellation / Neural Network Apple Vector Icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizes[size]} shrink-0 transition-transform hover:scale-105 duration-300`}
      >
        <defs>
          {/* Radial Glow for glowing central nodes */}
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="60%" stopColor="#2563eb" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="centerHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="1" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Outer & Inner Network Edges (Constellation Lines) */}
        {/* Stem */}
        <line x1="50" y1="22" x2="44" y2="9" stroke="url(#edgeGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="9" x2="43" y2="7" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

        {/* Apple outline & triangulation wireframe */}
        {/* Top cleft & shoulders */}
        <line x1="50" y1="22" x2="35" y2="19" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="50" y1="22" x2="65" y2="19" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="35" y1="19" x2="20" y2="28" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="65" y1="19" x2="80" y2="28" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="20" y1="28" x2="13" y2="44" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="80" y1="28" x2="87" y2="44" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="13" y1="44" x2="15" y2="64" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="87" y1="44" x2="85" y2="64" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="15" y1="64" x2="26" y2="83" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="85" y1="64" x2="74" y2="83" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="26" y1="83" x2="39" y2="91" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="74" y1="83" x2="61" y2="91" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="39" y1="91" x2="50" y2="87" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="61" y1="91" x2="50" y2="87" stroke="url(#edgeGrad)" strokeWidth="2" />

        {/* Interior Delaunay Triangulation Connections */}
        <line x1="50" y1="22" x2="38" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="50" y1="22" x2="62" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="35" y1="19" x2="38" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="65" y1="19" x2="62" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="20" y1="28" x2="38" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="80" y1="28" x2="62" y2="38" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="20" y1="28" x2="27" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="80" y1="28" x2="73" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="13" y1="44" x2="27" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="87" y1="44" x2="73" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        
        {/* Core Neural Center Cross-connections */}
        <line x1="38" y1="38" x2="62" y2="38" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="38" y1="38" x2="50" y2="54" stroke="url(#edgeGrad)" strokeWidth="2.2" />
        <line x1="62" y1="38" x2="50" y2="54" stroke="url(#edgeGrad)" strokeWidth="2.2" />
        <line x1="38" y1="38" x2="27" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="62" y1="38" x2="73" y2="52" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="27" y1="52" x2="50" y2="54" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="73" y1="52" x2="50" y2="54" stroke="url(#edgeGrad)" strokeWidth="2" />

        {/* Lower mesh */}
        <line x1="27" y1="52" x2="15" y2="64" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="73" y1="52" x2="85" y2="64" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="27" y1="52" x2="36" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="73" y1="52" x2="64" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="50" y1="54" x2="36" y2="70" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="50" y1="54" x2="64" y2="70" stroke="url(#edgeGrad)" strokeWidth="2" />
        <line x1="36" y1="70" x2="64" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        
        <line x1="15" y1="64" x2="36" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="85" y1="64" x2="64" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="26" y1="83" x2="36" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="74" y1="83" x2="64" y2="70" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="36" y1="70" x2="50" y2="87" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="64" y1="70" x2="50" y2="87" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="36" y1="70" x2="39" y2="91" stroke="url(#edgeGrad)" strokeWidth="1.8" />
        <line x1="64" y1="70" x2="61" y2="91" stroke="url(#edgeGrad)" strokeWidth="1.8" />

        {/* Central Luminous Nodes */}
        <circle cx="50" cy="54" r="8" fill="url(#centerHighlight)" />
        <circle cx="38" cy="38" r="6" fill="url(#nodeGlow)" />
        <circle cx="62" cy="38" r="6" fill="url(#nodeGlow)" />

        {/* Vertex Nodes (Dots) */}
        {/* Stem top node */}
        <circle cx="43" cy="7" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />

        {/* Boundary Nodes */}
        <circle cx="50" cy="22" r="3" fill="#1d4ed8" />
        <circle cx="35" cy="19" r="3" fill="#2563eb" />
        <circle cx="65" cy="19" r="3" fill="#2563eb" />
        <circle cx="20" cy="28" r="3.2" fill="#2563eb" />
        <circle cx="80" cy="28" r="3.2" fill="#2563eb" />
        <circle cx="13" cy="44" r="3.2" fill="#1d4ed8" />
        <circle cx="87" cy="44" r="3.2" fill="#1d4ed8" />
        <circle cx="15" cy="64" r="3.2" fill="#2563eb" />
        <circle cx="85" cy="64" r="3.2" fill="#2563eb" />
        <circle cx="26" cy="83" r="3.2" fill="#1e40af" />
        <circle cx="74" cy="83" r="3.2" fill="#1e40af" />
        <circle cx="39" cy="91" r="3.5" fill="#1e3a8a" />
        <circle cx="61" cy="91" r="3.5" fill="#1e3a8a" />
        <circle cx="50" cy="87" r="3" fill="#1d4ed8" />

        {/* Internal Key Nodes */}
        <circle cx="27" cy="52" r="3.2" fill="#3b82f6" />
        <circle cx="73" cy="52" r="3.2" fill="#3b82f6" />
        <circle cx="36" cy="70" r="3.2" fill="#2563eb" />
        <circle cx="64" cy="70" r="3.2" fill="#2563eb" />
        <circle cx="38" cy="38" r="3.5" fill="#60a5fa" />
        <circle cx="62" cy="38" r="3.5" fill="#60a5fa" />
        <circle cx="50" cy="54" r="4.5" fill="#93c5fd" stroke="#2563eb" strokeWidth="1.5" />
      </svg>

      {/* Wordmark Typography */}
      {showWordmark && (
        <div className="flex items-baseline tracking-tight font-extrabold select-none">
          <span className={`${textSizes[size]} ${textColorPrimary} font-bold tracking-tight`}>
            {mainPart}
          </span>
          {aiPart && (
            <span className={`${textSizes[size]} text-blue-600 dark:text-blue-400 font-black ml-0.5`}>
              {aiPart}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!showPoweredBy) {
    return <div className={`inline-flex items-center ${className}`}>{logoGraphic}</div>;
  }

  if (poweredByPlacement === 'top') {
    return (
      <div className={`flex flex-col items-start gap-0.5 ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {poweredByText}
        </span>
        {logoGraphic}
      </div>
    );
  }

  if (poweredByPlacement === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-[11px] font-semibold text-slate-400">
          {poweredByText}
        </span>
        {logoGraphic}
      </div>
    );
  }

  // Default: Bottom placement (e.g. under the logo/app name)
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      {logoGraphic}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-0.5 select-none">
        <span className="font-normal text-slate-400">{poweredByText}</span>
        <span className="font-bold text-blue-500 dark:text-blue-400 tracking-tight">{poweredByBrand}</span>
      </div>
    </div>
  );
};
