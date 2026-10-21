import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * GANTAVYA SPEEDOMETER - FULL-STACK STANDALONE MODULE
 */

const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "gantavya_secure_secret_123";

// --- IN-MEMORY DATABASE STORE (MySQL Removed) ---
const inMemoryUsers = new Map<string, any>();
const inMemoryTrips: any[] = [];

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
  }
};

// --- API ROUTES ---

router.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (inMemoryUsers.has(email)) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const user = { id: userId, email, password: hashedPassword };
    inMemoryUsers.set(email, user);
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token });
  } catch (err: any) {
    res.status(400).json({ error: "Registration failed" });
  }
});

router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = inMemoryUsers.get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

router.post('/api/trips', authenticateToken, async (req: any, res) => {
  const { id, date, duration, distance, maxSpeed, avgSpeed, calories, score, route } = req.body;
  try {
    const trip = {
      user_id: req.user.id,
      local_id: id,
      date: new Date(date).toISOString(),
      duration,
      distance,
      max_speed: maxSpeed,
      avg_speed: avgSpeed,
      calories,
      score,
      route
    };
    inMemoryTrips.push(trip);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
});

router.get('/api/trips', authenticateToken, async (req: any, res) => {
  try {
    const userTrips = inMemoryTrips.filter((t: any) => t.user_id === req.user.id);
    res.json(userTrips.map((t: any) => ({
      id: t.local_id || t.id?.toString(),
      date: t.date,
      duration: t.duration,
      distance: t.distance,
      maxSpeed: t.max_speed,
      avgSpeed: t.avg_speed,
      calories: t.calories,
      score: t.score,
      route: t.route
    })));
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// --- FRONTEND STANDALONE PAGE ---

router.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gantavya Speedometer</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #000; color: #fff; }
        .glass { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); }
        .leaflet-container { font-family: inherit !important; background: #000 !important; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        const LucideIcon = ({ name, size = 20, className = "" }) => {
            const Icon = lucide.icons[name];
            return Icon ? <Icon size={size} className={className} /> : null;
        };

        const MapContainer = ({ latitude, longitude, accuracy, heading, route, autoCenter, setAutoCenter, theme }) => {
            const mapRef = useRef(null);
            const containerRef = useRef(null);
            const markerRef = useRef(null);
            const pathRef = useRef(null);

            useEffect(() => {
                if (!containerRef.current) return;
                const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([latitude || 0, longitude || 0], 15);
                mapRef.current = map;
                const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
                L.tileLayer(tileUrl, {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    className: theme === 'dark' ? 'osm-tiles-dark' : 'osm-tiles-light'
                }).addTo(map);
                markerRef.current = L.marker([latitude || 0, longitude || 0]).addTo(map);
                pathRef.current = L.polyline([], { color: '#38bdf8', weight: 4 }).addTo(map);
                map.on('dragstart', () => setAutoCenter(false));
                return () => map.remove();
            }, []);

            useEffect(() => {
                if (mapRef.current && latitude && longitude) {
                    const pos = [latitude, longitude];
                    markerRef.current.setLatLng(pos);
                    pathRef.current.setLatLngs(route);
                    if (autoCenter) mapRef.current.setView(pos);
                }
            }, [latitude, longitude, route, autoCenter]);

            return (
                <div className="relative w-full h-[320px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                    <div ref={containerRef} className="w-full h-full" />
                    <div className="absolute top-4 left-4 z-[1000] px-3 py-1 rounded-full glass text-[10px] flex items-center gap-2">
                        <div className={"h-1.5 w-1.5 rounded-full animate-pulse " + (accuracy && accuracy < 30 ? 'bg-emerald-400' : 'bg-rose-400')} />
                        {latitude ? latitude.toFixed(5) + ", " + longitude.toFixed(5) : "Searching..."}
                        {accuracy && <span className="opacity-50 tracking-tighter">±{Math.round(accuracy)}m</span>}
                    </div>
                    <button onClick={() => setAutoCenter(true)} className={"absolute bottom-4 right-4 z-[1000] p-3 rounded-full shadow-lg " + (autoCenter ? 'bg-sky-500 text-white' : 'bg-white/10 text-white')}>
                        <LucideIcon name="Crosshair" size={20} />
                    </button>
                </div>
            );
        };

        const App = () => {
            const [theme, setTheme] = useState('light');
            const [speed, setSpeed] = useState(0);
            const [maxSpeed, setMaxSpeed] = useState(0);
            const [location, setLocation] = useState({ lat: null, lng: null, accuracy: null });
            const [tripStatus, setTripStatus] = useState('idle');
            const [trips, setTrips] = useState([]);
            const [token, setToken] = useState(localStorage.getItem('gantavya_token'));
            const [route, setRoute] = useState([]);
            const [autoCenter, setAutoCenter] = useState(true);
            const [showHistory, setShowHistory] = useState(false);
            const [authMode, setAuthMode] = useState('login');
            const [showAuth, setShowAuth] = useState(false);

            const isDark = theme === 'dark';

            useEffect(() => {
                if (token) fetchTrips();
            }, [token]);

            const fetchTrips = async () => {
                try {
                    const res = await fetch('./api/trips', { headers: { 'Authorization': 'Bearer ' + token } });
                    const data = await res.json();
                    if (Array.isArray(data)) setTrips(data);
                } catch (e) {}
            };

            useEffect(() => {
                const watchId = navigator.geolocation.watchPosition((pos) => {
                    const { latitude, longitude, accuracy, speed: s } = pos.coords;
                    
                    // 1. Accuracy Filtering: Ignore updates with poor accuracy (> 100m)
                    if (accuracy !== null && accuracy > 100) return;

                    setLocation({ lat: latitude, lng: longitude, accuracy });
                    
                    if (s !== null) {
                        const kmh = Math.max(0, Math.round(s * 3.6));
                        // Drift threshold
                        const threshold = accuracy && accuracy > 30 ? 4 : 1.5;
                        setSpeed(kmh < threshold ? 0 : kmh);
                        if (kmh > maxSpeed) setMaxSpeed(kmh);
                    }
                    
                    // 2. Trajectory Guard: Only record route if accuracy is decent (< 50m)
                    if (tripStatus === 'active' && accuracy && accuracy < 50) {
                        setRoute(prev => [...prev, [latitude, longitude]]);
                    }
                }, null, { enableHighAccuracy: true });
                return () => navigator.geolocation.clearWatch(watchId);
            }, [tripStatus, maxSpeed]);

            const handleAuth = async (email, password, isLogin) => {
                const endpoint = isLogin ? './api/auth/login' : './api/auth/register';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.token) {
                    setToken(data.token);
                    localStorage.setItem('gantavya_token', data.token);
                }
            };

            return (
                <div className={"min-h-screen transition-colors duration-500 " + (isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900')}>
                    <div className="max-w-2xl mx-auto p-6 space-y-6">
                        <header className="flex justify-between items-center py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-sky-500 shadow-lg"><LucideIcon name="Navigation" className="text-white fill-white" /></div>
                                <h1 className="text-xl font-bold">Gantavya</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={"p-3 rounded-2xl border transition-all " + (isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white shadow-sm')}>
                                    <LucideIcon name={isDark ? 'Sun' : 'Moon'} />
                                </button>
                                {!token ? (
                                    <button onClick={() => setShowAuth(true)} className="p-3 px-5 rounded-2xl bg-sky-500 text-white font-bold text-sm">Sign In</button>
                                ) : (
                                    <button onClick={() => { setToken(null); localStorage.removeItem('gantavya_token'); }} className="p-3 rounded-2xl border border-red-500/10 bg-red-500/5 text-red-500"><LucideIcon name="LogOut" /></button>
                                )}
                            </div>
                        </header>

                        <section className={"p-10 rounded-[3rem] border transition-all text-center space-y-4 shadow-2xl " + (isDark ? 'glass' : 'bg-white border-zinc-100')}>
                            <div className="space-y-1">
                                <div className="text-9xl font-black tracking-tighter text-sky-500 tabular-nums">{speed}</div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">KM/H</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-8">
                                <div className="space-y-1"><div className="text-[10px] font-bold opacity-30 uppercase">Max</div><div className="text-xl font-bold">{maxSpeed}</div></div>
                                <div className="space-y-1"><div className="text-[10px] font-bold opacity-30 uppercase">Score</div><div className="text-xl font-bold text-emerald-500">95</div></div>
                            </div>
                        </section>

                        <MapContainer latitude={location.lat} longitude={location.lng} accuracy={location.accuracy} route={route} autoCenter={autoCenter} setAutoCenter={setAutoCenter} theme={theme} />

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setTripStatus(tripStatus === 'active' ? 'idle' : 'active')} className={"p-8 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl " + (tripStatus === 'active' ? 'bg-rose-500 text-white' : 'bg-sky-500 text-white')}>
                                <LucideIcon name={tripStatus === 'active' ? 'Square' : 'Play'} className="fill-white" />
                                {tripStatus === 'active' ? 'END' : 'START'}
                            </button>
                            <button onClick={() => setShowHistory(true)} className={"p-8 rounded-[2.5rem] border font-bold flex items-center justify-center gap-3 " + (isDark ? 'glass' : 'bg-white border-zinc-200')}>
                                <LucideIcon name="History" />Log
                            </button>
                        </div>

                        {showHistory && (
                            <div className="fixed inset-0 z-50 flex flex-col glass p-6">
                                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Trip History</h2><button onClick={() => setShowHistory(false)} className="p-2 rounded-full glass"><LucideIcon name="X" /></button></div>
                                <div className="flex-1 overflow-y-auto space-y-4">
                                    {trips.map(trip => (
                                        <div key={trip.id} className="p-5 rounded-3xl glass flex justify-between items-center">
                                            <div><div className="text-sm font-bold opacity-50">{new Date(trip.date).toLocaleDateString()}</div><div className="text-lg font-bold">{trip.distance} km</div></div>
                                            <div className="text-right"><div className="text-sky-500 font-bold">Score: {trip.score}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showAuth && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                                <div className="w-full max-w-sm p-8 rounded-[2.5rem] glass space-y-6">
                                    <h2 className="text-3xl font-bold text-center">Gantavya</h2>
                                    <input id="email" type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none" />
                                    <input id="pass" type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none" />
                                    <button onClick={async () => { const e = document.getElementById('email').value; const p = document.getElementById('pass').value; await handleAuth(e, p, authMode === 'login'); setShowAuth(false); }} className="w-full p-5 rounded-2xl bg-sky-500 font-bold text-white shadow-lg">{authMode === 'login' ? 'Sign In' : 'Join Now'}</button>
                                    <div className="text-center text-sm opacity-50" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? "Sign up" : "Login"}</div>
                                    <button onClick={() => setShowAuth(false)} className="w-full p-2 text-xs opacity-30 uppercase">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
  `;
  res.send(html);
});

export default router;
