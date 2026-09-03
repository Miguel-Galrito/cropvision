# SatHealth Frontend (Next.js 14 + Tailwind CSS + Leaflet)

Interface web moderna e responsiva do micro-SaaS SatHealth para exploração e monitorização do vigor vegetativo agrícola através de satélites Copernicus Sentinel-2.

## ✨ Funcionalidades

- **Mapa Interativo (Leaflet & OpenStreetMap)**: Suporte a camadas vetoriais e de satélite em alta resolução, seleção de coordenadas por clique direto no globo e marcador pulsante animado.
- **Áreas Agrícolas de Demonstração (1-Clique)**: Herdade do Esporão (Alentejo), Fazenda Sorriso (Mato Grosso), Central Valley (Califórnia), Quinta do Vallado (Douro) e Albufeira de Alqueva.
- **Score NDVI & Barra Espectral**: Indicador com gradiente agronómico (Solo Seco -> Vegetação Esparsa -> Vegetação Moderada -> Vigor Intenso).
- **Visualização de Satélite**: Miniatura em cor verdadeira do sensor Sentinel-2 e mapa de calor (colormap RdYlGn) gerado pelo backend.
- **Estatísticas Zonais**: Mínimo, mediana, máximo e desvio padrão para avaliação da homogeneidade da parcela.
- **Série Temporal (Time-Series)**: Gráfico interativo com a evolução do índice nas últimas passagens orbitais.
- **Exportação**: Download de relatório analítico completo em formato JSON.

## 🚀 Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# Abrir http://localhost:3000
```

## 🌐 Variáveis de Ambiente

Configure no ficheiro `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```
