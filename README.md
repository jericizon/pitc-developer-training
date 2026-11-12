# PITC Developer Training

Monorepo of training exercises, managed with pnpm workspaces.

## Projects

| Folder | Contents |
| ------ | -------- |
| `express-js/` | Stockroom — Express.js product inventory JSON API (the UI is in `nextjs-dashboard/`) |
| `nextjs-dashboard/` | Next.js app; the Products UI at `/dashboard/products` calls the Express API |

## Setup

```bash
pnpm install
```

Run project commands from inside each folder, or filter from the root, e.g. `pnpm --filter stockroom test`.

## Development

```bash
pnpm dev
```

Starts the Express API and the Next.js app together. Defaults: the app runs on `:3000` (http://localhost:3000/) and the API on `:3001`.

To change the ports, edit the root `.env` (git-ignored) and restart `pnpm dev`. Values in `.env` override shell variables:

```bash
WEB_PORT=3001
API_PORT=3002
```

The Express server and the Next.js `/api` proxy both follow `API_PORT`. If a port is busy, the dev server exits instead of picking another port.
