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
  Layers,
  FileArchive,
} from 'lucide-react';
import { parseParcelFile } from '../lib/gis/parcelParser';
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

export const ParcelUploader: React.FC<ParcelUploaderProps> = ({
  isOpen,
  onClose,
  onSelectParcel,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const result = await parseParcelFile(file);
      onSelectParcel(
        result.polygon,
        result.center[0],
        result.center[1],
        result.areaHectares,
        result.name
      );
      onClose();
    } catch (err: any) {
      console.error('File import error:', err);
      setError(err.message || 'Erro ao processar ficheiro de parcela.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b101b] border border-slate-800 shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                IMPORTAR LIMITES DE PARCELA (SIG)
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  Shapefile / GeoJSON / KML
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Carregue o polígono cadastral para calibrar prescrição VRA e área em hectares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-400 bg-emerald-950/20'
              : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.shp,.geojson,.json,.kml"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 mb-3 shadow-inner">
            <FileArchive className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white text-center">
            {isProcessing ? 'A processar geometria e cálculo de área...' : 'Arraste o seu ficheiro de talhão para aqui'}
          </p>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Suporta <span className="text-emerald-300 font-mono">.ZIP</span> contendo Shapefiles (.shp, .shx, .dbf), <span className="text-emerald-300 font-mono">.GEOJSON</span> e <span className="text-emerald-300 font-mono">.KML</span>
          </p>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cálculo automático de área em Hectares (ha) e centralização de câmara</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets for Demo */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Ou carregue um exemplo de parcela cadastrada de referência:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_LOCATIONS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.polygon) {
                    onSelectParcel(
                      p.polygon as [number, number][],
                      p.lat,
                      p.lon,
                      p.hectares || 28.5,
                      p.name
                    );
                    onClose();
                  }
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                  <span>{p.region}</span>
                  <span className="text-emerald-400 font-semibold">{p.hectares || 28.5} ha</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
