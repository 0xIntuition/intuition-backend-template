import { Context, Schema } from "@/generated";
import { createThing } from "./thing";
import { createPerson } from "./person";
import { createOrganization } from "./organization";
import { createBook } from "./book";

export async function resolveSchemaOrgProperties(
  context: Context,
  atom: Schema["Atom"],
  obj: any,
) {
  const type = obj['@type']
  if (type) {
    if (type == 'Thing') {
      await createThing(context, atom, obj)
    }
    if (type == 'Person') {
      await createPerson(context, atom, obj)
    }
    if (type == 'Organization') {
      await createOrganization(context, atom, obj)
    }
    if (type == 'Book') {
      await createBook(context, atom, obj)
    }
  }
}
