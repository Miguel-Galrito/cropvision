'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  MapPin,
  Sparkles,
  Download,
} from 'lucide-react';
import { PRESET_LOCATIONS } from '../lib/presets';

interface ParcelUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParcel: (
    polygon: [number, number][],
    centerLat: number,
    centerLon: number,
    areaHectares: number,
    name: string
  ) => void;
}

/**
 * Calculates geodesic area in hectares for an array of [lat, lon] coordinates.
 */
function computePolygonAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 25.0;
  const radius = 6378137; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const lon1 = (coords[i][1] * Math.PI) / 180;
    const lon2 = (coords[j][1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * radius * radius) / 2.0);
  const hectares = area / 10000;
  return Number(Math.max(1.0, hectares).toFixed(1));
}

export const ParcelUploader: React.FC<ParcelUploaderProps> = ({
  isOpen,
  onClose,
  onSelectParcel,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessGeoJson = (content: string, filename: string) => {
    try {
      const parsed = JSON.parse(content);
      let rawCoords: any[] = [];
      let fieldName = filename.replace(/\.[^/.]+$/, '');

      if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
        const feat = parsed.features[0];
        if (feat.properties?.name) fieldName = feat.properties.name;
        if (feat.geometry?.type === 'Polygon') {
          rawCoords = feat.geometry.coordinates[0];
        } else if (feat.geometry?.type === 'MultiPolygon') {
          rawCoords = feat.geometry.coordinates[0][0];
        }
      } else if (parsed.type === 'Feature') {
        if (parsed.properties?.name) fieldName = parsed.properties.name;
        if (parsed.geometry?.type === 'Polygon') {
          rawCoords = parsed.geometry.coordinates[0];
        }
      } else if (parsed.type === 'Polygon') {
        rawCoords = parsed.coordinates[0];
      }

      if (!rawCoords || rawCoords.length < 3) {
        throw new Error('O ficheiro GeoJSON não contém um polígono de parcela válido com pelo menos 3 vértices.');
      }

      // In GeoJSON coordinates are [lon, lat]. Convert to Leaflet [lat, lon]
      const polygon: [number, number][] = rawCoords.map((pt) => [pt[1], pt[0]]);
      const avgLat = polygon.reduce((acc, p) => acc + p[0], 0) / polygon.length;
      const avgLon = polygon.reduce((acc, p) => acc + p[1], 0) / polygon.length;
      const ha = computePolygonAreaHa(polygon);

      onSelectParcel(polygon, avgLat, avgLon, ha, fieldName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar ficheiro GeoJSON.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessGeoJson(content, file.name);
    };
    reader.onerror = () => {
      setError('Erro ao ler o ficheiro local.');
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const sample = {
      type: 'FeatureCollection',
      name: 'Exemplo_Talhao_Vinha_Alentejo',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Talhão A1 - Syrah & Touriga',
            crop: 'Vinha',
            cultivar: 'Touriga Nacional',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-7.5550, 38.3880],
                [-7.5450, 38.3890],
                [-7.5440, 38.3810],
                [-7.5560, 38.3800],
                [-7.5550, 38.3880],
              ],
            ],
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cropvision_parcela_exemplo.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Carregar Parcela Agrícola (Polígono GeoJSON / KML)
            </h2>
            <p className="text-xs text-slate-400">
              Delimite a sua propriedade com precisão submétrica para telemetria SAR e prescrição de azoto.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const content = event.target?.result as string;
                handleProcessGeoJson(content, file.name);
              };
              reader.readAsText(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json,.kml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <FileCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-80" />
          <p className="text-sm font-semibold text-slate-200">
            Arraste o ficheiro .geojson ou clique para selecionar
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Formatos suportados: GeoJSON (WGS84 EPSG:4326), KML de SIG/CAD
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
          <span>Ainda não tem o polígono da sua quinta?</span>
          <button
            onClick={handleDownloadTemplate}
            className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 underline font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descarregar GeoJSON Exemplo</span>
          </button>
        </div>

        {/* Preset Plots Quick Pick */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ou escolha uma grande herdade de demonstração:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_LOCATIONS.filter((p) => p.polygon).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  if (preset.polygon) {
                    onSelectParcel(
                      preset.polygon as [number, number][],
                      preset.lat,
                      preset.lon,
                      preset.hectares || 45.0,
                      preset.name
                    );
                    onClose();
                  }
                }}
                className="flex items-start p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 mr-2" />
                <div>
                  <div className="text-xs font-bold text-slate-200">{preset.name}</div>
                  <div className="text-[11px] text-slate-400">{preset.region} • {preset.hectares} ha</div>
                  <div className="text-[10px] text-emerald-400/80">{preset.cropType}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
