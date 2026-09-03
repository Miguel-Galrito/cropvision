# SatHealth Backend (FastAPI + GDAL/Rasterio)

High-performance asynchronous backend service for querying open **Copernicus Sentinel-2 L2A** satellite catalogs and computing matrix **NDVI (Normalized Difference Vegetation Index)** via Cloud Optimized GeoTIFF (COG) HTTP Range Requests.

---

## 🚀 Technology Stack

- **FastAPI**: Modern, asynchronous, typed Python web framework.
- **Pydantic v2 & Pydantic Settings**: Strict runtime data validation and environment variable parsing.
- **pystac-client**: Open STAC discovery client querying AWS Element84 Sentinel-2 L2A catalogs.
- **Rasterio & GDAL**: Spatial window extraction using HTTP Range Requests on remote COG assets (Bands 4 and 8) without multi-hundred megabyte file downloads.
- **NumPy**: Fast vectorized matrix math for NDVI calculation and zonal statistics.
- **Matplotlib & Pillow**: Server-side colormap generation rendering Base64 PNG heatmaps (`RdYlGn`).
- **Pytest & HTTPX**: Automated integration and unit test suite.

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status and live STAC catalog probe |
| `POST` | `/api/v1/analyze` | Sentinel-2 NDVI calculation for given coordinates (`lat`, `lon`, `max_cloud_cover`) |
| `POST` | `/api/v1/timeseries` | Historical multi-temporal NDVI trend over recent orbits |
| `GET` | `/api/v1/docs` | Interactive Swagger UI / OpenAPI documentation |

---

## 🛠️ Local Development

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI application
uvicorn app.main:app --reload --port 8000
```

Access Swagger UI documentation at: `http://localhost:8000/api/v1/docs`

---

## 🧪 Running Automated Tests

```bash
# Set PYTHONPATH and execute pytest
pytest tests/ -v
```

---

## 🐳 Docker Deployment

```bash
docker build -t sathealth-backend .
docker run -p 8000:8000 sathealth-backend
```
