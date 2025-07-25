import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "est",
  description: "Add and manage your movie watchlist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#5E386E" />
        <meta name="apple-touch-icon" content="/icons/icon-192x192.png" />
        <meta name="est" content="Track entertainment and shows " />
      </head>
      <body>{children}</body>
    </html>
  );
}
