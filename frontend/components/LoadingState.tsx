'use client';

import React, { useState, useEffect } from 'react';
import { Satellite, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  lat: number;
  lon: number;
  lang?: 'pt' | 'en';
}

const STEPS = {
  pt: [
    'A ligar ao catálogo Copernicus Sentinel-2 L2A',
    'A procurar passagens recentes e filtrar nuvens',
    'A ler as bandas B4 (vermelho) e B8 (infravermelho)',
    'A calcular o NDVI e gerar o mapa espectral',
  ],
  en: [
    'Connecting to the Copernicus Sentinel-2 L2A catalog',
    'Querying recent passes and filtering cloud cover',
    'Reading bands B4 (red) and B8 (near-infrared)',
    'Computing NDVI and generating the spectral map',
  ],
};

export const LoadingState: React.FC<LoadingStateProps> = ({ lat, lon, lang = 'pt' }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const steps = STEPS[lang] ?? STEPS.pt;

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(2), 700);
    const timer2 = setTimeout(() => setCurrentStep(3), 1600);
    const timer3 = setTimeout(() => setCurrentStep(4), 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const progress = Math.min(92, (currentStep - 1) * 28 + 12);

  return (
    <div className="w-[min(92vw,26rem)] p-4 sm:p-5 rounded-2xl glass-panel animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
          <span className="absolute inset-0 rounded-xl animate-ping bg-emerald-400/10" />
          <Satellite className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {lang === 'en' ? 'Processing satellite data' : 'A processar dados de satélite'}
          </h3>
          <p className="font-mono text-[11px] text-slate-400">
            {lat.toFixed(4)}°, {lon.toFixed(4)}° · Sentinel-2
          </p>
        </div>
      </div>

      <div className="mt-4 h-1 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {steps.map((title, i) => {
          const id = i + 1;
          const isDone = currentStep > id;
          const isCurrent = currentStep === id;

          return (
            <div
              key={id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-300 ${
                isCurrent ? 'bg-emerald-500/10 text-emerald-200' : isDone ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                )}
              </div>
              <span className={isCurrent ? 'font-semibold' : 'font-medium'}>{title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
