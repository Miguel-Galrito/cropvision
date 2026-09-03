import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SatHealth - Monitorização de Vegetação por Satélite (Sentinel-2)',
  description:
    'Micro-SaaS B2B para análise automatizada de NDVI, vigor vegetal e saúde de parcelas agrícolas com dados abertos Copernicus Sentinel-2.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
