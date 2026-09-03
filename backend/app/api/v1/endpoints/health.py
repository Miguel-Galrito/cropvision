"""
Health check endpoint.
Provides service verification and external STAC catalog connectivity status.
"""
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, status

from app.core.config import settings
from app.core.logging import logger
from app.schemas.analysis import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns operational status of the API service and connectivity to Copernicus Sentinel-2 STAC catalog.",
)
async def check_health() -> HealthResponse:
    stac_status = "connected"
    
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(settings.STAC_API_URL)
            if resp.status_code != 200:
                stac_status = f"degraded (HTTP {resp.status_code})"
    except Exception as exc:
        logger.warning(f"Health check warning: STAC endpoint probe failed: {exc}")
        stac_status = "unreachable (offline mode active)"

    return HealthResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        stac_catalog_status=stac_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
