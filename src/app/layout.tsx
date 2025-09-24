import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "KIN Communications Hub",
  description: "Enterprise communications platform powered by Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}


