/**
 * CropVision SaaS - Farm & Parcel Persistence Store
 * Manages multiple estates/farms, active parcels, agronomic metadata (crop, irrigation, spacing).
 */

import { CropType, IrrigationType, TrainingSystem } from '../irrigation/fao56';
import { PRESET_LOCATIONS } from '../presets';

export interface ParcelModel {
  id: string;
  name: string;
  farmId: string;
  cropType: CropType;
  trainingSystem: TrainingSystem;
  irrigationType: IrrigationType;
  areaHectares: number;
  center: [number, number]; // [lat, lon]
  polygon: [number, number][]; // [lat, lon]
  createdAt: string;
}

export interface FarmModel {
  id: string;
  name: string;
  locationLabel: string;
  center: [number, number];
  parcels: ParcelModel[];
  companyName?: string;
  taxId?: string;
  cadastralAddress?: string;
  agronomistName?: string;
  agronomistLicense?: string;
  customLogoUrl?: string;
}

const FARMS_STORAGE_KEY = 'cropvision_user_farms_v2';
const ACTIVE_FARM_KEY = 'cropvision_active_farm_id_v2';
const ACTIVE_PARCEL_KEY = 'cropvision_active_parcel_id_v2';

export function getInitialFarms(): FarmModel[] {
  return [
    {
      id: 'farm-esporao',
      name: 'Herdade do Esporão',
      locationLabel: 'Reguengos de Monsaraz, Alentejo',
      center: [38.3842, -7.5519],
      companyName: 'Finagra, S.A. (Herdade do Esporão)',
      taxId: 'PT 500 123 456',
      cadastralAddress: 'Apartado 157, 7200-999 Reguengos de Monsaraz',
      agronomistName: 'Eng. Agrónomo Miguel Silva',
      agronomistLicense: 'OE-AGR-49120',
      parcels: [
        {
          id: 'parcel-esporao-1',
          name: 'Talhão 1 - Vinha do Almotrém',
          farmId: 'farm-esporao',
          cropType: 'vinha',
          trainingSystem: 'intensivo',
          irrigationType: 'gota-a-gota',
          areaHectares: 28.5,
          center: [38.3842, -7.5519],
          polygon: (PRESET_LOCATIONS[0].polygon as [number, number][]) || [
            [38.3865, -7.5545],
            [38.3865, -7.549],
            [38.3815, -7.549],
            [38.3815, -7.5545],
            [38.3865, -7.5545],
          ],
          createdAt: '2026-09-01',
        },
        {
          id: 'parcel-esporao-2',
          name: 'Talhão 2 - Olival dos Arrifes',
          farmId: 'farm-esporao',
          cropType: 'olival',
          trainingSystem: 'superintensivo',
          irrigationType: 'gota-a-gota',
          areaHectares: 42.0,
          center: [38.3912, -7.5478],
          polygon: [
            [38.3935, -7.5505],
            [38.3935, -7.545],
            [38.389, -7.545],
            [38.389, -7.5505],
            [38.3935, -7.5505],
          ],
          createdAt: '2026-09-02',
        },
      ],
    },
    {
      id: 'farm-monte-novo',
      name: 'Herdade Monte Novo',
      locationLabel: 'Vila Viçosa, Alentejo',
      center: [38.7833, -7.4167],
      parcels: [
        {
          id: 'parcel-monte-novo-1',
          name: 'Talhão Poente - Olival Cobrançosa',
          farmId: 'farm-monte-novo',
          cropType: 'olival',
          trainingSystem: 'intensivo',
          irrigationType: 'gota-a-gota',
          areaHectares: 35.8,
          center: [38.7833, -7.4167],
          polygon: [
            [38.786, -7.419],
            [38.786, -7.414],
            [38.7805, -7.414],
            [38.7805, -7.419],
            [38.786, -7.419],
          ],
          createdAt: '2026-09-05',
        },
      ],
    },
    {
      id: 'farm-quinta-vale',
      name: 'Quinta do Vale',
      locationLabel: 'Douro Superior, Foz Côa',
      center: [41.0825, -7.1147],
      parcels: [
        {
          id: 'parcel-vale-1',
          name: 'Vinha dos Socalcos - Touriga Nacional',
          farmId: 'farm-quinta-vale',
          cropType: 'vinha',
          trainingSystem: 'tradicional',
          irrigationType: 'sequeiro',
          areaHectares: 18.2,
          center: [41.0825, -7.1147],
          polygon: (PRESET_LOCATIONS[1].polygon as [number, number][]) || [
            [41.085, -7.117],
            [41.085, -7.112],
            [41.08, -7.112],
            [41.08, -7.117],
            [41.085, -7.117],
          ],
          createdAt: '2026-09-08',
        },
      ],
    },
  ];
}

export function loadFarms(): FarmModel[] {
  if (typeof window === 'undefined') return getInitialFarms();
  try {
    const raw = localStorage.getItem(FARMS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialFarms();
      localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialFarms();
  }
}

export function saveFarms(farms: FarmModel[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(farms));
}

export function getActiveFarmId(): string {
  if (typeof window === 'undefined') return 'farm-esporao';
  return localStorage.getItem(ACTIVE_FARM_KEY) || 'farm-esporao';
}

export function setActiveFarmId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_FARM_KEY, id);
}

export function getActiveParcelId(): string {
  if (typeof window === 'undefined') return 'parcel-esporao-1';
  return localStorage.getItem(ACTIVE_PARCEL_KEY) || 'parcel-esporao-1';
}

export function setActiveParcelId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PARCEL_KEY, id);
}
