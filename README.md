# TSLO: Tally Shall Live On

TSLO is a free, open-source governance continuity app for DAOs that need a fast migration path from Tally. This repository currently implements the MVP foundation:

- a Next.js governance frontend
- config-driven DAO onboarding
- normalized JSON read APIs
- sample DAO and proposal pages, including ENS DAO
- wallet-connect stub for future Governor write actions

## Routes

- `/` landing page and MVP scope
- `/daos/arbor-collective` DAO overview
- `/daos/ens` ENS DAO overview
- `/daos/ens/proposals/treasury-flow-automation` ENS proposal detail
- `/daos/arbor-collective/proposals/renew-grants-budget` proposal detail
- `/api/daos`
- `/api/daos/ens`
- `/api/daos/arbor-collective`
- `/api/daos/ens/proposals/treasury-flow-automation`
- `/api/daos/arbor-collective/proposals/renew-grants-budget`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Next implementation layer

- replace fixture data with an indexer-backed store
- add Governor contract capability detection during DAO onboarding
- implement write adapters for propose, vote, delegate, queue, execute, and cancel
- add multichain ingest and backfill jobs
