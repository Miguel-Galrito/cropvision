<div align="center">

# 🛰️ SatHealth API & Dashboard
### **Earth Observation Intelligence & Automated Crop Vigor Monitoring Micro-SaaS**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-2ea44f?style=for-the-badge)](https://miguel-galrito.github.io/sat-health-api/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Copernicus Sentinel-2](https://img.shields.io/badge/Copernicus-Sentinel--2_L2A-003399?style=for-the-badge)](https://sentinels.copernicus.eu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Production-grade B2B Earth Observation micro-SaaS for automated agricultural vegetation health monitoring, zonal canopy statistics, and NDVI calculation via open Copernicus Sentinel-2 satellite data.</b>
</p>

### 🔗 Public Live Application
👉 **[https://miguel-galrito.github.io/sat-health-api/](https://miguel-galrito.github.io/sat-health-api/)**

[Features](#-key-features) •
[Architecture](#-system-architecture) •
[API Documentation](#-api-documentation-post-apiv1analyze) •
[Quick Start](#-quick-start) •
[Production Deployment](#-production-deployment) •
[License](#-license)

</div>

---

## 🌿 Overview

**SatHealth** is a cloud-native Earth Observation (EO) platform designed for precision agriculture, crop consultants, and forestry managers. 

When a user selects coordinates or an agricultural plot on the interactive map, the system queries the open **Copernicus Sentinel-2 (Level-2A Bottom-of-Atmosphere)** STAC catalog, streams only the required spatial window of Band 4 (Red) and Band 8 (Near-Infrared) via **HTTP Range Requests** on Cloud Optimized GeoTIFFs (COGs), computes the **Normalized Difference Vegetation Index (NDVI)** matrix using NumPy, and renders agronomic insights alongside a colorized spectral colormap heatmap.

---

## ✨ Key Features

- 🛰️ **Serverless & Lightweight Geospatial Pipeline**:
  - Spatial window extraction via `rasterio` (~500m/1000m buffer) without downloading multi-hundred-megabyte GeoTIFF files.
  - Queries AWS Element84 open STAC catalog (`sentinel-2-l2a`) with zero proprietary API fees.
- 📊 **Vectorized Matrix NDVI Calculation**:
  $$\text{NDVI} = \frac{\text{B8 (NIR)} - \text{B4 (Red)}}{\text{B8 (NIR)} + \text{B4 (Red)}}$$
  - Full zonal canopy statistics: **Mean, Median, Minimum, Maximum, and Standard Deviation** (spatial canopy homogeneity).
- 🎨 **Dynamic Colormap Heatmap Generation**:
  - Renders Base64 Data URI PNG heatmaps using the agronomic `RdYlGn` spectral colormap (Bare Soil $\rightarrow$ Moisture Deficit $\rightarrow$ Moderate $\rightarrow$ Healthy Vigor).
  - Side-by-side comparison between **True Color (RGB)** and **NDVI Spectral Heatmap**.
- 🗺️ **Interactive Geospatial Dashboard (Next.js 14 + Leaflet)**:
  - Clean vector street basemap (OpenStreetMap) and high-resolution Esri World Imagery (satellite).
  - Radar-pulsing target marker and bounding box overlay illustrating the sampled plot footprint.
  - Responsive analysis that dynamically re-calculates zonal NDVI and spectral heatmaps for **every** location on the globe.
  - **1-Click Demo Agricultural Presets**:
    - *Esporão Estate* (Alentejo, Portugal) - Vineyards & Olive Groves (NDVI ~0.675).
    - *Cerrado Farm* (Sorriso, Mato Grosso, Brazil) - Large-Scale Soybean & Corn (NDVI ~0.824).
    - *Central Valley* (Fresno, California, USA) - Drip-Irrigated Almond & Citrus (NDVI ~0.482).
    - *Quinta do Vallado* (Douro Valley, Portugal) - Terraced Hillside Vineyards (NDVI ~0.564).
    - *Alqueva Reservoir* (Portugal) - Open Water Body Calibrator (NDVI ~-0.245).
- 📈 **Historical Multi-Temporal Trend**:
  - Interactive SVG trend chart visualizing vegetation evolution across recent orbital passes.
- 🛡️ **Resilience & Robust Error Handling**:
  - Strict `HTTP 422` structured responses when cloud cover exceeds the user threshold (`max_cloud_cover`), returning corrective actions.
  - Deterministic client-side Earth Observation model ensuring the public web application works smoothly for visitors worldwide.
- 📥 **Export Reports in Multiple Formats**:
  - 📄 **Text Report (`.txt`)**: Clean, formatted ASCII report specifically formatted for Windows Notepad / Notes (no unreadable code or base64 binary strings).
  - 🖨️ **Print / Save as PDF**: Beautifully styled visual summary ready for printing or PDF export.
  - 📊 **Clean JSON Data (`.json`)**: Lightweight structured data without base64 image overhead.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (Next.js 14 App Router)"]
        UI["Interactive Dashboard UI"]
        Map["Leaflet Map (OpenStreetMap & Esri Satellite)"]
        Presets["1-Click Agricultural Presets"]
        Panel["Analytics Panel: NDVI, Heatmap, Chart"]
    end

    subgraph Backend["Backend Layer (FastAPI Async Engine)"]
        API["FastAPI REST Router (/api/v1)"]
        Pydantic["Pydantic v2 Strict Validation"]
        STACService["STAC Search Engine (pystac-client)"]
        NDVIService["Rasterio COG Window Reader & NumPy"]
        ThumbnailService["Matplotlib & Pillow Colormap Generator"]
    end

    subgraph DataSources["Public Satellite Data Sources"]
        STACCatalog["AWS Element84 STAC Catalog (sentinel-2-l2a)"]
        S3COGs["Amazon S3 COG Bucket (B04 Red & B08 NIR)"]
    end

    Map -->|"1. Coordinate Selection"| UI
    Presets -->|"1. Preset Plot Selection"| UI
    UI -->|"2. POST /api/v1/analyze"| API
    API --> Pydantic
    Pydantic --> STACService
    STACService -->|"3. Orbital Search & Cloud Filter"| STACCatalog
    STACCatalog -->|"4. Metadata & Asset URLs"| STACService
    STACService --> NDVIService
    NDVIService -->|"5. HTTP Range Requests (B4 & B8)"| S3COGs
    NDVIService -->|"6. Matrix Math: (NIR - Red) / (NIR + Red)"| NDVIService
    NDVIService --> ThumbnailService
    ThumbnailService -->|"7. Base64 PNG Heatmap"| API
    API -->|"8. JSON: Stats, Diagnosis, Heatmap"| Panel
```

---

## 📡 API Documentation: `POST /api/v1/analyze`

The `/api/v1/analyze` endpoint processes geospatial coordinates, streams Sentinel-2 Level-2A bands, and returns zonal NDVI metrics with an interpreted agronomic diagnosis.

### HTTP Request
`POST /api/v1/analyze`

#### Headers
| Header | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | Request payload format |
| `Accept` | `application/json` | Response format |

#### Request Body Parameters (`AnalyzeRequest`)
| Field | Type | Required | Default | Range / Format | Description |
|---|---|---|---|---|---|
| `lat` | `float` | **Yes** | — | `[-90.0, 90.0]` | Latitude in decimal degrees (WGS84). |
| `lon` | `float` | **Yes** | — | `[-180.0, 180.0]` | Longitude in decimal degrees (WGS84). |
| `max_cloud_cover` | `float` | No | `20.0` | `[0.0, 100.0]` | Maximum acceptable scene cloud cover percentage. |
| `buffer_meters` | `float` | No | `500.0` | `[100.0, 5000.0]` | Spatial analysis radius in meters around the coordinate. |
| `date_from` | `string` | No | `120 days ago` | `YYYY-MM-DD` | Start of temporal search window (ISO 8601). |
| `date_to` | `string` | No | `today` | `YYYY-MM-DD` | End of temporal search window (ISO 8601). |

#### Example cURL Request
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 38.3842,
    "lon": -7.5519,
    "max_cloud_cover": 20.0,
    "buffer_meters": 500.0
  }'
```

---

### Response Specification (`AnalyzeResponse`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "scene_id": "S2C_29SPC_20260902_0_L2A",
  "platform": "Sentinel-2",
  "acquisition_date": "2026-09-02T11:20:41.806000Z",
  "cloud_cover_percentage": 0.0,
  "sun_elevation": 58.42,
  "coordinates": {
    "lat": 38.3842,
    "lon": -7.5519
  },
  "bbox": [
    -7.557621,
    38.379708,
    -7.546179,
    38.388692
  ],
  "resolution_meters": 10.0,
  "pixels_analyzed": 10000,
  "ndvi": {
    "mean": 0.6751,
    "min": 0.1245,
    "max": 0.8842,
    "std": 0.0983,
    "median": 0.6812,
    "p25": 0.6120,
    "p75": 0.7431
  },
  "interpretation": {
    "category": "dense_vegetation",
    "label": "Dense Healthy Vegetation",
    "badge_color": "emerald",
    "description": "Vigorous crop canopy with high leaf area index and intense photosynthetic activity.",
    "recommendation": "Ideal growth conditions. Maintain current irrigation schedule and nutrition plan."
  },
  "thumbnail_url": "data:image/png;base64,iVBORw0KGgoAAA...",
  "true_color_thumbnail": "https://sentinel-cogs.s3.us-west-2.amazonaws.com/.../thumbnail.jpg",
  "is_simulated": false,
  "processing_time_ms": 7567.87
}
```

---

## ⚡ Quick Start

### Method 1: Windows 1-Click Launchers (No Docker Required)

If you are on Windows and don't have Docker installed, you can start both the backend and frontend simultaneously with a single click:

- **Option A**: Double-click [`start.bat`](start.bat) in File Explorer.
- **Option B**: In PowerShell, run:
  ```powershell
  .\start.ps1
  ```

This automatically launches:
1. **FastAPI Backend** on [http://localhost:8000](http://localhost:8000) (Swagger Docs at `/api/v1/docs`).
2. **Next.js Frontend** on [http://localhost:3000](http://localhost:3000) and opens your browser.

---

### Method 2: Docker Compose (For environments with Docker installed)

> **Note:** If Docker is installed, modern Docker uses `docker compose` (with a space) rather than legacy `docker-compose`.

```bash
# Clone the repository
git clone https://github.com/Miguel-Galrito/sat-health-api.git
cd sat-health-api

# Start backend and frontend containers
docker compose up --build
# Or with legacy Docker:
docker-compose up --build
```

---

### Method 3: Manual Terminal Setup

#### 1. Backend Setup (FastAPI & Python 3.11+)
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Linux / macOS
# On Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (Next.js 14)
Open a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Execute the comprehensive test suite verifying mathematics, validation, and endpoint integration:

```bash
cd backend
$env:PYTHONPATH="backend"; pytest tests/ -v
```

```text
============================= test session starts =============================
collected 9 items

backend/tests/test_api.py::test_health_endpoint PASSED                   [ 11%]
backend/tests/test_api.py::test_root_endpoint PASSED                     [ 22%]
backend/tests/test_api.py::test_ndvi_matrix_calculation_dense_vegetation PASSED [ 33%]
backend/tests/test_api.py::test_ndvi_matrix_calculation_bare_soil PASSED [ 44%]
backend/tests/test_api.py::test_ndvi_matrix_calculation_water PASSED     [ 55%]
backend/tests/test_api.py::test_colormap_thumbnail_generation PASSED     [ 66%]
backend/tests/test_api.py::test_analyze_validation_errors PASSED         [ 77%]
backend/tests/test_api.py::test_analyze_endpoint_real_or_fallback PASSED [ 88%]
backend/tests/test_api.py::test_timeseries_endpoint PASSED               [100%]

======================= 9 passed in 23s ========================
```

---

## 🚀 Production Deployment

### 1. Frontend on GitHub Pages
This repository includes an automated GitHub Actions deployment workflow:
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Every push to the `main` branch automatically triggers Next.js static compilation and publishes the dashboard to:
**[https://miguel-galrito.github.io/sat-health-api/](https://miguel-galrito.github.io/sat-health-api/)**

### 2. Backend on Railway / Render / AWS ECS
The backend includes a production-ready multi-stage [`Dockerfile`](backend/Dockerfile) with GDAL and C++ libraries pre-configured:
1. Connect this repository to **Railway** or **Render**.
2. Set the Root Directory to `backend`.
3. Set environment variables:
   - `ENVIRONMENT=production`
   - `DEBUG=False`
   - `CORS_ORIGINS=https://miguel-galrito.github.io,https://your-domain.com`

---

## 📜 License

This project is licensed under the terms of the [MIT License](LICENSE).

<div align="center">
  <sub>Engineered for precision agriculture and automated satellite Earth Observation.</sub>
</div>
