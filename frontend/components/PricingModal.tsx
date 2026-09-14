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
  X,
  Tractor,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  reason?: 'limit_reached' | 'pdf_unlock' | 'vra_unlock' | 'generic';
  isWebSummitMode?: boolean;
  onToggleWebSummitMode?: () => void;
  dailyUsageCount?: number;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  lang = 'pt',
  reason = 'generic',
  isWebSummitMode = true,
  onToggleWebSummitMode,
  dailyUsageCount = 3,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const t = translations[lang] || translations.pt;

  if (!isOpen) return null;

  // Real Whop Checkout URLs specified by user
  const WHOP_STARTER_URL = 'https://whop.com/cropvision/cropvision-starter/';
  const WHOP_PRO_ENTERPRISE_URL = 'https://whop.com/cropvision/cropvision-pro-enterprise/';

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

        {/* Web Summit VIP Pitch Mode Toggle */}
        <div className="mb-6 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              {isWebSummitMode ? t.webSummitActive : t.standardModeActive}
            </span>
          </div>
          {onToggleWebSummitMode && (
            <button
              onClick={onToggleWebSummitMode}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isWebSummitMode
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isWebSummitMode
                ? (lang === 'en' ? '✓ Web Summit Unlimited Active' : '✓ Modo Web Summit Ativo (Ilimitado)')
                : (lang === 'en' ? 'Enable Web Summit VIP Mode' : 'Ativar Modo Web Summit VIP')}
            </button>
          )}
        </div>

        {/* Quota Exceeded (3/3) Whop Redirect Alert */}
        {reason === 'limit_reached' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/60 text-red-200 text-xs animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <h4 className="font-bold text-sm text-white">
                {t.quotaExceededTitle}
              </h4>
            </div>
            <p className="mt-2 text-slate-300 leading-relaxed">
              {t.quotaExceededDesc}
            </p>
            <div className="mt-3 flex items-center space-x-3">
              <a
                href={WHOP_PRO_ENTERPRISE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span>{t.unlockOnWhop}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Feature Gated VRA Alert */}
        {reason === 'vra_unlock' && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center space-x-3 text-amber-200 text-xs">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>{t.featureGatedVra}</div>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.pricingBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.pricingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {t.pricingSub}
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
              {t.monthlyBilling}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.annualBilling}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan 1: CropVision Starter */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{t.tierStarterName}</h3>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  {t.tierStarterBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t.tierStarterDesc}
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    €{billingCycle === 'annual' ? '39' : '49'}
                  </span>
                  <span className="text-xs text-slate-400">{t.perMonth}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {billingCycle === 'annual' ? t.billedAnnually : t.billedMonthly}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierStarterF1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierStarterF2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierStarterF3}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierStarterF4}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{t.tierStarterF5}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{t.tierStarterF6}</span>
                </div>
              </div>
            </div>

            <a
              href={WHOP_STARTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <span>{t.subscribeStarter}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Plan 2: CropVision Pro & Enterprise (Whop Highlight) */}
          <div className="rounded-3xl p-6 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/60 flex flex-col justify-between shadow-xl shadow-emerald-950/40 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              {t.recommended}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Tractor className="w-4 h-4 text-emerald-400" />
                  <span>{t.tierProName}</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                  {t.tierProBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t.tierProDesc}
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    €{billingCycle === 'annual' ? '99' : '129'}
                  </span>
                  <span className="text-xs text-slate-400">{t.perMonth}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  {t.tierProSavings}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF3}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF4}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF5}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierProF6}</span>
                </div>
              </div>
            </div>

            <a
              href={WHOP_PRO_ENTERPRISE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black transition-all text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/25"
            >
              <span>{t.subscribePro}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Plan 3: Cooperative / Enterprise */}
          <div className="rounded-3xl p-6 bg-slate-900/50 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>{t.tierEntName}</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  {t.tierEntBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t.tierEntDesc}
              </p>

              <div className="mt-5 mb-5">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {t.tierEntCustom}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {t.tierEntSub}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierEntF1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierEntF2}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierEntF3}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tierEntF4}</span>
                </div>
              </div>
            </div>

            <a
              href={WHOP_PRO_ENTERPRISE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
            >
              <span>{t.contactEnterprise}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.secureWhopStripe}</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            {t.euNitratesCert}
          </div>
        </div>
      </div>
    </div>
  );
};
