import type { TsloConfig } from "@/lib/types";

const config: TsloConfig = {
  siteName: "TSLO Network",
  repoUrl: "https://github.com/d3servelabs/labs-tslo",
  docsUrl: "https://github.com/d3servelabs/labs-tslo/blob/main/docs/plan.md",
  daos: [
    {
      slug: "ens",
      name: "ENS DAO",
      officialSiteUrl: "https://ens.domains",
      forumUrl: "https://discuss.ens.domains",
      docsUrl: "https://docs.ens.domains/dao",
      treasuryUrl: "https://etherscan.io/address/0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
      chainId: 1,
      chainName: "Ethereum",
      startBlock: 13600000,
      governorAddress: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
      tokenAddress: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      timelockAddress: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7"
    },
    {
      slug: "arbitrum",
      name: "Arbitrum DAO",
      officialSiteUrl: "https://arbitrum.foundation",
      forumUrl: "https://forum.arbitrum.foundation",
      docsUrl: "https://docs.arbitrum.foundation",
      chainId: 1,
      chainName: "Ethereum",
      startBlock: 16000000,
      governorAddress: "0x789fE9E4D5A4df9bF65a1f7d3F7A2A4C7b8D12Ef",
      tokenAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      timelockAddress: "0x4c6f947Ae67F572A51c9f3dA0411cD4D7d1C7A85"
    },
    {
      slug: "uniswap",
      name: "Uniswap DAO",
      officialSiteUrl: "https://uniswap.org",
      forumUrl: "https://gov.uniswap.org",
      docsUrl: "https://docs.uniswap.org",
      chainId: 1,
      chainName: "Ethereum",
      startBlock: 10800000,
      governorAddress: "0x408ED6354d4977619244eB7b866A22Ff6F1A7B2A",
      tokenAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      timelockAddress: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC"
    }
  ]
};

export default config;
