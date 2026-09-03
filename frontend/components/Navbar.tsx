'use client';

import React from 'react';
import { Satellite, ExternalLink, MapPin } from 'lucide-react';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  locationName?: string | null;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiHealthy,
  lat,
  lon,
  locationName,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between no-print">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 shrink-0">
          <Satellite className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Sat<span className="text-emerald-400">Health</span>
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Sentinel-2 L2A
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Earth Observation & Crop Vigor Monitoring Micro-SaaS
          </p>
        </div>
      </div>

      {/* Center Coordinates Preview with City Name (Desktop) */}
      <div className="hidden lg:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
        {locationName && (
          <>
            <span className="flex items-center text-emerald-400 font-medium max-w-xs truncate">
              <MapPin className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />
              <span className="truncate">{locationName}</span>
            </span>
            <span className="text-slate-600">|</span>
          </>
        )}
        <span className="flex items-center text-slate-400 font-mono text-[11px]">
          {lat.toFixed(4)}°, {lon.toFixed(4)}°
        </span>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Backend / Cloud Status Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0"
          />
          <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
            {apiHealthy === true ? (
              <>
                <span className="hidden sm:inline">Local API Online (FastAPI)</span>
                <span className="sm:hidden">Local API</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">AWS STAC Cloud Direct</span>
                <span className="sm:hidden">STAC Cloud</span>
              </>
            )}
          </span>
        </div>

        {/* GitHub Repo Link */}
        <a
          href="https://github.com/Miguel-Galrito/sat-health-api"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Open GitHub Repository"
        >
          <span className="hidden sm:inline">GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
