# lib

Shared data loading, configuration, formatting, and type definitions live here.

## Key modules

- `data-adapter.ts`: the `IDataAdapter` abstraction and adapter selection via `TSLO_DATA_ADAPTER`
- `live.ts`: the public JSON-RPC live loader for Governor-style DAOs
- `data.ts`: fixture datasets and fixture lookup helpers
- `config.ts`: normalized DAO configuration derived from `tslo.config.ts`
- `types.ts`: shared application types
- `format.ts`: number/date helpers plus markdown rendering via `marked` (tables/images supported)

## Adapter flow

Pages and API routes should prefer the adapter helpers from `data-adapter.ts` instead of importing a concrete data source directly. That keeps `fixture`, `live`, and future `indexer` implementations swappable from one place.

`live.ts` now hydrates proposal lifecycle stages from onchain events (`ProposalCreated`, `VoteCast`, `ProposalQueued`, `ProposalExecuted`) so list and detail UIs can display richer vote totals and status timelines.
