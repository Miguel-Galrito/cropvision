'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { MapWrapper } from '../components/MapWrapper';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { LoadingState } from '../components/LoadingState';
import { PricingModal } from '../components/PricingModal';
import { RoiCalculatorModal } from '../components/RoiCalculatorModal';
import { LocationSearchBar } from '../components/LocationSearchBar';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
} from '../lib/types';
import { analyzeVegetation, checkHealth, fetchTimeSeries } from '../lib/api';
import { reverseGeocode } from '../lib/geocoding';
import {
  AlertTriangle,
  Crosshair,
  LocateFixed,
  MapPin,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  // Default coordinates (Esporão Estate, Alentejo, Portugal)
  const [lat, setLat] = useState<number>(38.3842);
  const [lon, setLon] = useState<number>(-7.5519);
  const [zoom, setZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>('Reguengos de Monsaraz, Évora, Portugal');

  // Manual input state
  const [manualLat, setManualLat] = useState<string>('38.3842');
  const [manualLon, setManualLon] = useState<string>('-7.5519');

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

  // Modals & Monetization State
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [pricingReason, setPricingReason] = useState<'limit_reached' | 'pdf_unlock' | 'generic'>('generic');
  const [isRoiOpen, setIsRoiOpen] = useState<boolean>(false);
  const [dailyUsage, setDailyUsage] = useState<number>(0);

  // Helper for tracking daily free usage
  const getTodayUsage = (): number => {
    if (typeof window === 'undefined') return 0;
    const todayKey = `cropvision_usage_${new Date().toISOString().slice(0, 10)}`;
    const val = localStorage.getItem(todayKey);
    return val ? parseInt(val, 10) : 0;
  };

  const incrementTodayUsage = (): number => {
    if (typeof window === 'undefined') return 1;
    const todayKey = `cropvision_usage_${new Date().toISOString().slice(0, 10)}`;
    const current = getTodayUsage();
    const next = current + 1;
    localStorage.setItem(todayKey, next.toString());
    setDailyUsage(next);
    return next;
  };

  // Health check on mount and initialize daily usage
  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((data) => {
        if (isMounted) setApiHealthy(data.status === 'healthy');
      })
      .catch(() => {
        if (isMounted) setApiHealthy(false);
      });

    setDailyUsage(getTodayUsage());

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
          message: err.message || 'Erro ao processar dados óticos de satélite.',
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
    reverseGeocode(lat, lon).then((geo) => {
      setLocationName(geo.formatted);
    });
    runAnalysis(lat, lon);
  }, []);

  // Map click coordinate selection handler
  const handleSelectCoordinate = useCallback(
    (clickedLat: number, clickedLon: number) => {
      console.log('[CropVision] New target coordinates selected:', clickedLat, clickedLon);
      setLat(clickedLat);
      setLon(clickedLon);
      setManualLat(clickedLat.toFixed(5));
      setManualLon(clickedLon.toFixed(5));
      reverseGeocode(clickedLat, clickedLon).then((geo) => {
        setLocationName(geo.formatted);
      });

      // Soft Paywall check: trigger pricing modal on 4th search
      const usage = incrementTodayUsage();
      if (usage > 3) {
        setPricingReason('limit_reached');
        setIsPricingOpen(true);
      }

      runAnalysis(clickedLat, clickedLon);
    },
    [runAnalysis]
  );

  // Location search bar select handler
  const handleSelectSearchResult = (selectedLat: number, selectedLon: number, name: string) => {
    setLat(selectedLat);
    setLon(selectedLon);
    setManualLat(selectedLat.toFixed(5));
    setManualLon(selectedLon.toFixed(5));
    setLocationName(name);

    const usage = incrementTodayUsage();
    if (usage > 3) {
      setPricingReason('limit_reached');
      setIsPricingOpen(true);
    }

    runAnalysis(selectedLat, selectedLon);
  };

  // Center tracking when map is dragged
  const handleCenterChange = useCallback(
    (centerLat: number, centerLon: number) => {
      setMapCenter({ lat: centerLat, lon: centerLon });
    },
    []
  );

  const isMapPannedAway =
    mapCenter !== null &&
    (Math.abs(mapCenter.lat - lat) > 0.005 || Math.abs(mapCenter.lon - lon) > 0.005);

  const handleApplyManualCoordinates = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLon = parseFloat(manualLon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon) && parsedLat >= -90 && parsedLat <= 90 && parsedLon >= -180 && parsedLon <= 180) {
      handleSelectCoordinate(parsedLat, parsedLon);
    }
  };

  const displayLocation = analysisData?.location_name || locationName;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16] print:overflow-visible print:h-auto print:bg-white">
      {/* Top Header Navbar */}
      <Navbar
        apiHealthy={apiHealthy}
        lat={lat}
        lon={lon}
        locationName={displayLocation}
        onOpenPricing={() => {
          setPricingReason('generic');
          setIsPricingOpen(true);
        }}
        onOpenRoi={() => setIsRoiOpen(true)}
      />

      {/* Main Full-Screen Map */}
      <main className="absolute inset-0 top-14 sm:top-16 z-0 no-print">
        <MapWrapper
          lat={lat}
          lon={lon}
          zoom={zoom}
          bbox={analysisData?.bbox}
          onSelectCoordinate={handleSelectCoordinate}
          onCenterChange={handleCenterChange}
        />
      </main>

      {/* Floating Controls Bar (Search, Targeting & Filter Bar) */}
      <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-6 sm:right-auto z-20 max-w-xl no-print">
        <div className="p-2.5 sm:p-3.5 rounded-3xl glass-panel shadow-2xl border border-slate-700/60 flex flex-col space-y-2.5">
          {/* Top Row: Search Bar & Targeting Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1">
              <LocationSearchBar onSelectLocation={handleSelectSearchResult} disabled={isLoading} />
            </div>

            {/* Targeting Active Beacon */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-200">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Alvo Ativo</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {dailyUsage}/3 Grátis
              </span>
            </div>
          </div>

          {/* Location details & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1.5 border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 min-w-0">
              <span
                className="text-[11px] text-emerald-300 font-mono bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center space-x-1.5 max-w-[160px] sm:max-w-xs truncate"
                title={displayLocation || `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`}
              >
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{displayLocation || `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`}</span>
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl border text-xs transition-colors shrink-0 ${
                  showSettings
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Filtros ({maxCloudCover}%)</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 justify-end">
              {isMapPannedAway && mapCenter && (
                <button
                  onClick={() => handleSelectCoordinate(mapCenter.lat, mapCenter.lon)}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium text-xs border border-emerald-500/30 transition-all shadow-sm"
                  title="Analisar centro da visualização"
                >
                  <LocateFixed className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Centro</span>
                </button>
              )}

              <button
                onClick={() => handleSelectCoordinate(lat, lon)}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Analisar</span>
              </button>
            </div>
          </div>

          {/* Collapsible Settings Drawer */}
          {showSettings && (
            <div className="pt-3 border-t border-slate-800 flex flex-col space-y-3 text-xs">
              {/* Manual Coordinate Inputs */}
              <div>
                <label className="text-slate-400 block mb-1 text-[11px] font-medium">
                  Inserção Direta de Coordenadas (Lat, Lon):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-1/2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    className="w-1/2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleApplyManualCoordinates}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Ir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="flex justify-between text-slate-400 mb-1">
                    <span>Limite de Nuvens:</span>
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
                    <span>Raio de Amostragem (Buffer):</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Floating Side Panel (Results, Loading, or Error) */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:right-4 sm:left-4 md:left-auto md:top-20 md:bottom-6 md:right-6 z-30 max-w-md pointer-events-auto flex flex-col justify-end md:justify-start print:static print:max-w-none print:w-full print:m-0 print:p-0 print:block">
        {isLoading ? (
          <div className="no-print">
            <LoadingState lat={lat} lon={lon} />
          </div>
        ) : error ? (
          <div className="p-5 rounded-3xl glass-panel border border-rose-900/60 shadow-2xl animate-in fade-in no-print">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-200">
                  Aviso de Cobertura de Nuvens / Satélite
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {error.message}
                </p>

                {error.detail?.lowest_cloud_cover && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Nuvens da passagem mais recente:</span>{' '}
                      <span className="font-bold text-rose-400">
                        {error.detail.lowest_cloud_cover.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Limite configurado:</span>{' '}
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
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      Ajustar Limite para {Math.ceil(error.detail.lowest_cloud_cover + 5)}% & Repetir
                    </button>
                  )}
                  <button
                    onClick={() => runAnalysis(lat, lon)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Repetir</span>
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
            onRequestPdfProUpgrade={() => {
              setPricingReason('pdf_unlock');
              setIsPricingOpen(true);
            }}
          />
        ) : null}
      </div>

      {/* Pricing & Monetization Modal (Whop) */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        reason={pricingReason}
      />

      {/* Interactive Agricultural ROI Calculator Modal */}
      <RoiCalculatorModal
        isOpen={isRoiOpen}
        onClose={() => setIsRoiOpen(false)}
      />
    </div>
  );
}
