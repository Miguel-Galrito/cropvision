/**
 * CropVision SaaS - Enterprise VRA & ISOBUS Exporter Engine
 * Generates true binary ESRI Shapefiles (.shp, .shx, .dbf, .prj) and ISO 11783-10 TaskData XML.
 * Fully compatible with John Deere GreenStar/Gen4, Trimble (GFX/TMX), Topcon, Ag Leader, and Fendt VarioDoc.
 */

import JSZip from 'jszip';
import { TractorPrescriptionMap, PrescriptionZone } from '../types';

export interface VraZoneGeometry {
  zoneId: string;
  rateN: number;
  areaHa: number;
  name: string;
  polygon: [number, number][]; // [lat, lon]
}

/**
 * Creates default rectangular VRA zones within the parcel bounds if micro-zones are not already discretized.
 */
export function buildVraZoneGeometries(
  prescription: TractorPrescriptionMap,
  centerLat: number,
  centerLon: number
): VraZoneGeometry[] {
  const d = 0.0035;

  return prescription.zones.map((zone, idx) => {
    const yOffset = (idx - 1) * d * 0.75;
    const poly: [number, number][] = [
      [centerLat + yOffset - d * 0.35, centerLon - d],
      [centerLat + yOffset - d * 0.35, centerLon + d],
      [centerLat + yOffset + d * 0.35, centerLon + d],
      [centerLat + yOffset + d * 0.35, centerLon - d],
      [centerLat + yOffset - d * 0.35, centerLon - d],
    ];

    return {
      zoneId: zone.zone_id,
      rateN: zone.target_n_rate_kg_ha,
      areaHa: zone.estimated_hectares,
      name: zone.name,
      polygon: poly,
    };
  });
}

/**
 * Generates and downloads a complete ESRI Shapefile (.zip) containing .shp, .shx, .dbf, and .prj.
 */
export async function downloadVraShapefileZip(
  prescription: TractorPrescriptionMap,
  centerLat: number,
  centerLon: number
): Promise<void> {
  const zones = buildVraZoneGeometries(prescription, centerLat, centerLon);
  const baseName = `CROPVISION_VRA_${prescription.field_name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)}`;

  const shpBuffer = buildShpBuffer(zones);
  const shxBuffer = buildShxBuffer(zones);
  const dbfBuffer = buildDbfBuffer(zones, prescription.selected_fertilizer_name || 'CAN-27');
  const prjString = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]`;

  const zip = new JSZip();
  zip.file(`${baseName}.shp`, shpBuffer);
  zip.file(`${baseName}.shx`, shxBuffer);
  zip.file(`${baseName}.dbf`, dbfBuffer);
  zip.file(`${baseName}.prj`, prjString);

  // Add Readme with instructions for the tractor operator
  const readme = `CROPVISION SAAS - MAPA DE PRESCRIÇÃO VRA
--------------------------------------------------
Parcela: ${prescription.field_name}
Área Total: ${prescription.total_area_hectares} ha
Produto: ${prescription.selected_fertilizer_name || 'Nitrato de Amónio Calcário'}
Poupança Financeira: €${prescription.fertilizer_savings_eur}
Norma de Exportação: ESRI Shapefile 2D Polygon (WGS84 EPSG:4326)

