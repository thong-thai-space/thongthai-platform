# CLAUDE.md — Universal AI agent contract

> Drop this file at the repo root. Fill the **`<placeholders>`** in §1.
> Every AI agent (Claude, GPT, Cursor, Cline, open-source LLMs) reads this
> before writing code. Rules are stated literally so weak models can follow
> without judgment; rationale is given so strong models can decide edge cases.

---

## 0. How to use this template

### Quick start (5 minutes)

1. **Copy this file** to your repo root as `CLAUDE.md`.
2. **Fill `§1`** using the matching preset in `§0.2` below.
3. **Create empty folders** that match `§1`'s layer names so the AI has a place to put files.
4. **Add a linter rule** that enforces `§4` hard limits (see `§0.3`).
5. **Commit + push.** Every future AI session will load this on startup.

That's it — no other section needs editing for the file to work.

### 0.1  Decision tree — which layout fits my project?

```
Is the codebase…
├── Server-side (REST / GraphQL / gRPC / queue worker)?
│      → use preset "Backend service"           (§0.2 A)
├── User-facing web (SPA / SSR / static)?
│      → use preset "Web frontend"              (§0.2 B)
├── Native or cross-platform app (iOS / Android / Flutter / RN / Tauri)?
│      → use preset "Mobile / Desktop app"      (§0.2 C)
├── Command-line tool / batch script / build automation?
│      → use preset "CLI / Tool"                (§0.2 D)
├── Firmware / microcontroller / Edge device?
│      → use preset "IoT firmware"              (§0.2 E)
├── Reusable package / SDK?
│      → use preset "Library / SDK"             (§0.2 F)
└── Game (engine-based)?
       → use preset "Game"                      (§0.2 G)
```

Monorepo? Use **one CLAUDE.md per workspace** (e.g. `apps/web/CLAUDE.md`,
`apps/api/CLAUDE.md`, `packages/sdk/CLAUDE.md`). The root-level `CLAUDE.md`
points to each.

### 0.2  Presets — copy the block that matches your project

#### A. Backend service (e.g. NestJS, Spring Boot, FastAPI, Axum, Gin)
```yaml
project_type:        backend-service
languages:           TypeScript          # or Java / Python / Rust / Go
package_manager:     pnpm@10.x           # or maven / uv / cargo / go-mod
runtime:             Node 20 LTS         # or JVM 21 / Python 3.12 / Rust 1.80 / Go 1.23
test_runner:         jest                # or junit / pytest / cargo-test / go-test
linter:              eslint              # or checkstyle / ruff / clippy / golangci-lint
ui_layer:            src/controllers/    # or src/handlers/ (HTTP/gRPC entry)
application_layer:   src/use-cases/      # one class per cohesive flow
infrastructure:      src/adapters/ + src/repositories/
```

#### B. Web frontend (Next.js / Remix / SvelteKit / Nuxt / Vite SPA)
```yaml
project_type:        web-frontend
languages:           TypeScript
package_manager:     pnpm@10.x
runtime:             Node 20 (SSR) + modern browsers
test_runner:         vitest + playwright (e2e)
linter:              eslint
ui_layer:            src/app/ + src/components/   # pages + presentational
application_layer:   src/hooks/ + src/stores/     # data fetching + client state
infrastructure:      src/lib/                     # API client, storage, sockets
```

#### C. Mobile / Desktop app (Flutter / React Native / iOS / Android / Tauri)
```yaml
project_type:        mobile-app                   # or desktop-app
languages:           Dart                         # or Kotlin / Swift / TypeScript+Rust
package_manager:     flutter                      # or gradle / spm / pnpm+cargo
runtime:             iOS 17+ / Android 14+
test_runner:         flutter test                 # or xctest / espresso / vitest
linter:              flutter analyze              # or swiftlint / detekt
ui_layer:            lib/screens/ + lib/widgets/
application_layer:   lib/view_models/             # or lib/blocs/ (BLoC pattern)
infrastructure:      lib/data/ (api + db + prefs)
```

