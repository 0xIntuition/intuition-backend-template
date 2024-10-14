import { ponder } from "@/generated";
import { getAbsoluteTripleId, getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:Redeemed", async ({ event, context }) => {

  const { Event, Account, Redemption, Position, PredicateObject, Claim, Triple, Vault, Signal, Stats, StatsHour } = context.db;

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

  const currentSharePrice = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [vaultId],
    functionName: "currentSharePrice",
  });

  const vault = await Vault.findUnique({
    id: vaultId,
  });
  if (vault === null) {
    return;
  }

  let triple;

  if (vault.tripleId) {
    triple = await Triple.findUnique({
      id: vault.tripleId,
    });
  }

  const positionId = `${vaultId}-${sender.toLowerCase()}`;
  let deletedPositions = 0;

  let stats;

  if (senderTotalSharesInVault === 0n) {
    await Position.delete({ id: positionId });

    if (triple) {
      const claimId = `${triple.id}-${sender.toLowerCase()}`;
      await Claim.delete({ id: claimId });
      await PredicateObject.update({
        id: `${triple.predicateId}-${triple.objectId}`,
        data: ({ current }) => ({
          claimCount: current.claimCount - 1,
        }),
      });
    }

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

    if (triple) {
      await Claim.update({
        id: `${triple.id}-${sender.toLowerCase()}`,
        data: ({ current }) => ({
          shares: vault.id === triple.vaultId ? senderTotalSharesInVault : current.shares,
          counterShares: vault.id === triple.counterVaultId ? senderTotalSharesInVault : current.counterShares,
        }),
      });
    }

    const { id, ...statsData } = await Stats.update({
      id: 0,
      data: ({ current }) => ({
        contractBalance: current.contractBalance - assetsForReceiver,
      }),
    });
    stats = statsData;
  }

  await Vault.update({
    id: vaultId,
    data: ({ current }) => ({
      totalShares: current.totalShares - sharesRedeemedBySender,
      currentSharePrice,
      positionCount: current.positionCount - deletedPositions,
    })
  });


  await StatsHour.upsert({
    id: hourId(event.block.timestamp),
    create: stats,
    update: stats,
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
