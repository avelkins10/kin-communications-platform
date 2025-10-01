import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { SocketProvider } from "@/components/socket-provider";
import { RealtimeNotifications } from "@/components/ui/realtime-notifications";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: "KIN Communications Hub",
  description: "Enterprise communications platform powered by Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <SocketProvider>
            <ErrorBoundary>
              {children}
              <RealtimeNotifications />
              <Toaster position="top-right" richColors />
            </ErrorBoundary>
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


