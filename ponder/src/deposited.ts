import { ponder } from "@/generated";
import { getAbsoluteTripleId, getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:Deposited", async ({ event, context }) => {

  const { Event, Account, Deposit, Position, Vault, Signal, Stats, StatsHour } = context.db;

  const {
    sender,
    receiver,
    vaultId,
    entryFee,
    isTriple,
    isAtomWallet,
    sharesForReceiver,
    receiverTotalSharesInVault,
    senderAssetsAfterTotalFees,
  } = event.args;

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

  // TODO: handle new accounts for receiver
  await Account.upsert({
    id: receiver.toLowerCase(),
    create: {
      label: shortId(receiver),
      type: isAtomWallet ? "AtomWallet" : "Default",
    },
    update: {}
  });

  const currentSharePrice = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [vaultId],
    functionName: "currentSharePrice",
  });

  await Vault.upsert({
    id: vaultId,
    create: {
      totalShares: sharesForReceiver,
      currentSharePrice,
      positionCount: 0,
      atomId: isTriple ? undefined : vaultId,
      tripleId: isTriple ? getAbsoluteTripleId(vaultId) : undefined,
    },
    update: ({ current }) => ({
      totalShares: current.totalShares + sharesForReceiver,
      currentSharePrice,
      atomId: isTriple ? undefined : vaultId,
      tripleId: isTriple ? getAbsoluteTripleId(vaultId) : undefined,
    })
  });

  await Deposit.create({
    id: event.log.id,
    data: {
      senderId: sender.toLowerCase(),
      receiverId: receiver.toLowerCase(),
      vaultId,
      entryFee,
      isTriple,
      isAtomWallet,
      sharesForReceiver,
      receiverTotalSharesInVault,
      senderAssetsAfterTotalFees,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });


  let newPositions = 0;
  let newSignals = 0;

  const positionId = `${vaultId}-${receiver.toLowerCase()}`;
  // Check if position exists
  const position = await Position.findUnique({
    id: positionId,
  });

  if (position === null && receiverTotalSharesInVault != 0n) {// todo: check if this is correct
    await Position.create({
      id: positionId,
      data: {
        accountId: receiver.toLowerCase(),
        vaultId,
        shares: receiverTotalSharesInVault,
      }
    });
    newPositions = 1;
    await Vault.update({
      id: vaultId,
      data: ({ current }) => ({
        positionCount: current.positionCount + newPositions,
      })
    });
  } else {
    if (receiverTotalSharesInVault !== 0n) {
      await Position.upsert({
        id: positionId,
        create: {
          accountId: receiver.toLowerCase(),
          vaultId,
          shares: receiverTotalSharesInVault,
        },
        update: {
          shares: receiverTotalSharesInVault,
        }
      });
    }
  }

  const relativeStrength = 0n;

  if (senderAssetsAfterTotalFees > 0n) {

    await Signal.create({
      id: event.log.id,
      data: {
        accountId: sender.toLowerCase(),
        delta: senderAssetsAfterTotalFees,
        relativeStrength,
        atomId: isTriple ? undefined : vaultId,
        tripleId: isTriple ? getAbsoluteTripleId(vaultId) : undefined,
        depositId: event.log.id,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
      },
    });

    newSignals = 1;
  }

  const { id, ...stats } = await Stats.upsert({
    id: 0,
    create: {
      totalAtoms: 0,
      totalAccounts: newAccounts,
      totalTriples: 0,
      totalSignals: newSignals,
      totalPositions: 1,
      totalFees: 0n,
      contractBalance: 0n,
    },
    update: ({ current }) => ({
      totalPositions: current.totalPositions + newPositions,
      totalSignals: current.totalSignals + newSignals,
      totalAccounts: current.totalAccounts + newAccounts,
      contractBalance: current.contractBalance + senderAssetsAfterTotalFees,
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
      type: "Deposited",
      tripleId: isTriple ? vaultId : undefined,
      atomId: isTriple ? undefined : vaultId,
      depositId: event.log.id,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });
});
