import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:FeesTransferred", async ({ event, context }) => {
  const { Block, Transaction, Log } = context.db;

  await Block.upsert({
    id: event.block.hash,
    create: {
      ...event.block,
      baseFeePerGas: event.block.baseFeePerGas !== null ? event.block.baseFeePerGas : undefined,
      totalDifficulty: event.block.totalDifficulty !== null ? event.block.totalDifficulty : undefined,
      difficulty: event.block.difficulty !== null ? event.block.difficulty : undefined,
      mixHash: event.block.mixHash !== null ? event.block.mixHash : undefined,
      nonce: event.block.nonce !== null ? event.block.nonce : undefined,
      sha3Uncles: event.block.sha3Uncles !== null ? event.block.sha3Uncles : undefined,
    },
    update: {},
  });

  await Transaction.upsert({
    id: event.transaction.hash,
    create: {
      ...event.transaction,
      timestamp: event.block.timestamp,
      to: event.transaction.to !== null ? event.transaction.to : undefined,
      gas: event.transaction.gas !== null ? event.transaction.gas : undefined,
      gasPrice: event.transaction.gasPrice !== null ? event.transaction.gasPrice : undefined,
      r: event.transaction.r !== null ? event.transaction.r : undefined,
      s: event.transaction.s !== null ? event.transaction.s : undefined,
      v: event.transaction.v !== null ? event.transaction.v : undefined,
    },
    update: {},
  });

  await Log.upsert({
    id: event.log.id,
    create: {
      ...event.log,
      timestamp: event.block.timestamp,
    },
    update: {},
  });

  const { Event, Account, FeeTransfer, Stats, StatsHour } = context.db;

  const { amount, sender, protocolMultisig } = event.args;

  let newAccounts = 0;

  const senderAccount = await Account.findUnique({
    id: sender,
  });

  if (senderAccount === null) {
    const { name, image } = await getEns(sender);
    await Account.create({
      id: sender,
      data: {
        label: name || shortId(sender),
        image,
        type: "Default",
      },
    });
    newAccounts++;
  }

  await Account.upsert({
    id: protocolMultisig,
    create: {
      label: "Protocol Multisig",
      type: "ProtocolVault",
    },
    update: {}
  });

  await FeeTransfer.create({
    id: event.log.id,
    data: {
      senderId: sender,
      receiverId: protocolMultisig,
      amount,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });

  const contractBalance = await context.client.getBalance({
    address: context.contracts.EthMultiVault.address,
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
      contractBalance,
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
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
    },
  });
});
