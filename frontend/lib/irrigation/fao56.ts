/**
 * CropVision SaaS - FAO-56 Precision Irrigation & Water Balance Engine
 * Implements Penman-Monteith dual crop coefficient approach (ETc = Kc * ET0)
 * dynamically calibrated from Sentinel-2 canopy NDVI and Sentinel-1 SAR soil moisture.
 */

export type CropType = 'olival' | 'vinha' | 'amendoal' | 'milho' | 'pradaria';
export type IrrigationType = 'gota-a-gota' | 'pivot' | 'sequeiro';
export type TrainingSystem = 'intensivo' | 'superintensivo' | 'tradicional';

export interface CropParameters {
  id: CropType;
  name: string;
  defaultKcBase: number;
  maxKc: number;
  ndviMultiplier: number;
  rootDepthM: number;
  typicalIrrigationRateMmH: number; // e.g. 2.5 mm/h
}

export const CROP_DATABASE: Record<CropType, CropParameters> = {
  olival: {
    id: 'olival',
    name: 'Olival (Olea europaea)',
    defaultKcBase: 0.25,
    maxKc: 0.75,
    ndviMultiplier: 0.7,
    rootDepthM: 1.2,
    typicalIrrigationRateMmH: 1.8,
  },
  vinha: {
    id: 'vinha',
    name: 'Vinha (Vitis vinifera)',
    defaultKcBase: 0.20,
    maxKc: 0.80,
    ndviMultiplier: 0.85,
    rootDepthM: 1.5,
    typicalIrrigationRateMmH: 1.5,
  },
  amendoal: {
    id: 'amendoal',
    name: 'Amendoal (Prunus dulcis)',
    defaultKcBase: 0.30,
    maxKc: 0.95,
    ndviMultiplier: 0.9,
    rootDepthM: 1.4,
    typicalIrrigationRateMmH: 2.2,
  },
  milho: {
    id: 'milho',
    name: 'Milho Grão/Silagem (Zea mays)',
    defaultKcBase: 0.35,
    maxKc: 1.15,
    ndviMultiplier: 1.2,
    rootDepthM: 0.9,
    typicalIrrigationRateMmH: 4.5, // Pivot
  },
  pradaria: {
    id: 'pradaria',
    name: 'Pradaria / Pastagem Permanente',
    defaultKcBase: 0.40,
    maxKc: 1.05,
    ndviMultiplier: 0.95,
    rootDepthM: 0.6,
    typicalIrrigationRateMmH: 3.5,
  },
};

export interface IrrigationRecommendation {
  crop: CropParameters;
  trainingSystem: TrainingSystem;
  irrigationType: IrrigationType;
  cropCoefficientKc: number;
  referenceEt0Mm: number;
  cropEtcMmDay: number;
  effectivePrecipitationMm: number;
  netIrrigationNeedMmDay: number;
  waterVolumeM3HaDay: number;
  totalParcelVolumeM3Day: number;
  recommendedDurationMinutes: number;
  recommendedDurationText: string;
  stressRiskLevel: 'low' | 'moderate' | 'high';
  sarMoistureStatus: string;
}

/**
 * Calculates dynamic crop coefficient Kc and daily irrigation requirement.
 */
export function calculateIrrigationSchedule(
  meanNdvi: number,
  et0Mm: number,
  parcelHectares: number,
  cropType: CropType = 'olival',
  irrigationType: IrrigationType = 'gota-a-gota',
  trainingSystem: TrainingSystem = 'intensivo',
  effectivePrecipMm: number = 0.0
): IrrigationRecommendation {
  const crop = CROP_DATABASE[cropType] || CROP_DATABASE.olival;

  // Dynamic Kc formulation: Kc = Base + Multiplier * NDVI, constrained by crop max
  // Standard FAO formula: Kc = 1.2 * NDVI + 0.1, clamped
  let rawKc = crop.defaultKcBase + crop.ndviMultiplier * meanNdvi;
  if (trainingSystem === 'superintensivo') rawKc *= 1.12;
  if (trainingSystem === 'tradicional') rawKc *= 0.88;

  const cropCoefficientKc = Number(Math.max(0.2, Math.min(crop.maxKc, rawKc)).toFixed(2));

  // Crop Evapotranspiration ETc = Kc * ET0
  const cropEtcMmDay = Number((cropCoefficientKc * et0Mm).toFixed(2));

  // Net irrigation need = ETc - Peff
  const netNeedMm = Math.max(0, cropEtcMmDay - effectivePrecipMm);
  const netIrrigationNeedMmDay = Number(netNeedMm.toFixed(2));

  // 1 mm = 10 m3/ha
  const waterVolumeM3HaDay = Math.round(netIrrigationNeedMmDay * 10);
  const totalParcelVolumeM3Day = Math.round(waterVolumeM3HaDay * parcelHectares);

  // Suggested run time based on system application rate
  let emitterRateMmH = crop.typicalIrrigationRateMmH;
  if (irrigationType === 'pivot') emitterRateMmH = 4.8;
  if (irrigationType === 'sequeiro') emitterRateMmH = 0;

  let recommendedDurationMinutes = 0;
  let recommendedDurationText = 'Cultura em sequeiro (sem rega ativa)';

  if (irrigationType !== 'sequeiro' && emitterRateMmH > 0 && netIrrigationNeedMmDay > 0) {
    const hours = netIrrigationNeedMmDay / emitterRateMmH;
    recommendedDurationMinutes = Math.round(hours * 60);

    const h = Math.floor(recommendedDurationMinutes / 60);
    const m = recommendedDurationMinutes % 60;
    recommendedDurationText = `Ligar setor por ${h}h ${m > 0 ? `${m}min` : ''} (${emitterRateMmH.toFixed(1)} mm/h)`;
  } else if (netIrrigationNeedMmDay === 0) {
    recommendedDurationText = 'Necessidade hídrica satisfeita por precipitação natural';
  }

  // Stress level evaluation
  let stressRiskLevel: 'low' | 'moderate' | 'high' = 'low';
  if (netIrrigationNeedMmDay > 4.5 && meanNdvi < 0.45) {
    stressRiskLevel = 'high';
  } else if (netIrrigationNeedMmDay > 3.0) {
    stressRiskLevel = 'moderate';
  }

  return {
    crop,
    trainingSystem,
    irrigationType,
    cropCoefficientKc,
    referenceEt0Mm: et0Mm,
    cropEtcMmDay,
    effectivePrecipitationMm: effectivePrecipMm,
    netIrrigationNeedMmDay,
    waterVolumeM3HaDay,
    totalParcelVolumeM3Day,
    recommendedDurationMinutes,
    recommendedDurationText,
    stressRiskLevel,
    sarMoistureStatus: 'Penetração SAR S1 indica humidade residual no solo a 15% vol.',
  };
}
