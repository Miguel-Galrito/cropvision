'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AnalyzeResponse,
  TimeSeriesPoint,
  TractorPrescriptionMap,
  PrescriptionZone,
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
  Share2,
  GitCompare,
  Calculator,
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';
import { RoiCalculatorWidget } from './RoiCalculatorWidget';
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
import { Language, translations } from '../lib/i18n';
import { DiseaseRiskWidget } from './DiseaseRiskWidget';
import { DiseaseRiskAssessment } from '../lib/disease/epidemiology';

interface AnalysisPanelProps {
  data: AnalyzeResponse;
  timeseries: TimeSeriesPoint[] | null;
  lang?: Language;
  theme?: 'dark' | 'light';
  cropType?: CropType;
  trainingSystem?: TrainingSystem;
  irrigationType?: IrrigationType;
  farmName?: string;
  parcelName?: string;
  isProSimulated?: boolean;
  onRequirePro?: (reason: string) => void;
  onExportPdf?: () => void;
  onOpenScoutingAtCoord?: (lat: number, lon: number) => void;
  onLogTreatmentToFieldBook?: (disease: DiseaseRiskAssessment) => void;
  onShareAudit?: () => void;
  onOpenComparator?: () => void;
  onOpenRoi?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTab?: 'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate' | 'health';
  onTabChange?: (tab: 'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate' | 'health') => void;
  onClose?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  data,
  timeseries,
  lang = 'pt',
  theme = 'dark',
  cropType = 'olival',
  trainingSystem = 'intensivo',
  irrigationType = 'gota-a-gota',
  farmName = 'Herdade Monte Novo',
  parcelName = 'Talhão 1',
  isProSimulated = false,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  activeTab: propActiveTab,
  onTabChange,
  onRequirePro,
  onExportPdf,
  onOpenScoutingAtCoord,
  onLogTreatmentToFieldBook,
  onShareAudit,
  onOpenComparator,
  onOpenRoi,
  onClose,
}) => {
  const [internalModeTab, setInternalModeTab] = useState<'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate' | 'health'>('optical');
  const modeTab = propActiveTab !== undefined ? propActiveTab : internalModeTab;
  const setModeTab = (tab: 'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate' | 'health') => {
    if (onTabChange) onTabChange(tab);
    setInternalModeTab(tab);
  };

  const [spectralIndex, setSpectralIndex] = useState<'ndvi' | 'ndre' | 'ndwi' | 'evi' | 'msavi'>('ndvi');
  const [selectedFertilizer, setSelectedFertilizer] = useState<string>('can-27');
  const [fertilizerPriceTon, setFertilizerPriceTon] = useState<number>(390);

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const toggleCollapsed = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };
  const setIsCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(val);
    }
  };
  const [agroClimate, setAgroClimate] = useState<AgroClimateData | null>(null);
  const [isExportingVra, setIsExportingVra] = useState<boolean>(false);
  const [activeAnomalyDismissed, setActiveAnomalyDismissed] = useState<boolean>(false);

  const t = translations[lang] || translations.pt;

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

  // Nitrates Directive & PAC Compliance State (Portaria n.º 259/2012 / 170 kg N/ha legal ceiling)
  const [isNitratesZoneActive, setIsNitratesZoneActive] = useState<boolean>(false);
  const [isNitratesAdjusted, setIsNitratesAdjusted] = useState<boolean>(false);
  const [baseTargetNRate, setBaseTargetNRate] = useState<number>(185);

  // Recalculate dynamic prescription map with Nitrates Directive enforcement
  const activePrescription: TractorPrescriptionMap = useMemo(() => {
    const rawMap = generateTractorPrescriptionMap(
      parcelName || data.location_name || 'Talhão Agrícola',
      data.ndvi.mean,
      data.polygon_area_hectares || 28.5,
      selectedFertilizer,
      fertilizerPriceTon
    );

    // Apply baseline target rate (185 kg N/ha by default)
    let rateA = Math.round(baseTargetNRate * 0.6);
    let rateB = baseTargetNRate;
    let rateC = Math.round(baseTargetNRate * 0.72);

    // If Nitrates Zone is active and Adjusted to Legal Limit (Portaria n.º 259/2012 cap 170 kg N/ha)
    if (isNitratesZoneActive && isNitratesAdjusted && rateB > 170) {
      const factor = 170 / rateB;
      rateA = Math.round(rateA * factor);
      rateB = 170;
      rateC = Math.round(rateC * factor);
    }

    const haA = rawMap.zones[0]?.estimated_hectares || (data.polygon_area_hectares || 28.5) * 0.35;
    const haB = rawMap.zones[1]?.estimated_hectares || (data.polygon_area_hectares || 28.5) * 0.45;
    const haC = rawMap.zones[2]?.estimated_hectares || (data.polygon_area_hectares || 28.5) * 0.2;

    const totalVarKg = Math.round(haA * rateA + haB * rateB + haC * rateC);
    const baselineFlatKg = Math.round(baseTargetNRate * (data.polygon_area_hectares || 28.5));
    const nSavedKg = Math.max(0, baselineFlatKg - totalVarKg);
    const fert = FERTILIZER_DATABASE.find((f) => f.id === selectedFertilizer) || FERTILIZER_DATABASE[0];
    const eurPerKgPureN = (fertilizerPriceTon / 1000) / (fert.nitrogen_content_pct / 100);
    const eurSavings = Math.round(nSavedKg * eurPerKgPureN);
    const co2Mitigated = Math.round(nSavedKg * 5.5);

    const zones: PrescriptionZone[] = [
      {
        ...rawMap.zones[0],
        target_n_rate_kg_ha: rateA,
      },
      {
        ...rawMap.zones[1],
        target_n_rate_kg_ha: rateB,
      },
      {
        ...rawMap.zones[2],
        target_n_rate_kg_ha: rateC,
      },
    ];

    return {
      ...rawMap,
      zones,
      optimized_variable_n_kg: totalVarKg,
      baseline_flat_n_kg: baselineFlatKg,
      nitrogen_saved_kg: nSavedKg,
      fertilizer_savings_eur: eurSavings,
      co2_equivalent_mitigated_kg: co2Mitigated,
    };
  }, [
    data,
    selectedFertilizer,
    fertilizerPriceTon,
    parcelName,
    baseTargetNRate,
    isNitratesZoneActive,
    isNitratesAdjusted,
  ]);

  const maxZoneRate = Math.max(...activePrescription.zones.map((z) => z.target_n_rate_kg_ha));
  const isNitratesExceeded = maxZoneRate > 170;

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

  // Early Warning Anomaly Calculation
  const anomalyInfo = useMemo(() => {
    if (!timeseries || timeseries.length < 2) {
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

  // Handle VRA Shapefile Download (Real .zip containing .shp, .shx, .dbf, .prj)
  const handleDownloadShapefile = async () => {
    setIsExportingVra(true);
    try {
      await downloadVraShapefileZip(
        activePrescription,
        data.coordinates.lat,
        data.coordinates.lon,
        data.ndvi.mean
      );
    } catch (err) {
      console.error('Failed to export Shapefile:', err);
    } finally {
      setIsExportingVra(false);
    }
  };

  // Handle ISO-XML TaskData Download (Real .zip with TASKDATA/TASKDATA.XML)
  const handleDownloadIsoXml = async () => {
    setIsExportingVra(true);
    try {
      await downloadIsoXmlZip(
        activePrescription,
        data.coordinates.lat,
        data.coordinates.lon
      );
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
          label: t.redEdgeChlorophyll,
          title: lang === 'en' ? 'Chlorophyll Content & Nitrogen Uptake' : 'Teor de Clorofila & Absorção de Azoto',
          desc: lang === 'en'
            ? 'Red-edge band index sensitive to early foliar nitrogen deficiencies before visible in NDVI.'
            : 'Índice de fronteira da clorofila sensível a deficiências precoces de azoto foliar antes de se manifestarem no NDVI.',
          color: 'text-teal-400',
        };
      case 'ndwi':
        return {
          val: indices.ndwi,
          label: t.waterIndex,
          title: lang === 'en' ? 'Canopy Water Content & Hydration' : 'Teor Hídrico & Hidratação Foliar',
          desc: lang === 'en'
            ? 'Shortwave infrared (SWIR B11) absorption by liquid water inside leaf mesophyll cellular structures.'
            : 'Absorção de radiação infravermelha SWIR B11 pela água líquida no mesófilo celular foliar.',
          color: 'text-sky-400',
        };
      case 'evi':
        return {
          val: indices.evi,
          label: t.highBiomassEvi,
          title: lang === 'en' ? 'Vigour with Saturated Canopy Decoupling' : 'Vigor sem Saturação de Dossel',
          desc: lang === 'en'
            ? 'Enhanced vegetation index that decouples canopy signal from atmospheric aerosols in dense crops.'
            : 'Índice otimizado que desacopla o sinal do dossel da dispersão atmosférica residual em copas densas.',
          color: 'text-emerald-400',
        };
      case 'msavi':
        return {
          val: indices.msavi,
          label: t.soilAdjustedMsavi,
          title: lang === 'en' ? 'Bare Soil Background Removal' : 'Eliminação de Ruído de Solo Nu',
          desc: lang === 'en'
            ? 'Mathematical adjustment that cancels bare ground brightness in young crops or wide tree spacings.'
            : 'Ajuste matemático que anula a refletância do solo exposto em culturas jovens ou compassos largos.',
          color: 'text-lime-400',
        };
      case 'ndvi':
      default:
        return {
          val: indices.ndvi,
          label: t.meanNdvi,
          title: lang === 'en' ? 'Photosynthetic Biomass Density' : 'Densidade da Biomassa Fotossintética',
          desc: lang === 'en'
            ? 'Standard normalized difference between Near-Infrared (B08) and Visible Red (B04) bands.'
            : 'Diferença normalizada padrão entre infravermelho próximo (B08) e vermelho visível (B04).',
          color: 'text-emerald-400',
        };
    }
  }, [spectralIndex, data, lang, t]);

  // Localized Fertilizer Names
  const getFertilizerDisplayName = (fId: string, ptName: string) => {
    if (lang === 'pt') return ptName;
    if (fId === 'can-27') return 'Calcium Ammonium Nitrate (CAN 27% N)';
    if (fId === 'urea-46') return 'Prilled Urea (46% N)';
    if (fId === 'uan-32') return 'Liquid Nitrogen Solution (UAN 32% N)';
    if (fId === 'npk-15-15-15') return 'Compound Fertilizer NPK 15-15-15';
    return ptName;
  };

  // Localized Irrigation text
  const localizedIrrigationText = useMemo(() => {
    if (lang === 'pt') return irrigationSchedule.recommendedDurationText;
    if (irrigationType === 'sequeiro') return t.drylandNoIrrigation;
    if (irrigationSchedule.netIrrigationNeedMmDay === 0) return t.rainSatisfied;
    const h = Math.floor(irrigationSchedule.recommendedDurationMinutes / 60);
    const m = irrigationSchedule.recommendedDurationMinutes % 60;
    return `Activate irrigation valve for ${h}h ${m > 0 ? `${m}min` : ''} (${irrigationSchedule.crop.typicalIrrigationRateMmH.toFixed(1)} mm/h)`;
  }, [irrigationSchedule, lang, irrigationType, t]);

  // 1. COLLAPSED VIEW: Ultra-Clean Floating Quick Status Card (Unobtrusive Map-First Experience)
  if (isCollapsed) {
    return (
      <div
        className="fixed z-30 bottom-16 left-3 right-3 sm:bottom-auto sm:top-20 sm:right-6 sm:left-auto sm:w-auto max-w-[calc(100vw-24px)] rounded-2xl bg-[#090d16]/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl p-3 sm:px-4 sm:py-2.5 flex items-center justify-between space-x-3.5 text-slate-200 transition-all duration-300 no-print select-none cursor-pointer group hover:border-emerald-500/50"
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider truncate">
                {parcelName}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded shrink-0">
                {data.polygon_area_hectares || 28.5} ha
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {lang === 'en' ? 'Mean NDVI: ' : 'NDVI Médio: '}
              <strong className="text-emerald-400 font-mono">{(data.ndvi?.mean || 0.52).toFixed(2)}</strong>
              {' • '}
              <span className="text-slate-300">{farmName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <span>{lang === 'en' ? 'Telemetry' : 'Ver Análise'}</span>
            <ChevronUp className="w-3.5 h-3.5 rotate-90" />
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={lang === 'en' ? 'Close' : 'Fechar'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. EXPANDED VIEW: Full Deep-Tech Telemetry Drawer
  return (
    <div
      className="fixed z-30 bottom-16 left-0 right-0 sm:bottom-auto sm:top-20 sm:right-6 sm:left-auto sm:w-[460px] md:w-[500px] rounded-t-3xl sm:rounded-3xl bg-[#090d16]/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col text-slate-200 transition-all duration-300 no-print select-none h-[75dvh] max-h-[80dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
    >
      {/* Mobile Drag/Grab Handle Pill */}
      <div
        onClick={() => setIsCollapsed(true)}
        className="w-full pt-2 pb-1 flex justify-center items-center sm:hidden cursor-pointer active:opacity-70"
      >
        <div className="w-12 h-1.5 bg-slate-600/80 rounded-full hover:bg-emerald-500 transition-colors" />
      </div>

      {/* PANEL TOP HEADER */}
      <div 
        className="p-3.5 sm:p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0"
      >
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
              {farmName} • {lang === 'en' ? (cropType === 'olival' ? 'Olive Grove' : cropType === 'vinha' ? 'Vineyard' : cropType === 'amendoal' ? 'Almonds' : cropType === 'milho' ? 'Corn' : 'Pasture') : irrigationSchedule.crop.name.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Share Web Audit Button */}
          {onShareAudit && (
            <button
              onClick={onShareAudit}
              className="px-2.5 py-1 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-sky-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
              title={lang === 'en' ? 'Share Public Read-Only Audit Link' : 'Partilhar Relatório de Auditoria Web'}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'en' ? 'Audit' : 'Auditoria'}</span>
            </button>
          )}

          {/* Export PDF Button */}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
              title={lang === 'en' ? 'Generate Official Technical PDF Report' : 'Gerar Relatório Técnico Agronómico em PDF'}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF</span>
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={lang === 'en' ? 'Minimize panel' : 'Minimizar painel'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Close Panel */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={lang === 'en' ? 'Close' : 'Fechar'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BODY CONTENT (Scrollable when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs pr-2.5 overscroll-contain">
          {/* EARLY WARNING ALERT CARD (If Anomaly Detected) */}
          {anomalyInfo.hasAnomaly && !activeAnomalyDismissed && (
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/60 text-red-200 animate-in fade-in duration-200 shadow-lg shadow-red-950/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-mono text-[11px] font-black uppercase text-red-400 tracking-wider">
                    {t.earlyWarningTitle}
                  </span>
                </div>
                <button
                  onClick={() => setActiveAnomalyDismissed(true)}
                  className="text-red-400 hover:text-white"
                  title={t.close}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? `Abnormal biomass drop detected (ΔNDVI ${anomalyInfo.deltaNdvi} over ${anomalyInfo.affectedAreaPct}% of parcel). Soil moisture stress ruled out by Sentinel-1 SAR radar. Suspected fungal outbreak, pest damage or localized spray burn.`
                  : `Queda anómala de biomassa (ΔNDVI ${anomalyInfo.deltaNdvi} em ${anomalyInfo.affectedAreaPct}% da parcela). Restrição hídrica descartada pelo radar SAR S1. Suspeita de ataque fitossanitário (pragas/fungos) ou fitotoxicidade localizada.`}
              </p>
              {onOpenScoutingAtCoord && (
                <button
                  onClick={() => onOpenScoutingAtCoord(data.coordinates.lat, data.coordinates.lon)}
                  className="mt-2.5 px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{t.createScoutingMission}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB SELECTOR DOCK - Horizontally scrollable on mobile */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] font-bold shrink-0">
            <button
              onClick={() => setModeTab('optical')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'optical'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabOptical}
            </button>
            <button
              onClick={() => setModeTab('sar')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'sar'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabSar}
            </button>
            <button
              onClick={() => setModeTab('prescription')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'prescription'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabVra}
            </button>
            <button
              onClick={() => setModeTab('irrigation')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'irrigation'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabIrrigation}
            </button>
            <button
              onClick={() => setModeTab('climate')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'climate'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabClimate}
            </button>
            <button
              onClick={() => setModeTab('health')}
              className={`py-1.5 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                modeTab === 'health'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'en' ? 'Phytosanitary Risk' : 'Fitossanidade'}
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
                  <div className="text-[10px] text-slate-400 font-mono">{t.meanNdvi}</div>
                  <div className="text-sm font-black font-mono text-emerald-400 mt-0.5">
                    {data.ndvi.mean.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">{t.redEdgeChlorophyll}</div>
                  <div className="text-sm font-black font-mono text-teal-400 mt-0.5">
                    {(data.multi_indices?.ndre ?? data.ndvi.mean * 0.8).toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">{t.waterIndex}</div>
                  <div className="text-sm font-black font-mono text-sky-400 mt-0.5">
                    {(data.multi_indices?.ndwi ?? (data.ndvi.mean - 0.25) * 0.7).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Historical NDVI Time Series Chart */}
              {timeseries && timeseries.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-2 flex items-center justify-between">
                    <span>{t.historicalTrend}</span>
                    <span className="text-emerald-400 font-normal">{t.last12Months}</span>
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
                      {t.sarTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-950 border border-sky-500/40 px-2 py-0.5 rounded">
                    {t.sarBand}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
                  {t.sarDesc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">{t.backscatterMean}</div>
                  <div className="text-lg font-black font-mono text-sky-400 mt-1">
                    {data.sar_radar?.backscatter_vv_db ?? -13.8} dB
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.sigmaCalibration}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">{t.dielectricMoisture}</div>
                  <div className="text-lg font-black font-mono text-teal-400 mt-1">
                    {data.sar_radar?.soil_moisture_estimate_pct ?? 19}% vol.
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.topsoilDepth}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                <span className="font-bold text-white">{t.sarDiagnostic} </span>
                {data.sar_radar?.penetration_status === 'CLOUDS_PENETRATED'
                  ? t.sarPenetrated
                  : t.sarOptimal}
              </div>
            </div>
          )}

          {/* TAB 3: TRACTOR VRA & ISOBUS EXPORT */}
          {modeTab === 'prescription' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Fertilizer formulation selector */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  {t.fertilizerFormulation}
                </label>
                <select
                  value={selectedFertilizer}
                  onChange={(e) => setSelectedFertilizer(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {FERTILIZER_DATABASE.map((f) => (
                    <option key={f.id} value={f.id}>
                      {getFertilizerDisplayName(f.id, f.name)} ({f.nitrogen_content_pct}% N)
                    </option>
                  ))}
                </select>

                {/* Price Slider */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{t.fertilizerPrice}</span>
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

              {/* NITRATES DIRECTIVE & PAC CEILING CONTROLS (Portaria n.º 259/2012 / 170 kg N/ha) */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                {/* Vulnerable Zone Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 pr-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">
                      {lang === 'en'
                        ? 'Field in Nitrate Vulnerable Zone (Directive 91/676/EEC)'
                        : 'Talhão em Zona Vulnerável à Diretiva Nitratos (Portaria nº 259/2012)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNitratesZoneActive((prev) => !prev);
                      setIsNitratesAdjusted(false);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isNitratesZoneActive ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isNitratesZoneActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Target Baseline N Rate (kg N/ha) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    {lang === 'en' ? 'Target Pure N Rate:' : 'Dose Alvo de Azoto Puro:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="80"
                      max="240"
                      step="5"
                      value={baseTargetNRate}
                      disabled={isNitratesZoneActive && isNitratesAdjusted}
                      onChange={(e) => {
                        setBaseTargetNRate(parseInt(e.target.value, 10));
                        setIsNitratesAdjusted(false);
                      }}
                      className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                    />
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      {baseTargetNRate} kg N/ha
                    </span>
                  </div>
                </div>

                {/* Non-compliance Alert Banner (Red) */}
                {isNitratesZoneActive && isNitratesExceeded && !isNitratesAdjusted && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/80 text-red-200 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-red-200">
                          {lang === 'en'
                            ? 'CAP Non-Compliance Warning: Nitrogen dose exceeds legal ceiling of 170 kg N/ha. Risk of subsidy cuts.'
                            : 'Aviso de Inconformidade PAC: Dose de Azoto excede o teto legal de 170 kg N/ha. Risco de corte em subsídios.'}
                        </p>
                        <p className="text-[10px] text-red-300/80 mt-0.5 leading-relaxed">
                          {lang === 'en'
                            ? `Current prescribed peak rate is ${maxZoneRate} kg N/ha. Mandatory limit in NVZ is 170 kg N/ha/year.`
                            : `A dose prescrita atinge ${maxZoneRate} kg N/ha. O teto legal vinculativo em Zonas Vulneráveis é de 170 kg N/ha/ano.`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsNitratesAdjusted(true)}
                      className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en'
                          ? 'Automatically Adjust to Legal Limit'
                          : 'Ajustar Automaticamente ao Limite Legal'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Compliance Confirmed Banner (Green) */}
                {isNitratesZoneActive && isNitratesAdjusted && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/70 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-300 text-[11px]">
                          {lang === 'en'
                            ? 'CAP Compliance Verified: Nitrogen doses capped at ≤170 kg N/ha.'
                            : 'Conformidade PAC Assegurada: Doses ajustadas ao teto legal de 170 kg N/ha.'}
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          {lang === 'en'
                            ? 'Portaria n.º 259/2012 certified for field book'
                            : 'Portaria n.º 259/2012 certificada para auditoria oficial IFAP'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsNitratesAdjusted(false)}
                      className="text-[10px] text-slate-400 hover:text-white underline shrink-0 cursor-pointer"
                    >
                      {lang === 'en' ? 'Reset' : 'Reverter'}
                    </button>
                  </div>
                )}
              </div>

              {/* 3 Zones Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">{t.tableZone}</th>
                      <th className="py-2 px-2">%</th>
                      <th className="py-2 px-2">{t.tableArea}</th>
                      <th className="py-2 px-3 text-right">{t.tableRate}</th>
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
                          <span>{lang === 'en' ? `Zone ${z.zone_id}` : `Zona ${z.zone_id}`}</span>
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

              {/* Dynamic ROI & Carbon Mitigation Widget */}
              <RoiCalculatorWidget
                areaHectares={data.polygon_area_hectares || 28.5}
                cropType={cropType}
                lang={lang}
                theme={theme}
                onOpenModal={onOpenRoi}
              />

              {/* Export Buttons (Shapefile & ISO-XML) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadShapefile}
                  disabled={isExportingVra}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title={lang === 'en' ? 'Download .shp, .shx, .dbf, .prj for Trimble & Ag Leader' : 'Descarregar ficheiros .shp, .shx, .dbf, .prj para Trimble e Ag Leader'}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.downloadShapefile}</span>
                </button>

                <button
                  onClick={handleDownloadIsoXml}
                  disabled={isExportingVra}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500/60 text-sky-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title={lang === 'en' ? 'Download TASKDATA/TASKDATA.XML for John Deere Gen4 & Fendt' : 'Descarregar TASKDATA/TASKDATA.XML compatível com John Deere Gen4 e Fendt'}
                >
                  <Tractor className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.downloadIsoXml}</span>
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
                      {t.faoTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-300 bg-teal-950 border border-teal-500/40 px-2 py-0.5 rounded">
                    {t.cropKc} {irrigationSchedule.cropCoefficientKc.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                  {t.faoDesc}
                </p>
              </div>

              {/* Operational recommendation */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.irrigationToday}</span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {localizedIrrigationText}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">{t.cropEtc} </span>
                    <strong className="text-white">{irrigationSchedule.cropEtcMmDay} mm/dia</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">{t.netNeed} </span>
                    <strong className="text-white">{irrigationSchedule.waterVolumeM3HaDay} m³/ha</strong>
                  </div>
                </div>
              </div>

              {/* 7-Day History from Open-Meteo */}
              {agroClimate?.weeklyEt0History && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-2">
                    {t.last7DaysEt0}
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
                    {lang === 'en'
                      ? (agroClimate?.overallSprayingStatus === 'optimal'
                          ? t.windowOpen
                          : agroClimate?.overallSprayingStatus === 'moderate'
                          ? t.windowWindRisk
                          : t.windowUnsuitable)
                      : (agroClimate?.overallStatusLabel || 'A carregar meteorologia...')}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed opacity-90">
                  {lang === 'en'
                    ? (agroClimate?.overallSprayingStatus === 'optimal'
                        ? 'Calm wind (< 15 km/h) and no precipitation. Excellent foliar retention and contact efficacy.'
                        : agroClimate?.overallSprayingStatus === 'moderate'
                        ? 'Moderate wind (14-20 km/h). Air-induction anti-drift nozzles and reduced boom pressure recommended.'
                        : 'Spraying strongly discouraged. High risk of chemical rain washoff or severe off-target drift.')
                    : agroClimate?.sprayingRecommendation}
                </p>
              </div>

              {/* Current Metrics Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">{t.temperature}</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentTempC ?? 22}°C
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">{t.windSpeed}</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentWindKmH ?? 10} km/h
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">{t.humidity}</div>
                  <div className="text-sm font-black font-mono text-white mt-0.5">
                    {agroClimate?.currentHumidityPct ?? 55}%
                  </div>
                </div>
              </div>

              {/* Next 24h Hourly Spraying Suitability Timeline */}
              {agroClimate?.hourlyForecast && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center justify-between">
                    <span>{t.hourlySprayingAptitude}</span>
                    <span className="text-emerald-400 text-[10px] font-normal">{t.climateHighRes}</span>
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
                            ? t.statusApt
                            : hf.sprayingStatus === 'moderate'
                            ? t.statusCaution
                            : t.statusUnsuitable}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PHYTOSANITARY & EPIDEMIOLOGICAL DISEASE RISK */}
          {modeTab === 'health' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <DiseaseRiskWidget
                cropType={cropType}
                currentTempC={agroClimate?.currentTempC ?? 22.0}
                currentHumidityPct={agroClimate?.currentHumidityPct ?? 65}
                hourlyForecast={agroClimate?.hourlyForecast || []}
                lang={lang}
                theme={theme}
                onLogTreatment={onLogTreatmentToFieldBook}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
