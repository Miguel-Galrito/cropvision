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
import { generateAgronomicPdfReport } from '../lib/report/pdfReport';
import { AlertTriangle, Crosshair, MapPin, Play, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  // Farms & Active Parcel State
  const [farms, setFarms] = useState<FarmModel[]>([]);
  const [activeFarmId, setActiveFarmIdState] = useState<string>('farm-esporao');
  const [activeParcel, setActiveParcel] = useState<ParcelModel | null>(null);

  // Map Navigation & Target State
  const [lat, setLat] = useState<number>(38.3842);
  const [lon, setLon] = useState<number>(-7.5519);
  const [zoom, setZoom] = useState<number>(14);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][] | null>(null);
  const [locationName, setLocationName] = useState<string | null>('Herdade do Esporão, Alentejo, Portugal');

  // Crop & Agronomic Metadata
  const [cropType, setCropType] = useState<CropType>('vinha');
  const [trainingSystem, setTrainingSystem] = useState<TrainingSystem>('intensivo');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('gota-a-gota');
  const [agronomistName, setAgronomistName] = useState<string>('Eng. Agrónomo Miguel Silva');
  const [licenseNumber, setLicenseNumber] = useState<string>('OE-AGR-49120');

  // Scouting State
  const [scoutingRecords, setScoutingRecords] = useState<ScoutingRecord[]>([]);
  const [isScoutingModeActive, setIsScoutingModeActive] = useState<boolean>(false);
  const [scoutingModalCoord, setScoutingModalCoord] = useState<{ lat: number; lon: number } | null>(null);

  // System & API State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeSeriesPoint[] | null>(null);
  const [error, setError] = useState<{ message: string; detail?: any } | null>(null);

  // Modals & Gating State
  const [isParcelUploaderOpen, setIsParcelUploaderOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [pricingReason, setPricingReason] = useState<'limit_reached' | 'pdf_unlock' | 'vra_unlock' | 'generic'>('generic');
  const [isProSimulated, setIsProSimulated] = useState<boolean>(false);

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
    async (targetLat: number, targetLon: number, customHectares?: number) => {
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
            data.location_name || 'Parcela Agrícola',
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
          message: err.message || 'Erro ao processar dados de satélite.',
          detail: err.data,
        });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger initial analysis when coordinate is set
  useEffect(() => {
    runAnalysis(lat, lon, activeParcel?.areaHectares || 28.5);
  }, []);

  // Farm Selector Handler
  const handleSelectFarm = (farmId: string) => {
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

  // Map Click Coordinate Selection Handler (When NOT in scouting mode)
  const handleSelectCoordinate = useCallback(
    (clickedLat: number, clickedLon: number) => {
      setLat(clickedLat);
      setLon(clickedLon);
      reverseGeocode(clickedLat, clickedLon).then((geo) => {
        setLocationName(geo.formatted);
      });
      runAnalysis(clickedLat, clickedLon, activeParcel?.areaHectares);
    },
    [runAnalysis, activeParcel]
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
    setActiveParcel(newParcel);

    setCurrentPolygon(polygon);
    setLat(centerLat);
    setLon(centerLon);
    setLocationName(`${farms.find((f) => f.id === activeFarmId)?.name || 'Herdade'} - ${name}`);
    runAnalysis(centerLat, centerLon, areaHectares);
  };

  // Save Farm Settings
  const handleSaveSettings = (updated: {
    farmName: string;
    parcelName: string;
    cropType: CropType;
    trainingSystem: TrainingSystem;
    irrigationType: IrrigationType;
    agronomistName: string;
    licenseNumber: string;
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
  };

  // Export Agronomic Technical PDF Report
  const handleExportPdf = async () => {
    if (!analysisData) return;

    const prescription =
      analysisData.prescription_map ||
      generateTractorPrescriptionMap(
        activeParcel?.name || 'Talhão Agrícola',
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

    await generateAgronomicPdfReport({
      analysisData,
      prescription,
      irrigation,
      scoutingRecords,
      farmName: farms.find((f) => f.id === activeFarmId)?.name || 'Herdade Monte Novo',
      parcelName: activeParcel?.name || 'Talhão 1',
      cropName: irrigation.crop.name,
      trainingSystem:
        trainingSystem === 'superintensivo'
          ? 'Superintensivo (4x1.5m)'
          : trainingSystem === 'tradicional'
          ? 'Tradicional / Sequeiro'
          : 'Intensivo (7x5m)',
      irrigationType:
        irrigationType === 'pivot'
          ? 'Pivot Central / Aspersão'
          : irrigationType === 'sequeiro'
          ? 'Sequeiro (Sem Rega)'
          : 'Gota-a-gota (Drip)',
      agronomistName,
      licenseNumber,
    });
  };

  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] select-none">
      {/* 1. TOP HEADER NAVBAR */}
      <Navbar
        apiHealthy={apiHealthy}
        lat={lat}
        lon={lon}
        locationName={locationName}
        farms={farms}
        activeFarmId={activeFarmId}
        onSelectFarm={handleSelectFarm}
        onOpenPricing={() => {
          setPricingReason('generic');
          setIsPricingOpen(true);
        }}
        onOpenParcelUploader={() => setIsParcelUploaderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
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
            <p className="font-bold">Falha no Processamento Satélite</p>
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
          cropType={cropType}
          trainingSystem={trainingSystem}
          irrigationType={irrigationType}
          farmName={activeFarm?.name}
          parcelName={activeParcel?.name || 'Talhão 1'}
          isProSimulated={isProSimulated}
          onRequirePro={(reason) => {
            setPricingReason(reason as any);
            setIsPricingOpen(true);
          }}
          onExportPdf={handleExportPdf}
          onOpenScoutingAtCoord={(scoutLat, scoutLon) => {
            setScoutingModalCoord({ lat: scoutLat, lon: scoutLon });
          }}
        />
      )}

      {/* 6. MODALS */}
      {/* Parcel Uploader (Shapefile .zip, GeoJSON, KML) */}
      <ParcelUploader
        isOpen={isParcelUploaderOpen}
        onClose={() => setIsParcelUploaderOpen(false)}
        onSelectParcel={handleCustomParcelLoaded}
      />

      {/* Farm & Agronomic Settings Modal */}
      <FarmSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        farmName={activeFarm?.name || 'Herdade Monte Novo'}
        parcelName={activeParcel?.name || 'Talhão 1'}
        cropType={cropType}
        trainingSystem={trainingSystem}
        irrigationType={irrigationType}
        agronomistName={agronomistName}
        licenseNumber={licenseNumber}
        onSave={handleSaveSettings}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
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
          onClose={() => setScoutingModalCoord(null)}
          onSave={handleSaveScoutingRecord}
        />
      )}

      {/* B2B Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        reason={pricingReason}
        isProSimulated={isProSimulated}
        onToggleProSimulation={() => setIsProSimulated(!isProSimulated)}
      />
    </div>
  );
}
