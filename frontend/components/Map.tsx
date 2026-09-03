'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker, Rectangle, TileLayer } from 'leaflet';
import { Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface MapProps {
  lat: number;
  lon: number;
  zoom?: number;
  bbox?: [number, number, number, number] | null;
  onSelectCoordinate: (lat: number, lon: number) => void;
  disabled?: boolean;
}

export const Map: React.FC<MapProps> = ({
  lat,
  lon,
  zoom = 13,
  bbox,
  onSelectCoordinate,
  disabled = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const bboxRectRef = useRef<Rectangle | null>(null);
  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const baseLayersRef = useRef<{ streets: TileLayer | null; satellite: TileLayer | null }>({
    streets: null,
    satellite: null,
  });

  useEffect(() => {
    // Dynamically import Leaflet only on client
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || mapInstanceRef.current || !mapContainerRef.current) return;

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: zoom,
        zoomControl: false,
      });

      // Standard OpenStreetMap Tile Layer (Free, no API key required, no watermark)
      const streetsLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      ).addTo(map);

      // Esri World Imagery (High-Resolution Satellite Layer)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
          maxZoom: 18,
        }
      );

      baseLayersRef.current = { streets: streetsLayer, satellite: satelliteLayer };

      // Pulsing Marker Icon
      const pulseIcon = L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
          <div class="pulse"></div>
          <div class="pin"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);
      markerRef.current = marker;

      // Click listener on map to select new coordinate
      map.on('click', (e) => {
        if (!disabled) {
          const clickedLat = Number(e.latlng.lat.toFixed(6));
          const clickedLon = Number(e.latlng.lng.toFixed(6));
          onSelectCoordinate(clickedLat, clickedLon);
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

  // Update map center & marker when lat/lon changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      map.flyTo([lat, lon], zoom, {
        duration: 1.0,
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }

      // Update Bounding Box Rectangle if available
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
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.18,
          dashArray: '4, 4',
        }).addTo(map);

        bboxRectRef.current = rect;
      }
    });
  }, [lat, lon, zoom, bbox]);

  // Toggle Basemap (Streets vs Satellite)
  const toggleBasemap = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const { streets, satellite } = baseLayersRef.current;

    if (activeLayer === 'streets') {
      if (streets) map.removeLayer(streets);
      if (satellite) satellite.addTo(map);
      setActiveLayer('satellite');
    } else {
      if (satellite) map.removeLayer(satellite);
      if (streets) streets.addTo(map);
      setActiveLayer('streets');
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full">
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
        {/* Layer Switcher (Streets vs Satellite) */}
        <button
          onClick={toggleBasemap}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-900 shadow-xl transition-all"
          title="Toggle vector street map and high-resolution satellite imagery"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="capitalize hidden sm:inline">
            {activeLayer === 'streets' ? 'Satellite View' : 'Street Map'}
          </span>
        </button>

        {/* Zoom In / Out Controls */}
        <div className="flex flex-col rounded-xl overflow-hidden bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border-b border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Crosshair target helper */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden md:block">
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400">
          Click anywhere on the map to analyze NDVI with Copernicus Sentinel-2
        </div>
      </div>
    </div>
  );
};