#### D. CLI / Tool (Click, Cobra, Clap, oclif)
```yaml
project_type:        cli
languages:           Python                       # or Go / Rust / TypeScript
package_manager:     uv                           # or go-mod / cargo / pnpm
runtime:             Python 3.12                  # or Go 1.23 / Rust 1.80
test_runner:         pytest
linter:              ruff + mypy
ui_layer:            src/cli/commands/            # Click/argparse entry points
application_layer:   src/use_cases/
infrastructure:      src/adapters/                # FS, HTTP, subprocess
```

#### E. IoT firmware (ESP-IDF, Zephyr, Arduino, embedded Rust)
```yaml
project_type:        iot-firmware
languages:           C++                          # or Rust (no_std) / MicroPython
package_manager:     idf.py                       # or cargo / west / arduino-cli
runtime:             ESP32 + FreeRTOS             # or Cortex-M / Zephyr
test_runner:         unity + ceedling             # or cargo-test / pytest (Python)
linter:              clang-tidy                   # or clippy
ui_layer:            main/device_handlers/        # ISR, button, LED handlers
application_layer:   main/tasks/                  # FreeRTOS tasks orchestrate
infrastructure:      main/drivers/                # sensor / actuator / radio drivers
```

#### F. Library / SDK
```yaml
project_type:        library
languages:           TypeScript                   # or Rust / Python / Go
package_manager:     pnpm@10.x
runtime:             Node 20 + browsers           # or whatever the consumer uses
test_runner:         vitest
linter:              eslint
ui_layer:            src/index.ts (public API surface)
application_layer:   src/core/                    # internal use cases
infrastructure:      src/internal/                # platform-specific implementations
# Libraries have NO ui_layer in the UX sense — `ui_layer` here = the public API.
```

#### G. Game (Unity / Unreal / Godot / Bevy)
```yaml
project_type:        game
languages:           C#                           # or C++ / GDScript / Rust
package_manager:     Unity Package Manager        # or Cargo / godot-cpp
runtime:             Unity 2023 LTS               # or Unreal 5.4 / Godot 4
test_runner:         Unity Test Framework
linter:              Roslyn analyzers             # or clang-tidy
ui_layer:            Assets/Scripts/UI/ + scenes/
application_layer:   Assets/Scripts/Systems/      # ECS systems or Managers
infrastructure:      Assets/Scripts/Adapters/     # PlayerPrefs, save system, network
```

### 0.3  Enforce hard limits (§4) with your linter

Set up these rules so the limits in §4 fail the build, not just lint:

| Language | Tool | Rule example |
|---|---|---|
| TypeScript/JS | ESLint | `max-lines: [error, 250]`, `max-lines-per-function: [error, 40]`, `complexity: [error, 10]`, `max-params: [error, 4]`, `max-depth: [error, 3]` |
| Python | Ruff | `[lint.pylint] max-args=4`, `[lint.mccabe] max-complexity=10`, file size via `pre-commit` hook |
| Rust | Clippy | `#![warn(clippy::cognitive_complexity)]` + custom `cargo-deny`/`tokei` pre-commit |
| Java/Kotlin | Checkstyle/Detekt | `FileLength=250`, `MethodLength=40`, `CyclomaticComplexity=10` |
| Go | golangci-lint | `funlen: lines=40`, `gocyclo: min-complexity=10`, `lll`, `nestif: min-complexity=4` |
| Dart | analysis_options | `lines_longer_than_80_chars`, custom `dcm`/`dart_code_metrics` for LOC + complexity |
| Swift | SwiftLint | `file_length: 250`, `function_body_length: 40`, `cyclomatic_complexity: 10` |
| C/C++ | clang-tidy | `readability-function-size`, `readability-function-cognitive-complexity` |

### 0.4  Adapting §6 templates to your language

§6 uses TypeScript syntax as the **reference dialect**. Strong AI models can
auto-translate; weak models need explicit syntax. If you're using a non-TS
stack, add a `CLAUDE.snippets.<lang>.md` next to this file with the same six
skeletons rewritten in your language. Reference it from §6 with:

```
> For <language> syntax of these skeletons, see ./CLAUDE.snippets.<lang>.md
```

Concept mapping (so strong models know the equivalents):

