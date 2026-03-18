# components

Reusable UI building blocks for the governance frontend live here.

## Notable components

- `dao-overview.tsx`: DAO landing view, including live-load status messaging
- `proposal-detail.tsx`: proposal detail view for tallies, lifecycle, and calldata
- `proposal-card.tsx`: proposal list card used on DAO pages
- `dao-directory.tsx` and `dao-card.tsx`: multi-DAO directory UI
- `address-display.tsx`: reusable address renderer with ENS primary-name/avatar resolution, copy action, and explorer links
- `vote-onchain-button.tsx`: proposal-level write action for `castVote`
- `create-proposal-button.tsx`: DAO-level write action for `propose`

When component behavior changes, update this README if the component responsibilities or routing surface change materially.
