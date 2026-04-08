# PetZone — Claude Code Instructions

## Project Overview
PetZone is a pet hotel booking platform for the Vietnam market. Two-sided marketplace connecting pet owners with verified pet hotels/boarding facilities. BRD reference: `../pet-project-BRD/BRD/BRD-01_pet_hotel_search/`.

## Architecture
Monorepo (Turborepo + pnpm). Three apps, six shared packages.

| App / Package | Tech | Port | Purpose |
|---------------|------|------|---------|
| `apps/api` | NestJS 11 | 3001 | REST API + WebSocket. Swagger at `/api/docs` |
| `apps/web` | Next.js 16 | 3000 | Static landing/marketing site |
| `apps/web-admin` | Next.js 16 | 3002 | Admin dashboard |
| `packages/shared` | TS | — | Types + constants |
| `packages/validators` | Zod | — | Validation schemas (shared between API + mobile) |
| `packages/supabase` | TS | — | Typed Supabase clients (browser/server/admin) |
| `packages/ui` | React | — | Shared UI components (Tailwind + CVA) |
| `packages/config-typescript` | JSON | — | Shared tsconfig bases |
| `packages/config-eslint` | JS | — | Shared ESLint config |

## Package Imports
Always use workspace packages — never initialize Supabase clients directly.
- `@petzone/shared` — types and constants
- `@petzone/validators` — Zod schemas for all entities
- `@petzone/ui` — shared React components
- `@petzone/supabase` — typed Supabase clients
  - `@petzone/supabase/client` — browser client (Next.js client components)
  - `@petzone/supabase/server` — SSR client (Next.js server components)
  - `@petzone/supabase/admin` — service role client (NestJS only, never expose to frontend)

## Commands
- `pnpm dev` — start all apps
- `pnpm build` — build all apps
- `pnpm lint` — lint all
- `pnpm typecheck` — type check all
- `pnpm test` — run all tests
- `pnpm format` — prettier format all
- `pnpm db:generate` — regenerate Supabase types into packages/supabase/src/types.ts
- `pnpm db:migrate` — push migrations to local Supabase
- `supabase start` — start local Supabase (DB, Auth, Storage, Studio)

## Naming Conventions
| Context | Convention | Example |
|---------|-----------|---------|
| Files & folders | `kebab-case` | `order-status.tsx`, `create-pet.dto.ts` |
| React components | `PascalCase` | `ProviderCard`, `OrderTimeline` |
| Hooks | `camelCase` + `use` prefix | `useAuth`, `useRealtimeChat` |
| NestJS modules | `kebab-case` folder, `PascalCase` class | `src/modules/status-reports/`, `StatusReportsModule` |
| API routes | `kebab-case` | `/api/status-reports`, `/api/add-on-services` |
| DB tables & columns | `snake_case` | `order_status_history`, `check_in_date` |
| Env vars | `UPPER_SNAKE_CASE` | `SUPABASE_SERVICE_ROLE_KEY` |
| Constants | `UPPER_SNAKE_CASE` | `ORDER_STATUSES`, `PAYMENT_METHODS` |
| Types/Interfaces | `PascalCase` | `OrderStatus`, `ProviderResponse` |

## NestJS API Patterns

### Module Structure
`module.ts` → `controller.ts` → `service.ts` → `dto.ts` (Swagger only)

### Authentication & Authorization
- **Auth guard**: `SupabaseAuthGuard` (global). Use `@Public()` to skip auth.
- **JWT verification**: Local via `jose` library with fallback to Supabase `auth.getUser()`. Issuer: `${SUPABASE_URL}/auth/v1`
- **Roles**: `@Roles('admin')`, `@Roles('provider')` with `RolesGuard`. Role stored in `auth.users.app_metadata.role` — must sync via `auth.admin.updateUserById()` when role changes.
- **Current user**: `@CurrentUser() user: AuthUser` decorator. Type: `src/common/interfaces/auth-user.ts`
- **Supabase client**: Use `this.supabase.client` (service role, bypasses RLS) for DB operations. Use `this.supabase.createAuthClient()` (anon key) for `signInWithPassword`/`refreshSession` — NEVER call these on the service role client (it mutates internal auth state).

