import { ponder } from "@/generated";
import { getEns, hourId, shortId } from "./utils";
import { Address, fromHex } from "viem";
import { resolveAtomData } from "./atom-value/resolver";
import { getSupportedAtomMetadata } from "./atom-value/supported-types";

ponder.on("EthMultiVault:AtomCreated", async ({ event, context }) => {

  const { Event, Account, Atom, AtomValue, Vault, Stats, StatsHour } = context.db;

  const { creator, vaultID, atomData, atomWallet } = event.args;

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

  await Account.upsert({
    id: atomWallet.toLowerCase(),
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
      id: data.toLowerCase() as Address,
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
      creatorId: creator.toLowerCase(),
      walletId: atomWallet.toLowerCase(),
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
      contractBalance: 0n,
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
    id: atomWallet.toLowerCase(),
    data: {
      label: updatedAtom!.label,
      image: updatedAtom!.image,
    },
  });

});
