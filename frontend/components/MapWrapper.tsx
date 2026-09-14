'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { ScoutingRecord } from '../lib/scouting/scoutingStore';

import { Language } from '../lib/i18n';

interface MapWrapperProps {
  lat: number;
  lon: number;
  zoom?: number;
  bbox?: [number, number, number, number] | null;
  polygon?: [number, number][] | null;
  scoutingRecords?: ScoutingRecord[];
  isScoutingModeActive?: boolean;
  onToggleScoutingMode?: () => void;
  onSelectCoordinate: (lat: number, lon: number) => void;
  onScoutCoordinateClick?: (lat: number, lon: number) => void;
  onDeleteScoutingRecord?: (id: string) => void;
  onCenterChange?: (centerLat: number, centerLon: number) => void;
  lang?: Language;
  disabled?: boolean;
}

const DynamicMap = dynamic(
  () => import('./Map').then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b14] text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="text-xs font-mono text-emerald-400">A carregar camada de satélite HD...</span>
      </div>
    ),
  }
);

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return <DynamicMap {...props} />;
};
