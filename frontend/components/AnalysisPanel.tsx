'use client';

import React, { useState } from 'react';
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
Target Coordinates:  ${latStr}, ${lonStr}
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

  // Export 2: Clean Structured JSON Report (without giant Base64 binary strings)
  const handleExportJson = () => {
    // Strip giant base64 thumbnail string so Notepad / text editors don't freeze
    const cleanAnalysis = {
      ...data,
      thumbnail_url: '[PNG Heatmap available in web interface]',
    };

    const report = {
      title: 'SatHealth - Satellite Vegetation Analysis Report (Sentinel-2)',
      exported_at: new Date().toISOString(),
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
    if (typeof window !== 'undefined') {
      window.print();
    }
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
                Copernicus Orbit Pass
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white mt-1.5 flex items-center">
            Crop Vigor Diagnosis
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
          <span className="text-xs text-slate-400 font-medium">Zonal Mean NDVI</span>
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
          <span>0.0 (Soil)</span>
          <span>0.3 (Stress)</span>
          <span>0.6 (Good)</span>
          <span>0.9+ (Lush)</span>
        </div>

        {/* Description & Agronomic Recommendation */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {data.interpretation.description}
        </p>
        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 leading-snug">
          <span className="font-semibold text-emerald-200">Agronomic Recommendation: </span>
          {data.interpretation.recommendation}
        </div>
      </div>

      {/* Satellite Imagery Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Satellite Imagery</span>
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('ndvi')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'ndvi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NDVI Heatmap
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
                True Color (RGB)
              </button>
            )}
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
          {activeTab === 'ndvi' ? (
            <img
              src={data.thumbnail_url}
              alt="NDVI spectral heatmap rendered from Copernicus Sentinel-2 bands"
              className="w-full h-full object-cover"
            />
          ) : data.true_color_thumbnail ? (
            <img
              src={data.true_color_thumbnail}
              alt="Sentinel-2 true color satellite preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-slate-500">Thumbnail unavailable</div>
          )}

          {/* Colormap Legend Overlay */}
          {activeTab === 'ndvi' && (
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] flex items-center justify-between text-slate-300">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-600 mr-1" /> Soil / Dry
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1" /> Moderate
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Healthy Vigor
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Zonal Statistics Breakdown */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">Zonal Parcel Statistics</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Minimum</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {data.ndvi.min.toFixed(3)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Median</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {data.ndvi.median.toFixed(3)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Maximum</span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {data.ndvi.max.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
          <span>Canopy Homogeneity (Std Dev):</span>
          <span className="font-mono font-semibold text-slate-300">±{data.ndvi.std.toFixed(3)}</span>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="mb-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Satellite & Sensor:</span>
          <span className="text-slate-200 font-medium">{data.platform} (L2A BOA)</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Acquisition Date:</span>
          <span className="text-slate-200 font-mono">
            {data.acquisition_date.replace('T', ' ').slice(0, 19)} UTC
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Cloud Cover:</span>
          <span className="text-emerald-400 font-semibold">{data.cloud_cover_percentage}%</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Spatial Resolution:</span>
          <span className="text-slate-200">{data.resolution_meters}m / pixel</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Processing Latency:</span>
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

      {/* Action Footer with Export Options */}
      <div className="mt-4 pt-3 border-t border-slate-800 relative">
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
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                {/* 1. Text File for Notepad */}
                <button
                  onClick={handleExportTextReport}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Text Report (.txt)</div>
                    <div className="text-[10px] text-slate-400">Clean & readable in Notepad</div>
                  </div>
                </button>

                {/* 2. Print / PDF */}
                <button
                  onClick={handlePrintPdf}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                >
                  <Printer className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Print / Save as PDF</div>
                    <div className="text-[10px] text-slate-400">Formatted visual summary</div>
                  </div>
                </button>

                {/* 3. Clean JSON */}
                <button
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                >
                  <Download className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Clean JSON Data</div>
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
  );
};
