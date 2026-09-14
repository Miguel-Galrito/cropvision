'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Shield,
  Zap,
  ArrowRight,
  Lock,
  ExternalLink,
  HelpCircle,
  X,
  FileSpreadsheet,
  Download,
  Award,
  Building2,
  Tractor,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'pdf_unlock' | 'vra_unlock' | 'generic';
  isProSimulated?: boolean;
  onToggleProSimulation?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  reason = 'generic',
  isProSimulated = false,
  onToggleProSimulation,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  // Real or demo checkout links
  const checkoutSoloMonthly = 'https://buy.stripe.com/test_cropvision_solo_monthly';
  const checkoutSoloAnnual = 'https://buy.stripe.com/test_cropvision_solo_annual';
  const checkoutProMonthly = 'https://buy.stripe.com/test_cropvision_pro_monthly';
  const checkoutProAnnual = 'https://buy.stripe.com/test_cropvision_pro_annual';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl p-5 sm:p-8 text-slate-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Demo Mode Toggle Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              Modo Demonstração &amp; Pitch Técnico (Técnico Web Summit):
            </span>
          </div>
          {onToggleProSimulation && (
            <button
              onClick={onToggleProSimulation}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isProSimulated
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isProSimulated ? '✓ Plano Herdade Pro Simulado (Ativo)' : 'Ativar Acesso Pro para Demonstração'}
            </button>
          )}
        </div>

        {/* Reason Alert Banner */}
        {reason === 'vra_unlock' && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center space-x-3 text-amber-200 text-xs">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Funcionalidade Restrita a Planos B2B:</span> A exportação direta de Shapefile (.shp/.dbf) e ficheiros ISO-XML para computadores de bordo requer a subscrição <strong>Herdade Pro</strong> ou superior.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODELO DE NEGÓCIO B2B AGTECH</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Planos de Subscrição Profissional
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Rentabilize a sua exploração e poupe até 24% em adubos azotados com telemetria Sentinel-2, radar SAR e prescrição para tratores.
          </p>

          {/* Billing Cycle Switch */}
          <div className="mt-5 inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturação Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Faturação Anual</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan 1: Agrónomo Solo */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Agrónomo Solo</h3>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  B2B Base
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Para consultores agronómicos e pequenas propriedades.
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    €{billingCycle === 'annual' ? '39' : '49'}
                  </span>
                  <span className="text-xs text-slate-400">/ mês</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {billingCycle === 'annual' ? 'Cobrado anualmente (€468/ano)' : 'Cobrado mensalmente'}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até <strong>150 hectares</strong> monitorizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 Índices óticos (NDVI, NDRE, NDWI)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Janela de pulverização &amp; alertas agrometeo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação de Relatórios Técnicos em PDF</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Sem radar SAR Sentinel-1 sob nuvens</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Sem Shapefile/ISO-XML para trator</span>
                </div>
              </div>
            </div>

            <a
              href={billingCycle === 'annual' ? checkoutSoloAnnual : checkoutSoloMonthly}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <span>Subscrever Agrónomo Solo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Plan 2: Herdade Pro (Highlight) */}
          <div className="rounded-3xl p-6 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/60 flex flex-col justify-between shadow-xl shadow-emerald-950/40 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              Mais Recomendado (ROI Comprovado)
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Tractor className="w-4 h-4 text-emerald-400" />
                  <span>Herdade Pro</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                  VRA + SAR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Para explorações comerciais, olivais intensivos e vinhas.
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    €{billingCycle === 'annual' ? '99' : '129'}
                  </span>
                  <span className="text-xs text-slate-400">/ mês</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  Poupança típica de adubo: €3.400 a €12.000 / ano
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Até <strong>600 hectares</strong> e múltiplos talhões</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Radar SAR Sentinel-1</strong> (visão sob nuvens)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Exportação Shapefile (.zip)</strong> para tratores</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>ISO 11783-10 TASKDATA.XML</strong> (John Deere, Fendt)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rega de Precisão FAO-56 &amp; Balanço Hídrico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Scouting de campo georreferenciado com fotos</span>
                </div>
              </div>
            </div>

            <a
              href={billingCycle === 'annual' ? checkoutProAnnual : checkoutProMonthly}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/25"
            >
              <span>Subscrever Herdade Pro</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Plan 3: Cooperativa / Enterprise */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>Cooperativa / Enterprise</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  Multi-Associados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Para cooperativas agrícolas, associações de regantes e agroindústrias.
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    Sob Consulta
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Contratos anuais com SLA e formação técnica
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Hectares Ilimitados</strong> e gestão de múltiplos associados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>API REST de integração com ERPs agrícolas (SAP, Primavera)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Relatórios personalizados com timbre da Cooperativa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suporte prioritário e apoio à auditoria da PAC</span>
                </div>
              </div>
            </div>

            <a
              href="mailto:miguel.galrito@tecnico.ulisboa.pt?subject=CropVision%20Enterprise%20Cooperativa"
              className="mt-6 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <span>Contactar Direção Comercial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pagamentos seguros encriptados via Stripe &amp; LemonSqueezy com fatura com NIF.</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Conformidade com Diretiva Nitratos da UE (91/676/CEE) e Caderno de Campo.
          </div>
        </div>
      </div>
    </div>
  );
};
