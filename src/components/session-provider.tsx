"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import * as React from "react";

type Props = {
  children: React.ReactNode;
};

export function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}


