import { supabase } from '../supabaseClient';

export type AlertRuleType = 'ndvi_drop' | 'disease_critical' | 'wind_speed' | 'soil_moisture_sar' | 'custom';

export interface AlertChannels {
  webhook: boolean;
  email: boolean;
  sms: boolean;
}

export interface AlertRule {
  id: string;
  farm_id: string;
  name: string;
  rule_type: AlertRuleType;
  threshold: number;
  enabled: boolean;
  channels: AlertChannels;
  webhook_url?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  created_at?: string;
}

export interface AlertEvaluationContext {
  parcelName: string;
  currentNdvi: number;
  previousNdvi?: number | null;
  diseaseRiskPct: number;
  diseaseName?: string;
  windSpeedKmH: number;
  sarMoisturePct: number;
}

export interface TriggeredAlert {
  id: string;
  rule_id: string;
  rule_name: string;
  rule_type: AlertRuleType;
  severity: 'critical' | 'warning' | 'info';
  parcel_name: string;
  current_value: number;
  threshold_value: number;
  message: string;
  timestamp: string;
  dispatched_channels: string[];
}

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'default-rule-1',
    farm_id: '00000000-0000-0000-0000-000000000001',
    name: 'Queda Acelerada de NDVI (> 5%)',
    rule_type: 'ndvi_drop',
    threshold: 5.0,
    enabled: true,
    channels: { webhook: true, email: true, sms: false },
    webhook_url: 'https://discord.com/api/webhooks/agrotech/alerts',
    recipient_email: 'agronomo@cropvision.pt',
  },
  {
    id: 'default-rule-2',
    farm_id: '00000000-0000-0000-0000-000000000001',
    name: 'Risco Fitossanitário Crítico (Gafa / Míldio)',
    rule_type: 'disease_critical',
    threshold: 75.0,
    enabled: true,
    channels: { webhook: false, email: true, sms: true },
    recipient_email: 'agronomo@cropvision.pt',
    recipient_phone: '+351 912 345 678',
  },
  {
    id: 'default-rule-3',
    farm_id: '00000000-0000-0000-0000-000000000001',
    name: 'Vento Excessivo p/ Pulverização (> 15 km/h)',
    rule_type: 'wind_speed',
    threshold: 15.0,
    enabled: true,
    channels: { webhook: true, email: false, sms: true },
    webhook_url: 'https://hooks.slack.com/services/cropvision/drift-warning',
    recipient_phone: '+351 912 345 678',
  },
  {
    id: 'default-rule-4',
    farm_id: '00000000-0000-0000-0000-000000000001',
    name: 'Saturação Hídrica de Solo Radar SAR (> 30% vol.)',
    rule_type: 'soil_moisture_sar',
    threshold: 30.0,
    enabled: true,
    channels: { webhook: true, email: true, sms: false },
    webhook_url: 'https://discord.com/api/webhooks/agrotech/alerts',
    recipient_email: 'agronomo@cropvision.pt',
  },
];

const LOCAL_STORAGE_KEY = 'cropvision_alert_rules';

/**
 * Fetch alert rules for a farm (Supabase with localStorage fallback)
 */
export async function fetchAlertRules(farmId: string): Promise<AlertRule[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AlertRule[];
      }
    }
  } catch (err) {
    console.warn('[alertRulesEngine] Supabase fetch failed, checking localStorage fallback:', err);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${farmId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached alert rules', e);
      }
    }
  }

  return DEFAULT_ALERT_RULES;
}

/**
 * Save / Update an alert rule in Supabase and localStorage
 */
