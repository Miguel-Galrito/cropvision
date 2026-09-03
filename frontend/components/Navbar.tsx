'use client';

import React from 'react';
import { Satellite, ExternalLink } from 'lucide-react';

interface NavbarProps {
  apiHealthy: boolean | null;
  lat: number;
  lon: number;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiHealthy,
  lat,
  lon,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <Satellite className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Sat<span className="text-emerald-400">Health</span>
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Sentinel-2 L2A
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Earth Observation & Crop Vigor Monitoring Micro-SaaS
          </p>
        </div>
      </div>

      {/* Center Coordinates Preview */}
      <div className="hidden md:flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
        <span className="flex items-center text-slate-400">
          <span className="font-medium text-emerald-400 mr-1">Lat:</span> {lat.toFixed(4)}°
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center text-slate-400">
          <span className="font-medium text-emerald-400 mr-1">Lon:</span> {lon.toFixed(4)}°
        </span>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center space-x-3">
        {/* Backend Status Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              apiHealthy === true
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : apiHealthy === false
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            }`}
          />
          <span className="text-slate-300 font-medium hidden sm:inline">
            {apiHealthy === true
              ? 'API Online'
              : apiHealthy === false
              ? 'Demo Cloud Mode'
              : 'Checking...'}
          </span>
        </div>

        {/* GitHub Repo Link */}
        <a
          href="https://github.com/Miguel-Galrito/sat-health-api"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Open GitHub Repository"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
