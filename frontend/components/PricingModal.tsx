'use client';

import React from 'react';
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  X,
  CreditCard,
  Layers,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'pdf_unlock' | 'generic';
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  reason = 'generic',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090d16] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] p-5 sm:p-8 text-slate-100 scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Reason banner if triggered by paywall limit or PDF export */}
        {reason === 'limit_reached' && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-amber-300 text-xs sm:text-sm">
            <Zap className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <strong className="font-semibold text-white">Limite Diário Gratuito Atingido (3/3 consultas).</strong>{' '}
              Assine um dos planos para continuar a monitorizar parcelas com satélite Sentinel-2 em tempo real.
            </div>
          </div>
        )}

        {reason === 'pdf_unlock' && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-xs sm:text-sm">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <strong className="font-semibold text-white">Relatório PDF Executivo Sem Marca de Água:</strong>{' '}
              A exportação oficial em alta resolução é exclusiva do plano <strong>CropVision Pro Enterprise</strong>.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MONETIZAÇÃO VIA WHOP • 0€ CUSTOS FIXOS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Planos de Inteligência Orbital Agrícola
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Escolha o nível de monitorização para as suas culturas com dados calibrados da constelação Copernicus Sentinel-2.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: CropVision Starter */}
          <div className="flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pequenos Produtores & Consultores
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">CropVision Starter</h3>
              <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                Monitorização essencial para pequenos agricultores, agrónomos e quintas familiares.
              </p>

              <div className="my-5 pb-5 border-b border-slate-800/80">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">49.00 €</span>
                  <span className="text-xs text-slate-400">/ mês</span>
                </div>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  Faturação simplificada via Whop • Cancele quando quiser
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 mb-6">
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até <strong>10 talhões / parcelas</strong> monitorizados</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até <strong>1.000 requisições de satélite</strong> / mês</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Índice NDVI de vigor e stress hídrico zonal</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Resolução espacial ótica de 10 metros</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Revisita orbital automática a cada 5 dias</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação de relatórios de campo standard</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://whop.com/cropvision/cropvision-starter/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 shadow-md group"
              >
                <span>Assinar Starter na Whop (49€/mês)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </a>
            </div>
          </div>

          {/* Card 2: CropVision Pro Enterprise (Mais Popular) */}
          <div className="relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0c1524] border-2 border-emerald-500/60 p-5 sm:p-6 shadow-xl shadow-emerald-500/10">
            {/* Ribbon Badge */}
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-emerald-500/40">
              Mais Popular • Recomendado
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grandes Herdades & AgTech</span>
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">CropVision Pro Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                Solução completa para grandes propriedades agrícolas, cooperativas e empresas de agro-tecnologia.
              </p>

              <div className="my-5 pb-5 border-b border-emerald-900/40">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">149.00 €</span>
                  <span className="text-xs text-slate-400">/ mês</span>
                </div>
                <span className="text-[11px] text-emerald-300 font-medium block mt-1">
                  Retorno médio estimado de 15x a 25x em fertilizantes e água
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 mb-6">
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Talhões e herdades ilimitadas</strong></span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Até <strong>10.000 requisições</strong> de satélite / mês</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Relatório PDF Executivo A4</strong> sem marca de água</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Telemetria espectral avançada (NDVI, TCI True Color e estatísticas)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Histórico multitemporal com análise de tendências de safra</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Acesso direto via API REST para integração com ERP agrícola</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://whop.com/cropvision/cropvision-pro-enterprise/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 group"
              >
                <span>Assinar Pro Enterprise na Whop (149€/mês)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Alternative Stripe Option & Guarantee Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantia Whop Checkout</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Ativação Instantânea</span>
            </div>
            <span>•</span>
            <span>Sem fidelização</span>
          </div>

          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>Prefere pagar via <strong>Stripe Checkout</strong>?</span>
            <a
              href="https://whop.com/cropvision/cropvision-pro-enterprise/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
            >
              Pagar com Cartão / Stripe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
