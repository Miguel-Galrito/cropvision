"""
Application Configuration Settings.
Uses pydantic-settings to manage environment variables and sensible defaults.
"""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SatHealth API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "B2B Micro-SaaS for automated vegetation and crop health monitoring via Copernicus Sentinel-2 STAC"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Server
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://*.vercel.app",
        "https://miguel-galrito.github.io",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        raise ValueError(v)

    # Geospatial / STAC Configuration
    STAC_API_URL: str = "https://earth-search.aws.element84.com/v1"
    STAC_COLLECTION: str = "sentinel-2-l2a"
    STAC_TIMEOUT_SECONDS: float = 25.0
    
    # Analysis Defaults
    DEFAULT_MAX_CLOUD_COVER: float = 20.0
    DEFAULT_BUFFER_METERS: float = 500.0
    
    # Rasterio / GDAL S3 Settings
    GDAL_DISABLE_READDIR_ON_OPEN: str = "EMPTY_DIR"
    AWS_NO_SIGN_REQUEST: str = "YES"
    CPL_VSIL_CURL_ALLOWED_EXTENSIONS: str = ".tif,.tiff"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
