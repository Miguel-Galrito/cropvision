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
  BookOpen,
  Calculator,
  GitCompare,
  Share2,
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
  onOpenFieldBook?: () => void;
  onOpenComparator?: () => void;
  onOpenRoi?: () => void;
  onShareAudit?: () => void;
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
  onOpenFieldBook,
  onOpenComparator,
  onOpenRoi,
  onShareAudit,
  activeAnomaliesCount = 3,
}) => {
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const [isSigMenuOpen, setIsSigMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const closeAllMenus = () => {
    setIsFarmDropdownOpen(false);
    setIsSigMenuOpen(false);
    setIsToolsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  return (
    <>
      {/* Invisible backdrop to dismiss any open dropdown on outside click */}
      {(isFarmDropdownOpen || isSigMenuOpen || isToolsMenuOpen || isProfileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={closeAllMenus}
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 border-b px-3 sm:px-6 flex items-center justify-between no-print select-none transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200/90 backdrop-blur-xl text-slate-900 shadow-sm'
            : 'bg-[#070b14]/95 border-slate-800/90 backdrop-blur-xl text-white shadow-lg'
        }`}
      >
        {/* LEFT: Brand & Active Farm Switcher */}
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
              className="absolute -top-1 -right-1 z-20 flex items-center justify-center"
              title={lang === 'en' ? 'Live Satellite Feed Active' : 'Sinal de Satélite Ativo em Tempo Real'}
            >
              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-80"></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 ${
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
          <div className={`hidden md:block h-6 w-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

          {/* Farm Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setIsFarmDropdownOpen(!isFarmDropdownOpen);
                setIsSigMenuOpen(false);
                setIsToolsMenuOpen(false);
                setIsProfileMenuOpen(false);
              }}
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

        {/* CENTER: Clean Single-Line Telemetry Pill (Never wraps, hidden below 2xl) */}
        <div
          className={`hidden 2xl:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border text-xs shadow-inner select-none whitespace-nowrap ${
            isLight
              ? 'bg-slate-100/90 border-slate-200 text-slate-700'
              : 'bg-slate-900/90 border-slate-800/90 text-slate-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399] animate-pulse"></span>
          <span className="font-mono text-[11px] font-semibold text-emerald-400">
            Copernicus Sentinel-2 & SAR S1
          </span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>•</span>
          <span className="font-mono text-[11px] text-slate-400">
            {lat.toFixed(4)}°N, {Math.abs(lon).toFixed(4)}°W
          </span>
        </div>

        {/* RIGHT: Structured Executive Dropdown Menus */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* MENU 1: AÇÕES SIG (Desenhar & Importar) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsSigMenuOpen(!isSigMenuOpen);
                setIsToolsMenuOpen(false);
                setIsProfileMenuOpen(false);
                setIsFarmDropdownOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isDrawingModeActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50 text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'en' ? 'GIS Actions' : 'Ações SIG'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isSigMenuOpen && (
              <div
                className={`absolute top-full mt-2 right-0 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0c1322] border-slate-700 text-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 px-3 py-1 font-bold">
                  {lang === 'en' ? 'Field Boundary Tools' : 'Delimitação Cadastral'}
                </div>
                <div className="space-y-1 mt-1">
                  {onToggleDrawingMode && (
                    <button
                      onClick={() => {
                        onToggleDrawingMode();
                        setIsSigMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isDrawingModeActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <PenTool className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-bold">{t.drawParcel}</div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'en' ? 'Click vertices on map' : 'Marcar vértices no mapa'}
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenParcelUploader && (
                    <button
                      onClick={() => {
                        onOpenParcelUploader();
                        setIsSigMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="font-bold">{t.importParcelBtn || 'Importar Parcela'}</div>
                        <div className="text-[10px] text-slate-400">Shapefile (.zip), KML, GeoJSON</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MENU 2: FERRAMENTAS & RELATÓRIOS */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsToolsMenuOpen(!isToolsMenuOpen);
                setIsSigMenuOpen(false);
                setIsProfileMenuOpen(false);
                setIsFarmDropdownOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50 text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'en' ? 'Tools' : 'Ferramentas'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isToolsMenuOpen && (
              <div
                className={`absolute top-full mt-2 right-0 w-72 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#0c1322] border-slate-700 text-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 px-3 py-1 font-bold">
                  {lang === 'en' ? 'Analysis & Reporting Suite' : 'Análise & Conformidade'}
                </div>
                <div className="space-y-1 mt-1">
                  {/* Digital Field Book */}
                  {onOpenFieldBook && (
                    <button
                      onClick={() => {
                        onOpenFieldBook();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">{t.fieldBookBtn}</div>
                        <div className="text-[10px] text-slate-400">DGAV / IFAP / PAC 2023-2027</div>
                      </div>
                    </button>
                  )}

                  {/* Temporal Comparator */}
                  {onOpenComparator && (
                    <button
                      onClick={() => {
                        onOpenComparator();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <GitCompare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">{lang === 'en' ? 'ΔNDVI Temporal Comparator' : 'Comparador Temporal ΔNDVI'}</div>
                        <div className="text-[10px] text-slate-400">{lang === 'en' ? 'Sentinel-2 Split Slider' : 'Controlo deslizante de satélite'}</div>
                      </div>
                    </button>
                  )}

                  {/* Dynamic ROI */}
                  {onOpenRoi && (
                    <button
                      onClick={() => {
                        onOpenRoi();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">{lang === 'en' ? 'ROI & CO2 Calculator' : 'Calculadora de ROI & CO2'}</div>
                        <div className="text-[10px] text-slate-400">{lang === 'en' ? 'Precision Input Savings' : 'Poupança de adubo e mitigação'}</div>
                      </div>
                    </button>
                  )}

                  {/* Share Public Audit */}
                  {onShareAudit && (
                    <button
                      onClick={() => {
                        onShareAudit();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Share2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-bold">{lang === 'en' ? 'Share Public Audit Link' : 'Partilhar Auditoria Web'}</div>
                        <div className="text-[10px] text-slate-400">{lang === 'en' ? 'Read-only link for banks/IFAP' : 'Link seguro para bancos e auditoria'}</div>
                      </div>
                    </button>
                  )}

                  {/* Official PDF Report */}
                  {onExportPdf && (
                    <button
                      onClick={() => {
                        onExportPdf();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-bold">{t.pdfReport}</div>
                        <div className="text-[10px] text-slate-400">{lang === 'en' ? 'Official 2-Page A4 Audit' : 'Relatório agronómico oficial A4'}</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

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

          {/* Pricing / Whop Pro Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 border border-emerald-300/40 cursor-pointer"
              title={t.pricing}
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
              <span className="hidden sm:inline">{t.pricing}</span>
              <span className="sm:hidden">Pro</span>
            </button>
          )}

          {/* MENU 3: PROFILE & PREFERENCES (Settings, Theme, Language) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsSigMenuOpen(false);
                setIsToolsMenuOpen(false);
                setIsFarmDropdownOpen(false);
              }}
              className={`flex items-center space-x-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl border transition-all shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white'
              }`}
              title={t.agronomistSession}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {isProfileMenuOpen && (
              <div
                className={`absolute top-full mt-2 right-0 w-60 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0c1322] border-slate-700 text-slate-200'
                }`}
              >
                {/* Account info */}
                <div className="px-3 py-2 border-b border-slate-800/80">
                  <div className="text-xs font-bold truncate">Eng. Agrónomo</div>
                  <div className="text-[10px] text-slate-400 truncate">{activeFarm?.name}</div>
                </div>

                <div className="space-y-1 mt-2">
                  {/* Farm Settings */}
                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>{t.farmSettings}</span>
                    </button>
                  )}

                  {/* Theme Toggle */}
                  {onToggleTheme && (
                    <button
                      onClick={() => {
                        onToggleTheme();
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isLight ? <Moon className="w-4 h-4 text-amber-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
                        <span>{lang === 'en' ? 'Display Theme' : 'Tema Visual'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isLight ? t.themeDark : t.themeLight}
                      </span>
                    </button>
                  )}

                  {/* Language Toggle */}
                  {onLanguageChange && (
                    <button
                      onClick={() => {
                        onLanguageChange(lang === 'pt' ? 'en' : 'pt');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>{lang === 'en' ? 'Language' : 'Idioma'}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {lang === 'pt' ? 'EN (English)' : 'PT (Português)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
