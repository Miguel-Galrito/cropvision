"""
CropVision API - Earth Observation SaaS.
FastAPI main application entrypoint with strict CORS, OpenAPI docs, and global error handlers.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events management."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Connected STAC Catalog: {settings.STAC_API_URL} (collection: {settings.STAC_COLLECTION})")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Strict CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected internal server error occurred while processing geospatial satellite data.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )

# Register API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    """Root landing endpoint with API navigation links."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "analyze_endpoint": f"{settings.API_V1_STR}/analyze",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
