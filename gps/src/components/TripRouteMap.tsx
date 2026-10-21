import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Maximize2, MapPin, Flag, Navigation } from 'lucide-react';
import { Trip } from '../types';

interface TripRouteMapProps {
  trip: Trip;
  theme: 'dark' | 'light';
  height?: string;
  className?: string;
  language?: 'fr' | 'en';
}

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Start location marker icon (Green pin)
const createStartIcon = () =>
  L.divIcon({
    className: 'trip-map-marker-start',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-7 w-7 rounded-full bg-emerald-400/40 animate-ping"></span>
        <div class="relative flex items-center justify-center h-7 w-7 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white text-[10px] font-bold">
          A
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// Finish location marker icon (Checker/Flag Rose-Red pin)
const createEndIcon = () =>
  L.divIcon({
    className: 'trip-map-marker-end',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-7 w-7 rounded-full bg-rose-500/40 animate-ping"></span>
        <div class="relative flex items-center justify-center h-7 w-7 rounded-full bg-rose-600 text-white shadow-lg border-2 border-white text-[10px] font-bold">
          B
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export default function TripRouteMap({
  trip,
  theme,
  height = '240px',
  className = '',
  language = 'fr',
}: TripRouteMapProps) {
  const isFr = language === 'fr';
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const hasRoute = trip.route && trip.route.length > 0;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center Montreal / or first coordinate
    const initialCenter: [number, number] = hasRoute
      ? trip.route[0]
      : [45.5017, -73.5673];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      minZoom: 3,
      attribution: OSM_ATTRIBUTION,
      className: theme === 'dark' ? 'osm-tiles-dark' : 'osm-tiles-light',
      crossOrigin: true,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Polyline for past route trajectory
    const polyline = L.polyline([], {
      color: '#38bdf8', // sky-400
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    });
    polyline.addTo(map);
    polylineRef.current = polyline;

    // Handle container resize when drawer opens/slides
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    // Initial tile invalidation pass
    setTimeout(() => {
      map.invalidateSize();
      setMapReady(true);
    }, 150);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile theme if switched
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [theme]);

  // Update Route Polyline and Start/End Markers
  useEffect(() => {
    const map = mapRef.current;
    const polyline = polylineRef.current;
    if (!map || !polyline) return;

    // Remove existing markers if any
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    if (trip.route && trip.route.length > 0) {
      const latLngs = trip.route.map((pt) => [pt[0], pt[1]] as L.LatLngTuple);
      polyline.setLatLngs(latLngs);

      // Start Marker (First point)
      const startCoord = latLngs[0];
      const startMarker = L.marker(startCoord, {
        icon: createStartIcon(),
        title: 'Départ / Start',
      }).addTo(map);
      startMarker.bindPopup(`
        <div style="font-size: 11px; font-weight: bold; padding: 2px;">
          📍 Point de départ<br/>
          <span style="color: #64748b; font-weight: normal;">${startCoord[0].toFixed(4)}, ${startCoord[1].toFixed(4)}</span>
        </div>
      `);
      startMarkerRef.current = startMarker;

      // End Marker (Last point if >= 2 points)
      if (latLngs.length > 1) {
        const endCoord = latLngs[latLngs.length - 1];
        const endMarker = L.marker(endCoord, {
          icon: createEndIcon(),
          title: 'Arrivée / Finish',
        }).addTo(map);
        endMarker.bindPopup(`
          <div style="font-size: 11px; font-weight: bold; padding: 2px;">
            🏁 Point d'arrivée<br/>
            <span style="color: #64748b; font-weight: normal;">${endCoord[0].toFixed(4)}, ${endCoord[1].toFixed(4)}</span>
          </div>
        `);
        endMarkerRef.current = endMarker;
      }

      // Auto-fit bounds with graceful padding
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 16,
          animate: true,
        });
      } catch (err) {
        map.setView(startCoord, 14);
      }
    } else {
      polyline.setLatLngs([]);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [trip.id, trip.route, mapReady]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    if (!mapRef.current || !trip.route || trip.route.length === 0) return;
    const latLngs = trip.route.map((pt) => [pt[0], pt[1]] as L.LatLngTuple);
    const bounds = L.latLngBounds(latLngs);
    mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 16, animate: true });
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-all ${
        theme === 'light'
          ? 'bg-slate-100 border-zinc-200/90 shadow-inner'
          : 'bg-zinc-950 border-white/10 shadow-inner'
      } ${className}`}
      style={{ height }}
    >
      {/* Map Leaflet Canvas Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* When no route coordinates recorded */}
      {!hasRoute && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-xs text-white text-center">
          <Navigation className="h-6 w-6 text-sky-400 mb-1 opacity-80" />
          <p className="text-xs font-semibold">{isFr ? 'Aucune coordonnée GPS enregistrée' : 'No GPS coordinates recorded'}</p>
          <span className="text-[10px] text-white/60">{isFr ? "Le tracé pour ce trajet n'a pas pu être reconstitué." : "The route trajectory could not be plotted."}</span>
        </div>
      )}

      {/* Floating Apple-Style Map Controls */}
      <div className="absolute top-2.5 right-2.5 z-[400] flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleFitBounds}
          className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-transform active:scale-95 cursor-pointer ${
            theme === 'light'
              ? 'bg-white/90 border-zinc-300 text-zinc-700 hover:bg-white hover:text-zinc-950'
              : 'bg-zinc-900/80 border-white/15 text-white/80 hover:bg-zinc-900 hover:text-white'
          }`}
          title={isFr ? "Recentrer le tracé complet (Fit Route)" : "Fit Route Bounds"}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-transform active:scale-95 cursor-pointer ${
            theme === 'light'
              ? 'bg-white/90 border-zinc-300 text-zinc-700 hover:bg-white hover:text-zinc-950'
              : 'bg-zinc-900/80 border-white/15 text-white/80 hover:bg-zinc-900 hover:text-white'
          }`}
          title={isFr ? "Zoom avant" : "Zoom in"}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-transform active:scale-95 cursor-pointer ${
            theme === 'light'
              ? 'bg-white/90 border-zinc-300 text-zinc-700 hover:bg-white hover:text-zinc-950'
              : 'bg-zinc-900/80 border-white/15 text-white/80 hover:bg-zinc-900 hover:text-white'
          }`}
          title={isFr ? "Zoom arrière" : "Zoom out"}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top Left Route Info Overlay Badge */}
      <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-md border shadow-lg pointer-events-none text-[10px] font-mono font-bold bg-zinc-950/75 border-white/10 text-white">
        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
        <span>{isFr ? 'TRACÉ GPS' : 'GPS ROUTE'} • {trip.route?.length || 0} PTS</span>
      </div>

      {/* Bottom Start/Finish Legend */}
      {hasRoute && (
        <div className="absolute bottom-2 left-2.5 z-[400] flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>A {isFr ? 'Début' : 'Start'}</span>
          </div>
          {trip.route.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-rose-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>B {isFr ? 'Fin' : 'End'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
