'use client';

import React from 'react';
import { ExternalLink, MapPin, Calculator, Sparkles, UploadCloud, Image as ImageIcon } from 'lucide-react';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  locationName?: string | null;
  onRefresh?: () => void;
  onOpenPricing?: () => void;
  onOpenRoi?: () => void;
  onOpenParcelUploader?: () => void;
  onOpenBanners?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiHealthy,
  lat,
  lon,
  locationName,
  onOpenPricing,
  onOpenRoi,
  onOpenParcelUploader,
  onOpenBanners,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between no-print select-none">
      {/* Brand & Crisp Aerospace Logo */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden border border-emerald-500/50 shadow-lg shadow-emerald-500/25 shrink-0 bg-[#0c1322]">
          <img
            src="/icon.svg"
            alt="CropVision Logo"
            className="w-full h-full object-contain p-1"
          />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black tracking-wider text-white font-mono flex items-center">
              CROP<span className="text-emerald-400">VISION</span>
            </span>
            <span className="text-[9px] font-black tracking-widest text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded uppercase">
              DEEP-TECH SAR
            </span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-wide font-medium items-center space-x-1.5 hidden md:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>ESA Copernicus Sentinel-2 L2A &amp; Sentinel-1 SAR Radar</span>
          </div>
        </div>
      </div>

      {/* Center Mission Ticker (Desktop) */}
      <div className="hidden xl:flex items-center space-x-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800/90 text-xs shadow-inner">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-[220px] truncate text-slate-200 font-medium">
            {locationName || 'Alvo Agrícola'}
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="font-mono text-slate-400 text-[11px]">
          {lat.toFixed(4)}°, {lon.toFixed(4)}°
        </span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
          <span>STAC Cloud Active</span>
        </div>
      </div>

      {/* Right Action Buttons & Monetization */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Upload Parcel GeoJSON Button */}
        {onOpenParcelUploader && (
          <button
            onClick={onOpenParcelUploader}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-semibold transition-all shadow-sm"
            title="Importar polígono de parcela em GeoJSON ou KML"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Polígono SIG</span>
            <span className="sm:hidden">SIG</span>
          </button>
        )}

        {/* Banners 4K & Brand Assets Button */}
        {onOpenBanners && (
          <button
            onClick={onOpenBanners}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-500/60 text-xs font-semibold transition-all shadow-sm"
            title="Ver galeria oficial de banners 4K e logótipos aeroespaciais"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Banners 4K</span>
          </button>
        )}

        {/* ROI Calculator Button */}
        {onOpenRoi && (
          <button
            onClick={onOpenRoi}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-medium transition-all"
            title="Calcular poupança estimada da herdade"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Calculadora de ROI</span>
          </button>
        )}

        {/* Pricing Modal Highlighted Button (Whop) */}
        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 border border-emerald-300/40"
            title="Ver planos e preços CropVision na Whop"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span>Planos &amp; Preços</span>
          </button>
        )}

        {/* GitHub Repo Link */}
        <a
          href="https://github.com/Miguel-Galrito/cropvision-saas"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Ver código no GitHub"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
