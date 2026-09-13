'use client';

import React from 'react';
import { ExternalLink, MapPin, Calculator, Sparkles } from 'lucide-react';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  locationName?: string | null;
  onRefresh?: () => void;
  onOpenPricing?: () => void;
  onOpenRoi?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiHealthy,
  lat,
  lon,
  locationName,
  onOpenPricing,
  onOpenRoi,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between no-print">
      {/* Brand & Official Logo */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/20 shrink-0 bg-slate-900">
          <img
            src="/cropvision_icon.jpg"
            alt="CropVision SaaS Icon"
            className="w-full h-full object-cover"
          />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center">
              Crop<span className="text-emerald-400">Vision</span>
              <span className="ml-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded-md">
                SaaS
              </span>
            </h1>

            {/* Dynamic Orbit Live Telemetry Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>SENTINEL-2 L2A ORBIT: LIVE</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 hidden xl:block">
            Agricultural Earth Observation & Satellite NDVI Intelligence
          </p>
        </div>
      </div>

      {/* Center Coordinates Preview with City Name (Desktop) */}
      <div className="hidden lg:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
        {locationName && (
          <>
            <span className="flex items-center text-emerald-400 font-medium max-w-xs truncate">
              <MapPin className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />
              <span className="truncate">{locationName}</span>
            </span>
            <span className="text-slate-600">|</span>
          </>
        )}
        <span className="flex items-center text-slate-400 font-mono text-[11px]">
          {lat.toFixed(4)}°, {lon.toFixed(4)}°
        </span>
      </div>

      {/* Right Action Buttons & Monetization */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* ROI Calculator Button */}
        {onOpenRoi && (
          <button
            onClick={onOpenRoi}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-medium transition-all"
            title="Calcular poupança estimada da herdade"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Calculadora de ROI</span>
            <span className="md:hidden">ROI</span>
          </button>
        )}

        {/* Pricing Modal Highlighted Button (Whop) */}
        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/25 border border-emerald-400/40 animate-pulse-subtle"
            title="Ver planos e preços CropVision na Whop"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span>Planos & Preços</span>
          </button>
        )}

        {/* Backend / Cloud Status Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
          <span className="text-slate-300 font-medium">
            {apiHealthy === true ? 'FastAPI Local' : 'STAC Cloud Direct'}
          </span>
        </div>

        {/* GitHub Repo Link */}
        <a
          href="https://github.com/Miguel-Galrito/cropvision-saas"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Ver código no GitHub"
        >
          <span className="hidden sm:inline">GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
