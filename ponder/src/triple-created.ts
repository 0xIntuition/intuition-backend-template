import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";
import { handleTriple } from "./atom-value/triple-handler";

ponder.on("EthMultiVault:TripleCreated", async ({ event, context }) => {
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

  const { Event, Account, Triple, Atom, Vault, Stats, StatsHour } = context.db;

  const { creator, vaultID, subjectId, predicateId, objectId } = event.args;

  const counterVaultId = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [vaultID],
    functionName: "getCounterIdFromTriple",
  });

  const currentSharePriceCounter = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [counterVaultId],
    functionName: "currentSharePrice",
  });
  await Vault.upsert({
    id: counterVaultId,
    create: {
      tripleId: vaultID,
      totalShares: 0n,
      positionCount: 0,
      currentSharePrice: currentSharePriceCounter,
    },
    update: {},
  });

  const currentSharePrice = await context.client.readContract({
    abi: context.contracts.EthMultiVault.abi,
    address: context.contracts.EthMultiVault.address,
    args: [vaultID],
    functionName: "currentSharePrice",
  });

  await Vault.upsert({
    id: vaultID,
    create: {
      tripleId: vaultID,
      totalShares: 0n,
      positionCount: 0,
      currentSharePrice,
    },
    update: {},
  });

  let newAccounts = 0;

  const creatorAccount = await Account.findUnique({
    id: creator,
  });

  if (creatorAccount === null) {
    const { name, image } = await getEns(creator);
    await Account.create({
      id: creator,
      data: {
        label: name || shortId(creator),
        image,
        type: "Default",
      },
    });
    newAccounts++;
  }



  const subject = await Atom.findUnique({ id: subjectId });
  const predicate = await Atom.findUnique({ id: predicateId });
  const object = await Atom.findUnique({ id: objectId });

  const label = `${subject?.label} ${predicate?.label} ${object?.label}`;

  const triple = await Triple.create({
    id: vaultID,
    data: {
      vaultId: vaultID,
      creatorId: creator,
      counterVaultId,
      subjectId,
      predicateId,
      objectId,
      label,
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
      totalTriples: 1,
      totalAccounts: newAccounts,
      totalSignals: 0,
      totalPositions: 0,
      totalFees: 0n,
      contractBalance,
    },
    update: ({ current }) => ({
      totalTriples: current.totalTriples + 1,
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
      type: "TripleCreated",
      tripleId: vaultID,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
    },
  });

  await handleTriple(context, triple);
});
