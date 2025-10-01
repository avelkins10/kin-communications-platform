import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  debug: true,
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

        const email = credentials.email as string;
        const password = credentials.password as string;

        // For development, create a user or find existing one
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          // Create a new user for development
          user = await prisma.user.create({
            data: {
              email,
              name: email.split('@')[0],
              role: 'admin', // Default to admin for development
            }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
      if (allowedDomain && user.email && user.email.endsWith(`@${allowedDomain}`)) return true;
      if (!allowedDomain && user.email) return true; // no restriction set
      
      // For Google OAuth, ensure user has a role
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (!existingUser) {
          // Create user with default role
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              role: 'user', // Default role for OAuth users
            }
          });
        }
      }
      
      return true;
    },
    async jwt({ token, user }) {
      console.log('[JWT] callback called', { hasUser: !!user, tokenId: token.id, tokenRole: token.role });

      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role || 'user';
        console.log('[JWT] User provided, set token', { id: token.id, role: token.role });
      }

      // If we have a user ID but no role, fetch it from the database
      if (token.id && !token.role) {
        console.log('[JWT] Fetching role from database for user', token.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true }
        });
        if (dbUser) {
          token.role = dbUser.role;
          console.log('[JWT] Role fetched from DB', token.role);
        }
      }

      console.log('[JWT] Returning token', { id: token.id, role: token.role });
      return token;
    },
    async session({ session, token }) {
      console.log('[SESSION] callback called', { hasToken: !!token, hasSessionUser: !!session.user });
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        console.log('[SESSION] Set session user', { id: token.id, role: token.role });
      }
      console.log('[SESSION] Returning session', session);
      return session;
    }
  }
};

