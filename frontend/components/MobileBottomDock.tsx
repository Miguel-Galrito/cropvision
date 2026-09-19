'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Activity,
  ShieldAlert,
  BookOpen,
  Menu,
  X,
  PenTool,
  UploadCloud,
  GitCompare,
  Calculator,
  Share2,
  FileText,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  ChevronUp,
  Tractor,
  Droplets,
  Users,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface MobileBottomDockProps {
  lang?: Language;
  theme?: 'dark' | 'light';
  isAnalysisOpen?: boolean;
  isAnalysisCollapsed?: boolean;
  activeTab?: 'optical' | 'sar' | 'prescription' | 'irrigation' | 'climate' | 'health';
  onToggleAnalysis?: () => void;
  onSelectTab?: (tab: 'prescription' | 'irrigation' | 'health') => void;
  onOpenPhyto?: () => void;
  onOpenFieldBook?: () => void;
  onShowMap?: () => void;
  onToggleDrawingMode?: () => void;
  isDrawingModeActive?: boolean;
  onOpenParcelUploader?: () => void;
  onOpenComparator?: () => void;
  onOpenRoi?: () => void;
  onShareAudit?: () => void;
  onOpenTeamManagement?: () => void;
  onOpenMachineryGuide?: () => void;
  onExportPdf?: () => void;
  onExportConsolidatedPdf?: () => void;
  onOpenSettings?: () => void;
  onOpenPricing?: () => void;
  onToggleTheme?: () => void;
  onLanguageChange?: (newLang: Language) => void;
  activeAnomaliesCount?: number;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  lang = 'pt',
  theme = 'dark',
  isAnalysisOpen = true,
  isAnalysisCollapsed = false,
  activeTab = 'optical',
  onToggleAnalysis,
  onSelectTab,
  onOpenPhyto,
  onOpenFieldBook,
  onShowMap,
  onToggleDrawingMode,
  isDrawingModeActive = false,
  onOpenParcelUploader,
  onOpenComparator,
  onOpenRoi,
  onShareAudit,
  onOpenTeamManagement,
  onOpenMachineryGuide,
  onExportPdf,
  onExportConsolidatedPdf,
  onOpenSettings,
  onOpenPricing,
  onToggleTheme,
  onLanguageChange,
  activeAnomaliesCount = 0,
}) => {
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  return (
    <>
      {/* 1. FIXED BOTTOM DOCK (MOBILE ONLY: < sm) - 4 EXACT FAST ACTION BUTTONS */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden h-16 border-t backdrop-blur-2xl px-2 flex items-center justify-around select-none transition-colors pb-safe ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
            : 'bg-[#070b14]/95 border-slate-800/90 text-slate-300 shadow-[0_-4px_24px_rgba(0,0,0,0.45)]'
        }`}
      >
        {/* Button 1: Mapa / Talhões */}
        <button
          onClick={() => {
            setIsMoreDrawerOpen(false);
            if (onShowMap) onShowMap();
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isAnalysisCollapsed
              ? 'text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight font-semibold">
            {lang === 'en' ? 'Map / Fields' : 'Mapa / Talhões'}
          </span>
        </button>

        {/* Button 2: VRA Adubo */}
        <button
          onClick={() => {
            setIsMoreDrawerOpen(false);
            if (onSelectTab) {
              onSelectTab('prescription');
            } else if (onToggleAnalysis) {
              onToggleAnalysis();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            !isAnalysisCollapsed && activeTab === 'prescription'
              ? 'text-emerald-400 font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tractor className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight font-semibold">
            {lang === 'en' ? 'VRA Fertilizer' : 'VRA Adubo'}
          </span>
        </button>

        {/* Button 3: Rega FAO */}
        <button
          onClick={() => {
            setIsMoreDrawerOpen(false);
            if (onSelectTab) {
              onSelectTab('irrigation');
            } else if (onToggleAnalysis) {
              onToggleAnalysis();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            !isAnalysisCollapsed && activeTab === 'irrigation'
              ? 'text-sky-400 font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Droplets className="w-5 h-5 mb-0.5 text-sky-400" />
          <span className="text-[10px] tracking-tight font-semibold">
            {lang === 'en' ? 'FAO Water' : 'Rega FAO'}
          </span>
        </button>

        {/* Button 4: Alertas & Risco */}
        <button
          onClick={() => {
            setIsMoreDrawerOpen(false);
            if (onSelectTab) {
              onSelectTab('health');
            } else if (onOpenPhyto) {
              onOpenPhyto();
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            !isAnalysisCollapsed && activeTab === 'health'
              ? 'text-rose-400 font-bold'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5 mb-0.5 text-rose-400" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500 border border-slate-900 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight font-semibold">
            {lang === 'en' ? 'Alerts & Risk' : 'Alertas & Risco'}
          </span>
        </button>
      </nav>

      {/* 2. MOBILE "MORE" DRAWER MODAL */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop Click */}
          <div
            className="flex-1"
            onClick={() => setIsMoreDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div
            className={`w-full rounded-t-3xl border-t p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#090d16] border-slate-800 text-slate-200'
            }`}
          >
            {/* Header with Grab Bar and Close */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-xs">
                  CV
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {lang === 'en' ? 'CropVision Tools' : 'Ferramentas CropVision'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'en' ? 'Earth Observation B2B Suite' : 'Plataforma B2B de Deteção Remota'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Draw Parcel */}
              {onToggleDrawingMode && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onToggleDrawingMode();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isDrawingModeActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <PenTool className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{t.drawParcel}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Tap polygon points on map' : 'Desenhar vértices no mapa'}
                    </div>
                  </div>
                </button>
              )}

              {/* Import Parcel SIG */}
              {onOpenParcelUploader && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenParcelUploader();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-teal-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{t.importParcelBtn || 'Importar SIG'}</div>
                    <div className="text-[10px] text-slate-400">GeoJSON, KML, Shapefile</div>
                  </div>
                </button>
              )}

              {/* Temporal Comparator */}
              {onOpenComparator && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenComparator();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <GitCompare className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'ΔNDVI Comparator' : 'Comparador ΔNDVI'}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Sentinel-2 Split Slider' : 'Controlo deslizante temporal'}
                    </div>
                  </div>
                </button>
              )}

              {/* Dynamic ROI Calculator */}
              {onOpenRoi && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenRoi();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <Calculator className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'ROI & CO2 Calculator' : 'Calculadora ROI & CO2'}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Input savings & ESG' : 'Poupança de adubo e água'}
                    </div>
                  </div>
                </button>
              )}

              {/* Share Public Audit */}
              {onShareAudit && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onShareAudit();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-sky-50 border-sky-200 text-sky-900'
                      : 'bg-sky-950/50 border-sky-500/30 text-sky-200 hover:border-sky-500/60'
                  }`}
                >
                  <Share2 className="w-5 h-5 text-sky-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'Share Web Audit' : 'Auditoria Web'}</div>
                    <div className="text-[10px] text-sky-400/80">
                      {lang === 'en' ? 'Public link for banks/IFAP' : 'Link de leitura bancária/IFAP'}
                    </div>
                  </div>
                </button>
              )}

              {/* Official Agronomic PDF */}
              {onExportPdf && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onExportPdf();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <FileText className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{t.pdfReport}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Official 2-page A4 audit' : 'Certificado oficial A4'}
                    </div>
                  </div>
                </button>
              )}

              {/* Consolidated Farm PDF */}
              {onExportConsolidatedPdf && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onExportConsolidatedPdf();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all col-span-2 ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/60'
                  }`}
                >
                  <FileText className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'Consolidated Estate PDF (1-Click)' : 'Relatório Consolidado da Herdade (1-Click)'}</div>
                    <div className="text-[10px] text-emerald-400/80">
                      {lang === 'en' ? 'Multi-parcel executive audit for banks & IFAP' : 'Auditoria multi-parcelar executiva'}
                    </div>
                  </div>
                </button>
              )}

              {/* Team & RBAC Management */}
              {onOpenTeamManagement && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenTeamManagement();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <Users className="w-5 h-5 text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'Team & RBAC' : 'Equipa & Permissões'}</div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Roles & Cab Mode' : 'Funções e modo cabine'}
                    </div>
                  </div>
                </button>
              )}

              {/* In-Cab Tractor Setup Guide */}
              {onOpenMachineryGuide && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenMachineryGuide();
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-200 hover:border-amber-500/60'
                  }`}
                >
                  <Tractor className="w-5 h-5 text-amber-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs">{lang === 'en' ? 'Tractor Setup Guide' : 'Guia Trator USB'}</div>
                    <div className="text-[10px] text-amber-400/80">
                      {lang === 'en' ? 'John Deere / Trimble' : 'John Deere / Trimble'}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Account, Settings & System Controls */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              {/* Pricing / Pro */}
              {onOpenPricing && (
                <button
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenPricing();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>{t.pricing}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-950/20 px-2 py-0.5 rounded">
                    Whop Pro
                  </span>
                </button>
              )}

              <div className="flex items-center space-x-2 pt-1">
                {/* Farm Settings */}
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsMoreDrawerOpen(false);
                      onOpenSettings();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300 flex items-center justify-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>{t.farmSettings}</span>
                  </button>
                )}

                {/* Theme Toggle */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300 flex items-center justify-center space-x-1.5"
                    title="Alternar Modo Campo"
                  >
                    {isLight ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span>{isLight ? 'Dark' : 'Campo'}</span>
                  </button>
                )}

                {/* Language Toggle */}
                {onLanguageChange && (
                  <button
                    onClick={() => onLanguageChange(lang === 'pt' ? 'en' : 'pt')}
                    className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300 flex items-center justify-center space-x-1.5"
                  >
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'pt' ? 'EN' : 'PT'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
