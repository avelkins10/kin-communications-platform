# API Standards

## Response Envelope
```
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: any }
  pagination?: { page: number; limit: number; total: number }
}
```

## Errors
- Centralized error mapping
- Correlation IDs and structured logs

## Auth
- NextAuth session checks
- Role-based access

## Performance
- Prisma patterns for Neon
- Caching boundaries
