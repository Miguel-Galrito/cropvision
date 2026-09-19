/**
 * CropVision SaaS - Official Copernicus Data Space Ecosystem (CDSE) Integration
 * Connects directly to the European Space Agency (ESA) Copernicus Data Space Ecosystem
 * via Keycloak OAuth2 authentication and OData / Process APIs.
 *
 * Documentation: https://dataspace.copernicus.eu/analyse/apis
 */

export interface CopernicusAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface CopernicusSentinelScene {
  id: string;
  name: string;
  acquisitionDate: string;
  cloudCoverPct: number;
  footprintGeoJson?: any;
  quicklookUrl?: string;
  downloadUrl?: string;
}

export interface CopernicusSpectralSample {
  B02: number; // Blue (490 nm)
  B03: number; // Green (560 nm)
  B04: number; // Red (665 nm)
  B05: number; // RedEdge-1 (705 nm)
  B08: number; // NIR (842 nm)
  B11: number; // SWIR (1610 nm)
  SCL: number; // Scene Classification Layer
}

const CDSE_AUTH_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const CDSE_ODATA_URL =
  'https://catalogue.dataspace.copernicus.eu/odata/v1/Products';
const CDSE_PROCESS_URL =
  'https://sh.dataspace.copernicus.eu/api/v1/process';

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieves an active OAuth2 Bearer Token from Copernicus Data Space Ecosystem Keycloak.
 */
export async function getCopernicusAuthToken(
  clientId?: string,
  clientSecret?: string
): Promise<string | null> {
  const cId = clientId || process.env.COPERNICUS_CLIENT_ID;
  const cSecret = clientSecret || process.env.COPERNICUS_CLIENT_SECRET;

  if (!cId || !cSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30000) {
    return cachedToken.token;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', cId);
    params.append('client_secret', cSecret);

    const res = await fetch(CDSE_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error(`[CDSE Auth] Failed HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as CopernicusAuthToken;
    cachedToken = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    console.error('[CDSE Auth] Error obtaining Copernicus token:', err);
    return null;
  }
}

/**
 * Searches the most recent Sentinel-2 L2A scenes over a specific coordinate using Copernicus CDSE OData API.
 */
export async function searchCopernicusSentinel2Scenes(
  lat: number,
  lon: number,
  maxCloudCover: number = 30.0,
  limit: number = 5
): Promise<CopernicusSentinelScene[]> {
  try {
    const filter = `Collection/Name eq 'SENTINEL-2' and contains(Name,'MSIL2A') and OData.CSC.Intersects(area=geography'SRID=4326;POINT(${lon.toFixed(5)} ${lat.toFixed(5)})') and Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value le ${maxCloudCover.toFixed(1)})`;
    const url = `${CDSE_ODATA_URL}?$filter=${encodeURIComponent(filter)}&$orderby=ContentDate/Start desc&$top=${limit}&$expand=Attributes`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[CDSE OData] Query returned HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    const products: any[] = json.value || [];

    return products.map((p) => {
      const cloudAttr = p.Attributes?.find(
        (a: any) => a.Name === 'cloudCover'
      );
      const cloudPct = cloudAttr?.Value ? Number(cloudAttr.Value.toFixed(2)) : 0.0;

      return {
        id: p.Id,
        name: p.Name,
        acquisitionDate: p.ContentDate?.Start || p.OriginDate || new Date().toISOString(),
        cloudCoverPct: cloudPct,
        quicklookUrl: `${CDSE_ODATA_URL}(${p.Id})/$value`,
        downloadUrl: `https://zipper.dataspace.copernicus.eu/odata/v1/Products(${p.Id})/$value`,
      };
    });
  } catch (err) {
    console.warn('[CDSE OData] Error querying Copernicus catalog:', err);
    return [];
  }
}

/**
 * Queries real Sentinel-2 surface reflectance bands (B02, B03, B04, B05, B08, B11, SCL)
 * via Copernicus Sentinel Hub Process API using an analytical Evalscript.
 */
export async function fetchCopernicusSpectralSample(
  lat: number,
  lon: number,
  authToken: string,
  dateFrom: string,
  dateTo: string
): Promise<CopernicusSpectralSample | null> {
  const d = 0.003; // ~300m sampling window
  const bbox = [lon - d, lat - d, lon + d, lat + d];

  const evalscript = `//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04", "B05", "B08", "B11", "SCL"],
    output: { id: "default", bands: 7, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  return [sample.B02, sample.B03, sample.B04, sample.B05, sample.B08, sample.B11, sample.SCL];
}
`;

  const requestBody = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: dateFrom, to: dateTo },
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    output: {
      width: 10,
      height: 10,
      responses: [{ identifier: 'default', format: { type: 'application/json' } }],
    },
    evalscript,
  };

  try {
    const res = await fetch(CDSE_PROCESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      console.warn(`[CDSE Process API] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[CDSE Process API] Request error:', err);
    return null;
  }
}
