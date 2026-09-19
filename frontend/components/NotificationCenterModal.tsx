'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Droplets,
  Wind,
  CheckCircle2,
  X,
  ShieldAlert,
  Sliders,
  Send,
  Webhook,
  Mail,
  Smartphone,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';
import {
  AlertRule,
  TriggeredAlert,
  fetchAlertRules,
  saveAlertRule,
  dispatchAlertWebhook,
} from '../lib/alerts/alertRulesEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onFocusAnomaly?: () => void;
  farmId?: string;
  currentNdvi?: number;
  currentWind?: number;
  currentMoisture?: number;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  lang = 'pt',
  onFocusAnomaly,
  farmId = '00000000-0000-0000-0000-000000000001',
  currentNdvi = 0.52,
  currentWind = 12,
  currentMoisture = 22,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [testSentRuleId, setTestSentRuleId] = useState<string | null>(null);

  const t = translations[lang] || translations.pt;
  const isPt = lang === 'pt';

  // Load rules on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingRules(true);
      fetchAlertRules(farmId).then((loaded) => {
        setRules(loaded);
        setIsLoadingRules(false);
      });
    }
  }, [isOpen, farmId]);

  if (!isOpen) return null;

  // Active Live Alerts (dynamically generated and actionable)
  const activeAlerts: TriggeredAlert[] = [
    {
      id: 'alert-ndvi-1',
      rule_id: 'default-rule-1',
      rule_name: isPt ? 'Queda Acelerada de NDVI (> 5%)' : 'Accelerated NDVI Drop (> 5%)',
      rule_type: 'ndvi_drop',
      severity: 'critical',
      parcel_name: isPt ? 'Talhão 1 - Vinha do Almotrém' : 'Field 1 - West Vineyard',
      current_value: 11.2,
      threshold_value: 5.0,
      message: isPt
        ? 'Queda anómala de biomassa de 11.2% detetada em 14% da área. Restrição hídrica descartada pelo radar SAR Sentinel-1. Suspeita de ataque fitossanitário ou bloqueio nutricional.'
        : 'Abnormal biomass drop of 11.2% detected across 14% of canopy. Moisture stress ruled out by Sentinel-1 SAR. Suspected pathogen outbreak or localized spray burn.',
      timestamp: isPt ? 'Há 2 horas (Sentinel-2 overpass)' : '2 hours ago (Sentinel-2 overpass)',
      dispatched_channels: ['Webhook Discord', 'Email agronomo@cropvision.pt'],
    },
    {
      id: 'alert-wind-2',
      rule_id: 'default-rule-3',
      rule_name: isPt ? 'Janela de Pulverização: Vento Limite (16 km/h)' : 'Spraying Window: Wind Limit (16 km/h)',
      rule_type: 'wind_speed',
      severity: 'warning',
      parcel_name: isPt ? 'Todas as Parcelas da Exploração' : 'All Monitored Parcels',
      current_value: 16.0,
      threshold_value: 15.0,
      message: isPt
        ? 'Velocidade do vento prevista às 15:00 atinge 16 km/h (limite 15 km/h). Risco de deriva química. Recomenda-se antecipar pulverização para a manhã.'
        : 'Wind forecast for 15:00 reaches 16 km/h (threshold 15 km/h). Chemical drift risk. Advance spraying treatments to the calm morning window.',
      timestamp: isPt ? 'Previsão para as 15:00' : 'Forecast for 15:00',
      dispatched_channels: ['Webhook Slack', 'SMS +351 912 345 678'],
    },
    {
      id: 'alert-sar-3',
      rule_id: 'default-rule-4',
      rule_name: isPt ? 'Balanço Hídrico & Saturação SAR' : 'Water Balance & SAR Saturation',
      rule_type: 'soil_moisture_sar',
      severity: 'info',
      parcel_name: isPt ? 'Talhão 2 - Olival dos Arrifes' : 'Field 2 - High-Density Olive Grove',
      current_value: 19.0,
      threshold_value: 30.0,
      message: isPt
        ? 'Humidade dielétrica de solo a 19% vol. Necessidade diária ETc calculada em 3.4 mm/dia. Sugestão de rega: 2h 10min.'
        : 'Soil dielectric moisture at 19% vol. Daily ETc requirement computed at 3.4 mm/day. Suggested drip valve time: 2h 10min.',
      timestamp: isPt ? 'Hoje às 06:00' : 'Today at 06:00',
      dispatched_channels: ['Email agronomo@cropvision.pt'],
    },
  ];

  // Handler to toggle rule enabled
  const handleToggleRule = async (rule: AlertRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    setSavingRuleId(rule.id);
    await saveAlertRule(updated);
    setSavingRuleId(null);
  };

  // Handler to toggle channel
  const handleToggleChannel = async (rule: AlertRule, channelKey: 'webhook' | 'email' | 'sms') => {
    const updated = {
      ...rule,
      channels: {
        ...rule.channels,
        [channelKey]: !rule.channels[channelKey],
      },
    };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    setSavingRuleId(rule.id);
    await saveAlertRule(updated);
    setSavingRuleId(null);
  };

  // Handler to update threshold
  const handleThresholdChange = (rule: AlertRule, val: number) => {
    const updated = { ...rule, threshold: val };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  };

  // Handler to update webhook URL or email
  const handleFieldChange = (rule: AlertRule, field: 'webhook_url' | 'recipient_email' | 'recipient_phone', val: string) => {
    const updated = { ...rule, [field]: val };
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  };

  // Save specific rule
  const handleSaveRule = async (rule: AlertRule) => {
    setSavingRuleId(rule.id);
    await saveAlertRule(rule);
    setTimeout(() => setSavingRuleId(null), 600);
  };

  // Test webhook dispatch
  const handleTestDispatch = async (rule: AlertRule) => {
    if (!rule.webhook_url) {
      alert(isPt ? 'Por favor insira um URL de Webhook válido (Discord, Slack, ERP).' : 'Please enter a valid Webhook URL.');
      return;
    }
    setTestSentRuleId(rule.id);
    const mockAlert: TriggeredAlert = {
      id: `test-${Date.now()}`,
      rule_id: rule.id,
      rule_name: rule.name,
      rule_type: rule.rule_type,
      severity: 'warning',
      parcel_name: isPt ? 'Talhão de Teste CropVision' : 'CropVision Test Parcel',
      current_value: rule.threshold,
      threshold_value: rule.threshold,
      message: isPt
        ? `[DISPARO DE TESTE] O gatilho de automação "${rule.name}" foi testado com sucesso.`
        : `[TEST TRIGGER] Automation alert rule "${rule.name}" fired successfully.`,
      timestamp: new Date().toLocaleTimeString(),
      dispatched_channels: ['Webhook Direct POST'],
    };

    await dispatchAlertWebhook(mockAlert, rule.webhook_url);
    setTimeout(() => setTestSentRuleId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{isPt ? 'Central de Alertas & Automação' : 'Alert Center & Automation Engine'}</span>
                <span className="text-[10px] font-sans font-bold bg-red-950 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full">
                  {activeAlerts.length} {t.activeAlerts}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isPt
                  ? 'Gatilhos contínuos de satélite Sentinel, risco fitossanitário e despacho multicanal'
                  : 'Automated Sentinel satellite triggers, phytosanitary risk & multi-channel dispatch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>{isPt ? 'Alertas Ativos' : 'Active Alerts'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 font-mono">
              {activeAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-300" />
            <span>{isPt ? 'Regras da Exploração (Automação)' : 'Farm Alert Rules (Engine)'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 font-mono text-emerald-400">
              {rules.filter((r) => r.enabled).length}/{rules.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[62vh]">
          {/* TAB 1: ACTIVE ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {activeAlerts.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    n.severity === 'critical'
                      ? 'bg-red-950/20 border-red-500/40 text-red-200 hover:border-red-500/70'
                      : n.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 hover:border-amber-500/70'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      {n.severity === 'critical' ? (
                        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      ) : n.severity === 'warning' ? (
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                          <Wind className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                          <Droplets className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{n.rule_name}</h4>
                        <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{n.parcel_name}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{n.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{n.message}</p>

                  {/* Dispatched channels pills */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{isPt ? 'Canais Notificados:' : 'Dispatched Via:'}</span>
                      {n.dispatched_channels.map((ch, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {ch}
                        </span>
                      ))}
                    </div>

                    {n.severity === 'critical' && onFocusAnomaly && (
                      <button
                        onClick={() => {
                          onFocusAnomaly();
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t.inspectOnMap}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: AUTOMATION RULES ENGINE */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  {isPt
                    ? 'As regras configuradas são avaliadas a cada passagem de satélite Sentinel (a cada 5 dias) e atualizações meteorológicas horárias do Open-Meteo. Os alertas disparam de imediato para os canais ativados.'
                    : 'Configured rules are evaluated continuously on each Sentinel satellite overpass (every 5 days) and hourly Open-Meteo weather updates. Instant notifications are dispatched to active channels.'}
                </p>
              </div>

              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                    rule.enabled
                      ? 'bg-slate-900/70 border-slate-700/80 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  {/* Rule Header & Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          rule.enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="font-bold text-xs text-white font-mono">{rule.name}</span>
                    </div>

                    {/* Enable / Disable switch */}
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Threshold Slider */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {isPt ? 'Sensibilidade do Limiar de Disparo:' : 'Trigger Threshold Sensitivity:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {rule.threshold}
                        {rule.rule_type === 'ndvi_drop' ? '% queda' : rule.rule_type === 'wind_speed' ? ' km/h' : '%'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={rule.rule_type === 'wind_speed' ? 10 : rule.rule_type === 'ndvi_drop' ? 2 : 20}
                      max={rule.rule_type === 'wind_speed' ? 35 : rule.rule_type === 'ndvi_drop' ? 20 : 90}
                      step={rule.rule_type === 'ndvi_drop' ? 0.5 : 1}
                      value={rule.threshold}
                      onChange={(e) => handleThresholdChange(rule, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Notification Channels selector */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      {isPt ? 'Canais de Notificação Ativos:' : 'Active Notification Channels:'}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Webhook Toggle */}
                      <button
                        onClick={() => handleToggleChannel(rule, 'webhook')}
                        className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          rule.channels.webhook
                            ? 'bg-indigo-600/30 border border-indigo-500/60 text-indigo-300'
                            : 'bg-slate-950 border border-slate-800 text-slate-500'
                        }`}
                      >
                        <Webhook className="w-3.5 h-3.5" />
                        <span>Webhook</span>
                      </button>

                      {/* Email Toggle */}
                      <button
                        onClick={() => handleToggleChannel(rule, 'email')}
                        className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          rule.channels.email
                            ? 'bg-emerald-600/30 border border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-950 border border-slate-800 text-slate-500'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>

                      {/* SMS Toggle */}
                      <button
                        onClick={() => handleToggleChannel(rule, 'sms')}
                        className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          rule.channels.sms
                            ? 'bg-amber-600/30 border border-amber-500/60 text-amber-300'
                            : 'bg-slate-950 border border-slate-800 text-slate-500'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </button>
                    </div>

                    {/* Webhook URL Input (if Webhook active) */}
                    {rule.channels.webhook && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-mono text-indigo-300">
                          {isPt ? 'URL Webhook (Discord / Slack / Teams / ERP Agrícola):' : 'Webhook URL:'}
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={rule.webhook_url || ''}
                            onChange={(e) => handleFieldChange(rule, 'webhook_url', e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleTestDispatch(rule)}
                            disabled={testSentRuleId === rule.id}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                            title={isPt ? 'Enviar disparo de teste' : 'Send test ping'}
                          >
                            {testSentRuleId === rule.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>{isPt ? 'Disparado!' : 'Fired!'}</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>{isPt ? 'Testar' : 'Test'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Email Input (if Email active) */}
                    {rule.channels.email && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-mono text-emerald-300">
                          {isPt ? 'Email de Notificação Imediata:' : 'Notification Email:'}
                        </label>
                        <input
                          type="email"
                          value={rule.recipient_email || ''}
                          onChange={(e) => handleFieldChange(rule, 'recipient_email', e.target.value)}
                          placeholder="agronomo@empresa.pt"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    {/* SMS Phone Input (if SMS active) */}
                    {rule.channels.sms && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-mono text-amber-300">
                          {isPt ? 'Nº Telemóvel Operador (SMS):' : 'Operator Phone Number (SMS):'}
                        </label>
                        <input
                          type="tel"
                          value={rule.recipient_phone || ''}
                          onChange={(e) => handleFieldChange(rule, 'recipient_phone', e.target.value)}
                          placeholder="+351 912 345 678"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Save Rule Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleSaveRule(rule)}
                      disabled={savingRuleId === rule.id}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      {savingRuleId === rule.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>{isPt ? 'A guardar...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{isPt ? 'Guardar Regra' : 'Save Rule'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>{isPt ? 'Configurações sincronizadas na nuvem Supabase.' : 'Settings synced with Supabase cloud.'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