### Validation (CRITICAL — follow exactly)
- **Zod schemas**: Defined in `@petzone/validators`. Every `@Body()` param MUST have a Zod validation pipe.
- **Pipe placement**: Apply on the `@Body()` parameter, NOT with `@UsePipes()` at method level.
  ```ts
  // CORRECT — pipe on @Body() only
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createPetSchema)) body: CreatePetInput) {}
  
  // WRONG — @UsePipes runs on ALL params including @CurrentUser(), breaks validation
  @UsePipes(new ZodValidationPipe(createPetSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePetInput) {}
  ```
- **Query validation**: Use `ZodQueryValidationPipe` for `@Query()` params (coerces strings to numbers).
  ```ts
  search(@Query(new ZodQueryValidationPipe(searchSchema)) query: SearchInput) {}
  ```
- **Types**: Import Zod-inferred types from `@petzone/validators` for service method params. DTO classes in `dto.ts` are for Swagger only.

### Database Queries
- **Column constants**: Use constants from `src/common/constants/columns.ts` — NEVER use `select('*')`.
  ```ts
  import { PET_COLUMNS } from '../../common/constants/columns';
  this.supabase.client.from('pets').select(PET_COLUMNS)
  ```
- **Joins**: Construct select strings for joins:
  ```ts
  .select(`${ORDER_LIST_COLUMNS}, providers(id, business_name)`)
  ```
- **Supabase join types**: PostgREST joins may return arrays or objects. Handle both:
  ```ts
  const p = order.providers;
  const userId = Array.isArray(p) ? p[0]?.user_id : p?.user_id;
  ```

### Pagination
- All list endpoints MUST be paginated using `paginate()` from `src/common/utils/pagination.ts`.
- Import `PAGINATION` from `@petzone/shared` for defaults (DEFAULT_LIMIT=20, MAX_LIMIT=100).
  ```ts
  // Controller
  findAll(@CurrentUser() user: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(user.id, {
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    });
  }
  
  // Service
  async findAll(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;
    const { data, error, count } = await this.supabase.client
      .from('table').select(COLUMNS, { count: 'exact' })
      .eq('user_id', userId).range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }
  ```

### Caching
- Use `@nestjs/cache-manager` (globally registered). Inject: `@Inject(CACHE_MANAGER) private readonly cache: Cache`
- Cache static/slow-changing data: breeds (24h), provider profiles (5min), admin dashboard (1min), admin config (10min)
- Invalidate cache after mutations: `await this.cache.del(cacheKey)`

### Rate Limiting
- Global: 100 req/60s (safety net via `ThrottlerModule`)
- Auth endpoints: `@Throttle({ default: { ttl: 60000, limit: 3-5 } })`
- Upload endpoints: `@Throttle({ default: { ttl: 60000, limit: 10-20 } })`

### Performance
- Use `Promise.all()` for independent DB queries (e.g., parallel lookups in order creation)
- Select only needed columns in joins — avoid `table(*)`
- Use `{ count: 'exact', head: true }` for count-only queries (admin dashboard)

### Error Handling
- `NotFoundException` — missing resources (Supabase error code `PGRST116`)
- `BadRequestException` — validation/business rule errors
- `ForbiddenException` — authorization failures
- `ConflictException` — duplicate resources (Supabase error code `23505`)
- `UnauthorizedException` — invalid credentials/tokens
- Helper: `throwOnSupabaseError(error, entityName)` from `src/common/utils/supabase-error.ts`
- `GlobalExceptionFilter` formats all errors as `{ success, statusCode, message, timestamp }`

### Swagger
- Every endpoint: `@ApiOperation()`, `@ApiResponse()`, `@ApiTags()`. 
- DTOs use `@ApiProperty()` with description + example. This is the mobile team's contract.
- DTO classes are for Swagger documentation only — runtime validation is via Zod.

### Events
- Use `@nestjs/event-emitter` for cross-module events (order status changes, notifications)

### API Prefix
- All routes prefixed with `/api` (set in main.ts)

