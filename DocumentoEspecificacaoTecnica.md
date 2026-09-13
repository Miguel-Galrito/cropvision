# Product Requirement Document (PRD): CropVision SaaS (Whop + Sentinel-2 STAC)

## 1. Visão Geral do Produto
O **CropVision SaaS** é uma plataforma comercial B2B de Inteligência de Observação da Terra (Earth Observation) e monitorização automatizada de culturas agrícolas através da constelação **Copernicus Sentinel-2 (Level-2A Bottom-of-Atmosphere)**. 

O produtor ou consultor agrícola seleciona qualquer coordenada ou herdade no globo terrestre (por clique, inserção de coordenadas ou pesquisa geográfica Nominatim) e o sistema calcula e exibe em tempo real o índice **NDVI (Normalized Difference Vegetation Index)**, telemetria espectral zonal, diagnóstico agronómico de stress hídrico/vigor, e histórico multitemporal orbital.

---

## 2. Modelo de Monetização (Whop & 0€ Custos Fixos)

A máquina de vendas do CropVision SaaS é operada através da **Whop**, proporcionando cobrança segura, gestão automática de subscrições e faturação global com **zero custos fixos mensais** (comissão padrão de 3% sobre vendas):

### Planos Oficiais:
1. **CropVision Starter (49.00 € / mês)**:
   - 👉 `https://whop.com/cropvision/cropvision-starter/`
   - *Público-alvo*: Pequenos agricultores familiares e consultores agronómicos.
   - *Capacidades*: Até 10 parcelas monitorizadas, 1.000 requisições de satélite/mês, resolução de 10m, relatórios de campo standard.
2. **CropVision Pro Enterprise (149.00 € / mês)**:
   - 👉 `https://whop.com/cropvision/cropvision-pro-enterprise/`
   - *Público-alvo*: Grandes herdades, agro-indústrias, cooperativas e empresas AgTech.
   - *Capacidades*: Herdades e talhões ilimitados, 10.000 requisições/mês, telemetria espectral avançada (NDVI e TCI), exportação de **Relatórios PDF Executivos A4 sem marca de água**, histórico orbital completo e acesso via API REST.
3. **Paywall Suave (Soft Paywall)**:
   - 3 análises gratuitas diárias por utilizador (`localStorage`).
   - No 4º ponto ou no download do Relatório PDF Executivo, é apresentado o modal de conversão Whop.
   - Suporte secundário a faturação direta via Stripe Checkout.

---

## 3. Arquitetura Técnica

### Frontend (Next.js 14 / TypeScript / Tailwind CSS)
- **Design Aeroespacial**: Paleta graphite e petróleo (`#090d16` / `#0b1120`) com acentos esmeralda satélite (`#10b981`), painéis em *glassmorphism* e badge ao vivo `SENTINEL-2 L2A ORBIT: LIVE`.
- **Pesquisa Geográfica Global**: Integração com OpenStreetMap Nominatim e Google Maps Platform para geocodificação direta e reversa (cidade, região, país).
- **Calculadora de ROI Interativa**: Simulação de poupança anual em fertilizantes, rega e perdas por pragas para herdades de 50 a 5.000 hectares.
- **Relatório PDF Executivo**: Impressão limpa formatada em folha A4 com logótipo oficial, mapa NDVI, imagem True Color, tabela estatística zonal e histórico de passagens orbitais.
- **Modo Standalone 100% Client-Side**: O frontend consulta diretamente o STAC público da AWS Element84 (`sentinel-2-l2a`), permitindo deploy estático gratuito na Vercel ou GitHub Pages.

### Backend Opcional de Alto Desempenho (Python / FastAPI)
- **Runtime:** Python 3.11+
- **Bibliotecas:** `pystac-client`, `rasterio` (HTTP Range Requests em COGs S3), `numpy` para cálculo matricial vetorizado e `pydantic`.
- **Endpoints:**
  - `GET /api/v1/health`: Verificação de status do serviço.
  - `POST /api/v1/analyze`: Processamento radiométrico de bandas óticas B04 e B08.
  - `POST /api/v1/timeseries`: Histórico orbital de passagens do satélite.

---

## 4. Preservação do Núcleo Científico
- **Algoritmo de Deteção de Corpos de Água**: Massas de água oceânicas e marinhas (como no Atlântico ou Mediterrâneo) geram valores de NDVI negativos (-0.35) e são estritamente classificadas com etiqueta `"Water Body / Saturated Zone"`.