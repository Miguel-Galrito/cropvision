"""
STAC (SpatioTemporal Asset Catalog) Service.
Queries open STAC catalogs (AWS Element84 / Copernicus Sentinel-2 L2A) using pystac-client.
Includes robust handling for cloud cover thresholds and server connectivity errors.
"""
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import pystac_client
from pystac import Item

from app.core.config import settings
from app.core.logging import logger


class STACException(Exception):
    """Base exception for STAC operations."""
    pass


class CloudCoverExceededException(STACException):
    """Raised when available scenes exceed the maximum allowable cloud cover threshold."""
    def __init__(self, lowest_cloud_cover: float, max_threshold: float, scene_date: str):
        self.lowest_cloud_cover = lowest_cloud_cover
        self.max_threshold = max_threshold
        self.scene_date = scene_date
        super().__init__(
            f"The lowest cloud cover available for recent scenes is {lowest_cloud_cover:.1f}%, "
            f"which exceeds the configured maximum threshold of {max_threshold:.1f}% (Acquired: {scene_date})."
        )


class NoScenesFoundException(STACException):
    """Raised when no scenes are found for the target coordinates."""
    def __init__(self, lat: float, lon: float):
        self.lat = lat
        self.lon = lon
        super().__init__(
            f"No Sentinel-2 satellite scenes were found for coordinates ({lat:.4f}, {lon:.4f})."
        )


