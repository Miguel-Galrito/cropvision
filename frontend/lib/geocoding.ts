/**
 * Geospatial Reverse Geocoding Utility.
 * Resolves (latitude, longitude) coordinates to city, municipality, administrative area, and country.
 * Supports Google Maps Platform Geocoding REST API with graceful fallback to OpenStreetMap Nominatim.
 */

export interface GeocodedLocation {
  city: string;
  region: string;
  country: string;
  formatted: string;
}

// Coordinate-bucket cache to avoid redundant network lookups
const geocodeCache = new Map<string, GeocodedLocation>();

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodedLocation> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. If Google Maps Platform API key is configured, use Google Maps Geocoding REST API
  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          let city = '';
          let region = '';
          let country = '';

          for (const comp of first.address_components) {
            if (comp.types.includes('locality') || comp.types.includes('postal_town')) {
              city = comp.long_name;
            } else if (!city && (comp.types.includes('administrative_area_level_2') || comp.types.includes('sublocality'))) {
              city = comp.long_name;
            }
            if (comp.types.includes('administrative_area_level_1')) {
              region = comp.long_name;
            }
            if (comp.types.includes('country')) {
              country = comp.long_name;
            }
          }

          const resolvedCity = city || region || 'Agricultural Parcel';
          const parts = [resolvedCity, region !== resolvedCity ? region : '', country].filter(Boolean);
          const result: GeocodedLocation = {
            city: resolvedCity,
            region,
            country,
            formatted: parts.join(', '),
          };

          geocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('[Geocoding] Google Maps geocoding error, falling back to OSM:', err);
    }
  }

  // 2. Default Zero-Config: OpenStreetMap Nominatim Reverse Geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SatHealth-MicroSaaS/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.hamlet ||
        addr.county ||
        '';

      const region = addr.state || addr.province || addr.region || '';
      const country = addr.country || '';

      const resolvedCity = city || region || 'Agricultural Parcel';
      const parts = [resolvedCity, region !== resolvedCity ? region : '', country].filter(Boolean);

      const result: GeocodedLocation = {
        city: resolvedCity,
        region,
        country,
        formatted: parts.length > 0 ? parts.join(', ') : `Parcel (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`,
      };

      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[Geocoding] Nominatim lookup error:', err);
  }

  // Fallback if offline
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const defaultLocation: GeocodedLocation = {
    city: 'Agricultural Parcel',
    region: '',
    country: '',
    formatted: `Parcel (${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir})`,
  };

  return defaultLocation;
}