| §6 concept | TypeScript | Rust | Python | Dart | Swift | Go | C# |
|---|---|---|---|---|---|---|---|
| Port / interface | `interface` | `trait` | `Protocol` | `abstract class` | `protocol` | `interface` | `interface` |
| DI container | NestJS/Angular | manual / `shaku` | `dependency-injector` | `get_it` / `riverpod` | `swinject` | manual / `wire` | built-in |
| Typed error | `class X extends HttpException` | `enum Error` / `thiserror` | custom `Exception` | custom `Exception` | `enum X: Error` | `error` interface | `class X : Exception` |
| Async | `Promise<T>` | `async fn -> Result<T, E>` | `async def` | `Future<T>` | `async throws` | goroutine + `chan` | `Task<T>` |

### 0.5  First-time checklist for the human

- [ ] Filled `§1` from the matching `§0.2` preset.
- [ ] Created the empty folders named in `§1`.
- [ ] Wired the linter rules from `§0.3`.
- [ ] Confirmed CI runs: `lint → type-check → test → build` (see `§12`).
- [ ] Added one example use case so future AI work has a reference shape.
- [ ] Set `main_branch` protection (no force-push, required reviews if team > 1).
- [ ] Removed any sections that genuinely don't apply (e.g. `§11 Observability`
      for a personal CLI). Mark deletions with a one-line note explaining why.

### 0.6  How AI agents should read this file

Order of reading is intentional — top-down. Weak models that only get a
truncated context will at least see `§0–§4` and `§13`, which is enough to
follow the architecture and avoid the worst violations.

---

## 1. Project metadata — FILL THIS IN

```yaml
project_name:        <e.g. Acme Inventory>
project_type:        <web | mobile | desktop | cli | iot | library | game>
languages:           <e.g. TypeScript, Rust>
package_manager:     <pnpm@10.x | cargo | uv | flutter>
runtime:             <Node 20 | Bun 1.1 | JVM 21 | iOS 17+ | esp-idf 5.1>
test_runner:         <jest | vitest | pytest | go test | xctest>
linter:              <eslint | clippy | ruff | swiftlint>
ci:                  <github-actions | gitlab-ci | jenkins>
main_branch:         <main | trunk>
deploy_target:       <e.g. Railway, Vercel, Cloudflare Workers, App Store, OTA>

# Conventional names per project type — keep these consistent across all code.
ui_layer:            <e.g. components/, screens/, views/, cli/commands/>
application_layer:   <e.g. use-cases/, viewmodels/, handlers/, commands/>
domain_layer:        domain/      # ports + types — depends on nothing
infrastructure:      <e.g. adapters/ + repositories/ + drivers/>
shared:              shared/      # cross-cutting utilities (logger, errors)
```

---

## 2. Architecture — one shape, four layers

Every module (= one bounded context: user, order, sensor, command, screen…)
**MUST** follow this layout. The arrows show legal dependency direction.

```
            ┌──────────────┐
            │   UI Layer   │   thin — no business rules, no Prisma/SQL/HTTP/Bluetooth
            └──────┬───────┘
                   │ calls
            ┌──────▼──────────┐
            │ Application     │   one class per cohesive flow (= "Use Case")
            │   (use-cases)   │   orchestrates domain + infrastructure ports
            └──────┬──────────┘
                   │ depends on (interfaces only)
            ┌──────▼──────────┐         ┌──────────────────┐
            │ Domain          │◄────────┤ Infrastructure   │
            │ (ports + types) │ implements│ (adapters/repos)│
            └─────────────────┘         └──────────────────┘
                                          ↑
                                          │ touches DB / HTTP / GPIO / FS
```

**Rules:**
1. UI calls Application. UI **never** imports Infrastructure directly.
2. Application depends on **Domain ports**, not concrete classes.
3. Infrastructure implements Domain ports. The wiring lives in **one place**:
   the module's composition root (e.g. `*.module.ts`, `main.rs`, DI container).
4. Domain has **zero framework imports**.
5. Cycles between layers are a build error — set up the linter to enforce it.

### Per-module folder (use the names from §1)
```
modules/<name>/
├── domain/             ports (interfaces) + types — no framework imports
├── policies/           business rules: state machines, validators, authz
├── <application_layer>/ one file per use case (= one cohesive flow)
├── adapters/           concrete implementations of ports
├── <persistence>/      repository implementations (if any)
├── dto/                input/output schemas + runtime validation
├── <name>.constants.ts DI tokens + module-level constants
├── <name>.module.ts    composition root — binds ports to adapters
└── <name>.<ui-entry>   controller / screen / command / device handler
```

