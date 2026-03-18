# TSLO: Tally Shall Live On

TSLO is a free, open-source governance continuity app for DAOs that need a fast migration path from Tally. This repository currently implements the MVP foundation:

- a Next.js governance frontend
- config-driven deployment modes
- normalized JSON read APIs
- sample DAO and proposal pages, including ENS DAO
- wallet-connected Governor write actions for proposing and voting
- swappable data adapters for fixture, live public JSON-RPC, and a future indexer path

## Product plan

The current product and implementation plan is stored in [docs/plan.md](./docs/plan.md).

It covers:

- zero-DAO setup mode
- branded single-DAO mode as the primary deployment shape
- multi-DAO directory mode as the alternative
- slug behavior across single-site and network-style installs
- wallet connect and write-flow handling

## Deployment modes

TSLO is now driven by `tslo.config.ts`.

- `0` DAOs: setup mode
- `1` DAO: branded single-site mode
- `2+` DAOs: searchable directory mode

Example configs:

- [config/examples/empty.ts](./config/examples/empty.ts)
- [config/examples/single-ens.ts](./config/examples/single-ens.ts)
- [config/examples/multi-ens-arbitrum-uniswap.ts](./config/examples/multi-ens-arbitrum-uniswap.ts)

## Routes

Single DAO mode:

- `/`
- `/proposals/treasury-flow-automation`
- `/api/dao`
- `/api/proposals/treasury-flow-automation`

Multi DAO mode:

- `/`
- `/gov/ens`
- `/gov/ens/proposal/55749099144243971799440687308450608384225109120486751685653209891316805274409`
- `/api/daos`
- `/api/daos/ens`
- `/api/daos/ens/proposals/treasury-flow-automation`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data adapters

TSLO now loads governance data through an adapter layer.

- `live`: public JSON-RPC reads for Governor proposal history
- `fixture`: local fixture dataset for development or fallback scenarios
- `indexer`: placeholder adapter for a future PostgreSQL-backed indexer

Select the adapter with:

```bash
TSLO_DATA_ADAPTER=live
```

## Next implementation layer

- replace fixture data with a live query or indexer-backed store
- add Governor contract capability detection during DAO onboarding
- extend write adapters to delegate, queue, execute, and cancel
