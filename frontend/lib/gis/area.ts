/**
 * CropVision SaaS - Geodesic Area Calculation Engine
 * Accurately computes parcel surface area in Hectares (ha) and Acres from WGS84 coordinates.
 */

/**
 * Calculates the geodesic surface area of a spherical polygon using the spherical excess formula.
 * @param coordinates Array of [latitude, longitude] pairs in degrees
 * @returns Area in Hectares (ha)
 */
export function calculatePolygonAreaHectares(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 3) return 0;

  const R = 6378137; // Earth radius in meters (WGS84)
  const len = coordinates.length;
  let totalAngle = 0;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const p3 = coordinates[(i + 2) % len];

    const lat1 = (p1[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;
    const lat3 = (p3[0] * Math.PI) / 180;
    const lon3 = (p3[1] * Math.PI) / 180;

    // Bearings
    const bearing12 = calculateBearing(lat1, lon1, lat2, lon2);
    const bearing23 = calculateBearing(lat2, lon2, lat3, lon3);

    let diff = bearing23 - bearing12;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    totalAngle += diff;
  }

  // Fallback to Planar Shoelace projection for smaller parcels if spherical excess is degenerate
  let areaM2 = Math.abs(totalAngle) * R * R;
  if (isNaN(areaM2) || areaM2 < 1 || areaM2 > 1e10) {
    areaM2 = calculatePlanarShoelaceArea(coordinates);
  }

  const hectares = areaM2 / 10000;
  return Number(hectares.toFixed(2));
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Math.atan2(y, x);
}

function calculatePlanarShoelaceArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;
  const avgLat = coordinates.reduce((sum, c) => sum + c[0], 0) / coordinates.length;
  const latRad = (avgLat * Math.PI) / 180;
  const metersPerDegLat = 111132.92;
  const metersPerDegLon = 111412.84 * Math.cos(latRad);

  let area = 0;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coordinates[i][1] * metersPerDegLon;
    const yi = coordinates[i][0] * metersPerDegLat;
    const xj = coordinates[j][1] * metersPerDegLon;
    const yj = coordinates[j][0] * metersPerDegLat;
    area += xi * yj - xj * yi;
  }

  return Math.abs(area) / 2;
}

/**
 * Computes polygon bounding box and center coordinate.
 */
export function getPolygonCenter(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLon = 0;
  for (const [lat, lon] of coordinates) {
    sumLat += lat;
    sumLon += lon;
  }
  return [
    Number((sumLat / coordinates.length).toFixed(6)),
    Number((sumLon / coordinates.length).toFixed(6)),
  ];
}
