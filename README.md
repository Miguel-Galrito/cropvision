<div align="center">

# 🛰️ SatHealth API & Dashboard
### **Earth Observation Intelligence & Automated Vegetation Monitoring Micro-SaaS**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Sentinel-2](https://img.shields.io/badge/Copernicus-Sentinel--2_L2A-003399?style=for-the-badge)](https://sentinels.copernicus.eu/)

<p align="center">
  <b>Protótipo funcional de micro-SaaS B2B para monitorização em tempo real da saúde de parcelas agrícolas e cálculo automatizado de NDVI via dados abertos do satélite Copernicus Sentinel-2.</b>
</p>

[Funcionalidades](#-funcionalidades-chave) •
[Arquitetura](#-arquitetura-do-sistema) •
[Como Executar](#-início-rápido) •
[Documentação da API](#-especificação-da-api-fastapi) •
[Deployment](#-deployment-produção)

</div>

---

## 🌿 O Que é o SatHealth?

O **SatHealth** é uma plataforma moderna de **Observação da Terra (Earth Observation - EO)** concebida para produtores agrícolas, consultores de agrotecnologia e gestores florestais. 

Ao selecionar qualquer coordenada ou exploração agrícola no globo, o motor geoespacial pesquisa o catálogo STAC aberto mais recente da constelação **Copernicus Sentinel-2 (L2A - Bottom-of-Atmosphere)**, descarrega apenas as janelas espaciais das Bandas Espectrais necessárias através de **HTTP Range Requests** em Cloud Optimized GeoTIFFs (COGs), calcula o índice **NDVI (Normalized Difference Vegetation Index)** com matrizes NumPy e renderiza um mapa de calor agronómico com série temporal histórica.

---

## ✨ Funcionalidades Chave

- 🛰️ **Pipeline Geoespacial Serverless & Rápido**:
  - Leitura seletiva de COG via `rasterio` (janela de amostragem de ~500m/1000m) sem descarregar ficheiros de centenas de megabytes.
  - Zero necessidade de chaves pagas: consome o catálogo aberto STAC da Element84 / AWS (`sentinel-2-l2a`).
- 📊 **Cálculo Matricial de NDVI**:
  $$\text{NDVI} = \frac{\text{B8 (NIR)} - \text{B4 (Red)}}{\text{B8 (NIR)} + \text{B4 (Red)}}$$
  - Estatísticas zonais completas: **Média, Mediana, Mínimo, Máximo e Desvio Padrão** (homogeneidade da biomassa).
- 🎨 **Visualização Agronómica Dinâmica**:
  - Geração automática de miniatura colorizada em Base64 PNG com colormap espectral `RdYlGn` (Solo $\rightarrow$ Vegetação Esparsa $\rightarrow$ Vigor Saudável).
  - Comparação lado a lado entre **Cor Verdadeira (RGB)** e o **Mapa de Calor NDVI**.
- 🗺️ **Dashboard Interativo (Next.js 14 + Leaflet)**:
  - Alternância entre camada vetorial (CartoDB) e satélite de alta resolução (Esri World Imagery).
  - Marcador pulsante de alvo e retângulo de delimitação espacial da amostragem (bounding box).
  - **Presets com 1-Clique**: Herdade do Esporão (Alentejo), Fazenda Sorriso (Mato Grosso), Central Valley (Califórnia), Quinta do Vallado (Douro) e Albufeira de Alqueva.
- 📈 **Série Temporal Histórica**:
  - Gráfico interativo com a evolução do índice nas últimas passagens orbitais do satélite.
- 🛡️ **Resiliência e Tratamento Rigoroso de Erros**:
  - Resposta estruturada `HTTP 422` para zonas com cobertura de nuvens superior ao limite configurável (`max_cloud_cover`), sugerindo ações corretivas.
  - Fallback sintético calibrado para continuidade operacional em caso de instabilidade pontual nos servidores S3 públicos.
- 📥 **Exportação de Dados**: Download instantâneo de relatórios técnicos em formato JSON.

---

## 🏛️ Arquitetura do Sistema

```mermaid
flowchart TD
    subgraph Frontend["Frontend (Next.js 14 App Router)"]
        UI["Dashboard Interativo (Tailwind CSS)"]
        Map["Mapa Leaflet SSR-Safe (CartoDB / Esri Satellite)"]
        Presets["Seletor de Explorações com 1-Clique"]
        Panel["Painel Lateral: NDVI Score, Heatmap, Gráfico"]
    end

    subgraph Backend["Backend (FastAPI Assíncrono)"]
        API["FastAPI REST Router (/api/v1)"]
        Pydantic["Validação Estrita Pydantic v2"]
        STACService["STAC Query Service (pystac-client)"]
        NDVIService["Rasterio COG Window Reader & NumPy Engine"]
        ThumbnailService["Matplotlib & Pillow Colormap Generator"]
    end

    subgraph DataSources["Fontes de Dados Públicas (Copernicus)"]
        STACCatalog["AWS Element84 STAC Catalog (sentinel-2-l2a)"]
        S3COGs["Amazon S3 COG Bucket (B04 Red & B08 NIR)"]
    end

    Map -->|1. Coordenadas (lat, lon)| UI
    Presets -->|1. Coordenadas predefinidas| UI
    UI -->|2. POST /api/v1/analyze| API
    API --> Pydantic
    Pydantic --> STACService
    STACService -->|3. Pesquisa Órbita & Nuvens| STACCatalog
    STACCatalog -->|4. Retorna Metadata & Links COG| STACService
    STACService --> NDVIService
    NDVIService -->|5. HTTP Range Requests (Bandas 4 e 8)| S3COGs
    NDVIService -->|6. Matriz NumPy NDVI = (B8-B4)/(B8+B4)| NDVIService
    NDVIService --> ThumbnailService
    ThumbnailService -->|7. Gera Base64 PNG RdYlGn| API
    API -->|8. JSON: NDVI stats, diagnóstico, thumbnails| Panel
```

---

## 📁 Estrutura do Repositório

```text
sat-health-api/
├── backend/                       # Serviço Backend FastAPI
│   ├── app/
│   │   ├── api/v1/                # Routers da API
│   │   │   ├── endpoints/
│   │   │   │   ├── health.py      # GET /api/v1/health (status e conectividade STAC)
│   │   │   │   └── analyze.py     # POST /api/v1/analyze e POST /api/v1/timeseries
│   │   │   └── api.py             # Agregação de rotas v1
│   │   ├── core/
│   │   │   ├── config.py          # Configurações com Pydantic Settings
│   │   │   └── logging.py         # Logging estruturado
│   │   ├── schemas/
│   │   │   └── analysis.py        # Schemas Pydantic v2 estritos
│   │   ├── services/
│   │   │   ├── stac_service.py    # Motor de pesquisa STAC Sentinel-2
│   │   │   └── ndvi_service.py    # Leitor de COGs e cálculo de NDVI
│   │   └── main.py                # Ponto de entrada FastAPI, CORS e handlers
│   ├── tests/
│   │   └── test_api.py            # Suite de testes Pytest (9 testes automatizados)
│   ├── Dockerfile                 # Imagem de produção (Debian Slim + GDAL)
│   ├── docker-compose.yml         # Orquestração local do backend
│   ├── requirements.txt           # Dependências pinadas
│   └── .env.example               # Exemplo de variáveis de ambiente
│
├── frontend/                      # Aplicação Frontend Next.js 14
│   ├── app/
│   │   ├── layout.tsx             # Layout root com Leaflet styles e tema escuro
│   │   ├── page.tsx               # Dashboard principal
│   │   └── globals.css            # Tailwind directives e animações customizadas
│   ├── components/
│   │   ├── Map.tsx                # Mapa Leaflet interativo
│   │   ├── MapWrapper.tsx         # Dynamic loader SSR-safe
│   │   ├── AnalysisPanel.tsx      # Cartão lateral de resultados e métricas
│   │   ├── PresetSelector.tsx     # Barra de áreas agrícolas predefinidas
│   │   ├── TimeSeriesChart.tsx    # Gráfico temporal SVG
│   │   ├── LoadingState.tsx       # Indicador visual multi-etapa
│   │   └── Navbar.tsx             # Header com status e coordenadas
│   ├── lib/
│   │   ├── api.ts                 # Cliente HTTP tipado com tratamento de erros
│   │   ├── types.ts               # Tipos TypeScript alinhados com o Pydantic
│   │   └── presets.ts             # Coordenadas de demonstração mundiais
│   ├── Dockerfile                 # Imagem de produção Node.js multi-stage
│   ├── package.json               # Dependências do frontend
│   └── .env.example               # Configuração do URL da API
│
├── docker-compose.yml             # Orquestração completa de Backend + Frontend
├── DocumentoEspecificacaoTecnica.md
└── README.md
```

---

## ⚡ Início Rápido

### Opção 1: Via Docker Compose (Recomendado)

Clone o repositório e inicie ambos os serviços com um único comando:

```bash
git clone https://github.com/Miguel-Galrito/sat-health-api.git
cd sat-health-api

# Iniciar backend e frontend simultaneamente
docker-compose up --build
```

- **Frontend**: Aceda a [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: Aceda a [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

### Opção 2: Execução Local

#### 1. Backend (FastAPI)
```bash
cd backend

# Criar e ativar o ambiente virtual
python -m venv .venv
source .venv/bin/activate   # Linux / macOS
# ou no Windows:
.venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Next.js 14)
Num novo terminal:
```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```
Abra o navegador em `http://localhost:3000`.

---

## 🧪 Testes Automatizados

O backend conta com uma suíte de testes com cobertura matemática, validação de schemas e integração de endpoints:

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

======================= 9 passed in 26s ========================
```

---

## 📡 Especificação da API (FastAPI)

### `GET /api/v1/health`
Verifica a integridade do serviço e a conectividade com o catálogo público STAC.

**Exemplo de Resposta:**
```json
{
  "status": "healthy",
  "app_name": "SatHealth API",
  "version": "1.0.0",
  "environment": "development",
  "stac_catalog_status": "connected",
  "timestamp": "2026-09-03T00:30:41.082679+00:00"
}
```

---

### `POST /api/v1/analyze`
Submete coordenadas geográficas para extração de refletâncias e cálculo de NDVI.

**Corpo da Requisição (`AnalyzeRequest`):**
```json
{
  "lat": 38.3842,
  "lon": -7.5519,
  "max_cloud_cover": 20.0,
  "buffer_meters": 500.0
}
```

**Exemplo de Resposta (`AnalyzeResponse`):**
```json
{
  "success": true,
  "scene_id": "S2C_29SPC_20260902_0_L2A",
  "platform": "Sentinel-2",
  "acquisition_date": "2026-09-02T11:20:41.806000Z",
  "cloud_cover_percentage": 0.0,
  "coordinates": {
    "lat": 38.3842,
    "lon": -7.5519
  },
  "bbox": [-7.557621, 38.379708, -7.546179, 38.388692],
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
    "label": "Vegetação Densa e Saudável",
    "badge_color": "emerald",
    "description": "Dossel vegetal vigoroso com alto índice de área foliar e intensa atividade fotossintética.",
    "recommendation": "Condições ideais de desenvolvimento. Manter regime atual de rega e nutrição."
  },
  "thumbnail_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "true_color_thumbnail": "https://sentinel-cogs.s3.us-west-2.amazonaws.com/.../thumbnail.jpg",
  "is_simulated": false,
  "processing_time_ms": 7567.87
}
```

---

### `POST /api/v1/timeseries`
Gera a linha de evolução histórica temporal com base nas últimas passagens orbitais do Sentinel-2.

---

## 🚀 Deployment (Produção)

### Backend no Railway / Render / AWS ECS
O backend inclui um [`Dockerfile`](file:///c:/Users/mapga/Desktop/Prot%C3%B3tipo%20de%20SaaS%20de%20Sat%C3%A9lite/backend/Dockerfile) com dependências GDAL prontas. Para fazer deploy:
1. Conecte o repositório GitHub ao **Railway** ou **Render**.
2. Defina o *Root Directory* como `backend`.
3. Adicione as variáveis de ambiente:
   - `ENVIRONMENT=production`
   - `DEBUG=False`
   - `CORS_ORIGINS=https://seu-frontend.vercel.app`

### Frontend na Vercel
1. Conecte o repositório à **Vercel**.
2. Defina o *Root Directory* como `frontend`.
3. Adicione a variável de ambiente:
   - `NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app/api/v1`
4. Deploy automático com suporte nativo a Next.js 14!

---

## 📜 Licença

Este projeto está sob a licença [MIT](LICENSE).

<div align="center">
  <sub>Construído com paixão para inovação na agricultura de precisão e observação espacial.</sub>
</div>
