import { Timer, Navigation } from 'lucide-react';
import Speedometer from './Speedometer';

interface MetricsGridProps {
  maxSpeed: number;
  avgSpeed: number;
  tripDuration: number;
  distance: number;
  units: 'kmh' | 'mph';
  theme: 'dark' | 'light';
  speed: number | null;
  warningSpeed: number;
  compassDir: string;
  language?: 'fr' | 'en';
}

export default function MetricsGrid({
  tripDuration,
  distance,
  units,
  theme,
  speed,
  warningSpeed,
  compassDir,
  language = 'fr',
}: MetricsGridProps) {
  const isFr = language === 'fr';
  const formatDistance = (km: number) => {
    if (units === 'mph') return `${(km * 0.621371).toFixed(2)} mi`;
    return `${km.toFixed(2)} km`;
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const cardBg = theme === 'light'
    ? 'bg-white/80 border-zinc-200/80 shadow-sm shadow-zinc-200/20 hover:bg-zinc-50/90'
    : 'bg-zinc-900/40 border-white/5 shadow-2xl shadow-black/40 hover:bg-white/[0.07]';

  const iconBg = theme === 'light' ? 'bg-zinc-100' : 'bg-white/5';

  return (
    <div className="grid grid-cols-[65%_35%] gap-3 sm:gap-5 w-full items-stretch p-1 max-w-full overflow-hidden">
      {/* Left Column: Speedometer Component with fluid bounding box */}
      <div className="flex justify-center items-center h-full w-full min-w-0">
        <div className="w-full max-w-[180px] xs:max-w-[210px] sm:max-w-[280px] md:max-w-[320px] aspect-square flex justify-center items-center">
          <Speedometer
            speed={speed}
            units={units}
            warningSpeed={warningSpeed}
            compassDir={compassDir}
            theme={theme}
            isCompact={true}
          />
        </div>
      </div>

      {/* Right Column: Distance and Trip Time stacked vertically always */}
      <div className="flex justify-center items-center h-full w-full min-w-0">
        <div 
          className="flex flex-col gap-2.5 sm:gap-4 w-full h-full max-h-full min-h-0 justify-center items-stretch p-[5px] overflow-hidden"
          style={{ marginLeft: '-32px' }}
        >
          {/* Distance Card */}
          <div className={`w-full flex-1 min-h-0 rounded-2xl xs:rounded-[1.5rem] sm:rounded-[2rem] border backdrop-blur-xl flex flex-col justify-center p-2 xs:p-3 sm:p-4 md:p-5 gap-1 sm:gap-1.5 transition-all ${cardBg} min-w-0 overflow-hidden`}>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className={`p-1 sm:p-1.5 md:p-2 rounded-lg xs:rounded-xl ${iconBg} text-purple-500 shrink-0`}>
                <Navigation className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className={`text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-mono tracking-wider uppercase truncate ${
                theme === 'light' ? 'text-zinc-400 font-semibold' : 'text-white/30'
              }`}>{isFr ? 'Distance' : 'Distance'}</span>
            </div>
            <span className={`text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tight mt-1 ml-0.5 truncate ${
              theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{formatDistance(distance)}</span>
          </div>

          {/* Trip Time Card */}
          <div className={`w-full flex-1 min-h-0 rounded-2xl xs:rounded-[1.5rem] sm:rounded-[2rem] border backdrop-blur-xl flex flex-col justify-center p-2 xs:p-3 sm:p-4 md:p-5 gap-1 sm:gap-1.5 transition-all ${cardBg} min-w-0 overflow-hidden`}>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className={`p-1 sm:p-1.5 md:p-2 rounded-lg xs:rounded-xl ${iconBg} text-sky-500 shrink-0`}>
                <Timer className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className={`text-[8px] xs:text-[10px] sm:text-xs md:text-sm font-mono tracking-wider uppercase truncate ${
                theme === 'light' ? 'text-zinc-400 font-semibold' : 'text-white/30'
              }`}>{isFr ? 'Temps trajet' : 'Trip Time'}</span>
            </div>
            <span className={`text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tight mt-1 ml-0.5 truncate ${
              theme === 'light' ? 'text-zinc-800' : 'text-white/90'
            }`}>{formatTime(tripDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
