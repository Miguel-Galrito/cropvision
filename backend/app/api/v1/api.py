"""
API v1 Router registry.
Aggregates health, analysis, and timeseries endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, analyze

api_router = APIRouter()

# Health verification endpoint
api_router.include_router(health.router, tags=["Health"])

# NDVI Analysis & Timeseries endpoints
api_router.include_router(analyze.router, tags=["Earth Observation"])
