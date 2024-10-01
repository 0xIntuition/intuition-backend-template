import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";
import { Address, fromHex } from "viem";
import { resolveAtomData } from "./atom-value/resolver";
import { getSupportedAtomMetadata } from "./atom-value/supported-types";

ponder.on("EthMultiVault:AtomCreated", async ({ event, context }) => {

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


  const { Event, Account, Atom, AtomValue, Vault, Stats, StatsHour } = context.db;

  const { creator, vaultID, atomData, atomWallet } = event.args;



  const contractBalance = await context.client.getBalance({
    address: context.contracts.EthMultiVault.address,
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
      atomId: vaultID,
      totalShares: 0n,
      currentSharePrice,
      positionCount: 0,
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

  await Account.upsert({
    id: atomWallet,
    create: {
      label: shortId(atomWallet),
      type: "AtomWallet",
    },
    update: {}
  });

  let valueId;
  const data = fromHex(atomData, "string").replace("\u0000", ""); 

  let atomImage = undefined;

  // Check if the data is from a set of known types
  let { type, label, emoji } = getSupportedAtomMetadata(data);

  // Create a new AtomValue if the type is Account
  if (type === "Account") {
    await AtomValue.create({
      id: vaultID,
      data: {
        atomId: vaultID,
        accountId: data as Address,
      }
    });
    valueId = vaultID;

    // FIXME: this can be optimized. We might be fetching this multiple times
    const { name, image } = await getEns(data as Address);
    if (name) {
      // atom.label = ens
      label = name;
    }
    if (image) {
      atomImage = image;
    }
    await Account.upsert({
      id: data as Address,
      create: {
        label: name || shortId(data as Address),
        image,
        type: "Default",
        atomId: vaultID,
      },
      update: {
        atomId: vaultID,
      },
    });
  }

  const atom = await Atom.create({
    id: vaultID,
    data: {
      vaultId: vaultID,
      creatorId: creator,
      walletId: atomWallet,
      data,
      type,
      valueId,
      label,
      emoji,
      image: atomImage,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    },
  });

  await Event.create({
    id: event.log.id,
    data: {
      type: "AtomCreated",
      atomId: vaultID,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
    },
  });

  const { id, ...stats } = await Stats.upsert({
    id: 0,
    create: {
      totalAtoms: 1,
      totalAccounts: newAccounts,
      totalTriples: 0,
      totalSignals: 0,
      totalPositions: 0,
      totalFees: 0n,
      contractBalance,
    },
    update: ({ current }) => ({
      totalAtoms: current.totalAtoms + 1,
      totalAccounts: current.totalAccounts + newAccounts,
    }),
  });

  await StatsHour.upsert({
    id: hourId(event.block.timestamp),
    create: stats,
    update: stats,
  });

  // If the type is unknown, try resolve the Atom data
  if (type === "Unknown") {
    await resolveAtomData(context, atom);
  }

  const updatedAtom = await Atom.findUnique({
    id: vaultID
  });

  await Account.update({
    id: atomWallet,
    data: {
      label: updatedAtom!.label,
      image: updatedAtom!.image,
    },
  });

});
