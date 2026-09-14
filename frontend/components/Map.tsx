'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker, Rectangle, TileLayer, Polygon as LeafletPolygon, LayerGroup } from 'leaflet';
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
  PenTool,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ScoutingRecord } from '../lib/scouting/scoutingStore';
import { Language, translations } from '../lib/i18n';
import { calculatePolygonAreaHectares, getPolygonCenter } from '../lib/gis/area';

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
  isDrawingModeActive?: boolean;
  onToggleDrawingMode?: () => void;
  onPolygonCreated?: (
    polygon: [number, number][],
    areaHectares: number,
    centerLat: number,
    centerLon: number
  ) => void;
  onSelectCoordinate: (lat: number, lon: number) => void;
  onScoutCoordinateClick?: (lat: number, lon: number) => void;
  onDeleteScoutingRecord?: (id: string) => void;
  onCenterChange?: (centerLat: number, centerLon: number) => void;
  lang?: Language;
  theme?: 'dark' | 'light';
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
  isDrawingModeActive = false,
  onToggleDrawingMode,
  onPolygonCreated,
  onSelectCoordinate,
  onScoutCoordinateClick,
  onDeleteScoutingRecord,
  onCenterChange,
  lang = 'pt',
  theme = 'dark',
}) => {
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const bboxRectRef = useRef<Rectangle | null>(null);
  const polygonLayerRef = useRef<LeafletPolygon | null>(null);
  const tempDrawGroupRef = useRef<LayerGroup | null>(null);
  const scoutingMarkersRef = useRef<Marker[]>([]);

  // Basemap and Visual Layer State
  const [basemap, setBasemap] = useState<BasemapMode>('satellite');
  const [visualMode, setVisualMode] = useState<VisualOverlayMode>('ndvi');
  const [ndviOpacity, setNdviOpacity] = useState<number>(65); // 0 to 100%

  // Drawing mode points
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const drawingPointsRef = useRef<[number, number][]>([]);
  drawingPointsRef.current = drawingPoints;

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

  const isDrawingModeActiveRef = useRef(isDrawingModeActive);
  isDrawingModeActiveRef.current = isDrawingModeActive;

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

      // Temporary Layer Group for polygon drawing
      tempDrawGroupRef.current = L.layerGroup().addTo(map);

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

      // Click listener: Drawing Mode, Scouting Mode, or Normal Target Selection
      map.on('click', (e) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLon = Number(e.latlng.lng.toFixed(6));

        if (isDrawingModeActiveRef.current) {
          // In Drawing Mode: Add point to polygon vertices
          const current = drawingPointsRef.current;
          const next = [...current, [clickedLat, clickedLon] as [number, number]];
          setDrawingPoints(next);
        } else if (isScoutingModeActiveRef.current && onScoutCoordinateClickRef.current) {
          // In Scouting Mode: Register observation pin
          onScoutCoordinateClickRef.current(clickedLat, clickedLon);
        } else {
          // Normal mode: update centroid and re-analyze
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

  // Update Active Parcel Polygon
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
          strokeColor = '#38bdf8';
          fillColor = '#0284c7';
        } else if (visualMode === 'ndre') {
          strokeColor = '#2dd4bf';
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

  // Render Temporary Interactive Drawing Points & Polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !tempDrawGroupRef.current) return;
    const group = tempDrawGroupRef.current;
    group.clearLayers();

    if (!isDrawingModeActive || drawingPoints.length === 0) return;

    import('leaflet').then((L) => {
      // Draw vertex markers
      drawingPoints.forEach(([pLat, pLon], idx) => {
        const dot = L.circleMarker([pLat, pLon], {
          radius: 5,
          fillColor: idx === 0 ? '#f59e0b' : '#10b981',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 2,
        });
        group.addLayer(dot);
      });

      // Draw polyline connecting vertices
      if (drawingPoints.length >= 2) {
        const polyline = L.polyline(drawingPoints, {
          color: '#10b981',
          weight: 3,
          dashArray: '5, 5',
        });
        group.addLayer(polyline);
      }

      // Draw semi-transparent polygon fill if 3+ vertices
      if (drawingPoints.length >= 3) {
        const tempPoly = L.polygon(drawingPoints, {
          color: '#34d399',
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.25,
        });
        group.addLayer(tempPoly);
      }
    });
  }, [isDrawingModeActive, drawingPoints]);

  // Render Scouting Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
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

  // Finish polygon drawing
  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) return;

    const areaHa = calculatePolygonAreaHectares(drawingPoints);
    const center = getPolygonCenter(drawingPoints);

    if (onPolygonCreated) {
      onPolygonCreated(drawingPoints, areaHa, center[0], center[1]);
    }

    setDrawingPoints([]);
    if (onToggleDrawingMode) {
      onToggleDrawingMode();
    }
  };

  const handleUndoPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    if (onToggleDrawingMode) {
      onToggleDrawingMode();
    }
  };

  const currentAreaHa =
    drawingPoints.length >= 3 ? calculatePolygonAreaHectares(drawingPoints) : 0;

  return (
    <div className="relative w-full h-full select-none">
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${
          isDrawingModeActive
            ? 'cursor-crosshair'
            : isScoutingModeActive
            ? 'cursor-crosshair'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* FLOATING TOP-CENTER TOOLBAR: Interactive Polygon Drawing Mode */}
      {isDrawingModeActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 p-2 px-3.5 rounded-2xl bg-[#090d16]/95 border border-emerald-500/70 shadow-2xl backdrop-blur-md text-xs animate-in fade-in slide-in-from-top-4 duration-150">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold pr-2 border-r border-slate-700">
            <PenTool className="w-4 h-4 animate-bounce text-emerald-400" />
            <span>
              {lang === 'en' ? 'Drawing Field Boundary' : 'A Desenhar Parcela'}:{' '}
              <strong className="text-white">{drawingPoints.length}</strong> {lang === 'en' ? 'vertices' : 'vértices'}
              {currentAreaHa > 0 && ` (${currentAreaHa} ha)`}
            </span>
          </div>

          <button
            onClick={handleFinishDrawing}
            disabled={drawingPoints.length < 3}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
              drawingPoints.length >= 3
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t.finishDrawing}</span>
          </button>

          <button
            onClick={handleUndoPoint}
            disabled={drawingPoints.length === 0}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            title={t.undoPoint}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCancelDrawing}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.cancelDrawing}</span>
          </button>
        </div>
      )}

      {/* TOP-LEFT: Basemap Switcher Dock */}
      <div
        className={`absolute top-4 left-4 z-10 flex items-center p-1 rounded-2xl border shadow-xl backdrop-blur-md space-x-1 text-xs transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-[#090d16]/90 border-slate-800 text-slate-200'
        }`}
      >
        <button
          onClick={() => setBasemap('satellite')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            basemap === 'satellite'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>{t.basemapSat}</span>
        </button>
        <button
          onClick={() => setBasemap('hybrid')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            basemap === 'hybrid'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>{t.basemapHybrid}</span>
        </button>
        <button
          onClick={() => setBasemap('streets')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
            basemap === 'streets'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>{t.basemapStreets}</span>
        </button>
      </div>

      {/* TOP-RIGHT: Drawing, Scouting & Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        {/* Draw Polygon Toggle Button */}
        {onToggleDrawingMode && !isDrawingModeActive && (
          <button
            onClick={onToggleDrawingMode}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-xl flex items-center space-x-2 ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-emerald-500'
                : 'bg-[#090d16]/90 text-slate-200 border-slate-700 hover:border-emerald-400/60 hover:text-white backdrop-blur-md'
            }`}
            title={lang === 'en' ? 'Click points on the map to trace your field' : 'Clique no mapa para traçar os limites do talhão'}
          >
            <PenTool className="w-4 h-4 text-emerald-400" />
            <span>{t.drawParcel}</span>
          </button>
        )}

        {/* Scouting Mode Toggle Button */}
        {onToggleScoutingMode && !isDrawingModeActive && (
          <button
            onClick={onToggleScoutingMode}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-xl flex items-center space-x-2 ${
              isScoutingModeActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30 animate-pulse'
                : isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-amber-500'
                : 'bg-[#090d16]/90 text-slate-200 border-slate-700 hover:border-amber-400/60 hover:text-white backdrop-blur-md'
            }`}
            title={lang === 'en' ? 'Click on map to register pest, leak or chlorosis' : 'Clique no mapa para registar pragas, fugas de rega ou clorose'}
          >
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span>{isScoutingModeActive ? t.scoutingBtnActive : t.scoutingBtnStart}</span>
          </button>
        )}

        {/* Zoom In / Out */}
        <div
          className={`flex flex-col rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden self-end ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#090d16]/90 border-slate-800 text-slate-300'
          }`}
        >
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className={`p-2.5 transition-colors border-b ${
              isLight
                ? 'hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'hover:text-white hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={t.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className={`p-2.5 transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:text-white hover:bg-slate-800 text-slate-300'
            }`}
            title={t.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM WIDGET: Visual Mode & NDVI Layer Opacity Slider */}
      <div
        className={`absolute bottom-36 sm:bottom-6 left-3 sm:left-4 z-20 p-2.5 sm:p-3 max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs transition-colors overflow-x-auto no-scrollbar ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-[#090d16]/95 border-slate-800 text-slate-200'
        }`}
      >
        {/* Visual Mode Selector */}
        <div className="flex items-center space-x-1">
          <span
            className={`text-[11px] font-semibold mr-1 flex items-center gap-1 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.layerLabel}</span>
          </span>
          <button
            onClick={() => setVisualMode('ndvi')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'ndvi'
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.layerNdvi}
          </button>
          <button
            onClick={() => setVisualMode('ndre')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'ndre'
                ? isLight
                  ? 'bg-teal-100 text-teal-800 border border-teal-400'
                  : 'bg-teal-950 text-teal-300 border border-teal-500/50'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.layerNdre}
          </button>
          <button
            onClick={() => setVisualMode('sar')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'sar'
                ? isLight
                  ? 'bg-sky-100 text-sky-800 border border-sky-400'
                  : 'bg-sky-950 text-sky-300 border border-sky-500/50'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.layerSar}
          </button>
          <button
            onClick={() => setVisualMode('rgb')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              visualMode === 'rgb'
                ? isLight
                  ? 'bg-amber-100 text-amber-800 border border-amber-400'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.layerRgb}
          </button>
        </div>

        {/* Vertical Separator */}
        <div className={`hidden sm:block h-5 w-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

        {/* Opacity Slider */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <Sliders className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'} shrink-0`} />
          <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.opacity}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={ndviOpacity}
            onChange={(e) => setNdviOpacity(parseInt(e.target.value, 10))}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[11px] font-mono text-emerald-500 font-bold w-8">{ndviOpacity}%</span>
        </div>
      </div>
    </div>
  );
};
