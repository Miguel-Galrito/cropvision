"""
Pydantic schemas for request validation and response serialization.
Strict typing and validation ensure reliability and complete OpenAPI schema documentation.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class VegetationCategory(str, Enum):
    DENSE_VEGETATION = "dense_vegetation"
    MODERATE_VEGETATION = "moderate_vegetation"
    SPARSE_VEGETATION = "sparse_vegetation"
    BARE_SOIL = "bare_soil"
    WATER_OR_INERT = "water_or_inert"


class VegetationInterpretation(BaseModel):
    category: VegetationCategory
    label: str = Field(..., description="Human-readable vegetation category label")
    badge_color: str = Field(..., description="CSS/Tailwind badge color identifier")
    description: str = Field(..., description="Interpreted agronomic health diagnosis")
    recommendation: str = Field(..., description="Actionable agronomic recommendation for the farm plot")


class AnalyzeRequest(BaseModel):
    lat: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Target latitude in decimal degrees (WGS84)",
        json_schema_extra={"example": 38.3842},
    )
    lon: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Target longitude in decimal degrees (WGS84)",
        json_schema_extra={"example": -7.5519},
    )
    max_cloud_cover: float = Field(
        default=20.0,
        ge=0.0,
        le=100.0,
        description="Maximum allowable cloud cover percentage (0-100%)",
        json_schema_extra={"example": 20.0},
    )
    buffer_meters: float = Field(
        default=500.0,
        ge=100.0,
        le=5000.0,
        description="Spatial analysis radius in meters around the coordinate",
        json_schema_extra={"example": 500.0},
    )
    date_from: Optional[str] = Field(
        default=None,
        description="Start date for STAC search window (ISO 8601, e.g. 2026-01-01)",
    )
    date_to: Optional[str] = Field(
        default=None,
        description="End date for STAC search window (ISO 8601, e.g. 2026-09-01)",
    )


class NDVIStatistics(BaseModel):
    mean: float = Field(..., description="Mean NDVI value across the sampled raster (-1.0 to 1.0)")
    min: float = Field(..., description="Minimum NDVI pixel value")
    max: float = Field(..., description="Maximum NDVI pixel value")
    std: float = Field(..., description="Standard deviation of NDVI (spatial canopy homogeneity)")
    median: float = Field(..., description="Median NDVI pixel value")
    p25: float = Field(..., description="25th percentile value")
    p75: float = Field(..., description="75th percentile value")


class AnalyzeResponse(BaseModel):
    success: bool = True
    scene_id: str = Field(..., description="Unique Sentinel-2 L2A scene granule identifier")
    platform: str = Field(..., description="Satellite platform (e.g., Sentinel-2A, Sentinel-2B, Sentinel-2C)")
    acquisition_date: str = Field(..., description="UTC acquisition timestamp (ISO 8601)")
    cloud_cover_percentage: float = Field(..., description="Observed cloud cover percentage of the scene")
    sun_elevation: Optional[float] = Field(None, description="Sun elevation angle in degrees")
    coordinates: Dict[str, float] = Field(..., description="Analyzed center coordinates (lat, lon)")
    bbox: List[float] = Field(..., description="WGS84 bounding box [min_lon, min_lat, max_lon, max_lat]")
    resolution_meters: float = Field(10.0, description="Spatial resolution of the bands in meters")
    pixels_analyzed: int = Field(..., description="Total pixel count within the sampled spatial window")
    ndvi: NDVIStatistics
    interpretation: VegetationInterpretation
    thumbnail_url: str = Field(..., description="Base64 Data URI of colorized NDVI colormap heatmap (PNG)")
    true_color_thumbnail: Optional[str] = Field(None, description="Direct URL of the true-color satellite preview")
    is_simulated: bool = Field(False, description="Flag indicating if calibrated resilience fallback was used")
    processing_time_ms: float = Field(..., description="End-to-end request processing latency in milliseconds")


class TimeSeriesPoint(BaseModel):
    date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    scene_id: str = Field(..., description="Sentinel-2 scene identifier")
    ndvi_mean: float = Field(..., description="Calculated mean NDVI for the scene")
    cloud_cover: float = Field(..., description="Scene cloud cover percentage")


class TimeSeriesRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    max_cloud_cover: float = Field(default=30.0, ge=0.0, le=100.0, description="Maximum cloud cover threshold")
    limit: int = Field(default=5, ge=2, le=12, description="Maximum number of historical points to return")


class TimeSeriesResponse(BaseModel):
    coordinates: Dict[str, float]
    points_count: int
    series: List[TimeSeriesPoint]


class HealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str
    version: str
    environment: str
    stac_catalog_status: str
    timestamp: str
