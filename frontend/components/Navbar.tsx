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
  Globe,
  Sun,
  Moon,
  PenTool,
} from 'lucide-react';
import { FarmModel } from '../lib/gis/parcelStorage';
import { Language, translations } from '../lib/i18n';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  locationName?: string | null;
  farms: FarmModel[];
  activeFarmId: string;
  lang?: Language;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLanguageChange?: (newLang: Language) => void;
  onSelectFarm: (farmId: string) => void;
  onOpenPricing?: () => void;
  onOpenParcelUploader?: () => void;
  isDrawingModeActive?: boolean;
  onToggleDrawingMode?: () => void;
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
  lang = 'pt',
  theme = 'dark',
  onToggleTheme,
  onLanguageChange,
  onSelectFarm,
  onOpenPricing,
  onOpenParcelUploader,
  isDrawingModeActive = false,
  onToggleDrawingMode,
  onOpenSettings,
  onOpenNotifications,
  onExportPdf,
  activeAnomaliesCount = 3,
}) => {
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-16 border-b px-3 sm:px-6 flex items-center justify-between no-print select-none transition-colors ${
        isLight
          ? 'bg-white/95 border-slate-200/90 backdrop-blur-xl text-slate-900 shadow-sm'
          : 'bg-[#070b14]/95 border-slate-800/90 backdrop-blur-xl text-white'
      }`}
    >
      {/* LEFT: Brand & Active Satellite Badge & Farm Switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        {/* Crisp Satellite Logo with Active Status Pulse */}
        <div className="relative shrink-0 flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-2xl border shadow-lg overflow-hidden ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 shadow-emerald-500/10'
                : 'bg-[#0c1322] border-emerald-500/50 shadow-emerald-500/20'
            }`}
          >
            <img
              src="/icon.svg"
              alt="CropVision"
              className="w-full h-full object-contain p-1.5"
            />
          </div>

          {/* Overlaid Green Active Status Dot */}
          <div
            className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center"
            title={lang === 'en' ? 'Live Satellite Feed Active' : 'Sinal de Satélite Ativo em Tempo Real'}
          >
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-80"></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 shadow-[0_0_8px_#34d399] ${
                isLight ? 'border-white' : 'border-[#070b14]'
              }`}
            ></span>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center space-x-2">
            <span
              className={`text-lg font-black tracking-wider font-mono flex items-center ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              CROP<span className="text-emerald-500">VISION</span>
            </span>
            <span
              className={`hidden sm:inline-block text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase border ${
                isLight
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                  : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {t.brandSub}
            </span>
          </div>
          <div className="text-[10px] text-emerald-500 font-mono tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>{t.feedLive}</span>
          </div>
        </div>

        {/* Divider */}
        <div className={`hidden lg:block h-6 w-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

        {/* Farm Selector Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/70 hover:border-emerald-500/50 text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="max-w-[140px] truncate">{activeFarm?.name || t.selectEstate}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFarmDropdownOpen && (
            <div
              className={`absolute top-full mt-2 left-0 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#0c1322] border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 px-3 py-1 font-bold">
                {t.activeEstates}
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
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{f.locationLabel}</div>
                    </div>
                    {f.id === activeFarmId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: System Telemetry Status Badge (Desktop) */}
      <div
        className={`hidden xl:flex items-center space-x-3 px-4 py-1.5 rounded-full border text-xs shadow-inner ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-slate-900/90 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-1.5 text-emerald-500 font-mono text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399] animate-pulse"></span>
          <span>{t.systemNominal}</span>
        </div>
        <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>|</span>
        <span className="font-mono text-slate-500 text-[11px]">
          {lat.toFixed(4)}°, {lon.toFixed(4)}°
        </span>
      </div>

      {/* RIGHT: Actions & User Dock */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* THEME TOGGLE: Dark Tech vs Modo Campo (Light) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title={isLight ? 'Mudar para Modo Dark Tech' : 'Mudar para Modo Campo (Alto Contraste)'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline">{t.themeDark}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">{t.themeLight}</span>
              </>
            )}
          </button>
        )}

        {/* Quick Language Toggle */}
        {onLanguageChange && (
          <button
            onClick={() => onLanguageChange(lang === 'pt' ? 'en' : 'pt')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'pt' ? 'EN' : 'PT'}</span>
          </button>
        )}

        {/* Notification Bell with Badge */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-xl border transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={t.alertsTitle}
          >
            <Bell className="w-4 h-4" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-md">
                {activeAnomaliesCount}
              </span>
            )}
          </button>
        )}

        {/* Draw Parcel Button */}
        {onToggleDrawingMode && (
          <button
            onClick={onToggleDrawingMode}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              isDrawingModeActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold animate-pulse'
                : isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/40 hover:border-emerald-500'
            }`}
            title={lang === 'en' ? 'Draw parcel directly on map' : 'Desenhar talhão diretamente no mapa'}
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t.drawParcel}</span>
          </button>
        )}

        {/* Import Parcel (GeoJSON, KML, Shapefile) */}
        {onOpenParcelUploader && (
          <button
            onClick={onOpenParcelUploader}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-500/60'
            }`}
            title={lang === 'en' ? 'Import field boundaries (.geojson, .kml, .zip)' : 'Importar limites cadastrais (.geojson, .kml ou .zip)'}
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">{t.importParcelBtn || t.sigPolygon}</span>
            <span className="sm:hidden">SIG</span>
          </button>
        )}

        {/* Export Technical PDF Report Button */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title={lang === 'en' ? 'Generate Official Technical PDF Report' : 'Exportar Relatório Técnico Agronómico Oficial em PDF'}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t.pdfReport}</span>
          </button>
        )}

        {/* Farm Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition-all shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={t.farmSettings}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Pricing / Monetization Button */}
        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 border border-emerald-300/40 cursor-pointer"
            title={t.pricing}
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span className="hidden sm:inline">{t.pricing}</span>
            <span className="sm:hidden">Pro</span>
          </button>
        )}

        {/* User Profile Avatar */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl border shrink-0 font-mono text-xs font-bold shadow-inner ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-emerald-700'
              : 'bg-slate-800 border-slate-700 text-emerald-400'
          }`}
          title={t.agronomistSession}
        >
          <User className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
    </header>
  );
};
