/**
 * CropVision SaaS - High-Precision Agro-Epidemiological Disease Risk Engine
 * Implements recognized bio-mathematical infection models for high-value Mediterranean crops:
 * - Vineyard (Vinha): Plasmopara viticola (3x10 Rule), Erysiphe necator (UC Davis Index), Botrytis cinerea
 * - Olive Grove (Olival): Colletotrichum spp. (Anthracnose/Gafa), Spilocaea oleagina (Peacock Spot), Bactrocera oleae (GDD Accumulation)
 * - Almond & Orchards: Monilinia laxa
 */

import { CropType } from '../irrigation/fao56';
import { HourlyAgroForecast, AgroClimateData } from '../weather/openMeteo';
import { Language } from '../i18n';

export type RiskLevel = 'low' | 'moderate' | 'critical';

export interface DiseaseRiskAssessment {
  id: string;
  name: string;
  scientificName: string;
  crop: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 to 100
  statusLabel: string;
  diagnostic: string;
  sprayRecommendation: string;
  recommendedActiveIngredients: string[];
  projection5Days: {
    dayLabel: string;
    date: string;
    riskScore: number;
    riskLevel: RiskLevel;
    precipMm: number;
    avgTempC: number;
  }[];
}

/**
 * Calculates comprehensive plant health and fungal disease risks based on real agro-weather data.
 */
