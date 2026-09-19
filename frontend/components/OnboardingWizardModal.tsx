'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Sprout,
  PenTool,
  UploadCloud,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Droplets,
  Compass,
} from 'lucide-react';
import { CropType, IrrigationType, TrainingSystem } from '../lib/irrigation/fao56';
import { Language, translations } from '../lib/i18n';

export interface OnboardingCompletePayload {
  farmName: string;
  locationLabel: string;
  center: [number, number];
  parcelName: string;
  cropType: CropType;
  trainingSystem: TrainingSystem;
  irrigationType: IrrigationType;
  areaHectares: number;
  actionType: 'draw' | 'import' | 'preset';
}

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (payload: OnboardingCompletePayload) => void;
  lang?: Language;
  theme?: 'dark' | 'light';
}

const REGION_PRESETS = [
  { name: 'Alentejo Central (Reguengos de Monsaraz / Évora)', lat: 38.3842, lon: -7.5519, defaultCrop: 'vinha' as CropType },
  { name: 'Baixo Alentejo (Ferreira do Alentejo / Beja)', lat: 38.0583, lon: -8.0333, defaultCrop: 'olival' as CropType },
  { name: 'Ribatejo / Vale do Tejo (Coruche / Santarém)', lat: 38.9611, lon: -8.5283, defaultCrop: 'milho' as CropType },
  { name: 'Alto Douro Vinhateiro (Vila Nova de Foz Côa)', lat: 41.0825, lon: -7.1147, defaultCrop: 'vinha' as CropType },
  { name: 'Cova da Beira (Fundão / Castelo Branco)', lat: 40.1389, lon: -7.5028, defaultCrop: 'amendoal' as CropType },
  { name: 'Algarve Sotavento (Tavira / Faro)', lat: 37.1264, lon: -7.6497, defaultCrop: 'olival' as CropType },
  { name: 'Oeste / Torres Vedras', lat: 39.0917, lon: -9.2583, defaultCrop: 'vinha' as CropType },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  lang = 'pt',
  theme = 'dark',
}) => {
  const isEn = lang === 'en';
  const isLight = theme === 'light';

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Farm Identification
  const [farmName, setFarmName] = useState('');
  const [selectedRegionIdx, setSelectedRegionIdx] = useState(0);
  const [customLat, setCustomLat] = useState<number>(REGION_PRESETS[0].lat);
  const [customLon, setCustomLon] = useState<number>(REGION_PRESETS[0].lon);

  // Step 2: 1st Parcel Method & Name
  const [parcelName, setParcelName] = useState('');
  const [creationMethod, setCreationMethod] = useState<'draw' | 'import' | 'preset'>('draw');

  // Step 3: Agronomic Characterization
  const [cropType, setCropType] = useState<CropType>('vinha');
  const [trainingSystem, setTrainingSystem] = useState<TrainingSystem>('intensivo');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('gota-a-gota');
  const [declaredArea, setDeclaredArea] = useState<number>(18.5);

  if (!isOpen) return null;

  const handleRegionChange = (idx: number) => {
    setSelectedRegionIdx(idx);
    const chosen = REGION_PRESETS[idx];
    setCustomLat(chosen.lat);
    setCustomLon(chosen.lon);
    setCropType(chosen.defaultCrop);
  };

  const handleFinalize = () => {
    const chosen = REGION_PRESETS[selectedRegionIdx];
    const finalFarmName = farmName.trim() || (isEn ? 'My Farm' : 'A Minha Herdade');
    const finalParcelName = parcelName.trim() || (isEn ? 'Field 1 - Main' : 'Talhão 1 - Principal');

    onComplete({
      farmName: finalFarmName,
      locationLabel: chosen.name,
      center: [customLat, customLon],
      parcelName: finalParcelName,
      cropType,
      trainingSystem,
      irrigationType,
      areaHectares: declaredArea || 15.0,
      actionType: creationMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl p-6 my-auto transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0b101b] border-slate-800 text-slate-200'
        }`}
      >
        {/* Header with Step Wizard Indicators */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{isEn ? 'Quick Farm Onboarding' : 'Primeiros Passos — Nova Exploração'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {step}/3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Configure your estate and first parcel in 3 simple steps'
                  : 'Configure a sua herdade e 1º talhão em menos de 1 minuto'}
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

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: Farm Identification */}
        {step === 1 && (
          <div className="mt-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? 'Estate / Farm Name' : 'Nome da Herdade / Exploração'}</span>
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder={isEn ? 'e.g. Quinta do Vale Verde' : 'ex: Herdade Vale do Sorraia'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? 'Agricultural Region / District' : 'Região Agrícola / Concelho'}</span>
              </label>
              <select
                value={selectedRegionIdx}
                onChange={(e) => handleRegionChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {REGION_PRESETS.map((reg, idx) => (
                  <option key={idx} value={idx}>
                    {reg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Latitude WGS84</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLat}
                  onChange={(e) => setCustomLat(parseFloat(e.target.value) || 38.0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Longitude WGS84</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLon}
                  onChange={(e) => setCustomLon(parseFloat(e.target.value) || -8.0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: 1st Parcel Method */}
        {step === 2 && (
          <div className="mt-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? '1st Parcel / Field Name' : 'Nome do 1º Talhão'}</span>
              </label>
              <input
                type="text"
                value={parcelName}
                onChange={(e) => setParcelName(e.target.value)}
                placeholder={isEn ? 'e.g. Field 1 - North Sector' : 'ex: Talhão 1 - Parcela Norte'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                {isEn ? 'How would you like to delimit this field?' : 'Como deseja delimitar este talhão?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreationMethod('draw')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    creationMethod === 'draw'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PenTool className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="font-bold text-xs">{isEn ? 'Draw on Map' : 'Desenhar no Mapa'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isEn ? 'Click vertices directly on satellite tiles' : 'Marcar vértices interativos no Leaflet'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMethod('import')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    creationMethod === 'import'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-sky-400 mb-2" />
                  <div className="font-bold text-xs">{isEn ? 'Import GIS File' : 'Importar Ficheiro'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isEn ? 'Upload KML, GeoJSON or Shapefile .zip' : 'Ficheiro KML, GeoJSON ou Shapefile .zip'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMethod('preset')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    creationMethod === 'preset'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="font-bold text-xs">{isEn ? 'Initial Box' : 'Talhão Base'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isEn ? 'Generates ~15 ha box at coordinates' : 'Cria polígono de teste com ~15 ha'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Agronomic Characterization */}
        {step === 3 && (
          <div className="mt-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? 'Main Installed Crop' : 'Cultura Principal'}</span>
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value as CropType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="vinha">{isEn ? 'Vineyard (Wine Grapes)' : 'Vinha'}</option>
                <option value="olival">{isEn ? 'Olive Grove' : 'Olival'}</option>
                <option value="amendoal">{isEn ? 'Almond Grove' : 'Amendoal'}</option>
                <option value="milho">{isEn ? 'Corn (Grain / Silage)' : 'Milho'}</option>
                <option value="pradaria">{isEn ? 'Pasture / Forage' : 'Pradaria / Forragem'}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEn ? 'Training System' : 'Sistema de Condução'}
                </label>
                <select
                  value={trainingSystem}
                  onChange={(e) => setTrainingSystem(e.target.value as TrainingSystem)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="intensivo">{isEn ? 'Intensive' : 'Intensivo'}</option>
                  <option value="superintensivo">{isEn ? 'Super-intensive' : 'Superintensivo'}</option>
                  <option value="tradicional">{isEn ? 'Traditional / Rainfed' : 'Tradicional / Sequeiro'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isEn ? 'Irrigation System' : 'Sistema de Rega'}</span>
                </label>
                <select
                  value={irrigationType}
                  onChange={(e) => setIrrigationType(e.target.value as IrrigationType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="gota-a-gota">{isEn ? 'Drip Irrigation' : 'Gota-a-gota'}</option>
                  <option value="pivot">{isEn ? 'Center Pivot' : 'Pivot Central'}</option>
                  <option value="sequeiro">{isEn ? 'Rainfed (No Irrigation)' : 'Sequeiro'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isEn ? 'Estimated Declared Area (Hectares)' : 'Área Cadastrada Estimada (Hectares)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5000"
                value={declaredArea}
                onChange={(e) => setDeclaredArea(parseFloat(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back' : 'Anterior'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <span>{isEn ? 'Continue' : 'Continuar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalize}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEn ? 'Complete Onboarding' : 'Concluir Onboarding'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
