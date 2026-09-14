'use client';

import React, { useState } from 'react';
import {
  Settings,
  Save,
  X,
  Sprout,
  Droplets,
  UserCheck,
  Globe,
  Award,
} from 'lucide-react';
import { CropType, IrrigationType, TrainingSystem } from '../lib/irrigation/fao56';
import { Language, translations } from '../lib/i18n';
import { Upload, Image as ImageIcon, Trash2, Building2 } from 'lucide-react';

interface FarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  isWebSummitMode: boolean;
  onToggleWebSummitMode: () => void;
  farmName: string;
  parcelName: string;
  cropType: CropType;
  trainingSystem: TrainingSystem;
  irrigationType: IrrigationType;
  agronomistName: string;
  licenseNumber: string;
  companyName?: string;
  taxId?: string;
  cadastralAddress?: string;
  customLogoUrl?: string;
  theme?: 'dark' | 'light';
  onSave: (updated: {
    farmName: string;
    parcelName: string;
    cropType: CropType;
    trainingSystem: TrainingSystem;
    irrigationType: IrrigationType;
    agronomistName: string;
    licenseNumber: string;
    companyName?: string;
    taxId?: string;
    cadastralAddress?: string;
    customLogoUrl?: string;
  }) => void;
}

export const FarmSettingsModal: React.FC<FarmSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  isWebSummitMode,
  onToggleWebSummitMode,
  farmName,
  parcelName,
  cropType,
  trainingSystem,
  irrigationType,
  agronomistName,
  licenseNumber,
  companyName = 'Finagra, S.A. (Herdade do Esporão)',
  taxId = 'PT 500 123 456',
  cadastralAddress = 'Apartado 157, 7200-999 Reguengos de Monsaraz',
  customLogoUrl,
  theme = 'dark',
  onSave,
}) => {
  const isLight = theme === 'light';
  const isEn = lang === 'en';
  const t = translations[lang] || translations.pt;

  const [fName, setFName] = useState(farmName);
  const [pName, setPName] = useState(parcelName);
  const [cType, setCType] = useState<CropType>(cropType);
  const [tSystem, setTSystem] = useState<TrainingSystem>(trainingSystem);
  const [iType, setIType] = useState<IrrigationType>(irrigationType);
  const [agroName, setAgroName] = useState(agronomistName || 'Eng. Agrónomo Miguel Silva');
  const [licNum, setLicNum] = useState(licenseNumber || 'OE-AGR-49120');

  // White-Labeling Fields
  const [compName, setCompName] = useState(companyName);
  const [tId, setTId] = useState(taxId);
  const [cadAddr, setCadAddr] = useState(cadastralAddress);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(customLogoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert(isEn ? 'Logo must be smaller than 2MB' : 'O ficheiro de logótipo tem de ser inferior a 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(undefined);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      farmName: fName,
      parcelName: pName,
      cropType: cType,
      trainingSystem: tSystem,
      irrigationType: iType,
      agronomistName: agroName,
      licenseNumber: licNum,
      companyName: compName,
      taxId: tId,
      cadastralAddress: cadAddr,
      customLogoUrl: logoPreview,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b101b] border border-slate-800 shadow-2xl p-6 text-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {t.settingsTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.settingsSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* 1. Language & Operating Mode Block (Top Priority) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            {/* Language Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.langSelectLabel}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLanguageChange('pt')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    lang === 'pt'
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🇵🇹 Português (PT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    lang === 'en'
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🇬🇧 English (EN)</span>
                </button>
              </div>
            </div>

            {/* Operating Mode Switcher */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.modeSelectLabel}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isWebSummitMode) onToggleWebSummitMode();
                  }}
                  className={`p-2 rounded-xl border text-left font-medium transition-all ${
                    isWebSummitMode
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{t.modeWebSummitVip}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'en' ? 'Unlimited demo analyses for pitch' : 'Análises ilimitadas para júri/pitch'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isWebSummitMode) onToggleWebSummitMode();
                  }}
                  className={`p-2 rounded-xl border text-left font-medium transition-all ${
                    !isWebSummitMode
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{t.modeStandardQuota}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'en' ? 'Max 3 uses/day -> Whop Paywall' : 'Máx 3 usos/dia -> Redireciona Whop'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Farm and Parcel Identifiers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.farmNameLabel}
              </label>
              <input
                type="text"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.parcelNameLabel}
              </label>
              <input
                type="text"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Crop Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.cropLabel}</span>
            </label>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value as CropType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="olival">{t.cropOlive}</option>
              <option value="vinha">{t.cropVineyard}</option>
              <option value="amendoal">{t.cropAlmond}</option>
              <option value="milho">{t.cropCorn}</option>
              <option value="pradaria">{t.cropPasture}</option>
            </select>
          </div>

          {/* Training System & Irrigation Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.trainingSystemLabel}
              </label>
              <select
                value={tSystem}
                onChange={(e) => setTSystem(e.target.value as TrainingSystem)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="intensivo">{t.sysIntensive}</option>
                <option value="superintensivo">{t.sysSuperIntensive}</option>
                <option value="tradicional">{t.sysTraditional}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.irrigationTypeLabel}</span>
              </label>
              <select
                value={iType}
                onChange={(e) => setIType(e.target.value as IrrigationType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="gota-a-gota">{t.irrDrip}</option>
                <option value="pivot">{t.irrPivot}</option>
                <option value="sequeiro">{t.irrRainfed}</option>
              </select>
            </div>
          </div>

          {/* Corporate White-Labeling & Client Identity */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEn ? 'Corporate Identity & White-Labeling' : 'Identidade Institucional & White-Labeling'}</span>
            </h4>

            {/* Custom Logo Upload & Preview */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Estate / Corporate Logo (PDF Header)' : 'Logótipo da Exploração / Empresa (Cabeçalho PDF)'}</span>
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isEn ? 'Remove Logo' : 'Remover'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="h-12 w-28 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-12 w-28 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-[10px] text-center p-1 shrink-0">
                    {isEn ? 'No custom logo' : 'Sem logótipo'}
                  </div>
                )}

                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? 'Upload PNG/JPG' : 'Carregar Imagem'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isEn ? 'Max 2MB. Injected dynamically into technical audit reports.' : 'Máx 2MB. Injetado dinamicamente no topo dos relatórios de auditoria.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fiscal and Cadastral Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isEn ? 'Legal Company / Farm Name' : 'Razão Social / Entidade Exploradora'}
                </label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="Ex: Finagra, S.A."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {isEn ? 'Tax ID / NIF' : 'NIF / Nº Contribuinte'}
                </label>
                <input
                  type="text"
                  value={tId}
                  onChange={(e) => setTId(e.target.value)}
                  placeholder="Ex: PT 500 123 456"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                {isEn ? 'Cadastral Registered Address' : 'Morada Cadastral / Sede da Exploração'}
              </label>
              <input
                type="text"
                value={cadAddr}
                onChange={(e) => setCadAddr(e.target.value)}
                placeholder="Ex: Apartado 157, 7200-999 Reguengos de Monsaraz"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Technical Sign-off for PDF */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.techSignoffTitle}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t.agronomistNameLabel}</label>
                <input
                  type="text"
                  value={agroName}
                  onChange={(e) => setAgroName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t.licenseNumberLabel}</label>
                <input
                  type="text"
                  value={licNum}
                  onChange={(e) => setLicNum(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
