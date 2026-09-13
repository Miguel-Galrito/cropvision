'use client';

import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Droplets,
  Sprout,
  ShieldAlert,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface RoiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoiCalculatorModal: React.FC<RoiCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [hectares, setHectares] = useState<number>(250);

  if (!isOpen) return null;

  // Real-world agronomic precision savings model:
  // 1. Variable-rate fertilizer optimization (nitrogen & NPK savings ~ 24€/ha/yr)
  const fertilizerSavings = Math.round(hectares * 24);

  // 2. Irrigation & water monitoring efficiency (energy + water ~ 18€/ha/yr)
  const waterSavings = Math.round(hectares * 18);

  // 3. Early detection of pest, fungal, or drainage issues (~ 32€/ha/yr in saved yield losses)
  const pestSavings = Math.round(hectares * 32);

  const totalAnnualSavings = fertilizerSavings + waterSavings + pestSavings;

  // Pro Enterprise cost: 149€/month * 12 months = 1,788€/year
  const annualCostPro = 149 * 12;
  const roiMultiplier = Math.max(1, Math.round(totalAnnualSavings / annualCostPro));

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
              Calculadora de ROI Agrícola
            </h2>
            <p className="text-xs text-slate-400">
              Estime o retorno sobre investimento com monitorização de satélite Sentinel-2
            </p>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold text-slate-300">
              Área Total Cultivada (Herdade / Exploração):
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
            min="50"
            max="5000"
            step="25"
            value={hectares}
            onChange={(e) => setHectares(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2.5"
          />

          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>50 ha (Pequena Quinta)</span>
            <span>1.000 ha (Média Herdade)</span>
            <span>5.000 ha (Grande Agroindústria)</span>
          </div>
        </div>

        {/* Big ROI Result Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-slate-900 border border-emerald-500/40 mb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center space-x-1.5 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Poupança Anual Estimada</span>
          </span>
          <div className="text-3xl sm:text-5xl font-black text-white tracking-tight my-2">
            {totalAnnualSavings.toLocaleString()} € <span className="text-lg font-normal text-slate-400">/ ano</span>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mt-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retorno de {roiMultiplier}x sobre o investimento do Plano Pro Enterprise</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Discriminação das Fontes de Poupança por Hectare:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Fertilizantes */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 mb-1">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Fertilizantes & NPK</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {fertilizerSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Poupança em taxas variáveis guiadas por NDVI (~24€/ha).
              </p>
            </div>

            {/* 2. Rega & Água */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 mb-1">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Gestão da Rega</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {waterSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Redução de bombagem e deteção de zonas saturadas (~18€/ha).
              </p>
            </div>

            {/* 3. Prevenção de Perdas */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Pragas & Stress</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {pestSavings.toLocaleString()} €
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ação rápida antecipada antes da quebra de colheita (~32€/ha).
              </p>
            </div>
          </div>
        </div>

        {/* CTA to subscribe Pro */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            Custo do plano Pro: apenas <strong>149€/mês</strong> com parcelas ilimitadas.
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
