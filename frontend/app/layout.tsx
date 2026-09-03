import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SatHealth - Earth Observation & Vegetation Health Monitoring (Sentinel-2)',
  description:
    'B2B Micro-SaaS for automated NDVI calculation, crop canopy vigor, and precision agriculture monitoring via Copernicus Sentinel-2 open STAC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
