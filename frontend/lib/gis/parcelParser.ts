/**
 * CropVision SaaS - Universal Parcel Importer & Parser
 * Parses Drag-and-Drop Shapefile (.zip), GeoJSON (.geojson, .json), and KML (.kml) files.
 * Transforms geometries to WGS84 Leaflet polygon arrays and computes area in Hectares.
 */

import { calculatePolygonAreaHectares, getPolygonCenter } from './area';

export interface ParsedParcelResult {
  name: string;
  polygon: [number, number][]; // [latitude, longitude]
  center: [number, number]; // [lat, lon]
  areaHectares: number;
  properties?: Record<string, any>;
}

/**
 * Universal entrypoint for parsing agricultural boundary files.
 */
export async function parseParcelFile(file: File): Promise<ParsedParcelResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.zip')) {
    return parseShapefileZip(file);
  } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
    return parseGeoJsonFile(file);
  } else if (fileName.endsWith('.kml')) {
    return parseKmlFile(file);
  } else {
    throw new Error(
      `Formato de ficheiro não suportado. Por favor utilize .zip (Shapefile), .geojson ou .kml`
    );
  }
}

/**
 * Parses Shapefile contained within a .zip file using shpjs.
 */
async function parseShapefileZip(file: File): Promise<ParsedParcelResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import to avoid SSR issues
    // @ts-ignore
    const shpModule = await import('shpjs');
    const shp = shpModule.default || shpModule;
    const geojson: any = await shp(arrayBuffer);

    const feature = extractFirstPolygonFeature(geojson);
    if (!feature) {
      throw new Error('Nenhum polígono válido encontrado no Shapefile .zip.');
    }

    const polygon = extractCoordinatesFromGeometry(feature.geometry);
    const areaHectares = calculatePolygonAreaHectares(polygon);
    const center = getPolygonCenter(polygon);

    const parcelName =
      feature.properties?.NAME ||
      feature.properties?.name ||
      feature.properties?.Talhao ||
      feature.properties?.PARCELA ||
      file.name.replace(/\.zip$/i, '');

    return {
      name: String(parcelName),
      polygon,
      center,
      areaHectares,
      properties: feature.properties || {},
    };
  } catch (err: any) {
    console.error('Shapefile zip parse error:', err);
    throw new Error(`Falha ao processar Shapefile (.zip): ${err.message || 'Ficheiro corrompido ou incompleto'}`);
  }
}

/**
 * Parses a standard GeoJSON file.
 */
async function parseGeoJsonFile(file: File): Promise<ParsedParcelResult> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);

    const feature = extractFirstPolygonFeature(json);
    if (!feature) {
      throw new Error('Nenhum polígono válido encontrado no ficheiro GeoJSON.');
    }

    const polygon = extractCoordinatesFromGeometry(feature.geometry);
    const areaHectares = calculatePolygonAreaHectares(polygon);
    const center = getPolygonCenter(polygon);

    const parcelName =
      feature.properties?.NAME ||
      feature.properties?.name ||
      feature.properties?.talhao ||
      feature.properties?.parcela ||
      file.name.replace(/\.(geojson|json)$/i, '');

    return {
      name: String(parcelName),
      polygon,
      center,
      areaHectares,
      properties: feature.properties || {},
    };
  } catch (err: any) {
    console.error('GeoJSON parse error:', err);
    throw new Error(`Falha ao ler GeoJSON: ${err.message || 'Estrutura JSON inválida'}`);
  }
}

/**
 * Parses Google Earth / GIS .kml files via browser DOMParser.
 */
async function parseKmlFile(file: File): Promise<ParsedParcelResult> {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      throw new Error('Ficheiro KML com XML malformado.');
    }

    // Try finding <Polygon> or <coordinates> inside Placemark
    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    let targetCoordsText = '';
    let parcelName = file.name.replace(/\.kml$/i, '');

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const nameNode = pm.getElementsByTagName('name')[0];
      if (nameNode && nameNode.textContent) {
        parcelName = nameNode.textContent.trim();
      }

      const coordsNodes = pm.getElementsByTagName('coordinates');
      if (coordsNodes.length > 0 && coordsNodes[0].textContent) {
        targetCoordsText = coordsNodes[0].textContent.trim();
        break;
      }
    }

    // Fallback: look anywhere in the document for <coordinates>
    if (!targetCoordsText) {
      const allCoords = xmlDoc.getElementsByTagName('coordinates');
      if (allCoords.length > 0 && allCoords[0].textContent) {
        targetCoordsText = allCoords[0].textContent.trim();
      }
    }

    if (!targetCoordsText) {
      throw new Error('Nenhuma coordenada de polígono encontrada no KML.');
    }

    // Format: lon,lat,alt lon,lat,alt ...
    const rawTuples = targetCoordsText.split(/\s+/);
    const polygon: [number, number][] = [];

    for (const tuple of rawTuples) {
      const parts = tuple.split(',');
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          polygon.push([lat, lon]);
        }
      }
    }

    if (polygon.length < 3) {
      throw new Error('O polígono KML contém menos de 3 vértices válidos.');
    }

    const areaHectares = calculatePolygonAreaHectares(polygon);
    const center = getPolygonCenter(polygon);

    return {
      name: parcelName,
      polygon,
      center,
      areaHectares,
    };
  } catch (err: any) {
    console.error('KML parse error:', err);
    throw new Error(`Falha ao ler KML: ${err.message}`);
  }
}

/**
 * Extracts the first Polygon or MultiPolygon feature from GeoJSON data.
 */
function extractFirstPolygonFeature(geojson: any): any {
  if (!geojson) return null;

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    for (const f of geojson.features) {
      if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
        return f;
      }
    }
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    if (geojson.geometry.type === 'Polygon' || geojson.geometry.type === 'MultiPolygon') {
      return geojson;
    }
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    return { type: 'Feature', geometry: geojson, properties: {} };
  }

  return null;
}

/**
 * Converts GeoJSON geometry [longitude, latitude] coordinates to Leaflet [latitude, longitude].
 */
function extractCoordinatesFromGeometry(geometry: any): [number, number][] {
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0]; // exterior ring
    return ring.map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);
  } else if (geometry.type === 'MultiPolygon') {
    // Pick the largest polygon in the multipolygon
    const firstPoly = geometry.coordinates[0][0];
    return firstPoly.map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);
  }
  throw new Error('Tipo de geometria não suportado. Requer Polygon ou MultiPolygon.');
}
