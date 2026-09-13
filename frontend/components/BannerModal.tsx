'use client';

import React, { useState } from 'react';
import { X, Download, Sparkles, Satellite, Tractor, Image as ImageIcon, Check } from 'lucide-react';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  aspect: string;
  description: string;
}

const BANNERS: BannerItem[] = [
  {
    id: 'sar-orbital',
    title: 'Missão Sentinel-1 SAR Radar (Banda-C)',
    subtitle: 'Penetração de Nuvens a 100% e Telemetria de Humidade do Solo',
    category: 'Aeroespacial & Observação da Terra',
    imageUrl: '/cropvision_banner.jpg',
    aspect: '16:9 4K',
    description: 'Satélite Copernicus em órbita baixa projetando feixes de micro-ondas C-band através de nuvens atmosféricas com telemetria HUD em tempo real.',
  },
  {
    id: 'tractor-isobus',
    title: 'Trator Autónomo & Consola Holográfica ISO-BUS',
    subtitle: 'Prescrições de Adubação a Taxa Variável (ISO 11783-10)',
    category: 'AgTech & Automação de Precisão',
    imageUrl: '/cropvision_banner_isobus.jpg',
    aspect: '16:9 4K',
    description: 'Trator de alta precisão a aplicar azoto com base em mapas gerados por satélite, sincronizado via feixe de telemetria orbital.',
  },
  {
    id: 'master-logo',
    title: 'Logótipo Master CropVision SaaS',
    subtitle: 'Emblema Vetorial Minimalista de Elite Aeroespacial',
    category: 'Identidade Visual & Marca',
    imageUrl: '/cropvision_icon.jpg',
    aspect: '1:1 Ultra-HD',
    description: 'Órbita de satélite geodésico em torno de um dossel foliar e grelha de radar em tons de esmeralda neon e ciano titânio.',
  },
];

export const BannerModal: React.FC<BannerModalProps> = ({ isOpen, onClose }) => {
  const [selectedBanner, setSelectedBanner] = useState<BannerItem>(BANNERS[0]);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (banner: BannerItem) => {
    const a = document.createElement('a');
    a.href = banner.imageUrl;
    a.download = `${banner.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadedId(banner.id);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#090d16] border border-slate-700/80 shadow-2xl p-5 sm:p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Galeria Oficial de Banners &amp; Identidade Aeroespacial</span>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  3 Assets 4K
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Imagens de alta resolução e banners oficiais para pitch decks, Web Summit e marketing.
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

        {/* Content Body: Large Preview + Thumbnails */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
          {/* Main Selected Image Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-xl group">
            <img
              src={selectedBanner.imageUrl}
              alt={selectedBanner.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-4 sm:p-6">
              <div className="flex items-end justify-between w-full">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                    {selectedBanner.category} • {selectedBanner.aspect}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {selectedBanner.title}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl line-clamp-2 mt-0.5">
                    {selectedBanner.description}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(selectedBanner)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all shrink-0 ml-3"
                >
                  {downloadedId === selectedBanner.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Descarregado!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descarregar HD</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnails Selector */}
          <div className="grid grid-cols-3 gap-3">
            {BANNERS.map((banner) => {
              const isSelected = selectedBanner.id === banner.id;
              return (
                <button
                  key={banner.id}
                  onClick={() => setSelectedBanner(banner)}
                  className={`p-2 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-500/20'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-video rounded-xl overflow-hidden mb-2 bg-slate-950">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">{banner.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{banner.category}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
