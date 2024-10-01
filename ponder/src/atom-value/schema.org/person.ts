import { Context, Schema } from "@/generated";

export async function createPerson(
  context: Context,
  atom: Schema["Atom"],
  obj: any,
) {
  const { Atom, AtomValue, Person } = context.db;

  const person = await Person.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      identifier: obj.identifier,
      name: obj.name,
      description: obj.description,
      image: obj.image,
      url: obj.url,
      email: obj.email,
    },
  });

  const value = await AtomValue.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      personId: person.id,
    },
  });

  await Atom.update({
    id: atom.id,
    data: {
      emoji: '👤',
      type: 'Person',
      valueId: value.id,
      label: person.name,
      image: person.image,
    },
  });

}
