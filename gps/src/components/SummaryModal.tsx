import { motion } from 'motion/react';
import { Award, Timer, Navigation, Zap, Flame, ShieldAlert, Check, Receipt, Car, CheckCircle2, ArrowRight, Route } from 'lucide-react';
import { Trip } from '../types';
import TripRouteMap from './TripRouteMap';

interface SummaryModalProps {
  trip: Trip;
  units: 'kmh' | 'mph';
  onClose: () => void;
  theme: 'dark' | 'light';
  user?: any;
  onTransferToExpense?: (trip: Trip) => Promise<void> | void;
  isSubmittingExpense?: boolean;
  isTransferred?: boolean;
  language?: 'fr' | 'en';
}

export default function SummaryModal({ 
  trip, 
  units, 
  onClose, 
  theme,
  user,
  onTransferToExpense,
  isSubmittingExpense = false,
  isTransferred = false,
  language = 'fr',
}: SummaryModalProps) {
  const isFr = language === 'fr';

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const toDisplayValue = (km: number) => {
    if (units === 'mph') {
      return km * 0.621371;
    }
    return km;
  };

  const displayDistance = toDisplayValue(trip.distance).toFixed(2);
  const displayAvgSpeed = Math.round(toDisplayValue(trip.avgSpeed));
  const displayMaxSpeed = Math.round(toDisplayValue(trip.maxSpeed));
  const unitLabel = units === 'kmh' ? 'km/h' : 'mph';
  const distLabel = units === 'kmh' ? 'km' : 'mi';

  // Score color determinations
  let scoreColor = theme === 'light' 
    ? 'text-emerald-600 border-emerald-500/15 bg-emerald-500/5'
    : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
  let scoreText = isFr ? 'Conducteur exemplaire & sécuritaire' : 'Excellent Safe Driver';
  let scoreProgressColor = '#10b981';

  if (trip.score < 70) {
    scoreColor = theme === 'light'
      ? 'text-red-600 border-red-500/15 bg-red-500/5'
      : 'text-red-500 border-red-500/20 bg-red-500/5';
    scoreText = isFr ? 'Conduite agressive détectée' : 'Aggressive Driving Detected';
    scoreProgressColor = '#ef4444';
  } else if (trip.score < 90) {
    scoreColor = theme === 'light'
      ? 'text-yellow-600 border-yellow-500/15 bg-yellow-500/5'
      : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    scoreText = isFr ? 'Conduite souple & prudente' : 'Good Smooth Driving';
    scoreProgressColor = '#facc15';
  }

  return (
   <div className="fixed inset-0 z-[11000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 20 }}
    className={`relative w-full max-w-lg max-h-[90dvh] overflow-y-auto border rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-6 ${
      theme === "light"
        ? "bg-white border-zinc-200/80 shadow-zinc-200/50"
        : "bg-zinc-950 border-white/10 shadow-black/80"
    }`}
  >
    {/* Decorative ambient background */}
    <div className="absolute inset-x-0 -top-40 -z-10 h-80 bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

    {/* Header Summary Accent */}
    <div className="flex flex-col items-center text-center">
      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/30 mb-2 sm:mb-3 text-sky-500">
        <Award className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <h2
        className={`font-sans text-xl sm:text-2xl font-bold tracking-tight ${
          theme === "light" ? "text-zinc-900" : "text-white"
        }`}
      >
        {isFr ? 'RAPPORT DE SYNTHÈSE DU TRAJET' : 'TRIP SUMMARY REPORT'}
      </h2>
      <p
        className={`text-xs mt-0.5 ${
          theme === "light" ? "text-zinc-500" : "text-white/50"
        }`}
      >
        {isFr ? 'Télématique intelligente et diagnostic de conduite' : 'Gantavya AI smart driver diagnostics and metrics'}
      </p>
    </div>

    {/* Driving Score Circle / Meter */}
    <div
      className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border ${scoreColor}`}
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={
              theme === "light"
                ? "rgba(9,9,11,0.05)"
                : "rgba(255,255,255,0.05)"
            }
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={scoreProgressColor}
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - trip.score / 100)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight ${
              theme === "light" ? "text-zinc-800" : "text-white"
            }`}
          >
            {trip.score}
          </span>
          <span
            className={`text-[9px] font-mono tracking-widest uppercase ${
              theme === "light"
                ? "text-zinc-400 font-semibold"
                : "text-white/50"
            }`}
          >
            SCORE
          </span>
        </div>
      </div>
      <span
        className={`font-sans text-xs font-semibold mt-2 sm:mt-3 uppercase tracking-wide ${
          theme === "light" ? "text-zinc-700" : "text-white"
        }`}
      >
        {scoreText}
      </span>
    </div>

    {/* Grid Stats cards */}
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
      {/* Duration Card */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border flex items-center gap-2.5 sm:gap-3 ${
          theme === "light"
            ? "bg-zinc-50 border-zinc-200/60 text-zinc-800"
            : "bg-white/5 border-white/5 text-white/90"
        }`}
      >
        <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
          <Timer className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase truncate ${
              theme === "light"
                ? "text-zinc-400 font-semibold"
                : "text-white/40"
            }`}
          >
            {isFr ? 'DURÉE' : 'DURATION'}
          </span>
          <span className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
            {formatTime(trip.duration)}
          </span>
        </div>
      </div>

      {/* Distance Card */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border flex items-center gap-2.5 sm:gap-3 ${
          theme === "light"
            ? "bg-zinc-50 border-zinc-200/60 text-zinc-800"
            : "bg-white/5 border-white/5 text-white/90"
        }`}
      >
        <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
          <Navigation className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase truncate ${
              theme === "light"
                ? "text-zinc-400 font-semibold"
                : "text-white/40"
            }`}
          >
            {isFr ? 'DISTANCE' : 'DISTANCE'}
          </span>
          <span className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
            {displayDistance} {distLabel}
          </span>
        </div>
      </div>

      {/* Average Speed Card */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border flex items-center gap-2.5 sm:gap-3 ${
          theme === "light"
            ? "bg-zinc-50 border-zinc-200/60 text-zinc-800"
            : "bg-white/5 border-white/5 text-white/90"
        }`}
      >
        <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
          <Zap className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase truncate ${
              theme === "light"
                ? "text-zinc-400 font-semibold"
                : "text-white/40"
            }`}
          >
            {isFr ? 'VITESSE MOY' : 'AVG SPEED'}
          </span>
          <span className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
            {displayAvgSpeed} {unitLabel}
          </span>
        </div>
      </div>

      {/* Max Speed Card */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border flex items-center gap-2.5 sm:gap-3 ${
          theme === "light"
            ? "bg-zinc-50 border-zinc-200/60 text-zinc-800"
            : "bg-white/5 border-white/5 text-white/90"
        }`}
      >
        <div className="p-1.5 sm:p-2 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase truncate ${
              theme === "light"
                ? "text-zinc-400 font-semibold"
                : "text-white/40"
            }`}
          >
            {isFr ? 'VITESSE MAX' : 'MAX SPEED'}
          </span>
          <span className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
            {displayMaxSpeed} {unitLabel}
          </span>
        </div>
      </div>
    </div>

    {/* Calories Burned Inline Card */}
    <div
      className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border ${
        theme === "light"
          ? "bg-amber-500/5 border-amber-500/15 text-amber-600"
          : "bg-amber-500/5 border-amber-500/10 text-amber-400"
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 shrink-0">
          <Flame className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left">
          <span
            className={`text-[9px] sm:text-[10px] font-mono uppercase ${
              theme === "light"
                ? "text-amber-500/80 font-bold"
                : "text-amber-400/50"
            }`}
          >
            {isFr ? 'ÉNERGIE DÉPENSÉE' : 'ENERGY EXPENDED'}
          </span>
          <span
            className={`text-[11px] sm:text-xs ${
              theme === "light" ? "text-zinc-600 font-medium" : "text-white/85"
            }`}
          >
            {isFr ? 'Calories de concentration cognitive de conduite' : 'Driving cognitive focus calories'}
          </span>
        </div>
      </div>
      <span
        className={`font-sans text-base sm:text-lg font-bold tracking-tight shrink-0 ml-2 ${
          theme === "light" ? "text-zinc-800" : "text-white"
        }`}
      >
        {trip.calories}{" "}
        <span
          className={`text-xs font-normal ${
            theme === "light" ? "text-zinc-400 font-medium" : "text-white/50"
          }`}
        >
          kcal
        </span>
      </span>
    </div>

    {/* Route Map GPS Trajectory Card */}
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          theme === 'light' ? 'text-zinc-500' : 'text-white/50'
        }`}>
          <Route className="h-3.5 w-3.5 text-sky-500" />
          <span>{isFr ? "Tracé cartographique de l'itinéraire" : 'Route Map Trajectory'}</span>
        </span>
        <span className={`text-[10px] font-mono ${
          theme === 'light' ? 'text-zinc-400' : 'text-white/40'
        }`}>
          {trip.route?.length 
            ? (isFr ? `${trip.route.length} coordonnées` : `${trip.route.length} coordinates`) 
            : 'GPS'}
        </span>
      </div>
      <TripRouteMap
        trip={trip}
        theme={theme}
        height="180px"
        language={language}
      />
    </div>

    {/* Business Expense Reimbursement Card */}
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col gap-3 ${
        theme === "light"
          ? "bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-blue-200/80 text-blue-950"
          : "bg-gradient-to-br from-blue-950/40 to-slate-900/60 border-blue-500/30 text-blue-100"
      }`}
    >
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <Car className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold tracking-tight block leading-snug">
              {isFr ? "Indemnité kilométrique d'affaires (CRA / RQ)" : 'Business Mileage Reimbursement (CRA / RQ)'}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-300 font-semibold block">
              {isFr ? `Taux : 0,70 $ / km • ${trip.distance.toFixed(1)} km` : `Rate: $0.70 / km • ${trip.distance.toFixed(1)} km`}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm sm:text-base font-extrabold text-blue-900 dark:text-blue-200 font-mono block">
            {(trip.distance * 0.7).toFixed(2)} $
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
            {isFr ? 'À rembourser' : 'To Reimburse'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-white/70 dark:bg-black/20 rounded-xl border border-blue-100 dark:border-white/5 text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {isFr ? 'Demandeur :' : 'Claimant:'}
        </span>
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
          {user?.displayName ||
            user?.name ||
            user?.email?.split("@")[0] ||
            "Alexandre Tremblay"}
        </span>
      </div>

      {onTransferToExpense && (
        <button
          onClick={() => onTransferToExpense(trip)}
          disabled={isSubmittingExpense || isTransferred}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
            isTransferred
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-blue-600 hover:bg-blue-700 text-white active:scale-98 disabled:opacity-50"
          }`}
        >
          {isTransferred ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
              <span>{isFr ? 'Transmis aux Dépenses' : 'Transferred to Expenses'}</span>
            </>
          ) : isSubmittingExpense ? (
            <span>{isFr ? 'Transmission en cours...' : 'Submitting...'}</span>
          ) : (
            <>
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {isFr 
                  ? `Transférer aux Dépenses (${(trip.distance * 0.7).toFixed(2)} $)` 
                  : `Transfer to Expenses ($${(trip.distance * 0.7).toFixed(2)})`}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </>
          )}
        </button>
      )}
    </div>

    {/* Confirm / Close Button */}
    <button
      onClick={onClose}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium shadow-xs active:scale-98 transition-all cursor-pointer text-xs shrink-0 ${
        theme === "light"
          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
          : "bg-white/10 hover:bg-white/15 text-white"
      }`}
    >
      <Check className="h-4 w-4" />
      <span>{isFr ? 'Fermer le rapport de trajet' : 'Close Trip Report'}</span>
    </button>
  </motion.div>
</div>
  );
}
