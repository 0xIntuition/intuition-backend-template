import { Context, Schema } from "@/generated";
import { Address } from "viem";

export async function handleTriple(context: Context, triple: Schema["Triple"]) {
  const { Account, Atom } = context.db;

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
        id: subject.data as Address,
        data: {
          label: object.label,
          image: object.image,
        },
      });
    }
  }
}
