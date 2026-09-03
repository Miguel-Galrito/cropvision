"""Schemas package."""
from .analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    NDVIStatistics,
    TimeSeriesPoint,
    TimeSeriesRequest,
    TimeSeriesResponse,
    VegetationCategory,
    VegetationInterpretation,
)

__all__ = [
    "AnalyzeRequest",
    "AnalyzeResponse",
    "HealthResponse",
    "NDVIStatistics",
    "TimeSeriesPoint",
    "TimeSeriesRequest",
    "TimeSeriesResponse",
    "VegetationCategory",
    "VegetationInterpretation",
]
