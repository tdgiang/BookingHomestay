# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack boilerplate with two separate applications:
- **Backend**: `src/backend/` — NestJS 11 + Prisma 7 + PostgreSQL + Redis (port **4000**)
- **Frontend**: `src/frontend/` — Next.js 16 + NextAuth v5 + Tailwind v4 + shadcn/ui (port **3000**) — **directory exists but is not yet scaffolded**

## Commands

### Infrastructure (at repo root)
```bash
docker compose up -d   # Start PostgreSQL (5432) + Redis (6379)
docker compose down    # Stop services
```

### Backend (`src/backend/`) — package manager: npm
```bash
npm run start:dev                              # Start with hot reload (port 4000)
npm run build && npm run start:prod
npm test                                       # Unit tests (Jest)
npm test -- --testPathPattern=users            # Run single test file by pattern
npm run test:e2e                               # E2E tests
npx prisma migrate dev --name <description>   # Run migration after schema change
npx prisma studio                              # Open Prisma Studio
npm run lint                                   # ESLint --fix
```

### Frontend (`src/frontend/`) — package manager: pnpm
```bash
pnpm dev     # Start dev server (port 3000)
pnpm build   # Production build
pnpm lint    # ESLint
```

## Architecture

### Backend — Clean Architecture per module

Every new module lives under `src/modules/<name>/` with this exact structure:

```
src/modules/<name>/
├── <name>.module.ts
├── application/
│   └── <name>.service.ts        # business logic only — no direct DB calls
├── infrastructure/
│   └── <name>.repository.ts     # extends BaseRepository, inject prisma.<model>
├── interface/
│   ├── <name>.controller.ts     # @ApiTags, @ApiBearerAuth, HTTP mapping
│   └── dto/
│       ├── create-<name>.dto.ts
│       ├── update-<name>.dto.ts  # PartialType(Create...)
│       └── <name>-query.dto.ts   # extends PaginationDto
```

**Global setup applied automatically to every route:**
- `JwtAuthGuard` — all routes require JWT by default; use `@Public()` to opt out (login, register, refresh, public GETs)
- `RolesGuard` — use `@Roles(Role.ADMIN)` for admin-only endpoints
- `ThrottlerGuard` — rate limiting via `THROTTLE_TTL` / `THROTTLE_LIMIT` env vars
- `TransformInterceptor` — wraps every response in `{ success, statusCode, timestamp, path, message, data, errors }`
- `AllExceptionsFilter` + `PrismaClientExceptionFilter` — normalizes errors

Controllers must return `{ message: '...', data }` — the interceptor adds the outer wrapper. Do NOT replicate the wrapper in services.

**`BaseRepository` pattern:**
```typescript
constructor(prisma: PrismaService) {
  super(prisma, prisma.user as any); // inject delegate, not a string model name
}
```
- Use `softRemove({ id })` for user-facing deletes (sets `deletedAt`)
- Always filter `deletedAt: null` in service `findAll`/`findOne` calls
- `findAll` returns `[T[], number]` (items + total count)

**Prisma schema conventions** — every model must have:
```prisma
id        String    @id @default(uuid())
createdAt DateTime  @default(now())
updatedAt DateTime  @updatedAt
deletedAt DateTime?
```
Enums go above the models that use them. After any schema change run `npx prisma migrate dev --name <description>`.

**Cache key conventions** (invalidate on every write):
- Single entity: `<model>_<id>` (e.g. `user_abc123`)
- List queries: `<model>s_list_<JSON.stringify(query)>` (e.g. `users_list_{"page":1}`)

**Validation DTOs:**
- Use `class-validator` + `class-transformer`
- Add `@ApiProperty` / `@ApiPropertyOptional` to every field for Swagger
- Query DTOs extend `PaginationDto` from `src/common/dto/pagination.dto.ts`

**Existing modules:** `AuthModule`, `UsersModule`, `ProductsModule`

**API:** `http://localhost:4000/api/v1` | Swagger: `http://localhost:4000/api/docs`

**Auth tokens:**
- Access token: 15m TTL — `JWT_SECRET` / `JWT_EXPIRATION`
- Refresh token: 7d TTL — `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRATION` — `POST /api/v1/auth/refresh`

### Frontend — Next.js App Router (planned)

Planned route groups:
- `(marketing)/` — public pages (home, about, contact)
- `(auth)/` — login / register
- `cms/` — protected admin dashboard

**Auth:** NextAuth v5 calls `POST /api/v1/auth/login`. Tokens stored in JWT session; access token auto-refreshed via `POST /api/v1/auth/refresh`.

**HTTP client:** `src/lib/api.ts` — handles `Authorization: Bearer` headers, throws `ApiError` on non-2xx.

**Forms:** `react-hook-form` + `zod` + `@hookform/resolvers/zod`.

**UI components:** shadcn/ui in `src/components/ui/`, split into `cms/`, `marketing/`, `shared/`.

## Environment

### Backend (`src/backend/.env`)
```
DATABASE_URL=postgresql://admin@localhost:5432/nest_boilerplate
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_HOST=localhost
REDIS_PORT=6379
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Frontend (`src/frontend/.env`)
Required: `AUTH_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:4000`

## ⚠️ Breaking changes to be aware of
- **Next.js 16**: May differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Tailwind CSS v4**: Configured via `globals.css` — no `tailwind.config.js`.
- **Prisma 7**: Uses `@prisma/adapter-pg` with connection pooling in `PrismaService`.
