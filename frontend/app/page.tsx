'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { MapWrapper } from '../components/MapWrapper';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { LoadingState } from '../components/LoadingState';
import { PricingModal } from '../components/PricingModal';
import { ParcelUploader } from '../components/ParcelUploader';
import { FarmSettingsModal } from '../components/FarmSettingsModal';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import { ScoutingModal } from '../components/ScoutingModal';
import { FieldBookModal } from '../components/FieldBookModal';
import { HistoricalComparatorModal } from '../components/HistoricalComparatorModal';
import { RoiCalculatorModal } from '../components/RoiCalculatorModal';
import { DiseaseRiskAssessment } from '../lib/disease/epidemiology';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
  TractorPrescriptionMap,
} from '../lib/types';
import { analyzeVegetation, checkHealth, fetchTimeSeries } from '../lib/api';
import { reverseGeocode } from '../lib/geocoding';
import { generateTractorPrescriptionMap } from '../lib/prescription';
import {
  loadFarms,
  saveFarms,
  getActiveFarmId,
  setActiveFarmId,
  FarmModel,
  ParcelModel,
} from '../lib/gis/parcelStorage';
import { syncParcelToSupabase, syncFarmToSupabase } from '../lib/supabaseService';
import {
  loadScoutingRecords,
  saveScoutingRecord,
  deleteScoutingRecord,
  ScoutingRecord,
} from '../lib/scouting/scoutingStore';
import {
  calculateIrrigationSchedule,
  CropType,
  IrrigationType,
  TrainingSystem,
} from '../lib/irrigation/fao56';
import { fetchAgroClimate } from '../lib/weather/openMeteo';
import { generateAgronomicPdfReport } from '../lib/report/pdfReport';
import { Language, translations } from '../lib/i18n';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  // 1. Language & Localization State
  const [lang, setLang] = useState<Language>('pt');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('cropvision_lang') as Language;
      if (savedLang === 'en' || savedLang === 'pt') {
        setLang(savedLang);
      }
    } catch {
      // Ignore storage errors in SSR / private mode
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('cropvision_lang', newLang);
    } catch {
      // Ignore storage errors
    }
  };

  const t = translations[lang] || translations.pt;

  // 2. Theme State: Dark Tech vs Modo Campo (Light Field Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cropvision_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('cropvision_theme', next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // 3. Commercial Quota & Web Summit Pitch Mode State
  const [isWebSummitMode, setIsWebSummitMode] = useState<boolean>(true);
  const [dailyUsage, setDailyUsage] = useState<number>(0);

  const getTodayQuotaKey = () => `cropvision_usage_${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('cropvision_mode');
      if (savedMode === 'standard') {
        setIsWebSummitMode(false);
      } else {
        setIsWebSummitMode(true);
      }

      const todayKey = getTodayQuotaKey();
      const count = parseInt(localStorage.getItem(todayKey) || '0', 10);
      setDailyUsage(isNaN(count) ? 0 : count);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleWebSummitMode = () => {
    setIsWebSummitMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cropvision_mode', next ? 'websummit' : 'standard');
      } catch {
        // Ignore
      }
      return next;
    });
  };

  /**
   * Checks whether the user is allowed to perform an analysis.
   * In Web Summit Mode: Unlimited (always returns true).
   * In Standard Mode: Max 3 daily analyses. If exceeded (>=3), triggers Pricing Modal & Whop redirect.
   */
  const checkAndIncrementQuota = (): boolean => {
    if (isWebSummitMode) {
      return true;
    }

    try {
      const todayKey = getTodayQuotaKey();
      const current = parseInt(localStorage.getItem(todayKey) || '0', 10) || 0;
      if (current >= 3) {
        setPricingReason('limit_reached');
        setIsPricingOpen(true);
        return false;
      }

      const next = current + 1;
      localStorage.setItem(todayKey, next.toString());
      setDailyUsage(next);
      return true;
    } catch {
      return true;
    }
  };

  // 4. Farms & Active Parcel State
  const [farms, setFarms] = useState<FarmModel[]>([]);
  const [activeFarmId, setActiveFarmIdState] = useState<string>('farm-esporao');
  const [activeParcel, setActiveParcel] = useState<ParcelModel | null>(null);

  // 5. Map Navigation & Target State
  const [lat, setLat] = useState<number>(38.3842);
  const [lon, setLon] = useState<number>(-7.5519);
  const [zoom, setZoom] = useState<number>(14);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][] | null>(null);
  const [locationName, setLocationName] = useState<string | null>('Herdade do Esporão, Alentejo, Portugal');

  // Interactive Polygon Drawing Mode
  const [isDrawingModeActive, setIsDrawingModeActive] = useState<boolean>(false);

  // 6. Crop & Agronomic Metadata
  const [cropType, setCropType] = useState<CropType>('vinha');
  const [trainingSystem, setTrainingSystem] = useState<TrainingSystem>('intensivo');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('gota-a-gota');
  const [agronomistName, setAgronomistName] = useState<string>('Eng. Agrónomo Miguel Silva');
  const [licenseNumber, setLicenseNumber] = useState<string>('OE-AGR-49120');

  // 7. Scouting State
  const [scoutingRecords, setScoutingRecords] = useState<ScoutingRecord[]>([]);
  const [isScoutingModeActive, setIsScoutingModeActive] = useState<boolean>(false);
  const [scoutingModalCoord, setScoutingModalCoord] = useState<{ lat: number; lon: number } | null>(null);

  // 8. System & API State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeSeriesPoint[] | null>(null);
  const [error, setError] = useState<{ message: string; detail?: any } | null>(null);

  // 9. Modals & Gating State
  const [isParcelUploaderOpen, setIsParcelUploaderOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isFieldBookOpen, setIsFieldBookOpen] = useState<boolean>(false);
  const [fieldBookPhytoPrefill, setFieldBookPhytoPrefill] = useState<any>(null);
  const [fieldBookFertPrefill, setFieldBookFertPrefill] = useState<any>(null);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [pricingReason, setPricingReason] = useState<'limit_reached' | 'pdf_unlock' | 'vra_unlock' | 'generic'>('generic');
  const [isProSimulated, setIsProSimulated] = useState<boolean>(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [isRoiModalOpen, setIsRoiModalOpen] = useState<boolean>(false);
  const [auditToastMessage, setAuditToastMessage] = useState<string | null>(null);

  const handleShareAudit = useCallback(() => {
    try {
      const pId = activeParcel?.id || 'parcel-1';
      const token = `cv_sec_${Math.random().toString(36).substring(2, 10)}`;
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/audit/${pId}?token=${token}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      setAuditToastMessage(
        lang === 'en'
          ? 'Public Read-Only Audit Link copied to clipboard!'
          : 'Link de Auditoria Pública copiado para a área de transferência!'
      );
      setTimeout(() => setAuditToastMessage(null), 3500);
    } catch {
      setAuditToastMessage('Erro ao copiar link de auditoria');
      setTimeout(() => setAuditToastMessage(null), 3000);
    }
  }, [activeParcel, lang]);

  // Load Initial Farms and Scouting Records
  useEffect(() => {
    const loadedFarms = loadFarms();
    setFarms(loadedFarms);

    const activeFId = getActiveFarmId();
    setActiveFarmIdState(activeFId);

    const initialFarm = loadedFarms.find((f) => f.id === activeFId) || loadedFarms[0];
    if (initialFarm && initialFarm.parcels.length > 0) {
      const initialP = initialFarm.parcels[0];
      setActiveParcel(initialP);
      setLat(initialP.center[0]);
      setLon(initialP.center[1]);
      setCurrentPolygon(initialP.polygon);
      setCropType(initialP.cropType);
      setTrainingSystem(initialP.trainingSystem);
      setIrrigationType(initialP.irrigationType);
      setLocationName(`${initialFarm.name} - ${initialP.name}`);
    }

    setScoutingRecords(loadScoutingRecords());
  }, []);

  // Check API health on mount
  useEffect(() => {
    checkHealth()
      .then((res) => setApiHealthy(res.status === 'healthy'))
      .catch(() => setApiHealthy(false));
  }, []);

  // Analysis Runner
  const runAnalysis = useCallback(
    async (targetLat: number, targetLon: number, customHectares?: number, bypassQuotaCheck = false) => {
      if (!bypassQuotaCheck && !checkAndIncrementQuota()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await analyzeVegetation({
          lat: targetLat,
          lon: targetLon,
          max_cloud_cover: 25.0,
          buffer_meters: 500.0,
        });

        if (customHectares && data.prescription_map) {
          data.prescription_map = generateTractorPrescriptionMap(
            data.location_name || (lang === 'en' ? 'Agricultural Parcel' : 'Parcela Agrícola'),
            data.ndvi.mean,
            customHectares
          );
          data.polygon_area_hectares = customHectares;
        }

        setAnalysisData(data);

        // Fetch historical time series in parallel
        try {
          const ts = await fetchTimeSeries(targetLat, targetLon, 40);
          setTimeseriesData(ts.series);
        } catch {
          setTimeseriesData(null);
        }
      } catch (err: any) {
        console.error('Analysis error:', err);
        setError({
          message: err.message || (lang === 'en' ? 'Error processing satellite telemetry.' : 'Erro ao processar dados de satélite.'),
          detail: err.data,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isWebSummitMode, lang]
  );

  // Trigger initial analysis when coordinate is set (allow initial load without quota deduction)
  useEffect(() => {
    runAnalysis(lat, lon, activeParcel?.areaHectares || 28.5, true);
  }, []);

  // Farm Selector Handler
  const handleSelectFarm = (farmId: string) => {
    if (!isWebSummitMode && dailyUsage >= 3) {
      setPricingReason('limit_reached');
      setIsPricingOpen(true);
      return;
    }

    setActiveFarmIdState(farmId);
    setActiveFarmId(farmId);

    const farm = farms.find((f) => f.id === farmId);
    if (farm && farm.parcels.length > 0) {
      const p = farm.parcels[0];
      setActiveParcel(p);
      setLat(p.center[0]);
      setLon(p.center[1]);
      setCurrentPolygon(p.polygon);
      setCropType(p.cropType);
      setTrainingSystem(p.trainingSystem);
      setIrrigationType(p.irrigationType);
      setLocationName(`${farm.name} - ${p.name}`);
      runAnalysis(p.center[0], p.center[1], p.areaHectares);
    }
  };

  // Map Click Coordinate Selection Handler (When NOT in scouting/drawing mode)
  const handleSelectCoordinate = useCallback(
    (clickedLat: number, clickedLon: number) => {
      if (!isWebSummitMode && dailyUsage >= 3) {
        setPricingReason('limit_reached');
        setIsPricingOpen(true);
        return;
      }

      setLat(clickedLat);
      setLon(clickedLon);
      reverseGeocode(clickedLat, clickedLon).then((geo) => {
        setLocationName(geo.formatted);
      });
      runAnalysis(clickedLat, clickedLon, activeParcel?.areaHectares);
    },
    [runAnalysis, activeParcel, isWebSummitMode, dailyUsage]
  );

  // Map Click Handler in Scouting Mode
  const handleScoutMapClick = (scoutLat: number, scoutLon: number) => {
    setScoutingModalCoord({ lat: scoutLat, lon: scoutLon });
    setIsScoutingModeActive(false);
  };

  // Save new scouting observation
  const handleSaveScoutingRecord = (rec: Omit<ScoutingRecord, 'id' | 'date'>) => {
    const created = saveScoutingRecord(rec);
    setScoutingRecords((prev) => [created, ...prev]);
  };

  // Delete scouting record
  const handleDeleteScoutingRecord = (id: string) => {
    const updated = deleteScoutingRecord(id);
    setScoutingRecords(updated);
  };

  // Custom Uploaded Parcel Handler (from Shapefile, GeoJSON or KML)
  const handleCustomParcelLoaded = (
    polygon: [number, number][],
    centerLat: number,
    centerLon: number,
    areaHectares: number,
    name: string
  ) => {
    if (!isWebSummitMode && dailyUsage >= 3) {
      setPricingReason('limit_reached');
      setIsPricingOpen(true);
      return;
    }

    const newParcel: ParcelModel = {
      id: `parcel-${Date.now()}`,
      name,
      farmId: activeFarmId,
      cropType,
      trainingSystem,
      irrigationType,
      areaHectares,
      center: [centerLat, centerLon],
      polygon,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updatedFarms = farms.map((f) => {
      if (f.id === activeFarmId) {
        return { ...f, parcels: [newParcel, ...f.parcels] };
      }
      return f;
    });

    setFarms(updatedFarms);
    saveFarms(updatedFarms);
    // Transparently persist to Supabase if configured
    syncParcelToSupabase(newParcel, activeFarmId).catch(() => {});
    setActiveParcel(newParcel);

    setCurrentPolygon(polygon);
    setLat(centerLat);
    setLon(centerLon);
    setLocationName(`${farms.find((f) => f.id === activeFarmId)?.name || 'Herdade'} - ${name}`);
    runAnalysis(centerLat, centerLon, areaHectares);
  };

  // Polygon Created from Interactive Map Drawing
  const handlePolygonDrawn = (
    polygon: [number, number][],
    areaHectares: number,
    centerLat: number,
    centerLon: number
  ) => {
    const parcelCount = (farms.find((f) => f.id === activeFarmId)?.parcels.length || 0) + 1;
    const drawnName = lang === 'en' ? `Field ${parcelCount} (Drawn)` : `Talhão ${parcelCount} (Desenhado)`;
    handleCustomParcelLoaded(polygon, centerLat, centerLon, areaHectares, drawnName);
    setIsDrawingModeActive(false);
  };

  // Save Farm Settings & White-Label Profile
  const handleSaveSettings = (updated: {
    farmName: string;
    parcelName: string;
    cropType: CropType;
    trainingSystem: TrainingSystem;
    irrigationType: IrrigationType;
    agronomistName: string;
    licenseNumber: string;
    companyName?: string;
    taxId?: string;
    cadastralAddress?: string;
    customLogoUrl?: string;
  }) => {
    setCropType(updated.cropType);
    setTrainingSystem(updated.trainingSystem);
    setIrrigationType(updated.irrigationType);
    setAgronomistName(updated.agronomistName);
    setLicenseNumber(updated.licenseNumber);

    const updatedFarms = farms.map((f) => {
      if (f.id === activeFarmId) {
        return {
          ...f,
          name: updated.farmName,
          companyName: updated.companyName,
          taxId: updated.taxId,
          cadastralAddress: updated.cadastralAddress,
          customLogoUrl: updated.customLogoUrl,
          agronomistName: updated.agronomistName,
          agronomistLicense: updated.licenseNumber,
          parcels: f.parcels.map((p) => {
            if (p.id === activeParcel?.id) {
              return {
                ...p,
                name: updated.parcelName,
                cropType: updated.cropType,
                trainingSystem: updated.trainingSystem,
                irrigationType: updated.irrigationType,
              };
            }
            return p;
          }),
        };
      }
      return f;
    });

    setFarms(updatedFarms);
    saveFarms(updatedFarms);

    // Sync updated farm metadata to Supabase
    const activeFarmObj = updatedFarms.find((f) => f.id === activeFarmId);
    if (activeFarmObj) {
      syncFarmToSupabase(activeFarmObj).catch(() => {});
    }
  };

  // Export Agronomic Technical PDF Report
  const handleExportPdf = async () => {
    if (!analysisData) return;

    const prescription =
      analysisData.prescription_map ||
      generateTractorPrescriptionMap(
        activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão Agrícola'),
        analysisData.ndvi.mean,
        analysisData.polygon_area_hectares || 28.5
      );

    const irrigation = calculateIrrigationSchedule(
      analysisData.ndvi.mean,
      4.2,
      analysisData.polygon_area_hectares || 28.5,
      cropType,
      irrigationType,
      trainingSystem
    );

    let climateData = null;
    try {
      climateData = await fetchAgroClimate(lat, lon);
    } catch {
      // Ignore if offline
    }

    const currentFarm = farms.find((f) => f.id === activeFarmId) || farms[0];

    await generateAgronomicPdfReport({
      analysisData,
      prescription,
      irrigation,
      scoutingRecords,
      farmName: currentFarm?.name || (lang === 'en' ? 'Esporão Estate' : 'Herdade Monte Novo'),
      parcelName: activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão 1'),
      companyName: currentFarm?.companyName,
      taxId: currentFarm?.taxId,
      cadastralAddress: currentFarm?.cadastralAddress,
      customLogoUrl: currentFarm?.customLogoUrl,
      cropName: irrigation.crop.name,
      trainingSystem:
        trainingSystem === 'superintensivo'
          ? (lang === 'en' ? 'Super-intensive (4x1.5m)' : 'Superintensivo (4x1.5m)')
          : trainingSystem === 'tradicional'
          ? (lang === 'en' ? 'Traditional / Rainfed' : 'Tradicional / Sequeiro')
          : (lang === 'en' ? 'Intensive (7x5m)' : 'Intensivo (7x5m)'),
      irrigationType:
        irrigationType === 'pivot'
          ? (lang === 'en' ? 'Center Pivot / Sprinkler' : 'Pivot Central / Aspersão')
          : irrigationType === 'sequeiro'
          ? (lang === 'en' ? 'Rainfed (No Irrigation)' : 'Sequeiro (Sem Rega)')
          : (lang === 'en' ? 'Drip Irrigation' : 'Gota-a-gota (Drip)'),
      agronomistName,
      licenseNumber,
      polygon: currentPolygon || activeParcel?.polygon,
      agroClimate: climateData,
      lang,
    });
  };

  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors ${
        theme === 'light' ? 'theme-light bg-[#f8fafc]' : 'bg-[#070b14]'
      }`}
    >
      {/* 1. TOP HEADER NAVBAR */}
      <Navbar
        apiHealthy={apiHealthy}
        lat={lat}
        lon={lon}
        locationName={locationName}
        farms={farms}
        activeFarmId={activeFarmId}
        lang={lang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLanguageChange={handleLanguageChange}
        onSelectFarm={handleSelectFarm}
        isDrawingModeActive={isDrawingModeActive}
        onToggleDrawingMode={() => setIsDrawingModeActive(!isDrawingModeActive)}
        onOpenPricing={() => {
          setPricingReason('generic');
          setIsPricingOpen(true);
        }}
        onOpenParcelUploader={() => setIsParcelUploaderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFieldBook={() => setIsFieldBookOpen(true)}
        onOpenComparator={() => setIsComparatorOpen(true)}
        onOpenRoi={() => setIsRoiModalOpen(true)}
        onShareAudit={handleShareAudit}
        onExportPdf={handleExportPdf}
        activeAnomaliesCount={3}
      />

      {/* 2. MAIN FULL-SCREEN LEAFLET MAP */}
      <main className="absolute inset-0 top-16 z-0">
        <MapWrapper
          lat={lat}
          lon={lon}
          zoom={zoom}
          bbox={analysisData?.bbox}
          polygon={currentPolygon}
          scoutingRecords={scoutingRecords}
          isScoutingModeActive={isScoutingModeActive}
          isDrawingModeActive={isDrawingModeActive}
          onToggleDrawingMode={() => setIsDrawingModeActive(!isDrawingModeActive)}
          onPolygonCreated={handlePolygonDrawn}
          lang={lang}
          theme={theme}
          onToggleScoutingMode={() => setIsScoutingModeActive(!isScoutingModeActive)}
          onSelectCoordinate={handleSelectCoordinate}
          onScoutCoordinateClick={handleScoutMapClick}
          onDeleteScoutingRecord={handleDeleteScoutingRecord}
        />
      </main>

      {/* 3. LOADING INDICATOR */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <LoadingState lat={lat} lon={lon} />
        </div>
      )}

      {/* 4. ERROR BANNER */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 max-w-md p-3.5 rounded-2xl bg-red-950/90 border border-red-500/80 text-red-200 text-xs flex items-center space-x-2.5 shadow-2xl backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{lang === 'en' ? 'Satellite Telemetry Processing Failure' : 'Falha no Processamento Satélite'}</p>
            <p className="text-[11px] text-red-300 mt-0.5">{error.message}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5. ANALYSIS & DEEP-TECH SIDE PANEL */}
      {analysisData && (
        <AnalysisPanel
          data={analysisData}
          timeseries={timeseriesData}
          lang={lang}
          theme={theme}
          cropType={cropType}
          trainingSystem={trainingSystem}
          irrigationType={irrigationType}
          farmName={activeFarm?.name}
          parcelName={activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão 1')}
          isProSimulated={isProSimulated}
          onRequirePro={(reason) => {
            setPricingReason(reason as any);
            setIsPricingOpen(true);
          }}
          onExportPdf={handleExportPdf}
          onOpenComparator={() => setIsComparatorOpen(true)}
          onOpenRoi={() => setIsRoiModalOpen(true)}
          onShareAudit={handleShareAudit}
          onOpenScoutingAtCoord={(scoutLat, scoutLon) => {
            setScoutingModalCoord({ lat: scoutLat, lon: scoutLon });
          }}
          onLogTreatmentToFieldBook={(disease) => {
            setFieldBookPhytoPrefill({
              commercialProduct: disease.recommendedActiveIngredients[0]
                ? `Tratamento ${disease.name.split(' ')[0]}`
                : 'Fungicida Homologado',
              homologationNumber: 'APV n.º 3624',
              activeSubstance: disease.recommendedActiveIngredients.join(', '),
              targetOrganism: `${disease.name} (${disease.scientificName})`,
              dose: 2.0,
              unit: 'kg/ha',
              sprayVolumeLHa: 400,
              safetyIntervalDays: 14,
              operatorNotes: `Aplicação recomendada pelo Modelo Epidemiológico CropVision (Índice de Risco: ${disease.riskScore}% - ${disease.statusLabel}). ${disease.sprayRecommendation}`,
            });
            setIsFieldBookOpen(true);
          }}
        />
      )}

      {/* 6. MODALS */}
      {/* Parcel Uploader (Shapefile .zip, GeoJSON, KML + Interactive Draw) */}
      <ParcelUploader
        isOpen={isParcelUploaderOpen}
        onClose={() => setIsParcelUploaderOpen(false)}
        lang={lang}
        theme={theme}
        onStartDrawing={() => setIsDrawingModeActive(true)}
        onSelectParcel={handleCustomParcelLoaded}
      />

      {/* Farm & Agronomic Settings Modal (with White-Labeling Profile) */}
      <FarmSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        theme={theme}
        onLanguageChange={handleLanguageChange}
        isWebSummitMode={isWebSummitMode}
        onToggleWebSummitMode={handleToggleWebSummitMode}
        farmName={activeFarm?.name || (lang === 'en' ? 'Esporão Estate' : 'Herdade Monte Novo')}
        parcelName={activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão 1')}
        cropType={cropType}
        trainingSystem={trainingSystem}
        irrigationType={irrigationType}
        agronomistName={agronomistName}
        licenseNumber={licenseNumber}
        companyName={activeFarm?.companyName}
        taxId={activeFarm?.taxId}
        cadastralAddress={activeFarm?.cadastralAddress}
        customLogoUrl={activeFarm?.customLogoUrl}
        onSave={handleSaveSettings}
      />

      {/* Official Digital Field Book Modal (DGAV / IFAP / PAC 2023-2027) */}
      <FieldBookModal
        isOpen={isFieldBookOpen}
        onClose={() => {
          setIsFieldBookOpen(false);
          setFieldBookPhytoPrefill(null);
          setFieldBookFertPrefill(null);
        }}
        farmName={activeFarm?.name || (lang === 'en' ? 'Esporão Estate' : 'Herdade Monte Novo')}
        parcelName={activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão 1')}
        cropName={
          cropType === 'vinha'
            ? lang === 'en' ? 'Vineyard' : 'Vinha (Aragonez)'
            : cropType === 'olival'
            ? lang === 'en' ? 'Olive Grove' : 'Olival (Cobrançosa)'
            : cropType === 'amendoal'
            ? lang === 'en' ? 'Almond Grove' : 'Amendoal'
            : cropType === 'milho'
            ? lang === 'en' ? 'Corn' : 'Milho'
            : lang === 'en' ? 'Pasture' : 'Pradaria'
        }
        companyName={activeFarm?.companyName}
        taxId={activeFarm?.taxId}
        cadastralAddress={activeFarm?.cadastralAddress}
        agronomistName={agronomistName}
        licenseNumber={licenseNumber}
        customLogoUrl={activeFarm?.customLogoUrl}
        lang={lang}
        theme={theme}
        initialPhytoPrefill={fieldBookPhytoPrefill}
        initialFertPrefill={fieldBookFertPrefill}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        lang={lang}
        onFocusAnomaly={() => {
          if (activeParcel) {
            setLat(activeParcel.center[0]);
            setLon(activeParcel.center[1]);
          }
        }}
      />

      {/* Scouting Point Registration Modal */}
      {scoutingModalCoord && (
        <ScoutingModal
          isOpen={!!scoutingModalCoord}
          lat={scoutingModalCoord.lat}
          lon={scoutingModalCoord.lon}
          lang={lang}
          onClose={() => setScoutingModalCoord(null)}
          onSave={handleSaveScoutingRecord}
        />
      )}

      {/* Enterprise Plans & Pricing Modal with Whop Integration */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        lang={lang}
        reason={pricingReason}
        isWebSummitMode={isWebSummitMode}
        onToggleWebSummitMode={handleToggleWebSummitMode}
        dailyUsageCount={dailyUsage}
      />

      {/* Sentinel-2 Historical Split-Comparator Modal */}
      <HistoricalComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        parcelName={activeParcel?.name || (lang === 'en' ? 'Field 1' : 'Talhão 1')}
        farmName={activeFarm?.name || (lang === 'en' ? 'Esporão Estate' : 'Herdade Monte Novo')}
        currentNdvi={analysisData?.ndvi?.mean || 0.74}
        timeseries={timeseriesData}
        coordinates={{ lat, lon }}
        lang={lang}
        theme={theme}
      />

      {/* Dynamic ROI & Carbon Calculator Modal */}
      <RoiCalculatorModal
        isOpen={isRoiModalOpen}
        onClose={() => setIsRoiModalOpen(false)}
        initialHectares={analysisData?.polygon_area_hectares || activeParcel?.areaHectares || 250}
        cropType={cropType}
        lang={lang}
      />

      {/* Public Audit Toast Notification */}
      {auditToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950 border border-emerald-500/70 text-emerald-200 text-xs font-bold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{auditToastMessage}</span>
        </div>
      )}
    </div>
  );
}
