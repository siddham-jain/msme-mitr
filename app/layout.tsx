import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
  themeColor: "#FF6B35",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Check system preference
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {
                  console.warn('Failed to initialize theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
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
