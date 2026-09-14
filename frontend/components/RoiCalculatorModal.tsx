'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Droplets,
  Sprout,
  ShieldAlert,
  X,
  ExternalLink,
  Sparkles,
  Leaf,
  Scale,
  Zap,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface RoiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHectares?: number;
  cropType?: string;
  lang?: Language;
}

export const RoiCalculatorModal: React.FC<RoiCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialHectares = 250,
  cropType = 'olival',
  lang = 'pt',
}) => {
  const [hectares, setHectares] = useState<number>(initialHectares);
  const [fertilizerPriceTon, setFertilizerPriceTon] = useState<number>(420); // €/ton CAN-27
  const [waterCostM3, setWaterCostM3] = useState<number>(0.18); // €/m³ pumping cost
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');

  const t = translations[lang] || translations.pt;

  // Real-world precision agronomic ROI calculations:
  const metrics = useMemo(() => {
    // 1. Variable-rate Nitrogen optimization:
    // CAN-27 saved per ha through prescription mapping (~75 kg/ha)
    const can27SavedKgPerHa = 75;
    const fertilizerSavingsPerHa = (can27SavedKgPerHa / 1000) * fertilizerPriceTon;
    const fertilizerSavings = Math.round(fertilizerSavingsPerHa * hectares);

    // 2. Irrigation & water monitoring efficiency (FAO-56):
    // 420 m³/ha saved in unnecessary pumping
    const waterSavedM3PerHa = 420;
    const waterSavingsPerHa = waterSavedM3PerHa * waterCostM3;
    const waterSavings = Math.round(waterSavingsPerHa * hectares);
    const totalWaterM3 = Math.round(waterSavedM3PerHa * hectares);

    // 3. Early detection of pest, fungal, or drainage issues (~ 28€/ha in yield losses prevented)
    const pestSavings = Math.round(hectares * 28);

    // 4. Carbon Mitigation (IPCC Tier 1: 4.6 kg CO2e / kg synthetic N avoided)
    const nAvoidedKg = hectares * can27SavedKgPerHa * 0.27;
    const co2AvoidedTons = Number(((nAvoidedKg * 4.6) / 1000).toFixed(1));

    const totalAnnualSavings = fertilizerSavings + waterSavings + pestSavings;

    // SaaS Plan Cost
    const annualCost = selectedPlan === 'starter' ? 49 * 12 : 149 * 12;
    const roiMultiplier = Math.max(1, Math.round((totalAnnualSavings / annualCost) * 10) / 10);
    const netProfit = totalAnnualSavings - annualCost;

    return {
      fertilizerSavings,
      waterSavings,
      totalWaterM3,
      pestSavings,
      co2AvoidedTons,
      totalAnnualSavings,
      annualCost,
      roiMultiplier,
      netProfit,
    };
  }, [hectares, fertilizerPriceTon, waterCostM3, selectedPlan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090d16] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] p-5 sm:p-8 text-slate-100 scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Fechar calculadora"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {lang === 'en' ? 'CropVision Dynamic ROI & Carbon Model' : 'Calculadora de ROI Agrícola & Descarbonização'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Precision satellite analytics return on investment for European agribusiness'
                : 'Retorno financeiro e poupança de insumos com base em dados de satélite Sentinel-1/2'}
            </p>
          </div>
        </div>

        {/* Interactive Hectares Slider */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'en' ? 'Total Cultivated Area (Estate / Farm):' : 'Área Total Cultivada (Herdade / Exploração):'}
            </label>
            <div className="flex items-baseline space-x-1 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {hectares.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-300 font-medium">hectares</span>
            </div>
          </div>

          <input
            type="range"
            min="10"
            max="5000"
            step="10"
            value={hectares}
            onChange={(e) => setHectares(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2.5"
          />

          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>20 ha (Vinha Familiar)</span>
            <span>250 ha (Herdade Alentejana)</span>
            <span>2.500+ ha (Agroindústria)</span>
          </div>
        </div>

        {/* Cost Parameters: Fertilizer & Pumping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {lang === 'en' ? 'Nitrogen Fertilizer (CAN-27 €/ton):' : 'Adubo Azotado (Nitrato Amónio CAN-27 €/ton):'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="200"
                max="1000"
                step="10"
                value={fertilizerPriceTon}
                onChange={(e) => setFertilizerPriceTon(Number(e.target.value) || 420)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400 font-mono">€/t</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Preço médio de mercado de azoto sintético.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {lang === 'en' ? 'Pumping & Energy Cost (€/m³):' : 'Custo de Bombagem & Água (€/m³):'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.05"
                max="1.00"
                step="0.01"
                value={waterCostM3}
                onChange={(e) => setWaterCostM3(Number(e.target.value) || 0.18)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400 font-mono">€/m³</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Consumo elétrico por m³ bombeado em gota-a-gota/pivot.
            </p>
          </div>
        </div>

        {/* Big ROI Result Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-slate-900 border border-emerald-500/40 mb-5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center space-x-1.5 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>{lang === 'en' ? 'Estimated Total Annual Savings' : 'Poupança Anual Estimada'}</span>
          </span>
          <div className="text-3xl sm:text-5xl font-black text-white tracking-tight my-2 font-mono">
            {metrics.totalAnnualSavings.toLocaleString()} €{' '}
            <span className="text-lg font-normal text-slate-400">/ ano</span>
          </div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mt-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Retorno de <strong>{metrics.roiMultiplier}x</strong> sobre a subscrição anual ({metrics.annualCost} €/ano)
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === 'en' ? 'Economic & Environmental Breakdown:' : 'Discriminação de Poupança & Sustentabilidade:'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* 1. Fertilizantes */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Adubo VRA</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {metrics.fertilizerSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Redução média de ~75 kg CAN-27/ha.
              </p>
            </div>

            {/* 2. Rega & Água */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate">Rega FAO-56</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {metrics.waterSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {metrics.totalWaterM3.toLocaleString()} m³ poupados.
              </p>
            </div>

            {/* 3. Prevenção de Perdas */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Sanidade</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {metrics.pestSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Deteção precoce de fungos/stress.
              </p>
            </div>

            {/* 4. Descarbonização */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1">
                <Leaf className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate">CO₂e Evitado</span>
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {metrics.co2AvoidedTons} t
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Fator IPCC synthetic N.
              </p>
            </div>
          </div>
        </div>

        {/* CTA to subscribe via Whop */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            Plano Pro Enterprise: <strong>149€/mês</strong> (Lucro líquido estimado: <strong>+{metrics.netProfit.toLocaleString()} €/ano</strong>).
          </div>
          <a
            href="https://whop.com/cropvision/cropvision-pro-enterprise/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            <span>Subscrever CropVision Pro na Whop</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
