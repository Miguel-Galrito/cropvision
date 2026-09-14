'use client';

import React, { useState } from 'react';
import { Settings, Save, X, Sprout, Droplets, UserCheck, ShieldCheck } from 'lucide-react';
import { CropType, IrrigationType, TrainingSystem } from '../lib/irrigation/fao56';

interface FarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmName: string;
  parcelName: string;
  cropType: CropType;
  trainingSystem: TrainingSystem;
  irrigationType: IrrigationType;
  agronomistName: string;
  licenseNumber: string;
  onSave: (updated: {
    farmName: string;
    parcelName: string;
    cropType: CropType;
    trainingSystem: TrainingSystem;
    irrigationType: IrrigationType;
    agronomistName: string;
    licenseNumber: string;
  }) => void;
}

export const FarmSettingsModal: React.FC<FarmSettingsModalProps> = ({
  isOpen,
  onClose,
  farmName,
  parcelName,
  cropType,
  trainingSystem,
  irrigationType,
  agronomistName,
  licenseNumber,
  onSave,
}) => {
  const [fName, setFName] = useState(farmName);
  const [pName, setPName] = useState(parcelName);
  const [cType, setCType] = useState<CropType>(cropType);
  const [tSystem, setTSystem] = useState<TrainingSystem>(trainingSystem);
  const [iType, setIType] = useState<IrrigationType>(irrigationType);
  const [agroName, setAgroName] = useState(agronomistName || 'Eng. Agrónomo Miguel Silva');
  const [licNum, setLicNum] = useState(licenseNumber || 'OE-AGR-49120');

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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b101b] border border-slate-800 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                DEFINIÇÕES AGRONÓMICAS DA EXPLORAÇÃO
              </h3>
              <p className="text-xs text-slate-400">
                Parâmetros biofísicos para calibração de Kc e cálculo VRA
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Farm and Parcel Identifiers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Herdade / Quinta
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
                Talhão / Parcela Ativa
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
              <span>Cultura Instalada (Determina Curva Kc e Exigência N)</span>
            </label>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value as CropType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="olival">Olival (Olea europaea)</option>
              <option value="vinha">Vinha (Vitis vinifera)</option>
              <option value="amendoal">Amendoal (Prunus dulcis)</option>
              <option value="milho">Milho Grão/Silagem (Zea mays)</option>
              <option value="pradaria">Pradaria / Pastagem Permanente</option>
            </select>
          </div>

          {/* Training System & Irrigation Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sistema de Condução
              </label>
              <select
                value={tSystem}
                onChange={(e) => setTSystem(e.target.value as TrainingSystem)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="intensivo">Intensivo (ex: 7x5m)</option>
                <option value="superintensivo">Superintensivo (ex: 4x1.5m)</option>
                <option value="tradicional">Tradicional / Sequeiro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Tipo de Rega</span>
              </label>
              <select
                value={iType}
                onChange={(e) => setIType(e.target.value as IrrigationType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="gota-a-gota">Gota-a-gota (Drip)</option>
                <option value="pivot">Pivot Central / Aspersão</option>
                <option value="sequeiro">Sequeiro (Sem Rega)</option>
              </select>
            </div>
          </div>

          {/* Technical Sign-off for PDF */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Responsável Técnico (Para Assinatura nos Relatórios PDF)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Agrónomo</label>
                <input
                  type="text"
                  value={agroName}
                  onChange={(e) => setAgroName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Cédula Profissional</label>
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
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