### Key Utility Files
| File | Purpose |
|------|---------|
| `src/common/interfaces/auth-user.ts` | `AuthUser` interface for `@CurrentUser()` |
| `src/common/constants/columns.ts` | Column selection constants per entity |
| `src/common/pipes/zod-validation.pipe.ts` | Body validation pipe (Zod) |
| `src/common/pipes/zod-query-validation.pipe.ts` | Query param validation pipe (Zod + coercion) |
| `src/common/utils/pagination.ts` | `paginate()`, `PaginationParams`, `PaginatedResult` |
| `src/common/utils/supabase-error.ts` | Supabase error → NestJS exception mapper |
| `src/common/guards/supabase-auth.guard.ts` | JWT verification (local + API fallback) |
| `src/common/guards/roles.guard.ts` | Role-based access control |
| `src/common/filters/http-exception.filter.ts` | Global error response formatter |
| `src/common/decorators/public.decorator.ts` | `@Public()` — bypass auth |
| `src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` — inject AuthUser |
| `src/common/decorators/roles.decorator.ts` | `@Roles()` — required roles |

## Supabase Patterns
- **Migrations**: `supabase/migrations/` — timestamped SQL files
- **RLS**: All tables have Row-Level Security enabled. Policies per role (owner, provider, admin).
- **Storage buckets**: `avatars`, `pet-photos`, `provider-photos`, `check-in-photos`, `chat-media`, `review-photos`
- **Type generation**: Run `pnpm db:generate` after any migration change
- **In NestJS**: Use `createAdminClient()` (service role) for admin operations; use `forUser(token)` for RLS-scoped queries
- **In Next.js SSR**: Use `createServerClient()` with cookie-based auth
- **In Next.js client**: Use `getBrowserClient()` singleton

## Next.js Patterns
- **apps/web**: Static site only — React Server Components, no auth, no dynamic data
- **apps/web-admin**: Auth-protected admin dashboard. Middleware checks Supabase session + admin role.
- **CSS**: Tailwind CSS v4 with brand tokens
- **Data fetching**: TanStack Query (admin dashboard)
- **Forms**: React Hook Form + `@hookform/resolvers/zod` + `@petzone/validators`
- **UI primitives**: Radix UI + `@petzone/ui` components

## Code Style
- TypeScript strict mode everywhere
- Zod for all validation — define once in `packages/validators`, use in API + frontend
- No `console.log` — use `console.warn`/`console.error` only
- Prefer `type` imports: `import type { Foo } from './foo'`
- No barrel re-exports deeper than package index files
- Prettier formats all code (run via `pnpm format`)

## Business Domain (BRD Quick Reference)
- **User roles**: `owner` (pet owner), `provider` (hotel operator), `admin`
- **Order statuses**: pending → confirmed → checked_in → in_progress → check_out → completed | cancelled | disputed
- **Payment flow**: Pay-after-confirm. Owner books → provider confirms (4h timeout) → owner pays (24h) → escrow hold → service → escrow release
- **Commission**: 15% configurable. Deducted from provider payout.
- **Cancellation policies**: flexible (default), moderate, strict — each with different refund tiers
- **Provider verification**: pending → approved/rejected by admin (48h SLA)
- **Photo check-in**: Immutable, timestamped, geotagged photos at pet handoff
- **Chat**: Real-time via WebSocket, text + images, 2h provider response SLA
- **Reviews**: 1-5 stars, multi-category, 7-day window after completion

## Brand / Design
- Primary: teal `#2DD4BF`, secondary: amber `#F59E0B`, background: cream `#FFF8F0`
- Error: `#EF4444`, success: `#22C55E`, warning: `#F59E0B`
- Fonts: Quicksand (headings), DM Sans (body)
- Border radius: 8px (cards), 12px (buttons), 999px (pills/avatars)
- Touch targets: min 44x44px
- Language: Vietnamese (primary), English (secondary)
- Spacing base: 4px unit

## Security Rules
- Never commit `.env`, credentials, or secrets
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Sanitize user input at API boundaries (Zod validation)
- Phone numbers encrypted in DB
- Masked calls only (never expose real phone numbers)
- Rate limiting on all auth endpoints (3-5/session)
- CORS configured per environment

## Custom Skills (invoke during development)
- `supabase-postgres-best-practices` — query performance, indexes, RLS, schema design
- `brainstorming` — feature design and architectural decisions

## Testing
- Unit tests: Jest (NestJS), Vitest (Next.js)
- Integration tests: Supertest (API endpoints)
- Coverage target: 80% for business logic
- Run: `pnpm test` (all) or `pnpm --filter=@petzone/api test` (specific)
