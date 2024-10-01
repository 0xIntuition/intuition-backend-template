import { ponder } from "@/generated";
import { parseAbi } from "viem";

ponder.on("ChainlinkPriceOracle:block", async ({ event, context }) => {
  const price = await context.client.readContract({
    address: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    abi: parseAbi(["function latestAnswer() external view returns (int256)"]),
    functionName: "latestAnswer",
  });

  await context.db.ChainlinkPrice.create({
    id: event.block.timestamp,
    data: {
      usd: Number(price) / 10 ** 8,
    },
  });
});

