import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://cropvision-saas-mer9.vercel.app'
  ),
  title: 'CropVision SaaS — Agricultural Earth Observation & Satellite NDVI Intelligence',
  description:
    'B2B Earth Observation Deep-Tech SaaS for automated NDVI, Sentinel-1 SAR Radar moisture calculation, and ISO-BUS variable rate prescription maps.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CropVision',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/cropvision_icon.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/icon.svg',
    apple: '/cropvision_icon.jpg',
  },
  openGraph: {
    title: 'CropVision SaaS — Agricultural Earth Observation & Satellite Intelligence',
    description:
      'Copernicus Sentinel-2 & Sentinel-1 SAR Radar telemetry and ISO-BUS tractor prescription maps.',
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
    title: 'CropVision SaaS — Satellite NDVI & SAR Radar Intelligence',
    description: 'Precision Agriculture Earth Observation powered by Copernicus Sentinel STAC.',
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
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
