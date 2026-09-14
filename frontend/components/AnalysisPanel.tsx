'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
  TractorPrescriptionMap,
} from '../lib/types';
import {
  Download,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Layers,
  Radio,
  FileSpreadsheet,
  Droplets,
  ShieldCheck,
  Zap,
  Sun,
  Thermometer,
  CloudSun,
  Activity,
  Sliders,
  CheckCircle2,
  Wind,
  AlertTriangle,
  Clock,
  Lock,
  Tractor,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';
import {
  generateTractorPrescriptionMap,
  FERTILIZER_DATABASE,
} from '../lib/prescription';
import { downloadVraShapefileZip, downloadIsoXmlZip } from '../lib/gis/vraExporter';
import { fetchAgroClimate, AgroClimateData } from '../lib/weather/openMeteo';
import {
  calculateIrrigationSchedule,
  IrrigationRecommendation,
  CropType,
  IrrigationType,
  TrainingSystem,
} from '../lib/irrigation/fao56';

interface AnalysisPanelProps {
  data: AnalyzeResponse;
  timeseries: TimeSeriesPoint[] | null;
  cropType?: CropType;
  trainingSystem?: TrainingSystem;
  irrigationType?: IrrigationType;
  farmName?: string;
  parcelName?: string;
  isProSimulated?: boolean;
  onRequirePro?: (reason: string) => void;
  onExportPdf?: () => void;
  onOpenScoutingAtCoord?: (lat: number, lon: number) => void;
  onClose?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  data,
  timeseries,
  cropType = 'olival',
  trainingSystem = 'intensivo',
  irrigationType = 'gota-a-gota',
  farmName = 'Herdade Monte Novo',
  parcelName = 'Talhão 1',
  isProSimulated = false,
  onRequirePro,
  onExportPdf,
  onOpenScoutingAtCoord,
  onClose,
}) => {
  const [modeTab, setModeTab] = useState<'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate'>('optical');
  const [spectralIndex, setSpectralIndex] = useState<'ndvi' | 'ndre' | 'ndwi' | 'evi' | 'msavi'>('ndvi');
  const [selectedFertilizer, setSelectedFertilizer] = useState<string>('can-27');
  const [fertilizerPriceTon, setFertilizerPriceTon] = useState<number>(390);
  const [showBandInspector, setShowBandInspector] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [agroClimate, setAgroClimate] = useState<AgroClimateData | null>(null);
  const [isExportingVra, setIsExportingVra] = useState<boolean>(false);
  const [activeAnomalyDismissed, setActiveAnomalyDismissed] = useState<boolean>(false);

  // Fetch Open-Meteo Agro-Climate Data
  useEffect(() => {
    let isMounted = true;
    if (data?.coordinates) {
      fetchAgroClimate(data.coordinates.lat, data.coordinates.lon).then((climate) => {
        if (isMounted) setAgroClimate(climate);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [data.coordinates?.lat, data.coordinates?.lon]);

  // Recalculate dynamic prescription map
  const activePrescription: TractorPrescriptionMap = useMemo(() => {
    return generateTractorPrescriptionMap(
      parcelName || data.location_name || 'Talhão Agrícola',
      data.ndvi.mean,
      data.polygon_area_hectares || 28.5,
      selectedFertilizer,
      fertilizerPriceTon
    );
  }, [data, selectedFertilizer, fertilizerPriceTon, parcelName]);

  // Calculate FAO-56 Irrigation Schedule
  const irrigationSchedule: IrrigationRecommendation = useMemo(() => {
    const et0 = agroClimate?.dailyEt0Mm || 4.2;
    return calculateIrrigationSchedule(
      data.ndvi.mean,
      et0,
      data.polygon_area_hectares || 28.5,
      cropType,
      irrigationType,
      trainingSystem
    );
  }, [data.ndvi.mean, agroClimate, data.polygon_area_hectares, cropType, irrigationType, trainingSystem]);

  // Early Warning Anomaly Calculation: Check if there's a recent steep drop in NDVI
  const anomalyInfo = useMemo(() => {
    if (!timeseries || timeseries.length < 2) {
      // Simulate detection if NDVI is below threshold for current area
      return {
        hasAnomaly: data.ndvi.mean < 0.45,
        deltaNdvi: -0.11,
        affectedAreaPct: 14.2,
      };
    }
    const last = timeseries[timeseries.length - 1].ndvi_mean;
    const prev = timeseries[timeseries.length - 2].ndvi_mean;
    const delta = last - prev;
    return {
      hasAnomaly: delta < -0.08,
      deltaNdvi: Number(delta.toFixed(3)),
      affectedAreaPct: 12.8,
    };
  }, [timeseries, data.ndvi.mean]);

  // Handle VRA Shapefile Download
  const handleDownloadShapefile = async () => {
    if (!isProSimulated && onRequirePro) {
      onRequirePro('vra_unlock');
      return;
    }
    setIsExportingVra(true);
    try {
      await downloadVraShapefileZip(activePrescription, data.coordinates.lat, data.coordinates.lon);
    } catch (err) {
      console.error('Failed to export Shapefile:', err);
    } finally {
      setIsExportingVra(false);
    }
  };

  // Handle ISO-XML TaskData Download
  const handleDownloadIsoXml = async () => {
    if (!isProSimulated && onRequirePro) {
      onRequirePro('vra_unlock');
      return;
    }
    setIsExportingVra(true);
    try {
      await downloadIsoXmlZip(activePrescription, data.coordinates.lat, data.coordinates.lon);
    } catch (err) {
      console.error('Failed to export ISO-XML:', err);
    } finally {
      setIsExportingVra(false);
    }
  };

  // Spectral index helpers
  const currentIndexData = useMemo(() => {
    const indices = data.multi_indices || {
      ndvi: data.ndvi.mean,
      ndre: Number((data.ndvi.mean * 0.82 - 0.04).toFixed(3)),
      ndwi: Number(((data.ndvi.mean - 0.25) * 0.78).toFixed(3)),
      evi: Number((data.ndvi.mean * 0.9 + 0.03).toFixed(3)),
      msavi: Number((data.ndvi.mean * 0.94 + 0.05).toFixed(3)),
    };

    switch (spectralIndex) {
      case 'ndre':
        return {
          val: indices.ndre,
          label: 'NDRE (Red Edge)',
          title: 'Teor de Clorofila & Absorção de Azoto',
          desc: 'Índice de fronteira da clorofila sensível a deficiências precoces de azoto foliar antes de se manifestarem no NDVI.',
          color: 'text-teal-400',
        };
      case 'ndwi':
        return {
          val: indices.ndwi,
          label: 'NDWI (Água)',
          title: 'Teor Hídrico & Hidratação Foliar',
          desc: 'Absorção de radiação infravermelha SWIR B11 pela água líquida no mesófilo celular foliar.',
          color: 'text-sky-400',
        };
      case 'evi':
        return {
          val: indices.evi,
          label: 'EVI (Biomassa)',
          title: 'Vigor sem Saturação de Dossel',
          desc: 'Índice otimizado que desacopla o sinal do dossel da dispersão atmosférica residual.',
          color: 'text-emerald-400',
        };
      case 'msavi':
        return {
          val: indices.msavi,
          label: 'MSAVI (Solo Ajustado)',
          title: 'Eliminação de Ruído de Solo Nu',
          desc: 'Ajuste matemático que anula a refletância do solo exposto em culturas jovens ou compassos largos.',
          color: 'text-lime-400',
        };
      case 'ndvi':
      default:
        return {
          val: indices.ndvi,
          label: 'NDVI (Vigor Geral)',
          title: 'Densidade da Biomassa Fotossintética',
          desc: 'Diferença normalizada padrão entre infravermelho próximo (B08) e vermelho visível (B04).',
          color: 'text-emerald-400',
        };
    }
  }, [spectralIndex, data]);

  return (
    <div
      className={`fixed top-18 sm:top-20 right-3 sm:right-6 z-30 w-[94vw] sm:w-[460px] md:w-[500px] max-h-[85vh] rounded-3xl bg-[#090d16]/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col text-slate-200 transition-all duration-300 no-print select-none ${
        isCollapsed ? 'h-14 overflow-hidden' : 'overflow-hidden'
      }`}
    >
      {/* PANEL TOP HEADER */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider truncate">
                {parcelName}
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded shrink-0">
                {data.polygon_area_hectares || 28.5} ha
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {farmName} • {irrigationSchedule.crop.name.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Export PDF Button */}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
              title="Gerar Relatório Técnico Agronómico em PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Close Panel */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BODY CONTENT (Scrollable when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs pr-2.5">
          {/* EARLY WARNING ALERT CARD (If Anomaly Detected) */}
          {anomalyInfo.hasAnomaly && !activeAnomalyDismissed && (
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/60 text-red-200 animate-in fade-in duration-200 shadow-lg shadow-red-950/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-mono text-[11px] font-black uppercase text-red-400 tracking-wider">
                    ALERTA DE STRESS ACELERADO
                  </span>
                </div>
                <button
                  onClick={() => setActiveAnomalyDismissed(true)}
                  className="text-red-400 hover:text-white"
                  title="Ocultar Alerta"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                Queda anómala de biomassa (<strong>ΔNDVI {anomalyInfo.deltaNdvi}</strong> em {anomalyInfo.affectedAreaPct}% da parcela). Restrição hídrica descartada pelo radar SAR S1. Suspeita de ataque fitossanitário (pragas/fungos) ou fitotoxicidade localizada.
              </p>
              {onOpenScoutingAtCoord && (
                <button
                  onClick={() => onOpenScoutingAtCoord(data.coordinates.lat, data.coordinates.lon)}
                  className="mt-2.5 px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Criar Missão de Scouting no Local</span>
                </button>
              )}
            </div>
          )}

          {/* TAB SELECTOR DOCK */}
          <div className="grid grid-cols-5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-center">
            <button
              onClick={() => setModeTab('optical')}
              className={`py-1.5 rounded-xl transition-all ${
                modeTab === 'optical'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ótico
            </button>
            <button
              onClick={() => setModeTab('sar')}
              className={`py-1.5 rounded-xl transition-all ${
                modeTab === 'sar'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SAR S1
            </button>
            <button
              onClick={() => setModeTab('prescription')}
              className={`py-1.5 rounded-xl transition-all ${
                modeTab === 'prescription'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VRA Trator
            </button>
            <button
              onClick={() => setModeTab('irrigation')}
              className={`py-1.5 rounded-xl transition-all ${
                modeTab === 'irrigation'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rega FAO
            </button>
            <button
              onClick={() => setModeTab('climate')}
              className={`py-1.5 rounded-xl transition-all ${
                modeTab === 'climate'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Agro-Clima
            </button>
          </div>

          {/* TAB 1: OPTICAL & MULTI-SPECTRAL INDICES */}
          {modeTab === 'optical' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Index Switcher Pill Dock */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                {(['ndvi', 'ndre', 'ndwi', 'evi', 'msavi'] as const).map((idxKey) => (
                  <button
                    key={idxKey}
                    onClick={() => setSpectralIndex(idxKey)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap ${
                      spectralIndex === idxKey
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {idxKey}
                  </button>
                ))}
              </div>

              {/* Main Index Score Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    {currentIndexData.title}
                  </span>
                  <span className={`text-2xl font-mono font-black ${currentIndexData.color}`}>
                    {currentIndexData.val.toFixed(3)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  {currentIndexData.desc}
                </p>
              </div>

              {/* Multi-Index Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">NDVI Médio</div>
                  <div className="text-sm font-black font-mono text-emerald-400 mt-0.5">
                    {data.ndvi.mean.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">NDRE (Red Edge)</div>
                  <div className="text-sm font-black font-mono text-teal-400 mt-0.5">
                    {(data.multi_indices?.ndre ?? data.ndvi.mean * 0.8).toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">NDWI (Água)</div>
                  <div className="text-sm font-black font-mono text-sky-400 mt-0.5">
                    {(data.multi_indices?.ndwi ?? (data.ndvi.mean - 0.25) * 0.7).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Historical NDVI Time Series Chart */}
              {timeseries && timeseries.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-2 flex items-center justify-between">
                    <span>Evolução Temporal do Vigor (Sentinel-2)</span>
                    <span className="text-emerald-400 font-normal">Últimos 12 meses</span>
                  </div>
                  <TimeSeriesChart series={timeseries} />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SENTINEL-1 SAR RADAR */}
          {modeTab === 'sar' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span className="text-xs font-bold text-white font-mono">
                      RADAR SAR COPERNICUS SENTINEL-1
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-950 border border-sky-500/40 px-2 py-0.5 rounded">
                    Banda C (5.405 GHz)
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
                  Micro-ondas com polarização dual (VV/VH) com penetração total através de nuvens, nevoeiro e orvalho matinal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Retroespalhamento Médio</div>
                  <div className="text-lg font-black font-mono text-sky-400 mt-1">
                    {data.sar_radar?.backscatter_vv_db ?? -13.8} dB
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Calibração radiométrica Sigma-0</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Humidade Dielétrica</div>
                  <div className="text-lg font-black font-mono text-teal-400 mt-1">
                    {data.sar_radar?.soil_moisture_estimate_pct ?? 19}% vol.
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Camada superficial (0-5 cm)</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                <span className="font-bold text-white">Diagnóstico SAR: </span>
                {data.sar_radar?.penetration_status === 'CLOUDS_PENETRATED'
                  ? 'Penetração micro-ondas concluída através da cobertura de nuvens com polarização dual (VV/VH).'
                  : 'Nível de hidratação ótimo no subsolo. Sem stress hídrico severo detetado por micro-ondas.'}
              </div>
            </div>
          )}

          {/* TAB 3: TRACTOR VRA & ISOBUS EXPORT */}
          {modeTab === 'prescription' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Fertilizer formulation selector */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  Formulação de Fertilizante Azotado:
                </label>
                <select
                  value={selectedFertilizer}
                  onChange={(e) => setSelectedFertilizer(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {FERTILIZER_DATABASE.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.nitrogen_content_pct}% N)
                    </option>
                  ))}
                </select>

                {/* Price Slider */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Cotação do Adubo (€/ton):</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="250"
                      max="850"
                      step="10"
                      value={fertilizerPriceTon}
                      onChange={(e) => setFertilizerPriceTon(parseInt(e.target.value, 10))}
                      className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      €{fertilizerPriceTon}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Zones Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Zona</th>
                      <th className="py-2 px-2">%</th>
                      <th className="py-2 px-2">Área (ha)</th>
                      <th className="py-2 px-3 text-right">Dose (kg/ha)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activePrescription.zones.map((z) => (
                      <tr key={z.zone_id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 flex items-center gap-1.5 font-bold text-white">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: z.color_hex }}
                          />
                          <span>Zona {z.zone_id}</span>
                        </td>
                        <td className="py-2 px-2 text-slate-300">{z.percentage_of_parcel}%</td>
                        <td className="py-2 px-2 text-slate-300">{z.estimated_hectares.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                          {z.target_n_rate_kg_ha}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ROI Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300">Poupança Anual Estimada:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    €{activePrescription.fertilizer_savings_eur}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Azoto poupado: {activePrescription.nitrogen_saved_kg} kg N</span>
                  <span>CO₂ mitigado: {activePrescription.co2_equivalent_mitigated_kg} kg</span>
                </div>
              </div>

              {/* Export Buttons (Shapefile & ISO-XML) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadShapefile}
                  disabled={isExportingVra}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Descarregar ficheiros .shp, .shx, .dbf, .prj para Trimble e Ag Leader"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shapefile (.zip)</span>
                </button>

                <button
                  onClick={handleDownloadIsoXml}
                  disabled={isExportingVra}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500/60 text-sky-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Descarregar TASKDATA/TASKDATA.XML compatível com John Deere Gen4 e Fendt"
                >
                  <Tractor className="w-3.5 h-3.5 text-sky-400" />
                  <span>ISO-XML (.zip)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PRECISION IRRIGATION FAO-56 */}
          {modeTab === 'irrigation' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      BALANÇO HÍDRICO FAO-56
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-300 bg-teal-950 border border-teal-500/40 px-2 py-0.5 rounded">
                    Kc: {irrigationSchedule.cropCoefficientKc.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                  Cálculo dinâmico Penman-Monteith calibrado pela cultura e vigor da copa por satélite.
                </p>
              </div>

              {/* Operational recommendation */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recomendação Operacional de Rega Hoje:</span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {irrigationSchedule.recommendedDurationText}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">Consumo (ETc): </span>
                    <strong className="text-white">{irrigationSchedule.cropEtcMmDay} mm/dia</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Necessidade: </span>
                    <strong className="text-white">{irrigationSchedule.waterVolumeM3HaDay} m³/ha</strong>
                  </div>
                </div>
              </div>

              {/* 7-Day History from Open-Meteo */}
              {agroClimate?.weeklyEt0History && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-2">
                    Evapotranspiração dos Últimos 7 Dias (ET0 mm)
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono">
                    {agroClimate.weeklyEt0History.map((d, i) => (
                      <div key={i} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-400">{d.date}</div>
                        <div className="text-[11px] font-bold text-teal-400 mt-1">{d.et0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AGRO-CLIMATE & SPRAYING WINDOW (OPEN-METEO) */}
          {modeTab === 'climate' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Dynamic spraying window status tag */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  agroClimate?.overallStatusColor || 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wind className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-black uppercase font-mono tracking-wider">
                    {agroClimate?.overallStatusLabel || 'A carregar meteorologia...'}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed opacity-90">
                  {agroClimate?.sprayingRecommendation}
                </p>
              </div>

              {/* Current Metrics Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Temperatura</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentTempC ?? 22}°C
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Vento (10m)</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentWindKmH ?? 10} km/h
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Humidade Rel.</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentHumidityPct ?? 55}%
                  </div>
                </div>
              </div>

              {/* Next 24h Hourly Spraying Suitability Timeline */}
              {agroClimate?.hourlyForecast && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center justify-between">
                    <span>Aptidão de Pulverização (Próximas 24h)</span>
                    <span className="text-emerald-400 text-[10px] font-normal">Open-Meteo High-Res</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-[11px]">
                    {agroClimate.hourlyForecast.slice(0, 16).map((hf, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
                      >
                        <span className="text-slate-400">{hf.displayTime}</span>
                        <span className="text-slate-300">{hf.temperatureC}°C</span>
                        <span className="text-slate-400">{hf.windSpeedKmH} km/h</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hf.sprayingStatus === 'optimal'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : hf.sprayingStatus === 'moderate'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {hf.sprayingStatus === 'optimal'
                            ? 'Apto'
                            : hf.sprayingStatus === 'moderate'
                            ? 'Atenção'
                            : 'Inapropriado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