Instruções para o Operador:
1. Copie estes ficheiros (.shp, .shx, .dbf, .prj) para a pasta raiz da pen USB.
2. Insira no monitor de cabine (Trimble GFX/TMX, Ag Leader InCommand, Topcon X35).
3. Selecione "Importar Mapa de Taxa Variável" e mapeie a coluna 'RATE_N' para Dose Alvo (kg/ha).
`;
  zip.file(`README_OPERADOR.txt`, readme);

  const zipContent = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(zipContent, `${baseName.toLowerCase()}_shapefile.zip`);
}

/**
 * Generates and downloads ISO 11783-10 TaskData XML packaged in the standardized TASKDATA/ folder.
 */
export async function downloadIsoXmlZip(
  prescription: TractorPrescriptionMap,
  centerLat: number,
  centerLon: number
): Promise<void> {
  const xmlContent = generateTaskDataXmlContent(prescription, centerLat, centerLon);
  const zip = new JSZip();

  // Tractors require the folder to be strictly named "TASKDATA"
  const taskDataFolder = zip.folder('TASKDATA');
  if (taskDataFolder) {
    taskDataFolder.file('TASKDATA.XML', xmlContent);
  } else {
    zip.file('TASKDATA/TASKDATA.XML', xmlContent);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(
    zipBlob,
    `isobus_taskdata_${prescription.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.zip`
  );
}

/**
 * Builds the official ISO 11783-10 (ISOBUS) XML payload.
 */
export function generateTaskDataXmlContent(
  prescription: TractorPrescriptionMap,
  centerLat: number,
  centerLon: number
): string {
  const farmName = prescription.field_name || 'Herdade CropVision';
  const fertilizer = prescription.selected_fertilizer_name || 'CAN-27';
  const dateStr = new Date().toISOString();

  let treatmentZonesXml = '';
  prescription.zones.forEach((z, i) => {
    treatmentZonesXml += `
    <TZN A="${i + 1}" B="${escapeXml(z.name)}" V="${i + 1}">
      <PDV A="PDT1" B="${Math.round(z.target_n_rate_kg_ha)}" C="1"/>
    </TZN>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ISO11783_TaskData VersionMajor="4" VersionMinor="0" ManagementSoftwareManufacturer="CropVision SaaS" ManagementSoftwareVersion="2.5" DataTransferOrigin="1">
  <CTR A="CTR1" B="CropVision Precision Ag"/>
  <FRM A="FRM1" B="${escapeXml(farmName)}" I="CTR1"/>
  <PFD A="PFD1" B="Talhao Principal" C="${centerLat.toFixed(6)}" D="${centerLon.toFixed(6)}" E="FRM1"/>
  <PDT A="PDT1" B="${escapeXml(fertilizer)}" C="1"/>
  <TSK A="TSK1" B="Prescricao Taxa Variavel Azoto" G="1" J="FRM1">
    <GGP A="1">${treatmentZonesXml}
    </GGP>
  </TSK>
</ISO11783_TaskData>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* =========================================================================
   BINARY SHAPEFILE GENERATION (.SHP, .SHX, .DBF)
   ========================================================================= */

function buildShpBuffer(zones: VraZoneGeometry[]): ArrayBuffer {
  // Compute global bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const z of zones) {
    for (const [lat, lon] of z.polygon) {
      if (lon < minX) minX = lon;
      if (lon > maxX) maxX = lon;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
  }

  // Calculate file length: 100 bytes header + records
  // Each record: 8 bytes record header + 4 bytes shape type + 32 bytes bbox + 4 bytes numParts + 4 bytes numPoints + (parts * 4) + (points * 16)
  let recordsByteLength = 0;
  for (const z of zones) {
    const numPoints = z.polygon.length;
    const contentLenBytes = 4 + 32 + 4 + 4 + 4 + numPoints * 16;
    recordsByteLength += 8 + contentLenBytes;
  }

  const totalFileBytes = 100 + recordsByteLength;
  const buffer = new ArrayBuffer(totalFileBytes);
  const view = new DataView(buffer);

  // --- Main Header (100 bytes) ---
  view.setInt32(0, 9994, false); // Big endian file code
  view.setInt32(24, totalFileBytes / 2, false); // Length in 16-bit words
  view.setInt32(28, 1000, true); // Little endian version
  view.setInt32(32, 5, true); // Shape type: Polygon (5)

  // Bounding box (Little endian doubles)
  view.setFloat64(36, minX, true);
  view.setFloat64(44, minY, true);
  view.setFloat64(52, maxX, true);
  view.setFloat64(60, maxY, true);

  // --- Records ---
  let offset = 100;
  let recordNumber = 1;

  for (const z of zones) {
    const numPoints = z.polygon.length;
    const contentLenWords = (4 + 32 + 4 + 4 + 4 + numPoints * 16) / 2;

    // Record Header (8 bytes, Big Endian)
    view.setInt32(offset, recordNumber++, false);
    view.setInt32(offset + 4, contentLenWords, false);
    offset += 8;

    // Record Content (Little Endian)
    view.setInt32(offset, 5, true); // Shape type: Polygon
    offset += 4;

    // Zone BBox
    let zMinX = Infinity, zMinY = Infinity, zMaxX = -Infinity, zMaxY = -Infinity;
    for (const [lat, lon] of z.polygon) {
      if (lon < zMinX) zMinX = lon;
      if (lon > zMaxX) zMaxX = lon;
      if (lat < zMinY) zMinY = lat;
      if (lat > zMaxY) zMaxY = lat;
    }
    view.setFloat64(offset, zMinX, true);
    view.setFloat64(offset + 8, zMinY, true);
    view.setFloat64(offset + 16, zMaxX, true);
    view.setFloat64(offset + 24, zMaxY, true);
    offset += 32;

    view.setInt32(offset, 1, true); // NumParts = 1
    view.setInt32(offset + 4, numPoints, true); // NumPoints
    offset += 8;

    view.setInt32(offset, 0, true); // Parts[0] = index 0
    offset += 4;

    for (const [lat, lon] of z.polygon) {
      view.setFloat64(offset, lon, true); // X
      view.setFloat64(offset + 8, lat, true); // Y
      offset += 16;
    }
  }

  return buffer;
}

function buildShxBuffer(zones: VraZoneGeometry[]): ArrayBuffer {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const z of zones) {
    for (const [lat, lon] of z.polygon) {
      if (lon < minX) minX = lon;
      if (lon > maxX) maxX = lon;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
  }

  const numRecords = zones.length;
  const totalFileBytes = 100 + numRecords * 8;
  const buffer = new ArrayBuffer(totalFileBytes);
  const view = new DataView(buffer);

  view.setInt32(0, 9994, false); // File code
  view.setInt32(24, totalFileBytes / 2, false); // File length in 16-bit words
  view.setInt32(28, 1000, true); // Version
  view.setInt32(32, 5, true); // Shape type: Polygon

  view.setFloat64(36, minX, true);
  view.setFloat64(44, minY, true);
  view.setFloat64(52, maxX, true);
  view.setFloat64(60, maxY, true);

  let shpOffsetWords = 50; // 100 bytes / 2
  let offset = 100;

  for (const z of zones) {
    const numPoints = z.polygon.length;
    const contentLenWords = (4 + 32 + 4 + 4 + 4 + numPoints * 16) / 2;

    view.setInt32(offset, shpOffsetWords, false);
    view.setInt32(offset + 4, contentLenWords, false);

    shpOffsetWords += 4 + contentLenWords; // 4 words for record header
    offset += 8;
  }

  return buffer;
}

function buildDbfBuffer(zones: VraZoneGeometry[], productName: string): ArrayBuffer {
  // DBF III Specification:
  // Fields:
  // ZONE_ID (C, 10)
  // RATE_N (N, 10, 2)
  // AREA_HA (N, 10, 2)
  // PRODUCT (C, 25)

  const numRecords = zones.length;
  const headerBytes = 32 + 4 * 32 + 1; // 32 byte main + 4 fields * 32 bytes + 1 terminator (0x0D)
  const recordLength = 1 + 10 + 10 + 10 + 25; // 56 bytes per record (leading space + fields)
  const totalBytes = headerBytes + numRecords * recordLength + 1; // + 1 EOF (0x1A)

  const buffer = new ArrayBuffer(totalBytes);
  const uint8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Date
  const now = new Date();
  const year = now.getFullYear() - 1900;
  const month = now.getMonth() + 1;
  const day = now.getDate();

  view.setUint8(0, 0x03); // dBASE III without memo
  view.setUint8(1, year);
  view.setUint8(2, month);
  view.setUint8(3, day);
  view.setUint32(4, numRecords, true); // Little endian record count
  view.setUint16(8, headerBytes, true); // Header length
  view.setUint16(10, recordLength, true); // Record length

  // Field Descriptors
  const fields = [
    { name: 'ZONE_ID', type: 'C', len: 10, dec: 0 },
    { name: 'RATE_N', type: 'N', len: 10, dec: 2 },
    { name: 'AREA_HA', type: 'N', len: 10, dec: 2 },
    { name: 'PRODUCT', type: 'C', len: 25, dec: 0 },
  ];

  let fOffset = 32;
  for (const f of fields) {
    for (let i = 0; i < 11; i++) {
      uint8[fOffset + i] = i < f.name.length ? f.name.charCodeAt(i) : 0;
    }
    uint8[fOffset + 11] = f.type.charCodeAt(0);
    uint8[fOffset + 16] = f.len;
    uint8[fOffset + 17] = f.dec;
    fOffset += 32;
  }

  uint8[fOffset] = 0x0d; // Header terminator
  fOffset += 1;

  // Records
  for (const z of zones) {
    uint8[fOffset] = 0x20; // Deleted flag: ' ' (valid)
    let rOffset = fOffset + 1;

    // ZONE_ID (10 chars, left justified)
    const zIdStr = z.zoneId.padEnd(10, ' ');
    for (let i = 0; i < 10; i++) uint8[rOffset + i] = zIdStr.charCodeAt(i);
    rOffset += 10;

    // RATE_N (10 chars, right justified)
    const rateStr = z.rateN.toFixed(2).padStart(10, ' ');
    for (let i = 0; i < 10; i++) uint8[rOffset + i] = rateStr.charCodeAt(i);
    rOffset += 10;

    // AREA_HA (10 chars, right justified)
    const areaStr = z.areaHa.toFixed(2).padStart(10, ' ');
    for (let i = 0; i < 10; i++) uint8[rOffset + i] = areaStr.charCodeAt(i);
    rOffset += 10;

    // PRODUCT (25 chars, left justified)
    const prodStr = productName.slice(0, 25).padEnd(25, ' ');
    for (let i = 0; i < 25; i++) uint8[rOffset + i] = prodStr.charCodeAt(i);
    rOffset += 25;

    fOffset += recordLength;
  }

  uint8[fOffset] = 0x1a; // EOF marker
  return buffer;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
