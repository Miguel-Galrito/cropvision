'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { searchLocations, SearchResultLocation } from '../lib/geocoding';

interface LocationSearchBarProps {
  onSelectLocation: (lat: number, lon: number, name: string) => void;
  disabled?: boolean;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onSelectLocation,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchLocations(query);
      setResults(data);
      setIsLoading(false);
      setIsOpen(data.length > 0);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultLocation) => {
    setQuery(item.name.split(',')[0]); // show primary city name in input
    setIsOpen(false);
    onSelectLocation(item.lat, item.lon, item.name);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder="Pesquisar cidade ou região..."
          className="w-full pl-9 pr-8 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 w-3.5 h-3.5 text-emerald-400 animate-spin" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white rounded"
            title="Limpar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in">
          <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
            Localidades Encontradas (Nominatim)
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
            {results.map((item, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-start space-x-2 transition-colors group"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 truncate group-hover:text-emerald-300">
                      {item.name.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.name.split(',').slice(1).join(',').trim()}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
