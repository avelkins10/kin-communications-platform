import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Temporary bypass for development - allow any email/password
        return { 
          id: "dev-user-1", 
          email: credentials.email, 
          name: credentials.email.split('@')[0] 
        } as any;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
      if (allowedDomain && user.email && user.email.endsWith(`@${allowedDomain}`)) return true;
      if (!allowedDomain && user.email) return true; // no restriction set
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
};

export const { auth } = NextAuth(authOptions);


