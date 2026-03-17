import type { TsloConfig } from "@/lib/types";

const config: TsloConfig = {
  siteName: "ENS on TSLO",
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
      timelockAddress: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
      branding: {
        logoText: "ENS",
        accentColor: "#4f46e5"
      }
    }
  ]
};

export default config;
