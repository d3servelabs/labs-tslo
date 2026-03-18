# app

Next.js App Router entrypoints and route handlers live here.

## Current shape

- page routes render DAO directory, DAO detail, and proposal detail views
- API routes expose the same governance data through the selected adapter
- styling is centralized in `globals.css`

## Data flow

App routes should consume the shared loader helpers from `lib/data-adapter.ts` so that `fixture`, `live`, and future `indexer` sources remain swappable without route-level rewrites.