class STACService:
    """Service to discover and query Sentinel-2 STAC catalogs."""

    def __init__(self, catalog_url: Optional[str] = None, collection: Optional[str] = None):
        self.catalog_url = catalog_url or settings.STAC_API_URL
        self.collection = collection or settings.STAC_COLLECTION

    def get_bbox_from_point(
        self, lat: float, lon: float, buffer_meters: float = 500.0
    ) -> List[float]:
        """
        Calculates a WGS84 bounding box [min_lon, min_lat, max_lon, max_lat]
        around a point given a buffer in meters.
        1 degree latitude ~= 111,320 meters.
        1 degree longitude ~= 111,320 * cos(lat) meters.
        """
        lat_delta = buffer_meters / 111320.0
        cos_lat = math.cos(math.radians(lat))
        lon_delta = buffer_meters / (111320.0 * (cos_lat if abs(cos_lat) > 1e-6 else 1.0))
        
        return [
            round(lon - lon_delta, 6),
            round(lat - lat_delta, 6),
            round(lon + lon_delta, 6),
            round(lat + lat_delta, 6),
        ]

    def _get_client(self) -> pystac_client.Client:
        """Opens and returns a pystac client with configured timeout."""
        try:
            return pystac_client.Client.open(
                self.catalog_url,
                timeout=settings.STAC_TIMEOUT_SECONDS,
            )
        except Exception as exc:
            logger.error(f"Failed to connect to STAC Catalog at {self.catalog_url}: {exc}")
            raise STACException(f"Failed to connect to STAC catalog: {str(exc)}") from exc

    def search_best_scene(
        self,
        lat: float,
        lon: float,
        max_cloud_cover: float = 20.0,
        buffer_meters: float = 500.0,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> Tuple[Item, Dict[str, str]]:
        """
        Searches for the most recent Sentinel-2 L2A scene satisfying cloud cover constraints.
        Returns the STAC Item and a dictionary containing direct access URLs for B04 (Red) and B08 (NIR).
        """
        bbox = self.get_bbox_from_point(lat, lon, buffer_meters)
        client = self._get_client()

        # Date range defaults to last 120 days if not provided
        if not date_to:
            date_to_dt = datetime.now(timezone.utc)
            date_to = date_to_dt.strftime("%Y-%m-%d")
        if not date_from:
            date_from_dt = datetime.now(timezone.utc) - timedelta(days=120)
            date_from = date_from_dt.strftime("%Y-%m-%d")
        datetime_range = f"{date_from}/{date_to}"

        logger.info(
            f"Searching STAC: bbox={bbox}, date={datetime_range}, max_cloud={max_cloud_cover}%"
        )

        # 1. Search with cloud cover threshold
        search = client.search(
            collections=[self.collection],
            bbox=bbox,
            datetime=datetime_range,
            query={"eo:cloud_cover": {"lte": max_cloud_cover}},
            sortby=[{"field": "properties.datetime", "direction": "desc"}],
            limit=5,
        )

        try:
            items = list(search.items())
        except Exception as exc:
            logger.error(f"STAC search query execution failed: {exc}")
            raise STACException(f"Error executing STAC catalog search: {str(exc)}") from exc

        if not items:
            # 2. Check if scenes exist but were excluded due to cloud cover
            logger.info("No scenes with cloud cover <= %s%%. Checking available scenes regardless of clouds...", max_cloud_cover)
            fallback_search = client.search(
                collections=[self.collection],
                bbox=bbox,
                datetime=datetime_range,
                sortby=[{"field": "properties.datetime", "direction": "desc"}],
                limit=3,
            )
            fallback_items = list(fallback_search.items())
            
            if fallback_items:
                best_cloud = min(
                    item.properties.get("eo:cloud_cover", 100.0) for item in fallback_items
                )
                sample_date = fallback_items[0].properties.get("datetime", "N/A")
                raise CloudCoverExceededException(
                    lowest_cloud_cover=best_cloud,
                    max_threshold=max_cloud_cover,
                    scene_date=sample_date,
                )
            else:
                raise NoScenesFoundException(lat=lat, lon=lon)

        best_item = items[0]
        logger.info(
            f"Found best scene: {best_item.id}, Cloud Cover: {best_item.properties.get('eo:cloud_cover')}%, Date: {best_item.properties.get('datetime')}"
        )

        assets_map = self._extract_band_urls(best_item)
        return best_item, assets_map

    def search_timeseries(
        self,
        lat: float,
        lon: float,
        max_cloud_cover: float = 30.0,
        limit: int = 6,
    ) -> List[Item]:
        """
        Searches up to `limit` historical scenes for time-series trend analysis.
        """
        bbox = self.get_bbox_from_point(lat, lon, buffer_meters=500.0)
        client = self._get_client()

        # Last 180 days
        date_to_dt = datetime.now(timezone.utc)
        date_from_dt = date_to_dt - timedelta(days=180)
        datetime_range = f"{date_from_dt.strftime('%Y-%m-%d')}/{date_to_dt.strftime('%Y-%m-%d')}"

        search = client.search(
            collections=[self.collection],
            bbox=bbox,
            datetime=datetime_range,
            query={"eo:cloud_cover": {"lte": max_cloud_cover}},
            sortby=[{"field": "properties.datetime", "direction": "desc"}],
            limit=limit,
        )

        try:
            items = list(search.items())
            return items
        except Exception as exc:
            logger.warning(f"Error fetching timeseries STAC items: {exc}")
            return []

    def _extract_band_urls(self, item: Item) -> Dict[str, str]:
        """
        Extracts direct access URLs for Red (B04), NIR (B08), Visual, and Thumbnail assets.
        Supports both canonical asset keys ('red', 'nir') and Sentinel-2 band IDs ('B04', 'B08').
        """
        assets = item.assets
        red_url = ""
        nir_url = ""
        visual_url = ""
        thumbnail_url = ""

        # Red Band (Band 4)
        for key in ["red", "B04", "b04", "red-jp2"]:
            if key in assets:
                red_url = assets[key].href
                break

        # NIR Band (Band 8)
        for key in ["nir", "B08", "b08", "nir08", "nir-jp2"]:
            if key in assets:
                nir_url = assets[key].href
                break

        # Visual RGB (TCI)
        for key in ["visual", "rendered_preview", "visual-jp2"]:
            if key in assets:
                visual_url = assets[key].href
                break

        # Native Thumbnail
        for key in ["thumbnail", "overview"]:
            if key in assets:
                thumbnail_url = assets[key].href
                break

        if not red_url or not nir_url:
            raise STACException(
                f"Scene {item.id} does not contain required bands (Red/NIR) in open asset catalog."
            )

        return {
            "red": red_url,
            "nir": nir_url,
            "visual": visual_url,
            "thumbnail": thumbnail_url or visual_url,
        }


stac_service = STACService()
