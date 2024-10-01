import { Context, Schema } from "@/generated";

export async function createThing(
  context: Context,
  atom: Schema["Atom"],
  obj: any,
) {
  const { Atom, AtomValue, Thing } = context.db;

  const thing = await Thing.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      name: obj.name,
      description: obj.description,
      image: obj.image,
      url: obj.url,
    },
  });

  const value = await AtomValue.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      thingId: thing.id,
    },
  });

  await Atom.update({
    id: atom.id,
    data: {
      emoji: '🧩',
      type: 'Thing',
      valueId: value.id,
      label: thing.name,
      image: thing.image,
    },
  });

}
