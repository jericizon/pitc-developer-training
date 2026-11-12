# PITC Developer Training

Monorepo of training exercises. Two apps share one product catalog:

- **`express-js/`**: the Stockroom JSON API (Express 5, SQL Server in Docker via `mssql`).
- **`nextjs-dashboard/`**: the Next.js app (React, TypeScript) with the Stockroom UI. It calls the API through its `/api` proxy.

## Prerequisites

- Node.js 20.12 or newer
- pnpm (the root pins `pnpm@12.18.0`)
- Docker with Compose, for SQL Server

## First-time setup

1. Install the root and Express dependencies:

   ```bash
   pnpm install
   ```

2. Install the Next.js app. It has its own lockfile and is not installed by the root command:

   ```bash
   pnpm -C nextjs-dashboard install
   ```

3. Create `express-js/.env` with the database settings. Keep the `PORT` line if the file already has one. The template is `express-js/.env.example`. `MSSQL_SA_PASSWORD` and `DB_PASSWORD` must be the same value. See [express-js/README.md](express-js/README.md#database-sql-server) for the details.

4. Start SQL Server, then run the migration:

   ```bash
   pnpm server:up
   ```

   This starts the container, waits until it is healthy, creates the database and table if they are missing, and loads sample products when the table is empty. It does not start the API.

## Daily development

```bash
pnpm dev
```

This starts the API and the Next.js app together. Press Ctrl+C to stop both.

Open the web app at its port (`http://localhost:3000/` by default, or your `WEB_PORT`). It redirects to `/dashboard`, and the products page is at `/dashboard/products`.

## Ports

| App | Default | Example from `.env` | Variable |
| --- | --- | --- | --- |
| Web (Next.js) | 3000 | 3001 | `WEB_PORT` |
| API (Express) | 3001 | 3002 | `API_PORT` |

The root `.env` (git-ignored) sets these for `pnpm dev`. Its values override shell variables:

```bash
WEB_PORT=3001
API_PORT=3002
```

- `pnpm dev` passes `API_PORT` to Express as `PORT`, so the `PORT` line in `express-js/.env` applies only when Express runs alone.
- The Next.js `/api` proxy also reads `API_PORT`.
- The web app fails to start if its port is busy. It does not move to another port.
- Restart `pnpm dev` after changing a port.

## Scripts

| Command | Where | What it does |
| --- | --- | --- |
| `pnpm dev` | root | Starts the API and the web app together |
| `pnpm server:up` | root or `express-js/` | Starts SQL Server, waits for healthy, runs the migration |
| `pnpm dev` | `express-js/` | API only, restarts on file changes |
| `pnpm start` | `express-js/` | API only, no auto-restart |
| `pnpm seed` | `express-js/` | Migration, plus sample products if the table is empty |
| `pnpm seed --reset` | `express-js/` | Replaces the products with the sample set |
| `pnpm test` | `express-js/` | API tests. SQL Server must be running and seeded |
| `pnpm dev` | `nextjs-dashboard/` | Web app on `WEB_PORT` (default 3000) |
| `pnpm build` | `nextjs-dashboard/` | Production build |
| `pnpm --filter stockroom test` | root | Runs the API tests from the root |

## Routes

### Web app (`nextjs-dashboard`)

| Path | Page |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Stock stats, low-stock panel, recent activity |
| `/dashboard/products` | Product table with search, filters, favorites, and bulk select, delete, or favorite |
| `/dashboard/products/create` | Add a product |
| `/dashboard/products/[id]` | Product details, `−`/`+` stock buttons, favorite, edit, delete |
| `/dashboard/products/[id]/edit` | Edit a product |
| `/dashboard/customers`, `/dashboard/invoices` | Course starter pages. Not used by Stockroom |
| `/seed` | Course starter route that seeds Postgres through `POSTGRES_URL`. Unrelated to SQL Server |
| `/query` | Course starter route. Its code is commented out and it returns a placeholder message |

### API (`express-js`)

The web app calls these through `/api/...`, for example `/api/products`.

| Method and path | Purpose |
| --- | --- |
| `GET /` | JSON home response |
| `GET /products` | List products. Query: `search`, `category`, `status` |
| `GET /products/:id` | One product |
| `POST /products` | Create a product |
| `PUT /products/:id` | Update a product |
| `DELETE /products/:id` | Delete a product |
| `GET /activity` | Latest 50 changes. Kept in memory |

Full request and response details are in [express-js/README.md](express-js/README.md).

## Troubleshooting

- **The web app exits with "port is in use":** another program holds `WEB_PORT`. Set a free port in the root `.env`.
- **`ECONNREFUSED 127.0.0.1:3002` in the web logs:** the API is not running. Check the `[api]` lines in the `pnpm dev` output.
- **"Could not connect to SQL Server":** the container is not healthy, or `DB_PASSWORD` does not match `MSSQL_SA_PASSWORD`. Run `docker compose ps` in `express-js/`.
- **Nodemon says "app crashed - waiting for file changes":** fix the error, then save a file. Nodemon does not reload when `.env` changes, so restart `pnpm dev` after editing it.

## Environment files

| File | Tracked by git | Contents |
| --- | --- | --- |
| `.env` (root) | No | `WEB_PORT`, `API_PORT` |
| `express-js/.env` | No | `PORT`, `MSSQL_SA_PASSWORD`, `DB_*` |
| `express-js/.env.example` | Yes | Template for the Express `.env` |

`.env` files hold passwords. Do not commit them.

## Project layout

```text
pitc-developer-training/
├── .env                      Ports for pnpm dev (git-ignored)
├── package.json              Root scripts: dev, server:up
├── pnpm-workspace.yaml
├── express-js/               Stockroom API
│   ├── app.js, db.js         Express app, SQL Server connection pool
│   ├── docker-compose.yml    SQL Server container
│   ├── routes/               products.js, activity.js
│   ├── scripts/              seed.js (migration), server-up.js
│   └── test/                 api.test.js
└── nextjs-dashboard/         Next.js app
    ├── app/dashboard/        Stockroom pages and course pages
    ├── app/ui/products/      Product list, form, and detail components
    └── app/lib/              API client and favorites hook
```

## Notes

- `pnpm-workspace.yaml` lists a `react-next-js` folder that does not exist. In practice only `express-js/` is a workspace member. `nextjs-dashboard/` has its own lockfile, so install it separately as shown above.
- `express-js/docs/mvp.md` is the original MVP specification. It predates the SQL Server and Next.js changes.
