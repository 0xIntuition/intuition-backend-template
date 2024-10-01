import { ponder } from "@/generated";
import { getAbsoluteTripleId, getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:Redeemed", async ({ event, context }) => {
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

  const { Event, Account, Redemption, Position, Vault, Signal, Stats, StatsHour } = context.db;

  const {
    sender,
    receiver,
    vaultId,
    senderTotalSharesInVault,
    sharesRedeemedBySender,
    assetsForReceiver,
    exitFee,
  } = event.args;

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
  }

  await Account.upsert({
    id: receiver,
    create: {
      label: shortId(receiver),
      type: "Default",
    },
    update: {}
  });

  await Redemption.create({
    id: event.log.id,
    data: {
      senderId: sender,
      receiverId: receiver,
      vaultId,
      sharesRedeemedBySender,
      assetsForReceiver,
      senderTotalSharesInVault,
      exitFee,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });

  const contractBalance = await context.client.getBalance({
    address: context.contracts.EthMultiVault.address,
  });

  const positionId = `${vaultId}-${sender}`;
  let deletedPositions = 0;

  let stats;

  if (senderTotalSharesInVault === 0n) {
    await Position.delete({ id: positionId });

    deletedPositions = 1;

    const { id, ...statsData } = await Stats.update({
      id: 0,
      data: ({ current }) => ({
        totalPositions: current.totalPositions - 1,
        contractBalance,
      }),
    });
    stats = statsData;
  } else {
    await Position.update({
      id: `${vaultId}-${sender}`,
      data: {
        shares: senderTotalSharesInVault,
      }
    });
    const { id, ...statsData } = await Stats.update({
      id: 0,
      data: () => ({
        contractBalance,
      }),
    });
    stats = statsData;
  }

  await StatsHour.upsert({
    id: hourId(event.block.timestamp),
    create: stats,
    update: stats,
  });

  const currentSharePrice = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [vaultId],
    functionName: "currentSharePrice",
  });

  const vault = await Vault.update({
    id: vaultId,
    data: ({ current }) => ({
      totalShares: current.totalShares - sharesRedeemedBySender,
      currentSharePrice,
      positionCount: current.positionCount - deletedPositions,
    })
  });

  const relativeStrength = 0n;

  await Signal.create({
    id: event.log.id,
    data: {
      accountId: sender,
      delta: assetsForReceiver * -1n,
      relativeStrength,
      atomId: vault.atomId,
      tripleId: vault.tripleId !== null && vault.tripleId !== undefined ? getAbsoluteTripleId(vault.tripleId) : undefined,
      redemptionId: event.log.id,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });

  await Event.create({
    id: event.log.id,
    data: {
      type: "Redeemed",
      redemptionId: event.log.id,
      atomId: vault.atomId,
      tripleId: vault.tripleId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
    },
  });
});
