import { useState } from 'react';
import { Trash2, Calendar, Map, Award, Clock, Receipt, Check, Sparkles, MapPin, ChevronDown, ChevronUp, Route } from 'lucide-react';
import { Trip } from '../types';
import { formatTripDate } from '../utils/geo';
import TripRouteMap from './TripRouteMap';

interface HistoryListProps {
  trips: Trip[];
  units: 'kmh' | 'mph';
  onDeleteTrip: (id: string) => void;
  onClearAll: () => void;
  theme: 'dark' | 'light';
  isAuthenticated: boolean;
  onTransferToExpense?: (trip: Trip) => Promise<void> | void;
  submittedTripIds?: Set<string>;
  onGenerateSampleTrip?: () => void;
  initialSelectedTripId?: string;
  language?: 'fr' | 'en';
}

export default function HistoryList({ 
  trips, 
  units, 
  onDeleteTrip, 
  onClearAll, 
  theme, 
  isAuthenticated,
  onTransferToExpense,
  submittedTripIds,
  onGenerateSampleTrip,
  initialSelectedTripId,
  language = 'fr'
}: HistoryListProps) {
  const isFr = language === 'fr';
  // Store which trip is currently expanded to view route map
  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    initialSelectedTripId || (trips.length > 0 ? trips[0].id : null)
  );
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const toDisplayDistance = (km: number) => {
    if (units === 'mph') return `${(km * 0.621371).toFixed(1)} mi`;
    return `${km.toFixed(1)} km`;
  };

  const toDisplaySpeed = (kmh: number) => {
    if (units === 'mph') return `${Math.round(kmh * 0.621371)} mph`;
    return `${Math.round(kmh)} km/h`;
  };

  return (
    <div id="history-section" className={`flex flex-col gap-4 p-6 backdrop-blur-xl border rounded-[2rem] shadow-2xl transition-all duration-300 ${
      theme === 'light'
        ? 'bg-white/80 border-zinc-200/80 shadow-zinc-200/40 text-zinc-900'
        : 'bg-zinc-900/40 border-white/10 shadow-black/40 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className={`font-sans text-xl font-bold tracking-tight ${
            theme === 'light' ? 'text-zinc-900' : 'text-white'
          }`}>{isFr ? 'HISTORIQUE DES TRAJETS' : 'TRIP HISTORY'}</h2>
          <p className={`text-xs ${
            theme === 'light' ? 'text-zinc-500' : 'text-white/50'
          }`}>
            {isFr
              ? (isAuthenticated ? 'Enregistrements synchronisés de vos déplacements professionnels' : 'Historique local des déplacements sur cet appareil')
              : (isAuthenticated ? 'Your cloud-synced journey records' : 'Local tracking history on this device')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onGenerateSampleTrip && (
            <button
              onClick={onGenerateSampleTrip}
              className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              title={isFr ? "Générer un trajet test pour vérifier l'exportation vers les dépenses" : "Generate sample trip for expense transfer testing"}
            >
              <Sparkles className="h-3 w-3" />
              <span>{isFr ? 'Trajet Test' : 'Sample Trip'}</span>
            </button>
          )}
          {trips.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer"
            >
              {isFr ? 'Effacer tout' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-2xl p-4 ${
          theme === 'light'
            ? 'border-zinc-200 text-zinc-400'
            : 'border-white/10 text-white/40'
        }`}>
          <Map className={`h-10 w-10 mb-3 ${
            theme === 'light' ? 'text-zinc-300' : 'text-white/25'
          }`} />
          <p className={`text-sm font-medium ${
            theme === 'light' ? 'text-zinc-600' : 'text-white/60'
          }`}>{isFr ? 'Aucun trajet enregistré' : 'No logged trips'}</p>
          <p className="text-xs max-w-[260px] mt-1 text-slate-500">
            {isFr 
              ? "Démarrez le suivi GPS ou générez un trajet d'affaires test pour transmettre les indemnités kilométriques aux dépenses." 
              : "Start GPS tracking or generate a test business trip to transfer mileage reimbursements to expenses."}
          </p>
          {onGenerateSampleTrip && (
            <button
              onClick={onGenerateSampleTrip}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isFr ? "Générer un trajet d'affaires (34,5 km)" : 'Generate sample business trip (34.5 km)'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-1">
          {trips.map((trip) => {
            let scoreBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            if (trip.score < 70) scoreBg = 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20';
            else if (trip.score < 90) scoreBg = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';

            const reimbursementCad = (trip.distance * 0.70).toFixed(2);
            const isAlreadySubmitted = submittedTripIds?.has(trip.id);

            return (
              <div
                key={trip.id}
                className={`group relative flex flex-col gap-3 p-4 border rounded-2xl transition-all duration-200 overflow-hidden ${
                  theme === 'light'
                    ? 'bg-zinc-50/60 border-zinc-200/60 hover:border-zinc-300/80 hover:bg-zinc-100/40'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-mono ${
                    theme === 'light' ? 'text-zinc-500' : 'text-white/60'
                  }`}>
                    <Calendar className="h-3.5 w-3.5 text-sky-500" />
                    <span>{formatTripDate(trip.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Score badge */}
                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 ${scoreBg}`}>
                      <Award className="h-3 w-3" />
                      <span>Score: {trip.score}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteTrip(trip.id)}
                      className={`p-1.5 rounded-lg bg-white/0 hover:bg-white/5 transition-colors cursor-pointer ${
                        theme === 'light'
                          ? 'text-zinc-400 hover:text-red-600 hover:bg-zinc-100'
                          : 'text-white/30 hover:text-red-400'
                      }`}
                      title={isFr ? 'Supprimer le trajet' : 'Delete trip'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 text-left">
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-mono uppercase ${
                      theme === 'light' ? 'text-zinc-400 font-medium' : 'text-white/30'
                    }`}>{isFr ? 'DISTANCE' : 'DISTANCE'}</span>
                    <span className={`text-sm font-semibold mt-0.5 ${
                      theme === 'light' ? 'text-zinc-800' : 'text-white/85'
                    }`}>
                      {toDisplayDistance(trip.distance)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-mono uppercase ${
                      theme === 'light' ? 'text-zinc-400 font-medium' : 'text-white/30'
                    }`}>{isFr ? 'DURÉE' : 'DURATION'}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-sky-500" />
                      <span className={`text-sm font-semibold mt-0.5 ${
                        theme === 'light' ? 'text-zinc-800' : 'text-white/85'
                      }`}>
                        {formatTime(trip.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-mono uppercase ${
                      theme === 'light' ? 'text-zinc-400 font-medium' : 'text-white/30'
                    }`}>{isFr ? 'VITESSE MOY' : 'AVG SPEED'}</span>
                    <span className={`text-sm font-semibold mt-0.5 ${
                      theme === 'light' ? 'text-zinc-800' : 'text-white/85'
                    }`}>
                      {toDisplaySpeed(trip.avgSpeed)}
                    </span>
                  </div>
                </div>

                {/* Route Map Toggle & Visualization Section */}
                <div className="flex flex-col gap-2 pt-1 border-t border-zinc-200/50 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedTripId(selectedTripId === trip.id ? null : trip.id)}
                      className={`text-[11px] font-bold flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                        selectedTripId === trip.id
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                          : theme === 'light'
                            ? 'bg-zinc-100 hover:bg-zinc-200/70 border-zinc-200 text-zinc-700'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <Route className="h-3.5 w-3.5 text-sky-500" />
                      <span>
                        {selectedTripId === trip.id 
                          ? (isFr ? 'Masquer la carte' : 'Hide map') 
                          : (isFr ? 'Visualiser le tracé sur la carte' : 'View route on map')}
                      </span>
                      {selectedTripId === trip.id ? (
                        <ChevronUp className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      )}
                    </button>

                    <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-zinc-400' : 'text-white/40'}`}>
                      {trip.route?.length 
                        ? (isFr ? `${trip.route.length} repères GPS` : `${trip.route.length} GPS points`) 
                        : (isFr ? 'Coordonnées simulées' : 'Simulated coords')}
                    </span>
                  </div>

                  {/* Render Interactive Route Map component when this trip is selected */}
                  {selectedTripId === trip.id && (
                    <div className="mt-1 animate-fadeIn">
                      <TripRouteMap
                        trip={trip}
                        theme={theme}
                        height="200px"
                        language={language}
                      />
                    </div>
                  )}
                </div>

                {/* Expense Submission Action Bar */}
                {onTransferToExpense && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/60 dark:border-white/5">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isFr ? 'Indemnité CRA/RQ (0,70 $/km)' : 'CRA/RQ Allowance ($0.70/km)'}
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {reimbursementCad} $ CAD
                      </span>
                    </div>

                    <button
                      onClick={() => onTransferToExpense(trip)}
                      disabled={isAlreadySubmitted}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAlreadySubmitted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-98'
                      }`}
                    >
                      {isAlreadySubmitted ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isFr ? 'Transféré aux dépenses' : 'Transferred to expenses'}</span>
                        </>
                      ) : (
                        <>
                          <Receipt className="h-3.5 w-3.5" />
                          <span>{isFr ? 'Soumettre aux dépenses' : 'Submit to expenses'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
