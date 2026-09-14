'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker, Rectangle, TileLayer, Polygon as LeafletPolygon } from 'leaflet';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  MapPin,
  Crosshair,
  Eye,
  Radio,
  Sliders,
  AlertTriangle,
  Bug,
  Droplets,
  Sprout,
  X,
} from 'lucide-react';
import { ScoutingRecord } from '../lib/scouting/scoutingStore';

export type BasemapMode = 'satellite' | 'hybrid' | 'streets';
export type VisualOverlayMode = 'rgb' | 'ndvi' | 'sar' | 'ndre';

interface MapProps {
  lat: number;
  lon: number;
  zoom?: number;
  bbox?: [number, number, number, number] | null;
  polygon?: [number, number][] | null;
  scoutingRecords?: ScoutingRecord[];
  isScoutingModeActive?: boolean;
  onToggleScoutingMode?: () => void;
  onSelectCoordinate: (lat: number, lon: number) => void;
  onScoutCoordinateClick?: (lat: number, lon: number) => void;
  onDeleteScoutingRecord?: (id: string) => void;
  onCenterChange?: (centerLat: number, centerLon: number) => void;
  disabled?: boolean;
}

export const Map: React.FC<MapProps> = ({
  lat,
  lon,
  zoom = 14,
  bbox,
  polygon,
  scoutingRecords = [],
  isScoutingModeActive = false,
  onToggleScoutingMode,
  onSelectCoordinate,
  onScoutCoordinateClick,
  onDeleteScoutingRecord,
  onCenterChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const bboxRectRef = useRef<Rectangle | null>(null);
  const polygonLayerRef = useRef<LeafletPolygon | null>(null);
  const scoutingMarkersRef = useRef<Marker[]>([]);

  // Basemap and Visual Layer State
  const [basemap, setBasemap] = useState<BasemapMode>('satellite');
  const [visualMode, setVisualMode] = useState<VisualOverlayMode>('ndvi');
  const [ndviOpacity, setNdviOpacity] = useState<number>(65); // 0 to 100%

  const tileLayersRef = useRef<{
    satellite: TileLayer | null;
    hybridLabels: TileLayer | null;
    streets: TileLayer | null;
  }>({
    satellite: null,
    hybridLabels: null,
    streets: null,
  });

  // Callbacks refs to avoid stale closures in Leaflet events
  const onSelectCoordinateRef = useRef(onSelectCoordinate);
  onSelectCoordinateRef.current = onSelectCoordinate;

  const onScoutCoordinateClickRef = useRef(onScoutCoordinateClick);
  onScoutCoordinateClickRef.current = onScoutCoordinateClick;

  const isScoutingModeActiveRef = useRef(isScoutingModeActive);
  isScoutingModeActiveRef.current = isScoutingModeActive;

  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || mapInstanceRef.current || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: false,
      });

      // 1. Esri World Imagery (High-Resolution Satellite Layer) - DEFAULT
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);

      // 2. Hybrid Boundaries and Place Labels Overlay
      const hybridLabelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 19,
          opacity: 0.85,
        }
      );

      // 3. OpenStreetMap Streets Layer
      const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      });

      tileLayersRef.current = {
        satellite: satelliteLayer,
        hybridLabels: hybridLabelsLayer,
        streets: streetsLayer,
      };

      // Pulsing Main Coordinate Marker
      const pulseIcon = L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lon], {
        icon: pulseIcon,
        interactive: false,
      }).addTo(map);
      markerRef.current = marker;

      // Click listener: either Scouting Observation or Regular Target Selection
      map.on('click', (e) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLon = Number(e.latlng.lng.toFixed(6));

        if (isScoutingModeActiveRef.current && onScoutCoordinateClickRef.current) {
          onScoutCoordinateClickRef.current(clickedLat, clickedLon);
        } else {
          if (markerRef.current) {
            markerRef.current.setLatLng([clickedLat, clickedLon]);
          }
          if (onSelectCoordinateRef.current) {
            onSelectCoordinateRef.current(clickedLat, clickedLon);
          }
        }
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        if (onCenterChangeRef.current) {
          onCenterChangeRef.current(Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6)));
        }
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const { satellite, hybridLabels, streets } = tileLayersRef.current;

    // Remove all layers first
    if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
    if (hybridLabels && map.hasLayer(hybridLabels)) map.removeLayer(hybridLabels);
    if (streets && map.hasLayer(streets)) map.removeLayer(streets);

    if (basemap === 'satellite') {
      if (satellite) satellite.addTo(map);
    } else if (basemap === 'hybrid') {
      if (satellite) satellite.addTo(map);
      if (hybridLabels) hybridLabels.addTo(map);
    } else if (basemap === 'streets') {
      if (streets) streets.addTo(map);
    }
  }, [basemap]);

  // Update target marker position
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    }
  }, [lat, lon]);

  // Update Bounding Box
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (bboxRectRef.current) {
        map.removeLayer(bboxRectRef.current);
        bboxRectRef.current = null;
      }

      if (bbox && bbox.length === 4) {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const bounds: [[number, number], [number, number]] = [
          [minLat, minLon],
          [maxLat, maxLon],
        ];
        const rect = L.rectangle(bounds, {
          color: '#10b981',
          weight: 1.5,
          fillColor: '#10b981',
          fillOpacity: 0.12,
          dashArray: '4, 4',
          interactive: false,
        }).addTo(map);
        bboxRectRef.current = rect;
      }
    });
  }, [bbox]);

  // Update Parcel Polygon with Visual Overlay styling
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }

      if (polygon && polygon.length >= 3) {
        let strokeColor = '#10b981';
        let fillColor = '#10b981';

        if (visualMode === 'sar') {
          strokeColor = '#38bdf8'; // Sky blue for microwave radar
          fillColor = '#0284c7';
        } else if (visualMode === 'ndre') {
          strokeColor = '#2dd4bf'; // Teal for RedEdge
          fillColor = '#0d9488';
        } else if (visualMode === 'rgb') {
          strokeColor = '#f59e0b';
          fillColor = 'transparent';
        }

        const opacityDecimal = visualMode === 'rgb' ? 0.05 : (ndviOpacity / 100) * 0.45;

        const poly = L.polygon(polygon, {
          color: strokeColor,
          weight: 2.5,
          fillColor: fillColor,
          fillOpacity: opacityDecimal,
          dashArray: visualMode === 'rgb' ? '6, 6' : undefined,
          interactive: false,
        }).addTo(map);

        polygonLayerRef.current = poly;

        try {
          map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 16 });
        } catch {
          // ignore
        }
      }
    });
  }, [polygon, visualMode, ndviOpacity]);

  // Render Scouting Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      // Clear old scouting markers
      scoutingMarkersRef.current.forEach((m) => map.removeLayer(m));
      scoutingMarkersRef.current = [];

      scoutingRecords.forEach((record) => {
        let badgeColor = 'bg-amber-500 border-amber-300';
        let pulseColor = 'bg-amber-400';
        if (record.severity === 'critical') {
          badgeColor = 'bg-red-600 border-red-300';
          pulseColor = 'bg-red-500';
        } else if (record.severity === 'low') {
          badgeColor = 'bg-emerald-500 border-emerald-300';
          pulseColor = 'bg-emerald-400';
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center w-7 h-7 cursor-pointer">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75"></span>
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${badgeColor} border-2 text-white shadow-xl">
              <span class="text-[10px] font-black">!</span>
            </div>
          </div>
        `;

        const scoutIcon = L.divIcon({
          className: 'scouting-pin',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 4px; color: #0f172a;">
            <div style="font-weight: bold; font-size: 12px; color: ${
              record.severity === 'critical' ? '#dc2626' : '#d97706'
            }; text-transform: uppercase;">
              ${record.categoryLabel}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Data: ${record.date} | Gravidade: <strong>${record.severity.toUpperCase()}</strong>
            </div>
            <p style="font-size: 11px; margin-top: 6px; line-height: 1.3; color: #334155;">
              ${record.notes}
            </p>
          </div>
        `;

        const sm = L.marker([record.lat, record.lon], { icon: scoutIcon })
          .bindPopup(popupHtml)
          .addTo(map);

        scoutingMarkersRef.current.push(sm);
      });
    });
  }, [scoutingRecords]);

  return (
    <div className="relative w-full h-full select-none">
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${
          isScoutingModeActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* TOP-LEFT: Basemap Switcher Dock */}
      <div className="absolute top-4 left-4 z-10 flex items-center p-1 rounded-2xl bg-[#090d16]/90 border border-slate-800 shadow-xl backdrop-blur-md space-x-1 text-xs">
        <button
          onClick={() => setBasemap('satellite')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center space-x-1.5 ${
            basemap === 'satellite'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Satélite HD</span>
        </button>
        <button
          onClick={() => setBasemap('hybrid')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            basemap === 'hybrid'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Híbrido</span>
        </button>
        <button
          onClick={() => setBasemap('streets')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            basemap === 'streets'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Cartografia</span>
        </button>
      </div>

      {/* TOP-RIGHT: Scouting Mode & Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        {/* Scouting Mode Toggle Button */}
        {onToggleScoutingMode && (
          <button
            onClick={onToggleScoutingMode}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-xl flex items-center space-x-2 ${
              isScoutingModeActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 animate-pulse'
                : 'bg-[#090d16]/90 text-slate-200 border-slate-700 hover:border-amber-400/60 hover:text-white backdrop-blur-md'
            }`}
            title="Clique no mapa para registar pragas, fugas de rega ou clorose"
          >
            <Crosshair className="w-4 h-4" />
            <span>{isScoutingModeActive ? 'Modo Scouting Ativo (Clique no Mapa)' : 'Registar Ocorrência de Campo'}</span>
          </button>
        )}

        {/* Zoom In / Out */}
        <div className="flex flex-col rounded-2xl bg-[#090d16]/90 border border-slate-800 shadow-xl backdrop-blur-md overflow-hidden self-end">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800"
            title="Aproximar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Afastar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM WIDGET: Visual Mode & NDVI Layer Opacity Slider */}
      <div className="absolute bottom-6 left-4 z-10 p-3 rounded-2xl bg-[#090d16]/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-4 text-xs">
        {/* Visual Mode Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camada:</span>
          </span>
          <button
            onClick={() => setVisualMode('ndvi')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'ndvi'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NDVI Vigor
          </button>
          <button
            onClick={() => setVisualMode('ndre')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'ndre'
                ? 'bg-teal-950 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NDRE Azoto
          </button>
          <button
            onClick={() => setVisualMode('sar')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'sar'
                ? 'bg-sky-950 text-sky-300 border border-sky-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Radar SAR S1
          </button>
          <button
            onClick={() => setVisualMode('rgb')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'rgb'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            RGB Natural
          </button>
        </div>

        {/* Vertical Separator */}
        <div className="hidden sm:block h-5 w-px bg-slate-800" />

        {/* Opacity Slider */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Opacidade:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={ndviOpacity}
            onChange={(e) => setNdviOpacity(parseInt(e.target.value, 10))}
            className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[11px] font-mono text-emerald-400 w-8">{ndviOpacity}%</span>
        </div>
      </div>
    </div>
  );
};