---

## 3. SOLID — stated as rules, not adjectives

| Rule | Concrete test that the AI must apply |
|---|---|
| **S** Single Responsibility | Each file has **one reason to change**. If you can describe the file with "X **and** Y", split it. |
| **O** Open/Closed | New behavior = new file (new adapter / new use case). **Modifying** stable code to add a feature is a violation. |
| **L** Liskov | Any adapter must satisfy its port's contract with **no surprising preconditions** (e.g. no throwing from a method the port marks as pure). |
| **I** Interface Segregation | Ports stay **lean**: 1–7 methods. If a port grows beyond 7 methods, split it by role. |
| **D** Dependency Inversion | Use cases inject **port types**, never concrete classes. Wire concretes only in the composition root. |

### Patterns the AI must name inline

When you use a non-trivial pattern, add a one-line comment so reviewers can find it:
```ts
// Pattern: Repository
// Pattern: State Machine
// Pattern: Strategy   — pluggable <thing>
// Pattern: Adapter    — bridges <port> to <library>
// Pattern: Template Method — shared <thing>, varies per <thing>
// Pattern: Facade     — stable surface over <use cases>
// Pattern: Saga       — non-atomic, idempotent via <dedup key>
```

---

## 4. Hard limits — non-negotiable

| Thing | Limit | Why |
|---|---|---|
| File LOC (source) | **≤ 250** | Larger files hide responsibilities. Split before crossing. |
| File LOC (UI screen/page) | **≤ 150** | Pages should compose smaller pieces, not hold logic. |
| Function/method LOC | **≤ 40** | Anything longer needs intermediate names. |
| Function parameters | **≤ 4** | More? Group into an options object or a value object. |
| Cyclomatic complexity | **≤ 10** | Enforced by linter. Refactor branching into table-lookups or strategies. |
| Nesting depth | **≤ 3** | Early-return + extract method. |
| Port methods | **≤ 7** | If you need more, split the port by role. |
| Class fields | **≤ 7** | Same as port methods — group or split. |

A weak AI agent should treat these as **build failures**, not suggestions.

---

## 5. Clean Code — DO / DON'T

### ❌ DON'T

- `throw new Error("message")` — use a **typed error class** that the global error handler recognizes.
- `catch { }` or `catch { /* ignore */ }` — at minimum, `logger.warn(error)`.
- `: any` / `as any` / `unsafe` / unchecked cast — find the right type or narrow with a type guard.
- `// TODO` without an owner and a ticket reference.
- `console.log` in shipped code — use the project logger.
- Inline magic numbers (`if (retries > 3)`) — extract to a named constant in `*.constants.<ext>`.
- Boolean parameters as the last positional arg (`fn(x, true)`) — they read as noise. Use an enum or options object.
- Mutating function parameters.
- Re-fetching after an `update()` that returns the fresh row.
- Importing across feature modules — go through the module's facade.
- Multi-line comments describing **what** the code does — the code should already say what. Comments explain **why**.

### ✅ DO

- Inject dependencies via constructor + DI token (not `new Foo()` inside a method).
- Return early. Inverted guard clauses beat nested `if`.
- Make illegal states unrepresentable (sum types > boolean flags).
- Name booleans with a predicate prefix: `isVerified`, `canEdit`, `hasMembers`.
- Place pure helpers under `shared/` or a `_helpers/` co-located folder, with their own test file.
- Validate at the boundary (DTO/Zod/serde) — trust internal types after that.
- Wrap multi-row writes in a transaction OR document explicitly why a Saga (idempotent retry) is acceptable.
- Use timezone-aware timestamps everywhere; never store local time.

---

## 6. Layer templates — copy these skeletons

> Replace `<...>` placeholders. The AI agent should not invent its own
> structure — reusing the skeleton ensures consistency.

### 6.1 Domain port (TypeScript-flavoured, adapt syntax to your language)
```ts
// modules/<name>/domain/<name>.repository.port.ts
import type { <Entity> } from './<name>.types';

export interface <Name>RepositoryPort {
  findById(id: string): Promise<<Entity> | null>;
  save(entity: <Entity>): Promise<<Entity>>;
  // ≤ 7 methods total
}
```

