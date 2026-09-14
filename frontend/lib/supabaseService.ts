/**
 * CropVision SaaS - Supabase Data Synchronization Service
 * Handles transparent syncing of Farms, Parcels, and Field Logs with localStorage fallback.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { FarmModel, ParcelModel } from './gis/parcelStorage';

export interface SupabaseParcelRow {
  id: string;
  farm_id: string;
  name: string;
  crop_type: string;
  training_system?: string;
  irrigation_type?: string;
  area_ha: number;
  geojson: any;
  latest_ndvi?: number;
  latest_sar_db?: number;
  created_at?: string;
}

/**
 * Saves or updates a parcel in Supabase database.
 * Falls back silently if unconfigured or in case of network issues.
 */
export async function syncParcelToSupabase(
  parcel: ParcelModel,
  farmId: string,
  latestNdvi?: number,
  latestSarDb?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured, using local persistence' };
  }

  try {
    const geojson = {
      type: 'Feature',
      properties: {
        id: parcel.id,
        name: parcel.name,
        cropType: parcel.cropType,
        areaHectares: parcel.areaHectares,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [parcel.polygon.map(([lat, lon]) => [lon, lat])],
      },
    };

    const payload: Partial<SupabaseParcelRow> = {
      name: parcel.name,
      crop_type: parcel.cropType,
      training_system: parcel.trainingSystem,
      irrigation_type: parcel.irrigationType,
      area_ha: parcel.areaHectares,
      geojson,
      latest_ndvi: latestNdvi ?? 0.72,
      latest_sar_db: latestSarDb ?? -12.4,
    };

    // Check if valid UUID, otherwise let database generate or upsert
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parcel.id);
    if (isUuid) {
      payload.id = parcel.id;
    }

    const { data, error } = await supabase
      .from('parcels')
      .upsert(payload as any)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase parcel sync warning (fallback to localStorage):', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase parcel sync exception:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Loads parcels for a specific farm from Supabase.
 */
export async function loadParcelsFromSupabase(farmId: string): Promise<ParcelModel[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('farm_id', farmId);

    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => {
      // Extract polygon coordinates [lat, lon] from GeoJSON
      const coords = row.geojson?.geometry?.coordinates?.[0] || [];
      const polygon: [number, number][] = coords.map(([lon, lat]: [number, number]) => [lat, lon]);

      return {
        id: row.id,
        name: row.name,
        farmId: row.farm_id || farmId,
        cropType: row.crop_type || 'olival',
        trainingSystem: row.training_system || 'intensivo',
        irrigationType: row.irrigation_type || 'gota-a-gota',
        areaHectares: parseFloat(row.area_ha) || 10,
        center: polygon[0] || [38.3842, -7.5519],
        polygon,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  } catch {
    return null;
  }
}

/**
 * Saves or updates Farm information in Supabase
 */
export async function syncFarmToSupabase(farm: FarmModel): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload = {
      name: farm.name,
      nif: farm.taxId,
      location: farm.locationLabel,
      logo_url: farm.customLogoUrl,
      agronomist_name: farm.agronomistName,
      agronomist_license: farm.agronomistLicense,
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(farm.id);
    const { error } = await supabase
      .from('farms')
      .upsert((isUuid ? { id: farm.id, ...payload } : payload) as any)
      .select();

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches public audit data for a parcel by ID or slug
 */
export async function fetchAuditParcel(parcelId: string): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('parcels')
      .select('*, farms(*)')
      .eq('id', parcelId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
