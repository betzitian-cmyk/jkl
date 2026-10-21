import { motion } from 'motion/react';
import { 
  Compass
} from 'lucide-react';

interface SpeedometerProps {
  speed: number | null; // km/h
  units: 'kmh' | 'mph';
  warningSpeed: number; // in unit preference
  compassDir: string;
  theme: 'dark' | 'light';
  isCompact?: boolean;
}

export default function Speedometer({
  speed,
  units,
  warningSpeed,
  compassDir,
  theme,
  isCompact = false,
}: SpeedometerProps) {
  // Convert speed values to display unit if necessary
  const toDisplayValue = (kmh: number | null) => {
    if (kmh === null) return 0;
    if (units === 'mph') {
      return kmh * 0.621371;
    }
    return kmh;
  };

  const displaySpeed = Math.round(toDisplayValue(speed));

  const unitLabel = units === 'kmh' ? 'km/h' : 'mph';
  
  // Calculate warning limits in km/h for the safety thresholds
  const warningSpeedKmh = units === 'mph' ? warningSpeed / 0.621371 : warningSpeed;
  const currentSpeedKmh = speed || 0;

  // Set colors based on percentage of warning speed limit
  const ratio = currentSpeedKmh / warningSpeedKmh;
  let speedColorClass = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]';
  let speedArcColor = '#10b981'; // Emerald-500
  let speedStatusLabel = 'SAFE';

  if (ratio > 1.0) {
    speedColorClass = 'text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]';
    speedArcColor = '#ef4444'; // Red-500
    speedStatusLabel = 'OVERSPEED';
  } else if (ratio > 0.9) {
    speedColorClass = 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]';
    speedArcColor = '#f97316'; // Orange-500
    speedStatusLabel = 'WARNING';
  } else if (ratio > 0.7) {
    speedColorClass = 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]';
    speedArcColor = '#eab308'; // Yellow-500
    speedStatusLabel = 'MODERATE';
  }

  // Speedometer graphic config
  const minAngle = -120;
  const maxAngle = 120;
  const maxDialSpeed = units === 'kmh' ? 180 : 120; // Maximum speed shown on the gauge dial
  const speedPercentage = Math.min((displaySpeed / maxDialSpeed) * 100, 100);
  const needleAngle = minAngle + (speedPercentage / 100) * (maxAngle - minAngle);

  // Circle path for the speedometer gauge ring
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (240 / 360) * circumference;
  const strokeDashoffset = arcLength - (speedPercentage / 100) * arcLength;

  // Custom tick marks
  const ticks = Array.from({ length: 13 }).map((_, i) => {
    const tickSpeed = (i / 12) * maxDialSpeed;
    const angle = minAngle + (i / 12) * (maxAngle - minAngle);
    const angleRad = (angle - 90) * (Math.PI / 180);
    const x1 = 150 + (radius - 12) * Math.cos(angleRad);
    const y1 = 150 + (radius - 12) * Math.sin(angleRad);
    const x2 = 150 + radius * Math.cos(angleRad);
    const y2 = 150 + radius * Math.sin(angleRad);

    const isMajor = i % 2 === 0;
    const labelX = 150 + (radius - 26) * Math.cos(angleRad);
    const labelY = 150 + (radius - 26) * Math.sin(angleRad);

    return { x1, y1, x2, y2, isMajor, tickSpeed, labelX, labelY, angle };
  });

  return (
    <div 
      id="speedometer-widget" 
      className={`relative flex flex-col items-center justify-center select-none transition-all duration-500 ${
        isCompact 
          ? 'w-full h-full' 
          : 'p-6 rounded-[2.25rem] shadow-2xl border'
      } ${
        !isCompact ? (
          theme === 'light'
            ? 'bg-white/80 border-zinc-200/85 text-zinc-900 shadow-zinc-200/30'
            : 'bg-zinc-950/40 border-white/10 text-white shadow-black/40'
        ) : (
          theme === 'light' ? 'text-zinc-900' : 'text-white'
        )
      }`}
    >
      {/* Background glow matching the current speed warning state */}
      <div 
        className="absolute inset-0 -z-10 opacity-[0.08] blur-[80px] transition-colors duration-700 rounded-full"
        style={{
          background: `radial-gradient(circle, ${speedArcColor} 0%, transparent 75%)`
        }}
      />

      {/* Cyberpunk background aesthetic lines */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.02] dark:opacity-[0.04]">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      {/* Gauge Canvas */}
      <div className={`relative flex items-center justify-center transition-all ${
        isCompact ? 'w-full h-full' : 'w-[310px] h-[310px] mt-4'
      }`}>
        <svg viewBox="0 0 300 300" className="w-full h-full max-w-full max-h-full">
          <defs>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="activeArcGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor={speedArcColor} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Ring Track */}
          <path
            d="M 64.8 235.2 A 120 120 0 1 1 235.2 235.2"
            fill="none"
            stroke={theme === 'light' ? 'rgba(9,9,11,0.06)' : 'rgba(255,255,255,0.04)'}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Inner accent ring */}
          <path
            d="M 72.8 227.2 A 110 110 0 1 1 227.2 227.2"
            fill="none"
            stroke={theme === 'light' ? 'rgba(9,9,11,0.03)' : 'rgba(255,255,255,0.015)'}
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Glowing Active Arc */}
          <path
            d="M 64.8 235.2 A 120 120 0 1 1 235.2 235.2"
            fill="none"
            stroke="url(#activeArcGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: strokeDashoffset + (circumference - arcLength),
              transition: 'stroke 0.5s ease, stroke-dashoffset 0.25s cubic-bezier(0.1, 0.8, 0.2, 1)'
            }}
            filter="url(#glow)"
            className="opacity-40"
          />

          {/* Primary Active Arc */}
          <path
            d="M 64.8 235.2 A 120 120 0 1 1 235.2 235.2"
            fill="none"
            stroke="url(#activeArcGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: strokeDashoffset + (circumference - arcLength),
              transition: 'stroke 0.5s ease, stroke-dashoffset 0.25s cubic-bezier(0.1, 0.8, 0.2, 1)'
            }}
          />

          {/* Dial Ticks with active color illumination */}
          {ticks.map((tick, index) => {
            const isActive = displaySpeed >= tick.tickSpeed;
            return (
              <g key={index}>
                <line
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={
                    isActive
                      ? speedArcColor
                      : theme === 'light'
                        ? (tick.isMajor ? 'rgba(9,9,11,0.3)' : 'rgba(9,9,11,0.1)')
                        : (tick.isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)')
                  }
                  strokeWidth={tick.isMajor ? '2.5' : '1.5'}
                  className="transition-colors duration-300"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 2px ${speedArcColor})` : 'none'
                  }}
                />
                {tick.isMajor && (
                  <text
                    x={tick.labelX}
                    y={tick.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-sans text-[9px] font-bold tracking-tight transition-colors duration-300 ${
                      isActive 
                        ? 'fill-white font-extrabold' 
                        : theme === 'light' 
                          ? 'fill-zinc-500' 
                          : 'fill-white/40'
                    }`}
                  >
                    {Math.round(tick.tickSpeed)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Sleek Needle */}
          <motion.g
            animate={{ rotate: needleAngle }}
            transition={{ type: 'spring', stiffness: 65, damping: 16 }}
            style={{ originX: '150px', originY: '150px' }}
          >
            {/* Center Cap backing */}
            <circle 
              cx="150" 
              cy="150" 
              r="16" 
              fill={theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,12,0.85)'} 
              stroke={theme === 'light' ? 'rgba(9,9,11,0.1)' : 'rgba(255,255,255,0.12)'} 
              strokeWidth="2" 
            />
            
            {/* Center pointer accent node */}
            <circle cx="150" cy="150" r="5" fill="#ffffff" />
            <circle cx="150" cy="150" r="2.5" fill="#ef4444" />
          </motion.g>
        </svg>

        {/* HUD Overlay layer within the center of the dial */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none ${
          isCompact ? 'pt-4' : 'pt-8'
        }`}>
          <motion.h1 
            key={displaySpeed}
            initial={{ scale: 0.92, opacity: 0.85 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`font-sans font-black tracking-tighter ${speedColorClass} tabular-nums transition-all duration-300 ${
              isCompact ? 'text-6xl' : 'text-7xl'
            }`}
          >
            {displaySpeed}
          </motion.h1>
          <span className={`font-mono tracking-widest font-bold uppercase mt-0.5 ${
            isCompact ? 'text-[9px]' : 'text-[11px]'
          } ${
            theme === 'light' ? 'text-zinc-500' : 'text-white/55'
          }`}>{unitLabel}</span>
          
          {/* Compass bearing indicator widget */}
          <div className={`flex items-center gap-1.5 transition-colors duration-300 ${
            isCompact ? 'mt-2 px-2 py-0.5 text-[9px]' : 'mt-5 px-3 py-1 text-[10px]'
          } rounded-full border font-mono font-bold tracking-wider ${
            theme === 'light'
              ? 'bg-zinc-100/90 border-zinc-200 text-zinc-700 shadow-sm'
              : 'bg-zinc-900/60 border-white/5 text-sky-400'
          }`}>
            <Compass className="h-3.5 w-3.5 text-sky-400 animate-spin" style={{ animationDuration: '12s' }} />
            <span>{compassDir || 'N'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
