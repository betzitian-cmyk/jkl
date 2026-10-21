import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  Navigation,
  Compass,
  Zap,
  Timer,
  Activity,
  HeartPulse,
  Settings as SettingsIcon,
  Map as MapIcon,
  Info,
  ChevronRight,
  Sparkles,
  Download,
  AlertTriangle,
  RotateCcw,
  History,
  LogOut,
  User as UserIcon,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

import { Trip, GPSStats, Settings, TripStatus } from './types';
import {
  calculateDistance,
  calculateBearing,
  getCompassDirection,
  calculateSpeedFromCoords,
  estimateCalories,
  calculateDrivingScore,
  normalizeIsoDate,
  formatTripDate
} from './utils/geo';
import { playOverspeedWarning, playClick } from './utils/audio';

import Speedometer from './components/Speedometer';
import MapContainer from './components/MapContainer';
import EmergencyModal from './components/EmergencyModal';
import SummaryModal from './components/SummaryModal';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import Drawer from './components/Drawer';
import MetricsGrid from './components/MetricsGrid';
import Logo from './components/Logo';
import { getGpsTranslation, GpsLanguage } from './utils/i18n';

export interface GantavyaGpsAppProps {
  user?: {
    uid?: string;
    id?: string;
    email?: string;
    displayName?: string;
    name?: string;
  } | null;
  onNavigateToExpenses?: () => void;
  onExpenseCreated?: () => void;
  language?: 'fr' | 'en';
}

