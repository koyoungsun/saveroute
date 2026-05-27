import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { FontScaleProvider } from "@/components/settings/FontScaleProvider";

import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STORAGE_KEY,
  FONT_SCALE_STEP,
} from "@/lib/settings/font-scale";

import "./globals.css";

const FONT_SCALE_BOOTSTRAP = `(function(){try{
  var k=${JSON.stringify(FONT_SCALE_STORAGE_KEY)};
  var raw=localStorage.getItem(k);
  if(raw==null)return;
  var n=parseInt(raw,10);
  if(n!==n||n<${FONT_SCALE_MIN}||n>${FONT_SCALE_MAX}||n%${FONT_SCALE_STEP}!==0)return;
  document.documentElement.style.setProperty("--font-scale", String(n/100));
}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spoqaHanSansNeoCss =
  "https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css";

export const metadata: Metadata = {
  title: "SaveRoute",
  description: "나를 위한 최적의 할인 루트",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SaveRoute",
  },
  icons: {
    icon: [
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1024",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href={spoqaHanSansNeoCss} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="saveroute-font-scale-boot" strategy="beforeInteractive">
          {FONT_SCALE_BOOTSTRAP}
        </Script>
        <FontScaleProvider>{children}</FontScaleProvider>
      </body>
    </html>
  );
}
