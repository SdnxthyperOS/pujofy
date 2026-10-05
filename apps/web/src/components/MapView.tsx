import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';

// Configure MapLibre Web Worker URL for Vite (dev, build, preview)
if (maplibreWorkerUrl) {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}
import { Pandal, PandalRecommendation } from '@pujofy/types';
import { DEFAULT_PANDAL_PHOTO, fetchRoute, RouteResponse } from '../services/api';
import { Navigation, Crosshair, Plus, Minus, X, AlertCircle, Loader2 } from 'lucide-react';

export interface MapViewProps {
  pandals: Pandal[];
  userLocation: { lat: number; lng: number };
  recommended?: PandalRecommendation | null;
  selectedPandal?: Pandal | null;
  activeRouteDestination?: Pandal | null;
  onSelectPandal: (pandal: Pandal) => void;
  onGoThere: (pandal: Pandal) => void;
  onClearRoute?: () => void;
  onReCenter: () => void;
  locationError?: string | null;
}

/**
 * Transforms Mapbox asset URLs (styles, sprites, glyphs, tileJSON) into
 * authenticated HTTP endpoints for MapLibre GL JS.
 */
export function transformMapboxUrl(url: string, token: string): string {
  if (!url || !token) return url;
  const cleanToken = token.trim();

  // If standard http(s) mapbox API url, append token if missing
  if (url.startsWith('https://api.mapbox.com') || url.startsWith('http://api.mapbox.com')) {
    if (!url.includes('access_token=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}access_token=${cleanToken}`;
    }
    return url;
  }

  // mapbox://styles/{owner}/{styleId}
  if (url.startsWith('mapbox://styles/')) {
    const stylePath = url.replace('mapbox://styles/', '');
    return `https://api.mapbox.com/styles/v1/${stylePath}?access_token=${cleanToken}`;
  }

  // mapbox://sprites/{owner}/{styleId}(@2x)?(.json|.png)?
  if (url.startsWith('mapbox://sprites/')) {
    const path = url.replace('mapbox://sprites/', '');
    const parts = path.split('/');
    const user = parts[0];
    const rest = parts.slice(1).join('/');
    const match = rest.match(/^([^@.]+)(@\d+x)?(\.(?:json|png))?$/);
    if (match) {
      const styleId = match[1];
      const scale = match[2] || '';
      const ext = match[3] || '';
      return `https://api.mapbox.com/styles/v1/${user}/${styleId}/sprite${scale}${ext}?access_token=${cleanToken}`;
    }
    return `https://api.mapbox.com/styles/v1/${path}?access_token=${cleanToken}`;
  }

  // mapbox://fonts/{fontstack}/{range}.pbf
  if (url.startsWith('mapbox://fonts/')) {
    const fontPath = url.replace('mapbox://fonts/', '');
    return `https://api.mapbox.com/fonts/v1/${fontPath}?access_token=${cleanToken}`;
  }

  // mapbox://{sourceId} -> TileJSON
  if (url.startsWith('mapbox://')) {
    const sourceId = url.replace('mapbox://', '');
    return `https://api.mapbox.com/v4/${sourceId}.json?secure&access_token=${cleanToken}`;
  }

  return url;
}

/**
 * Public MapLibre-compatible fallback style (OpenStreetMap/CARTO Voyager raster tiles)
 */
const PUBLIC_MAPLIBRE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-carto-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'osm-carto-tiles-layer',
      type: 'raster',
      source: 'osm-carto-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const MapView: React.FC<MapViewProps> = ({
  pandals,
  userLocation,
  recommended,
  selectedPandal: externalSelectedPandal,
  activeRouteDestination,
  onSelectPandal,
  onGoThere,
  onClearRoute,
  onReCenter,
  locationError,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const maplibreMapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pandalMarkersRef = useRef<maplibregl.Marker[]>([]);

  // State
  const [internalSelectedPandal, setInternalSelectedPandal] = useState<Pandal | null>(null);
  const [activeRoute, setActiveRoute] = useState<{
    pandal: Pandal;
    route: RouteResponse;
  } | null>(null);

  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const token =
    (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN ||
    (process.env as any)?.VITE_MAPBOX_ACCESS_TOKEN ||
    '';

  const selectedPandal = externalSelectedPandal ?? internalSelectedPandal;

  const currentRouteGeoJSONRef = useRef<GeoJSON.LineString | null>(null);

  // Initialize MapLibre GL JS Map Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;
    setMapError(null);

    // Verify WebGL availability
    if (!checkWebGLSupport()) {
      const err = 'WebGL is not supported or disabled in your browser environment.';
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[Pujofy Map] ${err}`);
      }
      setMapError(err);
      return;
    }

    const isTokenValid = Boolean(
      token &&
        typeof token === 'string' &&
        token.trim() !== '' &&
        token !== 'your_mapbox_access_token_here'
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Pujofy Map] Initializing MapLibre GL JS (Mapbox token available: ${isTokenValid})`);
    }

    const mapboxStyleUrl = isTokenValid
      ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1?access_token=${token.trim()}`
      : null;

    let mapInstance: maplibregl.Map | null = null;

    try {
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapboxStyleUrl || PUBLIC_MAPLIBRE_STYLE,
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        attributionControl: false,
        transformRequest: (url: string) => {
          if (isTokenValid) {
            const transformed = transformMapboxUrl(url, token.trim());
            return { url: transformed };
          }
          return { url };
        },
      });

      const onStyleReady = () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Pujofy Map] MapLibre style loaded successfully');
        }
        setMapLoaded(true);
        mapInstance?.resize();

        // If there is an active route in memory, re-render it on the style
        if (currentRouteGeoJSONRef.current) {
          renderRouteOnMap(currentRouteGeoJSONRef.current);
        }
      };

      mapInstance.on('load', onStyleReady);
      mapInstance.on('styledata', () => {
        if (currentRouteGeoJSONRef.current && mapInstance?.isStyleLoaded()) {
          renderRouteOnMap(currentRouteGeoJSONRef.current);
        }
      });

      mapInstance.on('error', (e: any) => {
        const errorMsg = e.error?.message || 'MapLibre rendering error';
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Pujofy Map] Runtime Error:', errorMsg, e);
        }

        // If Mapbox style fails with 401/403 or network issue, fallback to public MapLibre style
        if (
          mapboxStyleUrl &&
          (errorMsg.includes('401') ||
            errorMsg.includes('403') ||
            errorMsg.includes('Unauthorized') ||
            errorMsg.includes('Forbidden') ||
            errorMsg.includes('Failed to fetch'))
        ) {
          console.warn('[Pujofy Map] Mapbox token/style rejected, switching to public fallback style');
          setMapError(`Mapbox auth issue (${errorMsg}). Using fallback style.`);
          try {
            mapInstance?.setStyle(PUBLIC_MAPLIBRE_STYLE);
          } catch (styleErr) {
            console.error('[Pujofy Map] Fallback style error:', styleErr);
          }
        } else {
          setMapError(errorMsg);
        }
      });

      maplibreMapRef.current = mapInstance;
    } catch (err: any) {
      const initError = err?.message || 'Failed to instantiate MapLibre map';
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Pujofy Map] Initialization Exception:', err);
      }
      setMapError(initError);
    }

    // Trigger resize after mounting container
    const resizeTimer = setTimeout(() => {
      mapInstance?.resize();
    }, 150);

    const handleResize = () => {
      mapInstance?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (maplibreMapRef.current) {
        maplibreMapRef.current.remove();
        maplibreMapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // Update center when userLocation prop changes
  useEffect(() => {
    if (maplibreMapRef.current && mapLoaded) {
      maplibreMapRef.current.setCenter([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation, mapLoaded]);

  // Update User and Pandal Markers
  useEffect(() => {
    const map = maplibreMapRef.current;
    if (!map || !mapLoaded) return;

    // 1. User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const userEl = document.createElement('div');
    userEl.className = 'custom-user-marker';
    userEl.innerHTML = `<div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
      <div class="absolute w-8 h-8 bg-[#C59A62]/40 rounded-full animate-ping"></div>
      <div class="w-4 h-4 bg-[#3A2118] border-2 border-[#C59A62] rounded-full shadow-warm-md"></div>
    </div>`;

    userMarkerRef.current = new maplibregl.Marker({ element: userEl, anchor: 'center' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    // 2. Pandal Markers
    pandalMarkersRef.current.forEach((m) => m.remove());
    pandalMarkersRef.current = [];

    pandals.forEach((p) => {
      const isRecommended = recommended?.pandal.id === p.id;
      const isSelected = selectedPandal?.id === p.id;
      const pinColor = isRecommended ? '#C59A62' : isSelected ? '#3A2118' : '#B87352';
      const badgeText = isRecommended ? '★ Top Hop' : p.name.substring(0, 12);

      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none';
      el.innerHTML = `<div class="group relative flex flex-col items-center ${isSelected ? 'scale-125 z-30' : 'z-10'}">
        <div class="px-2 py-0.5 bg-[#3A2118] text-[#FFFDF9] text-[10px] font-bold rounded-full shadow-warm-md border whitespace-nowrap mb-1 transition-transform group-hover:scale-110" style="border-color: ${pinColor}">
          ${badgeText}
        </div>
        <div class="w-7 h-7 rounded-full bg-[#FFFDF9] border-2 flex items-center justify-center shadow-warm-md" style="border-color: ${pinColor}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${pinColor}" stroke="#3A2118" stroke-width="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>
      </div>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setInternalSelectedPandal(p);
        onSelectPandal(p);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);

      pandalMarkersRef.current.push(marker);
    });
  }, [pandals, recommended, selectedPandal, userLocation, mapLoaded, onSelectPandal]);

  // Route Fetching & MapLibre Layer Management
  const targetRoutePandal = activeRouteDestination ?? null;

  const removeRouteLayer = useCallback(() => {
    currentRouteGeoJSONRef.current = null;
    const map = maplibreMapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('route-line')) {
      map.removeLayer('route-line');
    }
    if (map.getLayer('route-line-casing')) {
      map.removeLayer('route-line-casing');
    }
    if (map.getSource('route-source')) {
      map.removeSource('route-source');
    }
  }, []);

  const renderRouteOnMap = useCallback((geojson: GeoJSON.LineString) => {
    const map = maplibreMapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: geojson,
      };

      const source = map.getSource('route-source') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(routeGeoJSON);
      } else {
        map.addSource('route-source', {
          type: 'geojson',
          data: routeGeoJSON,
        });
      }

      // Casing layer for crisp visual contrast against dark / light maps
      if (!map.getLayer('route-line-casing')) {
        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3A2118',
            'line-width': 8,
            'line-opacity': 0.85,
          },
        });
      }

      // Main festive gold walking route line
      if (!map.getLayer('route-line')) {
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#C59A62',
            'line-width': 5,
            'line-opacity': 1.0,
          },
        });
      }

      const coords = geojson.coordinates;
      if (coords && coords.length >= 2) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 600 });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
      map.once('styledata', apply);
    }
  }, []);

  useEffect(() => {
    if (!targetRoutePandal) {
      currentRouteGeoJSONRef.current = null;
      setActiveRoute(null);
      removeRouteLayer();
      return;
    }

    let isSubscribed = true;
    setIsLoadingRoute(true);
    setRouteError(null);

    // Prefer entrance coordinates for realistic pedestrian routing
    const destLat = targetRoutePandal.entranceLatitude ?? targetRoutePandal.latitude;
    const destLng = targetRoutePandal.entranceLongitude ?? targetRoutePandal.longitude;

    fetchRoute(
      userLocation.lat,
      userLocation.lng,
      destLat,
      destLng
    )
      .then((res) => {
        if (!isSubscribed) return;
        setIsLoadingRoute(false);
        setActiveRoute({ pandal: targetRoutePandal, route: res.data });

        const geojson = res.data.geometry;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Pujofy Route Debug] API response:', res.data);
          console.log('[Pujofy Route Debug] coordinates:', geojson?.coordinates?.length);
        }

        if (geojson && geojson.coordinates && geojson.coordinates.length >= 2) {
          currentRouteGeoJSONRef.current = geojson;
          renderRouteOnMap(geojson);
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setIsLoadingRoute(false);
        currentRouteGeoJSONRef.current = null;
        setActiveRoute(null);
        removeRouteLayer();
        setRouteError(err.message || 'Unable to find a feasible walking route to this pandal.');
      });

    return () => {
      isSubscribed = false;
    };
  }, [
    targetRoutePandal?.id,
    targetRoutePandal?.latitude,
    targetRoutePandal?.longitude,
    targetRoutePandal?.entranceLatitude,
    targetRoutePandal?.entranceLongitude,
    userLocation.lat,
    userLocation.lng,
    mapLoaded,
    renderRouteOnMap,
    removeRouteLayer,
  ]);

  // Controls Handlers
  const handleZoomIn = () => {
    maplibreMapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    maplibreMapRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    onReCenter();
    maplibreMapRef.current?.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      essential: true,
    });
  };

  const handleClearActiveRoute = () => {
    setActiveRoute(null);
    removeRouteLayer();
    if (onClearRoute) onClearRoute();
  };

  return (
    <div className="relative w-full h-[clamp(450px,calc(100vh-170px),880px)] min-h-[450px] rounded-3xl overflow-hidden border border-[#E9DED2] shadow-warm-md bg-[#FAF7F2]">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-0" />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-10 bg-[#FAF7F2]/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-[#3A2118]">
          <Loader2 className="w-8 h-8 text-[#C59A62] animate-spin" />
          <span className="text-xs font-semibold">Loading Map Engine...</span>
        </div>
      )}

      {/* Error Overlay */}
      {mapError && (
        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:max-w-md z-10 p-2.5 bg-[#FFFDF9]/95 backdrop-blur-sm border border-[#B87352] text-[#3A2118] text-xs rounded-2xl shadow-warm-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#B87352] shrink-0" />
            <span className="line-clamp-1">{mapError}</span>
          </div>
          <button onClick={() => setMapError(null)} className="p-1.5 text-[#B87352] min-h-[32px] min-w-[32px]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={handleRecenter}
          className="w-11 h-11 bg-[#FFFDF9] hover:bg-[#FAF7F2] text-[#3A2118] border border-[#E9DED2] rounded-full shadow-warm-md transition-all active:scale-95 flex items-center justify-center"
          title="Re-center location"
          aria-label="Re-center location"
        >
          <Crosshair className="w-5 h-5 text-[#B87352]" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-11 h-11 bg-[#FFFDF9] hover:bg-[#FAF7F2] text-[#3A2118] border border-[#E9DED2] rounded-full shadow-warm-md transition-all active:scale-95 flex items-center justify-center"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4 text-[#3A2118]" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-11 h-11 bg-[#FFFDF9] hover:bg-[#FAF7F2] text-[#3A2118] border border-[#E9DED2] rounded-full shadow-warm-md transition-all active:scale-95 flex items-center justify-center"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4 text-[#3A2118]" />
        </button>
      </div>

      {/* Location Error Notice */}
      {locationError && (
        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:max-w-md z-10 p-2.5 bg-[#FFFDF9]/95 backdrop-blur-sm border border-[#B87352] text-[#3A2118] text-xs rounded-2xl shadow-warm-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#B87352] shrink-0" />
          <span className="line-clamp-1">{locationError}</span>
        </div>
      )}

      {/* Active Route Distance & ETA Banner */}
      {activeRoute && (
        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:w-96 z-10 bg-[#3A2118] text-[#FFFDF9] border border-[#C59A62] p-3 rounded-2xl shadow-warm-sheet animate-fadeIn flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C59A62]/20 rounded-xl border border-[#C59A62]">
              <Navigation className="w-5 h-5 text-[#C59A62]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#C59A62] uppercase tracking-wider line-clamp-1">
                Walking Route to {activeRoute.pandal.name}
              </div>
              <div className="text-xs font-semibold flex items-center space-x-1.5 flex-wrap">
                <span>🚶 {(activeRoute.route.distanceMeters / 1000).toFixed(2)} km</span>
                <span>•</span>
                <span>⏱ ~{Math.round(activeRoute.route.durationSeconds / 60)} min</span>
                {activeRoute.route.detourRatio && (
                  <span className="text-[10px] bg-[#C59A62]/30 text-[#FFFDF9] px-1.5 py-0.5 rounded-full">
                    Detour ×{activeRoute.route.detourRatio}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClearActiveRoute}
            className="p-2 hover:bg-[#5A3426] rounded-full text-[#C59A62] transition"
            title="Clear Route"
            aria-label="Clear Route"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading Route Indicator */}
      {isLoadingRoute && (
        <div className="absolute top-4 left-4 z-10 px-3.5 py-2 bg-[#FFFDF9] border border-[#E9DED2] rounded-2xl shadow-warm-md flex items-center space-x-2 text-xs text-[#3A2118]">
          <Loader2 className="w-4 h-4 text-[#C59A62] animate-spin" />
          <span>Calculating walking route...</span>
        </div>
      )}

      {/* Route Error Notice */}
      {routeError && (
        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:max-w-md z-10 p-3 bg-[#FFFDF9] border border-[#B87352] text-[#3A2118] text-xs rounded-2xl shadow-warm-md flex items-center justify-between space-x-2">
          <span>{routeError}</span>
          <button onClick={() => setRouteError(null)} className="p-1 text-[#B87352] hover:text-[#3A2118] shrink-0" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Sheet / Floating Card Preview when pin is tapped */}
      {selectedPandal && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] p-4 shadow-warm-sheet animate-slideUp">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <img
                src={selectedPandal.imageUrl || DEFAULT_PANDAL_PHOTO}
                alt={selectedPandal.imageAlt || `Festive Durga Puja pandal at ${selectedPandal.name}`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PANDAL_PHOTO;
                }}
                className="w-14 h-14 rounded-2xl object-cover border border-[#E9DED2] bg-[#3A2118]"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B87352] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E9DED2]">
                  {selectedPandal.area || 'Puja Spot'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#3A2118] leading-tight">
                  {selectedPandal.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                setInternalSelectedPandal(null);
                onSelectPandal(null as any);
              }}
              className="text-[#7A665B] text-xs hover:text-[#3A2118] p-1.5 bg-[#FAF7F2] rounded-full w-7 h-7 flex items-center justify-center border border-[#E9DED2]"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-[#7A665B] line-clamp-2 mb-3">
            {selectedPandal.description}
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onGoThere(selectedPandal);
              }}
              className="flex-1 py-2.5 bg-[#3A2118] hover:bg-[#5A3426] text-[#FFFDF9] text-xs font-bold rounded-xl shadow-warm-sm flex items-center justify-center space-x-1.5 transition min-h-[40px]"
            >
              <Navigation className="w-3.5 h-3.5 text-[#C59A62]" />
              <span>GO THERE</span>
            </button>

            <button
              onClick={() => onSelectPandal(selectedPandal)}
              className="py-2.5 px-3 bg-[#E9DED2]/50 hover:bg-[#E9DED2] text-[#5A3426] text-xs font-semibold rounded-xl transition min-h-[40px]"
            >
              Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


