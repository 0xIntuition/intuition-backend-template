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
    local: {
      chainId: 1337,
      transport: http("http://localhost:8545"),
    },
  },
  contracts: {
    EthMultiVault: {
      network: "local",
      abi: EthMultiVaultAbi,
      address: "0x04056c43d0498b22f7a0c60d4c3584fb5fa881cc",
      startBlock: 1,
    },
  },
  blocks: {
    ChainlinkPriceOracle: {
      network: "base",
      startBlock: 18786903,
      endBlock: 18786933,
      interval: 30 * 60,
    },
  },
});
