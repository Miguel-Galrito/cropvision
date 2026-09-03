'use client';

import React, { useState, useEffect } from 'react';
import { Satellite, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  lat: number;
  lon: number;
}

const STEPS = [
  { id: 1, title: 'Connecting to Copernicus Sentinel-2 L2A STAC catalog' },
  { id: 2, title: 'Querying recent orbital passes and filtering cloud cover' },
  { id: 3, title: 'Reading Band 4 (Red) and Band 8 (NIR) via HTTP Range Requests (rasterio)' },
  { id: 4, title: 'Computing NDVI matrix (NumPy) and generating spectral colormap' },
];

export const LoadingState: React.FC<LoadingStateProps> = ({ lat, lon }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  return (
    <div className="p-6 rounded-2xl glass-panel border border-slate-700/60 shadow-2xl animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Satellite className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center">
            Processing Geospatial Data
            <Sparkles className="w-3.5 h-3.5 ml-2 text-emerald-400 animate-pulse" />
          </h3>
          <p className="text-xs text-slate-400">
            Target: {lat.toFixed(4)}°, {lon.toFixed(4)}°
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`flex items-start space-x-3 p-2.5 rounded-xl text-xs transition-all duration-300 ${
                isCurrent
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : isDone
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                    {step.id}
                  </div>
                )}
              </div>
              <span className={`font-medium ${isCurrent ? 'text-emerald-300 font-semibold' : ''}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
        Extracting only required spatial blocks via Cloud Optimized GeoTIFF
      </div>
    </div>
  );
};
