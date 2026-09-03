"""
Test suite for SatHealth backend.
Tests health endpoint, NDVI matrix mathematical logic, input validation, and endpoints.
"""
import base64
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ndvi_service import ndvi_service
from app.schemas.analysis import VegetationCategory

client = TestClient(app)


def test_health_endpoint():
    """Verify that /api/v1/health returns 200 and operational status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data
    assert "stac_catalog_status" in data


def test_root_endpoint():
    """Verify landing endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "documentation" in data


def test_ndvi_matrix_calculation_dense_vegetation():
    """Verify NDVI formula: (NIR - RED) / (NIR + RED) for healthy crop."""
    # Synthetic 10x10 raster: low Red (chlorophyll absorption) and high NIR (leaf scattering)
    red = np.full((10, 10), 0.10, dtype=np.float32)
    nir = np.full((10, 10), 0.60, dtype=np.float32)

    ndvi_matrix, stats = ndvi_service.calculate_ndvi(red, nir)
    
    # Expected: (0.6 - 0.1) / (0.6 + 0.1) = 0.5 / 0.7 = ~0.7143
    assert abs(stats.mean - 0.7143) < 0.001
    assert abs(stats.min - 0.7143) < 0.001
    assert abs(stats.max - 0.7143) < 0.001
    
    interpretation = ndvi_service.get_interpretation(stats.mean)
    assert interpretation.category == VegetationCategory.DENSE_VEGETATION
    assert "Densa e Saudável" in interpretation.label


def test_ndvi_matrix_calculation_bare_soil():
    """Verify NDVI formula for bare soil/pavement."""
    red = np.full((10, 10), 0.30, dtype=np.float32)
    nir = np.full((10, 10), 0.33, dtype=np.float32)

    ndvi_matrix, stats = ndvi_service.calculate_ndvi(red, nir)
    # Expected: (0.33 - 0.30) / (0.33 + 0.30) = 0.03 / 0.63 = ~0.0476
    assert abs(stats.mean - 0.0476) < 0.001
    
    interpretation = ndvi_service.get_interpretation(stats.mean)
    assert interpretation.category == VegetationCategory.BARE_SOIL


def test_ndvi_matrix_calculation_water():
    """Verify NDVI negative values for water bodies."""
    red = np.full((10, 10), 0.15, dtype=np.float32)
    nir = np.full((10, 10), 0.05, dtype=np.float32)

    ndvi_matrix, stats = ndvi_service.calculate_ndvi(red, nir)
    # Expected: (0.05 - 0.15) / (0.05 + 0.15) = -0.10 / 0.20 = -0.5
    assert abs(stats.mean - (-0.50)) < 0.001
    
    interpretation = ndvi_service.get_interpretation(stats.mean)
    assert interpretation.category == VegetationCategory.WATER_OR_INERT


def test_colormap_thumbnail_generation():
    """Verify generation of valid Base64 PNG image from NDVI matrix."""
    matrix = np.linspace(-0.2, 0.8, 100).reshape((10, 10))
    thumbnail = ndvi_service.generate_colormap_thumbnail(matrix, width=64, height=64)
    
    assert thumbnail.startswith("data:image/png;base64,")
    # Verify base64 content can be decoded
    raw_b64 = thumbnail.split(",")[1]
    decoded = base64.b64decode(raw_b64)
    # PNG signature check (bytes 1..4: PNG)
    assert decoded[:8] == b"\x89PNG\r\n\x1a\n"


def test_analyze_validation_errors():
    """Verify strict Pydantic validation on invalid coordinates."""
    # Invalid latitude > 90
    response = client.post(
        "/api/v1/analyze",
        json={"lat": 120.0, "lon": -8.0, "max_cloud_cover": 20.0},
    )
    assert response.status_code == 422

    # Invalid cloud cover > 100
    response = client.post(
        "/api/v1/analyze",
        json={"lat": 38.0, "lon": -8.0, "max_cloud_cover": 150.0},
    )
    assert response.status_code == 422


def test_analyze_endpoint_real_or_fallback():
    """Verify /api/v1/analyze endpoint handles requests successfully."""
    response = client.post(
        "/api/v1/analyze",
        json={
            "lat": 38.3842,
            "lon": -7.5519,
            "max_cloud_cover": 50.0,
            "buffer_meters": 500.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "scene_id" in data
    assert "ndvi" in data
    assert -1.0 <= data["ndvi"]["mean"] <= 1.0
    assert "thumbnail_url" in data
    assert data["thumbnail_url"].startswith("data:image/png;base64,")
    assert "interpretation" in data
    assert "category" in data["interpretation"]


def test_timeseries_endpoint():
    """Verify /api/v1/timeseries returns chronological list."""
    response = client.post(
        "/api/v1/timeseries",
        json={"lat": 38.3842, "lon": -7.5519, "limit": 4},
    )
    assert response.status_code == 200
    data = response.json()
    assert "series" in data
    assert len(data["series"]) >= 1
    for pt in data["series"]:
        assert "date" in pt
        assert "ndvi_mean" in pt
