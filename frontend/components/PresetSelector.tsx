'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { PRESET_LOCATIONS } from '../lib/presets';
import { PresetLocation } from '../lib/types';

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetLocation) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
      <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">
        <Navigation className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
        <span>Demo Plots:</span>
      </div>
      {PRESET_LOCATIONS.map((preset) => {
        const isSelected = selectedPresetId === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 shrink-0 border ${
              isSelected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <MapPin
              className={`w-3.5 h-3.5 ${
                isSelected ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-500'
              }`}
            />
            <span className="font-semibold">{preset.name}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ({preset.cropType.split('&')[0].trim()})
            </span>
          </button>
        );
      })}
    </div>
  );
};
