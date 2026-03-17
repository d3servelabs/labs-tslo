import { DaoConfig } from "@/lib/types";

export const daos: DaoConfig[] = [
  {
    slug: "ens",
    name: "ENS DAO",
    shortName: "ENS",
    tagline: "Ethereum naming governed onchain by ENS token delegates.",
    description:
      "ENS DAO is a strong first compatibility target for TSLO because it runs on Ethereum mainnet with an OpenZeppelin Governor and a standard timelock-backed proposal lifecycle. It is one of the most prominent DAOs on Tally and its governance flows map closely to the MVP surface TSLO already targets.",
    chainId: 1,
    chainName: "Ethereum",
    governanceType: "OpenZeppelin Governor",
    governanceVersion: "ENS DAO Governor",
    brandColor: "#4f46e5",
    supportTier: "trivial",
    supportNotes:
      "Best first real DAO target. Standard Ethereum OZ Governor flow, single governance token, single timelock, and well-documented governance process.",
    capabilityFlags: ["propose", "vote", "delegate", "queue", "execute", "cancel"],
    contracts: {
      governor: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
      token: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      timelock: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7"
    },
    links: {
      website: "https://ens.domains",
      forum: "https://discuss.ens.domains",
      docs: "https://docs.ens.domains/dao",
      treasury: "https://etherscan.io/address/0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7"
    },
    stats: {
      totalProposals: 7,
      activeProposals: 1,
      delegates: 37597,
      tokenHolders: 100000,
      turnoutAverage: 99.1
    },
    delegates: [
      {
        address: "0x0A7E848Aca42d879EF06507Fca0E7b33A0a63c1e",
        ens: "nick.eth",
        votingPower: 1212000,
        statement: "Core ENS stewardship and protocol stability."
      },
      {
        address: "0x4F4b4fEf1D5647dFdA4bA7F0A0e4cB977f5C6d7E",
        ens: "serena.ens",
        votingPower: 824500,
        statement: "Meta-governance process and treasury accountability."
      },
      {
        address: "0x7b1B2D7B9D1f7F50A5f4E3C1dE7a8c87E6F12219",
        ens: "alisha.eth",
        votingPower: 603200,
        statement: "Working group effectiveness and ecosystem growth."
      }
    ],
    activity: [
      {
        label: "Proposal created",
        timestamp: "2026-03-02T15:10:00.000Z",
        detail: "EP 6.4 proposes treasury flow automation for operational funding."
      },
      {
        label: "Vote window opened",
        timestamp: "2026-03-03T15:10:00.000Z",
        detail: "Seven day executable voting period started."
      },
      {
        label: "Timelock pending",
        timestamp: "2026-03-12T17:45:00.000Z",
        detail: "Successful proposal queued in the ENS timelock."
      }
    ],
    proposals: [
      {
        id: "EP 6.4",
        title: "Treasury flow automation for ENS working group operations",
        slug: "treasury-flow-automation",
        summary:
          "Automate recurring operational treasury flows to reduce idle capital and repeated governance overhead.",
        state: "queued",
        proposer: "0x0A7E848Aca42d879EF06507Fca0E7b33A0a63c1e",
        createdAt: "2026-03-02T15:10:00.000Z",
        votingStartsAt: "2026-03-03T15:10:00.000Z",
        votingEndsAt: "2026-03-10T15:10:00.000Z",
        eta: "2026-03-14T15:10:00.000Z",
        description:
          "This proposal adds operational automation around ENS DAO treasury flows so approved budgets can move with less idle time sitting in timelock-controlled balances. It is representative of the kind of executable treasury management proposal TSLO must support well for major Ethereum DAOs.",
        turnout: 99.4,
        votes: {
          for: 1593021,
          against: 9067,
          abstain: 2843,
          quorum: 1000000
        },
        actions: [
          {
            target: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
            value: "0",
            signature: "setModuleApproval(address,bool)",
            calldata:
              "0x4a2f52f20000000000000000000000007c41b0b3bb8d4f7cd0f4b5dcfd1f4254d7b6f8a80000000000000000000000000000000000000000000000000000000000000001",
            summary: "Approve a treasury automation module under timelock control."
          }
        ],
        timeline: [
          {
            label: "Created",
            timestamp: "2026-03-02T15:10:00.000Z",
            complete: true,
            note: "Proposal threshold met by delegated ENS votes."
          },
          {
            label: "Voting opened",
            timestamp: "2026-03-03T15:10:00.000Z",
            complete: true,
            note: "ENS executable proposals use a seven day vote window."
          },
          {
            label: "Succeeded",
            timestamp: "2026-03-10T15:10:00.000Z",
            complete: true,
            note: "Proposal passed quorum and majority support."
          },
          {
            label: "Executable",
            timestamp: "2026-03-14T15:10:00.000Z",
            complete: false,
            note: "Ready after the ENS timelock delay elapses."
          }
        ]
      }
    ]
  },
  {
    slug: "arbor-collective",
    name: "Arbor Collective",
    shortName: "ARBOR",
    tagline: "Onchain stewardship for resilient digital commons.",
    description:
      "Arbor Collective uses OpenZeppelin Governor with a timelock and ERC20Votes token. TSLO indexes proposals, votes, delegates, and execution state to provide a familiar migration path away from Tally.",
    chainId: 1,
    chainName: "Ethereum",
    governanceType: "OpenZeppelin Governor",
    governanceVersion: "v5-compatible",
    brandColor: "#0f766e",
    supportTier: "trivial",
    supportNotes:
      "Synthetic sample DAO used to shape the MVP user experience around standard OZ Governor patterns.",
    capabilityFlags: ["propose", "vote", "delegate", "queue", "execute", "cancel"],
    contracts: {
      governor: "0x92A7B5B1d2E905F80c87dA3F944db0b1E44B1F20",
      token: "0x4A57cD5c7A089d0E4dfA2E7A772Afb4f134bf6F2",
      timelock: "0x8C6481b270C2301869A91c563fB44fB4A2e3e7D5"
    },
    links: {
      website: "https://example.org/arbor",
      forum: "https://forum.example.org/arbor",
      docs: "https://docs.example.org/arbor",
      treasury: "https://app.safe.global/home?safe=eth:0xD77b360A15431AaA5f6a4A36fc3D9C7827A4f948"
    },
    stats: {
      totalProposals: 18,
      activeProposals: 1,
      delegates: 42,
      tokenHolders: 684,
      turnoutAverage: 62.4
    },
    delegates: [
      {
        address: "0xa13E3A20B36eA9E99CB3Ac38393b86d747F35d0f",
        ens: "canopy.eth",
        votingPower: 183442,
        statement: "Long-term treasury stewardship and public goods focus."
      },
      {
        address: "0x95A7dEe5fd40F2f77c25c0E8c734f780E8A41a12",
        ens: "moss.eth",
        votingPower: 112083,
        statement: "Protocol operations and conservative execution standards."
      },
      {
        address: "0x2aF45771c887fF38c71e019fA86F8Eda97dd2f7D",
        votingPower: 96830,
        statement: "Treasury deployment with measurable program goals."
      }
    ],
    activity: [
      {
        label: "Proposal queued",
        timestamp: "2026-03-12T18:00:00.000Z",
        detail: "ARB-17 entered timelock after meeting quorum and majority thresholds."
      },
      {
        label: "Delegate change",
        timestamp: "2026-03-11T16:25:00.000Z",
        detail: "canopy.eth received 8,400 additional votes."
      },
      {
        label: "Proposal created",
        timestamp: "2026-03-09T14:40:00.000Z",
        detail: "ARB-18 proposes treasury diversification and grants budget renewal."
      }
    ],
    proposals: [
      {
        id: "ARB-18",
        title: "Renew grants budget and add ETH liquid reserve policy",
        slug: "renew-grants-budget",
        summary:
          "Allocate 1.5M ARBOR to the grants committee and codify a 12 month ETH reserve target.",
        state: "active",
        proposer: "0xa13E3A20B36eA9E99CB3Ac38393b86d747F35d0f",
        createdAt: "2026-03-09T14:40:00.000Z",
        votingStartsAt: "2026-03-10T14:40:00.000Z",
        votingEndsAt: "2026-03-17T14:40:00.000Z",
        description:
          "This proposal renews the Arbor Collective grants budget for the next operating cycle and establishes a treasury policy that preserves a twelve month ETH-denominated runway before additional diversification actions can be taken.",
        turnout: 68.1,
        votes: {
          for: 421320,
          against: 102144,
          abstain: 28531,
          quorum: 300000
        },
        actions: [
          {
            target: "0x7aB541Eab0a0214c64B9B91AcCbc3790Fe86B7E4",
            value: "0",
            signature: "setBudget(address,uint256)",
            calldata:
              "0xa3a8d9a90000000000000000000000008b4e3f8df0e3f7c18c6bbd3bc7ee3cb1f0b7e4b900000000000000000000000000000000000000000000000000000000016e3600",
            summary: "Set grants committee annual ARBOR budget to 1.5M tokens."
          },
          {
            target: "0x15dFf7E9E6Ac1278D5A50dfcAd940E2E72d522a7",
            value: "0",
            signature: "setMinEthRunway(uint256)",
            calldata:
              "0x0f53471f0000000000000000000000000000000000000000000000000000000000000168",
            summary: "Require 12 months of ETH-denominated treasury runway."
          }
        ],
        timeline: [
          {
            label: "Created",
            timestamp: "2026-03-09T14:40:00.000Z",
            complete: true,
            note: "Proposal threshold met by canopy.eth."
          },
          {
            label: "Voting opened",
            timestamp: "2026-03-10T14:40:00.000Z",
            complete: true,
            note: "Voting delay elapsed."
          },
          {
            label: "Voting closes",
            timestamp: "2026-03-17T14:40:00.000Z",
            complete: false,
            note: "Proposal remains active until the end block."
          },
          {
            label: "Timelock execution",
            timestamp: "Pending success",
            complete: false,
            note: "Queue becomes available if the vote succeeds."
          }
        ]
      },
      {
        id: "ARB-17",
        title: "Adopt stablecoin diversification mandate",
        slug: "stablecoin-diversification",
        summary:
          "Authorize treasury operations to rebalance 8 percent of assets into short-duration stablecoin yield strategies.",
        state: "queued",
        proposer: "0x95A7dEe5fd40F2f77c25c0E8c734f780E8A41a12",
        createdAt: "2026-03-01T09:20:00.000Z",
        votingStartsAt: "2026-03-02T09:20:00.000Z",
        votingEndsAt: "2026-03-09T09:20:00.000Z",
        eta: "2026-03-15T09:20:00.000Z",
        description:
          "This proposal authorizes treasury operations to rebalance a portion of idle assets into pre-approved short-duration strategies to reduce concentration risk while preserving governance-controlled withdrawal rights.",
        turnout: 71.8,
        votes: {
          for: 462003,
          against: 81321,
          abstain: 14720,
          quorum: 300000
        },
        actions: [
          {
            target: "0x90118C7C3ccA7D64aE09d7D73551Ac865E5AA94a",
            value: "0",
            signature: "setTreasuryPolicy(uint16,uint16)",
            calldata:
              "0xee3b45ab00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000032",
            summary: "Set diversification cap to 8% with 50 bps slippage control."
          }
        ],
        timeline: [
          {
            label: "Created",
            timestamp: "2026-03-01T09:20:00.000Z",
            complete: true,
            note: "Submitted by moss.eth."
          },
          {
            label: "Voting closed",
            timestamp: "2026-03-09T09:20:00.000Z",
            complete: true,
            note: "Succeeded with 83.1% support."
          },
          {
            label: "Queued",
            timestamp: "2026-03-12T18:00:00.000Z",
            complete: true,
            note: "Timelock delay in progress."
          },
          {
            label: "Executable",
            timestamp: "2026-03-15T09:20:00.000Z",
            complete: false,
            note: "Authorized executors can execute once delay elapses."
          }
        ]
      }
    ]
  }
];

