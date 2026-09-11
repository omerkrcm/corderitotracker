import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/profile-context";
import { ProfilePicker } from "@/components/ProfilePicker";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Corderito Tracker",
  description: "Household calorie & protein tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Corderito Tracker",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1611" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ProfileProvider>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
            <h1 className="flex items-center gap-1.5 text-base font-semibold">
              <span aria-hidden>🐑</span>
              Corderito Tracker
            </h1>
            <ProfilePicker />
          </header>
          <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
            {children}
          </main>
          <BottomNav />
        </ProfileProvider>
      </body>
    </html>
  );
}
