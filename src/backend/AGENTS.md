# Backend Agent Rules

## Tech stack
- NestJS 11 + Prisma 7 + PostgreSQL + Redis
- Runs on **port 4000** (not 3000 — frontend uses 3000)
- Swagger docs available at `http://localhost:4000/api/docs`

## Module structure — MANDATORY for every new feature

```
src/modules/<name>/
├── <name>.module.ts          ← imports, providers, exports
├── application/
│   └── <name>.service.ts     ← business logic only
├── infrastructure/
│   └── <name>.repository.ts  ← extends BaseRepository, inject prisma.<model>
├── interface/
│   ├── <name>.controller.ts  ← @ApiTags, @ApiBearerAuth, HTTP mapping
│   └── dto/
│       ├── create-<name>.dto.ts
│       ├── update-<name>.dto.ts   ← PartialType(Create...)
│       └── <name>-query.dto.ts    ← extends PaginationDto
```

Never put business logic in controllers or database calls in services directly.

## Auth rules
- All routes require JWT by default (global `JwtAuthGuard`)
- Use `@Public()` to opt out — required for login, register, refresh, and public-facing GET endpoints
- Use `@Roles(Role.ADMIN)` for admin-only endpoints — the global `RolesGuard` handles enforcement

## Repository pattern
- Extend `BaseRepository<T, CreateInput, UpdateInput, WhereUniqueInput, WhereInput, OrderByInput>`
- Inject delegate: `super(prisma, prisma.<model> as any)` in constructor
- Use `softRemove()` instead of `remove()` for user-facing deletes
- Always filter `deletedAt: null` in service `findAll` / `findOne` queries

## Prisma schema conventions
- Every model has: `id String @id @default(uuid())`, `createdAt`, `updatedAt`, `deletedAt DateTime?`
- Enums go in the schema file above the models that use them
- After schema changes: `npx prisma migrate dev --name <description>`

## Response format — handled globally, do NOT replicate in services
All responses are automatically wrapped by `TransformInterceptor`:
```json
{ "success": true, "statusCode": 200, "timestamp": "...", "path": "...", "message": "...", "data": {} }
```
Controllers return `{ message: '...', data }` — the interceptor adds the wrapper.

## Cache key conventions
- Single entity: `<model>_<id>` (e.g. `user_abc123`)
- List queries: `<model>s_list_<JSON.stringify(query)>` (e.g. `users_list_{"page":1}`)
- Invalidate on every write: delete individual key + list key

## Validation DTOs
- Always use `class-validator` + `class-transformer`
- Add `@ApiProperty` / `@ApiPropertyOptional` to every field for Swagger
- Query DTOs extend `PaginationDto` from `src/common/dto/pagination.dto.ts`