export default function App({ 
  user: propUser, 
  onNavigateToExpenses, 
  onExpenseCreated,
  language = 'fr' 
}: GantavyaGpsAppProps = {}) {
  const [currentLang, setCurrentLang] = useState<GpsLanguage>(() => (language === 'en' ? 'en' : 'fr'));

  useEffect(() => {
    if (language === 'en' || language === 'fr') {
      setCurrentLang(language as GpsLanguage);
    }
  }, [language]);

  const isFr = currentLang === 'fr';

  // --- 1. Load Local Storage Initializers ---
  const [tripsHistory, setTripsHistory] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('gantavya_trips');
    if (saved) {
      try {
        const parsed: Trip[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => ({
            ...t,
            date: normalizeIsoDate(t.date),
          }));
        }
      } catch (e) {
        console.error('Error parsing trips:', e);
      }
    }
    // Default sample business trip for initial testing
    return [
      {
        id: 'trip_demo_mtl_laval',
        date: new Date().toISOString(),
        duration: 2160,
        distance: 34.5,
        avgSpeed: 58,
        maxSpeed: 104,
        calories: 195,
        score: 95,
        route: [
          [45.5017, -73.5673],
          [45.5601, -73.7121],
          [45.6066, -73.7124]
        ]
      }
    ];
  });

  const handleSetSettings = (newSettings: Settings) => {
    if (newSettings.language && (newSettings.language === 'fr' || newSettings.language === 'en')) {
      setCurrentLang(newSettings.language);
    }
    setSettings({
      ...newSettings,
      theme: 'light',
    });
  };

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('gantavya_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        theme: 'light',
        autoStartTrip: parsed.autoStartTrip ?? false,
      };
    }
    return {
      units: 'kmh',
      warningSpeed: 80,
      theme: 'light',
      autoStartTrip: false,
    };
  });

  // --- 2. Live Geolocation States ---
  const [gpsStats, setGpsStats] = useState<GPSStats>({
    speed: null,
    avgSpeed: 0,
    maxSpeed: 0,
    distance: 0,
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    altitude: null,
  });

  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');
  const [route, setRoute] = useState<[number, number][]>([]);
  const [autoCenter, setAutoCenter] = useState(true);

  // --- 3. Diagnostics and Alerts ---
  const [tripDuration, setTripDuration] = useState(0);
  const [overspeedSeconds, setOverspeedSeconds] = useState(0);
  const [suddenBrakingCount, setSuddenBrakingCount] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isOverspeeding, setIsOverspeeding] = useState(false);
  const [summaryTrip, setSummaryTrip] = useState<Trip | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const user = propUser || null;
  const isAuthenticated = !!user;

  // --- Expense Transfer States ---
  const [submittedTripIds, setSubmittedTripIds] = useState<Set<string>>(new Set());
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  const handleTransferTripToExpense = async (trip: Trip) => {
    setIsSubmittingExpense(true);
    try {
      const empName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Alexandre Tremblay');
      const empId = user?.id || user?.uid || 'emp_001';
      const empEmail = user?.email || 'a.tremblay@applepai.ca';

      const ratePerKm = 0.70; // Taux officiel kilométrique CRA/RQ 0,70 $/km
      const km = Number(trip.distance.toFixed(2));
      const grossAmount = Math.round(km * ratePerKm * 100) / 100;

      const durationMins = Math.floor(trip.duration / 60);
      const durationSecs = trip.duration % 60;
      const durationStr = durationMins > 0 ? `${durationMins}m ${durationSecs}s` : `${durationSecs}s`;

      const payload = {
        id: `exp_gps_${trip.id}_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'Véhicule & Déplacements (Indemnité kilométrique)',
        description: `Indemnité kilométrique GPS - Trajet ${km} km (${durationStr})`,
        amount: grossAmount,
        deductibleAmount: grossAmount,
        notes: `Déplacement professionnel enregistré via GPS TripLog. Distance: ${km} km, Vitesse moy: ${Math.round(trip.avgSpeed)} km/h, Vitesse max: ${Math.round(trip.maxSpeed)} km/h, Score sécurité: ${trip.score}/100. Taux: 0,70 $/km.`,
        employeeId: empId,
        employeeName: empName,
        employeeEmail: empEmail,
        source: 'gps_triplog',
        sourceId: String(trip.id),
        status: 'pending_approval',
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors du transfert de la note de frais');
      }

      setSubmittedTripIds(prev => new Set(prev).add(trip.id));
      setTransferSuccessMessage(
        isFr
          ? `Trajet GPS (${km} km - ${grossAmount.toFixed(2)} $ CAD) soumis avec succès au nom de ${empName} ! Statut : En attente d'approbation.`
          : `GPS trip (${km} km - $${grossAmount.toFixed(2)} CAD) submitted successfully for ${empName}! Status: Pending approval.`
      );

      if (onExpenseCreated) {
        onExpenseCreated();
      }

      setTimeout(() => {
        setTransferSuccessMessage(null);
        if (onNavigateToExpenses) {
          onNavigateToExpenses();
        } else {
          window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'expenses' }));
        }
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la transmission');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleGenerateSampleTrip = () => {
    const sampleTrip: Trip = {
      id: `trip_sample_${Date.now()}`,
      date: new Date().toISOString(),
      duration: 2160,
      distance: 34.5,
      avgSpeed: 58,
      maxSpeed: 104,
      calories: 195,
      score: 95,
      route: [
        [45.5017, -73.5673], // Vieux-Montréal
        [45.5088, -73.5540], // Berri-UQAM
        [45.5190, -73.5820], // Plateau-Mont-Royal
        [45.5270, -73.6150], // Outremont / Mile-End
        [45.5450, -73.6550], // Ville Saint-Laurent
        [45.5601, -73.7121], // Autoroute 15 Nord / Laval
        [45.5800, -73.7350], // Chomedey Laval
        [45.6066, -73.7124]  // Parc de la Rivière-des-Mille-Îles
      ]
    };

    setTripsHistory(prev => [sampleTrip, ...prev]);
    setSummaryTrip(sampleTrip);
    setShowSummaryModal(true);

    if (isAuthenticated) {
      syncTripToCloud(sampleTrip);
    }
  };

  // --- 4. System Hooks and Refs ---
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ latitude: number; longitude: number; speed: number; timestamp: number } | null>(null);
  const speedHistoryRef = useRef<{ speed: number; timestamp: number }[]>([]);
  const highSpeedStartTimeRef = useRef<number | null>(null);
  const tripStatusRef = useRef<TripStatus>('idle');
  tripStatusRef.current = tripStatus;
  const autoStartTripRef = useRef<boolean>(settings.autoStartTrip ?? false);
  autoStartTripRef.current = settings.autoStartTrip ?? false;

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // --- 5. Cloud Sync ---
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (user?.uid || user?.id) {
      headers['x-user-id'] = String(user.uid || user.id);
    }
    if (user?.email) {
      headers['x-user-email'] = user.email;
    }
    return headers;
  };

  const syncTripToCloud = async (trip: Trip) => {
    try {
      const normalizedTrip: Trip = {
        ...trip,
        date: normalizeIsoDate(trip.date),
      };
      await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(normalizedTrip),
      });
    } catch (err) {
      console.error('Failed to sync trip to cloud:', err);
    }
  };

  const fetchCloudTrips = async () => {
    try {
      // 1. First, push all local trips to cloud to ensure they are backed up
      if (tripsHistory.length > 0) {
        await Promise.all(tripsHistory.map(syncTripToCloud));
      }

      // 2. Then, fetch everything from cloud to sync this device
      const response = await fetch('/api/trips', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const cloudTrips: Trip[] = await response.json();
        // Merge with local trips, avoiding duplicates
        setTripsHistory((localTrips) => {
          const merged = [...localTrips];
          cloudTrips.forEach((ct) => {
            if (!merged.find((lt) => lt.id === ct.id)) {
              merged.push(ct);
            }
          });
          return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      }
    } catch (err) {
      console.error('Failed to sync trips with cloud:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCloudTrips();
    }
  }, [isAuthenticated, user?.uid, user?.id]);

  // --- 6. Sync Settings to LocalStorage & Class theme ---
  useEffect(() => {
    localStorage.setItem('gantavya_settings', JSON.stringify(settings));
    
    // Toggle dark/light document class for styling
    const rootEl = document.documentElement;
    if (settings.theme === 'light') {
      rootEl.classList.remove('dark');
      rootEl.style.backgroundColor = '#f4f4f5'; // Light grey
    } else {
      rootEl.classList.add('dark');
      rootEl.style.backgroundColor = '#09090b'; // Zinc-950
    }
  }, [settings]);

  // Sync Trips History
  useEffect(() => {
    localStorage.setItem('gantavya_trips', JSON.stringify(tripsHistory));
  }, [tripsHistory]);

  // --- 6. PWA Installation Listeners ---
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    // Register service worker if available and force update to ensure /api/ bypass is active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('Service worker registration skipped:', err);
        });
    }
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // --- 7. Chrono Trip Timer System ---
  useEffect(() => {
    if (tripStatus === 'tracking') {
      timerRef.current = setInterval(() => {
        setTripDuration((prev) => prev + 1);

        // Track overspeeding seconds
        setGpsStats((currentStats) => {
          if (currentStats.speed !== null) {
            const warningSpeedKmh = settings.units === 'mph' ? settings.warningSpeed / 0.621371 : settings.warningSpeed;
            if (currentStats.speed > warningSpeedKmh) {
              setOverspeedSeconds((prev) => prev + 1);
              setIsOverspeeding(true);
              // Synthesize warning audio tone
              playOverspeedWarning();
            } else {
              setIsOverspeeding(false);
            }
          }
          return currentStats;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsOverspeeding(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tripStatus, settings.warningSpeed, settings.units]);

  // --- 8. Geolocation Tracking System ---
  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError(null);

    const handleGPSUpdate = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, altitude } = position.coords;
      let rawSpeed = position.coords.speed; // Speed in m/s from GPS
      const timestamp = position.timestamp;

      // 1. Accuracy Filtering: Ignore updates with very poor accuracy (> 100m)
      // This prevents the "GPS IS WRONG" jumps common in city canyons or on initial lock
      if (accuracy !== null && accuracy > 100) {
        console.warn('Ignoring low accuracy GPS update:', accuracy, 'meters');
        setGpsError('Weak GPS Signal: Accuracy > 100m. Searching for precision...');
        return;
      } else {
        setGpsError(null);
      }

      let speedKmh = rawSpeed !== null ? rawSpeed * 3.6 : null;
      let isManualSpeed = false;

      // Fallback manual speed calculation if GPS speed is unavailable or null
      if (speedKmh === null && lastPositionRef.current) {
        const calculated = calculateSpeedFromCoords(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          lastPositionRef.current.timestamp,
          latitude,
          longitude,
          timestamp
        );
        speedKmh = calculated;
        isManualSpeed = true;
      }

      // Static noise filter and adaptive drift thresholding
      let driftThreshold = 3.0; // Default threshold of 3 km/h
      if (accuracy !== null && accuracy > 40) {
        // If GPS accuracy is poor (>40m), scale the threshold dynamically or ignore minor jumps entirely
        // For example, with 60m accuracy, threshold becomes 3.0 + 20 * 0.15 = 6.0 km/h
        driftThreshold = Math.min(12.0, 3.0 + (accuracy - 40) * 0.15);
      }

      // Apply thresholding to force speed to 0 if below drift threshold
      if (speedKmh !== null) {
        if (isManualSpeed || rawSpeed === null) {
          if (speedKmh < driftThreshold) {
            speedKmh = 0;
          }
        } else {
          // For raw GPS speed, apply a slightly scaled baseline threshold if accuracy is poor
          const rawDriftThreshold = accuracy !== null && accuracy > 30 ? 2.5 : 1.5;
          if (speedKmh < rawDriftThreshold) {
            speedKmh = 0;
          }
        }
      }

      // Distance Accumulation Guard: Don't count distance if accuracy is worse than 50m
      // as the jitter is likely larger than the actual movement at low speeds
      const canAccumulateDistance = accuracy !== null && accuracy < 50;

      // Check for sudden brakes (e.g., deceleration > 12 km/h per update/sec)
      if (speedKmh !== null && lastPositionRef.current) {
        const timeDelta = (timestamp - lastPositionRef.current.timestamp) / 1000;
        if (timeDelta > 0 && timeDelta < 2.5) {
          const speedDelta = lastPositionRef.current.speed - speedKmh;
          // Deceleration rate normalized to per-second
          const decelerationPerSec = speedDelta / timeDelta;
          if (decelerationPerSec > 12) {
            setSuddenBrakingCount((prev) => prev + 1);
          }
        }
      }

      // Compute headings (if missing, estimate from coordinate trajectory)
      let resolvedHeading = heading;
      if ((resolvedHeading === null || isNaN(resolvedHeading)) && lastPositionRef.current && speedKmh && speedKmh > 3) {
        resolvedHeading = calculateBearing(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          latitude,
          longitude
        );
      }

      // Save as latest reference position
      lastPositionRef.current = {
        latitude,
        longitude,
        speed: speedKmh || 0,
        timestamp,
      };

      // Auto Start Trip logging logic
      if (autoStartTripRef.current && tripStatusRef.current === 'idle') {
        if (speedKmh !== null && speedKmh >= 15) {
          if (highSpeedStartTimeRef.current === null) {
            highSpeedStartTimeRef.current = timestamp;
          } else if (timestamp - highSpeedStartTimeRef.current >= 10000) {
            // Reset high speed timer to prevent duplicate starts
            highSpeedStartTimeRef.current = null;
            // Trigger automatic trip start
            handleStartTripRef.current();
          }
        } else {
          highSpeedStartTimeRef.current = null;
        }
      } else {
        highSpeedStartTimeRef.current = null;
      }

      // State Updates
      setGpsStats((prev) => {
        // Core metric aggregates
        const isTracking = tripStatus === 'tracking';
        let newDistance = prev.distance;

        if (isTracking && prev.latitude !== null && prev.longitude !== null && canAccumulateDistance) {
          const increment = calculateDistance(prev.latitude, prev.longitude, latitude, longitude);
          // Accumulate distance (ensure distance jitter doesn't spike while completely stationary)
          if (speedKmh && speedKmh > 1.2) {
            newDistance += increment;
          }
        }

        const newMaxSpeed = speedKmh !== null ? Math.max(prev.maxSpeed, speedKmh) : prev.maxSpeed;
        
        // Calculate cumulative moving average speed
        let newAvgSpeed = prev.avgSpeed;
        if (isTracking && speedKmh !== null && speedKmh > 0.5) {
          speedHistoryRef.current.push({ speed: speedKmh, timestamp });
          const totalSpeed = speedHistoryRef.current.reduce((sum, item) => sum + item.speed, 0);
          newAvgSpeed = totalSpeed / speedHistoryRef.current.length;
        }

        return {
          speed: speedKmh,
          maxSpeed: newMaxSpeed,
          avgSpeed: newAvgSpeed,
          distance: newDistance,
          latitude,
          longitude,
          accuracy,
          heading: resolvedHeading,
          altitude,
        };
      });

      // Update route trajectory if currently tracking active trip
      if (tripStatus === 'tracking' && canAccumulateDistance) {
        setRoute((prev) => [...prev, [latitude, longitude]]);
      }
    };

    const handleGPSError = (error: GeolocationPositionError) => {
      console.warn('GPS position error code:', error.code, error.message);
      if (error.code === error.PERMISSION_DENIED) {
        setGpsError('GPS Access Denied. Please enable high accuracy location services in your browser settings to run speedometer.');
      } else {
        setGpsError(`GPS Status: ${error.message} (Searching for high precision signal...)`);
      }
    };

    // Watcher options
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleGPSUpdate, handleGPSError, options);
  };

  // Start GPS watch on first load
  useEffect(() => {
    startGPSTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tripStatus]);

  // --- 9. Core Trip State Controllers ---
  const handleStartTrip = () => {
    playClick();
    setTripStatus('tracking');
    setTripDuration(0);
    setOverspeedSeconds(0);
    setSuddenBrakingCount(0);
    speedHistoryRef.current = [];
    
    const lat = lastPositionRef.current?.latitude ?? gpsStats.latitude;
    const lng = lastPositionRef.current?.longitude ?? gpsStats.longitude;
    const speed = lastPositionRef.current?.speed ?? gpsStats.speed;

    if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
      setRoute([[lat, lng]]);
    } else {
      setRoute([]);
    }

    setGpsStats((prev) => ({
      ...prev,
      distance: 0,
      avgSpeed: 0,
      maxSpeed: speed || prev.speed || 0,
    }));
  };

  const handleStartTripRef = useRef(handleStartTrip);
  handleStartTripRef.current = handleStartTrip;

  const handlePauseTrip = () => {
    playClick();
    setTripStatus('paused');
  };

  const handleResumeTrip = () => {
    playClick();
    setTripStatus('tracking');
  };

  const handleStopTrip = () => {
    playClick();
    setTripStatus('stopped');

    const totalSeconds = tripDuration;
    const caloriesBurned = estimateCalories(totalSeconds, gpsStats.avgSpeed);
    
    const safetyScore = calculateDrivingScore({
      overspeedSeconds,
      totalSeconds,
      suddenBrakes: suddenBrakingCount,
      avgSpeed: gpsStats.avgSpeed,
      maxSpeed: gpsStats.maxSpeed,
    });

    const finishedTrip: Trip = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      duration: totalSeconds,
      distance: gpsStats.distance,
      avgSpeed: gpsStats.avgSpeed,
      maxSpeed: gpsStats.maxSpeed,
      calories: caloriesBurned,
      score: safetyScore,
      route,
    };

    // Save to device history list
    setTripsHistory((prev) => [finishedTrip, ...prev]);
    setSummaryTrip(finishedTrip);
    setShowSummaryModal(true);
    setTripStatus('idle');

    // Sync to cloud if logged in
    if (isAuthenticated) {
      syncTripToCloud(finishedTrip);
    }
  };

  // --- 10. Preference Operations ---
  const handleDeleteTrip = async (id: string) => {
    playClick();
    setTripsHistory((prev) => prev.filter((t) => t.id !== id));
    
    if (isAuthenticated) {
      try {
        await fetch(`/api/trips/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.error('Failed to delete trip from cloud:', err);
      }
    }
  };

  const handleClearAllHistory = async () => {
    playClick();
    if (window.confirm('Are you sure you want to clear all driving history metrics?')) {
      setTripsHistory([]);
      
      if (isAuthenticated) {
        try {
          await fetch('/api/trips', {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error('Failed to clear trips from cloud:', err);
        }
      }
    }
  };

  const handleResetCurrentStats = () => {
    playClick();
    if (window.confirm('Reset current maximum and average statistics?')) {
      setGpsStats((prev) => ({
        ...prev,
        maxSpeed: prev.speed || 0,
        avgSpeed: prev.speed || 0,
        distance: 0,
      }));
      setTripDuration(0);
      setOverspeedSeconds(0);
      setSuddenBrakingCount(0);
      setRoute([]);
    }
  };

  // Conversions for UI
  const formatAltitude = (meters: number | null) => {
    if (meters === null || isNaN(meters)) return 'N/A';
    if (settings.units === 'mph') {
      return `${Math.round(meters * 3.28084)} ft`; // Feet
    }
    return `${Math.round(meters)} m`; // Meters
  };

  const formatDistance = (km: number) => {
    if (settings.units === 'mph') {
      return `${(km * 0.621371).toFixed(2)} mi`;
    }
    return `${km.toFixed(2)} km`;
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const currentThemeClasses = settings.theme === 'light'
    ? 'bg-zinc-100 text-zinc-900 border-zinc-200'
    : 'bg-[#09090b] text-white border-zinc-900';

  const dashboardCardBg = settings.theme === 'light'
    ? 'bg-white/80 border-zinc-200/80 text-zinc-800'
    : 'bg-white/5 border-white/10 text-white/90';

  return (
    <div 
      className={`min-h-screen w-full flex flex-col p-4 md:p-8 transition-colors duration-500 overflow-x-hidden ${currentThemeClasses} ${
        isOverspeeding ? 'overspeed-flash-active' : ''
      }`}
    >
      {/* Dynamic Title / Header Area */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-6">
        <Logo />

        {/* Action tags */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
              settings.theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-white/5 border-white/10 text-white/80'
            }`}>
              <UserIcon className="h-3.5 w-3.5" />
              <span>{user?.email ? user.email.split('@')[0] : (user?.displayName || (isFr ? 'Utilisateur actif' : 'Active User'))}</span>
            </div>
          )}

          {showInstallBtn && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isFr ? "Installer l'app" : "Install App"}</span>
            </button>
          )}

          {!showInstallBtn && (
            <>
              <button
                onClick={() => {
                  playClick();
                  setIsHistoryOpen(true);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-800 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                }`}
                title={isFr ? "Ouvrir l'historique des trajets" : "Open Trip History"}
              >
                <History className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  playClick();
                  setIsSettingsOpen(true);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-800 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                }`}
                title={isFr ? "Ouvrir les préférences" : "Open Preferences"}
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Quick status dot */}
          <div className={`px-2.5 py-1 rounded-full border text-[10px] font-mono flex items-center gap-1.5 ${
            settings.theme === 'light'
              ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
              : 'bg-white/5 border-white/10 text-white/80'
          }`}>
            <span className={`h-2 w-2 rounded-full ${gpsError ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
            <span>{gpsError ? (isFr ? 'SIGNAL GPS PERDU' : 'SIGNAL GPS LOST') : (isFr ? 'SIGNAL GPS VERROUILLÉ' : 'GPS LOCKED')}</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-4xl mx-auto w-full flex flex-col gap-6 flex-1">
        
        {/* Business Travel & Expense Transfer Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-blue-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md shadow-inner text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                  {isFr ? 'Registre Kilométrique des Déplacements' : 'Business Travel Mileage Registry'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  {isFr ? 'Taux CRA / RQ : 0,70 $ / km' : 'CRA / RQ Rate: $0.70 / km'}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {isFr ? 'Employé demandeur :' : 'Claimant employee:'} <strong className="text-white">{user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'Alexandre Tremblay')}</strong> {user?.email ? `(${user.email})` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Success Toast for Expense Transfer */}
        <AnimatePresence>
          {transferSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center justify-between gap-3 text-xs font-bold border border-emerald-400/40"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                <span>{transferSuccessMessage}</span>
              </div>
              <button
                onClick={() => {
                  if (onNavigateToExpenses) {
                    onNavigateToExpenses();
                  } else {
                    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'expenses' }));
                  }
                }}
                className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-[11px] font-bold shrink-0 hover:bg-emerald-50 cursor-pointer shadow-sm"
              >
                {isFr ? "Ouvrir l'onglet Dépenses →" : "Open Expenses Tab →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permission / Geolocation Warning Alert Banners */}
        {gpsError && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-sans flex items-start gap-3 text-left">
            <Info className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <div className="flex flex-col gap-1 text-left">
              <span className="font-semibold uppercase tracking-wider text-[9px] font-mono text-amber-600 dark:text-amber-400">
                {isFr ? 'Diagnostic de localisation' : 'Location Diagnostic'}
              </span>
              <p className="leading-relaxed text-amber-700 dark:text-amber-300/90">{gpsError}</p>
              <button 
                onClick={startGPSTracking}
                className="mt-2 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30 rounded-lg text-[10px] font-mono hover:bg-amber-500/20 dark:hover:bg-amber-500/25 max-w-max transition-all cursor-pointer"
              >
                {isFr ? 'Recalibrer le signal GPS' : 'Force Recalibrate Signal'}
              </button>
            </div>
          </div>
        )}

        {/* UPPER SECTION: Full-Width Map and Centered Drawer Controller */}
        <div className="flex flex-col gap-6 w-full">
          {/* Interactive OSM Dark-Themed Map Canvas */}
          <MapContainer
            latitude={gpsStats.latitude}
            longitude={gpsStats.longitude}
            accuracy={gpsStats.accuracy}
            heading={gpsStats.heading}
            route={route}
            autoCenter={autoCenter}
            setAutoCenter={setAutoCenter}
            theme={settings.theme}
          />

          {/* Full-Width Controller and Speedometer/Metrics Drawer */}
          <div className="w-full flex flex-col gap-4">
            {/* Metrics Drawer Component: opens upwards above the Trip Diagnostics control bar */}
            <AnimatePresence>
              {tripStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                  className="w-full overflow-hidden origin-bottom"
                >
                  <div 
                    className={`p-4 sm:p-5 md:p-6 rounded-[2rem] border backdrop-blur-xl shadow-xl transition-all duration-300 ${
                      settings.theme === 'light'
                        ? 'bg-white/85 border-zinc-200/85 shadow-zinc-200/20 text-zinc-900'
                        : 'bg-zinc-950/80 border-white/10 shadow-black/40 text-white'
                    }`}
                    style={{ paddingRight: '10px', paddingLeft: '0px' }}
                  >
                    <MetricsGrid
                      maxSpeed={gpsStats.maxSpeed}
                      avgSpeed={gpsStats.avgSpeed}
                      tripDuration={tripDuration}
                      distance={gpsStats.distance}
                      units={settings.units}
                      theme={settings.theme}
                      speed={gpsStats.speed}
                      warningSpeed={settings.warningSpeed}
                      compassDir={getCompassDirection(gpsStats.heading)}
                      language={currentLang}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tracking Controller Bar - Glassmorphism buttons below speedometer */}
            <div className={`p-4 rounded-[2rem] border backdrop-blur-xl flex flex-col gap-3 shadow-xl transition-colors duration-350 ${
              settings.theme === 'light'
                ? 'bg-white/80 border-zinc-200/85 shadow-zinc-200/30'
                : 'bg-white/5 border-white/10 shadow-black/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono tracking-wider uppercase ${
                  settings.theme === 'light' ? 'text-zinc-400 font-medium' : 'text-white/40'
                }`}>
                  {isFr ? 'Diagnostic du trajet' : 'Trip Diagnostics'}
                </span>
                {tripStatus !== 'idle' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-mono">
                    <span className="animate-pulse text-sky-500">●</span>
                    <span>{isFr ? 'EN COURS' : 'RECORDING'}</span>
                  </div>
                )}
              </div>

              {/* Dynamic state engine controllers */}
              <div className="flex gap-3">
                {tripStatus === 'idle' && (
                  <button
                    onClick={handleStartTrip}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg hover:shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="h-4.5 w-4.5" />
                    <span>{isFr ? 'Démarrer le trajet' : 'Start Active Trip'}</span>
                  </button>
                )}

                {tripStatus === 'tracking' && (
                  <>
                    <button
                      onClick={handlePauseTrip}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold active:scale-95 transition-all border cursor-pointer ${
                        settings.theme === 'light'
                          ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200/80 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white border-white/10'
                      }`}
                    >
                      <Pause className="h-4.5 w-4.5" />
                      <span>{isFr ? 'Mettre en pause' : 'Pause Trip'}</span>
                    </button>
                    <button
                      onClick={handleStopTrip}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Square className="h-4.5 w-4.5" />
                      <span>{isFr ? 'Arrêter le trajet' : 'Stop Trip'}</span>
                    </button>
                  </>
                )}

                {tripStatus === 'paused' && (
                  <>
                    <button
                      onClick={handleResumeTrip}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="h-4.5 w-4.5" />
                      <span>{isFr ? 'Reprendre' : 'Resume'}</span>
                    </button>
                    <button
                      onClick={handleStopTrip}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Square className="h-4.5 w-4.5" />
                      <span>{isFr ? 'Arrêter' : 'Stop'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Splits settings panel, emergency SOS triggers, and historical details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Historical Trips Card Trigger */}
          <div
            id="history-section"
            onClick={() => {
              playClick();
              setIsHistoryOpen(true);
            }}
            className={`group p-6 rounded-[2rem] border backdrop-blur-xl flex flex-col justify-between cursor-pointer transition-all duration-300 active:scale-[0.98] ${
              settings.theme === 'light'
                ? 'bg-white/80 border-zinc-200/80 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/40 border-white/10 hover:border-white/15 hover:shadow-2xl hover:shadow-black/60 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl border ${
                  settings.theme === 'light'
                    ? 'bg-sky-500/10 text-sky-600 border-sky-500/15'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/15'
                }`}>
                  <History className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <h2 className="font-sans text-lg font-bold tracking-tight">
                    {isFr ? 'HISTORIQUE DES TRAJETS' : 'TRIP HISTORY LOG'}
                  </h2>
                  <p className={`text-xs mt-0.5 ${
                    settings.theme === 'light' ? 'text-zinc-500 font-medium' : 'text-white/50'
                  }`}>
                    {isFr 
                      ? `${tripsHistory.length} trajet(s) enregistré(s) sur cet appareil` 
                      : `${tripsHistory.length} recorded ${tripsHistory.length === 1 ? 'trip' : 'trips'} on this device`}
                  </p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                settings.theme === 'light' ? 'text-zinc-400' : 'text-white/30'
              }`} />
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <span className={`text-[10px] font-mono tracking-wider uppercase ${
                settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
              }`}>
                {tripsHistory.length > 0 
                  ? (isFr ? `Dernier : ${formatTripDate(tripsHistory[0].date)}` : `Latest: ${formatTripDate(tripsHistory[0].date)}`) 
                  : (isFr ? 'Aucun historique' : 'No logged history')}
              </span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                settings.theme === 'light' ? 'text-sky-600' : 'text-sky-400'
              }`}>
                {isFr ? 'Ouvrir le panneau →' : 'Open Drawer →'}
              </span>
            </div>
          </div>

          {/* Parameter Configuration Preferences panel Card Trigger */}
          <div
            id="settings-section"
            onClick={() => {
              playClick();
              setIsSettingsOpen(true);
            }}
            className={`group p-6 rounded-[2rem] border backdrop-blur-xl flex flex-col justify-between cursor-pointer transition-all duration-300 active:scale-[0.98] ${
              settings.theme === 'light'
                ? 'bg-white/80 border-zinc-200/80 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/40 border-white/10 hover:border-white/15 hover:shadow-2xl hover:shadow-black/60 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl border ${
                  settings.theme === 'light'
                    ? 'bg-sky-500/10 text-sky-600 border-sky-500/15'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/15'
                }`}>
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <h2 className="font-sans text-lg font-bold tracking-tight">
                    {isFr ? 'PARAMÈTRES COPILOTE' : 'COPILOT PREFERENCES'}
                  </h2>
                  <p className={`text-xs mt-0.5 ${
                    settings.theme === 'light' ? 'text-zinc-500 font-medium' : 'text-white/50'
                  }`}>
                    {isFr 
                      ? `Unités : ${settings.units.toUpperCase()} | Vitesse d'alerte : ${settings.warningSpeed} ${settings.units === 'kmh' ? 'km/h' : 'mph'}` 
                      : `Units: ${settings.units.toUpperCase()} | Warning speed: ${settings.warningSpeed} ${settings.units === 'kmh' ? 'km/h' : 'mph'}`}
                  </p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                settings.theme === 'light' ? 'text-zinc-400' : 'text-white/30'
              }`} />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className={`text-[10px] font-mono tracking-wider uppercase ${
                settings.theme === 'light' ? 'text-zinc-400' : 'text-white/40'
              }`}>
                {isFr ? `Mode d'affichage : ${settings.theme === 'light' ? 'CLAIR' : 'SOMBRE'}` : `Theme Mode: ${settings.theme.toUpperCase()}`}
              </span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                settings.theme === 'light' ? 'text-sky-600' : 'text-sky-400'
              }`}>
                {isFr ? 'Configurer →' : 'Configure →'}
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Floating emergency SOS button with details popup */}
      <EmergencyModal
        latitude={gpsStats.latitude}
        longitude={gpsStats.longitude}
        accuracy={gpsStats.accuracy}
        theme={settings.theme}
        language={currentLang}
      />

      {/* Speed limit exceeded warnings overlays */}
      <AnimatePresence>
        {isOverspeeding && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10005] bg-red-600 border border-red-500 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"
          >
            <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono font-bold text-red-200 tracking-wider uppercase">
                {isFr ? 'Alerte de dépassement de vitesse' : 'Overspeed Limit warning'}
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {isFr 
                  ? `RALENTISSEZ ! Vous dépassez la limite de ${settings.warningSpeed} ${settings.units === 'kmh' ? 'km/h' : 'mph'}.` 
                  : `SLOW DOWN! You are exceeding ${settings.warningSpeed} ${settings.units === 'kmh' ? 'km/h' : 'mph'} limit.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Completed Diagnostic Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && summaryTrip && (
          <SummaryModal
            trip={summaryTrip}
            units={settings.units}
            onClose={() => setShowSummaryModal(false)}
            theme={settings.theme}
            user={user}
            onTransferToExpense={handleTransferTripToExpense}
            isSubmittingExpense={isSubmittingExpense}
            isTransferred={submittedTripIds.has(summaryTrip.id)}
            language={currentLang}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <Drawer
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title={isFr ? "Paramètres Copilote" : "Copilot Settings"}
            theme={settings.theme}
            language={currentLang}
          >
            <SettingsPanel
              settings={settings}
              setSettings={handleSetSettings}
              onResetStats={handleResetCurrentStats}
              language={currentLang}
              onLanguageChange={(newLang) => {
                setCurrentLang(newLang);
                setSettings(prev => ({ ...prev, language: newLang }));
              }}
            />
          </Drawer>
        )}
      </AnimatePresence>

      {/* Trip History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <Drawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            title={isFr ? "Historique des Trajets" : "Logged Trip History"}
            theme={settings.theme}
            language={currentLang}
          >
            <HistoryList
              trips={tripsHistory}
              units={settings.units}
              onDeleteTrip={handleDeleteTrip}
              onClearAll={handleClearAllHistory}
              theme={settings.theme}
              isAuthenticated={isAuthenticated}
              onTransferToExpense={handleTransferTripToExpense}
              submittedTripIds={submittedTripIds}
              onGenerateSampleTrip={handleGenerateSampleTrip}
              language={currentLang}
            />
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
}
