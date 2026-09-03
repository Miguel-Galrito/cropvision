'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { MapWrapper } from '../components/MapWrapper';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { LoadingState } from '../components/LoadingState';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
} from '../lib/types';
import { analyzeVegetation, checkHealth, fetchTimeSeries } from '../lib/api';
import {
  AlertTriangle,
  Crosshair,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export default function DashboardPage() {
  // Default coordinates (Esporão Estate, Alentejo, Portugal)
  const [lat, setLat] = useState<number>(38.3842);
  const [lon, setLon] = useState<number>(-7.5519);
  const [zoom, setZoom] = useState<number>(13);

  // Settings
  const [maxCloudCover, setMaxCloudCover] = useState<number>(20.0);
  const [bufferMeters, setBufferMeters] = useState<number>(500.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeSeriesPoint[] | null>(null);
  const [error, setError] = useState<{ message: string; detail?: any } | null>(null);

  // Health check on mount
  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((data) => {
        if (isMounted) setApiHealthy(data.status === 'healthy');
      })
      .catch(() => {
        if (isMounted) setApiHealthy(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Analysis executor
  const runAnalysis = useCallback(
    async (targetLat: number, targetLon: number, cloudThreshold = maxCloudCover) => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch live NDVI analysis
        const data = await analyzeVegetation({
          lat: targetLat,
          lon: targetLon,
          max_cloud_cover: cloudThreshold,
          buffer_meters: bufferMeters,
        });
        setAnalysisData(data);

        // 2. Fetch historical time series in parallel
        try {
          const ts = await fetchTimeSeries(targetLat, targetLon, Math.max(35, cloudThreshold));
          setTimeseriesData(ts.series);
        } catch {
          // Time series failure is non-fatal
          setTimeseriesData(null);
        }
      } catch (err: any) {
        console.error('Analysis error:', err);
        setError({
          message: err.message || 'Error processing satellite data.',
          detail: err.data,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [maxCloudCover, bufferMeters]
  );

  // Initial analysis on first load
  useEffect(() => {
    runAnalysis(lat, lon);
  }, []);

  // Map click coordinate selection handler
  const handleSelectCoordinate = (clickedLat: number, clickedLon: number) => {
    setLat(clickedLat);
    setLon(clickedLon);
    runAnalysis(clickedLat, clickedLon);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Top Header Navbar */}
      <Navbar apiHealthy={apiHealthy} lat={lat} lon={lon} />

      {/* Main Full-Screen Map */}
      <main className="absolute inset-0 top-16 z-0">
        <MapWrapper
          lat={lat}
          lon={lon}
          zoom={zoom}
          bbox={analysisData?.bbox}
          onSelectCoordinate={handleSelectCoordinate}
          disabled={isLoading}
        />
      </main>

      {/* Floating Controls Bar (Dynamic Targeting & Filter Bar) */}
      <div className="absolute top-20 left-4 right-4 md:left-6 md:right-auto z-20 max-w-xl">
        <div className="p-3 rounded-2xl glass-panel shadow-2xl border border-slate-700/60 flex flex-col space-y-2.5">
          {/* Dynamic Map Click Instruction Banner */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-100">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Map Targeting Active</span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              Click anywhere on the map to analyze
            </span>
          </div>

          {/* Quick Coordinate Manual Input & Filters */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-[11px] text-emerald-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Target: {lat.toFixed(5)}°, {lon.toFixed(5)}°
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  showSettings
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Cloud Filter ({maxCloudCover}%)</span>
              </button>
            </div>

            <button
              onClick={() => runAnalysis(lat, lon)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Re-analyze</span>
            </button>
          </div>

          {/* Collapsible Settings Drawer */}
          {showSettings && (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="flex justify-between text-slate-400 mb-1">
                  <span>Max Cloud Cover Limit:</span>
                  <span className="font-semibold text-emerald-400">{maxCloudCover}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={maxCloudCover}
                  onChange={(e) => setMaxCloudCover(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-400 mb-1">
                  <span>Sampling Radius (Buffer):</span>
                  <span className="font-semibold text-emerald-400">{bufferMeters}m</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={bufferMeters}
                  onChange={(e) => setBufferMeters(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Side Panel (Results, Loading, or Error) */}
      <div className="absolute bottom-6 right-4 left-4 md:left-auto md:top-20 md:bottom-6 md:right-6 z-30 max-w-md pointer-events-auto flex flex-col justify-end md:justify-start">
        {isLoading ? (
          <LoadingState lat={lat} lon={lon} />
        ) : error ? (
          <div className="p-5 rounded-2xl glass-panel border border-rose-900/60 shadow-2xl animate-in fade-in">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-200">
                  Cloud Cover / Satellite Notice
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {error.message}
                </p>

                {error.detail?.lowest_cloud_cover && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Recent pass cloud cover:</span>{' '}
                      <span className="font-bold text-rose-400">
                        {error.detail.lowest_cloud_cover.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Configured limit:</span>{' '}
                      <span className="font-semibold text-slate-200">{maxCloudCover}%</span>
                    </div>
                    {error.detail.recommendation && (
                      <p className="text-emerald-400 text-[11px] pt-1">
                        💡 {error.detail.recommendation}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 mt-4">
                  {error.detail?.lowest_cloud_cover && (
                    <button
                      onClick={() => {
                        const newThreshold = Math.ceil(error.detail.lowest_cloud_cover + 5);
                        setMaxCloudCover(newThreshold);
                        runAnalysis(lat, lon, newThreshold);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      Adjust Limit to {Math.ceil(error.detail.lowest_cloud_cover + 5)}% & Retry
                    </button>
                  )}
                  <button
                    onClick={() => runAnalysis(lat, lon)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : analysisData ? (
          <AnalysisPanel
            data={analysisData}
            timeseries={timeseriesData}
            onClose={() => setAnalysisData(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
