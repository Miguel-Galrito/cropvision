/**
 * CropVision SaaS - Field Scouting & Georeferenced Observations Store
 * Manages in-situ ground truth observations, pest alerts, and irrigation leaks.
 * Stored in LocalStorage and linked directly to Technical PDF Reports.
 */

export type ScoutingCategory = 'pest_disease' | 'irrigation_leak' | 'nutrient_deficiency' | 'weeds';
export type ScoutingSeverity = 'low' | 'medium' | 'critical';

export interface ScoutingRecord {
  id: string;
  lat: number;
  lon: number;
  date: string;
  category: ScoutingCategory;
  categoryLabel: string;
  severity: ScoutingSeverity;
  notes: string;
  photoUrl?: string;
  parcelId?: string;
  status: 'open' | 'resolved';
}

const STORAGE_KEY = 'cropvision_scouting_records_v1';

export const CATEGORY_LABELS: Record<ScoutingCategory, string> = {
  pest_disease: 'Praga / Infeção Fúngica',
  irrigation_leak: 'Fuga de Rega / Bloqueio de Setor',
  nutrient_deficiency: 'Carência Nutricional (Clorose)',
  weeds: 'Foco de Infestantes Competitivas',
};

export function loadScoutingRecords(): ScoutingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic scouting markers around the Alentejo preset
      const initial: ScoutingRecord[] = [
        {
          id: 'scout-1',
          lat: 38.3855,
          lon: -7.5505,
          date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
          category: 'nutrient_deficiency',
          categoryLabel: 'Carência Nutricional (Clorose)',
          severity: 'medium',
          notes: 'Clorose internerval visível em folhas jovens do setor poente. Correlacionado com Zona C do NDVI.',
          status: 'open',
        },
        {
          id: 'scout-2',
          lat: 38.3831,
          lon: -7.5532,
          date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
          category: 'irrigation_leak',
          categoryLabel: 'Fuga de Rega / Bloqueio de Setor',
          severity: 'critical',
          notes: 'Queda de pressão na linha secundária de gotejadores. Humidade anómala confirmada por radar SAR.',
          status: 'open',
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveScoutingRecord(record: Omit<ScoutingRecord, 'id' | 'date'>): ScoutingRecord {
  const records = loadScoutingRecords();
  const newRecord: ScoutingRecord = {
    ...record,
    id: `scout-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
  };
  const updated = [newRecord, ...records];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newRecord;
}

export function deleteScoutingRecord(id: string): ScoutingRecord[] {
  const records = loadScoutingRecords();
  const updated = records.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
