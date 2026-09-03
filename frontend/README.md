# SatHealth Frontend (Next.js 14 + Tailwind CSS + Leaflet)

Modern, responsive web dashboard for the **SatHealth** Earth Observation Micro-SaaS, enabling interactive vegetation vigor and crop health exploration via Copernicus Sentinel-2 satellites.

---

## ✨ Features

- **Interactive Geospatial Map (Leaflet)**:
  - SSR-safe integration supporting high-resolution Esri World Imagery (satellite) and CartoDB Voyager (street map).
  - Target crosshair with radar pulse animation and dynamic bounding box rectangle illustrating the sampled spatial window.
  - Direct coordinate selection on map click.
- **1-Click Agricultural Demo Presets**:
  - *Esporão Estate* (Alentejo, Portugal) - Vineyards & Olive Groves.
  - *Cerrado Farm* (Sorriso, Mato Grosso, Brazil) - Large-Scale Soybean & Corn.
  - *Central Valley* (Fresno, California, USA) - Drip-Irrigated Almond & Citrus Orchards.
  - *Quinta do Vallado* (Douro Valley, Portugal) - Terraced Hillside Vineyards.
  - *Alqueva Reservoir* (Portugal) - Open Water Calibrator.
- **NDVI Score Gauge & Spectral Color Bar**: Visual gradient indicator (Bare Soil $\rightarrow$ Moisture Stress $\rightarrow$ Moderate $\rightarrow$ Vigorous Canopy).
- **Dual Satellite Views**: Side-by-side comparison between **True Color (RGB)** and server-rendered **NDVI Spectral Heatmap**.
- **Zonal Statistics**: Minimum, median, maximum, and standard deviation (spatial canopy homogeneity).
- **Historical Time-Series Trend**: Interactive SVG trend chart tracking vegetation index across recent orbital passes.
- **Report Export**: Instant JSON analysis report download.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🌐 Environment Variables

Configure in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```
