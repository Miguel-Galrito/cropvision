"""
Pydantic schemas for request validation and response serialization.
Strict typing and validation ensure reliability and complete OpenAPI schema documentation.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class VegetationCategory(str, Enum):
    DENSE_VEGETATION = "dense_vegetation"
    MODERATE_VEGETATION = "moderate_vegetation"
    SPARSE_VEGETATION = "sparse_vegetation"
    BARE_SOIL = "bare_soil"
    WATER_OR_INERT = "water_or_inert"


class VegetationInterpretation(BaseModel):
    category: VegetationCategory
    label: str = Field(..., description="Nome da categoria em português legível")
    badge_color: str = Field(..., description="Cor CSS / Tailwind para destaque visual")
    description: str = Field(..., description="Diagnóstico agronómico interpretado")
    recommendation: str = Field(..., description="Ação recomendada para a exploração")


class AnalyzeRequest(BaseModel):
    lat: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude do ponto em graus decimais (WGS84)",
        json_schema_extra={"example": 38.3842},
    )
    lon: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude do ponto em graus decimais (WGS84)",
        json_schema_extra={"example": -7.5519},
    )
    max_cloud_cover: float = Field(
        default=20.0,
        ge=0.0,
        le=100.0,
        description="Percentagem máxima de cobertura de nuvens aceitável (0 a 100%)",
        json_schema_extra={"example": 20.0},
    )
    buffer_meters: float = Field(
        default=500.0,
        ge=100.0,
        le=5000.0,
        description="Raio de análise em metros ao redor da coordenada",
        json_schema_extra={"example": 500.0},
    )
    date_from: Optional[str] = Field(
        default=None,
        description="Data inicial da pesquisa ISO 8601 (ex: 2026-01-01)",
    )
    date_to: Optional[str] = Field(
        default=None,
        description="Data final da pesquisa ISO 8601 (ex: 2026-09-01)",
    )


class NDVIStatistics(BaseModel):
    mean: float = Field(..., description="Valor médio do NDVI na área amostrada (-1.0 a 1.0)")
    min: float = Field(..., description="Valor mínimo do NDVI")
    max: float = Field(..., description="Valor máximo do NDVI")
    std: float = Field(..., description="Desvio padrão do NDVI (homogeneidade da vegetação)")
    median: float = Field(..., description="Mediana do NDVI")
    p25: float = Field(..., description="25º percentil")
    p75: float = Field(..., description="75º percentil")


class AnalyzeResponse(BaseModel):
    success: bool = True
    scene_id: str = Field(..., description="Identificador único da cena Sentinel-2 (L2A)")
    platform: str = Field(..., description="Plataforma de satélite (ex: Sentinel-2A ou Sentinel-2B)")
    acquisition_date: str = Field(..., description="Data e hora UTC da aquisição da imagem")
    cloud_cover_percentage: float = Field(..., description="Percentagem de nuvens da cena")
    sun_elevation: Optional[float] = Field(None, description="Ângulo de elevação solar em graus")
    coordinates: Dict[str, float] = Field(..., description="Coordenadas analisadas (lat, lon)")
    bbox: List[float] = Field(..., description="Bounding box [min_lon, min_lat, max_lon, max_lat]")
    resolution_meters: float = Field(10.0, description="Resolução espacial das bandas em metros")
    pixels_analyzed: int = Field(..., description="Número total de pixels na janela espacial")
    ndvi: NDVIStatistics
    interpretation: VegetationInterpretation
    thumbnail_url: str = Field(..., description="Data URI base64 da imagem colorizada do NDVI (colormap)")
    true_color_thumbnail: Optional[str] = Field(None, description="URL da miniatura de cor real do catálogo")
    is_simulated: bool = Field(False, description="Indica se os dados foram gerados por fallback de resiliência")
    processing_time_ms: float = Field(..., description="Tempo de processamento da requisição em milissegundos")


class TimeSeriesPoint(BaseModel):
    date: str
    scene_id: str
    ndvi_mean: float
    cloud_cover: float


class TimeSeriesRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    max_cloud_cover: float = Field(default=30.0, ge=0.0, le=100.0)
    limit: int = Field(default=5, ge=2, le=12)


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
