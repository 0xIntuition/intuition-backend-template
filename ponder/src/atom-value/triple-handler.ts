import { Context, Schema } from "@/generated";
import { Address } from "viem";

export async function handleTriple(context: Context, triple: Schema["Triple"]) {
  const { Account, Atom, Position, Claim } = context.db;

  // Because of race conditions, we need to make sure Claims are created for this Triple
  // This happens when a Triple is created with initialDeposit > 0
  const positions = await Position.findMany({
    where: {
      vaultId: triple.id,
    },
  });

  for (const position of positions.items) {
    await Claim.upsert({
      id: `${triple.id}-${position.accountId}`,
      create: {
        accountId: position.accountId,
        tripleId: triple.id,
        subjectId: triple.subjectId,
        predicateId: triple.predicateId,
        objectId: triple.objectId,
        label: triple.label,
        vaultId: triple.vaultId,
        counterVaultId: triple.counterVaultId,
        shares: position.shares,
        counterShares: 0n,
      },
      update: {},
    });
  }

  // Update Account data based on Triple
  const { subjectId, predicateId, objectId } = triple;

  const subject = await Atom.findUnique({ id: subjectId });
  const predicate = await Atom.findUnique({ id: predicateId });
  const object = await Atom.findUnique({ id: objectId });

  if (subject === null || predicate === null || object === null) {
    return;
  }

  if (subject.type === "Account") {
    if ((predicate.type === "PersonPredicate" && object.type === "Person")
      || (predicate.type === "OrganizationPredicate" && object.type === "Organization")) {
      await Account.update({
        id: subject.data.toLowerCase() as Address,
        data: {
          label: object.label,
          image: object.image,
        },
      });
    }
  }


}
