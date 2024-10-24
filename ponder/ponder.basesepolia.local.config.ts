import { createConfig } from "@ponder/core";
import { http } from "viem";

import { EthMultiVaultAbi } from "./abis/EthMultiVaultAbi";

export default createConfig({
  database: {
    kind: "postgres",
    schema: "public",
  },
  networks: {
    basesepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    EthMultiVault: {
      network: "basesepolia",
      abi: EthMultiVaultAbi,
      address: "0x1A6950807E33d5bC9975067e6D6b5Ea4cD661665",
      startBlock: 12947309,
      endBlock: 13660334,
    },
  },
  blocks: {
    ChainlinkPriceOracle: {
      network: "base",
      startBlock: 18786903,
      endBlock: 18786993,
      interval: 30 * 60,
    },
  },
});
