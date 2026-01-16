import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Admin UI Typography System
// Space Grotesk: Geometric sans with strong personality (alternative to Clash Display)
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: true,
});

// JetBrains Mono: Monospace font for code and technical elements
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MSME Mitr - Your Business Growth Partner",
  description: "Multilingual advisory system for MSMEs to discover and apply for government schemes. Access 11+ schemes, get instant help in 12 Indian languages.",
  applicationName: "MSME Mitr",
  authors: [{ name: "Ministry of MSME, Government of India" }],
  keywords: ["MSME", "government schemes", "business loans", "subsidies", "entrepreneurship", "India", "small business", "startup"],
  creator: "MSME Mitr Team",
  publisher: "Government of India",
  formatDetection: {
    telephone: true,
    date: true,
    email: true,
    address: true,
  },
  openGraph: {
    title: "MSME Mitr - Your Business Growth Partner",
    description: "Discover government schemes for your business growth",
    url: "https://msmemitr.gov.in",
    siteName: "MSME Mitr",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MSME Mitr - Your Business Growth Partner",
    description: "Discover government schemes for your business growth",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MSME Mitr",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F", // Dark theme background color
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`dark ${plusJakarta.variable} ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MSME Mitr" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Theme initialization script - runs before React hydration */}
        {/* Requirement 14.5: Initialize theme before hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Always apply dark theme (Minimalist Dark design)
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                  // Store preference for future light mode support
                  localStorage.setItem('theme', 'dark');
                } catch (e) {
                  // Gracefully handle localStorage unavailability (Requirement 14.6)
                  // Dark class will still be applied via CSS
                  console.warn('Failed to initialize theme:', e);
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        {/* Skip link for keyboard navigation - Requirement 12.3 */}
        <a
          href="#main-content"
          className="sr-only"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                className: "text-base",
                duration: 3000,
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