export const ethereumDaoTargets = [
  {
    name: "ENS DAO",
    slug: "ens",
    chainName: "Ethereum",
    supportTier: "trivial" as const,
    reason: "OpenZeppelin Governor on Ethereum with standard token delegation and timelock execution."
  },
  {
    name: "Uniswap",
    chainName: "Ethereum",
    supportTier: "moderate" as const,
    reason: "Large, important target but Governor Bravo compatibility needs a separate adapter path."
  },
  {
    name: "Compound",
    chainName: "Ethereum",
    supportTier: "moderate" as const,
    reason: "Also Governor Bravo. Still supportable, but not as direct as ENS."
  },
  {
    name: "Gitcoin",
    chainName: "Ethereum",
    supportTier: "moderate" as const,
    reason: "Uses OZ-based governance but with more extension complexity than ENS."
  },
  {
    name: "Aave",
    chainName: "Ethereum",
    supportTier: "advanced" as const,
    reason: "Major DAO on Tally, but governance architecture is less attractive for the first compatibility target."
  }
] as const;

export function getDaos() {
  return daos;
}

export function getDaoBySlug(slug: string) {
  return daos.find((dao) => dao.slug === slug);
}

export function getProposalById(slug: string, proposalId: string) {
  const dao = getDaoBySlug(slug);
  return dao?.proposals.find(
    (proposal) =>
      proposal.id.toLowerCase() === proposalId.toLowerCase() ||
      proposal.slug.toLowerCase() === proposalId.toLowerCase()
  );
}
