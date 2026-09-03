# SatHealth Backend (FastAPI + GDAL/Rasterio)

Serviço de alta performance para consulta de dados de satélite Copernicus Sentinel-2 L2A via catálogo STAC aberto e cálculo matricial de NDVI (Normalized Difference Vegetation Index).

## 🚀 Tecnologias

- **FastAPI**: Framework web assíncrono e tipado.
- **Pydantic v2 & Pydantic Settings**: Validação rigorosa de payloads e configuração.
- **pystac-client**: Descoberta de coleções e itens geoespaciais em catálogos STAC abertos da AWS / Copernicus.
- **Rasterio & GDAL**: Leitura eficiente de Cloud Optimized GeoTIFFs (COGs) via HTTP Range Requests (Bandas 4 e 8).
- **NumPy**: Processamento de matrizes de refletância e estatísticas zonais.
- **Matplotlib & Pillow**: Renderização de mapa de calor NDVI (RdYlGn) em base64 PNG.

## 📡 Endpoints Principais

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/health` | Verificação de integridade e conectividade com o catálogo STAC |
| `POST` | `/api/v1/analyze` | Análise de NDVI para coordenadas (`lat`, `lon`, `max_cloud_cover`) |
| `POST` | `/api/v1/timeseries` | Histórico de capturas e evolução temporal de vegetação |
| `GET` | `/api/v1/docs` | Documentação interativa Swagger / OpenAPI |

## 🛠️ Execução Local

```bash
# 1. Ativar ambiente virtual
source .venv/bin/activate  # ou .venv\Scripts\activate no Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Executar o servidor
uvicorn app.main:app --reload --port 8000
```

## 🐳 Execução com Docker

```bash
docker build -t sathealth-backend .
docker run -p 8000:8000 sathealth-backend
```
