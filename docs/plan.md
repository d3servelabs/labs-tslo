# TSLO Product And Implementation Plan

## Summary

TSLO is an open-source governance frontend intended to replace the core day-to-day workflows DAOs used on Tally. The distribution model is not "one global Tally clone" by default. Instead, TSLO should primarily support branded single-DAO deployments, while still allowing a multi-DAO network mode when needed.

The next implementation phase should optimize for:

- zero-DAO setup mode
- one-DAO branded mode as the default deployment shape
- multi-DAO directory mode as an optional network configuration
- wallet connection and contract write flows that work cleanly across those modes

## Deployment Modes

### Zero DAO: setup mode

If the config contains zero DAOs, TSLO should render a setup page similar to a fresh WordPress install.

Expected behavior:

- homepage shows that TSLO is installed but not configured
- page explains where the DAO config file lives
- page links to the open-source repo and setup instructions
- page explains the minimum required config values:
  - official website URL
  - chain ID
  - governor address
  - token address
  - optional timelock address
- API routes should either return empty responses or explicit "not configured" payloads

This mode is the installer's equivalent of "finish setup before publishing governance pages."

### One DAO: single-site mode

If the config contains exactly one DAO, TSLO should behave like a single-site install.

Expected behavior:

- the deployment itself is the DAO
- homepage becomes the DAO landing page
- public routes omit the DAO slug
- branding, metadata, and navigation are derived from the configured DAO
- the official website URL should be treated as the canonical external project URL

Recommended public routes:

- `/`
- `/proposals/:proposalId`
- `/delegates`
- `/api/dao`
- `/api/proposals/:proposalId`

Internal note:

- keep an internal DAO identifier for storage, cache keys, and future compatibility work
- do not force that slug into user-facing routes when only one DAO exists

### Many DAOs: network mode

If the config contains multiple DAOs, TSLO should behave like a network or directory.

Expected behavior:

- homepage is a DAO directory
- include search and selection UI
- each DAO gets its own slug-based route namespace
- global branding should be TSLO-level or operator-level rather than one DAO's branding

Recommended public routes:

- `/`
- `/daos/:slug`
- `/daos/:slug/proposals/:proposalId`
- `/daos/:slug/delegates`
- `/api/daos`
- `/api/daos/:slug`

## Slug Strategy

The WordPress analogy is:

- single-site installs do not expose a site slug in normal routes
- multi-site installs require a site identifier through subdomain or subpath

TSLO should mirror that.

Rules:

- slug is required internally for every DAO
- slug is optional in user-facing routes when only one DAO exists
- slug is required in user-facing routes when multiple DAOs exist
- if a config omits a slug for a single DAO, generate a stable internal slug from the DAO name
- if a config omits a slug in multi-DAO mode, fail validation and surface a clear setup error

This keeps URLs clean for branded installs without losing internal consistency.

## Config Model

TSLO should move toward a single config file that controls deployment mode and DAO definitions.

Illustrative shape:

```ts
interface TsloConfig {
  siteName: string;
  repoUrl: string;
  docsUrl: string;
  daos: Array<{
    slug?: string;
    name: string;
    officialSiteUrl: string;
    forumUrl?: string;
    docsUrl?: string;
    treasuryUrl?: string;
    chainId: number;
    governorAddress: string;
    tokenAddress: string;
    timelockAddress?: string;
    branding?: {
      logoUrl?: string;
      accentColor?: string;
    };
  }>;
}
```

Validation rules:

- zero DAOs is valid and enters setup mode
- one DAO is valid with or without an explicit slug
- many DAOs require explicit unique slugs
- official website URL is required for each DAO
- forum/docs/treasury links are optional config fields when they are not obtainable onchain
- governor address and token address are required for each DAO

## Wallet Connect Plan

Wallet connection needs to work across setup mode, single-DAO mode, and multi-DAO mode without changing the mental model for users.

### Goals

- connect from the browser with minimal infrastructure
- support common EVM wallets
- read from public RPC without wallet connection
- require wallet connection only for write actions
- handle wrong-network and unsupported-capability states explicitly

### Recommended approach

Use a client-side wallet layer based on `viem` plus a wallet integration library such as Wagmi or a thin EIP-1193 adapter layer.

Expected responsibilities:

- detect injected wallet availability
- connect and disconnect wallet
- expose account and current chain
- prompt chain switching when the DAO chain does not match the wallet chain
- provide signer/write client for propose, vote, delegate, queue, execute, cancel
- expose connection state globally so proposal and delegation pages do not each reinvent it

### Mode-specific behavior

Setup mode:

- no wallet connection prompt in the primary flow
- explain that a DAO must be configured before governance actions are available

Single-DAO mode:

- connect button should be global in the header
- all write flows use the deployment's configured DAO chain
- wrong-network prompts should refer to the DAO brand directly

Multi-DAO mode:

- connect button can still be global
- each DAO page determines the expected chain
- if different DAOs live on different chains, network switching should happen when entering a write flow for that DAO

### UX states

For each write-capable page, TSLO should render one of these states:

- wallet not connected
- wallet connected on wrong chain
- wallet connected on correct chain but action unsupported for this DAO
- wallet connected and action available
- transaction pending
- transaction confirmed
- transaction failed

### Caching and reads

Even with wallet support, reads should not depend on wallet connection.

Reads should use:

- public RPC clients
- local cache for DAO and proposal data
- wallet-specific reads only where needed for personalized state such as:
  - current delegation target
  - voting power for the connected account
  - whether the account has already voted

## Near-Term Implementation Sequence

1. Add a real TSLO config file and route-mode resolver.
2. Refactor routing so one-DAO installs omit DAO slug paths.
3. Add zero-DAO setup page and setup documentation page.
4. Replace the current wallet stub with a real shared wallet provider.
5. Introduce per-DAO chain checks and write-action gating.
6. Keep multi-DAO support working through slugged routes and directory search.

## Current Assumptions

- branded single-DAO deployments are the primary business model
- multi-DAO mode remains supported but secondary
- TSLO should still be able to run as a static or near-static site later
- wallet connection should be optional for reads and mandatory only for writes
- current fixture data and ENS support are transitional until config-driven data loading is implemented
