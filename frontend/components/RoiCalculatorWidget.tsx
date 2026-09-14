'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Droplets,
  Sprout,
  Leaf,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Euro,
  Scale,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface RoiCalculatorWidgetProps {
  areaHectares: number;
  cropType?: string;
  lang?: Language;
  theme?: 'dark' | 'light';
  onOpenModal?: () => void;
}

export const RoiCalculatorWidget: React.FC<RoiCalculatorWidgetProps> = ({
  areaHectares = 28.5,
  cropType = 'olival',
  lang = 'pt',
  theme = 'dark',
  onOpenModal,
}) => {
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  // Adjustable economic inputs
  const [fertilizerPriceTon, setFertilizerPriceTon] = useState<number>(420); // €/ton CAN-27
  const [waterCostM3, setWaterCostM3] = useState<number>(0.18); // €/m³ pumping cost
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');

  const effectiveArea = Math.max(1, areaHectares);

  // Dynamic agronomic calculations
  const metrics = useMemo(() => {
    // 1. Variable-rate Nitrogen optimization:
    // Typical nitrogen dose: 120-150 kg N/ha (~450 kg CAN-27 / ha).
    // VRA saves ~18% through zone-specific redistribution.
    const can27SavedKgPerHa = 75; // 75 kg CAN-27 / ha saved
    const fertilizerSavedPerHa = (can27SavedKgPerHa / 1000) * fertilizerPriceTon;
    const totalFertilizerSavings = fertilizerSavedPerHa * effectiveArea;

    // 2. Irrigation & Pumping Energy (FAO-56):
    // Prevents over-irrigation saving ~420 m³/ha per irrigation season
    const waterSavedM3PerHa = 420;
    const waterSavedPerHa = waterSavedM3PerHa * waterCostM3;
    const totalWaterSavings = waterSavedPerHa * effectiveArea;
    const totalWaterM3 = waterSavedM3PerHa * effectiveArea;

    // 3. Carbon Mitigation (IPCC Tier 1 factor for synthetic N):
    // CAN-27 has 27% active N. 75 kg CAN-27 = 20.25 kg N.
    // Factor: 4.6 kg CO2e / kg N avoided (Haber-Bosch production + N2O soil emissions)
    const nAvoidedKgPerHa = can27SavedKgPerHa * 0.27;
    const co2AvoidedKgPerHa = nAvoidedKgPerHa * 4.6;
    const totalCo2AvoidedTons = (co2AvoidedKgPerHa * effectiveArea) / 1000;

    // 4. Yield Protection (Early satellite detection of fungal stress):
    const pestProtectionSavings = effectiveArea * 28;

    const totalAnnualSavings = Math.round(
      totalFertilizerSavings + totalWaterSavings + pestProtectionSavings
    );

    const subscriptionCostAnnual = selectedPlan === 'starter' ? 49 * 12 : 149 * 12;
    const roiMultiplier = (totalAnnualSavings / subscriptionCostAnnual).toFixed(1);

    return {
      fertilizerSavedPerHa: Math.round(fertilizerSavedPerHa),
      totalFertilizerSavings: Math.round(totalFertilizerSavings),
      waterSavedPerHa: Math.round(waterSavedPerHa),
      totalWaterSavings: Math.round(totalWaterSavings),
      totalWaterM3: Math.round(totalWaterM3),
      totalCo2AvoidedTons: Number(totalCo2AvoidedTons.toFixed(1)),
      totalAnnualSavings,
      roiMultiplier,
      subscriptionCostAnnual,
    };
  }, [fertilizerPriceTon, waterCostM3, effectiveArea, selectedPlan]);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isLight
          ? 'bg-slate-50/90 border-slate-200 text-slate-900'
          : 'bg-slate-900/80 border-slate-800 text-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              {lang === 'en' ? 'Dynamic ROI & Carbon Mitigation' : 'Retorno Económico & Descarbonização'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {lang === 'en'
                ? `Calculated for ${effectiveArea} ha (${cropType})`
                : `Calculado para ${effectiveArea} ha (${cropType})`}
            </p>
          </div>
        </div>

        {onOpenModal && (
          <button
            onClick={onOpenModal}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
          >
            <span>{lang === 'en' ? 'Full Model' : 'Expandir'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Big ROI Hero Result */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900/60 to-teal-950/40 border border-emerald-500/40 mb-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{lang === 'en' ? 'Estimated Annual Savings' : 'Poupança Anual Estimada'}</span>
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {metrics.totalAnnualSavings.toLocaleString()} €
              <span className="text-xs font-normal text-slate-400 ml-1">/ ano</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-400">
              {lang === 'en' ? 'Subscription ROI' : 'Múltiplo de ROI'}
            </span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {metrics.roiMultiplier}x
            </div>
            <span className="text-[9px] text-emerald-300/80">
              {lang === 'en' ? 'Net payback' : 'Retorno direto'}
            </span>
          </div>
        </div>
      </div>

      {/* Adjustable Parameter Inputs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <label className="text-[10px] text-slate-400 block mb-1">
            {lang === 'en' ? 'CAN-27 Price (€/ton):' : 'Preço CAN-27 (€/ton):'}
          </label>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min="200"
              max="900"
              step="10"
              value={fertilizerPriceTon}
              onChange={(e) => setFertilizerPriceTon(Number(e.target.value) || 420)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">€/t</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <label className="text-[10px] text-slate-400 block mb-1">
            {lang === 'en' ? 'Pumping Cost (€/m³):' : 'Custo Rega (€/m³):'}
          </label>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min="0.05"
              max="0.80"
              step="0.01"
              value={waterCostM3}
              onChange={(e) => setWaterCostM3(Number(e.target.value) || 0.18)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">€/m³</span>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Badges */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        {/* Fertilizer Savings */}
        <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-emerald-400 mb-1">
            <Sprout className="w-3 h-3" />
            <span className="font-semibold truncate">{lang === 'en' ? 'Fertilizer' : 'Adubo VRA'}</span>
          </div>
          <div className="font-mono text-xs font-bold text-white">
            {metrics.totalFertilizerSavings.toLocaleString()} €
          </div>
          <span className="text-[9px] text-slate-400 mt-0.5">
            ~{metrics.fertilizerSavedPerHa} €/ha
          </span>
        </div>

        {/* Water / Irrigation Savings */}
        <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-sky-400 mb-1">
            <Droplets className="w-3 h-3" />
            <span className="font-semibold truncate">{lang === 'en' ? 'Water Saved' : 'Água FAO-56'}</span>
          </div>
          <div className="font-mono text-xs font-bold text-white">
            {metrics.totalWaterSavings.toLocaleString()} €
          </div>
          <span className="text-[9px] text-slate-400 mt-0.5">
            {metrics.totalWaterM3.toLocaleString()} m³
          </span>
        </div>

        {/* Carbon Mitigation */}
        <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-teal-400 mb-1">
            <Leaf className="w-3 h-3" />
            <span className="font-semibold truncate">{lang === 'en' ? 'Carbon' : 'Mitigação'}</span>
          </div>
          <div className="font-mono text-xs font-bold text-white">
            {metrics.totalCo2AvoidedTons} t
          </div>
          <span className="text-[9px] text-slate-400 mt-0.5">
            CO₂e evitado
          </span>
        </div>
      </div>
    </div>
  );
};
