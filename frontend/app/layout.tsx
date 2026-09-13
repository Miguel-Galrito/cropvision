import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://miguel-galrito.github.io/sat-health-api'),
  title: 'CropVision SaaS — Agricultural Earth Observation & Satellite NDVI Intelligence',
  description:
    'B2B Earth Observation Micro-SaaS for automated NDVI calculation, crop canopy vigor diagnosis, and precision agriculture monitoring via Copernicus Sentinel-2 open STAC.',
  icons: {
    icon: '/cropvision_icon.jpg',
    apple: '/cropvision_icon.jpg',
  },
  openGraph: {
    title: 'CropVision SaaS — Agricultural Earth Observation & Satellite NDVI Intelligence',
    description:
      'B2B Earth Observation Micro-SaaS for automated NDVI calculation, crop canopy vigor diagnosis, and precision agriculture monitoring via Copernicus Sentinel-2 open STAC.',
    type: 'website',
    images: [
      {
        url: '/cropvision_banner.jpg',
        width: 1200,
        height: 675,
        alt: 'CropVision SaaS - Orbital Agricultural Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CropVision SaaS — Satellite NDVI Intelligence',
    description: 'Precision Agriculture Earth Observation powered by Copernicus Sentinel-2 STAC.',
    images: ['/cropvision_banner.jpg'],
  },
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
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 font-sans">
        {children}
      </body>
    </html>
  );
}
