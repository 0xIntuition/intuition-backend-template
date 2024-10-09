import { ponder } from "@/generated";
import { getAbsoluteTripleId, getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:Redeemed", async ({ event, context }) => {

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
  }

  await Account.upsert({
    id: receiver.toLowerCase(),
    create: {
      label: shortId(receiver),
      type: "Default",
    },
    update: {}
  });

  await Redemption.create({
    id: event.log.id,
    data: {
      senderId: sender.toLowerCase(),
      receiverId: receiver.toLowerCase(),
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

  const positionId = `${vaultId}-${sender.toLowerCase()}`;
  let deletedPositions = 0;

  let stats;

  if (senderTotalSharesInVault === 0n) {
    await Position.delete({ id: positionId });

    deletedPositions = 1;

    const { id, ...statsData } = await Stats.update({
      id: 0,
      data: ({ current }) => ({
        totalPositions: current.totalPositions - 1,
        contractBalance: current.contractBalance - assetsForReceiver,
      }),
    });
    stats = statsData;
  } else {
    await Position.update({
      id: `${vaultId}-${sender.toLowerCase()}`,
      data: {
        shares: senderTotalSharesInVault,
      }
    });
    const { id, ...statsData } = await Stats.update({
      id: 0,
      data: ({ current }) => ({
        contractBalance: current.contractBalance - assetsForReceiver,
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
      accountId: sender.toLowerCase(),
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
      transactionHash: event.transaction.hash,
    },
  });
});
