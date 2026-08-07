# AGENTS.md

## Cursor Cloud specific instructions

ALKEMI™ is a single web service: one Node/Express process (`server/_core/index.ts`) that
serves both the tRPC API (`/api/trpc`) and the React/Vite frontend from the same port. There
is no separate frontend server. Source areas: `client/` (React 19 + Vite), `server/` (Express +
tRPC 11 + Drizzle ORM), `shared/`. Package manager is **pnpm** (pinned via `packageManager`).

Standard scripts live in `package.json` — use them as the source of truth:
`pnpm dev` (run), `pnpm check` (type-check / lint-equivalent, there is no ESLint),
`pnpm test` (Vitest), `pnpm build` (prod build), `pnpm format` (Prettier).

### Services and startup

The startup layer only runs `pnpm install`. The database and the dev server must be started
manually (they are intentionally NOT in the update script). Non-obvious steps:

1. Start the database (MariaDB is preinstalled; it is not auto-started, and systemd is not
   running). Data lives in `/var/lib/mysql`:
   ```
   sudo mariadbd --user=mysql --datadir=/var/lib/mysql > /tmp/mariadb.log 2>&1 &
   ```
   The `alkemi` database + `alkemi` user already exist. If starting from a clean DB, recreate
   with: `CREATE DATABASE alkemi; CREATE USER 'alkemi'@'localhost' IDENTIFIED BY 'alkemi_dev_pw';
   GRANT ALL ON alkemi.* TO 'alkemi'@'localhost';` (and the same for `'alkemi'@'%'`).

2. Ensure `/workspace/.env` exists (it is git-ignored, so it does not travel with commits).
   Required contents for local dev:
   ```
   DATABASE_URL=mysql://alkemi:alkemi_dev_pw@127.0.0.1:3306/alkemi
   JWT_SECRET=dev_local_jwt_secret_change_me
   VITE_APP_ID=alkemi-local-dev
   VITE_OAUTH_PORTAL_URL=http://localhost:3000
   OWNER_OPEN_ID=local-dev-owner
   OAUTH_SERVER_URL=
   BUILT_IN_FORGE_API_URL=
   BUILT_IN_FORGE_API_KEY=
   PORT=3000
   NODE_ENV=development
   ```
   `VITE_OAUTH_PORTAL_URL` is a **client-side** var (not in `server/_core/env.ts`). It must be
   non-empty or the frontend throws `TypeError: Invalid URL` in `getLoginUrl` (`client/src/const.ts`)
   whenever it renders unauthenticated. Vite only reads `.env` at server start — restart `pnpm dev`
   after changing any `VITE_*` var.

3. Run the dev server: `pnpm dev` (serves on `http://localhost:3000/`, auto-increments the port
   if 3000 is busy). Uses `tsx watch`, so server code hot-reloads on edit.

### Database schema — important

Do NOT run `pnpm db:push`. The committed migrations in `drizzle/` are incomplete (`0000` only
creates the `users` table) and `drizzle-kit migrate` will fail. Instead sync the full schema
(52 tables) directly from `drizzle/schema.ts`:
```
pnpm exec drizzle-kit push --force
```
Production uses TiDB. Under MySQL/MariaDB this command creates every table and then errors on the
last step with `ER_TOO_LONG_IDENT` ("Identifier name ... is too long") while adding foreign-key
constraints, because some auto-generated FK names exceed MySQL's 64-char limit. **This error is
expected and harmless** — all tables are created before it and the runtime ORM does not rely on
DB-level FKs. The DB data persists in `/var/lib/mysql`, so this is normally a one-time step.

### Authenticating locally (for UI / end-to-end testing)

The only real auth path is external Manus OAuth (`OAUTH_SERVER_URL`), which is unreachable here.
`authenticateRequest` (`server/_core/sdk.ts`) skips the external call when the user already exists
in the DB by `openId`, and the session cookie (`app_session_id`) is just a JWT (HS256) signed with
`JWT_SECRET`. So you can log in without OAuth:

1. Seed an owner user + mint a session token (run from `/workspace`):
   ```
   pnpm exec tsx -e 'import "dotenv/config"; import * as db from "./server/db"; import {sdk} from "./server/_core/sdk"; import {ENV} from "./server/_core/env"; (async()=>{const openId=ENV.ownerOpenId||"local-dev-owner"; const org=await db.getOrCreateOrganizationForUser(openId,"Local Dev Admin"); await db.upsertUser({organizationId:org,openId,name:"Local Dev Admin",email:"paigautham@gmail.com",role:"admin",lastSignedIn:new Date()}); console.log(await sdk.createSessionToken(openId,{name:"Local Dev Admin"}));process.exit(0)})()'
   ```
   (`paigautham@gmail.com` is a hard-coded super-admin email, so this user gets the `admin` role.)
2. For API testing: send the token as `Cookie: app_session_id=<TOKEN>`.
3. For browser testing: open `http://localhost:3000`, then in the DevTools console run
   `document.cookie = "app_session_id=<TOKEN>; path=/"` and reload. (The server only reads the
   Cookie header, so a JS-set cookie is accepted.) Alternatively, add a temporary dev-only Express
   route that calls `sdk.createSessionToken` and `res.cookie("app_session_id", token, {...})`, hit
   it once, then revert it.

Once logged in as admin, the Dashboard shows a **Load Demo Data** button that seeds 5 materials,
3 suppliers, 3 formulations, predictions, trials, and FDA compliance rules — the quickest way to
populate the app for testing.

### Optional external services

Manus **Forge** (`BUILT_IN_FORGE_API_KEY`) powers LLM predictions/analysis, RAG embeddings, and
file storage. It is optional: core CRUD, physics-based predictions, compliance, DOE, analytics all
work without it. Embeddings fall back to a local ONNX model (`@xenova/transformers`, downloaded on
first use); LLM chat calls will error without a key. `pnpm install` intentionally leaves some
native build scripts unapproved (esbuild, @tailwindcss/oxide, sharp, ...); dev, tests, and
type-check all work regardless.
