"""
NDVI (Normalized Difference Vegetation Index) Service.
Reads Band 4 (Red) and Band 8 (NIR) from Cloud Optimized GeoTIFFs (COGs) via HTTP Range Requests
using rasterio, calculates matrix NDVI with NumPy, computes statistical metrics, and generates
a colorized colormap preview.
"""
import base64
import io
import os
import shutil
import tempfile
from typing import Any, Dict, List, Optional, Tuple

import certifi
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import rasterio
from rasterio._env import set_gdal_config
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds

from app.core.config import settings
from app.core.logging import logger
from app.schemas.analysis import (
    NDVIStatistics,
    VegetationCategory,
    VegetationInterpretation,
)


def _configure_gdal_ssl() -> None:
    """
    Configures GDAL/CURL CA bundle to an ASCII-safe temporary path.
    On Windows, non-ASCII characters in workspace paths cause GDAL/rasterio
    to trigger UnicodeDecodeError when reading certificates.
    """
    try:
        temp_dir = os.environ.get("TEMP", tempfile.gettempdir())
        safe_ca_path = os.path.join(temp_dir, "sathealth_cacert.pem").replace("\\", "/")
        ca_source = certifi.where()
        if not os.path.exists(safe_ca_path) or os.path.getsize(safe_ca_path) == 0:
            shutil.copyfile(ca_source, safe_ca_path)
        set_gdal_config("GDAL_CURL_CA_BUNDLE", safe_ca_path)
        set_gdal_config("CURL_CA_BUNDLE", safe_ca_path)
    except Exception as exc:
        logger.warning(f"Could not setup custom GDAL CA bundle: {exc}")


_configure_gdal_ssl()


