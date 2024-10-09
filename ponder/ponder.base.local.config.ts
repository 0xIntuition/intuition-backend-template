import { createConfig } from "@ponder/core";
import { http } from "viem";

import { EthMultiVaultAbi } from "./abis/EthMultiVaultAbi";

export default createConfig({
  database: {
    kind: "postgres",
    schema: "public",
  },
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    EthMultiVault: {
      network: "base",
      abi: EthMultiVaultAbi,
      address: "0x430BbF52503Bd4801E51182f4cB9f8F534225DE5",
      startBlock: 18528268,
      endBlock: 18528268 + (30 * 60 * 24 * 5),
    },
  },
  blocks: {
    ChainlinkPriceOracle: {
      network: "base",
      startBlock: 18715850,
      endBlock: 18715850,
      interval: 30 * 60,
    },
  },
});
