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
      <body>{children}</body>
    </html>
  );
}
