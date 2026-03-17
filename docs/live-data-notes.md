# TSLO Live Data Notes

## Summary

TSLO now has a first live-read adapter for Governor-style DAOs using `viem`, but the current ENS integration is not yet production reliable. The app can load proposal history over public JSON-RPC and expose that through the shared `IDataAdapter` abstraction.

## What works

- config-driven DAO metadata and routing
- single-DAO mode and multi-DAO mode routing model
- live Governor proposal read adapter wired into page and API routes
- adapter abstraction now supports `fixture`, `live`, and a TODO `indexer` mode
- live proposal discovery returns partial DAO data first, then hydrates proposal details more deeply on demand

## What we learned

### Public RPC behavior is the main constraint

The main blocker is not ABI decoding or route design. It is public Ethereum RPC reliability for repeated governance reads.

Observed issues:

- some public RPCs reject `eth_getLogs` requests for broad historical ranges
- some endpoints return internal errors for valid `eth_getLogs` requests
- some endpoints require chunked log scanning
- some endpoints rate-limit follow-up `eth_getBlockByNumber` calls needed to resolve timestamps

### A single backend-less live path is possible, but fragile

Reading proposals directly from Governor contracts is feasible, but for a polished UX it needs:

- a good RPC provider
- aggressive caching
- limited scan ranges
- per-DAO `startBlock` config
- fewer follow-up calls per proposal

Without that, page loads become slow or unreliable.

### `startBlock` should be part of DAO config

Each DAO should be able to define a governance deployment start block. This avoids unnecessary history scans and makes live reads materially more practical.

### Optional offchain links belong in config

Forum, docs, and treasury links should be operator-supplied in config when they are not discoverable onchain. Those are deployment concerns, not fixture concerns.

## Current behavior

- ENS is configured as the primary single-DAO deployment
- TSLO attempts to load live proposal data from the configured Governor
- if live reads fail, TSLO returns the configured DAO with an explicit partial-load status instead of silently swapping in fixture proposals

## Recommended next steps

1. Add in-memory and persistent caching for live proposal reads.
2. Reduce the number of block timestamp lookups per request.
3. Prefer a stable paid or self-operated RPC for production deployments.
4. Consider storing a normalized proposal snapshot locally after first retrieval.
5. Expand live reads to delegate and account-specific governance state only after proposal reads are stable.
