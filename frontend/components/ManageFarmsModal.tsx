'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  MapPin,
  Sprout,
  Layers,
  ChevronDown,
  ChevronRight,
  Droplets,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { FarmModel, ParcelModel, AppExecutionMode } from '../lib/gis/parcelStorage';
import { CropType, IrrigationType, TrainingSystem } from '../lib/irrigation/fao56';
import { Language } from '../lib/i18n';

interface ManageFarmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  farms: FarmModel[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onCreateFarm: (farm: { name: string; locationLabel: string; center: [number, number] }) => void;
  onUpdateFarm: (farmId: string, updates: Partial<FarmModel>) => void;
  onDeleteFarm: (farmId: string) => void;
  onDeleteParcel: (farmId: string, parcelId: string) => void;
  onFocusParcel?: (parcel: ParcelModel) => void;
  lang?: Language;
  theme?: 'dark' | 'light';
  appMode?: AppExecutionMode;
}

export const ManageFarmsModal: React.FC<ManageFarmsModalProps> = ({
  isOpen,
  onClose,
  farms,
  activeFarmId,
  onSelectFarm,
  onCreateFarm,
  onUpdateFarm,
  onDeleteFarm,
  onDeleteParcel,
  onFocusParcel,
  lang = 'pt',
  theme = 'dark',
  appMode = 'demo',
}) => {
  const isEn = lang === 'en';
  const isLight = theme === 'light';

  const [expandedFarmId, setExpandedFarmId] = useState<string>(activeFarmId);
  const [isCreatingFarm, setIsCreatingFarm] = useState<boolean>(false);
  const [newFarmName, setNewFarmName] = useState<string>('');
  const [newFarmLocation, setNewFarmLocation] = useState<string>('');

  // Editing Farm State
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editFarmName, setEditFarmName] = useState<string>('');
  const [editFarmLocation, setEditFarmLocation] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEditFarm = (farm: FarmModel) => {
    setEditingFarmId(farm.id);
    setEditFarmName(farm.name);
    setEditFarmLocation(farm.locationLabel);
  };

  const handleSaveEditFarm = (farmId: string) => {
    onUpdateFarm(farmId, {
      name: editFarmName.trim() || 'Herdade',
      locationLabel: editFarmLocation.trim() || 'Portugal',
    });
    setEditingFarmId(null);
  };

  const handleCreateFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) return;

    onCreateFarm({
      name: newFarmName.trim(),
      locationLabel: newFarmLocation.trim() || 'Alentejo, Portugal',
      center: [38.3842, -7.5519],
    });

    setNewFarmName('');
    setNewFarmLocation('');
    setIsCreatingFarm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl p-6 my-auto transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0b101b] border-slate-800 text-slate-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{isEn ? 'Manage Estates & Parcels' : 'Gestão de Explorações & Talhões'}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    appMode === 'demo'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {appMode === 'demo' ? (isEn ? 'Demo Pitch Mode' : 'Modo Demo') : (isEn ? 'Production Account' : 'Minha Conta')}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Organize your agricultural properties, declared areas, and field boundaries'
                  : 'Organize as suas herdades, áreas cadastradas e talhões agrícolas'}
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

        {/* Quick Action: New Farm Button */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isEn ? `${farms.length} estate(s) registered` : `${farms.length} exploração(ões) registada(s)`}
          </span>
          {!isCreatingFarm && (
            <button
              onClick={() => setIsCreatingFarm(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'New Estate' : 'Nova Herdade'}</span>
            </button>
          )}
        </div>

        {/* Inline Create Farm Form */}
        {isCreatingFarm && (
          <form
            onSubmit={handleCreateFarmSubmit}
            className="mt-3 p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>{isEn ? 'Register New Estate' : 'Registar Nova Herdade'}</span>
              <button
                type="button"
                onClick={() => setIsCreatingFarm(false)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder={isEn ? 'Estate Name (e.g. Quinta da Lomba)' : 'Nome da Herdade (ex: Quinta da Lomba)'}
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                autoFocus
                required
              />
              <input
                type="text"
                placeholder={isEn ? 'Location (e.g. Alentejo, Portugal)' : 'Localização (ex: Reguengos de Monsaraz)'}
                value={newFarmLocation}
                onChange={(e) => setNewFarmLocation(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
              >
                {isEn ? 'Save Estate' : 'Guardar Herdade'}
              </button>
            </div>
          </form>
        )}

        {/* Farms List */}
        <div className="mt-4 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {farms.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-200">
                {isEn ? 'No estates registered in this mode' : 'Nenhuma herdade registada neste ambiente'}
              </p>
              <p className="text-[11px] mt-1 text-slate-500">
                {isEn ? 'Click "New Estate" above to add your first property' : 'Clique em "Nova Herdade" acima para adicionar a sua primeira propriedade'}
              </p>
            </div>
          ) : (
            farms.map((farm) => {
              const isExpanded = expandedFarmId === farm.id;
              const isActive = activeFarmId === farm.id;
              const totalHa = farm.parcels.reduce((acc, p) => acc + (p.areaHectares || 0), 0);

              return (
                <div
                  key={farm.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isActive
                      ? 'border-emerald-500/50 bg-slate-900/90 shadow-md shadow-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  {/* Farm Header Row */}
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedFarmId(isExpanded ? '' : farm.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        {editingFarmId === farm.id ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editFarmName}
                              onChange={(e) => setEditFarmName(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-950 border border-emerald-500 text-white text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={editFarmLocation}
                              onChange={(e) => setEditFarmLocation(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-300 text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditFarm(farm.id)}
                              className="p-1 rounded bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">{farm.name}</span>
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {isEn ? 'ACTIVE' : 'ATIVA'}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{farm.locationLabel}</span>
                          </span>
                          <span>•</span>
                          <span>
                            {farm.parcels.length} {isEn ? 'parcel(s)' : 'talhão(ões)'} ({totalHa.toFixed(1)} ha)
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectFarm(farm.id)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors"
                        >
                          {isEn ? 'Select' : 'Selecionar'}
                        </button>
                      )}
                      {editingFarmId !== farm.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEditFarm(farm)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title={isEn ? 'Edit estate' : 'Editar herdade'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              isEn
                                ? `Are you sure you want to delete ${farm.name} and all its parcels?`
                                : `Tem a certeza que deseja eliminar ${farm.name} e todos os seus talhões?`
                            )
                          ) {
                            onDeleteFarm(farm.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title={isEn ? 'Delete estate' : 'Eliminar herdade'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Parcels List Accordion Content */}
                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/60 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        {isEn ? 'Cadastral Parcels' : 'Talhões Cadastrados'}
                      </div>
                      {farm.parcels.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-1 italic">
                          {isEn ? 'No parcels registered yet in this estate.' : 'Ainda sem talhões registados nesta herdade.'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {farm.parcels.map((parcel) => (
                            <div
                              key={parcel.id}
                              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                                  <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{parcel.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="capitalize text-emerald-400/90 font-medium">
                                    {parcel.cropType}
                                  </span>
                                  <span>•</span>
                                  <span>{parcel.irrigationType}</span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-300">
                                    {parcel.areaHectares.toFixed(1)} ha
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {onFocusParcel && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectFarm(farm.id);
                                      onFocusParcel(parcel);
                                      onClose();
                                    }}
                                    className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                    title={isEn ? 'View on map' : 'Ver no mapa'}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{isEn ? 'Map' : 'Mapa'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        isEn
                                          ? `Delete parcel ${parcel.name}?`
                                          : `Eliminar o talhão ${parcel.name}?`
                                      )
                                    ) {
                                      onDeleteParcel(farm.id, parcel.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                  title={isEn ? 'Delete parcel' : 'Eliminar talhão'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            {isEn ? 'Close' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};
