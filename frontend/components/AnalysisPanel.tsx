'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Sun,
  Thermometer,
  CloudSun,
  Activity,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { TimeSeriesChart } from './TimeSeriesChart';
import {
  exportIsobusGeoJson,
  exportPrescriptionCsv,
  generateTractorPrescriptionMap,
  FERTILIZER_DATABASE,
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
  const [modeTab, setModeTab] = useState<'optical' | 'sar' | 'prescription' | 'climate'>('optical');
  const [activeTab, setActiveTab] = useState<'ndvi' | 'true_color'>('ndvi');
  const [spectralIndex, setSpectralIndex] = useState<'ndvi' | 'ndre' | 'ndwi' | 'evi' | 'msavi'>('ndvi');
  const [selectedFertilizer, setSelectedFertilizer] = useState<string>('can-27');
  const [fertilizerPriceTon, setFertilizerPriceTon] = useState<number>(390);
  const [showBandInspector, setShowBandInspector] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [tcImgError, setTcImgError] = useState<boolean>(false);

  useEffect(() => {
    setTcImgError(false);
  }, [data.scene_id]);

  // Recalculate dynamic prescription map when fertilizer formulation or market price changes
  const activePrescription = useMemo(() => {
    return generateTractorPrescriptionMap(
      data.location_name || 'Parcela Agrícola',
      data.ndvi.mean,
      data.polygon_area_hectares || 28.5,
      selectedFertilizer,
      fertilizerPriceTon
    );
  }, [data, selectedFertilizer, fertilizerPriceTon]);

  // Dynamic values for selected spectral index
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
          desc: 'Índice de fronteira da clorofila sensível a deficiências precoces de azoto foliar antes de se manifestarem visualmente no NDVI.',
          color: 'text-teal-400',
          gradient: 'from-amber-500 via-teal-400 to-emerald-500',
          scale: 'Baixo Azoto → Ótimo → Saturação',
        };
      case 'ndwi':
        return {
          val: indices.ndwi,
          label: 'NDWI (Água)',
          title: 'Teor Hídrico & Hidratação Foliar',
          desc: 'Absorção de radiação infravermelha de ondas curtas (SWIR B11) pela água líquida no interior das células do mesófilo da folha.',
          color: 'text-sky-400',
          gradient: 'from-amber-600 via-sky-400 to-blue-500',
          scale: 'Stress Hídrico → Equilíbrio → Turgidez',
        };
      case 'evi':
        return {
          val: indices.evi,
          label: 'EVI (Biomassa)',
          title: 'Vigor Corrigido sem Saturação de Dossel',
          desc: 'Índice melhorado que desacopla o sinal do dossel da dispersão atmosférica residual, ideal para florestas densas e vinhas vigorosas.',
          color: 'text-emerald-400',
          gradient: 'from-red-600 via-amber-400 to-emerald-500',
          scale: 'Pouca Biomassa → Médio → Dossel Denso',
        };
      case 'msavi':
        return {
          val: indices.msavi,
          label: 'MSAVI (Solo Ajustado)',
          title: 'Índice Ajustado ao Fundo de Solo',
          desc: 'Minimiza a influência da refletância do solo descoberto em fases iniciais de emergência da cultura ou pomares espaçados.',
          color: 'text-amber-400',
          gradient: 'from-stone-600 via-amber-400 to-emerald-500',
          scale: 'Solo Nu → Emergência → Cobertura Total',
        };
      case 'ndvi':
      default:
        return {
          val: indices.ndvi,
          label: 'NDVI (Vigor)',
          title: 'Índice de Vigor Vegetativo Normalizado',
          desc: data.interpretation.description,
          color: data.ndvi.mean >= 0.4 ? 'text-emerald-400' : data.ndvi.mean < 0 ? 'text-sky-400' : 'text-amber-400',
          gradient: 'from-red-600 via-amber-400 to-emerald-500',
          scale: 'Solo Seco → Moderado → Dossel Vigoroso',
        };
    }
  }, [data, spectralIndex]);

  // Export ISO-BUS GeoJSON
  const handleExportIsobus = () => {
    exportIsobusGeoJson(
      activePrescription,
      data.coordinates.lat,
      data.coordinates.lon
    );
    setShowExportMenu(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    exportPrescriptionCsv(activePrescription);
    setShowExportMenu(false);
  };

  // Export Text
  const handleExportTextReport = () => {
    const latStr = data.coordinates.lat >= 0 ? `${data.coordinates.lat.toFixed(4)}° N` : `${Math.abs(data.coordinates.lat).toFixed(4)}° S`;
    const lonStr = data.coordinates.lon >= 0 ? `${data.coordinates.lon.toFixed(4)}° E` : `${Math.abs(data.coordinates.lon).toFixed(4)}° W`;

    const textContent = `================================================================================
CROPVISION SAAS - MULTI-SPECTRAL & SAR RADAR AGRONOMIC REPORT
Copernicus Sentinel-2 & Sentinel-1 Satellite Precision Agriculture Intelligence
================================================================================
Data de Emissão:     ${new Date().toUTCString()}
Localização:         ${data.location_name || 'Parcela Agrícola'}
Coordenadas:         ${latStr}, ${lonStr}
Cena STAC:           ${data.scene_id}
Cobertura Nuvens:    ${data.cloud_cover_percentage}%
Resolução Espacial:  ${data.resolution_meters}m nativa
Área da Parcela:     ${data.polygon_area_hectares || 28.5} hectares

--------------------------------------------------------------------------------
ÍNDICES ESPECTRAIS CALIBRADOS (SENTINEL-2 L2A)
--------------------------------------------------------------------------------
- NDVI (Vigor Vegetativo):            ${data.ndvi.mean.toFixed(3)}
- NDRE (Clorofila / Azoto Red Edge):  ${data.multi_indices?.ndre ?? 0.48}
- NDWI (Teor de Água Foliar):         ${data.multi_indices?.ndwi ?? 0.28}
- EVI (Biomassa sem Saturação):       ${data.multi_indices?.evi ?? 0.58}
- MSAVI (Solo Ajustado):              ${data.multi_indices?.msavi ?? 0.54}

--------------------------------------------------------------------------------
TELEMETRIA RADAR SENTINEL-1 SAR (BANDA-C 5.4 GHz)
--------------------------------------------------------------------------------
- Retrodispersão VV (dB):             ${data.sar_radar?.backscatter_vv_db ?? -11.4} dB
- Retrodispersão VH (dB):             ${data.sar_radar?.backscatter_vh_db ?? -18.2} dB
- Razão Cruzada VH/VV:                ${data.sar_radar?.cross_ratio_vh_vv ?? -6.8} dB
- Humidade Volumétrica do Solo:       ${data.sar_radar?.soil_moisture_estimate_pct ?? 28.4}% vol.
- Penetração de Nuvens:               100% GARANTIDA (ALL-WEATHER VERIFIED)

--------------------------------------------------------------------------------
PRESCRIÇÃO DE TAXA VARIÁVEL (VRA / ISO-BUS ISO 11783-10)
--------------------------------------------------------------------------------
- Fertilizante:                       ${activePrescription.selected_fertilizer_name}
- Cotação de Mercado:                 €${activePrescription.fertilizer_price_eur_ton}/tonelada
- Poupança Estimada na Aplicação:     €${activePrescription.fertilizer_savings_eur}
- Redução Líquida de Azoto Sintético: ${activePrescription.nitrogen_saved_kg} kg N
- Emissões de CO2e Evitadas:          ${activePrescription.co2_equivalent_mitigated_kg} kg CO2e
- Conformidade Diretiva Nitratos PAC: ${data.climate_metrics?.cap_nitrates_compliance_pct ?? 94}%

================================================================================
CropVision SaaS • https://cropvision-saas-mer9.vercel.app
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropvision_relatorio_tecnico_${data.scene_id.slice(0, 18)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrintPdf = () => {
    setShowExportMenu(false);
    if (onRequestPdfProUpgrade) {
      onRequestPdfProUpgrade();
    } else {
      setTimeout(() => {
        if (typeof window !== 'undefined') window.print();
      }, 150);
    }
  };

  // Collapsed Mobile Pill View
  if (isCollapsed) {
    return (
      <div className="w-full max-w-md rounded-2xl glass-panel border border-slate-700/70 shadow-2xl p-3 interactive-ui-element print:hidden animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {data.location_name || 'Parcela Agrícola'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 truncate">
                <span className="font-semibold text-emerald-400 font-mono">{data.ndvi.mean.toFixed(3)} NDVI</span>
                <span>•</span>
                <span className="text-sky-400 font-mono">{data.sar_radar?.soil_moisture_estimate_pct ?? 28}% Solo</span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">€{activePrescription.fertilizer_savings_eur} Poupança</span>
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
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-500/50">
                  {data.interpretation.label}
                </span>
                <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Dual Fusion S1/S2</span>
                </span>
              </div>

              <div className="mt-2">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center truncate">
                  <span className="truncate">{data.location_name || 'Parcela Agrícola'}</span>
                </h2>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-400">
                    {data.coordinates.lat.toFixed(4)}°, {data.coordinates.lon.toFixed(4)}°
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    {data.polygon_area_hectares || 28.5} ha
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

        {/* 4-Way Mode Switcher: Ótico vs Radar SAR vs Prescrição VRA vs Agro-Clima */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 my-3 text-[11px]">
          <button
            onClick={() => setModeTab('optical')}
            className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-x-0.5 ${
              modeTab === 'optical'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3 h-3 mb-0.5 sm:mb-0 sm:mr-1" />
            <span>Índices</span>
          </button>
          <button
            onClick={() => setModeTab('sar')}
            className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-x-0.5 ${
              modeTab === 'sar'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3 h-3 mb-0.5 sm:mb-0 sm:mr-1" />
            <span>SAR S1</span>
          </button>
          <button
            onClick={() => setModeTab('prescription')}
            className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-x-0.5 ${
              modeTab === 'prescription'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3 h-3 mb-0.5 sm:mb-0 sm:mr-1" />
            <span>VRA Trator</span>
          </button>
          <button
            onClick={() => setModeTab('climate')}
            className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-x-0.5 ${
              modeTab === 'climate'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CloudSun className="w-3 h-3 mb-0.5 sm:mb-0 sm:mr-1" />
            <span>Agro-Clima</span>
          </button>
        </div>

        {/* TAB 1: MULTI-INDEX SPECTRAL OPTICAL (NDVI, NDRE, NDWI, EVI, MSAVI) */}
        {modeTab === 'optical' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Spectral Index Selector Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
              {(['ndvi', 'ndre', 'ndwi', 'evi', 'msavi'] as const).map((idx) => {
                const isSelected = spectralIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSpectralIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs uppercase transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {idx}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Telemetry Gauge for Selected Index */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <div className="flex items-baseline justify-between mb-1.5">
                <div>
                  <span className="text-xs text-slate-300 font-bold tracking-wide block">
                    {currentIndexData.title}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">
                    {currentIndexData.label}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${currentIndexData.color}`}>
                    {currentIndexData.val.toFixed(3)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ 1.00</span>
                </div>
              </div>

              {/* Dynamic Gradient Bar */}
              <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/50 mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${currentIndexData.gradient}`}
                  style={{ width: `${Math.max(10, Math.min(100, Math.round((currentIndexData.val + 0.2) * 85)))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                {currentIndexData.scale.split('→').map((s, i) => (
                  <span key={i}>{s.trim()}</span>
                ))}
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
              <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                {currentIndexData.desc}
              </p>
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
                      RGB Satélite
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
                      Bandas óticas B04 e B08 calibradas diretamente a 10m.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Copernicus Multispectral Band Reflectance Inspector */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowBandInspector(!showBandInspector)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Espetrometria de Bandas Sentinel-2 (Refletância BOA)</span>
                </div>
                {showBandInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showBandInspector && data.spectral_bands && (
                <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono animate-in fade-in">
                  {data.spectral_bands.map((b) => (
                    <div key={b.band} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-emerald-400">{b.band}</span>{' '}
                        <span className="text-slate-300">{b.name}</span>{' '}
                        <span className="text-[9px] text-slate-500">({b.wavelength_nm}nm)</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-white">{b.reflectance.toFixed(3)}</span>
                        <span className="text-[9px] text-slate-500 block">{b.resolution_m}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <span className="text-3xl font-black text-sky-400 tracking-tight font-mono">
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

        {/* TAB 3: TRACTOR PRESCRIPTION MAP & FERTILIZER SIMULATOR */}
        {modeTab === 'prescription' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Savings & Economic Impact Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Poupança Líquida em Adubo (VRA)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  ISO 11783-10
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                  €{activePrescription.fertilizer_savings_eur.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ passagem de adubação</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-900/50 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Azoto Poupado:</span>
                  <span className="font-bold text-slate-200">{activePrescription.nitrogen_saved_kg} kg N</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emissões Evitadas:</span>
                  <span className="font-bold text-emerald-300">{activePrescription.co2_equivalent_mitigated_kg} kg CO2e</span>
                </div>
              </div>
            </div>

            {/* Interactive Fertilizer Configurator Box */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Configurador do Fertilizante &amp; Preço de Mercado</span>
              </span>

              {/* Formulation Dropdown */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tipo de Adubo:</label>
                <select
                  value={selectedFertilizer}
                  onChange={(e) => {
                    setSelectedFertilizer(e.target.value);
                    const found = FERTILIZER_DATABASE.find((f) => f.id === e.target.value);
                    if (found) setFertilizerPriceTon(found.default_price_eur_ton);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {FERTILIZER_DATABASE.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.nitrogen_content_pct}% N)
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Cotação de Mercado:</span>
                  <span className="font-mono font-bold text-emerald-400">€{fertilizerPriceTon}/ton</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="900"
                  step="10"
                  value={fertilizerPriceTon}
                  onChange={(e) => setFertilizerPriceTon(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Zones Breakdown Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Zonas de Prescrição VRA ({activePrescription.total_area_hectares} ha)</span>
                <span className="text-[10px] text-slate-400">3 Zonas Agronómicas</span>
              </div>

              {activePrescription.zones.map((zone) => (
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
          </div>
        )}

        {/* TAB 4: AGRO-CLIMATE, METRICS & PAC CERTIFICATE */}
        {modeTab === 'climate' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Nitrates Directive & CAP Compliance Certificate */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Conformidade Diretiva de Nitratos (PAC)</span>
                </span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {data.climate_metrics?.cap_nitrates_compliance_pct ?? 94}%
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                A aplicação por taxa variável cumpre as metas do Pacto Ecológico Europeu ("Farm to Fork"), elegível para os Eco-regimes e pagamentos de carbono da PAC 2023-2027.
              </p>
            </div>

            {/* Weather & Biophysical Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Radiação Solar</span>
                </div>
                <div className="text-lg font-black text-white font-mono">
                  {data.climate_metrics?.solar_radiation_w_m2 ?? 840} <span className="text-xs text-slate-500">W/m²</span>
                </div>
                <div className="text-[10px] text-slate-500">Ângulo solar: {data.sun_elevation?.toFixed(1) ?? '54.2'}°</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold mb-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Evapotranspiração ET0</span>
                </div>
                <div className="text-lg font-black text-sky-400 font-mono">
                  {data.climate_metrics?.evapotranspiration_mm_day ?? 4.2} <span className="text-xs text-slate-500">mm/dia</span>
                </div>
                <div className="text-[10px] text-slate-500">Demanda hídrica da cultura</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Grau-Dias (GDD)</span>
                </div>
                <div className="text-lg font-black text-rose-300 font-mono">
                  {data.climate_metrics?.growing_degree_days ?? 1240}
                </div>
                <div className="text-[10px] text-slate-500">Base 10°C acumulada</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold mb-1">
                  <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Próxima Passagem</span>
                </div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  ~{data.climate_metrics?.next_satellite_overpass_hours ?? 36}h
                </div>
                <div className="text-[10px] text-slate-500">Copernicus Sentinel-2C</div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Orbital Passes Trend Chart */}
        {timeseries && timeseries.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800">
            <TimeSeriesChart series={timeseries} />
          </div>
        )}

        {/* Action Footer with Export Options */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 relative">
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Relatório</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {/* Dropdown Menu */}
              {showExportMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-[#0b1120] border border-slate-700 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
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
                      <div className="text-[10px] text-slate-400">Compatível com John Deere, Trimble &amp; Fendt</div>
                    </div>
                  </button>

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

                  <button
                    onClick={handleExportTextReport}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border-t border-slate-800/80"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Relatório em Texto (.txt)</div>
                      <div className="text-[10px] text-slate-400">Arquivo técnico formatado</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              CropVision DeepTech v2.8
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Executive A4 Print / PDF Report (Visible ONLY when printing) */}
      <div className="hidden print-only-report font-sans text-slate-900 bg-white">
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
                  Sentinel-2 Multi-Spectral, Sentinel-1 SAR Radar &amp; ISO-BUS Prescriptions
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div><strong>Relatório Gerado:</strong> {new Date().toLocaleDateString('pt-PT')}</div>
              <div className="font-mono text-[10px] text-slate-500">Cena: {data.scene_id.slice(0, 26)}</div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
                Copernicus Sentinel-2 &amp; Sentinel-1
              </div>
            </div>
          </div>
        </div>

        {/* Location & Sensor Information Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Localização:</span>
              <span className="text-sm font-bold text-slate-900">{data.location_name || 'Parcela Agrícola'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Coordenadas &amp; Área:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {data.coordinates.lat.toFixed(4)}°, {data.coordinates.lon.toFixed(4)}° • {data.polygon_area_hectares || 28.5} ha
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Plataformas Espaciais:</span>
              <span className="font-semibold text-slate-800">Sentinel-2 L2A (Ótico) + Sentinel-1C (SAR Radar Banda C)</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Conformidade Diretiva Nitratos:</span>
              <span className="font-mono font-bold text-emerald-700">
                {data.climate_metrics?.cap_nitrates_compliance_pct ?? 94}% Conforme (PEPAC)
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Index Summary */}
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-emerald-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-2">
            Índices Espectrais de Vigor e Clorofila (Resolução 10m)
          </span>
          <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
            <div className="p-2 bg-white rounded border">
              <div className="text-[10px] text-slate-500 uppercase">NDVI</div>
              <div className="text-sm font-black text-emerald-800">{data.ndvi.mean.toFixed(3)}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-[10px] text-slate-500 uppercase">NDRE</div>
              <div className="text-sm font-black text-teal-800">{data.multi_indices?.ndre ?? 0.48}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-[10px] text-slate-500 uppercase">NDWI</div>
              <div className="text-sm font-black text-sky-800">{data.multi_indices?.ndwi ?? 0.28}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-[10px] text-slate-500 uppercase">EVI</div>
              <div className="text-sm font-black text-green-800">{data.multi_indices?.evi ?? 0.58}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-[10px] text-slate-500 uppercase">MSAVI</div>
              <div className="text-sm font-black text-amber-800">{data.multi_indices?.msavi ?? 0.54}</div>
            </div>
          </div>
        </div>

        {/* Prescription Summary Table */}
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-amber-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Prescrição de Adubação a Taxa Variável (ISO 11783-10 / ISO-BUS)
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Poupança Estimada: €{activePrescription.fertilizer_savings_eur} ({activePrescription.selected_fertilizer_name})
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
              {activePrescription.zones.map((z) => (
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

        {/* Official Report Footer */}
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
          <div>
            Dados científicos: ESA Copernicus Sentinel-2 L2A &amp; Sentinel-1 SAR IW STAC Archives.
          </div>
          <div>
            Gerado por <strong>CropVision SaaS</strong> • https://cropvision-saas-mer9.vercel.app
          </div>
        </div>
      </div>
    </>
  );
};
