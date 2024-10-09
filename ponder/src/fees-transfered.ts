import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:FeesTransferred", async ({ event, context }) => {

  const { Event, Account, FeeTransfer, Stats, StatsHour } = context.db;

  const { amount, sender, protocolMultisig } = event.args;

  let newAccounts = 0;

  const senderAccount = await Account.findUnique({
    id: sender.toLowerCase(),
  });

  if (senderAccount === null) {
    const { name, image } = await getEns(sender);
    await Account.create({
      id: sender.toLowerCase(),
      data: {
        label: name || shortId(sender),
        image,
        type: "Default",
      },
    });
    newAccounts++;
  }

  await Account.upsert({
    id: protocolMultisig.toLowerCase(),
    create: {
      label: "Protocol Multisig",
      type: "ProtocolVault",
    },
    update: {}
  });

  await FeeTransfer.create({
    id: event.log.id,
    data: {
      senderId: sender.toLowerCase(),
      receiverId: protocolMultisig,
      amount,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });

  const { id, ...stats } = await Stats.upsert({
    id: 0,
    create: {
      totalAtoms: 0,
      totalTriples: 0,
      totalAccounts: newAccounts,
      totalSignals: 0,
      totalPositions: 0,
      totalFees: amount,
      contractBalance: 0n,
    },
    update: ({ current }) => ({
      totalFees: current.totalFees + amount,
      totalAccounts: current.totalAccounts + newAccounts,
    }),
  });

  await StatsHour.upsert({
    id: hourId(event.block.timestamp),
    create: stats,
    update: stats,
  });

  await Event.create({
    id: event.log.id,
    data: {
      type: "FeesTransfered",
      feeTransferId: event.log.id,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });
});
