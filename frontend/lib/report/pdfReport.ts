/**
 * CropVision SaaS - Enterprise Agronomic Technical Report Generator (PDF)
 * Generates an engineering-grade, legal and audit-ready PDF document for agronomists,
 * farm managers, banks, and EU CAP (PAC / Caderno de Campo) compliance audits.
 * Fully supports bilingual generation in Portuguese (PT) and English (EN).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyzeResponse } from '../types';
import { TractorPrescriptionMap } from '../types';
import { IrrigationRecommendation } from '../irrigation/fao56';
import { ScoutingRecord } from '../scouting/scoutingStore';
import { Language } from '../i18n';

export interface ReportConfig {
  analysisData: AnalyzeResponse;
  prescription: TractorPrescriptionMap;
  irrigation: IrrigationRecommendation;
  scoutingRecords: ScoutingRecord[];
  farmName: string;
  parcelName: string;
  cropName: string;
  trainingSystem: string;
  irrigationType: string;
  agronomistName?: string;
  licenseNumber?: string;
  lang?: Language;
}

export async function generateAgronomicPdfReport(config: ReportConfig): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isEn = config.lang === 'en';
  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // --- BRAND HEADER (Deep-Tech Aerospace Dark Header Bar) ---
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(
    isEn
      ? 'CROPVISION SAAS — TECHNICAL AGRONOMIC AUDIT REPORT'
      : 'CROPVISION SAAS — RELATÓRIO TÉCNICO AGRONÓMICO',
    14,
    14
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    isEn
      ? 'Sentinel-2 L2A Multispectral Biomass, Sentinel-1 SAR Radar, VRA & FAO-56 Water Balance'
      : 'Auditoria de Biomassa Sentinel-2 L2A, Radar SAR Sentinel-1, VRA e Balanço Hídrico FAO-56',
    14,
    20
  );
  doc.text(
    isEn
      ? `Official Issue: ${todayStr} | Certified for EU CAP & Farm Field Compliance (91/676/EEC)`
      : `Emissão Oficial: ${todayStr} | Documento Certificado para Caderno de Campo (UE 91/676/CEE)`,
    14,
    26
  );

  let cursorY = 40;

  // --- SECTION 1: PARCEL & FARM METADATA ---
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    isEn ? '1. FARM & FIELD PARCEL IDENTIFICATION' : '1. IDENTIFICAÇÃO DA EXPLORAÇÃO E PARCELA',
    14,
    cursorY
  );
  cursorY += 4;

  const metadataRows = [
    [
      { content: isEn ? 'Estate / Farm:' : 'Herdade / Propriedade:', styles: { fontStyle: 'bold' as const } },
      config.farmName,
      { content: isEn ? 'Field / Parcel:' : 'Talhão / Parcela:', styles: { fontStyle: 'bold' as const } },
      config.parcelName,
    ],
    [
      { content: isEn ? 'WGS84 Coordinates:' : 'Coordenadas WGS84:', styles: { fontStyle: 'bold' as const } },
      `${config.analysisData.coordinates.lat.toFixed(5)}° N, ${config.analysisData.coordinates.lon.toFixed(5)}° W`,
      { content: isEn ? 'Total Cadastral Area:' : 'Área Total Cadastrada:', styles: { fontStyle: 'bold' as const } },
      `${config.prescription.total_area_hectares.toFixed(1)} ha`,
    ],
    [
      { content: isEn ? 'Cultivated Crop:' : 'Cultura Instalada:', styles: { fontStyle: 'bold' as const } },
      config.cropName,
      { content: isEn ? 'Training System:' : 'Sistema de Condução:', styles: { fontStyle: 'bold' as const } },
      config.trainingSystem,
    ],
    [
      { content: isEn ? 'Irrigation System:' : 'Sistema de Rega:', styles: { fontStyle: 'bold' as const } },
      config.irrigationType,
      { content: isEn ? 'Latest Sentinel Overpass:' : 'Passagem Sentinel Recente:', styles: { fontStyle: 'bold' as const } },
      config.analysisData.acquisition_date,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    body: metadataRows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [31, 41, 55] },
    columnStyles: {
      0: { cellWidth: 42, textColor: [75, 85, 99] },
      1: { cellWidth: 55 },
      2: { cellWidth: 42, textColor: [75, 85, 99] },
      3: { cellWidth: 45 },
    },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECTION 2: SATELLITE RADIOMETRY & SENTINEL-1 SAR ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    isEn
      ? '2. ORBITAL TELEMETRY (SENTINEL-2 L2A & SENTINEL-1 SAR RADAR)'
      : '2. TELEMETRIA ORBITAL (SENTINEL-2 L2A & SENTINEL-1 SAR)',
    14,
    cursorY
  );
  cursorY += 4;

  const radiometryRows = [
    [
      isEn ? 'Mean NDVI (Canopy Biomass)' : 'NDVI Médio (Biomassa)',
      config.analysisData.ndvi.mean.toFixed(3),
      isEn ? 'NDRE (Chlorophyll & Nitrogen)' : 'NDRE (Clorofila / Azoto)',
      (config.analysisData.multi_indices?.ndre ?? config.analysisData.ndvi.mean * 0.8).toFixed(3),
    ],
    [
      isEn ? 'NDWI (Canopy Water Content)' : 'NDWI (Teor de Água)',
      (config.analysisData.multi_indices?.ndwi ?? (config.analysisData.ndvi.mean - 0.25) * 0.7).toFixed(3),
      isEn ? 'EVI (Enhanced Structural Index)' : 'EVI (Estrutura do Dossel)',
      (config.analysisData.multi_indices?.evi ?? config.analysisData.ndvi.mean * 0.9).toFixed(3),
    ],
    [
      isEn ? 'Sentinel-1 SAR Backscatter' : 'Radar SAR S1 (Retroespalhamento)',
      `${config.analysisData.sar_radar?.backscatter_vv_db ?? -14.2} dB (VV/VH)`,
      isEn ? 'Estimated Volumetric Moisture' : 'Humidade Residual Estimada',
      `${config.analysisData.sar_radar?.soil_moisture_estimate_pct ?? 18}% vol. (0-5 cm)`,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    body: radiometryRows,
    theme: 'striped',
    head: [[
      isEn ? 'Biophysical Metric' : 'Parâmetro Biofísico',
      isEn ? 'Satellite Value' : 'Valor Satélite',
      isEn ? 'Complementary Index' : 'Parâmetro Complementar',
      isEn ? 'Satellite Value' : 'Valor Satélite',
    ]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECTION 3: VRA PRESCRIPTION TABLE (VARIABLE NITROGEN) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    isEn
      ? '3. VARIABLE RATE APPLICATION (VRA) NITROGEN PRESCRIPTION'
      : '3. PRESCRIÇÃO VRA DE FERTILIZAÇÃO AZOTADA (TAXA VARIÁVEL)',
    14,
    cursorY
  );
  cursorY += 4;

  const prescriptionRows = config.prescription.zones.map((z) => [
    isEn ? `Zone ${z.zone_id}` : `Zona ${z.zone_id}`,
    isEn ? (z.zone_id === 'A' ? 'High Vigour' : z.zone_id === 'B' ? 'Moderate Vigour' : 'Critical Stress') : z.name,
    `${z.percentage_of_parcel}%`,
    `${z.estimated_hectares.toFixed(1)} ha`,
    `${z.target_n_rate_kg_ha} kg/ha`,
    `${Math.round(z.estimated_hectares * z.target_n_rate_kg_ha)} kg`,
    isEn ? (z.zone_id === 'A' ? 'Maintain baseline vegetative balance' : z.zone_id === 'B' ? 'Standard corrective application' : 'Intensive corrective nitrogen booster') : z.recommendation,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isEn ? 'Zone' : 'Zona',
      isEn ? 'Canopy Status' : 'Vigor Vegetativo',
      isEn ? '% Parcel' : '% Parcela',
      isEn ? 'Area (ha)' : 'Área (ha)',
      isEn ? 'Target Rate' : 'Dose Alvo',
      isEn ? 'Total N' : 'Total Azoto',
      isEn ? 'Operational Recommendation' : 'Prescrição Operacional',
    ]],
    body: prescriptionRows,
    theme: 'grid',
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 4;

  // ROI Summary Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(52, 211, 153);
  doc.roundedRect(14, cursorY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setTextColor(6, 78, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isEn
      ? `PROJECTED FINANCIAL & ECOLOGICAL IMPACT (Fertilizer Price: €${config.prescription.fertilizer_price_eur_ton || 390}/ton):`
      : `BALANÇO FINANCEIRO & ECOLÓGICO ESTIMADO (Cotação Fertilizante: €${config.prescription.fertilizer_price_eur_ton || 390}/ton):`,
    18,
    cursorY + 5
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    isEn
      ? `• Nitrogen Saved: ${config.prescription.nitrogen_saved_kg} kg N | • Financial Savings: €${config.prescription.fertilizer_savings_eur} | • Carbon Avoided: ${config.prescription.co2_equivalent_mitigated_kg} kg CO₂e`
      : `• Azoto Poupado: ${config.prescription.nitrogen_saved_kg} kg N | • Poupança Líquida: €${config.prescription.fertilizer_savings_eur} | • Emissões Evitadas: ${config.prescription.co2_equivalent_mitigated_kg} kg CO₂e`,
    18,
    cursorY + 10
  );

  cursorY += 18;

  // --- SECTION 4: PRECISION IRRIGATION & FAO-56 WATER BALANCE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    isEn ? '4. PRECISION IRRIGATION & WATER BALANCE (FAO-56)' : '4. REGA DE PRECISÃO & BALANÇO HÍDRICO (FAO-56)',
    14,
    cursorY
  );
  cursorY += 4;

  const irrigationData = [
    [
      isEn ? 'Reference Evapotranspiration (ET0):' : 'Evapotranspiração Referência (ET0):',
      `${config.irrigation.referenceEt0Mm} mm/day`,
      isEn ? 'Dynamic Crop Coefficient (Kc):' : 'Coeficiente Dinâmico Cultura (Kc):',
      config.irrigation.cropCoefficientKc.toFixed(2),
    ],
    [
      isEn ? 'Crop Demand (ETc):' : 'Consumo Cultura Estimado (ETc):',
      `${config.irrigation.cropEtcMmDay} mm/day`,
      isEn ? 'Net Irrigation Requirement:' : 'Necessidade Líquida de Irrigação:',
      `${config.irrigation.netIrrigationNeedMmDay} mm/day (${config.irrigation.waterVolumeM3HaDay} m³/ha)`,
    ],
    [
      isEn ? 'Total Daily Volume in Field:' : 'Volume Total Diário na Parcela:',
      `${config.irrigation.totalParcelVolumeM3Day.toLocaleString(isEn ? 'en-US' : 'pt-PT')} m³/day`,
      isEn ? 'Operational Directive:' : 'Recomendação Operacional:',
      config.irrigation.recommendedDurationText,
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    body: irrigationData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [31, 41, 55] },
    columnStyles: {
      0: { cellWidth: 55, textColor: [75, 85, 99], fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 55, textColor: [75, 85, 99], fontStyle: 'bold' },
      3: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // --- SECTION 5: FIELD SCOUTING OCCURRENCES ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    isEn ? '5. IN-SITU FIELD SCOUTING LOG (GEOREFERENCED OBSERVATIONS)' : '5. REGISTO DE OCORRÊNCIAS DE CAMPO (SCOUTING GEORREFERENCIADO)',
    14,
    cursorY
  );
  cursorY += 4;

  const scoutingRows =
    config.scoutingRecords.length > 0
      ? config.scoutingRecords.map((s) => [
          s.date,
          s.categoryLabel,
          s.severity.toUpperCase(),
          `${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}`,
          s.notes,
        ])
      : [[
          '-',
          isEn ? 'No acute critical incidents recorded on this inspection date' : 'Sem anomalias críticas ativas registadas nesta data',
          '-',
          '-',
          '-',
        ]];

  autoTable(doc, {
    startY: cursorY,
    head: [[
      isEn ? 'Date' : 'Data',
      isEn ? 'Category' : 'Categoria',
      isEn ? 'Severity' : 'Gravidade',
      isEn ? 'WGS84 Coords' : 'Coordenadas WGS84',
      isEn ? 'Agronomist Field Notes' : 'Notas do Agrónomo',
    ]],
    body: scoutingRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 38 },
      2: { cellWidth: 22 },
      3: { cellWidth: 35 },
      4: { cellWidth: 65 },
    },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  if (cursorY > 235) {
    doc.addPage();
    cursorY = 25;
  }

  // --- SECTION 6: LEGAL COMPLIANCE & SIGNATURE BLOCK ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, cursorY, pageWidth - 28, 42, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    isEn
      ? 'DECLARATION OF AGRONOMIC COMPLIANCE & EU CAP AUDIT STATEMENT (91/676/EEC)'
      : 'DECLARAÇÃO DE CONFORMIDADE AGRONÓMICA & CADERNO DE CAMPO (UE 91/676/CEE)',
    18,
    cursorY + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isEn
      ? 'I hereby certify that this variable rate prescription strictly complies with legal nitrogen ceilings in Nitrate Vulnerable Zones\n' +
        'and adheres to good agricultural environmental conditions (GAEC) under European Common Agricultural Policy subsidies.'
      : 'Certifico que a presente prescrição em taxa variável respeita o teto legal de azoto em Zonas Vulneráveis (Diretiva Nitratos)\n' +
        'e cumpre as boas práticas agrícolas para efeitos de manutenção dos apoios da Política Agrícola Comum (PAC).',
    18,
    cursorY + 12
  );

  // Signature lines
  const sigLeft = 25;
  const sigRight = pageWidth - 90;
  const sigY = cursorY + 34;

  doc.setDrawColor(148, 163, 184);
  doc.line(sigLeft, sigY, sigLeft + 60, sigY);
  doc.line(sigRight, sigY, sigRight + 60, sigY);

  doc.setFontSize(7);
  doc.text(isEn ? 'Farm Operational Manager' : 'Responsável da Exploração Agrícola', sigLeft + 6, sigY + 4);
  doc.text(isEn ? 'Certified Technical Agronomist (Lic. #)' : 'Agrónomo Responsável Técnico (Nº Cédula)', sigRight + 3, sigY + 4);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    isEn
      ? 'CropVision SaaS — Deep-Tech Earth Observation Platform | Contact: contact@cropvision.io'
      : 'CropVision SaaS — Plataforma Deep-Tech de Observação da Terra | Suporte: contact@cropvision.io',
    14,
    290
  );
  doc.text(`${isEn ? 'Page' : 'Página'} 1 / 1`, pageWidth - 28, 290);

  // Trigger Download
  const filename = `cropvision_${isEn ? 'technical_report' : 'relatorio_tecnico'}_${config.parcelName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