### 6.2 Use case
```ts
// modules/<name>/<application_layer>/<verb>.use-case.ts
import { Inject, Injectable, NotFoundException } from '<di-framework>';
import { <NAME>_REPOSITORY } from '../<name>.constants';
import type { <Name>RepositoryPort } from '../domain/<name>.repository.port';

// Pattern: Use Case — owns one cohesive flow ("<verb the entity>")
@Injectable()
export class <Verb><Name>UseCase {
  constructor(
    @Inject(<NAME>_REPOSITORY) private readonly repo: <Name>RepositoryPort,
    // ≤ 4 dependencies
  ) {}

  async execute(input: <Input>): Promise<<Output>> {
    // 1. Validate / authorize (delegate to a policy)
    // 2. Load aggregates via repo
    // 3. Apply domain rules
    // 4. Persist + emit events
    // Body ≤ 40 LOC; extract helpers if longer.
  }
}
```

### 6.3 Policy
```ts
// modules/<name>/policies/<rule>.policy.ts
import { ForbiddenException } from '<framework>';

// Pattern: Policy — single chokepoint for "<what is enforced>"
export class <Rule>Policy {
  assert<Condition>(args: <Args>): void {
    if (!<predicate>) throw new ForbiddenException('<actionable message>');
  }
}
```

### 6.4 Adapter
```ts
// modules/<name>/adapters/<lib>-<port>.adapter.ts
import { Injectable } from '<framework>';
import { <Library> } from '<library>';
import type { <Name>RepositoryPort } from '../domain/<name>.repository.port';

// Pattern: Adapter — implements <Name>RepositoryPort using <Library>
@Injectable()
export class <Library><Name>RepositoryAdapter implements <Name>RepositoryPort {
  constructor(private readonly client: <Library>) {}
  // Methods must exactly match the port signatures.
}
```

### 6.5 Composition root
```ts
// modules/<name>/<name>.module.ts (NestJS) or main.rs (Rust) etc.
@Module({
  controllers: [<Name>Controller],
  providers: [
    <Verb><Name>UseCase,
    <Library><Name>RepositoryAdapter,
    { provide: <NAME>_REPOSITORY, useExisting: <Library><Name>RepositoryAdapter },
  ],
  exports: [<Verb><Name>UseCase],
})
export class <Name>Module {}
```

### 6.6 UI entry (controller / screen / command)
```ts
// Controller / screen does only: parse input → call use case → format output.
// Zero business logic. Zero database calls. Zero error mapping (handled globally).
```

---

## 7. Testing — what counts as "tested"

| Layer | Test type | Mock what? |
|---|---|---|
| **Domain types / policies** | Pure unit tests, no mocks needed | nothing |
| **Use cases** | Unit tests against **port mocks** (not concrete adapters) | repository, notifier, time provider |
| **Adapters** | Integration tests against real driver in a sandbox | external SDK only |
| **UI** | Snapshot or interaction tests | use cases |
| **Critical flow (auth, payment, device handshake)** | One end-to-end happy + one failure path | nothing — real stack in containers |

**Coverage gates** (CI must enforce, not just report):
- ≥ 80 % statements + branches on `application/` and `policies/`.
- 0 failing tests, 0 todo tests on `main`.
- Mutation-test the auth and money paths if the language has a mutation tool.

**Test naming**: `<unit>.spec.<ext>` or `<unit>.test.<ext>` — colocate with the source.

---

## 8. Error handling — one model, applied everywhere

1. Define typed errors in `shared/errors/` — at minimum: `DomainError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ValidationError`, `IntegrationError`.
2. Use cases throw typed errors. Never strings, never generic `Error`.
3. A **single global handler** (HTTP filter / panic hook / unhandled-rejection listener) maps typed errors → user-facing response.
4. Persistence-layer errors (Prisma codes, SQLSTATE, IOErrors) **must be translated to typed errors at the repository boundary**. They never bubble up raw.
5. Logs always include: `traceId`, `userId` (if present), `errorCode`, `cause`. Never tokens, passwords, or PII.

---

## 9. Security — minimum bar

