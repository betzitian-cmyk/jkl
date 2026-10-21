import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, ZoomIn, ZoomOut, MapPin } from 'lucide-react';

interface MapContainerProps {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  heading?: number | null;
  route: [number, number][];
  autoCenter: boolean;
  setAutoCenter: (val: boolean) => void;
  theme: 'dark' | 'light';
}

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const createGPSIcon = (heading: number | null) => {
  const rotationDeg = heading !== null ? heading : 0;
  const isHeadingAvailable = heading !== null;

  return L.divIcon({
    className: 'custom-gps-marker',
    html: `
      <div class="relative flex items-center justify-center h-16 w-16 pointer-events-none">
        <!-- Directional Cone Beam Layer showing Vehicle Heading -->
        <div class="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out" style="transform: rotate(${rotationDeg}deg); transform-origin: 50% 50%;">
          <svg width="64" height="64" viewBox="0 0 64 64" class="overflow-visible">
            <defs>
              <linearGradient id="coneGradient" x1="32" y1="32" x2="32" y2="2" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
                <stop offset="45%" stop-color="#0284c7" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
              </linearGradient>
              <filter id="coneGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <!-- 58-degree Directional Cone Wedge -->
            <path
              d="M 32 32 L 17 5 A 30 30 0 0 1 47 5 Z"
              fill="url(#coneGradient)"
              filter="url(#coneGlow)"
              opacity="${isHeadingAvailable ? '0.9' : '0.25'}"
            />
            <!-- Center Ray / Heading Sight Line -->
            <line
              x1="32" y1="32" x2="32" y2="3"
              stroke="#e0f2fe"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-dasharray="2 2"
              opacity="${isHeadingAvailable ? '0.9' : '0.2'}"
            />
          </svg>
        </div>

        <!-- Outer Pulsing Radar Wave -->
        <span class="absolute inline-flex h-8 w-8 rounded-full bg-sky-400/40 opacity-75 animate-ping"></span>

        <!-- Precision Halo Ring -->
        <span class="absolute inline-flex h-6 w-6 rounded-full bg-sky-500/20 border border-sky-400/40"></span>

        <!-- Center GPS Location Dot -->
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-400 border-2 border-white shadow-lg shadow-sky-500/60"></span>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};

export default function MapContainer({
  latitude,
  longitude,
  accuracy = null,
  heading = null,
  route,
  autoCenter,
  setAutoCenter,
  theme,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map with OpenStreetMap Engine
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use default coordinates if not loaded yet (New York fallback or 0,0)
    const initialLat = latitude || 40.7128;
    const initialLng = longitude || -74.0060;

    const mapInstance = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false, // Custom Apple-style Leaflet zoom controls
      attributionControl: false, // Clean custom OpenStreetMap badge
    });

    mapRef.current = mapInstance;

    // OpenStreetMap Tile Layer with Leaflet Engine
    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      minZoom: 3,
      attribution: OSM_ATTRIBUTION,
      className: theme === 'dark' ? 'osm-tiles-dark' : 'osm-tiles-light',
      crossOrigin: true,
    });
    tileLayer.addTo(mapInstance);
    tileLayerRef.current = tileLayer;

    // Custom GPS Directional Marker with Heading Cone
    const gpsIcon = createGPSIcon(heading ?? null);
    const markerInstance = L.marker([initialLat, initialLng], { icon: gpsIcon });
    markerInstance.addTo(mapInstance);
    markerRef.current = markerInstance;

    // GPS Accuracy Circle
    if (accuracy && accuracy > 0 && accuracy < 500) {
      const circleInstance = L.circle([initialLat, initialLng], {
        radius: accuracy,
        color: '#38bdf8',
        weight: 1,
        opacity: 0.45,
        fillColor: '#38bdf8',
        fillOpacity: 0.08,
      });
      circleInstance.addTo(mapInstance);
      accuracyCircleRef.current = circleInstance;
    }

    // Polyline for Route Trail
    const polylineInstance = L.polyline([], {
      color: '#38bdf8', // sky-400
      weight: 4,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    });
    polylineInstance.addTo(mapInstance);
    pathRef.current = polylineInstance;

    // Disable auto-centering when user interacts with map manually
    mapInstance.on('dragstart', () => {
      setAutoCenter(false);
    });

    // ResizeObserver to ensure Leaflet canvas resizes without grey tile artifacts
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Initial delayed invalidate to fix layout transitions
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    setMapReady(true);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
      mapInstance.remove();
      mapRef.current = null;
      markerRef.current = null;
      pathRef.current = null;
      tileLayerRef.current = null;
      setMapReady(false);
    };
  }, []); // Run once on mount

  // Watch dynamic theme shifts and update OpenStreetMap tile styling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove existing tile layer and recreate with theme class
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      minZoom: 3,
      attribution: OSM_ATTRIBUTION,
      className: theme === 'dark' ? 'osm-tiles-dark' : 'osm-tiles-light',
      crossOrigin: true,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [theme, mapReady]);

  // Update marker position, heading cone icon, accuracy circle, and auto-center
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker || latitude === null || longitude === null || !mapReady) return;

    const newLatLng: L.LatLngExpression = [latitude, longitude];

    // Update GPS directional marker position and heading cone
    marker.setLatLng(newLatLng);
    marker.setIcon(createGPSIcon(heading ?? null));

    // Update or create accuracy circle
    if (accuracy && accuracy > 0 && accuracy < 500) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(newLatLng);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(newLatLng, {
          radius: accuracy,
          color: '#38bdf8',
          weight: 1,
          opacity: 0.45,
          fillColor: '#38bdf8',
          fillOpacity: 0.08,
        }).addTo(map);
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    // Smooth auto-centering
    if (autoCenter) {
      map.setView(newLatLng, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [latitude, longitude, heading, accuracy, autoCenter, mapReady]);

  // Update route polyline trail
  useEffect(() => {
    const polyline = pathRef.current;
    if (!polyline || !mapReady) return;

    const leafletCoords = route.map((coord) => [coord[0], coord[1]] as L.LatLngExpression);
    polyline.setLatLngs(leafletCoords);
  }, [route, mapReady]);

  // Handle Zoom In
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  // Handle Zoom Out
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  // Handle Recenter
  const handleRecenter = () => {
    setAutoCenter(true);
    if (mapRef.current && latitude !== null && longitude !== null) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom(), {
        animate: true,
        duration: 0.8,
      });
    }
  };

  return (
    <div
      id="map-widget"
      className={`relative w-full h-[320px] rounded-[2rem] overflow-hidden border shadow-xl transition-all duration-300 ${
        theme === 'light'
          ? 'border-zinc-200/85 bg-zinc-50'
          : 'border-white/10 bg-black/20'
      }`}
    >
      {/* Map Leaflet Rendering Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Apple-style controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className={`p-3 rounded-full border shadow-lg backdrop-blur-md transition-all active:scale-95 duration-200 cursor-pointer ${
            autoCenter
              ? 'bg-sky-500/95 text-white border-sky-400'
              : theme === 'light'
                ? 'bg-white/90 text-zinc-700 border-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-900 shadow-zinc-200/30'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
          }`}
          title="Recenter Map"
        >
          <Crosshair className={`h-5 w-5 ${autoCenter ? 'animate-pulse' : ''}`} />
        </button>

        {/* Zoom Controls Card */}
        <div
          className={`flex flex-col rounded-2xl backdrop-blur-md border overflow-hidden shadow-lg ${
            theme === 'light'
              ? 'bg-white/90 border-zinc-200 shadow-zinc-200/30'
              : 'bg-white/10 border-white/10'
          }`}
        >
          <button
            onClick={handleZoomIn}
            className={`p-3 transition-colors cursor-pointer ${
              theme === 'light'
                ? 'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200/60 border-b border-zinc-100'
                : 'text-white hover:bg-white/5 active:bg-white/10 border-b border-white/5'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-3 transition-colors cursor-pointer ${
              theme === 'light'
                ? 'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200/60'
                : 'text-white hover:bg-white/5 active:bg-white/10'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mini GPS Coordinates & Accuracy Tag */}
      <div
        className={`absolute top-4 left-4 z-[1000] px-3 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-mono shadow-md flex items-center gap-1.5 ${
          theme === 'light'
            ? 'bg-white/90 border-zinc-200/80 text-zinc-600 shadow-zinc-200/30'
            : 'bg-black/60 border-white/10 text-white/80'
        }`}
      >
        <div
          className={`h-1.5 w-1.5 rounded-full animate-pulse ${
            accuracy && accuracy < 20
              ? 'bg-emerald-400'
              : accuracy && accuracy < 50
                ? 'bg-amber-400'
                : 'bg-rose-400'
          }`}
        />
        {latitude !== null && longitude !== null ? (
          <div className="flex flex-col">
            <span className="leading-none">
              {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
            </span>
            <span
              className={`text-[8px] uppercase font-bold tracking-tighter mt-0.5 ${
                accuracy && accuracy < 20
                  ? 'text-emerald-400'
                  : accuracy && accuracy < 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
              }`}
            >
              {accuracy
                ? `±${Math.round(accuracy)}m ${accuracy < 25 ? 'High Precision' : 'Weak Signal'}`
                : 'Locking...'}
            </span>
          </div>
        ) : (
          <span className="animate-pulse italic">Awaiting Precision GPS...</span>
        )}
      </div>

      {/* OpenStreetMap & Leaflet Attribution Tag */}
      <div
        className={`absolute bottom-3 left-4 z-[1000] px-2.5 py-1 rounded-full text-[10px] font-mono tracking-tight backdrop-blur-md border shadow-sm flex items-center gap-1.5 ${
          theme === 'light'
            ? 'bg-white/85 text-zinc-600 border-zinc-200/80 shadow-zinc-200/30'
            : 'bg-black/60 text-zinc-400 border-white/10'
        }`}
      >
        <MapPin className="w-3 h-3 text-sky-400" />
        <span>
          ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-sky-400"
          >
            OpenStreetMap
          </a>{' '}
          · Leaflet
        </span>
      </div>
    </div>
  );
}
