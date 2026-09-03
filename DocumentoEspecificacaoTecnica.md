# Product Requirement Document (PRD): SatHealth API & Dashboard

## 1. Visão Geral do Produto
O SatHealth é um protótipo de micro-SaaS B2B para monitorização automatizada de vegetação e saúde de terrenos agrícolas através de dados públicos de satélite (Copernicus Sentinel-2). O utilizador seleciona uma coordenada ou área geográfica e o sistema calcula e exibe o índice NDVI (Normalized Difference Vegetation Index) histórico e atual.

## 2. Arquitetura Técnica

### Backend (Python / FastAPI)
- **Runtime:** Python 3.11+
- **Framework:** FastAPI (totalmente assíncrono)
- **Bibliotecas Principais:**
  - `pystac-client`: Pesquisa de catálogos STAC abertos da AWS / Copernicus.
  - `rasterio`: Leitura eficiente de ficheiros Cloud Optimized GeoTIFF (COG) via HTTP Range Requests (apenas bandas 4 e 8).
  - `numpy`: Cálculo matricial da fórmula: NDVI = (B8 - B4) / (B8 + B4).
  - `pydantic`: Validação estrita de entradas e saídas.
- **Endpoints:**
  - `GET /api/v1/health`: Verificação de status do serviço.
  - `POST /api/v1/analyze`: Recebe coordenadas `{ "lat": float, "lon": float, "max_cloud_cover": float }` e retorna o valor médio de NDVI, data da captura e URL do thumbnail processado.

### Frontend (Next.js / TypeScript)
- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + Lucide Icons + `shadcn/ui`
- **Componente de Mapa:** `react-leaflet` ou MapLibre GL com mapa base OpenStreetMap.
- **Fluxo de Utilizador:**
  1. O utilizador clica numa coordenada no mapa interativo.
  2. O frontend faz um pedido POST ao backend FastAPI.
  3. Apresenta o indicador de loading com estados visuais claros.
  4. Exibe os resultados num cartão lateral: Score NDVI (com barra de cor verde/amarelo/castanho) e metadados da imagem de satélite.

## 3. Segurança e Resiliência
- Implementação de CORS restrito no FastAPI para aceitar pedidos da origem do frontend.
- Tratamento de exceções para áreas com cobertura de nuvens excessiva (> 20%) ou falha de leitura nos servidores de dados públicos.
- Gestão de variáveis de ambiente via `.env` (chaves de API, portas e configurações de CORS).