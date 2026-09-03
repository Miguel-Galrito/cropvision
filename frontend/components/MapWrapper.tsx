'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface MapWrapperProps {
  lat: number;
  lon: number;
  zoom?: number;
  bbox?: [number, number, number, number] | null;
  onSelectCoordinate: (lat: number, lon: number) => void;
  disabled?: boolean;
}

const DynamicMap = dynamic(
  () => import('./Map').then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="text-xs font-medium">A carregar mapa geoespacial...</span>
      </div>
    ),
  }
);

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return <DynamicMap {...props} />;
};
