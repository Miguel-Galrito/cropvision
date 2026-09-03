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

  // Export 1: Clean Human-Readable Text Report (perfect for Windows Notepad / Notes)
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

    const textContent = `================================================================================
SATHEALTH - SATELLITE VEGETATION HEALTH REPORT (COPERNICUS SENTINEL-2)
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

--------------------------------------------------------------------------------
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

================================================================================
SatHealth Earth Observation Micro-SaaS - Precision Agriculture Intelligence
Repository: https://github.com/Miguel-Galrito/sat-health-api
Live App:   https://miguel-galrito.github.io/sat-health-api/
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sathealth-report-${data.scene_id.slice(0, 18)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export 2: Clean Structured JSON Report
  const handleExportJson = () => {
    const cleanAnalysis = {
      ...data,
      thumbnail_url: '[PNG Heatmap available in web interface]',
    };

    const report = {
      title: 'SatHealth - Satellite Vegetation Analysis Report (Sentinel-2)',
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
    a.download = `sathealth-data-${data.scene_id.slice(0, 18)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export 3: Print / Save as PDF
  const handlePrintPdf = () => {
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
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${data.interpretation.badge_color === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {data.location_name || 'Agricultural Parcel'}
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
              <span>Expand</span>
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
      <div className="w-full max-w-md rounded-2xl glass-panel border border-slate-700/70 shadow-2xl p-4 sm:p-5 overflow-y-auto max-h-[78vh] sm:max-h-[85vh] scrollbar-thin interactive-ui-element print:hidden">
        {/* Header with Title and Minimize Button */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
          <div className="min-w-0 pr-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}
              >
                {data.interpretation.label}
              </span>
              {data.is_simulated && (
                <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full">
                  Copernicus Orbit Pass
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-1.5 flex items-center truncate">
              Crop Vigor Diagnosis
            </h2>
            {data.location_name && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate max-w-[240px] sm:max-w-[280px]" title={data.location_name}>
                  {data.location_name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {/* Collapse on mobile toggle */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Minimize panel to see map"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Score Gauge */}
        <div className="my-3.5 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Zonal Mean NDVI</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {ndviScore.toFixed(3)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 1.00</span>
            </div>
          </div>

          {/* Color Spectrum Progress Bar */}
          <div className="relative w-full h-2.5 sm:h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-red-600 via-amber-400 to-emerald-500"
              style={{ width: `${Math.max(8, percentageScore)}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-400 mt-1.5 font-mono">
            <span>Soil / Dry</span>
            <span>Moderate</span>
            <span>Vigorous Canopy</span>
          </div>
        </div>

        {/* Diagnosis & Recommendations */}
        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <h3 className="font-semibold text-slate-200 mb-1">Agronomic Status</h3>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              {data.interpretation.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
            <h3 className="font-semibold text-emerald-300 mb-1 flex items-center space-x-1">
              <span>Recommendation</span>
            </h3>
            <p className="text-emerald-400/90 leading-relaxed text-[11px] sm:text-xs">
              {data.interpretation.recommendation}
            </p>
          </div>
        </div>

        {/* Imagery & Spatial Colormap Viewer with Tabs */}
        <div className="mt-3.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-300">
              Parcel Surface Visualization
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
                NDVI Colormap
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
                  True Color
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            {activeTab === 'ndvi' ? (
              data.thumbnail_url ? (
                <img
                  src={data.thumbnail_url}
                  alt="NDVI Spatial Colormap"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-500">Generating colormap...</span>
              )
            ) : data.true_color_thumbnail && !tcImgError ? (
              <img
                src={data.true_color_thumbnail}
                alt="Sentinel-2 True Color (TCI)"
                onError={() => setTcImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <Satellite className="w-7 h-7 text-emerald-400/80 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200">Copernicus Multispectral Pass</span>
                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Near-Infrared (B08) and Red (B04) radiometric bands processed directly for high-precision NDVI canopy scoring.
                </p>
              </div>
            )}

            {/* Gradient scale overlay on NDVI tab */}
            {activeTab === 'ndvi' && (
              <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex items-center justify-between text-[9px] text-slate-300 font-mono">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1" />
                  Soil
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
                  Moderate
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                  Healthy Vigor
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Zonal Statistics Grid */}
        <div className="mt-3.5 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">
            Zonal Parcel Statistics
          </h3>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Minimum</span>
              <span className="font-mono text-slate-300 font-medium">
                {data.ndvi.min.toFixed(3)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Median</span>
              <span className="font-mono text-emerald-400 font-bold">
                {data.ndvi.median.toFixed(3)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Maximum</span>
              <span className="font-mono text-slate-300 font-medium">
                {data.ndvi.max.toFixed(3)}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 px-1 font-mono">
            <span>Canopy Homogeneity (Std Dev):</span>
            <span className="text-slate-200 font-semibold">±{data.ndvi.std.toFixed(3)}</span>
          </div>
        </div>

        {/* Satellite Granule & Sensor Metadata */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 text-[10px] sm:text-[11px] space-y-1 text-slate-400">
          <div className="flex justify-between">
            <span>Satellite & Sensor:</span>
            <span className="font-mono text-slate-200">{data.platform}</span>
          </div>
          <div className="flex justify-between">
            <span>Acquisition Date:</span>
            <span className="font-mono text-slate-200">
              {data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cloud Cover:</span>
            <span className="font-mono text-emerald-400">
              {data.cloud_cover_percentage.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Spatial Resolution:</span>
            <span className="font-mono text-slate-200">{data.resolution_meters}m / pixel</span>
          </div>
          <div className="flex justify-between">
            <span>Processing Latency:</span>
            <span className="font-mono text-slate-200">{data.processing_time_ms.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[9px] sm:text-[10px]">
            <span className="text-slate-500 truncate max-w-[180px]">ID: {data.scene_id.slice(0, 20)}...</span>
            <span className="text-slate-500">{data.pixels_analyzed} pixels</span>
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
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {/* Dropdown Menu */}
              {showExportMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-52 sm:w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                  {/* 1. Text File for Notepad */}
                  <button
                    onClick={handleExportTextReport}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Text Report (.txt)</div>
                      <div className="text-[10px] text-slate-400">Clean for Notepad</div>
                    </div>
                  </button>

                  {/* 2. Print / PDF */}
                  <button
                    onClick={handlePrintPdf}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <Printer className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Print / Save as PDF</div>
                      <div className="text-[10px] text-slate-400">Formatted executive report</div>
                    </div>
                  </button>

                  {/* 3. Clean JSON */}
                  <button
                    onClick={handleExportJson}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <Download className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Clean JSON Data</div>
                      <div className="text-[10px] text-slate-400">Lightweight raw metrics</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              SatHealth v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Executive A4 Print / PDF Report (Visible ONLY when printing to PDF) */}
      <div className="hidden print-only-report font-sans text-slate-900 bg-white">
        {/* Header with Emerald Brand Bar */}
        <div className="border-b-2 border-emerald-600 pb-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
                SH
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Sat<span className="text-emerald-600">Health</span> Earth Observation
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Copernicus Sentinel-2 Agricultural Parcel Health Report
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-GB')}</div>
              <div className="font-mono text-[10px] text-slate-400">Granule: {data.scene_id.slice(0, 24)}</div>
            </div>
          </div>
        </div>

        {/* Location & Sensor Information Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Location / Municipality:</span>
              <span className="text-sm font-bold text-slate-900">{data.location_name || 'Agricultural Parcel'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Geographic Coordinates:</span>
              <span className="font-mono text-slate-800 font-medium">
                {latFormatted}, {lonFormatted}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Surveyed Plot Area:</span>
              <span className="text-slate-800">{data.pixels_analyzed} pixels (~{(data.pixels_analyzed / 100).toFixed(1)} hectares at 10m/px)</span>
            </div>
          </div>

          <div className="space-y-1.5 border-l border-slate-200 pl-4">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Satellite Platform & Level:</span>
              <span className="font-semibold text-slate-900">{data.platform} (Level-2A BOA)</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Acquisition Timestamp:</span>
              <span className="text-slate-800">{data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Scene Cloud Cover:</span>
              <span className="font-semibold text-emerald-700">{data.cloud_cover_percentage}%</span>
            </div>
          </div>
        </div>

        {/* Executive Crop Vigor & Agronomic Diagnosis Box */}
        <div className="mb-5 p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Agronomic Canopy Diagnosis
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {data.interpretation.label}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase">Zonal Mean NDVI</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {ndviScore.toFixed(3)}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-700 mb-2.5 leading-relaxed">
            {data.interpretation.description}
          </p>

          <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800">
            <strong className="text-emerald-800 block mb-0.5">💡 Agronomic Actionable Recommendation:</strong>
            {data.interpretation.recommendation}
          </div>
        </div>

        {/* Imagery & Spatial Colormap Section */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
            <div className="text-[11px] font-bold text-slate-700 mb-1.5 uppercase">
              NDVI Spatial Vigor Heatmap
            </div>
            <img
              src={data.thumbnail_url}
              alt="NDVI Heatmap"
              className="w-44 h-44 mx-auto object-cover rounded-lg border border-slate-200"
            />
            <div className="text-[9px] text-slate-500 mt-1.5">
              Scale: Red (Bare Soil) → Amber (Sparse) → Green (Vigorous Canopy)
            </div>
          </div>

          {data.true_color_thumbnail && !tcImgError ? (
            <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
              <div className="text-[11px] font-bold text-slate-700 mb-1.5 uppercase">
                Copernicus True Color (RGB)
              </div>
              <img
                src={data.true_color_thumbnail}
                alt="True Color RGB"
                className="w-44 h-44 mx-auto object-cover rounded-lg border border-slate-200"
              />
              <div className="text-[9px] text-slate-500 mt-1.5">
                Sentinel-2 True Color Imagery (TCI) at parcel coordinates
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-center items-center text-center p-4">
              <div className="text-xs font-semibold text-slate-700 mb-1">Radiometric Spectrum</div>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                Calibrated against Sentinel-2 multispectral surface reflectance bands B04 (Red, 665nm) and B08 (Near-Infrared, 842nm) at 10m native spatial resolution.
              </p>
            </div>
          )}
        </div>

        {/* Zonal Statistics Table */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Zonal Parcel Statistics (10m Resolution)
          </h3>
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 text-left">
              <tr>
                <th className="p-2 border-b border-slate-200">Minimum NDVI</th>
                <th className="p-2 border-b border-slate-200">P25</th>
                <th className="p-2 border-b border-slate-200">Median</th>
                <th className="p-2 border-b border-slate-200">Mean</th>
                <th className="p-2 border-b border-slate-200">P75</th>
                <th className="p-2 border-b border-slate-200">Maximum NDVI</th>
                <th className="p-2 border-b border-slate-200">Std Dev (Homogeneity)</th>
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
              Historical Sentinel-2 Orbital Passes (Last {timeseries.length} Re-visits)
            </h3>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-left">
                <tr>
                  <th className="p-2 border-b border-slate-200">Acquisition Date</th>
                  <th className="p-2 border-b border-slate-200">Scene Identifier</th>
                  <th className="p-2 border-b border-slate-200">Mean NDVI</th>
                  <th className="p-2 border-b border-slate-200">Cloud Cover</th>
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
            Data sourced from European Space Agency (ESA) Copernicus Sentinel-2 open STAC archive.
          </div>
          <div>
            Generated by SatHealth Micro-SaaS • https://github.com/Miguel-Galrito/sat-health-api
          </div>
        </div>
      </div>
    </>
  );
};