class NDVIService:
    """Service to process satellite bands and compute vegetation metrics."""

    @staticmethod
    def get_interpretation(mean_ndvi: float) -> VegetationInterpretation:
        """Translates numeric NDVI value into agronomic and environmental interpretation."""
        if mean_ndvi >= 0.60:
            return VegetationInterpretation(
                category=VegetationCategory.DENSE_VEGETATION,
                label="Dense Healthy Vegetation",
                badge_color="emerald",
                description="Vigorous crop canopy with high leaf area index and intense photosynthetic activity.",
                recommendation="Ideal growth conditions. Maintain current irrigation schedule and nutrition plan.",
            )
        elif mean_ndvi >= 0.35:
            return VegetationInterpretation(
                category=VegetationCategory.MODERATE_VEGETATION,
                label="Moderate Vegetation / Developing",
                badge_color="green",
                description="Moderate vegetative density typical of growing crops, semi-dense pasture, or orchard canopy.",
                recommendation="Monitor soil moisture levels and evaluate nitrogen top-dressing requirements.",
            )
        elif mean_ndvi >= 0.18:
            return VegetationInterpretation(
                category=VegetationCategory.SPARSE_VEGETATION,
                label="Sparse Vegetation / Moisture Stress",
                badge_color="amber",
                description="Low vegetative vigor. Indicative of water deficit stress, thin crop stand, or post-harvest residue.",
                recommendation="Inspect plot irrigation sectors to rule out emitter clogs or localized moisture deficits.",
            )
        elif mean_ndvi >= 0.0:
            return VegetationInterpretation(
                category=VegetationCategory.BARE_SOIL,
                label="Bare Soil / Fallow Ground",
                badge_color="stone",
                description="Predominance of bare ground, tilled earth, rock outcrop, or non-vegetated infrastructure.",
                recommendation="Plot is prepared for seeding or in fallow state. No immediate weed pressure detected.",
            )
        else:
            return VegetationInterpretation(
                category=VegetationCategory.WATER_OR_INERT,
                label="Water Body / Saturated Zone",
                badge_color="sky",
                description="Strong absorption in the Near-Infrared (NIR) band, indicative of open water or waterlogged ground.",
                recommendation="Natural reservoir, irrigation pond, or wetland drainage line.",
            )

    def read_cog_window(
        self,
        red_url: str,
        nir_url: str,
        bbox: List[float],
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Reads a spatial window for Band 4 (Red) and Band 8 (NIR) from remote Cloud Optimized GeoTIFFs
        using HTTP Range Requests through GDAL/Rasterio virtual file system.
        """
        rasterio_env = {
            "AWS_NO_SIGN_REQUEST": settings.AWS_NO_SIGN_REQUEST,
            "GDAL_DISABLE_READDIR_ON_OPEN": settings.GDAL_DISABLE_READDIR_ON_OPEN,
            "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": settings.CPL_VSIL_CURL_ALLOWED_EXTENSIONS,
            "GDAL_HTTP_TIMEOUT": "15",
            "GDAL_HTTP_MAX_RETRY": "3",
            "CPL_CURL_VERBOSE": "NO",
            "VSI_CACHE": "TRUE",
            "VSI_CACHE_SIZE": "10000000",
        }

        min_lon, min_lat, max_lon, max_lat = bbox

        with rasterio.Env(**rasterio_env):
            # Open Red band (B4)
            with rasterio.open(red_url) as src_red:
                # Transform WGS84 bbox into dataset CRS (usually UTM)
                left, bottom, right, top = transform_bounds(
                    "EPSG:4326", src_red.crs, min_lon, min_lat, max_lon, max_lat
                )
                window_red = from_bounds(left, bottom, right, top, transform=src_red.transform)
                red_data = src_red.read(1, window=window_red).astype(np.float32)

            # Open NIR band (B8)
            with rasterio.open(nir_url) as src_nir:
                window_nir = from_bounds(left, bottom, right, top, transform=src_nir.transform)
                nir_data = src_nir.read(1, window=window_nir).astype(np.float32)

        # Ensure matching dimensions
        h = min(red_data.shape[0], nir_data.shape[0])
        w = min(red_data.shape[1], nir_data.shape[1])
        
        if h < 5 or w < 5:
            raise ValueError(f"Spatial sampling window too small ({h}x{w} pixels). Increase the buffer radius.")

        return red_data[:h, :w], nir_data[:h, :w]

    def calculate_ndvi(
        self, red_array: np.ndarray, nir_array: np.ndarray
    ) -> Tuple[np.ndarray, NDVIStatistics]:
        """
        Calculates NDVI matrix: (NIR - Red) / (NIR + Red + eps).
        Extracts statistical metrics while masking invalid values.
        """
        # Replace non-positive or corrupted values
        red = np.where(red_array <= 0, np.nan, red_array)
        nir = np.where(nir_array <= 0, np.nan, nir_array)

        denominator = nir + red
        numerator = nir - red

        # Avoid zero division
        with np.errstate(divide="ignore", invalid="ignore"):
            ndvi = np.where(denominator > 0, numerator / denominator, np.nan)

        # Filter strictly to physical NDVI limits [-1.0, 1.0]
        valid_mask = np.isfinite(ndvi) & (ndvi >= -1.0) & (ndvi <= 1.0)
        valid_values = ndvi[valid_mask]

        if len(valid_values) == 0:
            logger.warning("No valid NDVI values computed from raster bands. Returning default zero stats.")
            stats = NDVIStatistics(
                mean=0.0,
                min=0.0,
                max=0.0,
                std=0.0,
                median=0.0,
                p25=0.0,
                p75=0.0,
            )
            return np.zeros((20, 20), dtype=np.float32), stats

        stats = NDVIStatistics(
            mean=round(float(np.mean(valid_values)), 4),
            min=round(float(np.min(valid_values)), 4),
            max=round(float(np.max(valid_values)), 4),
            std=round(float(np.std(valid_values)), 4),
            median=round(float(np.median(valid_values)), 4),
            p25=round(float(np.percentile(valid_values, 25)), 4),
            p75=round(float(np.percentile(valid_values, 75)), 4),
        )

        return ndvi, stats

    def generate_colormap_thumbnail(
        self, ndvi_matrix: np.ndarray, width: int = 400, height: int = 400
    ) -> str:
        """
        Generates an agronomic colorized heatmap preview (PNG) encoded as a Base64 data URI.
        Uses RdYlGn (Red-Yellow-Green) colormap scaled between -0.2 and 0.85 for optimal contrast.
        """
        # Clean invalid values with -0.1 (neutral water/shadow tone)
        clean_matrix = np.nan_to_num(ndvi_matrix, nan=-0.1)

        # Normalize matrix between [-0.15, 0.85]
        norm = matplotlib.colors.Normalize(vmin=-0.15, vmax=0.85)
        cmap = plt.get_cmap("RdYlGn")
        rgba_img = cmap(norm(clean_matrix))

        # Convert float (0.0 - 1.0) to uint8 (0 - 255)
        uint8_img = (rgba_img * 255).astype(np.uint8)

        # Create PIL Image and resize smoothly
        pil_img = Image.fromarray(uint8_img, mode="RGBA")
        pil_img = pil_img.resize((width, height), Image.Resampling.BICUBIC)

        # Export to Base64 PNG
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG", optimize=True)
        img_bytes = buffer.getvalue()
        b64_str = base64.b64encode(img_bytes).decode("utf-8")

        return f"data:image/png;base64,{b64_str}"


ndvi_service = NDVIService()
