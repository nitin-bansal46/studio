// src/app/layout.tsx
'use client'; // Required for useEffect

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/AppContext';
import React, { useEffect } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata cannot be exported from a Client Component.
// This object can be used by the component itself if needed, but Next.js
// will not pick it up for <head> tag generation from here.
// For App Router, metadata should ideally be in a server component layout.
const metadata: Metadata = {
  title: 'WageWise - Attendance & Salary Management',
  description: 'Manage worker attendance and salaries efficiently with WageWise.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const storedTheme = localStorage.getItem('wagewise-theme');
    if (
      storedTheme === 'light' ||
      (!storedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)
    ) {
      document.documentElement.classList.add('light');
      if (!storedTheme) localStorage.setItem('wagewise-theme', 'light'); // Persist if system preference was dark
    } else {
      document.documentElement.classList.remove('light');
      if (!storedTheme) localStorage.setItem('wagewise-theme', 'dark'); // Persist if system preference was light
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* You can manually add title and meta tags here if needed, 
            or preferably manage metadata via server components/page.tsx files */}
        <title>{String(metadata.title)}</title>
        {metadata.description && <meta name="description" content={metadata.description} />}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