export async function saveAlertRule(rule: AlertRule): Promise<boolean> {
  let savedInRemote = false;
  try {
    if (supabase) {
      const { error } = await supabase
        .from('alert_rules')
        .upsert({
          id: rule.id.startsWith('default-') ? undefined : rule.id,
          farm_id: rule.farm_id,
          name: rule.name,
          rule_type: rule.rule_type,
          threshold: rule.threshold,
          enabled: rule.enabled,
          channels: rule.channels,
          webhook_url: rule.webhook_url,
          recipient_email: rule.recipient_email,
          recipient_phone: rule.recipient_phone,
        });

      if (!error) savedInRemote = true;
    }
  } catch (err) {
    console.warn('[alertRulesEngine] Supabase save failed:', err);
  }

  // Update local storage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${rule.farm_id}`);
      let list: AlertRule[] = cached ? JSON.parse(cached) : [...DEFAULT_ALERT_RULES];
      const idx = list.findIndex((r) => r.id === rule.id);
      if (idx >= 0) {
        list[idx] = rule;
      } else {
        list.push(rule);
      }
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${rule.farm_id}`, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to cache alert rule in localStorage', e);
    }
  }

  return savedInRemote;
}

/**
 * Evaluate alert rules dynamically against real field telemetry
 */
export function evaluateAlertRules(
  rules: AlertRule[],
  ctx: AlertEvaluationContext
): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const activeChannels: string[] = [];
    if (rule.channels.webhook) activeChannels.push('Webhook');
    if (rule.channels.email) activeChannels.push('Email');
    if (rule.channels.sms) activeChannels.push('SMS');

    switch (rule.rule_type) {
      case 'ndvi_drop': {
        const prev = ctx.previousNdvi ?? 0.65;
        const dropPct = Number((((prev - ctx.currentNdvi) / Math.max(prev, 0.1)) * 100).toFixed(1));
        if (dropPct >= rule.threshold) {
          triggered.push({
            id: `trig-${rule.id}-${Date.now()}`,
            rule_id: rule.id,
            rule_name: rule.name,
            rule_type: rule.rule_type,
            severity: 'critical',
            parcel_name: ctx.parcelName,
            current_value: dropPct,
            threshold_value: rule.threshold,
            message: `Queda brusca de ${dropPct}% no NDVI (limiar: ${rule.threshold}%). Possível ataque fitossanitário ou stress biótico agudo.`,
            timestamp: nowStr,
            dispatched_channels: activeChannels,
          });
        }
        break;
      }

      case 'disease_critical': {
        if (ctx.diseaseRiskPct >= rule.threshold) {
          triggered.push({
            id: `trig-${rule.id}-${Date.now()}`,
            rule_id: rule.id,
            rule_name: rule.name,
            rule_type: rule.rule_type,
            severity: 'critical',
            parcel_name: ctx.parcelName,
            current_value: ctx.diseaseRiskPct,
            threshold_value: rule.threshold,
            message: `Pressão de ${ctx.diseaseName || 'Gafa / Míldio'} atingiu ${ctx.diseaseRiskPct}% (limiar crítico: ${rule.threshold}%). Intervenção fitofarmacêutica recomendada.`,
            timestamp: nowStr,
            dispatched_channels: activeChannels,
          });
        }
        break;
      }

      case 'wind_speed': {
        if (ctx.windSpeedKmH >= rule.threshold) {
          triggered.push({
            id: `trig-${rule.id}-${Date.now()}`,
            rule_id: rule.id,
            rule_name: rule.name,
            rule_type: rule.rule_type,
            severity: 'warning',
            parcel_name: ctx.parcelName,
            current_value: ctx.windSpeedKmH,
            threshold_value: rule.threshold,
            message: `Vento de ${ctx.windSpeedKmH} km/h ultrapassou o teto de pulverização (${rule.threshold} km/h). Risco de deriva e ineficácia química.`,
            timestamp: nowStr,
            dispatched_channels: activeChannels,
          });
        }
        break;
      }

      case 'soil_moisture_sar': {
        if (ctx.sarMoisturePct >= rule.threshold) {
          triggered.push({
            id: `trig-${rule.id}-${Date.now()}`,
            rule_id: rule.id,
            rule_name: rule.name,
            rule_type: rule.rule_type,
            severity: 'warning',
            parcel_name: ctx.parcelName,
            current_value: ctx.sarMoisturePct,
            threshold_value: rule.threshold,
            message: `Saturação dielétrica SAR atingiu ${ctx.sarMoisturePct}% vol. (limiar: ${rule.threshold}%). Risco de encharcamento e asfixia radicular.`,
            timestamp: nowStr,
            dispatched_channels: activeChannels,
          });
        }
        break;
      }

      default:
        break;
    }
  }

  return triggered;
}

/**
 * Dispatch simulated webhook payload to external URL (Discord / Slack / Agronomic ERP)
 */
export async function dispatchAlertWebhook(alert: TriggeredAlert, webhookUrl: string): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const payload = {
      event: 'cropvision.alert.triggered',
      severity: alert.severity,
      parcel: alert.parcel_name,
      rule: alert.rule_name,
      message: alert.message,
      value: alert.current_value,
      threshold: alert.threshold_value,
      dispatched_at: new Date().toISOString(),
    };

    console.info(`[alertRulesEngine] Dispatching webhook to ${webhookUrl}:`, payload);
    // In browser, handle no-cors or mock dispatch to avoid blocking if user enters private URL
    if (typeof window !== 'undefined') {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (postErr) {
        console.warn('[alertRulesEngine] Webhook network post failed (possibly CORS), recorded locally:', postErr);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to dispatch webhook', err);
    return false;
  }
}
