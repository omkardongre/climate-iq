import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { KeyboardNavigationProvider } from "@/components/ui/keyboard-navigation-provider";
import { ThemeProvider } from "@/components/theme-provider";
import StoryblokProvider from "@/components/StoryblokProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateIQ AI - Climate Action for Everyone",
  description:
    "AI-powered climate platform with comprehensive accessibility features. Voice navigation, screen reader support, and inclusive design make environmental action accessible to everyone. ClimateIQ AI - Your accessible climate companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoryblokProvider>
      <html lang="en">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
        >
          <ThemeProvider>
            <KeyboardNavigationProvider>
              <AuthProvider>
                <main id="main-content" tabIndex={-1}>
                  <Suspense fallback={null}>{children}</Suspense>
                </main>
              </AuthProvider>
            </KeyboardNavigationProvider>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </StoryblokProvider>
  );
}
