import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const SITE_URL = "https://moodworld.vercel.app";
const OG_TITLE = "MoodWorld — one tap a day, the world's mood";
const OG_DESCRIPTION =
  "Pick today's mood in one tap. See how the whole world is feeling — happiest and toughest places, mood by age, and trends over time.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MoodWorld" },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    siteName: "MoodWorld",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MoodWorld — one tap a day, the world's mood" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F2823C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
