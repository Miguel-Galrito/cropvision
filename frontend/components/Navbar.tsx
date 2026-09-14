'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  Settings,
  User,
  Sparkles,
  UploadCloud,
  FileText,
  ChevronDown,
  Activity,
  Satellite,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { FarmModel } from '../lib/gis/parcelStorage';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  locationName?: string | null;
  farms: FarmModel[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onOpenPricing?: () => void;
  onOpenParcelUploader?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onExportPdf?: () => void;
  activeAnomaliesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiHealthy,
  lat,
  lon,
  locationName,
  farms,
  activeFarmId,
  onSelectFarm,
  onOpenPricing,
  onOpenParcelUploader,
  onOpenSettings,
  onOpenNotifications,
  onExportPdf,
  activeAnomaliesCount = 3,
}) => {
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-800/90 bg-[#070b14]/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between no-print select-none">
      {/* LEFT: Brand & Prominent Active Satellite Badge & Farm Switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Crisp Satellite Logo with PROMINENT OVERLAID PULSING GREEN ACTIVE BADGE */}
        <div className="relative shrink-0 flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0c1322] border border-emerald-500/50 shadow-lg shadow-emerald-500/20 overflow-hidden">
            <img
              src="/icon.svg"
              alt="CropVision"
              className="w-full h-full object-contain p-1.5"
            />
          </div>

          {/* Overlaid Green Active Status Dot (Highly Visible & Elevated) */}
          <div
            className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center"
            title="Sinal de Satélite Ativo em Tempo Real"
          >
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#070b14] shadow-[0_0_8px_#34d399]"></span>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black tracking-wider text-white font-mono flex items-center">
              CROP<span className="text-emerald-400">VISION</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black tracking-widest text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded uppercase">
              DEEP-TECH SAR
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>FEED ATIVO: SENTINEL-2 &amp; S1</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-800" />

        {/* Farm Selector Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[140px] truncate">{activeFarm?.name || 'Exploração Agrícola'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFarmDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl bg-[#0c1322] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 px-3 py-1 font-bold">
                Explorações Cadastradas
              </div>
              <div className="space-y-1 mt-1">
                {farms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFarm(f.id);
                      setIsFarmDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      f.id === activeFarmId
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{f.locationLabel}</div>
                    </div>
                    {f.id === activeFarmId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: System Telemetry Status Badge (Desktop) */}
      <div className="hidden xl:flex items-center space-x-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
          <span>Satélite S2: Nominal | S1 SAR: Ativo</span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="font-mono text-slate-400 text-[11px]">
          {lat.toFixed(4)}°, {lon.toFixed(4)}°
        </span>
      </div>

      {/* RIGHT: Actions & User Dock */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Notification Bell with Badge */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Centro de Alertas e Notificações de Anomalias"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-md">
                {activeAnomaliesCount}
              </span>
            )}
          </button>
        )}

        {/* SIG Parcel Upload */}
        {onOpenParcelUploader && (
          <button
            onClick={onOpenParcelUploader}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-semibold transition-all shadow-sm"
            title="Carregar limites cadastrais (Shapefile, GeoJSON ou KML)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Polígono SIG</span>
            <span className="sm:hidden">SIG</span>
          </button>
        )}

        {/* Export Technical PDF Report Button */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm"
            title="Exportar Relatório Técnico Agronómico Oficial em PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Relatório PDF</span>
          </button>
        )}

        {/* Farm Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Definições Agronómicas da Exploração (Cultura, Rega, Compasso)"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        )}

        {/* Pricing / Monetization Button */}
        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 border border-emerald-300/40"
            title="Consultar Planos B2B e Subscrições CropVision"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span className="hidden sm:inline">Planos B2B</span>
            <span className="sm:hidden">Pro</span>
          </button>
        )}

        {/* User Profile Avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 shrink-0 font-mono text-xs font-bold shadow-inner"
          title="Sessão Iniciada: Agrónomo Responsável"
        >
          <User className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </header>
  );
};