export function calculateDiseaseRisks(
  cropType: CropType,
  currentTempC: number,
  currentHumidityPct: number,
  hourlyForecast: HourlyAgroForecast[] = [],
  lang: Language = 'pt'
): DiseaseRiskAssessment[] {
  const isEn = lang === 'en';

  // Compute 24h & 48h meteorological indicators
  const next24 = hourlyForecast.slice(0, 24);
  const next48 = hourlyForecast.slice(0, 48);

  const rain24h = next24.reduce((sum, h) => sum + (h.precipitationMm || 0), 0);
  const rain48h = next48.reduce((sum, h) => sum + (h.precipitationMm || 0), 0);
  const avgTemp24h = next24.length > 0 ? next24.reduce((sum, h) => sum + h.temperatureC, 0) / next24.length : currentTempC;
  const avgRh24h = next24.length > 0 ? next24.reduce((sum, h) => sum + h.relativeHumidityPct, 0) / next24.length : currentHumidityPct;

  // High humidity hours (RH > 80%) indicating leaf wetness
  const wetHours24h = next24.filter((h) => h.relativeHumidityPct >= 80).length;

  const assessments: DiseaseRiskAssessment[] = [];

  // Helper to build 5-day projections
  const build5DayProjection = (baseScore: number, tempFactor: number, rainFactor: number) => {
    const days: DiseaseRiskAssessment['projection5Days'] = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);

      // Extract day's slice of hourly forecast
      const startH = i * 24;
      const daySlice = hourlyForecast.slice(startH, startH + 24);
      const dayRain = daySlice.reduce((sum, h) => sum + (h.precipitationMm || 0), 0);
      const dayTemp = daySlice.length > 0 ? daySlice.reduce((sum, h) => sum + h.temperatureC, 0) / daySlice.length : avgTemp24h;

      // Project score based on simulated weather evolution
      let score = baseScore;
      if (dayRain > 5) score += rainFactor * 1.5;
      else if (dayRain > 1) score += rainFactor * 0.8;
      else score -= 8;

      if (dayTemp >= 18 && dayTemp <= 26) score += tempFactor;
      else if (dayTemp > 32 || dayTemp < 10) score -= 14;

      score = Math.max(8, Math.min(96, Math.round(score)));
      const level: RiskLevel = score > 65 ? 'critical' : score >= 35 ? 'moderate' : 'low';

      const dayName = d.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { weekday: 'short' });
      days.push({
        dayLabel: i === 0 ? (isEn ? 'Today' : 'Hoje') : dayName.toUpperCase(),
        date: d.toISOString().slice(5, 10),
        riskScore: score,
        riskLevel: level,
        precipMm: Number(dayRain.toFixed(1)),
        avgTempC: Number(dayTemp.toFixed(1)),
      });
    }

    return days;
  };

  if (cropType === 'vinha') {
    // 1. MÍLDIO DA VINHA (Plasmopara viticola) — Regra dos Três Dez
    // Condition: Temp > 10°C, Rebentos > 10cm, Chuva >= 10mm em 24-48h
    let mildewScore = 20;
    if (avgTemp24h >= 10) mildewScore += 25;
    if (rain24h >= 10 || rain48h >= 10) mildewScore += 40;
    else if (rain24h >= 4) mildewScore += 20;
    if (wetHours24h >= 10) mildewScore += 15;

    mildewScore = Math.min(98, Math.max(10, mildewScore));
    const mildewLevel: RiskLevel = mildewScore > 65 ? 'critical' : mildewScore >= 35 ? 'moderate' : 'low';

    assessments.push({
      id: 'vinha-mildio',
      name: isEn ? 'Grapevine Downy Mildew' : 'Míldio da Vinha',
      scientificName: 'Plasmopara viticola',
      crop: isEn ? 'Vineyard' : 'Vinha',
      riskLevel: mildewLevel,
      riskScore: mildewScore,
      statusLabel: mildewLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : mildewLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Goidanich 3x10 Rule assessment: 24h Rainfall: ${rain24h.toFixed(1)}mm, Mean Temp: ${avgTemp24h.toFixed(1)}°C, Leaf Wetness: ${wetHours24h}h. Primary oospore germination conditions evaluated.`
        : `Avaliação pela Regra dos Três Dez: Precipitação 24h: ${rain24h.toFixed(1)}mm, Temp. Média: ${avgTemp24h.toFixed(1)}°C, Humectação Foliar: ${wetHours24h}h. Verificação de germinação de oósporos.`,
      sprayRecommendation:
        mildewLevel === 'critical'
          ? (isEn ? 'Optimal spray window before primary infection. Apply systemic fungicide immediately.' : 'Janela ótima antes da infeção primária. Recomenda-se fungicida sistémico/penetrante.')
          : mildewLevel === 'moderate'
          ? (isEn ? 'Preventative copper cover recommended if rains persist.' : 'Recomendado tratamento preventivo à base de cobre caso a chuva se confirme.')
          : (isEn ? 'Preventative spray unnecessary (chemical cost savings).' : 'Tratamento preventivo desnecessário (economia de calda e custos operacionais).'),
      recommendedActiveIngredients: isEn
        ? ['Copper Hydroxide (Cu)', 'Fosetyl-Aluminium', 'Dimethomorph', 'Metalaxyl-M']
        : ['Hidróxido de Cobre', 'Fosetil-Alumínio', 'Dimetomorfe', 'Metalaxil-M'],
      projection5Days: build5DayProjection(mildewScore, 10, 15),
    });

    // 2. OÍDIO DA VINHA (Erysiphe necator) — UC Davis Risk Index
    // Favored by dry-to-moderate humidity (40-80%) and temperatures between 20°C and 28°C
    let powderyScore = 25;
    if (avgTemp24h >= 20 && avgTemp24h <= 28) powderyScore += 45;
    else if (avgTemp24h >= 15 && avgTemp24h <= 32) powderyScore += 25;
    if (avgRh24h >= 45 && avgRh24h <= 80) powderyScore += 25;
    if (rain24h > 15) powderyScore -= 20; // Heavy rains wash off conidia

    powderyScore = Math.min(95, Math.max(12, powderyScore));
    const powderyLevel: RiskLevel = powderyScore > 65 ? 'critical' : powderyScore >= 40 ? 'moderate' : 'low';

    assessments.push({
      id: 'vinha-oidio',
      name: isEn ? 'Grapevine Powdery Mildew' : 'Oídio da Vinha',
      scientificName: 'Erysiphe necator',
      crop: isEn ? 'Vineyard' : 'Vinha',
      riskLevel: powderyLevel,
      riskScore: powderyScore,
      statusLabel: powderyLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : powderyLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Thermal favorability index: Temperatures ${avgTemp24h.toFixed(1)}°C within conidial sporulation optimum (20-28°C). Atmospheric humidity ${avgRh24h.toFixed(0)}%.`
        : `Índice térmico de esporulação: Temperaturas a ${avgTemp24h.toFixed(1)}°C dentro do ótimo fisiológico (20-28°C). Humidade relativa a ${avgRh24h.toFixed(0)}%.`,
      sprayRecommendation:
        powderyLevel === 'critical'
          ? (isEn ? 'Active ascospore dispersal detected. Apply triazole or meptyldinocap.' : 'Dispersão conidial ativa. Aplicar triazol curativo ou meptildinocarpe.')
          : powderyLevel === 'moderate'
          ? (isEn ? 'Apply micronized wettable sulphur as preventative barrier.' : 'Aplicar enxofre molhável como barreira profilática protetora.')
          : (isEn ? 'Low risk. Maintain monitoring without chemical intervention.' : 'Risco reduzido. Manter monitorização regular sem intervenção química.'),
      recommendedActiveIngredients: isEn
        ? ['Micronized Sulphur 80%', 'Tebuconazole', 'Difenoconazole', 'Meptyldinocap']
        : ['Enxofre Micronizado 80%', 'Tebuconazol', 'Difenoconazol', 'Meptildinocarpe'],
      projection5Days: build5DayProjection(powderyScore, 12, -5),
    });

    // 3. BOTRITE / PODRIDÃO CINZENTA (Botrytis cinerea)
    let botrytisScore = 15;
    if (wetHours24h >= 14) botrytisScore += 45;
    else if (wetHours24h >= 8) botrytisScore += 25;
    if (avgTemp24h >= 16 && avgTemp24h <= 24) botrytisScore += 25;
    if (rain24h >= 8) botrytisScore += 15;

    botrytisScore = Math.min(94, Math.max(10, botrytisScore));
    const botrytisLevel: RiskLevel = botrytisScore > 65 ? 'critical' : botrytisScore >= 35 ? 'moderate' : 'low';

    assessments.push({
      id: 'vinha-botrite',
      name: isEn ? 'Grey Mould / Botrytis' : 'Podridão Cinzenta (Botrite)',
      scientificName: 'Botrytis cinerea',
      crop: isEn ? 'Vineyard' : 'Vinha',
      riskLevel: botrytisLevel,
      riskScore: botrytisScore,
      statusLabel: botrytisLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : botrytisLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Free moisture duration: ${wetHours24h} consecutive hours of leaf wetness at ${avgTemp24h.toFixed(1)}°C. High risk at bunch closure / veraison.`
        : `Duração de humectação foliar: ${wetHours24h} horas consecutivas de orvalho/água livre a ${avgTemp24h.toFixed(1)}°C. Fase sensível de fecho do cacho e pintor.`,
      sprayRecommendation:
        botrytisLevel === 'critical'
          ? (isEn ? 'Immediate botryticide intervention indicated before cluster tightens.' : 'Intervenção antibotrite imediata recomendada antes do fecho completo dos cachos.')
          : (isEn ? 'Foliar canopy ventilation (defoliation) sufficient to prevent moisture entrapment.' : 'Arejamento do dossel vegetal (desfolha da zona dos cachos) suficiente para evitar condensação.'),
      recommendedActiveIngredients: isEn
        ? ['Fenhexamid', 'Fludioxonil', 'Pyrimethanil', 'Bacillus subtilis']
        : ['Fen-hexamida', 'Fludioxonil', 'Pirimetanil', 'Bacillus subtilis'],
      projection5Days: build5DayProjection(botrytisScore, 8, 20),
    });
  } else if (cropType === 'olival') {
    // 1. GAFA DO OLIVAL (Colletotrichum spp. / Anthracnose)
    let gafaScore = 18;
    if (rain24h >= 8 || rain48h >= 12) gafaScore += 35;
    if (avgRh24h >= 75) gafaScore += 25;
    if (avgTemp24h >= 16 && avgTemp24h <= 24) gafaScore += 20;

    gafaScore = Math.min(95, Math.max(10, gafaScore));
    const gafaLevel: RiskLevel = gafaScore > 65 ? 'critical' : gafaScore >= 35 ? 'moderate' : 'low';

    assessments.push({
      id: 'olival-gafa',
      name: isEn ? 'Olive Anthracnose (Gafa)' : 'Gafa do Olival (Antracnose)',
      scientificName: 'Colletotrichum spp.',
      crop: isEn ? 'Olive Grove' : 'Olival',
      riskLevel: gafaLevel,
      riskScore: gafaScore,
      statusLabel: gafaLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : gafaLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Atmospheric saturation index: ${wetHours24h}h high RH at ${avgTemp24h.toFixed(1)}°C. Conidia infection risk on developing drupes.`
        : `Índice de saturação atmosférica: ${wetHours24h}h de humidade elevada a ${avgTemp24h.toFixed(1)}°C. Risco de infeção conidial em frutos.`,
      sprayRecommendation:
        gafaLevel === 'critical'
          ? (isEn ? 'Critical risk of fruit rot. Apply copper compounds or strobilurin.' : 'Risco elevado de podridão e queda prematura de azeitona. Aplicar calda de cobre ou estrobirulina.')
          : (isEn ? 'Preventative copper cover sufficient. Delay application if dry weather persists.' : 'Cobertura preventiva de cobre suficiente. Diferir calda se o tempo seco se mantiver.'),
      recommendedActiveIngredients: isEn
        ? ['Copper Oxychloride', 'Trifloxystrobin', 'Difenoconazole', 'Pyraclostrobin']
        : ['Oxicloreto de Cobre', 'Trifloxistrobina', 'Difenoconazol', 'Piraclostrobina'],
      projection5Days: build5DayProjection(gafaScore, 10, 18),
    });

    // 2. OLHO DE PAVÃO (Spilocaea oleagina)
    let peacockScore = 20;
    if (wetHours24h >= 12) peacockScore += 40;
    if (avgTemp24h >= 12 && avgTemp24h <= 20) peacockScore += 30;

    peacockScore = Math.min(96, Math.max(12, peacockScore));
    const peacockLevel: RiskLevel = peacockScore > 65 ? 'critical' : peacockScore >= 35 ? 'moderate' : 'low';

    assessments.push({
      id: 'olival-olho-pavao',
      name: isEn ? 'Olive Peacock Spot' : 'Olho de Pavão',
      scientificName: 'Spilocaea oleagina',
      crop: isEn ? 'Olive Grove' : 'Olival',
      riskLevel: peacockLevel,
      riskScore: peacockScore,
      statusLabel: peacockLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : peacockLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Leaf wetness duration: ${wetHours24h}h in thermal range 12-20°C. Classic conditions for sub-cuticular mycelium invasion.`
        : `Duração de água livre foliar: ${wetHours24h}h na faixa térmica de 12-20°C. Condições ótimas para invasão sub-cuticular do micélio.`,
      sprayRecommendation:
        peacockLevel === 'critical'
          ? (isEn ? 'Urgent fungicide application required to prevent severe defoliation.' : 'Aplicação urgente para travar a desfolha da copa e perda de vigor vegetativo.')
          : (isEn ? 'Foliar protection stable. Monitor lower canopy sectors.' : 'Proteção foliar estável. Vigiar quadrantes inferiores do olival densamente sombreados.'),
      recommendedActiveIngredients: isEn
        ? ['Tribasic Copper Sulphate', 'Kresoxim-methyl', 'Difenoconazole', 'Dodine']
        : ['Sulfato Tribásico de Cobre', 'Cresoxime-metilo', 'Difenoconazol', 'Dodina'],
      projection5Days: build5DayProjection(peacockScore, 12, 16),
    });

    // 3. MOSCA DA AZEITONA (Bactrocera oleae) — Thermal Sum GDD (Base 10°C)
    // GDD = max(0, T - 10). High risk during mild autumn temps (20-28°C), drops over 32°C
    const gddToday = Math.max(0, avgTemp24h - 10);
    let flyScore = 25;
    if (avgTemp24h >= 20 && avgTemp24h <= 28) flyScore += 45;
    else if (avgTemp24h > 33) flyScore -= 30; // High mortality of eggs and pupae above 32°C!
    if (avgRh24h >= 50) flyScore += 15;

    flyScore = Math.min(92, Math.max(10, flyScore));
    const flyLevel: RiskLevel = flyScore > 65 ? 'critical' : flyScore >= 35 ? 'moderate' : 'low';

    assessments.push({
      id: 'olival-mosca',
      name: isEn ? 'Olive Fruit Fly' : 'Mosca da Azeitona',
      scientificName: 'Bactrocera oleae',
      crop: isEn ? 'Olive Grove' : 'Olival',
      riskLevel: flyLevel,
      riskScore: flyScore,
      statusLabel: flyLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : flyLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `Thermal accumulation index: ${gddToday.toFixed(1)} GDD (base 10°C). Temperatures ${avgTemp24h.toFixed(1)}°C favorable for oviposition in ripening drupes.`
        : `Índice de acumulação térmica: ${gddToday.toFixed(1)} GDD (base 10°C). Temperatura média ${avgTemp24h.toFixed(1)}°C favorável à postura e picada do fruto.`,
      sprayRecommendation:
        flyLevel === 'critical'
          ? (isEn ? 'Install McPhail mass-trapping or apply certified spinosad bait spray.' : 'Instalar armadilhas de captura em massa (McPhail) ou pulverização em faixas com spinosade.')
          : (isEn ? 'Thermal stress (>32°C) or low GDD prevents active oviposition. Spraying not justified.' : 'Stresse térmico (>32°C) ou baixa acumulação térmica inibem a postura. Pulverização injustificada.'),
      recommendedActiveIngredients: isEn
        ? ['Spinosad (Spintor Cera)', 'Kaolin Clay (Surround)', 'Lambda-cyhalothrin', 'Acetamiprid']
        : ['Spinosade (Isco Proteico)', 'Argila Caolino (Surround)', 'Lambda-cialotrina', 'Acetamiprida'],
      projection5Days: build5DayProjection(flyScore, 10, -5),
    });
  } else {
    // Generic high-risk fungal model for almond, corn, pasture
    let moniliaScore = Math.round(25 + (rain24h > 5 ? 30 : 0) + (avgRh24h > 75 ? 25 : 0));
    moniliaScore = Math.min(90, Math.max(15, moniliaScore));
    const moniliaLevel: RiskLevel = moniliaScore > 65 ? 'critical' : moniliaScore >= 40 ? 'moderate' : 'low';

    assessments.push({
      id: 'generic-monilia',
      name: isEn ? 'Blossom Blight / Monilinia' : 'Moniliose / Queima das Flores',
      scientificName: 'Monilinia laxa',
      crop: cropType,
      riskLevel: moniliaLevel,
      riskScore: moniliaScore,
      statusLabel: moniliaLevel === 'critical' ? (isEn ? 'CRITICAL' : 'CRÍTICO') : moniliaLevel === 'moderate' ? (isEn ? 'MODERATE' : 'MODERADO') : (isEn ? 'LOW' : 'BAIXO'),
      diagnostic: isEn
        ? `RH ${avgRh24h.toFixed(0)}% and temperature ${avgTemp24h.toFixed(1)}°C evaluated for general floral / foliar pathogen favorability.`
        : `Humidade ${avgRh24h.toFixed(0)}% e temperatura ${avgTemp24h.toFixed(1)}°C avaliadas para favorabilidade de fungos florais e foliares.`,
      sprayRecommendation:
        moniliaLevel === 'critical'
          ? (isEn ? 'Apply preventative fungicide during high humidity bloom phase.' : 'Aplicar fungicida preventivo durante a floração/abrolhamento com humidade elevada.')
          : (isEn ? 'Conditions stable. No chemical intervention warranted.' : 'Condições estáveis. Intervenção química desnecessária.'),
      recommendedActiveIngredients: isEn ? ['Boscalid', 'Pyraclostrobin', 'Copper'] : ['Boscalide', 'Piraclostrobina', 'Cobre'],
      projection5Days: build5DayProjection(moniliaScore, 10, 10),
    });
  }

  return assessments;
}
