import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";
import { handleTriple } from "./atom-value/triple-handler";

ponder.on("EthMultiVault:TripleCreated", async ({ event, context }) => {

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
    id: creator.toLowerCase(),
  });

  if (creatorAccount === null) {
    const { name, image } = await getEns(creator);
    await Account.create({
      id: creator.toLowerCase(),
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
      creatorId: creator.toLowerCase(),
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

  const { id, ...stats } = await Stats.upsert({
    id: 0,
    create: {
      totalAtoms: 0,
      totalTriples: 1,
      totalAccounts: newAccounts,
      totalSignals: 0,
      totalPositions: 0,
      totalFees: 0n,
      contractBalance: 0n,
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
      transactionHash: event.transaction.hash,
    },
  });

  await handleTriple(context, triple);
});
