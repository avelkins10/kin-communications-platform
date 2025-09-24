# KIN Communications Hub

## Data Fetching Strategy

For now, we are not adopting React Query. The app uses lightweight, manual `fetch` calls inside hooks like `src/lib/hooks/use-contacts.ts` with consistent loading/error state handling and explicit refresh methods. We can revisit `@tanstack/react-query` later if we add real-time invalidation, background refetch, or cross-page caching requirements.

# KIN Communications Hub

Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL.

- Install: `pnpm install`
- Env: `cp .env.example .env`
- Prisma: `pnpm prisma:generate && pnpm prisma:migrate`
- Dev: `pnpm dev` → http://localhost:3000

Core navigation: Queue, Contacts, History, Settings. Auth via NextAuth Credentials.
