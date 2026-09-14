'use client';

import React from 'react';
import { Bell, AlertTriangle, Droplets, Wind, CheckCircle2, X, ShieldAlert } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  parcel: string;
  time: string;
  description: string;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusAnomaly?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onFocusAnomaly,
}) => {
  if (!isOpen) return null;

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      type: 'critical',
      title: 'Alerta de Stress Acelerado (Queda ΔNDVI < -0.08)',
      parcel: 'Talhão 1 - Vinha do Almotrém',
      time: 'Há 2 horas (Passagem Sentinel-2)',
      description:
        'Queda anómala de biomassa detetada em 14% da área. Descartada restrição hídrica por radar SAR Sentinel-1. Suspeita de ataque fitossanitário ou bloqueio nutricional.',
    },
    {
      id: 'notif-2',
      type: 'warning',
      title: 'Janela de Pulverização: Vento Limite (16 km/h)',
      parcel: 'Todas as Parcelas',
      time: 'Previsão para as 15:00',
      description:
        'Velocidade do vento aproxima-se do limite de deriva. Recomenda-se antecipar tratamentos fitossanitários para o período da manhã.',
    },
    {
      id: 'notif-3',
      type: 'info',
      title: 'Balanço Hídrico: Necessidade Diária Calculada',
      parcel: 'Talhão 2 - Olival dos Arrifes',
      time: 'Hoje às 06:00',
      description:
        'Evapotranspiração de cultura (ETc) estimada em 3.4 mm/dia. Sugestão de rega: 2h 10min no setor gota-a-gota.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b101b] border border-slate-800 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                CENTRO DE ALERTAS &amp; TELEMETRIA
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full font-sans font-semibold">
                  3 Ativos
                </span>
              </h3>
              <p className="text-xs text-slate-400">Anomalias e eventos operacionais em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-xl border transition-all ${
                n.type === 'critical'
                  ? 'bg-red-950/20 border-red-500/40 text-red-200 hover:border-red-500/70'
                  : n.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 hover:border-amber-500/70'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {n.type === 'critical' ? (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  ) : n.type === 'warning' ? (
                    <Wind className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1">{n.parcel}</div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.description}</p>
              {n.type === 'critical' && onFocusAnomaly && (
                <button
                  onClick={() => {
                    onFocusAnomaly();
                    onClose();
                  }}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Inspecionar Anomalia no Mapa</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
