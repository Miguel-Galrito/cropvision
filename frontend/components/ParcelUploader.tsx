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
  PenTool,
} from 'lucide-react';
import { parseParcelFile } from '../lib/gis/parcelParser';
import { PRESET_LOCATIONS } from '../lib/presets';
import { Language, translations } from '../lib/i18n';

interface ParcelUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  theme?: 'dark' | 'light';
  onStartDrawing?: () => void;
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
  lang = 'pt',
  theme = 'dark',
  onStartDrawing,
  onSelectParcel,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

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
      setError(
        err.message ||
          (lang === 'en' ? 'Error processing field parcel file.' : 'Erro ao processar ficheiro de parcela.')
      );
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
      <div
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl p-6 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0b101b] border-slate-800 text-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base font-bold font-mono flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.uploaderTitle}
                <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                }`}>
                  GeoJSON / KML / Shapefile
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.uploaderSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
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
          className={`mt-5 border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive
              ? isLight
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-emerald-400 bg-emerald-950/20'
              : isLight
              ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/80'
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
          <div className={`p-3 rounded-full border mb-3 shadow-inner ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-emerald-600'
              : 'bg-slate-800 border-slate-700 text-emerald-400'
          }`}>
            <FileArchive className="w-7 h-7" />
          </div>
          <p className={`text-sm font-semibold text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isProcessing
              ? (lang === 'en' ? 'Processing geometry and geodesic area calculation...' : 'A processar geometria e cálculo de área...')
              : t.dragDropText}
          </p>
          <p className={`text-xs mt-1 text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.dragDropSub}
          </p>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.autoAreaCalc}</span>
          </div>
        </div>

        {/* Interactive Drawing Button */}
        {onStartDrawing && (
          <div className="mt-3.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDrawing();
              }}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border text-xs font-bold transition-all shadow-md group ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-800'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>{lang === 'en' ? '✏️ Draw New Parcel Directly on Map' : '✏️ Desenhar Novo Talhão Diretamente no Mapa'}</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className={`mt-5 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <p className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Layers className="w-3.5 h-3.5" />
            <span>{t.orLoadPreset}</span>
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
                className={`p-2 rounded-xl border text-left transition-all group ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-emerald-500'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="truncate">
                    <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.hectares} ha • {p.cropType}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
