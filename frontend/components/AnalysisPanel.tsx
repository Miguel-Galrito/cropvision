'use client';

import React, { useState } from 'react';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
} from '../lib/types';
import {
  Activity,
  Calendar,
  Cloud,
  Download,
  Eye,
  Info,
  Layers,
  MapPin,
  Maximize2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';

interface AnalysisPanelProps {
  data: AnalyzeResponse;
  timeseries: TimeSeriesPoint[] | null;
  onClose?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  data,
  timeseries,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ndvi' | 'true_color'>('ndvi');

  // NDVI score clamped between -1.0 and 1.0
  const ndviScore = data.ndvi.mean;
  // Percentage for progress bar (mapping 0.0 -> 0%, 1.0 -> 100%)
  const percentageScore = Math.max(0, Math.min(100, Math.round(ndviScore * 100)));

  // Color theme based on category
  const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-700/60',
    },
    green: {
      bg: 'bg-green-950/80',
      text: 'text-green-300',
      border: 'border-green-700/60',
    },
    amber: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-700/60',
    },
    stone: {
      bg: 'bg-stone-900/80',
      text: 'text-stone-300',
      border: 'border-stone-700/60',
    },
    sky: {
      bg: 'bg-sky-950/80',
      text: 'text-sky-300',
      border: 'border-sky-700/60',
    },
  };

  const currentTheme =
    badgeColors[data.interpretation.badge_color] || badgeColors.emerald;

  // Export JSON analysis report
  const handleExportJson = () => {
    const report = {
      title: 'SatHealth - Relatório de Análise de Vegetação (Sentinel-2)',
      exported_at: new Date().toISOString(),
      analysis: data,
      timeseries: timeseries,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sathealth-report-${data.scene_id.slice(0, 15)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md rounded-2xl glass-panel border border-slate-700/70 shadow-2xl p-5 overflow-y-auto max-h-[88vh] scrollbar-thin">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}
            >
              {data.interpretation.label}
            </span>
            {data.is_simulated && (
              <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full">
                Modo Offline Calibrado
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white mt-1.5 flex items-center">
            Diagnóstico de Vigor Vegetal
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Score Gauge */}
      <div className="my-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">NDVI Médio Zonal</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {ndviScore.toFixed(3)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 1.00</span>
          </div>
        </div>

        {/* Color Spectrum Progress Bar */}
        <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(5, percentageScore)}%`,
              background:
                'linear-gradient(90deg, #b91c1c 0%, #d97706 30%, #eab308 50%, #84cc16 70%, #10b981 100%)',
            }}
          />
        </div>

        {/* Spectrum Scale Labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
          <span>0.0 (Solo)</span>
          <span>0.3 (Stress)</span>
          <span>0.6 (Bom)</span>
          <span>0.9+ (Lush)</span>
        </div>

        {/* Description & Agronomic Recommendation */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {data.interpretation.description}
        </p>
        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 leading-snug">
          <span className="font-semibold text-emerald-200">Recomendação Agronómica: </span>
          {data.interpretation.recommendation}
        </div>
      </div>

      {/* Satellite Imagery Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Visualização de Satélite</span>
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('ndvi')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'ndvi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Heatmap NDVI
            </button>
            {data.true_color_thumbnail && (
              <button
                onClick={() => setActiveTab('true_color')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'true_color'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cor Verdadeira
              </button>
            )}
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
          {activeTab === 'ndvi' ? (
            <img
              src={data.thumbnail_url}
              alt="Mapa de calor NDVI gerado via rasterio/numpy"
              className="w-full h-full object-cover"
            />
          ) : data.true_color_thumbnail ? (
            <img
              src={data.true_color_thumbnail}
              alt="Imagem de satélite Sentinel-2 em cor verdadeira"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-slate-500">Miniatura indisponível</div>
          )}

          {/* Colormap Legend Overlay */}
          {activeTab === 'ndvi' && (
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] flex items-center justify-between text-slate-300">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-600 mr-1" /> Solo / Seco
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1" /> Médio
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Vigoroso
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Zonal Statistics Breakdown */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">Estatísticas Zonais da Parcela</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Mínimo</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {data.ndvi.min.toFixed(3)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Mediana</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {data.ndvi.median.toFixed(3)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Máximo</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {data.ndvi.max.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
          <span>Homogeneidade (Desvio Padrão):</span>
          <span className="font-mono font-semibold text-slate-300">±{data.ndvi.std.toFixed(3)}</span>
        </div>
      </div>

      {/* Metadata Accordion */}
      <div className="mb-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Satélite & Sensor:</span>
          <span className="text-slate-200 font-medium">{data.platform} (L2A BOA)</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Data de Aquisição:</span>
          <span className="text-slate-200 font-mono">
            {data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Cobertura de Nuvens:</span>
          <span className="text-emerald-400 font-semibold">{data.cloud_cover_percentage}%</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Resolução Espacial:</span>
          <span className="text-slate-200">{data.resolution_meters}m / pixel</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Tempo de Processamento:</span>
          <span className="text-slate-200 font-mono">{data.processing_time_ms} ms</span>
        </div>
        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
          <span className="truncate max-w-[150px]" title={data.scene_id}>
            ID: {data.scene_id}
          </span>
          <span className="text-slate-500 font-mono">
            {data.pixels_analyzed} pixels
          </span>
        </div>
      </div>

      {/* Historical Time-Series Chart */}
      {timeseries && timeseries.length > 0 && (
        <TimeSeriesChart series={timeseries} />
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={handleExportJson}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Exportar Relatório</span>
        </button>

        <span className="text-[10px] text-slate-500 font-mono">
          SatHealth v1.0
        </span>
      </div>
    </div>
  );
};
