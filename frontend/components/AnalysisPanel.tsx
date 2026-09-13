'use client';

import React, { useState, useEffect } from 'react';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
} from '../lib/types';
import {
  Download,
  FileText,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Satellite,
  Sparkles,
  Layers,
  Info,
  Radio,
  FileSpreadsheet,
  Droplets,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';
import {
  exportIsobusGeoJson,
  exportPrescriptionCsv,
} from '../lib/prescription';

interface AnalysisPanelProps {
  data: AnalyzeResponse;
  timeseries: TimeSeriesPoint[] | null;
  onClose?: () => void;
  onRequestPdfProUpgrade?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  data,
  timeseries,
  onClose,
  onRequestPdfProUpgrade,
}) => {
  const [modeTab, setModeTab] = useState<'optical' | 'sar' | 'prescription'>('optical');
  const [activeTab, setActiveTab] = useState<'ndvi' | 'true_color'>('ndvi');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [tcImgError, setTcImgError] = useState<boolean>(false);

  // Reset image error state when scene changes
  useEffect(() => {
    setTcImgError(false);
  }, [data.scene_id]);

  // NDVI score clamped between -1.0 and 1.0
  const ndviScore = data.ndvi.mean;
  // Percentage for progress bar (mapping 0.0 -> 0%, 1.0 -> 100%)
  const percentageScore = Math.max(0, Math.min(100, Math.round(ndviScore * 100)));

  // Color theme based on category
  const badgeColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-500/50',
      glow: 'shadow-emerald-500/20',
    },
    green: {
      bg: 'bg-green-950/80',
      text: 'text-green-300',
      border: 'border-green-500/50',
      glow: 'shadow-green-500/20',
    },
    amber: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-500/50',
      glow: 'shadow-amber-500/20',
    },
    stone: {
      bg: 'bg-stone-900/80',
      text: 'text-stone-300',
      border: 'border-stone-600/50',
      glow: 'shadow-stone-500/20',
    },
    sky: {
      bg: 'bg-sky-950/80',
      text: 'text-sky-300',
      border: 'border-sky-500/50',
      glow: 'shadow-sky-500/20',
    },
  };

  const currentTheme =
    badgeColors[data.interpretation.badge_color] || badgeColors.emerald;

  // Export ISO-BUS GeoJSON for tractors
  const handleExportIsobus = () => {
    if (data.prescription_map) {
      exportIsobusGeoJson(
        data.prescription_map,
        data.coordinates.lat,
        data.coordinates.lon
      );
    }
    setShowExportMenu(false);
  };

  // Export CSV rate sheet for tractors
  const handleExportCsv = () => {
    if (data.prescription_map) {
      exportPrescriptionCsv(data.prescription_map);
    }
    setShowExportMenu(false);
  };

  // Export Clean Human-Readable Text Report
  const handleExportTextReport = () => {
    const latStr = data.coordinates.lat >= 0 ? `${data.coordinates.lat.toFixed(4)}° N` : `${Math.abs(data.coordinates.lat).toFixed(4)}° S`;
    const lonStr = data.coordinates.lon >= 0 ? `${data.coordinates.lon.toFixed(4)}° E` : `${Math.abs(data.coordinates.lon).toFixed(4)}° W`;
    const locationStr = data.location_name ? `Location / City:     ${data.location_name}\n` : '';

    let timeSeriesTable = 'No historical orbital passes available.';
    if (timeseries && timeseries.length > 0) {
      timeSeriesTable = timeseries
        .map(
          (t) =>
            `| ${t.date.padEnd(12)} | ${t.scene_id.padEnd(28)} | ${t.ndvi_mean.toFixed(3).padStart(9)} | ${(t.cloud_cover + '%').padStart(11)} |`
        )
        .join('\n');
    }

    const sarTelemetry = data.sar_radar
      ? `--------------------------------------------------------------------------------
SENTINEL-1 SAR RADAR TELEMETRY (C-BAND 5.4 GHz)
--------------------------------------------------------------------------------
Sensor:              ${data.sar_radar.satellite}
Acquisition Mode:    ${data.sar_radar.mode}
Polarization:        ${data.sar_radar.polarization}
Backscatter VV:      ${data.sar_radar.backscatter_vv_db} dB
Backscatter VH:      ${data.sar_radar.backscatter_vh_db} dB
Cross-Ratio (VH/VV): ${data.sar_radar.cross_ratio_vh_vv} dB
Soil Moisture:       ${data.sar_radar.soil_moisture_estimate_pct}% Volumetric
Cloud Penetration:   ${data.sar_radar.penetration_status} (100% All-Weather Verified)
`
      : '';

    const textContent = `================================================================================
CROPVISION SAAS - SATELLITE VEGETATION HEALTH & SAR RADAR REPORT
Agricultural Earth Observation, Radar Soil Moisture & VRA Tractor Prescriptions
================================================================================
Generated At:        ${new Date().toUTCString()}
${locationStr}Target Coordinates:  ${latStr}, ${lonStr}
Satellite Platform:  ${data.platform} (Level-2A Bottom-of-Atmosphere)
Scene Granule ID:    ${data.scene_id}
Acquisition Date:    ${data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC
Cloud Coverage:      ${data.cloud_cover_percentage}%
Spatial Resolution:  ${data.resolution_meters}m per pixel
Sampled Area:        ${data.pixels_analyzed} pixels (~${(data.pixels_analyzed / 100).toFixed(1)} hectares)

--------------------------------------------------------------------------------
CANOPY HEALTH DIAGNOSIS
--------------------------------------------------------------------------------
Agronomic Status:    ${data.interpretation.label.toUpperCase()}
Mean Zonal NDVI:     ${data.ndvi.mean.toFixed(3)} (Scale: -1.0 to 1.0)

Condition Assessment:
${data.interpretation.description}

Actionable Recommendation:
${data.interpretation.recommendation}

${sarTelemetry}--------------------------------------------------------------------------------
ZONAL STATISTICAL METRICS
--------------------------------------------------------------------------------
- Minimum NDVI Value:           ${data.ndvi.min.toFixed(3)}
- 25th Percentile (P25):        ${data.ndvi.p25.toFixed(3)}
- Median NDVI Value:            ${data.ndvi.median.toFixed(3)}
- 75th Percentile (P75):        ${data.ndvi.p75.toFixed(3)}
- Maximum NDVI Value:           ${data.ndvi.max.toFixed(3)}
- Canopy Homogeneity (Std Dev): ±${data.ndvi.std.toFixed(3)}

--------------------------------------------------------------------------------
HISTORICAL ORBITAL TIME-SERIES
--------------------------------------------------------------------------------
| Date         | Scene Identifier             | Mean NDVI | Cloud Cover |
|--------------|------------------------------|-----------|-------------|
${timeSeriesTable}

===============================================================================
CropVision SaaS - Precision Agriculture Earth Observation Intelligence
Official Portal: https://whop.com/cropvision/
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropvision-report-${data.scene_id.slice(0, 18)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export Clean Structured JSON Report
  const handleExportJson = () => {
    const cleanAnalysis = {
      ...data,
      thumbnail_url: '[PNG Heatmap available in web interface]',
    };

    const report = {
      title: 'CropVision SaaS - Satellite Vegetation Analysis Report (Sentinel-2 & Sentinel-1)',
      exported_at: new Date().toISOString(),
      location: data.location_name || null,
      analysis: cleanAnalysis,
      timeseries: timeseries,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropvision-data-${data.scene_id.slice(0, 18)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export Print / Save as PDF
  const handlePrintPdf = () => {
    setShowExportMenu(false);
    if (onRequestPdfProUpgrade) {
      onRequestPdfProUpgrade();
    } else {
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }, 150);
    }
  };

  const handleDirectPrint = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 150);
  };

  const latFormatted = data.coordinates.lat >= 0 ? `${data.coordinates.lat.toFixed(5)}° N` : `${Math.abs(data.coordinates.lat).toFixed(5)}° S`;
  const lonFormatted = data.coordinates.lon >= 0 ? `${data.coordinates.lon.toFixed(5)}° E` : `${Math.abs(data.coordinates.lon).toFixed(5)}° W`;

  // Collapsed Minimal Mobile Pill State
  if (isCollapsed) {
    return (
      <div className="w-full max-w-md rounded-2xl glass-panel border border-slate-700/70 shadow-2xl p-3 interactive-ui-element print:hidden animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${ndviScore >= 0.35 ? 'bg-emerald-400' : ndviScore < 0 ? 'bg-sky-400' : 'bg-amber-400'}`} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {data.location_name || 'Parcela Agrícola'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 truncate">
                <span className="font-semibold text-emerald-400 font-mono">{ndviScore.toFixed(3)} NDVI</span>
                <span>•</span>
                <span className="truncate">{data.interpretation.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Expandir</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen Interactive UI Card */}
      <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-700/70 shadow-2xl p-4 sm:p-5 overflow-y-auto max-h-[78vh] sm:max-h-[85vh] scrollbar-thin interactive-ui-element print:hidden">
        {/* Header with Title and Geographic Location */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} ${currentTheme.glow}`}
                >
                  {data.interpretation.label}
                </span>
                <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Sentinel-2 & SAR S1</span>
                </span>
              </div>

              {/* Geographic City / Region in Prominence */}
              <div className="mt-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center truncate">
                  <span className="truncate">{data.location_name || 'Parcela Agrícola'}</span>
                </h2>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-400">
                    {data.coordinates.lat.toFixed(4)}°, {data.coordinates.lon.toFixed(4)}°
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Minimizar painel"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Deep-Tech Mode Switcher: Optical vs SAR Radar vs Tractor VRA */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 my-3">
          <button
            onClick={() => setModeTab('optical')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              modeTab === 'optical'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ótico NDVI</span>
          </button>
          <button
            onClick={() => setModeTab('sar')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              modeTab === 'sar'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar SAR</span>
          </button>
          <button
            onClick={() => setModeTab('prescription')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              modeTab === 'prescription'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prescrição VRA</span>
          </button>
        </div>

        {/* TAB 1: OPTICAL SENTINEL-2 */}
        {modeTab === 'optical' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Main NDVI Telemetry Gauge */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Índice Zonal Médio (NDVI)
                </span>
                <div className="flex items-baseline space-x-1">
                  <span
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      ndviScore >= 0.4
                        ? 'text-emerald-400'
                        : ndviScore >= 0.18
                        ? 'text-amber-400'
                        : ndviScore < 0
                        ? 'text-sky-400'
                        : 'text-stone-300'
                    }`}
                  >
                    {ndviScore.toFixed(3)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ 1.00</span>
                </div>
              </div>

              {/* Color Spectrum Progress Bar */}
              <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/50">
                {ndviScore < 0 ? (
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-sky-500"
                    style={{ width: '100%' }}
                  />
                ) : (
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-red-600 via-amber-400 to-emerald-500"
                    style={{ width: `${Math.max(8, percentageScore)}%` }}
                  />
                )}
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                <span>{ndviScore < 0 ? 'Water Body' : 'Solo / Seco'}</span>
                <span>{ndviScore < 0 ? 'Saturado' : 'Moderado'}</span>
                <span>{ndviScore < 0 ? 'Open Water' : 'Dossel Vigoroso'}</span>
              </div>
            </div>

            {/* Diagnosis & Actionable Recommendations */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <h3 className="font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diagnóstico Agronómico</span>
                </h3>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  {data.interpretation.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                <h3 className="font-semibold text-emerald-300 mb-1 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recomendação de Gestão</span>
                </h3>
                <p className="text-emerald-300/90 leading-relaxed text-[11px] sm:text-xs">
                  {data.interpretation.recommendation}
                </p>
              </div>
            </div>

            {/* Imagery & Spatial Colormap Viewer */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Visualização de Superfície</span>
                </h3>
                <div className="flex space-x-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setActiveTab('ndvi')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeTab === 'ndvi'
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mapa NDVI
                  </button>
                  {data.true_color_thumbnail && (
                    <button
                      onClick={() => setActiveTab('true_color')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeTab === 'true_color'
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cor Verdadeira (RGB)
                    </button>
                  )}
                </div>
              </div>

              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {activeTab === 'ndvi' ? (
                  data.thumbnail_url ? (
                    <img
                      src={data.thumbnail_url}
                      alt="CropVision NDVI Colormap"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">A gerar mapa de vigor...</span>
                  )
                ) : data.true_color_thumbnail && !tcImgError ? (
                  <img
                    src={data.true_color_thumbnail}
                    alt="Copernicus Sentinel-2 True Color (TCI)"
                    onError={() => setTcImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                    <Satellite className="w-7 h-7 text-emerald-400/80 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-200">Passagem Multiespectral Copernicus</span>
                    <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                      Bandas óticas B04 (Vermelho) e B08 (NIR) calibradas diretamente a 10m.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Zonal Statistics Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                Distribuição Estatística da Parcela
              </span>
              <div className="grid grid-cols-4 gap-1 text-center font-mono">
                <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Min</div>
                  <div className="text-xs font-bold text-slate-300">{data.ndvi.min.toFixed(2)}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Mediana</div>
                  <div className="text-xs font-bold text-emerald-400">{data.ndvi.median.toFixed(2)}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Máx</div>
                  <div className="text-xs font-bold text-slate-300">{data.ndvi.max.toFixed(2)}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Desvio</div>
                  <div className="text-xs font-bold text-slate-300">±{data.ndvi.std.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SENTINEL-1 SAR RADAR */}
        {modeTab === 'sar' && data.sar_radar && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Cloud Penetration Banner */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <span>100% Penetração de Nuvens & Noturna</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-md uppercase font-mono">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-1">
                  O radar de abertura sintética (SAR) Sentinel-1 opera em micro-ondas C-Band (5.405 GHz, comprimento de onda 5.6 cm), atravessando nuvens densas, neblina e chuva sem perda de sinal.
                </p>
              </div>
            </div>

            {/* Soil Moisture Gauge */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Humidade Volumétrica do Solo (Mv)</span>
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-sky-400 tracking-tight">
                    {data.sar_radar.soil_moisture_estimate_pct}%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">vol.</span>
                </div>
              </div>

              <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-amber-500 via-sky-400 to-blue-600"
                  style={{ width: `${Math.min(100, Math.max(10, data.sar_radar.soil_moisture_estimate_pct * 2))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                <span>Défice Hídrico (&lt;18%)</span>
                <span>Capacidade de Campo (~28%)</span>
                <span>Saturado (&gt;40%)</span>
              </div>
            </div>

            {/* SAR Microwave Telemetry Grid */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Telemetria de Retrodispersão Radar (dB)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Sigma0 VV</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {data.sar_radar.backscatter_vv_db} <span className="text-[10px] text-slate-500">dB</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Rugosidade / Solo</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Sigma0 VH</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {data.sar_radar.backscatter_vh_db} <span className="text-[10px] text-slate-500">dB</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Dispersão Dossel</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">VH / VV</div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">
                    {data.sar_radar.cross_ratio_vh_vv} <span className="text-[10px] text-slate-500">dB</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Índice Biomassa</div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Plataforma SAR:</span>
                  <span className="font-mono text-slate-200">{data.sar_radar.satellite}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modo de Feixe:</span>
                  <span className="font-mono text-slate-200">{data.sar_radar.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Polarização Dupla:</span>
                  <span className="font-mono text-slate-200">{data.sar_radar.polarization}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRACTOR PRESCRIPTION MAP (VRA / ISO-BUS) */}
        {modeTab === 'prescription' && data.prescription_map && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Savings & Economic Impact Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Poupança em Adubo (Taxa Variável)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  ISO 11783-10
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-400 tracking-tight">
                  €{data.prescription_map.fertilizer_savings_eur.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ passagem de adubação</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-900/50 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Azoto Poupado:</span>
                  <span className="font-bold text-slate-200">{data.prescription_map.nitrogen_saved_kg} kg N</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emissões Mitigadas:</span>
                  <span className="font-bold text-emerald-300">{data.prescription_map.co2_equivalent_mitigated_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Zones Breakdown Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Zonas de Prescrição VRA ({data.prescription_map.total_area_hectares} ha)</span>
                <span className="text-[10px] text-slate-400">3 Zonas Agronómicas</span>
              </div>

              {data.prescription_map.zones.map((zone) => (
                <div
                  key={zone.zone_id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color_hex }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{zone.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {zone.recommendation}
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {zone.estimated_hectares} ha ({zone.percentage_of_parcel}% da parcela)
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-white font-mono">
                      {zone.target_n_rate_kg_ha}
                    </div>
                    <div className="text-[9px] text-emerald-400 font-semibold uppercase">kg N / ha</div>
                  </div>
                </div>
              ))}
            </div>

            {/* One-Click Action Buttons for Tractors */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportIsobus}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar ISO-BUS</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Exportar CSV</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Ficheiros compatíveis com John Deere Gen4, Trimble GFX-750, Raven e Fendt VarioDoc.
            </p>
          </div>
        )}

        {/* Scene Metadata Footer */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex justify-between">
            <span>Data de Aquisição:</span>
            <span className="font-mono text-slate-200">
              {data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cobertura de Nuvens:</span>
            <span className="font-mono text-emerald-400">
              {data.cloud_cover_percentage.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Resolução Espacial:</span>
            <span className="font-mono text-slate-200">{data.resolution_meters}m / pixel</span>
          </div>
          <div className="flex justify-between">
            <span>Latência de Processamento:</span>
            <span className="font-mono text-slate-200">{data.processing_time_ms.toFixed(1)} ms</span>
          </div>
        </div>

        {/* Historical Time Series Trend Chart */}
        {timeseries && timeseries.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800">
            <TimeSeriesChart series={timeseries} />
          </div>
        )}

        {/* Action Footer with Export Options */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 relative">
          <div className="flex items-center justify-between">
            {/* Export Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Relatório</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {/* Dropdown Menu */}
              {showExportMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-[#0b1120] border border-slate-700 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                  {/* 1. ISO-BUS GeoJSON (Tratores) */}
                  <button
                    onClick={handleExportIsobus}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-100 flex items-start space-x-2.5 transition-colors group"
                  >
                    <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span className="group-hover:text-emerald-300 transition-colors">ISO-BUS GeoJSON (Trator)</span>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-md">
                          VRA
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Compatível com John Deere, Trimble & Fendt</div>
                    </div>
                  </button>

                  {/* 2. Prescription CSV */}
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80 mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Folha de Aplicação CSV (.csv)</div>
                      <div className="text-[10px] text-slate-400">Tabela de dosagem para consolas e Excel</div>
                    </div>
                  </button>

                  {/* 3. PDF Executivo Oficial */}
                  <button
                    onClick={handlePrintPdf}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <Printer className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Relatório Técnico PDF / Impressão</div>
                      <div className="text-[10px] text-slate-400">Layout A4 com telemetria SAR e prescrição</div>
                    </div>
                  </button>

                  {/* 4. Text File */}
                  <button
                    onClick={handleExportTextReport}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Relatório em Texto (.txt)</div>
                      <div className="text-[10px] text-slate-400">Arquivo em texto formatado</div>
                    </div>
                  </button>

                  {/* 5. Clean JSON */}
                  <button
                    onClick={handleExportJson}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <Download className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Dados em JSON (.json)</div>
                      <div className="text-[10px] text-slate-400">Métricas completas para SIG / APIs</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              CropVision DeepTech v2.5
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Executive A4 Print / PDF Report (Visible ONLY when printing to PDF) */}
      <div className="hidden print-only-report font-sans text-slate-900 bg-white">
        {/* Header with Emerald Brand Bar & CropVision Official Logo */}
        <div className="border-b-2 border-emerald-600 pb-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/cropvision_icon.jpg"
                alt="CropVision SaaS"
                className="w-12 h-12 rounded-xl object-cover border border-emerald-600"
              />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Crop<span className="text-emerald-600">Vision</span> Deep-Tech
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wide">
                  Sentinel-2 NDVI, Sentinel-1 SAR Radar & Tractor ISO-BUS Prescriptions
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div><strong>Relatório Gerado:</strong> {new Date().toLocaleDateString('pt-PT')}</div>
              <div className="font-mono text-[10px] text-slate-500">Cena: {data.scene_id.slice(0, 26)}</div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
                Copernicus Sentinel-2 & Sentinel-1
              </div>
            </div>
          </div>
        </div>

        {/* Location & Sensor Information Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Localização / Município:</span>
              <span className="text-sm font-bold text-slate-900">{data.location_name || 'Parcela Agrícola'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Coordenadas Geográficas:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {latFormatted}, {lonFormatted}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Plataformas de Satélite:</span>
              <span className="font-semibold text-slate-800">Sentinel-2 L2A (Ótico) + Sentinel-1C (SAR Radar)</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Data de Aquisição & Nuvens:</span>
              <span className="font-mono text-slate-800">
                {data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC • {data.cloud_cover_percentage}% nuvens
              </span>
            </div>
          </div>
        </div>

        {/* Canopy Health Diagnostic Summary */}
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-emerald-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Estado de Vigor do Dossel Vegetativo (NDVI)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
              {data.interpretation.label}
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-800 font-mono mb-2">
            {data.ndvi.mean.toFixed(3)} <span className="text-sm font-normal text-emerald-700">/ 1.000</span>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed mb-2">
            <strong>Diagnóstico:</strong> {data.interpretation.description}
          </div>
          <div className="text-xs text-emerald-800 leading-relaxed font-semibold">
            <strong>Recomendação Técnica:</strong> {data.interpretation.recommendation}
          </div>
        </div>

        {/* SAR Radar Soil Moisture Section if available */}
        {data.sar_radar && (
          <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-sky-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                Telemetria Sentinel-1 SAR Radar (Banda-C 5.4 GHz)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-200 text-sky-900 uppercase">
                100% Penetração de Nuvens
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">Humidade Solo:</span>
                <span className="font-bold text-sky-800 text-sm">{data.sar_radar.soil_moisture_estimate_pct}% vol.</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Sigma0 VV:</span>
                <span className="font-bold">{data.sar_radar.backscatter_vv_db} dB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Sigma0 VH:</span>
                <span className="font-bold">{data.sar_radar.backscatter_vh_db} dB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Razão VH/VV:</span>
                <span className="font-bold">{data.sar_radar.cross_ratio_vh_vv} dB</span>
              </div>
            </div>
          </div>
        )}

        {/* Tractor Prescription Map Summary if available */}
        {data.prescription_map && (
          <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-amber-50/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Prescrição de Adubação a Taxa Variável (ISO 11783-10 / ISO-BUS)
              </span>
              <span className="text-xs font-bold text-emerald-800">
                Poupança Estimada: €{data.prescription_map.fertilizer_savings_eur}
              </span>
            </div>
            <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-left">
                <tr>
                  <th className="p-2 border-b">Zona</th>
                  <th className="p-2 border-b">Área (ha)</th>
                  <th className="p-2 border-b">Taxa Alvo (kg N/ha)</th>
                  <th className="p-2 border-b">Recomendação Agronómica</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {data.prescription_map.zones.map((z) => (
                  <tr key={z.zone_id} className="border-b border-slate-100">
                    <td className="p-2 font-bold">{z.name}</td>
                    <td className="p-2 font-mono">{z.estimated_hectares} ha</td>
                    <td className="p-2 font-mono font-bold text-emerald-700">{z.target_n_rate_kg_ha} kg/ha</td>
                    <td className="p-2 text-[11px]">{z.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Zonal Statistics Table */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Estatísticas Zonais da Parcela (Resolução 10m)
          </h3>
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 text-left">
              <tr>
                <th className="p-2 border-b border-slate-200">Mínimo NDVI</th>
                <th className="p-2 border-b border-slate-200">P25</th>
                <th className="p-2 border-b border-slate-200">Mediana</th>
                <th className="p-2 border-b border-slate-200">Média</th>
                <th className="p-2 border-b border-slate-200">P75</th>
                <th className="p-2 border-b border-slate-200">Máximo NDVI</th>
                <th className="p-2 border-b border-slate-200">Desvio Padrão</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-800">
              <tr>
                <td className="p-2 border-b border-slate-100">{data.ndvi.min.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100">{data.ndvi.p25.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100 font-bold text-emerald-700">{data.ndvi.median.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100 font-bold text-slate-900">{data.ndvi.mean.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100">{data.ndvi.p75.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100">{data.ndvi.max.toFixed(3)}</td>
                <td className="p-2 border-b border-slate-100">±{data.ndvi.std.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Historical Orbital Passes Table */}
        {timeseries && timeseries.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Passagens Orbitais Históricas Sentinel-2 (Últimas {timeseries.length} Revisitas)
            </h3>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-left">
                <tr>
                  <th className="p-2 border-b border-slate-200">Data de Aquisição</th>
                  <th className="p-2 border-b border-slate-200">Identificador da Cena</th>
                  <th className="p-2 border-b border-slate-200">NDVI Médio</th>
                  <th className="p-2 border-b border-slate-200">Nuvens (%)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-800">
                {timeseries.map((ts, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border-b border-slate-100">{ts.date}</td>
                    <td className="p-2 border-b border-slate-100 text-[10px]">{ts.scene_id}</td>
                    <td className="p-2 border-b border-slate-100 font-bold text-emerald-700">{ts.ndvi_mean.toFixed(3)}</td>
                    <td className="p-2 border-b border-slate-100">{ts.cloud_cover}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Report Footer */}
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
          <div>
            Dados científicos: ESA Copernicus Sentinel-2 L2A & Sentinel-1 SAR IW STAC Archives.
          </div>
          <div>
            Gerado por <strong>CropVision SaaS</strong> • https://whop.com/cropvision/
          </div>
        </div>
      </div>
    </>
  );
};
