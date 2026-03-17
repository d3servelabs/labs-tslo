export type ProposalState =
  | "pending"
  | "active"
  | "succeeded"
  | "defeated"
  | "queued"
  | "executed"
  | "canceled"
  | "expired";

export type GovernanceCapability =
  | "propose"
  | "vote"
  | "delegate"
  | "queue"
  | "execute"
  | "cancel";

export interface ActionCall {
  target: string;
  value: string;
  signature: string;
  calldata: string;
  summary: string;
}

export interface VoteTally {
  for: number;
  against: number;
  abstain: number;
  quorum: number;
}

export interface TimelineStep {
  label: string;
  timestamp: string;
  complete: boolean;
  note: string;
}

export interface Proposal {
  id: string;
  title: string;
  slug: string;
  summary: string;
  state: ProposalState;
  proposer: string;
  createdAt: string;
  votingStartsAt: string;
  votingEndsAt: string;
  eta?: string;
  description: string;
  turnout: number;
  votes: VoteTally;
  actions: ActionCall[];
  timeline: TimelineStep[];
}

export interface DaoStats {
  totalProposals: number;
  activeProposals: number;
  delegates: number;
  tokenHolders: number;
  turnoutAverage: number;
}

export interface DaoLinks {
  website: string;
  forum: string;
  docs: string;
  treasury: string;
}

export interface DaoContracts {
  governor: string;
  token: string;
  timelock?: string;
}

export interface DaoConfig {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  chainId: number;
  chainName: string;
  governanceType: string;
  governanceVersion: string;
  brandColor: string;
  supportTier?: "trivial" | "moderate" | "advanced";
  supportNotes?: string;
  capabilityFlags: GovernanceCapability[];
  contracts: DaoContracts;
  links: DaoLinks;
  stats: DaoStats;
  delegates: Array<{
    address: string;
    ens?: string;
    votingPower: number;
    statement: string;
  }>;
  activity: Array<{
    label: string;
    timestamp: string;
    detail: string;
  }>;
  proposals: Proposal[];
}

export interface TsloDaoConfigInput {
  slug?: string;
  name: string;
  officialSiteUrl: string;
  forumUrl?: string;
  docsUrl?: string;
  treasuryUrl?: string;
  chainId: number;
  chainName: string;
  startBlock?: number;
  governorAddress: string;
  tokenAddress: string;
  timelockAddress?: string;
  branding?: {
    logoText?: string;
    accentColor?: string;
  };
}

export interface TsloConfig {
  siteName: string;
  repoUrl: string;
  docsUrl: string;
  daos: TsloDaoConfigInput[];
}
