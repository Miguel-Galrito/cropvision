'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Droplets,
  Thermometer,
  Calendar,
  Sparkles,
  ChevronRight,
  Pill,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { DiseaseRiskAssessment, calculateDiseaseRisks, RiskLevel } from '../lib/disease/epidemiology';
import { CropType } from '../lib/irrigation/fao56';
import { HourlyAgroForecast } from '../lib/weather/openMeteo';
import { Language, translations } from '../lib/i18n';

interface DiseaseRiskWidgetProps {
  cropType: CropType;
  currentTempC: number;
  currentHumidityPct: number;
  hourlyForecast: HourlyAgroForecast[];
  lang?: Language;
  theme?: 'dark' | 'light';
  onLogTreatment?: (disease: DiseaseRiskAssessment) => void;
}

export const DiseaseRiskWidget: React.FC<DiseaseRiskWidgetProps> = ({
  cropType,
  currentTempC,
  currentHumidityPct,
  hourlyForecast = [],
  lang = 'pt',
  theme = 'dark',
  onLogTreatment,
}) => {
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const assessments = useMemo(() => {
    return calculateDiseaseRisks(cropType, currentTempC, currentHumidityPct, hourlyForecast, lang);
  }, [cropType, currentTempC, currentHumidityPct, hourlyForecast, lang]);

  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>(
    assessments[0]?.id || 'vinha-mildio'
  );

  const currentDisease = assessments.find((a) => a.id === selectedDiseaseId) || assessments[0];

  if (!currentDisease) return null;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/40',
          text: 'text-red-400',
          badgeBg: 'bg-red-950 border-red-500/50 text-red-300',
          fill: '#ef4444',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-950 border-amber-500/50 text-amber-300',
          fill: '#f59e0b',
        };
      case 'low':
      default:
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-950 border-emerald-500/50 text-emerald-300',
          fill: '#10b981',
        };
    }
  };

  const riskColors = getRiskColor(currentDisease.riskLevel);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Disease Selector Carousel/Buttons */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {assessments.map((d) => {
          const isSelected = d.id === currentDisease.id;
          const isCrit = d.riskLevel === 'critical';
          const isMod = d.riskLevel === 'moderate';

          return (
            <button
              key={d.id}
              onClick={() => setSelectedDiseaseId(d.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center space-x-1.5 border ${
                isSelected
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{d.name.split(' ')[0]}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCrit ? 'bg-red-500 animate-pulse' : isMod ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Main Gauge & Epidemiological Card */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : `${riskColors.bg} border-slate-800`
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentDisease.name}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColors.badgeBg}`}>
                {currentDisease.statusLabel}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 italic mt-0.5 font-serif">
              {currentDisease.scientificName}
            </p>
          </div>

          {/* Visual Gauge Value */}
          <div className="flex flex-col items-end">
            <div className={`text-2xl font-black font-mono ${riskColors.text}`}>
              {currentDisease.riskScore}%
            </div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              {isEn ? 'Infection Index' : 'Índice de Risco'}
            </span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              currentDisease.riskLevel === 'critical'
                ? 'bg-gradient-to-r from-amber-500 to-red-500'
                : currentDisease.riskLevel === 'moderate'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${currentDisease.riskScore}%` }}
          />
        </div>

        {/* Bio-mathematical diagnostic explanation */}
        <div
          className={`mt-3 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          <span className="font-bold text-white flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEn ? 'Bio-Climatic Diagnosis:' : 'Diagnóstico Bio-Climático:'}</span>
          </span>
          {currentDisease.diagnostic}
        </div>
      </div>

      {/* 5-Day Risk Projection Trajectory */}
      <div
        className={`p-3 rounded-2xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-bold font-mono uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {isEn ? '5-Day Disease Pressure Projection' : 'Projeção de Pressão da Doença (5 Dias)'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Open-Meteo GFS</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {currentDisease.projection5Days.map((p, idx) => {
            const isCrit = p.riskLevel === 'critical';
            const isMod = p.riskLevel === 'moderate';

            return (
              <div
                key={idx}
                className={`p-2 rounded-xl border text-[10px] transition-all ${
                  isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-950 border-slate-800/80'
                }`}
              >
                <div className="font-bold text-slate-400">{p.dayLabel}</div>
                <div
                  className={`text-xs font-black font-mono mt-1 ${
                    isCrit ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {p.riskScore}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {p.precipMm > 0 ? `${p.precipMm}mm` : `${p.avgTempC}°C`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Treatment Window & Active Substances */}
      <div
        className={`p-3.5 rounded-2xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center space-x-2 text-[11px] font-bold text-white mb-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{isEn ? 'Targeted Operational Directive:' : 'Diretriz de Posicionamento do Tratamento:'}</span>
        </div>
        <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          {currentDisease.sprayRecommendation}
        </p>

        {/* Authorized Active Ingredients */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1.5">
            {isEn ? 'Homologated Active Substances (DGAV / EU):' : 'Substâncias Ativas Homologadas (DGAV):'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentDisease.recommendedActiveIngredients.map((sub, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Log to Field Book Action Button */}
        {onLogTreatment && (
          <div className="mt-3 pt-2">
            <button
              onClick={() => onLogTreatment(currentDisease)}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? 'Record Treatment in Digital Field Book'
                  : 'Registar Aplicação no Caderno de Campo'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
