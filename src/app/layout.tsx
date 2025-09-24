import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIN Communications Hub",
  description: "Enterprise communications platform powered by Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}