- Validate all external input at the boundary (DTO + runtime schema).
- Never trust string concatenation for SQL / shell / paths. Use parameterized APIs.
- Secrets only via environment variables, surfaced through a typed `Config` module. Never hard-coded.
- Authentication state-changing endpoints must be rate-limited.
- Passwords: hashed with bcrypt/argon2 ≥ recommended cost; refresh tokens stored hashed.
- HTTPS-only cookies in production; `SameSite=Lax` minimum, `None` only when cross-site is required.
- Output user-controlled strings through the framework's auto-escape; **never** `dangerouslySetInnerHTML` / `v-html` / equivalent.
- Dependency audit (`pnpm audit`, `cargo audit`, `pip-audit`) in CI; critical = build failure.

---

## 10. Performance defaults

- Prefer `select`/projection over `include`/full-load when reading lists.
- Batch external calls (`Promise.all`, `joinAll`, etc.) when independent.
- N+1 queries are bugs — flag in code review.
- Cache only when measured. Document TTL + invalidation rule next to the cache call.
- For UI: list virtualization > 200 rows, lazy-load below the fold, ship images as `webp/avif`.

---

## 11. Observability

- Structured JSON logs (one line per event), levels `error / warn / info / debug`.
- Inject a request/trace ID at the entry point; propagate through every log line.
- Each external call (DB query, HTTP request, queue publish) emits a span with duration and outcome.
- Health endpoint: `/healthz` returns `{ status, version, deps: { db, cache, queue } }`.
- No `console.*` in shipped code.

---

## 12. Commits, branches, CI

- **Branch model**: trunk-based. Feature branches ≤ 3 days old; long-running branches are tech debt.
- **Conventional Commits** are mandatory: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`, `build:`, `ci:`.
- Commit message body explains **why**, not what.
- Every PR runs: `lint → type-check → unit tests → build → integration tests`. Any red = no merge.
- Never `--no-verify`, never bypass signing, never force-push to the main branch.

---

## 13. AI agent behavioral contract

> **When asked to write or modify code, the AI agent MUST:**

1. **Identify the target layer first** (UI / Application / Domain / Infrastructure) and state it in one sentence before writing.
2. **Reuse the skeleton from §6** — do not invent a new structure.
3. **Inject through ports**, never instantiate concrete classes inside a use case.
4. **Add a `// Pattern: <name>`** comment when applying a named pattern from §3.
5. **Emit at least a test skeleton** with each new use case or policy.
6. **Check the hard limits in §4** before submitting — if a file would exceed, propose the split.
7. **Never** introduce a forbidden item from §5 ("DON'T").
8. **Surface tech debt** with `// TECH DEBT: <reason + ticket>` rather than hiding it.
9. **State trade-offs explicitly** when deviating from a rule, in one sentence above the code.
10. **Refuse to "just make it work"** if the only path violates this contract — propose the smallest conformant alternative instead.

### Output format for code review

```
✅ Follows: [the rules you observed]
⚠️ Concern: [borderline cases reviewers should double-check]
❌ Violation: [rule broken + minimal fix]
```

### Anti-patterns to flag during review

- A controller / screen calling a database / SDK directly.
- A use case importing a concrete adapter.
- A file over the §4 limits.
- A `catch` with no log and no rethrow.
- A typed error caught and re-thrown as a generic one.
- Duplicate logic across modules — extract to `shared/` (a function with its own test).
- "Util" / "helpers" / "misc" files that grow into dumping grounds — split by responsibility.

---

## 14. Known limitations (live document)

> Real tech debt lives here. Every entry must have severity, owner, and a fix plan.

```
| Issue | Severity | Owner | Fix plan |
|---|---|---|---|
| <e.g. legacy `<file>` exceeds 250 LOC> | 🟠 | <person> | <ticket / sprint> |
```

Severities: 🔴 production-affecting · 🟠 architectural · 🟡 maintainability · 🟢 cosmetic.

---

## 15. When this file is updated

- Adding a new module type or layer → update §2 and §6.
- Adding a new pattern in use → register it in §3.
- Loosening a hard limit → it requires a PR review, not a silent edit.
- Adding a new external integration → document its adapter folder and link in §6.

> The agent reads this file **first** in every session. Keep it under 400 lines so it always fits in context.
