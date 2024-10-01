import { ponder } from "@/generated";
import { getAbsoluteTripleId, getEns, hourId, shortId } from "./utils";

ponder.on("EthMultiVault:Deposited", async ({ event, context }) => {

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
      timestamp: event.block.timestamp,
      ...event.log,
    },
    update: {},
  });

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

  // TODO: handle new accounts for receiver
  await Account.upsert({
    id: receiver,
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
      senderId: sender,
      receiverId: receiver,
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

  const positionId = `${vaultId}-${receiver}`;
  // Check if position exists
  const position = await Position.findUnique({
    id: positionId,
  });

  if (position === null && receiverTotalSharesInVault != 0n) {// todo: check if this is correct
    await Position.create({
      id: positionId,
      data: {
        accountId: receiver,
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
          accountId: receiver,
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
        accountId: sender,
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

  const contractBalance = await context.client.getBalance({
    address: context.contracts.EthMultiVault.address,
  });

  const { id, ...stats } = await Stats.upsert({
    id: 0,
    create: {
      totalAtoms: 0,
      totalAccounts: newAccounts,
      totalTriples: 0,
      totalSignals: newSignals,
      totalPositions: 1,
      totalFees: 0n,
      contractBalance,
    },
    update: ({ current }) => ({
      totalPositions: current.totalPositions + newPositions,
      totalSignals: current.totalSignals + newSignals,
      totalAccounts: current.totalAccounts + newAccounts,
      contractBalance,
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
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
    },
  });
});
